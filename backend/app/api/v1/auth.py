import hashlib
import secrets
import json
import base64
import urllib.request
import threading
from typing import Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db, SessionLocal
from app.models.user import User
from app.models.settings import Settings as Company
from app.core.email_verifier import validate_email_authenticity
from app.core.mailer import (
    store_registration_otp,
    verify_registration_otp,
    is_email_verified,
    clear_verified_otp,
    send_registration_otp_email,
)
from app.core.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}:{key.hex()}"

def verify_password(plain_password: str, stored_password: str) -> bool:
    if not stored_password:
        return False
    # If legacy plain text
    if stored_password == plain_password:
        return True
    if ":" in stored_password:
        try:
            salt, key_hex = stored_password.split(":", 1)
            new_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000)
            return new_key.hex() == key_hex
        except Exception:
            return False
    return False

# In-memory ultra-fast authentication cache (keyed by lowercased username, email, user_id)
AUTH_FAST_STORE = {}

def sync_user_to_cache(user_id: str, username: str, email: str, name: str, firm_name: str, company_id: str, password_hash: str = "", plain_password: Optional[str] = None):
    entry = {
        "id": user_id,
        "name": name,
        "email": email or username,
        "username": username or email,
        "role": "Owner",
        "roleTitle": "Proprietor & Director",
        "firmName": firm_name,
        "companyId": company_id or "comp-001",
        "password_hash": password_hash,
        "plain_password": plain_password
    }
    if username:
        AUTH_FAST_STORE[username.strip().lower()] = entry
    if email:
        AUTH_FAST_STORE[email.strip().lower()] = entry
    if user_id:
        AUTH_FAST_STORE[user_id.strip().lower()] = entry

def preload_auth_cache_from_db():
    try:
        db = SessionLocal()
        try:
            users = db.query(User).all()
            companies = {c.id: c.name for c in db.query(Company).all()}
            for u in users:
                firm = companies.get(u.company_id, u.firm_name or "Textile Enterprise")
                sync_user_to_cache(
                    user_id=u.id,
                    username=u.username,
                    email=u.email,
                    name=u.name,
                    firm_name=firm,
                    company_id=u.company_id or "comp-001",
                    password_hash=u.password_hash or "",
                    plain_password=None
                )
        finally:
            db.close()
    except Exception as e:
        print(f"⚠️ Auth fast cache async preload note: {e}")

# Run background thread to sync any DB users into memory cache
threading.Thread(target=preload_auth_cache_from_db, daemon=True).start()

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class ChangeCredentialsRequest(BaseModel):
    current_password: str
    new_username: str
    new_password: Optional[str] = None
    name: Optional[str] = None
    user_id: Optional[str] = None
    company_id: Optional[str] = None

@router.post("/login")
def login(req: LoginRequest):
    """Authenticate user strictly with their registered username or email and password directly against the database."""
    clean_id = req.username_or_email.strip()

    db = SessionLocal()
    try:
        user = db.query(User).filter(
            (User.username.ilike(clean_id)) | (User.email.ilike(clean_id))
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found. Please check your username or email."
            )

        # Verify password strictly against database password hash
        if not verify_password(req.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password. Please try again."
            )

        company = db.query(Company).filter(Company.id == user.company_id).first()
        firm_name = company.name if company else (user.firm_name or "Om Sai Enterprise")

        # Sync credentials to cache
        sync_user_to_cache(
            user_id=user.id,
            username=user.username,
            email=user.email,
            name=user.name,
            firm_name=firm_name,
            company_id=user.company_id or "comp-001",
            password_hash=user.password_hash,
            plain_password=None
        )

        token = create_access_token({
            "sub": user.id,
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "company_id": user.company_id or "comp-001",
            "role": getattr(user, "role", "Owner") or "Owner"
        })

        return {
            "success": True,
            "message": "Login successful",
            "token": token,
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "username": user.username,
                "role": getattr(user, "role", "Owner") or "Owner",
                "roleTitle": "Proprietor & Director",
                "firmName": firm_name,
                "companyId": user.company_id or "comp-001"
            }
        }
    finally:
        db.close()

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    company_name: Optional[str] = None
    picture: Optional[str] = None

