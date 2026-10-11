from sqlalchemy import Column, String, Float, Text, Date
from app.core.database import Base
from app.models.base import TimestampMixin
import uuid

class Expense(Base, TimestampMixin):
    __tablename__ = "05_expenses"


    id = Column(String(64), primary_key=True, default=lambda: f"exp-{uuid.uuid4().hex[:12]}")
    expense_no = Column(String(64), nullable=False, index=True)
    date = Column(String(16), nullable=False, index=True)
    category = Column(String(128), nullable=False, index=True)
    vendor_name = Column(String(255), nullable=False, index=True)
    invoice_no = Column(String(128), nullable=True)
    paid_via = Column(String(128), nullable=False, default="Current Account HDFC")
    payment_status = Column(String(32), nullable=False, default="Paid", index=True)
    title = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    amount = Column(Float, nullable=False, default=0.0)
    bill_image = Column(Text, nullable=True)
