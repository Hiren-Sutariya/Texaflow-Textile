"""
Centralized SaaS Super Admin Platform API Router.
Handles Platform Administration across all Tenants:
- Dashboard Analytics & MRR/ARR Calculation
- Complete Company / Tenant Lifecycle Management
- Centralized Cross-Tenant User Management (Fixed 5 Roles)
- Level 1: Module Activation / Deactivation per Tenant
- Level 2 & 3: Role Action Permission Matrix (View, Create, Edit, Delete, Export, Approve, Print)
- Level 4: Field-Level Visibility & Mutability Configuration
- Subscription, Plan Tiers & Billing Invoices
- Audited Support Sessions / Impersonation (Mandatory Justification, Auto-Expiry, Instant Revocation)
- Platform Security Audit Logs
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
import secrets, hashlib, uuid

from app.core.database import get_db
from app.core.tenant import require_super_admin, invalidate_subscription_cache
from app.core.jwt import create_access_token
from app.models.settings import Settings as Company
from app.models.user import User
from app.models.subscription import (
    SubscriptionPlan, TenantSubscription, PaymentTransaction,
    PlatformAuditLog, BillingInvoice
)
from app.models.permission import (
    CompanyModuleSetting, RolePermissionSetting, FieldPermissionSetting,
    SupportSession, FIXED_ROLES, PLATFORM_MODULES
)
from app.services.permission_engine import (
    PermissionEngine, clear_permission_cache, normalize_role
)

router = APIRouter(prefix="/platform", tags=["Platform Super Administration"])

def _audit(db: Session, admin: Dict[str, Any], action: str, company_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
    try:
        log = PlatformAuditLog(
            actor_id=admin.get("user_id") or admin.get("sub") or "superadmin",
            actor_email=admin.get("email") or "superadmin@texaflow.com",
            actor_role="SuperAdmin",
            action=action,
            target_company_id=company_id,
            details=details or {}
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"⚠️ Platform audit log write warning: {e}")

# ==============================================================================
# 1. PLATFORM OVERVIEW & METRICS
# ==============================================================================

@router.get("/overview")
def get_platform_overview(
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Calculates live platform KPIs directly from actual database records."""
    total_companies = db.query(Company).count()
    active_companies = db.query(Company).filter(Company.status == "active").count()
    suspended_companies = db.query(Company).filter(Company.status == "suspended").count()
    total_users = db.query(User).count()

    subs = db.query(TenantSubscription).all()
    plans = {p.id: p for p in db.query(SubscriptionPlan).all()}

    active_subs = 0
    trial_companies = 0
    expired_subs = 0
    mrr_inr = 0
    arr_inr = 0
    upcoming_renewals = []

    now = datetime.utcnow()
    thirty_days_later = now + timedelta(days=30)

    for s in subs:
        st = (s.status or "").lower()
        plan = plans.get(s.plan_id)
        
        if st in ("active", "paid"):
            active_subs += 1
            if plan:
                if s.billing_cycle == "annual":
                    m_val = int(plan.price_annual / 12)
                    mrr_inr += m_val
                    arr_inr += plan.price_annual
                else:
                    mrr_inr += plan.price_monthly
                    arr_inr += plan.price_monthly * 12

            if s.current_period_end and now <= s.current_period_end <= thirty_days_later:
                comp = db.query(Company).filter(Company.id == s.company_id).first()
                upcoming_renewals.append({
                    "company_id": s.company_id,
                    "company_name": comp.name if comp else s.company_id,
                    "plan_name": plan.name if plan else "Standard",
                    "expires_at": s.current_period_end.isoformat(),
                    "days_remaining": max(0, (s.current_period_end - now).days)
                })

        elif st in ("trialing", "trial"):
            if s.trial_ends_at and s.trial_ends_at < now:
                expired_subs += 1
            else:
                trial_companies += 1
        elif st in ("expired", "cancelled"):
            expired_subs += 1

    recent_companies = db.query(Company).order_by(
        Company.created_at.desc() if hasattr(Company, "created_at") else Company.id.desc()
    ).limit(5).all()

    recent_txns = db.query(PaymentTransaction).order_by(PaymentTransaction.created_at.desc()).limit(5).all()
    comps_map = {c.id: c.name for c in db.query(Company).all()}

    return {
        "success": True,
        "metrics": {
            "total_companies": total_companies,
            "active_companies": active_companies,
            "trial_companies": trial_companies,
            "suspended_companies": suspended_companies,
            "total_users": total_users,
            "active_subscriptions": active_subs,
            "expired_subscriptions": expired_subs,
            "mrr_inr": mrr_inr,
            "arr_inr": arr_inr
        },
        "recent_registrations": [
            {
                "id": c.id,
                "name": c.name,
                "owner_name": c.owner_name,
                "email": c.email,
                "phone": c.phone,
                "status": c.status,
                "created_at": c.created_at.isoformat() if hasattr(c, "created_at") and c.created_at else None
            }
            for c in recent_companies
        ],
        "recent_payments": [
            {
                "id": t.id,
                "company_id": t.company_id,
                "company_name": comps_map.get(t.company_id, t.company_id),
                "amount": t.amount,
                "status": t.status,
                "created_at": t.created_at.isoformat() if t.created_at else None
            }
            for t in recent_txns
        ],
        "upcoming_renewals": upcoming_renewals[:5]
    }

