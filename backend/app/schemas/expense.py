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
    payment_terms: Optional[str] = "Due on Receipt"
    credit_days: Optional[float] = 0.0
    due_date: Optional[str] = None
    linked_order: Optional[str] = None
    paid_amount: Optional[float] = 0.0
    balance_amount: Optional[float] = 0.0
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
    payment_terms: Optional[str] = None
    credit_days: Optional[float] = None
    due_date: Optional[str] = None
    linked_order: Optional[str] = None
    paid_amount: Optional[float] = None
    balance_amount: Optional[float] = None

class ExpenseResponse(ExpenseBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
