from sqlalchemy import Column, String, Float, DateTime, Text, Integer
from datetime import datetime
from app.core.database import Base

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(String(50), primary_key=True, index=True)
    company_id = Column(String(50), nullable=False, default="comp-001", index=True)
    purchase_no = Column(String(50), index=True)  # e.g. PB-001
    date = Column(String(20), nullable=False)  # DD-MM-YYYY
    vendor_name = Column(String(100), nullable=False)  # Supplier / Mill name
    category = Column(String(50), nullable=False)  # Raw Material & Fabric, Yarn & Threads, Zari, Lace
    items_description = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False, default=0.0)
    payment_status = Column(String(20), default="Pending")  # Paid, Pending
    paid_via = Column(String(50), default="Credit (45 days)")
    payment_terms = Column(String(100), nullable=True, default="Net 45")
    credit_days = Column(Integer, nullable=True, default=45)
    due_date = Column(String(20), nullable=True)  # DD-MM-YYYY
    linked_order = Column(String(100), nullable=True)  # Choli Order #
    bill_image = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
