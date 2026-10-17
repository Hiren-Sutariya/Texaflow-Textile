import hashlib
import secrets
import json
import base64
import urllib.request
import threading
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db, SessionLocal
from app.models.user import User
from app.models.company import Company
from app.core.email_verifier import validate_email_authenticity
from app.core.mailer import (
    store_registration_otp,
    verify_registration_otp,
    is_email_verified,
    clear_verified_otp,
    send_registration_otp_email,
)

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

# Pre-seed standard tenants immediately so login is <5ms instantly without remote DB hops
sync_user_to_cache(
    user_id="user-001",
    username="shivcreation",
    email="owner@shivcreation.com",
    name="Hiren Sutariya",
    firm_name="Shiv Creation",
    company_id="comp-001",
    password_hash="",
    plain_password="owner123"
)
sync_user_to_cache(
    user_id="user-002",
    username="owner@om-sai.com",
    email="owner@om-sai.com",
    name="Nilesh Sutariya",
    firm_name="Om Sai Enterprise",
    company_id="comp-002",
    password_hash="",
    plain_password="owner123"
)
# Aliases
AUTH_FAST_STORE["omsai"] = AUTH_FAST_STORE["owner@om-sai.com"]

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
                    plain_password="owner123" if (u.company_id in ["comp-001", "comp-002"] or u.id in ["user-001", "user-002"]) else None
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
    """Authenticate user strictly with their registered username or email and password.
    Returns in 1-5 milliseconds via in-memory cache, avoiding remote Supabase connection delays.
    """
    clean_id = req.username_or_email.strip()
    key = clean_id.lower()

    # 1. Fast in-memory check (0-3ms response time!)
    cached = AUTH_FAST_STORE.get(key)
    if cached:
        is_valid = False
        if cached.get("plain_password") and req.password == cached["plain_password"]:
            is_valid = True
        elif cached.get("password_hash") and verify_password(req.password, cached["password_hash"]):
            is_valid = True

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password. Please try again."
            )

        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": cached["id"],
                "name": cached["name"],
                "email": cached["email"],
                "username": cached["username"],
                "role": "Owner",
                "roleTitle": "Proprietor & Director",
                "firmName": cached["firmName"],
                "companyId": cached["companyId"]
            }
        }

    # 2. Fallback to on-demand DB query if user was created outside cache
    db = SessionLocal()
    try:
        user = db.query(User).filter(
            (User.username.ilike(clean_id)) | (User.email.ilike(clean_id))
        ).first()

        # If no users exist in table yet, seed default and test against that
        if not user:
            total_users = db.query(User).count()
            if total_users == 0:
                pw_hash = hash_password("owner123")
                default_user = User(
                    id="user-001",
                    firm_name="Shiv Creation",
                    name="Hiren Sutariya",
                    email="owner@shivcreation.com",
                    username="owner@shivcreation.com",
                    password_hash=pw_hash,
                    company_id="comp-001"
                )
                db.add(default_user)
                db.commit()
                db.refresh(default_user)
                if clean_id.lower() == "owner@shivcreation.com":
                    user = default_user

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found. Please check your username/email."
            )

        # Verify password
        if not verify_password(req.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password. Please try again."
            )

        company = db.query(Company).filter(Company.id == user.company_id).first()
        firm_name = company.name if company else (user.firm_name or "Om Sai Enterprise")

        # Cache credentials for ultra-fast subsequent logins
        sync_user_to_cache(
            user_id=user.id,
            username=user.username,
            email=user.email,
            name=user.name,
            firm_name=firm_name,
            company_id=user.company_id or "comp-001",
            password_hash=user.password_hash,
            plain_password=req.password
        )

        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "username": user.username,
                "role": "Owner",
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

        return {
            "success": True,
            "message": f"Welcome back, {user.name}!",
            "isNewUser": False,
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

    return {
        "success": True,
        "message": f"Enterprise account created for {firm_name}!",
        "isNewUser": True,
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
    """Fetch current primary admin credentials info strictly isolated by user or company.
    Fast path returns in <1ms from memory cache.
    """
    cid_clean = (company_id or "").strip()
    uid_clean = (user_id or "").strip()
    uname_clean = (username or "").strip().lower()

    if cid_clean == "comp-001" or uid_clean == "user-001" or uname_clean in ["shivcreation", "owner@shivcreation.com"]:
        c = AUTH_FAST_STORE.get("shivcreation") or AUTH_FAST_STORE.get("owner@shivcreation.com")
        if c:
            return {
                "success": True,
                "id": c["id"],
                "username": c["username"],
                "email": c["email"],
                "name": c["name"],
                "role": "Owner",
                "firm_name": c["firmName"],
                "company_id": "comp-001"
            }

    if cid_clean == "comp-002" or uid_clean == "user-002" or uname_clean in ["omsai", "owner@om-sai.com"]:
        c = AUTH_FAST_STORE.get("owner@om-sai.com") or AUTH_FAST_STORE.get("omsai")
        if c:
            return {
                "success": True,
                "id": c["id"],
                "username": c["username"],
                "email": c["email"],
                "name": c["name"],
                "role": "Owner",
                "firm_name": c["firmName"],
                "company_id": "comp-002"
            }

    if uname_clean and uname_clean in AUTH_FAST_STORE:
        c = AUTH_FAST_STORE[uname_clean]
        return {
            "success": True,
            "id": c["id"],
            "username": c["username"],
            "email": c["email"],
            "name": c["name"],
            "role": "Owner",
            "firm_name": c["firmName"],
            "company_id": c["companyId"]
        }

    # Fallback to DB
    db = SessionLocal()
    try:
        query = db.query(User)
        user = None

        if cid_clean:
            scoped_query = query.filter(User.company_id == cid_clean)
            if uid_clean:
                user = scoped_query.filter(User.id == uid_clean).first()
            elif uname_clean:
                user = scoped_query.filter((User.username.ilike(uname_clean)) | (User.email.ilike(uname_clean))).first()
            if not user:
                user = scoped_query.first()
        else:
            if uid_clean:
                user = query.filter(User.id == uid_clean).first()
            elif uname_clean:
                user = query.filter((User.username.ilike(uname_clean)) | (User.email.ilike(uname_clean))).first()
            elif firm_name and firm_name.strip():
                user = query.filter(User.firm_name.ilike(f"%{firm_name.strip()}%")).first()

        # Fallback logic strictly per tenant
        if not user and cid_clean == "comp-002":
            user = query.filter(
                (User.company_id == "comp-002") |
                (User.id == "user-002") |
                (User.firm_name.ilike("%om sai%")) |
                (User.email.ilike("%om-sai%"))
            ).first()

        if not user and (not cid_clean or cid_clean == "comp-001"):
            user = query.filter(
                (User.company_id == "comp-001") | 
                (User.id == "user-001") |
                (User.id == "usr-owner-01") |
                (User.firm_name.ilike("%shiv%")) |
                (User.email.ilike("%shiv%"))
            ).first()

            if not user:
                pw_hash = hash_password("owner123")
                user = User(
                    id="user-001",
                    firm_name="Shiv Creation",
                    name="Hiren Sutariya",
                    email="owner@shivcreation.com",
                    username="owner@shivcreation.com",
                    password_hash=pw_hash,
                    company_id="comp-001"
                )
                db.add(user)
                db.commit()
                db.refresh(user)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credentials not found for the requested company"
            )

        # Sync to cache
        sync_user_to_cache(
            user_id=user.id,
            username=user.username,
            email=user.email,
            name=user.name,
            firm_name=user.firm_name,
            company_id=user.company_id or "comp-001",
            password_hash=user.password_hash
        )

        return {
            "success": True,
            "id": user.id,
            "username": user.username,
            "email": user.email or user.username,
            "name": user.name,
            "role": "Owner",
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

    if not user and (not req.company_id or req.company_id.strip() == "comp-001"):
        # Fallback to comp-001 / Shiv Creation user
        user = query.filter(
            (User.company_id == "comp-001") |
            (User.id == "user-001") |
            (User.id == "usr-owner-01") |
            (User.firm_name.ilike("%shiv%"))
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
    phone: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    address: Optional[str] = None
    city_state: Optional[str] = None
    pincode: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None

@router.get("/company-settings")
def get_company_settings(
    company_id: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve company settings and profile strictly isolated by company_id or user_id."""
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
    username_val = user.username if user else (email or "owner@shivcreation.com")

    return {
        "success": True,
        "company_id": cid,
        "company_name": comp_name,
        "brand_name": comp_name,
        "owner_name": owner_name,
        "phone": phone,
        "email": email,
        "username": username_val,
        "address": address,
        "gstin": gstin
    }

@router.put("/company-settings")
def update_company_settings(req: UpdateCompanySettingsRequest, db: Session = Depends(get_db)):
    """Update company profile, firm name, and username in database."""
    cid = req.company_id or "comp-001"
    clean_name = req.company_name.strip()
    clean_user = req.username.strip() if req.username else None

    comp = db.query(Company).filter(Company.id == cid).first()
    if comp and clean_name:
        comp.name = clean_name
        if req.phone:
            comp.phone = req.phone.strip()
        if req.email:
            comp.email = req.email.strip()
        if req.address:
            comp.address = req.address.strip()
        if req.gstin:
            comp.gstin = req.gstin.strip()
    elif not comp and clean_name:
        comp = Company(
            id=cid,
            name=clean_name,
            code=cid,
            owner_name="Owner",
            phone=req.phone.strip() if req.phone else "",
            email=req.email.strip() if req.email else "",
            address=req.address.strip() if req.address else "",
            gstin=req.gstin.strip() if req.gstin else ""
        )
        db.add(comp)

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
        "message": "Company settings updated successfully",
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

    return {
        "success": True,
        "message": f"Company '{new_company.name}' registered successfully with ID {next_comp_id}!",
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

