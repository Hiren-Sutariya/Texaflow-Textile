from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON, DateTime
from app.core.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin
import uuid
from datetime import datetime

class SubscriptionPlan(Base, TimestampMixin):
    """SaaS Subscription Tier Plan (Starter, Professional, Enterprise)."""
    __tablename__ = "00_saas_plans"

    id = Column(String(64), primary_key=True) # e.g. plan-starter, plan-pro, plan-enterprise
    name = Column(String(128), nullable=False) # e.g. "Professional Weaving & Embroidery"
    code = Column(String(64), unique=True, nullable=False, index=True) # starter, professional, enterprise
    description = Column(Text, nullable=True)
    price_monthly = Column(Integer, nullable=False, default=1999) # in INR
    price_annual = Column(Integer, nullable=False, default=19999) # in INR
    currency = Column(String(16), nullable=False, default="INR")
    
    # Feature Entitlements & Limits
    max_users = Column(Integer, nullable=False, default=5)
    max_storage_mb = Column(Integer, nullable=False, default=2048) # 2GB
    monthly_docs_limit = Column(Integer, nullable=False, default=1000) # Invoices/Challans per month
    allow_hrms = Column(Boolean, default=True)
    allow_custom_print = Column(Boolean, default=True)
    allow_export_reports = Column(Boolean, default=True)
    allow_api_access = Column(Boolean, default=False)
    features_json = Column(JSON, nullable=True) # list of highlight features
    
    is_active = Column(Boolean, default=True, index=True)
    display_order = Column(Integer, default=1)

class TenantSubscription(Base, TimestampMixin):
    """Active or historic subscription bound to a tenant company."""
    __tablename__ = "00_saas_subscriptions"

    id = Column(String(64), primary_key=True, default=lambda: f"sub-{uuid.uuid4().hex[:12]}")
    company_id = Column(String(64), unique=True, nullable=False, index=True) # 1-to-1 active sub per company
    plan_id = Column(String(64), nullable=False, index=True)
    
    # Status: trialing, active, past_due, grace_period, suspended, expired, cancelled
    status = Column(String(32), nullable=False, default="trialing", index=True)
    billing_cycle = Column(String(16), nullable=False, default="monthly") # monthly, annual, custom
    
    trial_start_at = Column(DateTime, nullable=True)
    trial_ends_at = Column(DateTime, nullable=True)
    current_period_start = Column(DateTime, nullable=False, default=datetime.utcnow)
    current_period_end = Column(DateTime, nullable=False)
    grace_period_end = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    external_provider = Column(String(32), default="manual") # manual, razorpay, stripe
    external_subscription_id = Column(String(128), nullable=True)
    external_customer_id = Column(String(128), nullable=True)
    notes = Column(Text, nullable=True)

class PaymentTransaction(Base, TimestampMixin):
    """Payment record / invoice for SaaS subscription fees."""
    __tablename__ = "00_saas_payments"

    id = Column(String(64), primary_key=True, default=lambda: f"txn-{uuid.uuid4().hex[:12]}")
    company_id = Column(String(64), nullable=False, index=True)
    subscription_id = Column(String(64), nullable=True, index=True)
    plan_id = Column(String(64), nullable=False)
    
    amount = Column(Integer, nullable=False) # In INR rupees
    currency = Column(String(16), nullable=False, default="INR")
    status = Column(String(32), nullable=False, default="success", index=True) # success, pending, failed, refunded
    
    billing_cycle = Column(String(16), default="monthly")
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
    
    payment_method = Column(String(64), default="UPI / Bank Transfer") # Razorpay, NetBanking, UPI, Card, Cash
    provider = Column(String(32), default="manual")
    provider_payment_id = Column(String(128), nullable=True, index=True)
    provider_order_id = Column(String(128), nullable=True)
    idempotency_key = Column(String(128), unique=True, nullable=True, index=True)
    receipt_no = Column(String(64), nullable=True)
    notes = Column(Text, nullable=True)

class PlatformAuditLog(Base, TimestampMixin):
    """Platform-level audit trail for sensitive Super Admin operations."""
    __tablename__ = "00_saas_audit_logs"

    id = Column(String(64), primary_key=True, default=lambda: f"log-{uuid.uuid4().hex[:12]}")
    actor_id = Column(String(64), nullable=False, index=True) # User ID who performed the action
    actor_email = Column(String(128), nullable=True)
    actor_role = Column(String(32), default="SuperAdmin")
    action = Column(String(64), nullable=False, index=True) # e.g. extend_trial, suspend_company, change_plan
    target_company_id = Column(String(64), nullable=True, index=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(64), nullable=True)
