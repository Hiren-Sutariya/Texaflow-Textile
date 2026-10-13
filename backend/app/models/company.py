from sqlalchemy import Column, String, Text
from app.core.database import Base
from app.models.base import TimestampMixin

class Company(Base, TimestampMixin):
    __tablename__ = "00_companies"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    code = Column(String(64), unique=True, nullable=False, index=True)
    owner_name = Column(String(255), nullable=False)
    phone = Column(String(32), nullable=True)
    email = Column(String(128), nullable=True)
    address = Column(Text, nullable=True)
    gstin = Column(String(32), nullable=True)
    status = Column(String(32), nullable=False, default="active")