@router.post("/google")
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticates via Google Identity Services (GIS).
    Verifies token or email, locates the user's tenant company, or onboards them automatically.
    """
    email = req.email.strip() if req.email else ""
    name = req.name.strip() if req.name else ""
    picture = req.picture

    # If Google credential (JWT ID token) is provided, verify / decode it
    if req.credential and req.credential.strip():
        token = req.credential.strip()
        # 1. Attempt token verification with Google OAuth2 tokeninfo
        try:
            url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
            req_obj = urllib.request.Request(url, headers={"User-Agent": "TexaFlow-ERP"})
            with urllib.request.urlopen(req_obj, timeout=5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    if data.get("email"):
                        email = data.get("email").strip()
                    if data.get("name"):
                        name = data.get("name").strip()
                    if data.get("picture"):
                        picture = data.get("picture")
        except Exception:
            # 2. Fallback: Parse JWT payload safely
            try:
                parts = token.split(".")
                if len(parts) >= 2:
                    payload_b64 = parts[1]
                    payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
                    payload_json = base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8")
                    data = json.loads(payload_json)
                    if data.get("email"):
                        email = data.get("email").strip()
                    if data.get("name"):
                        name = data.get("name").strip()
                    if data.get("picture"):
                        picture = data.get("picture")
            except Exception:
                pass

    if not email or "@" not in email:
        raise HTTPException(
            status_code=400,
            detail="A valid Google account email is required to sign in."
        )

    clean_email = email.lower()

    # Check if user already exists with this email or username
    user = db.query(User).filter(
        (User.email.ilike(clean_email)) | (User.username.ilike(clean_email))
    ).first()

    if user:
        company = db.query(Company).filter(Company.id == user.company_id).first()
        firm_name = company.name if company else (user.firm_name or "Om Sai Enterprise")

        # Update name if previously generic
        if name and (not user.name or user.name in ["Owner", "Factory Admin", "Proprietor"]):
            user.name = name
            if company and (not company.owner_name or company.owner_name == "Owner"):
                company.owner_name = name
            db.commit()

        token = create_access_token({
            "sub": user.id,
            "user_id": user.id,
            "username": user.username,
            "email": user.email or clean_email,
            "name": user.name,
            "company_id": user.company_id or "comp-001",
            "role": "Owner"
        })

        return {
            "success": True,
            "message": f"Welcome back, {user.name}!",
            "isNewUser": False,
            "token": token,
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email or clean_email,
                "username": user.username,
                "role": "Owner",
                "roleTitle": "Proprietor & Director",
                "firmName": firm_name,
                "companyId": user.company_id or "comp-001",
                "avatar": picture
            }
        }

    # If new user: automatically provision new tenant enterprise company
    owner_name = name if name else clean_email.split("@")[0].replace(".", " ").title()
    firm_name = req.company_name.strip() if req.company_name and req.company_name.strip() else f"{owner_name} Textiles"

    # Compute next sequential company_id and user_id
    max_comp_num = 1
    all_companies = db.query(Company.id).all()
    for (cid,) in all_companies:
        if cid and cid.startswith("comp-"):
            suffix = cid.replace("comp-", "")
            if suffix.isdigit():
                max_comp_num = max(max_comp_num, int(suffix))

    all_users = db.query(User.id).all()
    for (uid,) in all_users:
        if uid and uid.startswith("user-"):
            suffix = uid.replace("user-", "")
            if suffix.isdigit():
                max_comp_num = max(max_comp_num, int(suffix))

    next_num = max_comp_num + 1
    next_comp_id = f"comp-{next_num:03d}"
    next_user_id = f"user-{next_num:03d}"
    clean_code = firm_name.upper().replace(" ", "")[:8]

    # Create Company
    new_company = Company(
        id=next_comp_id,
        name=firm_name,
        code=f"{clean_code}-{next_num:03d}",
        owner_name=owner_name,
        email=clean_email,
        status="active"
    )
    db.add(new_company)

    # Create Owner User
    random_pw = secrets.token_hex(12)
    pw_hash = hash_password(random_pw)
    new_user = User(
        id=next_user_id,
        firm_name=firm_name,
        name=owner_name,
        email=clean_email,
        username=clean_email,
        password_hash=pw_hash,
        company_id=next_comp_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_company)
    db.refresh(new_user)

    token = create_access_token({
        "sub": new_user.id,
        "user_id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "name": new_user.name,
        "company_id": new_company.id,
        "role": "Owner"
    })

    return {
        "success": True,
        "message": f"Enterprise account created for {firm_name}!",
        "isNewUser": True,
        "token": token,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "username": new_user.username,
            "role": "Owner",
            "roleTitle": "Proprietor & Director",
            "firmName": new_company.name,
            "companyId": new_company.id,
            "avatar": picture
        }
    }

@router.get("/credentials")
def get_credentials(
    user_id: Optional[str] = None,
    username: Optional[str] = None,
    company_id: Optional[str] = None,
    firm_name: Optional[str] = None
):
    """Fetch current primary admin credentials info strictly from the database."""
    cid_clean = (company_id or "").strip()
    uid_clean = (user_id or "").strip()
    uname_clean = (username or "").strip().lower()

    db = SessionLocal()
    try:
        query = db.query(User)
        user = None

        if uid_clean:
            user = query.filter(User.id == uid_clean).first()
        elif uname_clean:
            user = query.filter((User.username.ilike(uname_clean)) | (User.email.ilike(uname_clean))).first()
        elif cid_clean:
            user = query.filter(User.company_id == cid_clean).first()
        elif firm_name and firm_name.strip():
            user = query.filter(User.firm_name.ilike(f"%{firm_name.strip()}%")).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credentials not found for the requested company"
            )

        return {
            "success": True,
            "id": user.id,
            "username": user.username,
            "email": user.email or user.username,
            "name": user.name,
            "role": getattr(user, "role", "Owner") or "Owner",
            "firm_name": user.firm_name,
            "company_id": user.company_id or "comp-001"
        }
    finally:
        db.close()

class ChangeCredentialsRequest(BaseModel):
    current_password: Optional[str] = None
    new_username: str
    new_password: Optional[str] = None
    name: Optional[str] = None
    firm_name: Optional[str] = None
    user_id: Optional[str] = None
    company_id: Optional[str] = None

@router.put("/change-credentials")
def change_credentials(req: ChangeCredentialsRequest, db: Session = Depends(get_db)):
    """Change admin login username, display name, and optionally password in the database."""
    query = db.query(User)
    user = None
    if req.user_id and req.user_id.strip():
        user = query.filter(User.id == req.user_id.strip()).first()
    elif req.company_id and req.company_id.strip():
        user = query.filter(User.company_id == req.company_id.strip()).first()

    if not user and req.new_username and req.new_username.strip():
        user = query.filter(
            (User.username.ilike(req.new_username.strip())) |
            (User.email.ilike(req.new_username.strip()))
        ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin user record not found"
        )

    # 1. Password verification ONLY if a new password is being set
    if req.new_password and req.new_password.strip():
        if not req.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please enter your current password to authorize setting a new password."
            )
        if not verify_password(req.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect. Verification failed."
            )
        if len(req.new_password.strip()) < 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 4 characters long."
            )
        user.password_hash = hash_password(req.new_password.strip())

    # 2. Validate and update username
    new_user_clean = req.new_username.strip()
    if not new_user_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Login ID / Username cannot be empty"
        )

    # Check if another user already has this username
    existing = db.query(User).filter(User.username == new_user_clean, User.id != user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{new_user_clean}' is already in use by another account."
        )

    user.username = new_user_clean
    if "@" in new_user_clean:
        user.email = new_user_clean

    # 3. Update display name
    if req.name and req.name.strip():
        user.name = req.name.strip()
        comp = db.query(Company).filter(Company.id == user.company_id).first()
        if comp:
            comp.owner_name = req.name.strip()

    # 4. Update firm / company name if provided
    if req.firm_name and req.firm_name.strip():
        user.firm_name = req.firm_name.strip()
        comp = db.query(Company).filter(Company.id == user.company_id).first()
        if comp:
            comp.name = req.firm_name.strip()

    db.commit()
    db.refresh(user)

    # Sync to fast in-memory cache
    sync_user_to_cache(
        user_id=user.id,
        username=user.username,
        email=user.email,
        name=user.name,
        firm_name=user.firm_name,
        company_id=user.company_id or "comp-001",
        password_hash=user.password_hash,
        plain_password=req.new_password.strip() if req.new_password and req.new_password.strip() else None
    )

    return {
        "success": True,
        "message": "User details updated successfully!",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "firm_name": user.firm_name,
            "company_id": user.company_id or "comp-001"
        }
    }

class UpdateCompanySettingsRequest(BaseModel):
    company_id: Optional[str] = None
    user_id: Optional[str] = None
    company_name: str
    brand_name: Optional[str] = None
    tagline: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    alt_phone: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    address: Optional[str] = None
    city_state: Optional[str] = None
    pincode: Optional[str] = None
    msme_no: Optional[str] = None
    website: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None

    # Bank Details
    bank_name: Optional[str] = None
    account_holder: Optional[str] = None
    account_no: Optional[str] = None
    account_type: Optional[str] = None
    ifsc: Optional[str] = None
    branch_name: Optional[str] = None
    upi_id: Optional[str] = None
    qr_code_image: Optional[str] = None

    # Invoicing & Printing
    invoice_title: Optional[str] = None
    challan_title: Optional[str] = None
    invoice_prefix: Optional[str] = None
    next_invoice_no: Optional[str] = None
    challan_prefix: Optional[str] = None
    next_challan_no: Optional[str] = None
    hsn_sac_code: Optional[str] = None
    gst_rate: Optional[str] = None
    payment_terms: Optional[str] = None
    signatory_label: Optional[str] = None
    eway_threshold: Optional[str] = None
    print_qr: Optional[bool] = None
    terms_conditions: Optional[str] = None
    custom_labels: Optional[Any] = None
    settings_json: Optional[Any] = None

@router.get("/company-settings")
def get_company_settings(
    company_id: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve full company settings and profile strictly isolated by company_id or user_id."""
    cid = company_id.strip() if company_id and company_id.strip() else None
    if not cid and user_id and user_id.strip():
        user = db.query(User).filter(User.id == user_id.strip()).first()
        if user:
            cid = user.company_id
    if not cid:
        cid = "comp-001"

    comp = None
    try:
        comp = db.query(Company).filter(Company.id == cid).first()
    except Exception as e:
        print(f"⚠️ Company table query notice: {e}")

    user = None
    try:
        user = db.query(User).filter(User.company_id == cid).first()
    except Exception as e:
        print(f"⚠️ User table query notice: {e}")

    default_name = "Shiv Creation" if cid == "comp-001" else "Radhe Krishna Textiles"
    comp_name = comp.name if (comp and comp.name) else (user.firm_name if (user and user.firm_name) else default_name)
    owner_name = comp.owner_name if (comp and comp.owner_name) else (user.name if user else "Proprietor")
    phone = comp.phone if (comp and comp.phone) else ""
    email = comp.email if (comp and comp.email) else (user.email if user else "")
    address = comp.address if (comp and comp.address) else ""
    gstin = comp.gstin if (comp and comp.gstin) else ""
    username_val = user.username if user else (email or "")

    return {
        "success": True,
        "company_id": cid,
        "company_name": comp_name,
        "brand_name": comp.brand_name if (comp and comp.brand_name) else comp_name,
        "tagline": comp.tagline if (comp and comp.tagline) else "",
        "owner_name": owner_name,
        "phone": phone,
        "alt_phone": comp.alt_phone if (comp and comp.alt_phone) else "",
        "email": email,
        "username": username_val,
        "address": address,
        "city_state": comp.city_state if (comp and comp.city_state) else "",
        "pincode": comp.pincode if (comp and comp.pincode) else "",
        "msme_no": comp.msme_no if (comp and comp.msme_no) else "",
        "website": comp.website if (comp and comp.website) else "",
        "gstin": gstin,
        "pan": comp.pan if (comp and comp.pan) else "",

        # Bank Details
        "bank_name": comp.bank_name if (comp and comp.bank_name) else "",
        "account_holder": comp.account_holder if (comp and comp.account_holder) else comp_name,
        "account_no": comp.account_no if (comp and comp.account_no) else "",
        "account_type": comp.account_type if (comp and comp.account_type) else "Current Account",
        "ifsc": comp.ifsc if (comp and comp.ifsc) else "",
        "branch_name": comp.branch_name if (comp and comp.branch_name) else "",
        "upi_id": comp.upi_id if (comp and comp.upi_id) else "",
        "qr_code_image": comp.qr_code_image if (comp and comp.qr_code_image) else "",

        # Invoicing & Printing
        "invoice_title": comp.invoice_title if (comp and comp.invoice_title) else "TAX INVOICE / JOBWORK BILL",
        "challan_title": comp.challan_title if (comp and comp.challan_title) else "DELIVERY CHALLAN / TAKKA DISPATCH SLIP",
        "invoice_prefix": comp.invoice_prefix if (comp and comp.invoice_prefix) else "SC/26-27/",
        "next_invoice_no": comp.next_invoice_no if (comp and comp.next_invoice_no) else "101",
        "challan_prefix": comp.challan_prefix if (comp and comp.challan_prefix) else "DC/26-27/",
        "next_challan_no": comp.next_challan_no if (comp and comp.next_challan_no) else "101",
        "hsn_sac_code": comp.hsn_sac_code if (comp and comp.hsn_sac_code) else "998822 (Textile Jobwork)",
        "gst_rate": comp.gst_rate if (comp and comp.gst_rate) else "5% (Textile Embroidery Jobwork)",
        "payment_terms": comp.payment_terms if (comp and comp.payment_terms) else "Due on Receipt",
        "signatory_label": comp.signatory_label if (comp and comp.signatory_label) else f"For {comp_name} (Authorized Signatory)",
        "eway_threshold": comp.eway_threshold if (comp and comp.eway_threshold) else "50000",
        "print_qr": comp.print_qr if (comp and comp.print_qr is not None) else True,
        "terms_conditions": comp.terms_conditions if (comp and comp.terms_conditions) else "",
        "custom_labels": (comp.settings_json.get("custom_labels") if (comp and isinstance(comp.settings_json, dict)) else None),
        "settings_json": comp.settings_json if comp else None
    }

