import hashlib
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User

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
            "firmName": user.firm_name
        }
    }

@router.get("/credentials")
def get_credentials(db: Session = Depends(get_db)):
    """Fetch current primary admin credentials info."""
    user = db.query(User).first()
    if not user:
        # Create default
        pw_hash = hash_password("owner123")
        user = User(
            id="usr-owner-01",
            username="owner@om-sai.com",
            email="owner@om-sai.com",
            name="Hiren Sutariya",
            password_hash=pw_hash,
            role="Owner",
            role_title="Proprietor & Director",
            firm_name="Om Sai Enterprises"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "success": True,
        "username": user.username,
        "email": user.email or user.username,
        "name": user.name,
        "role": user.role,
        "firm_name": user.firm_name
    }

@router.put("/change-credentials")
def change_credentials(req: ChangeCredentialsRequest, db: Session = Depends(get_db)):
    """Change admin login username and password in the database."""
    user = db.query(User).first()
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
            "name": user.name
        }
    }