# ==============================================================================
# 2. COMPLETE COMPANY / TENANT MANAGEMENT
# ==============================================================================

@router.get("/companies")
def list_companies(
    status: Optional[str] = None,
    search: Optional[str] = None,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Retrieve all tenant companies with search, filter, and subscription details."""
    query = db.query(Company)
    if status and status.lower() != "all":
        query = query.filter(Company.status == status.lower())
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (Company.name.ilike(term)) |
            (Company.owner_name.ilike(term)) |
            (Company.email.ilike(term)) |
            (Company.phone.ilike(term)) |
            (Company.id.ilike(term))
        )

    companies = query.all()
    plans = {p.id: p for p in db.query(SubscriptionPlan).all()}
    subs = {s.company_id: s for s in db.query(TenantSubscription).all()}

    res = []
    for comp in companies:
        sub = subs.get(comp.id)
        plan = plans.get(sub.plan_id) if sub else None
        user_count = db.query(User).filter(User.company_id == comp.id).count()

        res.append({
            "id": comp.id,
            "name": comp.name,
            "legal_name": comp.brand_name or comp.name,
            "owner_name": comp.owner_name,
            "email": comp.email,
            "phone": comp.phone,
            "city_state": comp.city_state,
            "gstin": comp.gstin,
            "pan": comp.pan,
            "status": comp.status,
            "user_count": user_count,
            "created_at": comp.created_at.isoformat() if hasattr(comp, "created_at") and comp.created_at else None,
            "subscription": {
                "plan_id": plan.id if plan else "plan-pro",
                "plan_name": plan.name if plan else "Professional Plan",
                "status": sub.status if sub else "trialing",
                "billing_cycle": sub.billing_cycle if sub else "monthly",
                "trial_ends_at": sub.trial_ends_at.isoformat() if sub and sub.trial_ends_at else None,
                "current_period_end": sub.current_period_end.isoformat() if sub and sub.current_period_end else None
            } if sub else None
        })

    return {"success": True, "count": len(res), "companies": res}

@router.get("/companies/{company_id}")
def get_company_detail(
    company_id: str,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Retrieve full company profile, subscription, modules, and user roster."""
    comp = db.query(Company).filter(Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    sub = db.query(TenantSubscription).filter(TenantSubscription.company_id == company_id).first()
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first() if sub else None
    users = db.query(User).filter(User.company_id == company_id).all()
    module_settings = PermissionEngine.get_company_module_settings(db, company_id)

    return {
        "success": True,
        "company": {
            "id": comp.id,
            "name": comp.name,
            "brand_name": comp.brand_name,
            "tagline": comp.tagline,
            "owner_name": comp.owner_name,
            "phone": comp.phone,
            "email": comp.email,
            "address": comp.address,
            "city_state": comp.city_state,
            "pincode": comp.pincode,
            "gstin": comp.gstin,
            "pan": comp.pan,
            "status": comp.status,
            "invoice_prefix": comp.invoice_prefix,
            "next_invoice_no": comp.next_invoice_no,
            "created_at": comp.created_at.isoformat() if hasattr(comp, "created_at") and comp.created_at else None
        },
        "subscription": {
            "plan_id": plan.id if plan else "plan-enterprise",
            "plan_name": plan.name if plan else "Enterprise Plan",
            "status": sub.status if sub else "active",
            "billing_cycle": sub.billing_cycle if sub else "monthly",
            "trial_ends_at": sub.trial_ends_at.isoformat() if sub and sub.trial_ends_at else None,
            "current_period_end": sub.current_period_end.isoformat() if sub and sub.current_period_end else None,
            "max_users": plan.max_users if plan else 999
        } if sub else None,
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "username": u.username,
                "role": u.role or "OWNER",
                "is_active": u.is_active
            }
            for u in users
        ],
        "modules": module_settings
    }

