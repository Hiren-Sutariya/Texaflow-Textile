from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Handle SQLite vs PostgreSQL connection arguments
is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=not is_sqlite,
    **({} if is_sqlite else {"pool_size": 10, "max_overflow": 20})
)

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
    """Create all database tables based on registered models."""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables verified / initialized successfully.")
    except Exception as e:
        print(f"⚠️ Database connection notice: {e}")
        print("💡 Ensure your DATABASE_URL in backend/.env is pointing to a reachable Cloud PostgreSQL database.")
