from sqlalchemy import Column, String, Float, Boolean, Text, Integer
from app.core.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin

class Party(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "01_parties"

    id = Column(String(64), primary_key=True)
    sr_no = Column(Integer, nullable=True)
    account_type = Column(String(64), nullable=False, default="Supplier / Vendor")
    salutation = Column(String(16), nullable=True, default="MR.")
    first_name = Column(String(128), nullable=True)
    last_name = Column(String(128), nullable=True)
    company_name = Column(String(255), nullable=False, index=True)
    display_name = Column(String(255), nullable=False, index=True)
    email = Column(String(128), nullable=True)
    gstin = Column(String(32), nullable=True, index=True)
    work_phone = Column(String(32), nullable=True)
    mobile = Column(String(32), nullable=True, default="")
    pan = Column(String(32), nullable=True)
    is_msme = Column(Boolean, default=False)
    payment_terms = Column(String(64), nullable=True, default="Net 30")
    opening_balance = Column(Float, default=0.0)
    city = Column(String(128), nullable=True)
    billing_address = Column(Text, nullable=True)
    shipping_address = Column(Text, nullable=True)
    bank_details = Column(Text, nullable=True)
    contact_persons = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    company_id = Column(String(64), nullable=False, default="comp-001", index=True)

Vendor = Party
