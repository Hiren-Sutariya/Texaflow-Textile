from sqlalchemy import Column, String, Float, Text, Integer, Boolean
from app.core.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin

class SalesInvoice(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "09_sales_invoices"

    id = Column(String(50), primary_key=True, index=True)
    company_id = Column(String(50), nullable=False, default="comp-001", index=True)
    invoice_no = Column(String(50), nullable=False, index=True)  # e.g. "INV-0001"
    date = Column(String(20), nullable=False)  # DD-MM-YYYY
    customer_name = Column(String(150), nullable=False, index=True)  # Client Name
    customer_gstin = Column(String(50), nullable=True)
    customer_address = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    items_description = Column(String(255), nullable=True)
    is_direct = Column(Boolean, default=True)  # Direct bill or from challan
    
    # Linked challans
    linked_challan_ids = Column(Text, nullable=True)  # JSON-serialized list of IDs
    linked_challan_nos = Column(Text, nullable=True)  # JSON-serialized list of challan nos
    
    # Items & Totals
    items = Column(Text, nullable=True)  # JSON-serialized list of line items
    total_item = Column(Float, nullable=True, default=0.0)
    total_quantity = Column(Float, nullable=True, default=0.0)
    total_weight = Column(Float, nullable=True, default=0.0)
    total_cartoon = Column(Float, nullable=True, default=0.0)
    
    # Tax & Calculations
    subtotal = Column(Float, nullable=False, default=0.0)
    taxable_amount = Column(Float, nullable=False, default=0.0)
    gst_rate = Column(Float, nullable=True, default=5.0)  # 5, 12, 18, 0
    tax_mode = Column(String(20), default="cgst_sgst")    # cgst_sgst, igst, none
    cgst_amount = Column(Float, nullable=True, default=0.0)
    sgst_amount = Column(Float, nullable=True, default=0.0)
    igst_amount = Column(Float, nullable=True, default=0.0)
    discount_rate = Column(Float, nullable=True, default=0.0)
    discount_amount = Column(Float, nullable=True, default=0.0)
    round_off = Column(Float, nullable=True, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)  # Final payable/receivable
    
    # Terms & Status
    place_of_supply = Column(String(100), nullable=True)
    payment_terms = Column(String(100), nullable=True)
    credit_days = Column(Integer, nullable=True, default=30)
    due_date = Column(String(20), nullable=True)
    payment_status = Column(String(20), default="Pending")  # Paid, Pending, Unpaid
    paid_via = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
