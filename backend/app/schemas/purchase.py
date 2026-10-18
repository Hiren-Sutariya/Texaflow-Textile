from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PurchaseBase(BaseModel):
    purchase_no: Optional[str] = None
    date: str
    vendor_name: str
    category: str
    items_description: Optional[str] = None
    amount: float
    payment_status: Optional[str] = "Pending"
    paid_via: Optional[str] = "Credit (45 days)"
    payment_terms: Optional[str] = "Net 45"
    credit_days: Optional[int] = 45
    due_date: Optional[str] = None
    linked_order: Optional[str] = None
    bill_image: Optional[str] = None
    notes: Optional[str] = None

class PurchaseCreate(PurchaseBase):
    pass

class PurchaseUpdate(BaseModel):
    purchase_no: Optional[str] = None
    date: Optional[str] = None
    vendor_name: Optional[str] = None
    category: Optional[str] = None
    items_description: Optional[str] = None
    amount: Optional[float] = None
    payment_status: Optional[str] = None
    paid_via: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_days: Optional[int] = None
    due_date: Optional[str] = None
    linked_order: Optional[str] = None
    bill_image: Optional[str] = None
    notes: Optional[str] = None

class PurchaseResponse(PurchaseBase):
    id: str
    company_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
