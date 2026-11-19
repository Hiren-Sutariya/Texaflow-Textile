"""
Multi-Tenant Cryptographic Isolation & Security Dependency for Texaflow ERP.
Extracts and verifies tenant company_id from cryptographically signed JWT Bearer tokens.
Prevents cross-tenant data leaks and unauthorized header spoofing.
"""
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status
from app.core.jwt import verify_access_token

def _extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    cleaned = authorization.strip()
    parts = cleaned.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    if len(parts) == 1 and "." in parts[0]:
        return parts[0].strip()
    return None

def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """
    Extracts and cryptographically verifies the current authenticated user from Bearer JWT.
    Returns user payload dictionary (user_id, company_id, role, etc.) or None.
    """
    token = _extract_bearer_token(authorization)
    if not token:
        return None
    try:
        return verify_access_token(token)
    except Exception:
        return None

def get_required_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Strict dependency that requires a valid, unexpired JWT token.
    Raises 401 Unauthorized if token is missing, forged, or expired.
    """
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please sign in to access this resource."
        )
    try:
        return verify_access_token(token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

def get_tenant_company_id(
    authorization: Optional[str] = Header(None),
    x_company_id: Optional[str] = Header(None)
) -> str:
    """
    Authoritative Multi-Tenant Company ID Provider:
    1. Authorization Bearer JWT token is MANDATORY for all private tenant operations.
    2. Signature is cryptographically verified against server secret key.
    3. company_id is extracted strictly from the token payload.
    4. Any attempt to spoof x_company_id from another tenant triggers 403 Forbidden.
    5. Unauthenticated requests are rejected with 401 Unauthorized (no insecure defaults).
    """
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Access to tenant resources requires a valid signed Bearer token."
        )

    try:
        payload = verify_access_token(token)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication token invalid or expired: {err}"
        )

    token_cid = payload.get("company_id")
    if not token_cid or not isinstance(token_cid, str) or not token_cid.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token: Token does not contain a valid company_id claim."
        )

    verified_cid = token_cid.strip()

    # Security Gate: Prevent cross-tenant header spoofing!
    if x_company_id and x_company_id.strip() and x_company_id.strip() != verified_cid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Forbidden: Token company ID mismatch. You cannot access another company's data."
        )

    return verified_cid