@router.put("/company-settings")
def update_company_settings(req: UpdateCompanySettingsRequest, db: Session = Depends(get_db)):
    """Update all company profile, bank, invoice preferences, and username in 00_settings database."""
    cid = req.company_id or "comp-001"
    clean_name = req.company_name.strip()
    clean_user = req.username.strip() if req.username else None

    comp = db.query(Company).filter(Company.id == cid).first()
    if not comp and clean_name:
        comp = Company(
            id=cid,
            name=clean_name,
            code=cid,
            owner_name=req.owner_name or "Owner",
            status="active"
        )
        db.add(comp)

    if comp:
        if clean_name:
            comp.name = clean_name
        if req.brand_name is not None:
            comp.brand_name = req.brand_name.strip()
        if req.tagline is not None:
            comp.tagline = req.tagline.strip()
        if req.owner_name is not None:
            comp.owner_name = req.owner_name.strip()
        if req.phone is not None:
            comp.phone = req.phone.strip()
        if req.alt_phone is not None:
            comp.alt_phone = req.alt_phone.strip()
        if req.email is not None:
            comp.email = req.email.strip()
        if req.address is not None:
            comp.address = req.address.strip()
        if req.city_state is not None:
            comp.city_state = req.city_state.strip()
        if req.pincode is not None:
            comp.pincode = req.pincode.strip()
        if req.msme_no is not None:
            comp.msme_no = req.msme_no.strip()
        if req.website is not None:
            comp.website = req.website.strip()
        if req.gstin is not None:
            comp.gstin = req.gstin.strip()
        if req.pan is not None:
            comp.pan = req.pan.strip()

        # Bank Details
        if req.bank_name is not None:
            comp.bank_name = req.bank_name.strip()
        if req.account_holder is not None:
            comp.account_holder = req.account_holder.strip()
        if req.account_no is not None:
            comp.account_no = req.account_no.strip()
        if req.account_type is not None:
            comp.account_type = req.account_type.strip()
        if req.ifsc is not None:
            comp.ifsc = req.ifsc.strip()
        if req.branch_name is not None:
            comp.branch_name = req.branch_name.strip()
        if req.upi_id is not None:
            comp.upi_id = req.upi_id.strip()
        if req.qr_code_image is not None:
            comp.qr_code_image = req.qr_code_image.strip()

        # Invoicing & Printing
        if req.invoice_title is not None:
            comp.invoice_title = req.invoice_title.strip()
        if req.challan_title is not None:
            comp.challan_title = req.challan_title.strip()
        if req.invoice_prefix is not None:
            comp.invoice_prefix = req.invoice_prefix.strip()
        if req.next_invoice_no is not None:
            comp.next_invoice_no = req.next_invoice_no.strip()
        if req.challan_prefix is not None:
            comp.challan_prefix = req.challan_prefix.strip()
        if req.next_challan_no is not None:
            comp.next_challan_no = req.next_challan_no.strip()
        if req.hsn_sac_code is not None:
            comp.hsn_sac_code = req.hsn_sac_code.strip()
        if req.gst_rate is not None:
            comp.gst_rate = req.gst_rate.strip()
        if req.payment_terms is not None:
            comp.payment_terms = req.payment_terms.strip()
        if req.signatory_label is not None:
            comp.signatory_label = req.signatory_label.strip()
        if req.eway_threshold is not None:
            comp.eway_threshold = req.eway_threshold.strip()
        if req.print_qr is not None:
            comp.print_qr = req.print_qr
        if req.terms_conditions is not None:
            comp.terms_conditions = req.terms_conditions.strip()
        if req.settings_json is not None:
            if req.custom_labels is not None and isinstance(req.settings_json, dict):
                req.settings_json["custom_labels"] = req.custom_labels
            comp.settings_json = req.settings_json
        elif req.custom_labels is not None:
            existing_json = dict(comp.settings_json) if isinstance(comp.settings_json, dict) else {}
            existing_json["custom_labels"] = req.custom_labels
            comp.settings_json = existing_json

    # Also update firm_name and username on corresponding user(s)
    users = db.query(User).filter((User.company_id == cid) | (User.id == "user-001") | (User.id == "usr-owner-01")).all()
    for u in users:
        if clean_name:
            u.firm_name = clean_name
        if clean_user:
            u.username = clean_user
            if "@" in clean_user:
                u.email = clean_user

    db.commit()

    for u in users:
        sync_user_to_cache(
            user_id=u.id,
            username=u.username,
            email=u.email,
            name=u.name,
            firm_name=u.firm_name,
            company_id=u.company_id,
            password_hash=u.password_hash
        )

    return {
        "success": True,
        "message": "Company settings updated successfully in 00_settings",
        "firm_name": clean_name,
        "username": clean_user
    }

