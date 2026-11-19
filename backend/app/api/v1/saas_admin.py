from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.tenant import require_super_admin, invalidate_subscription_cache
from app.models.settings import Settings as Company
from app.models.user import User
from app.models.subscription import SubscriptionPlan, TenantSubscription, PaymentTransaction, PlatformAuditLog
from app.core.jwt import create_access_token

router = APIRouter(prefix="/saas-admin", tags=["SaaS Super Admin"])

def _log_admin_action(db: Session, actor: Dict[str, Any], action: str, target_company_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
    try:
        log = PlatformAuditLog(
            actor_id=actor.get("user_id") or actor.get("sub") or "superadmin",
            actor_email=actor.get("email") or "superadmin@texaflow.com",
            actor_role="SuperAdmin",
            action=action,
            target_company_id=target_company_id,
            details=details or {}
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"⚠️ Audit log write warning: {e}")

@router.get("/overview")
def get_platform_overview(
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Platform-level KPI metrics for Super Administrators."""
    total_companies = db.query(Company).count()
    total_users = db.query(User).count()
    
    subs = db.query(TenantSubscription).all()
    plans = {p.id: p for p in db.query(SubscriptionPlan).all()}
    
    active_count = 0
    trial_count = 0
    suspended_count = 0
    expired_count = 0
    mrr_inr = 0
    
    now = datetime.utcnow()
    for s in subs:
        st = (s.status or "").lower()
        plan = plans.get(s.plan_id)
        
        if st in ("active", "paid"):
            active_count += 1
            if plan:
                if s.billing_cycle == "annual":
                    mrr_inr += int(plan.price_annual / 12)
                else:
                    mrr_inr += plan.price_monthly
        elif st in ("trialing", "trial"):
            if s.trial_ends_at and s.trial_ends_at < now:
                expired_count += 1
            else:
                trial_count += 1
        elif st in ("suspended", "past_due", "grace_period"):
            suspended_count += 1
        elif st in ("expired", "cancelled"):
            expired_count += 1
        else:
            active_count += 1

    recent_companies = db.query(Company).order_by(Company.created_at.desc() if hasattr(Company, "created_at") else Company.id.desc()).limit(5).all()

    return {
        "success": True,
        "metrics": {
            "total_companies": total_companies,
            "total_users": total_users,
            "active_subscriptions": active_count,
            "trial_accounts": trial_count,
            "suspended_accounts": suspended_count,
            "expired_accounts": expired_count,
            "mrr_inr": mrr_inr,
            "arr_inr": mrr_inr * 12
        },
        "recent_signups": [
            {
                "id": c.id,
                "name": c.name,
                "owner_name": c.owner_name,
                "email": c.email,
                "phone": c.phone,
                "status": c.status
            }
            for c in recent_companies
        ]
    }

@router.get("/companies")
def list_all_companies(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Retrieve all tenant companies with subscription status and plan details."""
    query = db.query(Company)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter((Company.name.ilike(term)) | (Company.owner_name.ilike(term)) | (Company.email.ilike(term)) | (Company.id.ilike(term)))
    
    companies = query.order_by(Company.id.asc()).all()
    subs = {s.company_id: s for s in db.query(TenantSubscription).all()}
    plans = {p.id: p for p in db.query(SubscriptionPlan).all()}
    user_counts = {}
    for (cid,) in db.query(User.company_id).all():
        user_counts[cid] = user_counts.get(cid, 0) + 1

    now = datetime.utcnow()
    result = []
    for c in companies:
        sub = subs.get(c.id)
        plan = plans.get(sub.plan_id) if sub else None
        
        effective_status = "trialing"
        if sub:
            effective_status = sub.status
            if sub.status == "trialing" and sub.trial_ends_at and sub.trial_ends_at < now:
                effective_status = "expired"
        elif c.status:
            effective_status = c.status

        if status_filter and status_filter.lower() != "all":
            if effective_status.lower() != status_filter.lower():
                continue

        days_remaining = None
        if sub:
            target_date = sub.trial_ends_at if sub.status == "trialing" else sub.current_period_end
            if target_date:
                days_remaining = max(0, (target_date - now).days)

        result.append({
            "id": c.id,
            "name": c.name,
            "code": c.code,
            "owner_name": c.owner_name,
            "email": c.email,
            "phone": c.phone,
            "city_state": c.city_state,
            "status": effective_status,
            "company_status": c.status,
            "user_count": user_counts.get(c.id, 0),
            "subscription": {
                "id": sub.id if sub else None,
                "plan_id": sub.plan_id if sub else "plan-starter",
                "plan_name": plan.name if plan else "Standard Plan",
                "status": effective_status,
                "billing_cycle": sub.billing_cycle if sub else "monthly",
                "days_remaining": days_remaining,
                "trial_ends_at": sub.trial_ends_at.isoformat() if sub and sub.trial_ends_at else None,
                "current_period_end": sub.current_period_end.isoformat() if sub and sub.current_period_end else None
            }
        })

    return result

class UpdateCompanyStatusRequest(BaseModel):
    status: str # active, trial, suspended, cancelled

@router.put("/companies/{company_id}/status")
def update_company_status(
    company_id: str,
    req: UpdateCompanyStatusRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Manually change tenant operational status (e.g. suspend or activate)."""
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
    _log_admin_action(db, admin, "update_company_status", company_id, {"new_status": new_status})

    return {
        "success": True,
        "message": f"Company '{comp.name}' status updated to '{new_status}'",
        "company_id": company_id,
        "status": new_status
    }

class ExtendTrialRequest(BaseModel):
    days: int = 14

@router.post("/companies/{company_id}/extend-trial")
def extend_company_trial(
    company_id: str,
    req: ExtendTrialRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Extend trial window for a tenant company."""
    comp = db.query(Company).filter(Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    sub = db.query(TenantSubscription).filter(TenantSubscription.company_id == company_id).first()
    now = datetime.utcnow()
    extend_days = max(1, req.days)

    if not sub:
        sub = TenantSubscription(
            company_id=company_id,
            plan_id="plan-pro",
            status="trialing",
            billing_cycle="monthly",
            trial_start_at=now,
            trial_ends_at=now + timedelta(days=extend_days),
            current_period_start=now,
            current_period_end=now + timedelta(days=extend_days)
        )
        db.add(sub)
    else:
        base_time = sub.trial_ends_at if (sub.trial_ends_at and sub.trial_ends_at > now) else now
        sub.trial_ends_at = base_time + timedelta(days=extend_days)
        sub.current_period_end = sub.trial_ends_at
        sub.status = "trialing"

    comp.status = "active"
    db.commit()
    invalidate_subscription_cache(company_id)
    _log_admin_action(db, admin, "extend_trial", company_id, {"extended_by_days": extend_days, "new_expiry": sub.trial_ends_at.isoformat()})

    return {
        "success": True,
        "message": f"Trial for '{comp.name}' extended by {extend_days} days.",
        "trial_ends_at": sub.trial_ends_at.isoformat()
    }

class AssignPlanRequest(BaseModel):
    plan_id: str
    billing_cycle: str = "monthly"
    status: str = "active"
    months: int = 1

@router.post("/companies/{company_id}/assign-plan")
def assign_subscription_plan(
    company_id: str,
    req: AssignPlanRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Assign or modify subscription plan for a tenant company."""
    comp = db.query(Company).filter(Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == req.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan '{req.plan_id}' not found")

    now = datetime.utcnow()
    period_days = 365 if req.billing_cycle == "annual" else (req.months * 30)

    sub = db.query(TenantSubscription).filter(TenantSubscription.company_id == company_id).first()
    if not sub:
        sub = TenantSubscription(
            company_id=company_id,
            plan_id=plan.id,
            status=req.status,
            billing_cycle=req.billing_cycle,
            current_period_start=now,
            current_period_end=now + timedelta(days=period_days),
            grace_period_end=now + timedelta(days=period_days + 7)
        )
        db.add(sub)
    else:
        sub.plan_id = plan.id
        sub.billing_cycle = req.billing_cycle
        sub.status = req.status
        sub.current_period_start = now
        sub.current_period_end = now + timedelta(days=period_days)
        sub.grace_period_end = now + timedelta(days=period_days + 7)

    comp.status = "active"
    
    # Record transaction
    price = plan.price_annual if req.billing_cycle == "annual" else (plan.price_monthly * req.months)
    txn = PaymentTransaction(
        company_id=company_id,
        subscription_id=sub.id,
        plan_id=plan.id,
        amount=price,
        currency="INR",
        status="success",
        billing_cycle=req.billing_cycle,
        period_start=now,
        period_end=sub.current_period_end,
        payment_method="SuperAdmin Allocation",
        receipt_no=f"SAAS-{datetime.utcnow().strftime('%Y%m%d')}-{company_id[-4:]}"
    )
    db.add(txn)
    db.commit()
    invalidate_subscription_cache(company_id)

    _log_admin_action(db, admin, "assign_plan", company_id, {"plan_id": plan.id, "cycle": req.billing_cycle, "amount": price})

    return {
        "success": True,
        "message": f"Successfully assigned plan '{plan.name}' to '{comp.name}'",
        "plan_name": plan.name,
        "expires_at": sub.current_period_end.isoformat()
    }

@router.get("/plans")
def list_plans(
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """List all available SaaS pricing tiers and features."""
    plans = db.query(SubscriptionPlan).order_by(SubscriptionPlan.display_order.asc()).all()
    return plans

class UpdatePlanRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_monthly: Optional[int] = None
    price_annual: Optional[int] = None
    max_users: Optional[int] = None
    monthly_docs_limit: Optional[int] = None
    is_active: Optional[bool] = None

@router.put("/plans/{plan_id}")
def update_plan(
    plan_id: str,
    req: UpdatePlanRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Update plan pricing and entitlement limits."""
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    if req.name is not None: plan.name = req.name.strip()
    if req.description is not None: plan.description = req.description.strip()
    if req.price_monthly is not None: plan.price_monthly = max(0, req.price_monthly)
    if req.price_annual is not None: plan.price_annual = max(0, req.price_annual)
    if req.max_users is not None: plan.max_users = max(1, req.max_users)
    if req.monthly_docs_limit is not None: plan.monthly_docs_limit = max(10, req.monthly_docs_limit)
    if req.is_active is not None: plan.is_active = req.is_active

    db.commit()
    _log_admin_action(db, admin, "update_plan", details={"plan_id": plan_id})
    return {"success": True, "message": f"Plan '{plan.name}' updated successfully."}

@router.get("/transactions")
def list_transactions(
    limit: int = 50,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """List billing and payment transactions across all tenants."""
    txns = db.query(PaymentTransaction).order_by(PaymentTransaction.created_at.desc()).limit(limit).all()
    comps = {c.id: c.name for c in db.query(Company).all()}
    plans = {p.id: p.name for p in db.query(SubscriptionPlan).all()}

    return [
        {
            "id": t.id,
            "company_id": t.company_id,
            "company_name": comps.get(t.company_id, t.company_id),
            "plan_name": plans.get(t.plan_id, t.plan_id),
            "amount": t.amount,
            "currency": t.currency,
            "status": t.status,
            "payment_method": t.payment_method,
            "receipt_no": t.receipt_no,
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in txns
    ]

@router.get("/audit-logs")
def list_audit_logs(
    limit: int = 50,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """View security and platform management audit logs."""
    logs = db.query(PlatformAuditLog).order_by(PlatformAuditLog.created_at.desc()).limit(limit).all()
    comps = {c.id: c.name for c in db.query(Company).all()}

    return [
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

@router.post("/companies/{company_id}/impersonate-token")
def create_support_impersonation_token(
    company_id: str,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Generate a temporary, audited tenant support token to diagnose customer issues.
    Never gives ordinary users this capability.
    """
    comp = db.query(Company).filter(Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    user = db.query(User).filter(User.company_id == company_id).first()
    uname = user.username if user else f"support-{company_id}"

    token = create_access_token({
        "sub": f"support-{admin.get('user_id', 'super')}",
        "user_id": f"support-{admin.get('user_id', 'super')}",
        "username": uname,
        "email": admin.get("email", "superadmin@texaflow.com"),
        "name": f"Support on behalf of {comp.name}",
        "company_id": company_id,
        "role": "SuperAdmin"
    }, expires_delta_seconds=3600) # 1 hour expiry

    _log_admin_action(db, admin, "support_impersonation_session", company_id, {"expires_in_seconds": 3600})

    return {
        "success": True,
        "message": f"Support session generated for {comp.name} (Valid 1 hour)",
        "token": token,
        "company_id": company_id,
        "company_name": comp.name
    }
