from sqlalchemy import Column, String, Float, Text
from app.core.database import Base
from app.models.base import TimestampMixin
import uuid

class PaymentVoucher(Base, TimestampMixin):
    __tablename__ = "payment_vouchers"

    id = Column(String(64), primary_key=True, default=lambda: f"pay-{uuid.uuid4().hex[:12]}")
    voucher_no = Column(String(64), nullable=False, unique=True, index=True)
    voucher_type = Column(String(32), nullable=False, default="Payment", index=True) # Payment, Receipt
    date = Column(String(16), nullable=False, index=True)
    party_name = Column(String(255), nullable=False, index=True)
    amount = Column(Float, nullable=False, default=0.0)
    payment_mode = Column(String(64), nullable=False, default="Bank Transfer") # Cash, Cheque, UPI, Bank Transfer
    bank_account = Column(String(128), nullable=True)
    reference_no = Column(String(128), nullable=True)
    status = Column(String(32), nullable=False, default="Paid", index=True)
    remarks = Column(Text, nullable=True)
