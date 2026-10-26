from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

def get_engine():
    db_url = settings.DATABASE_URL
    is_sqlite = db_url.startswith("sqlite")
    connect_args = {"check_same_thread": False} if is_sqlite else {
        "connect_timeout": 3,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 3
    }

    try:
        engine = create_engine(
            db_url,
            connect_args=connect_args,
            pool_pre_ping=False,
            pool_recycle=120,
            pool_timeout=5,
            **({} if is_sqlite else {"pool_size": 10, "max_overflow": 20})
        )
        return engine
    except Exception as e:
        print(f"⚠️ Notice creating engine with '{db_url}': {e}")
        print("🔄 Falling back to transient in-memory SQLite database for testing.")
        return create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False}
        )

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
        from app.models.user import User

        from app.models.sales_challan import SalesChallan
        from app.models.sales_invoice import SalesInvoice

        active_tables = [
            User.__table__,           # 00_auth_users
            Settings.__table__,       # 00_settings
            Party.__table__,          # 01_parties
            Worker.__table__,         # 02_workers
            Expense.__table__,        # 03_expenses
            Purchase.__table__,       # 04_purchases
            PaymentVoucher.__table__, # 05_payments
            Category.__table__,       # 06_categories
            SalesChallan.__table__,   # 08_sales_challans
            SalesInvoice.__table__,   # 09_sales_invoices
        ]
        Base.metadata.create_all(bind=engine, tables=active_tables)
        print("✅ All 10 active database tables verified / initialized successfully.")

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
        finally:
            db.close()
    except Exception as e:
        print(f"⚠️ Database initialization notice: {e}")
