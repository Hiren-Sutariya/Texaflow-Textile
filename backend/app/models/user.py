import uuid
from sqlalchemy import Column, String, Boolean
from app.core.database import Base
from app.models.base import TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "00_auth_users"

    id = Column(String(64), primary_key=True, default=lambda: f"usr-{uuid.uuid4().hex[:12]}")
    firm_name = Column(String(255), default="Om Sai Enterprise")
    name = Column(String(255), nullable=False, default="Hiren Sutariya")
    email = Column(String(255), nullable=True)
    username = Column(String(128), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False, default="Owner", index=True) # SuperAdmin, Owner, Admin, Accountant, Manager, Employee
    is_active = Column(Boolean, nullable=False, default=True)
    company_id = Column(String(64), nullable=False, default="comp-001", index=True)
