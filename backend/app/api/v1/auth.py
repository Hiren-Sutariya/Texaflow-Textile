from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.domain import LoginRequest, UserProfile, APIResponse
from app.core.security import create_access_token

router = APIRouter()

@router.post("/login", response_model=APIResponse)
def login(request: LoginRequest):
    if request.email == "owner@digiscale.com" and request.password in ["owner123", "password", "admin"]:
        token = create_access_token(subject="u-owner-001", role="Owner")
        profile = UserProfile(
            id="u-owner-001",
            email="owner@digiscale.com",
            full_name="Proprietor / Owner",
            role="Owner",
            token=token
        )
        return APIResponse(success=True, message="Login successful", data=profile.model_dump())
    
    # Default fallback for demo access
    token = create_access_token(subject="u-demo-001", role="Owner")
    profile = UserProfile(
        id="u-demo-001",
        email=request.email,
        full_name="Business Manager",
        role="Owner",
        token=token
    )
    return APIResponse(success=True, message="Login successful", data=profile.model_dump())

@router.get("/me", response_model=APIResponse)
def get_me():
    profile = UserProfile(
        id="u-owner-001",
        email="owner@digiscale.com",
        full_name="Proprietor / Owner",
        role="Owner"
    )
    return APIResponse(success=True, message="User profile retrieved", data=profile.model_dump())