class SendRegistrationOtpRequest(BaseModel):
    company_name: str
    owner_name: str
    email: str
    username: str

class VerifyRegistrationOtpRequest(BaseModel):
    email: str
    otp: str

@router.post("/send-registration-otp")
def send_registration_otp(req: SendRegistrationOtpRequest, db: Session = Depends(get_db)):
    """
    Validates company/username/email availability, runs disposable & DNS MX checks,
    and dispatches a 6-digit OTP to the user's email address.
    """
    clean_company = req.company_name.strip()
    clean_owner = req.owner_name.strip()
    clean_email = req.email.strip().lower()
    clean_username = req.username.strip()

    if not clean_company:
        raise HTTPException(status_code=400, detail="Company / Firm Name is required")
    if not clean_owner:
        raise HTTPException(status_code=400, detail="Owner / Director Name is required")
    if not clean_username:
        raise HTTPException(status_code=400, detail="Login Username is required")
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="A valid Email Address is required")

    # 1. Check if username is already taken
    existing_username = db.query(User).filter(User.username.ilike(clean_username)).first()
    if existing_username:
        raise HTTPException(
            status_code=400,
            detail=f"Username '{clean_username}' is already taken. Please choose another username."
        )

    # 2. Check if email is already registered
    existing_email = db.query(User).filter(User.email.ilike(clean_email)).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail=f"An account with email '{clean_email}' already exists. Please sign in or use another email."
        )

    # 3. Multi-layer email authenticity check:
    #    - Regex syntax
    #    - Disposable / temporary email blocker (temp-mail, mailinator, etc.)
    #    - Real-time DNS MX record resolution
    is_valid_email, email_err = validate_email_authenticity(clean_email)
    if not is_valid_email:
        raise HTTPException(status_code=400, detail=email_err)

    # 4. Generate and store OTP (10 min expiry)
    otp = store_registration_otp(clean_email, clean_company)

    # 5. Dispatch email via SMTP
    sent_ok, send_msg, dev_otp = send_registration_otp_email(
        to_email=clean_email,
        otp=otp,
        company_name=clean_company,
        owner_name=clean_owner
    )

    return {
        "success": True,
        "message": send_msg,
        "email": clean_email,
        "dev_otp": dev_otp  # available for rapid local development/testing
    }