class UpdateCompanyProfileRequest(BaseModel):
    name: Optional[str] = None
    brand_name: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city_state: Optional[str] = None
    pincode: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None

@router.put("/companies/{company_id}")
def update_company_profile(
    company_id: str,
    req: UpdateCompanyProfileRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Super Admin edits permitted company profile fields."""
    comp = db.query(Company).filter(Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    updated_fields = {}
    for field, val in req.dict(exclude_unset=True).items():
        if val is not None:
            setattr(comp, field, val.strip() if isinstance(val, str) else val)
            updated_fields[field] = val

    db.commit()
    _audit(db, admin, "update_company_profile", company_id, updated_fields)

    return {"success": True, "message": "Company profile updated successfully"}

class ChangeCompanyStatusRequest(BaseModel):
    status: str # active, suspended, trialing, expired

@router.put("/companies/{company_id}/status")
def change_company_status(
    company_id: str,
    req: ChangeCompanyStatusRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Activate, suspend, or reactivate a tenant company."""
    comp = db.query(Company).filter(Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    new_status = req.status.strip().lower()
    comp.status = new_status

    sub = db.query(TenantSubscription).filter(TenantSubscription.company_id == company_id).first()
    if sub:
        sub.status = new_status
        if new_status == "active" and sub.current_period_end < datetime.utcnow():
            sub.current_period_end = datetime.utcnow() + timedelta(days=30)

    db.commit()
    invalidate_subscription_cache(company_id)
    clear_permission_cache(company_id)
    _audit(db, admin, "change_company_status", company_id, {"new_status": new_status})

    return {
        "success": True,
        "message": f"Company '{comp.name}' status set to '{new_status}'",
        "company_id": company_id,
        "status": new_status
    }

# ==============================================================================
# 3. CENTRALIZED CROSS-TENANT USER MANAGEMENT
# ==============================================================================

@router.get("/users")
def list_all_users(
    company_id: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """List users across all tenants with search, company filter, and role filter."""
    query = db.query(User)
    if company_id and company_id != "all":
        query = query.filter(User.company_id == company_id)
    if role and role != "all":
        query = query.filter(User.role.ilike(role))
    if status and status != "all":
        is_act = (status.lower() == "active")
        query = query.filter(User.is_active == is_act)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (User.name.ilike(term)) |
            (User.email.ilike(term)) |
            (User.username.ilike(term)) |
            (User.company_id.ilike(term))
        )

    users = query.order_by(User.created_at.desc() if hasattr(User, "created_at") else User.id.desc()).all()
    comps = {c.id: c.name for c in db.query(Company).all()}

    return {
        "success": True,
        "count": len(users),
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "username": u.username,
                "role": u.role or "OWNER",
                "company_id": u.company_id,
                "company_name": comps.get(u.company_id, u.company_id),
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if hasattr(u, "created_at") and u.created_at else None
            }
            for u in users
        ]
    }

class CreateTenantUserRequest(BaseModel):
    company_id: str
    name: str
    email: str
    username: str
    role: str # Must be one of the 5 fixed roles
    password: str

