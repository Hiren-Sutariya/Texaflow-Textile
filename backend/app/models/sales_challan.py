from sqlalchemy import Column, String, Float, Text, Integer
from app.core.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin

class SalesChallan(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "08_sales_challans"

    id = Column(String(50), primary_key=True, index=True)
    company_id = Column(String(50), nullable=False, default="comp-001", index=True)
    challan_no = Column(String(50), nullable=False, index=True)  # e.g. "101", "DC-101"
    date = Column(String(20), nullable=False)  # DD-MM-YYYY
    party_name = Column(String(150), nullable=False, index=True)  # Client / Customer Name
    transport = Column(String(100), nullable=True)
    vehicle_no = Column(String(50), nullable=True)
    
    # Line items & summaries
    items = Column(Text, nullable=True)  # JSON-serialized list of line items
    total_item = Column(Float, nullable=True, default=0.0)      # Pieces / Items / Takka
    total_quantity = Column(Float, nullable=True, default=0.0)  # Total Meters / Units
    total_weight = Column(Float, nullable=True, default=0.0)    # KG
    total_cartoon = Column(Float, nullable=True, default=0.0)   # Cartoon / Box count
    total_amount = Column(Float, nullable=False, default=0.0)   # Grand total Rs.
    
    # Terms & billing linkage
    credit_days = Column(Integer, nullable=True, default=30)
    due_date = Column(String(20), nullable=True)
    billing_status = Column(String(20), default="Unbilled")  # Unbilled, Billed
    linked_invoice_no = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
