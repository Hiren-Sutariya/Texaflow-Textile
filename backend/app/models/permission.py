from sqlalchemy import Column, String, Boolean, JSON, DateTime, Integer, Text, UniqueConstraint
from app.core.database import Base
from app.models.base import TimestampMixin
import uuid

# The 5 Predefined, Fixed Company Roles mandated by Architecture
FIXED_ROLES = ["OWNER", "ADMIN", "ACCOUNTANT", "MANAGER", "EMPLOYEE"]

# Complete List of Core Platform Modules
PLATFORM_MODULES = [
    {"key": "dashboard", "label": "Owner Command Center", "category": "Core"},
    {"key": "parties", "label": "Parties & Vendors Directory", "category": "Masters"},
    {"key": "workers", "label": "Staff & Karigars", "category": "HRMS"},
    {"key": "attendance", "label": "Karigar Attendance", "category": "HRMS"},
    {"key": "worker_payout", "label": "Worker Salary & Payout Ledger", "category": "HRMS"},
    {"key": "expenses", "label": "Factory & Overhead Expenses", "category": "Finance"},
    {"key": "purchases", "label": "Purchases & Inward Invoices", "category": "Finance"},
    {"key": "sales_challans", "label": "Sales Delivery Challans", "category": "Operations"},
    {"key": "sales_invoices", "label": "Sales / Tax Invoices", "category": "Finance"},
    {"key": "payments", "label": "Payments & Receipt Vouchers", "category": "Finance"},
    {"key": "daybook", "label": "Day Book Cash/Bank", "category": "Accounting"},
    {"key": "ledger", "label": "General Ledger & Accounts", "category": "Accounting"},
    {"key": "designs", "label": "Design & Jacquard Library", "category": "Operations"},
    {"key": "reports", "label": "Reports & Analytics", "category": "Executive"},
    {"key": "recycle_bin", "label": "Recycle Bin & Data Vault", "category": "System"},
    {"key": "settings", "label": "Company Settings", "category": "System"},
]

class CompanyModuleSetting(Base, TimestampMixin):
    """
    Level 1: Company-Level Module Activation.
    Super Admin can selectively enable/disable entire modules per company.
    """
    __tablename__ = "00_saas_company_modules"

    id = Column(String(64), primary_key=True, default=lambda: f"mod-{uuid.uuid4().hex[:12]}")
    company_id = Column(String(64), nullable=False, index=True)
    module_key = Column(String(64), nullable=False, index=True)
    is_enabled = Column(Boolean, nullable=False, default=True)
    configured_by = Column(String(64), nullable=True) # SuperAdmin ID

    __table_args__ = (
        UniqueConstraint("company_id", "module_key", name="uq_company_module"),
    )

class RolePermissionSetting(Base, TimestampMixin):
    """
    Level 2 & 3: Role & Action Permissions (View, Create, Edit, Delete, Export, Approve, Print).
    Can be configured as a platform default (company_id='*') or per-company override.
    """
    __tablename__ = "00_saas_role_permissions"

    id = Column(String(64), primary_key=True, default=lambda: f"perm-{uuid.uuid4().hex[:12]}")
    company_id = Column(String(64), nullable=False, default="*", index=True) # '*' means platform default
    role = Column(String(32), nullable=False, index=True) # OWNER, ADMIN, ACCOUNTANT, MANAGER, EMPLOYEE
    module_key = Column(String(64), nullable=False, index=True)

    can_view = Column(Boolean, nullable=False, default=True)
    can_create = Column(Boolean, nullable=False, default=False)
    can_edit = Column(Boolean, nullable=False, default=False)
    can_delete = Column(Boolean, nullable=False, default=False)
    can_export = Column(Boolean, nullable=False, default=False)
    can_approve = Column(Boolean, nullable=False, default=False)
    can_print = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        UniqueConstraint("company_id", "role", "module_key", name="uq_company_role_module_perm"),
    )

class FieldPermissionSetting(Base, TimestampMixin):
    """
    Level 4: Field-Level Visibility & Mutability.
    Enforces which fields a role can see or edit.
    Values: 'editable', 'read_only', 'hidden', 'not_permitted_update'.
    """
    __tablename__ = "00_saas_field_permissions"

    id = Column(String(64), primary_key=True, default=lambda: f"fld-{uuid.uuid4().hex[:12]}")
    company_id = Column(String(64), nullable=False, default="*", index=True) # '*' means platform default
    role = Column(String(32), nullable=False, index=True)
    entity_type = Column(String(64), nullable=False, index=True) # e.g. sales_invoice, purchase, expense, party
    field_name = Column(String(64), nullable=False, index=True) # e.g. profit_margin, outstanding_amount

    # 'editable' (can view and edit), 'read_only' (can view, cannot edit),
    # 'hidden' (backend strips it from JSON), 'not_permitted_update' (cannot be modified)
    permission = Column(String(32), nullable=False, default="editable")

    __table_args__ = (
        UniqueConstraint("company_id", "role", "entity_type", "field_name", name="uq_field_permission"),
    )

class SupportSession(Base, TimestampMixin):
    """
    Super Admin Audited Support Session / Impersonation.
    Requires explicit reason, time-limited token, and immediate revocation.
    """
    __tablename__ = "00_saas_support_sessions"

    id = Column(String(64), primary_key=True, default=lambda: f"supp-{uuid.uuid4().hex[:12]}")
    admin_id = Column(String(64), nullable=False, index=True)
    admin_email = Column(String(128), nullable=False)
    target_company_id = Column(String(64), nullable=False, index=True)
    reason = Column(Text, nullable=False) # Mandatory justification
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    session_token = Column(Text, nullable=False, unique=True, index=True)
    metadata_json = Column(JSON, nullable=True)
