from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

def get_engine():
    db_url = settings.DATABASE_URL
    is_sqlite = db_url.startswith("sqlite")
    connect_args = {"check_same_thread": False} if is_sqlite else {
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 3
    }

    try:
        engine = create_engine(
            db_url,
            connect_args=connect_args,
            pool_pre_ping=True,
            pool_recycle=120,
            pool_timeout=15,
            **({} if is_sqlite else {"pool_size": 10, "max_overflow": 20})
        )
        return engine
    except Exception as e:
        print(f"❌ Critical error creating database engine for '{db_url}': {e}")
        # Only fall back to transient in-memory database in explicit local test mode
        import os
        if os.getenv("TESTING") == "1" or is_sqlite:
            print("🔄 Falling back to transient in-memory SQLite database for test runner.")
            return create_engine(
                "sqlite:///:memory:",
                connect_args={"check_same_thread": False}
            )
        raise RuntimeError(f"Database connection failed: {e}")

engine = get_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency to inject DB session into FastAPI route handlers."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all active database tables and seed initial defaults if needed."""
    try:
        from app.models.settings import Settings
        from app.models.party import Party
        from app.models.worker import Worker
        from app.models.payment import PaymentVoucher
        from app.models.expense import Expense
        from app.models.purchase import Purchase
        from app.models.category import Category
        from app.models.design import Design
        from app.models.user import User
        from app.models.subscription import SubscriptionPlan, TenantSubscription, PaymentTransaction, PlatformAuditLog
        from datetime import datetime, timedelta
        import secrets, hashlib

        from app.models.sales_challan import SalesChallan
        from app.models.sales_invoice import SalesInvoice
        from app.models.permission import (
            CompanyModuleSetting, RolePermissionSetting, FieldPermissionSetting,
            SupportSession, PLATFORM_MODULES, FIXED_ROLES
        )
        from app.models.subscription import BillingInvoice

        active_tables = [
            User.__table__,                 # 00_auth_users
            Settings.__table__,             # 00_settings
            SubscriptionPlan.__table__,     # 00_saas_plans
            TenantSubscription.__table__,   # 00_saas_subscriptions
            PaymentTransaction.__table__,   # 00_saas_payments
            PlatformAuditLog.__table__,     # 00_saas_audit_logs
            BillingInvoice.__table__,       # 00_saas_invoices
            CompanyModuleSetting.__table__, # 00_saas_company_modules
            RolePermissionSetting.__table__,# 00_saas_role_permissions
            FieldPermissionSetting.__table__,# 00_saas_field_permissions
            SupportSession.__table__,       # 00_saas_support_sessions
            Party.__table__,                # 01_parties
            Worker.__table__,               # 02_workers
            Expense.__table__,              # 03_expenses
            Purchase.__table__,             # 04_purchases
            PaymentVoucher.__table__,       # 05_payments
            Category.__table__,             # 06_categories
            Design.__table__,               # 07_design_library
            SalesChallan.__table__,         # 08_sales_challans
            SalesInvoice.__table__,         # 09_sales_invoices
        ]
        Base.metadata.create_all(bind=engine, tables=active_tables)
        print("✅ All 20 active SaaS & ERP database tables verified / initialized successfully.")

        # Safe non-destructive column migrations for existing tables
        with engine.connect() as conn:
            try:
                from sqlalchemy import text
                conn.execute(text('ALTER TABLE "00_auth_users" ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT \'Owner\';'))
                conn.execute(text('ALTER TABLE "00_auth_users" ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;'))
                conn.execute(text('ALTER TABLE "09_sales_invoices" ADD COLUMN IF NOT EXISTS paid_amount FLOAT DEFAULT 0.0;'))
                conn.execute(text('ALTER TABLE "09_sales_invoices" ADD COLUMN IF NOT EXISTS outstanding_amount FLOAT DEFAULT 0.0;'))
                conn.execute(text('ALTER TABLE "09_sales_invoices" ADD COLUMN IF NOT EXISTS profit_margin FLOAT DEFAULT 0.0;'))
                conn.commit()
            except Exception as mig_err:
                print(f"⚠️ Safe column migration notice: {mig_err}")

        db = SessionLocal()
        try:
            # 1. Ensure default company settings exist
            company = db.query(Settings).filter(Settings.id == "comp-001").first()
            if not company:
                default_company = Settings(
                    id="comp-001",
                    name="Shiv Creation",
                    code="SHIV-01",
                    owner_name="Hiren Sutariya",
                    phone="9876543210",
                    email="owner@shivcreation.com",
                    brand_name="Shiv Creation",
                    address="Plot 12-14, Industrial Estate, Pandesara GIDC",
                    city_state="Surat, Gujarat",
                    pincode="394221",
                    gstin="24AAACS1234A1Z5",
                    pan="AAACS1234A",
                    status="active",
                    invoice_title="TAX INVOICE",
                    challan_title="DELIVERY CHALLAN",
                    invoice_prefix="INV-26-",
                    next_invoice_no="1001",
                    challan_prefix="DC-26-",
                    next_challan_no="501",
                    hsn_sac_code="5810",
                    gst_rate="5%",
                    payment_terms="Net 30 Days",
                    signatory_label="For Shiv Creation, Authorized Signatory",
                    eway_threshold="50000",
                    print_qr=True,
                    terms_conditions="1. Goods once sold will not be taken back.\\n2. Interest @ 18% p.a. will be charged for delayed payments.\\n3. Subject to Surat jurisdiction only."
                )
                db.add(default_company)
                db.commit()
                print("✅ Default company settings initialized (comp-001 / Shiv Creation)")

            # 2. Ensure Om Sai Enterprise (OSE House / comp-002) exists
            ose_company = db.query(Settings).filter(Settings.id == "comp-002").first()
            if not ose_company:
                ose_default = Settings(
                    id="comp-002",
                    name="Om Sai Enterprise - OSE House",
                    code="OSE-01",
                    owner_name="Nilesh Sutariya",
                    phone="9825123456",
                    email="nilesh@omsai.com",
                    address="Plot 104, Road No 4, Sachin GIDC, Surat, Gujarat 394230",
                    gstin="24AABCO1234F1Z8",
                    bank_name="State Bank of India",
                    account_no="38920194819",
                    ifsc="SBIN0001234",
                    branch_name="Sachin GIDC Surat",
                    upi_id="omsai@sbi",
                    status="active",
                    print_qr=True,
                    terms_conditions="1. Goods once sold will not be taken back.\n2. Subject to Surat jurisdiction only."
                )
                db.add(ose_default)
                db.commit()
                print("✅ Default company settings initialized (comp-002 / Om Sai Enterprise)")

            # 3. Ensure default categories exist (Only expenses by default)
            if db.query(Category).count() == 0:
                default_categories = [
                    # Expenses (Only default categories)
                    Category(id="cat-exp-1", company_id="comp-001", name="Karigar Salary", module="expense", is_system=True),
                    Category(id="cat-exp-2", company_id="comp-001", name="Electricity & Power", module="expense", is_system=True),
                    Category(id="cat-exp-3", company_id="comp-001", name="Worker Advance / Upad", module="expense", is_system=True),
                    Category(id="cat-exp-4", company_id="comp-001", name="Machine Maintenance & Repairs", module="expense", is_system=True),
                    Category(id="cat-exp-5", company_id="comp-001", name="Packaging Materials", module="expense", is_system=True),
                    Category(id="cat-exp-6", company_id="comp-001", name="Dhaga & Consumables", module="expense", is_system=True),
                    Category(id="cat-exp-7", company_id="comp-001", name="Logistics & Courier", module="expense", is_system=True),
                ]
                db.add_all(default_categories)
                db.commit()
                print("✅ Default expense categories seeded.")

            # 4. Ensure default SaaS subscription plans exist
            if db.query(SubscriptionPlan).count() == 0:
                default_plans = [
                    SubscriptionPlan(
                        id="plan-starter",
                        name="Starter Jobwork Edition",
                        code="starter",
                        description="Essential jobwork, challans, parties and cash book for small textile units.",
                        price_monthly=999,
                        price_annual=9999,
                        max_users=3,
                        max_storage_mb=1024,
                        monthly_docs_limit=500,
                        allow_hrms=False,
                        allow_custom_print=True,
                        allow_export_reports=True,
                        allow_api_access=False,
                        features_json=[
                            "Up to 3 Team Members",
                            "500 Invoices & Challans / month",
                            "Parties & Vendors Ledger",
                            "Day Book & Cash Flow",
                            "Recycle Bin Data Protection (30 Days)"
                        ],
                        display_order=1
                    ),
                    SubscriptionPlan(
                        id="plan-pro",
                        name="Professional Weaving & Embroidery",
                        code="professional",
                        description="Complete enterprise manufacturing suite with worker attendance and payroll.",
                        price_monthly=2499,
                        price_annual=24999,
                        max_users=10,
                        max_storage_mb=5120,
                        monthly_docs_limit=2500,
                        allow_hrms=True,
                        allow_custom_print=True,
                        allow_export_reports=True,
                        allow_api_access=False,
                        features_json=[
                            "Up to 10 Team Members",
                            "2,500 Invoices & Challans / month",
                            "Full HRMS, Attendance & Salary Payout",
                            "Design Library Master Management",
                            "GST Tax Reports & Multi-device Access",
                            "Priority Email & WhatsApp Support"
                        ],
                        display_order=2
                    ),
                    SubscriptionPlan(
                        id="plan-enterprise",
                        name="Enterprise OSE House Edition",
                        code="enterprise",
                        description="Unlimited multi-branch powerhouse for large textile conglomerates & exporters.",
                        price_monthly=4999,
                        price_annual=49999,
                        max_users=999,
                        max_storage_mb=51200,
                        monthly_docs_limit=999999,
                        allow_hrms=True,
                        allow_custom_print=True,
                        allow_export_reports=True,
                        allow_api_access=True,
                        features_json=[
                            "Unlimited Team Members & Roles",
                            "Unlimited Monthly Documents",
                            "Advanced Financial Analytics & Audits",
                            "Custom Print Templates & QR Codes",
                            "Multi-tenant Cloud Resilience & API Access",
                            "24/7 Dedicated Account Manager"
                        ],
                        display_order=3
                    )
                ]
                db.add_all(default_plans)
                db.commit()
                print("✅ Default SaaS subscription plans seeded (Starter, Professional, Enterprise).")

            # 5. Ensure Super Admin account exists
            super_admin = db.query(User).filter(User.role == "SuperAdmin").first()
            if not super_admin:
                salt = secrets.token_hex(16)
                key = hashlib.pbkdf2_hmac("sha256", "SuperAdmin@2026".encode("utf-8"), salt.encode("utf-8"), 100000)
                pw_hash = f"{salt}:{key.hex()}"
                
                super_user = User(
                    id="usr-super-001",
                    firm_name="TexaFlow SaaS Cloud Platform",
                    name="SaaS Super Administrator",
                    email="superadmin@texaflow.com",
                    username="superadmin",
                    password_hash=pw_hash,
                    role="SuperAdmin",
                    is_active=True,
                    company_id="comp-platform"
                )
                db.add(super_user)
                db.commit()
                print("✅ SaaS Super Administrator seeded (username: superadmin).")

            # 6. Ensure default enterprise subscriptions exist for existing active tenants
            all_companies = db.query(Settings).all()
            for comp in all_companies:
                existing_sub = db.query(TenantSubscription).filter(TenantSubscription.company_id == comp.id).first()
                if not existing_sub:
                    now = datetime.utcnow()
                    new_sub = TenantSubscription(
                        id=f"sub-{comp.id}",
                        company_id=comp.id,
                        plan_id="plan-enterprise",
                        status="active",
                        billing_cycle="annual",
                        current_period_start=now,
                        current_period_end=now + timedelta(days=365),
                        grace_period_end=now + timedelta(days=372),
                        notes="Grandfathered Enterprise SaaS license for verified anchor tenant."
                    )
                    db.add(new_sub)
            db.commit()
            print("✅ Tenant subscriptions verified / initialized for all active companies.")

            # 7. Seed Platform Default Role Permissions (company_id='*')
            if db.query(RolePermissionSetting).filter(RolePermissionSetting.company_id == "*").count() == 0:
                print("🔄 Seeding platform default role permission matrix...")
                default_perms = []
                for mod in PLATFORM_MODULES:
                    mkey = mod["key"]
                    # OWNER: Everything
                    default_perms.append(RolePermissionSetting(
                        id=f"perm-def-owner-{mkey}", company_id="*", role="OWNER", module_key=mkey,
                        can_view=True, can_create=True, can_edit=True, can_delete=True,
                        can_export=True, can_approve=True, can_print=True
                    ))
                    # ADMIN: Operational everything except system/platform
                    default_perms.append(RolePermissionSetting(
                        id=f"perm-def-admin-{mkey}", company_id="*", role="ADMIN", module_key=mkey,
                        can_view=True, can_create=True, can_edit=True, can_delete=True,
                        can_export=True, can_approve=True, can_print=True
                    ))
                    # ACCOUNTANT: Finance & Accounting modules
                    is_fin = mkey in ("purchases", "expenses", "sales_invoices", "payments", "daybook", "ledger", "reports", "parties")
                    is_view_only = mkey in ("workers", "attendance", "designs", "sales_challans", "dashboard")
                    default_perms.append(RolePermissionSetting(
                        id=f"perm-def-acct-{mkey}", company_id="*", role="ACCOUNTANT", module_key=mkey,
                        can_view=is_fin or is_view_only,
                        can_create=is_fin,
                        can_edit=is_fin,
                        can_delete=False,
                        can_export=is_fin,
                        can_approve=is_fin,
                        can_print=is_fin or is_view_only
                    ))
                    # MANAGER: HRMS, Workers, Attendance, Operations
                    is_mgr = mkey in ("workers", "attendance", "worker_payout", "purchases", "sales_challans", "designs", "dashboard", "parties")
                    default_perms.append(RolePermissionSetting(
                        id=f"perm-def-mgr-{mkey}", company_id="*", role="MANAGER", module_key=mkey,
                        can_view=is_mgr,
                        can_create=is_mgr,
                        can_edit=is_mgr,
                        can_delete=False,
                        can_export=is_mgr,
                        can_approve=is_mgr,
                        can_print=is_mgr
                    ))
                    # EMPLOYEE: Very restricted assigned duties
                    is_emp = mkey in ("dashboard", "attendance", "sales_challans")
                    default_perms.append(RolePermissionSetting(
                        id=f"perm-def-emp-{mkey}", company_id="*", role="EMPLOYEE", module_key=mkey,
                        can_view=is_emp,
                        can_create=mkey in ("attendance", "sales_challans"),
                        can_edit=False,
                        can_delete=False,
                        can_export=False,
                        can_approve=False,
                        can_print=mkey == "sales_challans"
                    ))
                db.add_all(default_perms)
                db.commit()
                print("✅ Platform default role permissions initialized successfully.")

            # 8. Seed Platform Default Field-Level Permissions (company_id='*')
            if db.query(FieldPermissionSetting).filter(FieldPermissionSetting.company_id == "*").count() == 0:
                print("🔄 Seeding platform default field-level permission templates...")
                field_rules = [
                    # Sales Invoice Field Rules
                    ("sales_invoice", "profit_margin", {"OWNER": "editable", "ADMIN": "read_only", "ACCOUNTANT": "hidden", "MANAGER": "hidden", "EMPLOYEE": "hidden"}),
                    ("sales_invoice", "outstanding_amount", {"OWNER": "read_only", "ADMIN": "read_only", "ACCOUNTANT": "read_only", "MANAGER": "hidden", "EMPLOYEE": "hidden"}),
                    ("sales_invoice", "internal_notes", {"OWNER": "editable", "ADMIN": "editable", "ACCOUNTANT": "editable", "MANAGER": "read_only", "EMPLOYEE": "hidden"}),
                    ("sales_invoice", "paid_amount", {"OWNER": "editable", "ADMIN": "editable", "ACCOUNTANT": "editable", "MANAGER": "read_only", "EMPLOYEE": "hidden"}),
                    ("sales_invoice", "discount", {"OWNER": "editable", "ADMIN": "editable", "ACCOUNTANT": "read_only", "MANAGER": "hidden", "EMPLOYEE": "hidden"}),
                    # Expense Field Rules
                    ("expense", "internal_notes", {"OWNER": "editable", "ADMIN": "editable", "ACCOUNTANT": "editable", "MANAGER": "read_only", "EMPLOYEE": "hidden"}),
                    ("expense", "amount", {"OWNER": "editable", "ADMIN": "editable", "ACCOUNTANT": "editable", "MANAGER": "read_only", "EMPLOYEE": "read_only"}),
                    # Purchase Field Rules
                    ("purchase", "cost_breakdown", {"OWNER": "editable", "ADMIN": "editable", "ACCOUNTANT": "editable", "MANAGER": "hidden", "EMPLOYEE": "hidden"}),
                    # Party Field Rules
                    ("party", "credit_limit", {"OWNER": "editable", "ADMIN": "editable", "ACCOUNTANT": "read_only", "MANAGER": "hidden", "EMPLOYEE": "hidden"}),
                ]
                default_field_perms = []
                for entity, fld, role_map in field_rules:
                    for role, perm in role_map.items():
                        default_field_perms.append(FieldPermissionSetting(
                            id=f"fld-def-{entity}-{fld}-{role.lower()}",
                            company_id="*",
                            role=role,
                            entity_type=entity,
                            field_name=fld,
                            permission=perm
                        ))
                db.add_all(default_field_perms)
                db.commit()
                print("✅ Platform default field-level permissions initialized successfully.")
        finally:
            db.close()
    except Exception as e:
        print(f"⚠️ Database initialization notice: {e}")
