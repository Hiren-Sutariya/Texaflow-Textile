from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ExpenseBase(BaseModel):
    id: Optional[str] = None
    expense_no: Optional[str] = None
    date: str = Field(..., description="Voucher date in DD-MM-YYYY or YYYY-MM-DD")
    category: str = Field(..., description="Category of expense")
    vendor_name: Optional[str] = Field(default=None, description="Vendor or Payee Name")
    paid_via: str = Field(default="Current Account HDFC")
    payment_status: str = Field(default="Paid")
    notes: Optional[str] = None
    amount: float = Field(..., gt=0, description="Amount in INR")
    bill_image: Optional[str] = None
    company_id: Optional[str] = "comp-001"

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    date: Optional[str] = None
    category: Optional[str] = None
    vendor_name: Optional[str] = None
    paid_via: Optional[str] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None
    amount: Optional[float] = None
    bill_image: Optional[str] = None

class ExpenseResponse(ExpenseBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
