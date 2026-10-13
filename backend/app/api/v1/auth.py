import hashlib
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.company import Company

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
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with username/email and password."""
    clean_id = req.username_or_email.strip()
    
    # Check in DB
    user = db.query(User).filter(
        (User.username.ilike(clean_id)) | (User.email.ilike(clean_id))
    ).first()

    # If no users exist in table yet, seed default and test against that
    if not user:
        # Check if table is empty
        total_users = db.query(User).count()
        if total_users == 0:
            pw_hash = hash_password("owner123")
            default_user = User(
                id="usr-owner-01",
                username="owner@om-sai.com",
                email="owner@om-sai.com",
                name="Hiren Sutariya",
                password_hash=pw_hash,
                role="Owner",
                role_title="Proprietor & Director",
                firm_name="Om Sai Enterprises"
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)
            if clean_id.lower() in ["owner@om-sai.com", "owner", "admin"]:
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
    firm_name = company.name if company else (user.firm_name or "Om Sai Enterprises")

    return {
        "success": True,
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "roleTitle": user.role_title,
            "firmName": firm_name,
            "companyId": user.company_id or "comp-001"
        }
    }

@router.get("/credentials")
def get_credentials(
    user_id: Optional[str] = None,
    username: Optional[str] = None,
    company_id: Optional[str] = None,
    firm_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Fetch current primary admin credentials info strictly isolated by user or company."""
    query = db.query(User)
    user = None

    if user_id and user_id.strip():
        user = query.filter(User.id == user_id.strip()).first()
    elif username and username.strip():
        clean = username.strip()
        user = query.filter((User.username.ilike(clean)) | (User.email.ilike(clean))).first()
    elif company_id and company_id.strip():
        user = query.filter(User.company_id == company_id.strip()).first()
    elif firm_name and firm_name.strip():
        user = query.filter(User.firm_name.ilike(f"%{firm_name.strip()}%")).first()

    # Fallback logic: If company_id is comp-001 or no params passed, strictly return Om Sai Enterprises
    if not user:
        user = query.filter(
            (User.company_id == "comp-001") | 
            (User.id == "usr-owner-01") |
            (User.firm_name.ilike("%om sai%"))
        ).first()

    if not user:
        # Create default Om Sai user
        pw_hash = hash_password("owner123")
        user = User(
            id="usr-owner-01",
            username="owner@om-sai.com",
            email="owner@om-sai.com",
            name="Hiren Sutariya",
            password_hash=pw_hash,
            role="Owner",
            role_title="Proprietor & Director",
            firm_name="Om Sai Enterprises",
            company_id="comp-001"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "success": True,
        "id": user.id,
        "username": user.username,
        "email": user.email or user.username,
        "name": user.name,
        "role": user.role,
        "firm_name": user.firm_name,
        "company_id": user.company_id or "comp-001"
    }

@router.put("/change-credentials")
def change_credentials(req: ChangeCredentialsRequest, db: Session = Depends(get_db)):
    """Change admin login username and password in the database."""
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
        # Fallback to comp-001 / Om Sai user
        user = query.filter(
            (User.company_id == "comp-001") |
            (User.id == "usr-owner-01") |
            (User.firm_name.ilike("%om sai%"))
        ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin user record not found"
        )

    # 1. Verify current password
    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect. Verification failed."
        )

    # 2. Validate new username
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

    if req.name and req.name.strip():
        user.name = req.name.strip()

    # 3. Update password if provided
    if req.new_password and req.new_password.strip():
        if len(req.new_password.strip()) < 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 4 characters long"
            )
        user.password_hash = hash_password(req.new_password.strip())

    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Login ID and password updated successfully!",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "company_id": user.company_id or "comp-001"
        }
    }

class RegisterCompanyRequest(BaseModel):
    company_name: str
    owner_name: str
    username_or_email: str
    password: str
    phone: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None

@router.post("/register-company", status_code=status.HTTP_201_CREATED)
def register_company(req: RegisterCompanyRequest, db: Session = Depends(get_db)):
    """Registers a new tenant company and creates their primary Owner login."""
    clean_user = req.username_or_email.strip()
    if not clean_user:
        raise HTTPException(status_code=400, detail="Username / Email is required")
    if not req.password or len(req.password.strip()) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.username.ilike(clean_user)) | (User.email.ilike(clean_user))
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail=f"User with username/email '{clean_user}' already exists."
        )

    # Generate sequential company_id (comp-002, comp-003, ...)
    all_companies = db.query(Company.id).all()
    max_comp_num = 0
    for (cid,) in all_companies:
        if cid and cid.startswith("comp-"):
            suffix = cid.replace("comp-", "")
            if suffix.isdigit():
                max_comp_num = max(max_comp_num, int(suffix))

    next_comp_id = f"comp-{max_comp_num + 1:03d}"
    clean_code = req.company_name.strip().upper().replace(" ", "")[:8]

    # Create Company
    new_company = Company(
        id=next_comp_id,
        name=req.company_name.strip(),
        code=f"{clean_code}-{max_comp_num + 1:03d}",
        owner_name=req.owner_name.strip(),
        phone=req.phone.strip() if req.phone else None,
        email=clean_user if "@" in clean_user else None,
        address=req.address.strip() if req.address else None,
        gstin=req.gstin.strip() if req.gstin else None,
        status="active"
    )
    db.add(new_company)

    # Create Owner User
    pw_hash = hash_password(req.password.strip())
    new_user = User(
        id=f"usr-{next_comp_id}-owner",
        username=clean_user,
        email=clean_user if "@" in clean_user else None,
        name=req.owner_name.strip(),
        password_hash=pw_hash,
        role="Owner",
        role_title="Proprietor & Director",
        firm_name=req.company_name.strip(),
        company_id=next_comp_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_company)
    db.refresh(new_user)

    return {
        "success": True,
        "message": f"Company '{new_company.name}' registered successfully with ID {next_comp_id}!",
        "company": {
            "id": new_company.id,
            "name": new_company.name,
            "code": new_company.code,
            "ownerName": new_company.owner_name
        },
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "role": new_user.role,
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
