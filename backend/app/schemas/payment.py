from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PaymentVoucherBase(BaseModel):
    voucher_no: Optional[str] = None
    voucher_type: str = Field(default="Payment")
    date: str
    party_name: str
    amount: float = Field(..., gt=0)
    payment_mode: str = Field(default="Bank Transfer")
    bank_account: Optional[str] = None
    reference_no: Optional[str] = None
    status: str = Field(default="Paid")
    remarks: Optional[str] = None

class PaymentVoucherCreate(PaymentVoucherBase):
    pass

class PaymentVoucherResponse(PaymentVoucherBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
