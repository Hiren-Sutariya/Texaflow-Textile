from pydantic import BaseModel, field_validator
from typing import Optional, Any
from datetime import datetime
import json

class PurchaseBase(BaseModel):
    purchase_no: Optional[str] = None
    date: str
    vendor_name: str
    category: str
    items_description: Optional[str] = None
    items: Optional[Any] = None
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
    items: Optional[Any] = None
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
    items: Optional[Any] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("items", mode="before")
    @classmethod
    def parse_items_json(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return v
        return v

    class Config:
        from_attributes = True

