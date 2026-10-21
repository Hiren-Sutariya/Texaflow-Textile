from sqlalchemy import Column, String, Float, Text
from app.core.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin
import uuid

class Expense(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "03_expenses"

    id = Column(String(64), primary_key=True, default=lambda: f"exp-{uuid.uuid4().hex[:12]}")
    expense_no = Column(String(64), nullable=False, index=True)
    date = Column(String(16), nullable=False, index=True)
    category = Column(String(128), nullable=False, index=True)
    vendor_name = Column(String(255), nullable=True, default="", index=True)
    paid_via = Column(String(128), nullable=False, default="Current Account HDFC")
    payment_status = Column(String(32), nullable=False, default="Paid", index=True)
    notes = Column(Text, nullable=True)
    amount = Column(Float, nullable=False, default=0.0)
    bill_image = Column(Text, nullable=True)
    payment_terms = Column(String(64), nullable=True, default="Due on Receipt")
    credit_days = Column(Float, nullable=True, default=0.0)
    due_date = Column(String(16), nullable=True, index=True)
    linked_order = Column(String(255), nullable=True)
    paid_amount = Column(Float, nullable=True, default=0.0)
    balance_amount = Column(Float, nullable=True, default=0.0)
    company_id = Column(String(64), nullable=False, default="comp-001", index=True)
