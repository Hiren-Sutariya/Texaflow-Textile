from sqlalchemy import Column, String, Float, Text
from app.core.database import Base
from app.models.base import TimestampMixin
import uuid

class Party(Base, TimestampMixin):
    __tablename__ = "parties"

    id = Column(String(64), primary_key=True, default=lambda: f"pty-{uuid.uuid4().hex[:12]}")
    name = Column(String(255), nullable=False, unique=True, index=True)
    party_type = Column(String(64), nullable=False, default="Customer", index=True) # Customer, Vendor, Jobworker
    contact_person = Column(String(128), nullable=True)
    phone = Column(String(32), nullable=True)
    gstin = Column(String(32), nullable=True)
    city = Column(String(128), nullable=True)
    address = Column(Text, nullable=True)
    opening_balance = Column(Float, nullable=False, default=0.0)
    current_balance = Column(Float, nullable=False, default=0.0)
