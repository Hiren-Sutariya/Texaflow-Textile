from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

def get_engine():
    db_url = settings.DATABASE_URL
    is_sqlite = db_url.startswith("sqlite")
    connect_args = {"check_same_thread": False} if is_sqlite else {}

    try:
        engine = create_engine(
            db_url,
            connect_args=connect_args,
            pool_pre_ping=not is_sqlite,
            **({} if is_sqlite else {"pool_size": 10, "max_overflow": 20})
        )
        return engine
    except Exception as e:
        print(f"⚠️ Notice creating engine with '{db_url}': {e}")
        print("🔄 Falling back to local SQLite database (om_sai.db) for development.")
        return create_engine(
            "sqlite:///./om_sai.db",
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
    """Create only the 5 active database tables matching sidebar sequence."""
    try:
        from app.models.vendor import Vendor
        from app.models.employee import Employee
        from app.models.design import Design
        from app.models.payment import PaymentVoucher
        from app.models.expense import Expense

        active_tables = [
            Vendor.__table__,
            Employee.__table__,
            Design.__table__,
            PaymentVoucher.__table__,
            Expense.__table__,
        ]
        Base.metadata.create_all(bind=engine, tables=active_tables)
        print("✅ Active database tables verified / initialized successfully.")
    except Exception as e:
        print(f"⚠️ Database initialization notice: {e}")

