from sqlalchemy import Column, String, Float, Text, Integer
from app.core.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin

class Purchase(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "04_purchases"

    id = Column(String(50), primary_key=True, index=True)
    company_id = Column(String(50), nullable=False, default="comp-001", index=True)
    purchase_no = Column(String(50), index=True)  # e.g. PB-001
    date = Column(String(20), nullable=False)  # DD-MM-YYYY
    vendor_name = Column(String(100), nullable=False)  # Supplier / Mill name
    category = Column(String(50), nullable=False)  # Raw Material & Fabric, Yarn & Threads, Zari, Lace
    items_description = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False, default=0.0)
    tax_mode = Column(String(20), default="none")  # none, cgst_sgst, igst
    tax_rate = Column(Float, default=0.0)          # 5.0, 12.0, 18.0 etc.
    cgst_amount = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    igst_amount = Column(Float, default=0.0)
    payment_status = Column(String(20), default="Pending")  # Paid, Pending
    credit_days = Column(Integer, nullable=True, default=45)
    items = Column(Text, nullable=True)  # JSON-serialized list of line items
    notes = Column(Text, nullable=True)