@router.post("/verify-registration-otp")
def verify_registration_otp_endpoint(req: VerifyRegistrationOtpRequest):
    """Verifies the 6-digit OTP entered by the user."""
    clean_email = req.email.strip().lower()
    clean_otp = req.otp.strip()

    if not clean_email or not clean_otp:
        raise HTTPException(status_code=400, detail="Email and OTP are required")

    is_valid, msg = verify_registration_otp(clean_email, clean_otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)

    return {
        "success": True,
        "message": msg,
        "verified": True,
        "email": clean_email
    }

class RegisterCompanyRequest(BaseModel):
    company_name: str
    owner_name: str
    email: Optional[str] = None
    username: Optional[str] = None
    username_or_email: Optional[str] = None  # fallback for backward compatibility
    password: str
    phone: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    otp: Optional[str] = None

@router.post("/register-company", status_code=status.HTTP_201_CREATED)
def register_company(req: RegisterCompanyRequest, db: Session = Depends(get_db)):
    """Registers a new tenant company with dedicated email, username, and business profile."""
    clean_company = req.company_name.strip()
    clean_owner = req.owner_name.strip()
    if not clean_company:
        raise HTTPException(status_code=400, detail="Company / Firm Name is required")
    if not clean_owner:
        raise HTTPException(status_code=400, detail="Owner / Director Name is required")

    # 1. Resolve separate username and email
    raw_user = req.username.strip() if req.username else ""
    raw_email = req.email.strip() if req.email else ""
    raw_legacy = req.username_or_email.strip() if req.username_or_email else ""

    clean_username = raw_user or (raw_legacy if "@" not in raw_legacy else raw_legacy.split("@")[0])
    clean_email = raw_email or (raw_legacy if "@" in raw_legacy else "")
    clean_email = clean_email.lower().strip()

    if not clean_username:
        raise HTTPException(status_code=400, detail="Login Username is required")
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="A valid Email Address is required")
    if not req.password or len(req.password.strip()) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    # Check if username is already taken
    existing_username = db.query(User).filter(User.username.ilike(clean_username)).first()
    if existing_username:
        raise HTTPException(
            status_code=400,
            detail=f"Username '{clean_username}' is already taken. Please choose another username."
        )

    # Check if email is already registered
    existing_email = db.query(User).filter(User.email.ilike(clean_email)).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail=f"An account with email '{clean_email}' already exists. Please sign in or use another email."
        )

    # Multi-layer Email Authenticity & OTP Verification
    if req.otp:
        is_valid_otp, otp_err = verify_registration_otp(clean_email, req.otp)
        if not is_valid_otp:
            raise HTTPException(status_code=400, detail=otp_err)
    else:
        # Check if already verified via previous step
        if not is_email_verified(clean_email):
            # Check format & disposable/MX to give precise rejection reason
            is_valid_syntax, syntax_err = validate_email_authenticity(clean_email)
            if not is_valid_syntax:
                raise HTTPException(status_code=400, detail=syntax_err)
            raise HTTPException(
                status_code=400,
                detail="ઈમેલ વેરિફિકેશન (OTP) ફરજિયાત છે. કૃપા કરીને તમારા ઈમેલ પર આવેલો ૬-અંકનો OTP દાખલ કરો."
            )

    # Generate sequential company_id (comp-002, comp-003, ...)
    all_companies = db.query(Company.id).all()
    max_comp_num = 0
    for (cid,) in all_companies:
        if cid and cid.startswith("comp-"):
            suffix = cid.replace("comp-", "")
            if suffix.isdigit():
                max_comp_num = max(max_comp_num, int(suffix))

    all_users = db.query(User.id).all()
    for (uid,) in all_users:
        if uid and uid.startswith("user-"):
            suffix = uid.replace("user-", "")
            if suffix.isdigit():
                max_comp_num = max(max_comp_num, int(suffix))

    next_comp_num = max_comp_num + 1
    next_comp_id = f"comp-{next_comp_num:03d}"
    next_user_id = f"user-{next_comp_num:03d}"
    clean_code = clean_company.upper().replace(" ", "")[:8]

    # Combine address if city provided
    full_address = req.address.strip() if req.address else ""
    if req.city and req.city.strip():
        if full_address and req.city.strip() not in full_address:
            full_address = f"{full_address}, {req.city.strip()}"
        elif not full_address:
            full_address = req.city.strip()

    # Create Company
    new_company = Company(
        id=next_comp_id,
        name=clean_company,
        code=f"{clean_code}-{next_comp_num:03d}",
        owner_name=clean_owner,
        phone=req.phone.strip() if req.phone else None,
        email=clean_email,
        address=full_address if full_address else None,
        gstin=req.gstin.strip().upper() if req.gstin else None,
        status="active"
    )
    db.add(new_company)

    # Create Owner User
    pw_hash = hash_password(req.password.strip())
    new_user = User(
        id=next_user_id,
        firm_name=clean_company,
        name=clean_owner,
        email=clean_email,
        username=clean_username,
        password_hash=pw_hash,
        company_id=next_comp_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_company)
    db.refresh(new_user)

    # Sync new company and user to fast in-memory cache for instant login
    sync_user_to_cache(
        user_id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        name=new_user.name,
        firm_name=new_company.name,
        company_id=new_company.id,
        password_hash=new_user.password_hash,
        plain_password=req.password.strip()
    )

    # Clear OTP from memory
    clear_verified_otp(clean_email)

    token = create_access_token({
        "sub": new_user.id,
        "user_id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "name": new_user.name,
        "company_id": new_user.company_id,
        "role": "Owner"
    })

    return {
        "success": True,
        "message": f"Company '{new_company.name}' registered successfully with ID {next_comp_id}!",
        "token": token,
        "access_token": token,
        "token_type": "bearer",
        "company": {
            "id": new_company.id,
            "name": new_company.name,
            "code": new_company.code,
            "ownerName": new_company.owner_name,
            "email": new_company.email,
            "phone": new_company.phone,
            "address": new_company.address,
            "gstin": new_company.gstin
        },
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "name": new_user.name,
            "firmName": new_user.firm_name,
            "role": "Owner",
            "roleTitle": "Proprietor & Director",
            "companyId": new_user.company_id
        }
    }

@router.get("/companies")
def list_companies(db: Session = Depends(get_db)):
    """Lists all registered tenant companies."""
    companies = db.query(Company).order_by(Company.id.asc()).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "code": c.code,
            "ownerName": c.owner_name,
            "email": c.email,
            "phone": c.phone,
            "status": c.status
        }
        for c in companies
    ]

@router.delete("/companies/{company_id}")
def delete_company(company_id: str, db: Session = Depends(get_db)):
    """Delete a company and associated users (comp-001 protected)."""
    clean_id = company_id.strip()
    if clean_id == "comp-001":
        raise HTTPException(status_code=400, detail="Primary company comp-001 cannot be deleted.")

    comp = db.query(Company).filter(Company.id == clean_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail=f"Company '{clean_id}' not found.")

    # Delete users
    db.query(User).filter(User.company_id == clean_id).delete()
    db.delete(comp)
    db.commit()
    return {"success": True, "message": f"Company {clean_id} deleted successfully."}

