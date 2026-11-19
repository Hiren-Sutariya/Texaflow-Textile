"""
Multi-Tenant Cryptographic Isolation & Security Dependency for Texaflow ERP.
Extracts and verifies tenant company_id from cryptographically signed JWT Bearer tokens.
Prevents cross-tenant data leaks and unauthorized header spoofing.
Enforces SaaS subscription lifecycle (trial, active, grace period, suspended, expired).
"""
import time
from typing import Optional, Dict, Any
from datetime import datetime
from fastapi import Header, HTTPException, status, Request
from app.core.jwt import verify_access_token

# In-memory fast cache for subscription status (30 second TTL)
_SUBSCRIPTION_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL_SECONDS = 30

def invalidate_subscription_cache(company_id: Optional[str] = None):
    """Invalidates the subscription cache for a tenant or completely."""
    if company_id:
        _SUBSCRIPTION_CACHE.pop(company_id, None)
    else:
        _SUBSCRIPTION_CACHE.clear()

def get_cached_subscription_status(company_id: str) -> Dict[str, Any]:
    """Retrieves or caches the subscription status for a given tenant company."""
    now_time = time.time()
    cached = _SUBSCRIPTION_CACHE.get(company_id)
    if cached and (now_time - cached.get("timestamp", 0) < _CACHE_TTL_SECONDS):
        return cached.get("data", {"status": "active"})

    try:
        from app.core.database import SessionLocal
        from app.models.subscription import TenantSubscription
        db = SessionLocal()
        try:
            sub = db.query(TenantSubscription).filter(TenantSubscription.company_id == company_id).first()
            if not sub:
                data = {"status": "active", "is_trial": False, "plan_id": "plan-enterprise"}
            else:
                now_dt = datetime.utcnow()
                st = sub.status
                # Check if trial ended
                if st == "trialing" and sub.trial_ends_at and sub.trial_ends_at < now_dt:
                    st = "expired"
                elif st == "active" and sub.current_period_end and sub.current_period_end < now_dt:
                    if sub.grace_period_end and sub.grace_period_end > now_dt:
                        st = "past_due"
                    else:
                        st = "expired"

                data = {
                    "status": st,
                    "plan_id": sub.plan_id,
                    "trial_ends_at": sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
                    "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None
                }

            _SUBSCRIPTION_CACHE[company_id] = {
                "timestamp": now_time,
                "data": data
            }
            return data
        finally:
            db.close()
    except Exception:
        # Fallback to active to preserve availability during transient errors
        return {"status": "active"}

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
    request: Request,
    authorization: Optional[str] = Header(None),
    x_company_id: Optional[str] = Header(None)
) -> str:
    """
    Authoritative Multi-Tenant Company ID Provider & SaaS Lifecycle Enforcement:
    1. Authorization Bearer JWT token is MANDATORY for all private tenant operations.
    2. Signature is cryptographically verified against server secret key.
    3. company_id is extracted strictly from the token payload.
    4. Any attempt to spoof x_company_id from another tenant triggers 403 Forbidden.
    5. Suspended accounts are blocked (403 Forbidden).
    6. Expired accounts are limited to read-only mode (mutations blocked with 402 Payment Required).
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
    user_role = payload.get("role", "")

    # Security Gate: Prevent cross-tenant header spoofing!
    if x_company_id and x_company_id.strip() and x_company_id.strip() != verified_cid:
        if user_role != "SuperAdmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Forbidden: Token company ID mismatch. You cannot access another company's data."
            )

    # SaaS Lifecycle Enforcement (SuperAdmin is exempt)
    if user_role != "SuperAdmin":
        sub_info = get_cached_subscription_status(verified_cid)
        sub_status = sub_info.get("status", "active")

        # 1. Company account suspended by platform administration
        if sub_status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This company account has been suspended by platform administration. Please contact support."
            )

        # 2. Subscription expired / canceled -> Read-only mode: block write mutations
        if sub_status in ("expired", "canceled") and request is not None:
            method = request.method.upper()
            if method in ("POST", "PUT", "DELETE", "PATCH"):
                req_path = request.url.path
                # Allow authentication and subscription payment / billing endpoints
                if not (req_path.startswith("/api/v1/auth") or "subscription" in req_path or "payment" in req_path):
                    raise HTTPException(
                        status_code=status.HTTP_402_PAYMENT_REQUIRED,
                        detail="Subscription expired. Your account is in read-only mode. Please renew your subscription to continue creating or updating records."
                    )

    return verified_cid

class TenantContext:
    def __init__(self, company_id: str, role: str, user_id: str, email: str, is_super_admin: bool):
        self.company_id = company_id
        self.role = role
        self.user_id = user_id
        self.email = email
        self.is_super_admin = is_super_admin

def get_tenant_context(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_company_id: Optional[str] = Header(None)
) -> TenantContext:
    """
    Authoritative dependency returning verified TenantContext (company_id, role, user_id).
    Used across ERP routers for multi-level permission checks and field-level security.
    """
    company_id = get_tenant_company_id(request, authorization, x_company_id)
    token = _extract_bearer_token(authorization)
    payload = verify_access_token(token) if token else {}
    role = payload.get("role", "EMPLOYEE")
    user_id = payload.get("user_id") or payload.get("sub") or ""
    email = payload.get("email") or ""
    return TenantContext(
        company_id=company_id,
        role=role,
        user_id=user_id,
        email=email,
        is_super_admin=(role == "SuperAdmin")
    )

def require_super_admin(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Ensures the caller has platform-level SuperAdmin privileges.
    Raises 401 if unauthenticated, 403 if not a verified SuperAdmin.
    """
    user = get_required_current_user(authorization)
    role = user.get("role", "")
    if role != "SuperAdmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Platform Super-Administrator privileges required."
        )
    return user
