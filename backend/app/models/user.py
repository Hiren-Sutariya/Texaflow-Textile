from sqlalchemy import Column, String
from app.core.database import Base
from app.models.base import TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "00_auth_users"

    id = Column(String(64), primary_key=True)
    username = Column(String(128), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=True)
    name = Column(String(255), nullable=False, default="Hiren Sutariya")
    password_hash = Column(String(255), nullable=False)
    role = Column(String(64), default="Owner")
    role_title = Column(String(128), default="Proprietor & Director")
    firm_name = Column(String(255), default="Om Sai Enterprises")
    company_id = Column(String(64), nullable=False, default="comp-001", index=True)