@router.post("/users")
def create_tenant_user(
    req: CreateTenantUserRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Create a new user within a tenant company assigned to one of the 5 fixed roles."""
    norm_role = normalize_role(req.role)
    if norm_role == "SuperAdmin":
        raise HTTPException(
            status_code=400,
            detail="Forbidden: Cannot create SuperAdmin via tenant user provisioner."
        )

    comp = db.query(Company).filter(Company.id == req.company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    # Check for existing user
    clean_user = req.username.strip()
    clean_email = req.email.strip().lower()
    if db.query(User).filter((User.username == clean_user) | (User.email == clean_email)).first():
        raise HTTPException(status_code=400, detail="Username or email already in use.")

    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", req.password.encode("utf-8"), salt.encode("utf-8"), 100000)
    pw_hash = f"{salt}:{key.hex()}"

    new_user = User(
        id=f"usr-{uuid.uuid4().hex[:12]}",
        company_id=req.company_id,
        name=req.name.strip(),
        email=clean_email,
        username=clean_user,
        password_hash=pw_hash,
        role=norm_role,
        is_active=True,
        firm_name=comp.name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    _audit(db, admin, "create_tenant_user", req.company_id, {
        "user_id": new_user.id,
        "username": new_user.username,
        "role": norm_role
    })

    return {
        "success": True,
        "message": f"User '{new_user.name}' created with role '{norm_role}' for '{comp.name}'",
        "user_id": new_user.id
    }

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

@router.put("/users/{user_id}")
def update_tenant_user(
    user_id: str,
    req: UpdateUserRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Super Admin edits permitted user profile and reassigns predefined roles."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "SuperAdmin" and req.role and req.role != "SuperAdmin":
        raise HTTPException(status_code=400, detail="Cannot demote SuperAdmin via user updater.")

    if req.name is not None:
        user.name = req.name.strip()
    if req.email is not None:
        user.email = req.email.strip().lower()
    if req.is_active is not None:
        user.is_active = req.is_active
    if req.role is not None:
        norm_role = normalize_role(req.role)
        if norm_role == "SuperAdmin":
            raise HTTPException(status_code=400, detail="Cannot escalate user to SuperAdmin here.")
        user.role = norm_role

    db.commit()
    clear_permission_cache(user.company_id)
    _audit(db, admin, "update_tenant_user", user.company_id, {"user_id": user.id, "role": user.role, "is_active": user.is_active})

    return {"success": True, "message": "User updated successfully"}

class ResetPasswordRequest(BaseModel):
    new_password: str

@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: str,
    req: ResetPasswordRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Reset user password securely. Never displays plaintext password in logs."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if len(req.new_password.strip()) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", req.new_password.strip().encode("utf-8"), salt.encode("utf-8"), 100000)
    user.password_hash = f"{salt}:{key.hex()}"
    db.commit()

    _audit(db, admin, "reset_user_password", user.company_id, {"user_id": user.id})

    return {"success": True, "message": f"Password reset successfully for user '{user.username}'"}

# ==============================================================================
# 4. LEVEL 1: MODULE ACTIVATION / DEACTIVATION
# ==============================================================================

@router.get("/modules")
def list_platform_modules(admin: Dict[str, Any] = Depends(require_super_admin)):
    """Returns the list of all 16 platform modules."""
    return {"success": True, "modules": PLATFORM_MODULES}

@router.get("/companies/{company_id}/modules")
def get_company_modules(
    company_id: str,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Returns module activation state for a specific company."""
    comp = db.query(Company).filter(Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    modules_state = PermissionEngine.get_company_module_settings(db, company_id)
    return {
        "success": True,
        "company_id": company_id,
        "company_name": comp.name,
        "modules": modules_state
    }

class UpdateCompanyModulesRequest(BaseModel):
    modules: Dict[str, bool] # { "purchases": True, "hrms": False }

@router.put("/companies/{company_id}/modules")
def update_company_modules(
    company_id: str,
    req: UpdateCompanyModulesRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Bulk update module activation for a company."""
    comp = db.query(Company).filter(Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    for mkey, is_enabled in req.modules.items():
        setting = db.query(CompanyModuleSetting).filter(
            CompanyModuleSetting.company_id == company_id,
            CompanyModuleSetting.module_key == mkey
        ).first()
        if not setting:
            setting = CompanyModuleSetting(
                company_id=company_id,
                module_key=mkey,
                is_enabled=is_enabled,
                configured_by=admin.get("user_id", "superadmin")
            )
            db.add(setting)
        else:
            setting.is_enabled = is_enabled

    db.commit()
    clear_permission_cache(company_id)
    _audit(db, admin, "update_company_modules", company_id, req.modules)

    return {"success": True, "message": f"Module settings updated for '{comp.name}'"}

# ==============================================================================
# 5. LEVEL 2 & 3: ROLE ACTION PERMISSION MATRIX
# ==============================================================================

@router.get("/permissions/matrix")
def get_permission_matrix(
    company_id: str = "*",
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Returns full role action permission matrix.
    company_id='*' returns platform defaults. Any valid CID returns company overrides.
    """
    matrix = {}
    for role in FIXED_ROLES:
        matrix[role] = PermissionEngine.get_role_permissions(db, company_id, role)

    return {
        "success": True,
        "company_id": company_id,
        "roles": FIXED_ROLES,
        "modules": PLATFORM_MODULES,
        "matrix": matrix
    }

class PermissionMatrixUpdateRequest(BaseModel):
    company_id: str = "*" # '*' for platform defaults or specific company_id
    role: str
    module_key: str
    actions: Dict[str, bool] # { "view": True, "create": False, "edit": False, "delete": False, "export": False, "approve": False, "print": False }

@router.put("/permissions/matrix")
def update_permission_matrix(
    req: PermissionMatrixUpdateRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Super Admin updates action permissions for a specific role and module."""
    norm_role = normalize_role(req.role)
    cid = req.company_id.strip()

    perm = db.query(RolePermissionSetting).filter(
        RolePermissionSetting.company_id == cid,
        RolePermissionSetting.role == norm_role,
        RolePermissionSetting.module_key == req.module_key
    ).first()

    if not perm:
        perm = RolePermissionSetting(
            company_id=cid,
            role=norm_role,
            module_key=req.module_key,
            can_view=req.actions.get("view", True),
            can_create=req.actions.get("create", False),
            can_edit=req.actions.get("edit", False),
            can_delete=req.actions.get("delete", False),
            can_export=req.actions.get("export", False),
            can_approve=req.actions.get("approve", False),
            can_print=req.actions.get("print", False),
        )
        db.add(perm)
    else:
        perm.can_view = req.actions.get("view", perm.can_view)
        perm.can_create = req.actions.get("create", perm.can_create)
        perm.can_edit = req.actions.get("edit", perm.can_edit)
        perm.can_delete = req.actions.get("delete", perm.can_delete)
        perm.can_export = req.actions.get("export", perm.can_export)
        perm.can_approve = req.actions.get("approve", perm.can_approve)
        perm.can_print = req.actions.get("print", perm.can_print)

    db.commit()
    clear_permission_cache(cid)
    _audit(db, admin, "update_permission_matrix", cid, {
        "role": norm_role,
        "module": req.module_key,
        "actions": req.actions
    })

    return {"success": True, "message": "Permission matrix updated successfully"}

@router.post("/permissions/reset")
def reset_permissions_to_defaults(
    company_id: str,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Deletes all custom company overrides and reverts to platform defaults."""
    if company_id == "*":
        raise HTTPException(status_code=400, detail="Cannot reset platform defaults.")

    db.query(RolePermissionSetting).filter(RolePermissionSetting.company_id == company_id).delete()
    db.commit()
    clear_permission_cache(company_id)
    _audit(db, admin, "reset_permissions_to_defaults", company_id)

    return {"success": True, "message": "Company permissions reset to platform defaults."}

# ==============================================================================
# 6. LEVEL 4: FIELD-LEVEL PERMISSION MANAGEMENT
# ==============================================================================

@router.get("/permissions/fields")
def get_field_permissions(
    company_id: str = "*",
    entity_type: Optional[str] = None,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Returns field-level visibility & mutability rules."""
    query = db.query(FieldPermissionSetting).filter(FieldPermissionSetting.company_id == company_id)
    if entity_type:
        query = query.filter(FieldPermissionSetting.entity_type == entity_type)

    rules = query.all()
    # Group by entity_type -> field_name -> role -> permission
    grouped = {}
    for r in rules:
        if r.entity_type not in grouped:
            grouped[r.entity_type] = {}
        if r.field_name not in grouped[r.entity_type]:
            grouped[r.entity_type][r.field_name] = {}
        grouped[r.entity_type][r.field_name][r.role] = r.permission

    return {"success": True, "company_id": company_id, "fields": grouped}

class UpdateFieldPermissionRequest(BaseModel):
    company_id: str = "*"
    entity_type: str
    field_name: str
    role: str
    permission: str # 'editable', 'read_only', 'hidden', 'not_permitted_update'

@router.put("/permissions/fields")
def update_field_permission(
    req: UpdateFieldPermissionRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Super Admin sets visibility/editability for a specific field and role."""
    norm_role = normalize_role(req.role)
    cid = req.company_id.strip()

    rule = db.query(FieldPermissionSetting).filter(
        FieldPermissionSetting.company_id == cid,
        FieldPermissionSetting.role == norm_role,
        FieldPermissionSetting.entity_type == req.entity_type,
        FieldPermissionSetting.field_name == req.field_name
    ).first()

    if not rule:
        rule = FieldPermissionSetting(
            company_id=cid,
            role=norm_role,
            entity_type=req.entity_type,
            field_name=req.field_name,
            permission=req.permission
        )
        db.add(rule)
    else:
        rule.permission = req.permission

    db.commit()
    clear_permission_cache(cid)
    _audit(db, admin, "update_field_permission", cid, {
        "entity": req.entity_type,
        "field": req.field_name,
        "role": norm_role,
        "permission": req.permission
    })

    return {"success": True, "message": f"Field '{req.field_name}' rule updated to '{req.permission}'"}

# ==============================================================================
# 7. AUDITED SUPPORT SESSIONS / IMPERSONATION
# ==============================================================================

class CreateSupportSessionRequest(BaseModel):
    company_id: str
    reason: str = Field(..., min_length=5, description="Mandatory detailed reason for diagnostic support access")
    duration_minutes: int = Field(default=60, ge=15, le=120)

@router.post("/support/create-session")
def create_support_session(
    req: CreateSupportSessionRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Generates a strictly audited, time-limited support session token.
    Never exposes passwords. Includes visual diagnostic banner.
    """
    comp = db.query(Company).filter(Company.id == req.company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    user = db.query(User).filter(User.company_id == req.company_id).first()
    uname = user.username if user else f"support-{req.company_id}"

    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=req.duration_minutes)

    token = create_access_token({
        "sub": f"support-{admin.get('user_id', 'super')}",
        "user_id": f"support-{admin.get('user_id', 'super')}",
        "username": uname,
        "email": admin.get("email", "superadmin@texaflow.com"),
        "name": f"Support Session ({comp.name})",
        "company_id": req.company_id,
        "role": "SuperAdmin",
        "is_support_session": True,
        "support_reason": req.reason.strip()
    }, expires_delta_seconds=req.duration_minutes * 60)

    session_rec = SupportSession(
        id=f"supp-{uuid.uuid4().hex[:12]}",
        admin_id=admin.get("user_id", "superadmin"),
        admin_email=admin.get("email", "superadmin@texaflow.com"),
        target_company_id=req.company_id,
        reason=req.reason.strip(),
        expires_at=expires_at,
        is_active=True,
        session_token=token
    )
    db.add(session_rec)
    db.commit()

    _audit(db, admin, "create_support_session", req.company_id, {
        "reason": req.reason.strip(),
        "duration_minutes": req.duration_minutes,
        "expires_at": expires_at.isoformat()
    })

    return {
        "success": True,
        "message": f"Support session generated for '{comp.name}'. Valid for {req.duration_minutes} minutes.",
        "token": token,
        "session_id": session_rec.id,
        "expires_at": expires_at.isoformat(),
        "company_id": comp.id,
        "company_name": comp.name
    }

@router.get("/support/active-sessions")
def list_active_support_sessions(
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Lists currently active support diagnostic sessions."""
    now = datetime.utcnow()
    sessions = db.query(SupportSession).filter(
        SupportSession.is_active == True,
        SupportSession.expires_at > now
    ).order_by(SupportSession.created_at.desc()).all()

    comps = {c.id: c.name for c in db.query(Company).all()}

    return {
        "success": True,
        "sessions": [
            {
                "id": s.id,
                "admin_email": s.admin_email,
                "company_id": s.target_company_id,
                "company_name": comps.get(s.target_company_id, s.target_company_id),
                "reason": s.reason,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "expires_at": s.expires_at.isoformat(),
                "is_active": s.is_active
            }
            for s in sessions
        ]
    }

@router.post("/support/revoke-session")
def revoke_support_session(
    session_id: str,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Immediately revokes an active support session."""
    sess = db.query(SupportSession).filter(SupportSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Support session not found")

    sess.is_active = False
    sess.revoked_at = datetime.utcnow()
    db.commit()

    _audit(db, admin, "revoke_support_session", sess.target_company_id, {"session_id": session_id})

    return {"success": True, "message": "Support session revoked immediately."}

# ==============================================================================
# 8. AUDIT LOGS QUERY
# ==============================================================================

@router.get("/audit-logs")
def get_audit_logs(
    company_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 50,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Query platform and security audit logs with filtering."""
    query = db.query(PlatformAuditLog)
    if company_id and company_id != "all":
        query = query.filter(PlatformAuditLog.target_company_id == company_id)
    if action and action != "all":
        query = query.filter(PlatformAuditLog.action.ilike(f"%{action}%"))

    logs = query.order_by(PlatformAuditLog.created_at.desc()).limit(limit).all()
    comps = {c.id: c.name for c in db.query(Company).all()}

    return {
        "success": True,
        "count": len(logs),
        "logs": [
            {
                "id": l.id,
                "actor_email": l.actor_email,
                "actor_role": l.actor_role,
                "action": l.action,
                "target_company_id": l.target_company_id,
                "target_company_name": comps.get(l.target_company_id, "Platform / System"),
                "details": l.details,
                "created_at": l.created_at.isoformat() if l.created_at else None
            }
            for l in logs
        ]
    }
