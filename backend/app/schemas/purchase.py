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
    tax_mode: Optional[str] = "none"
    tax_rate: Optional[float] = 0.0
    cgst_amount: Optional[float] = 0.0
    sgst_amount: Optional[float] = 0.0
    igst_amount: Optional[float] = 0.0
    payment_status: Optional[str] = "Pending"
    credit_days: Optional[int] = 45
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
    tax_mode: Optional[str] = None
    tax_rate: Optional[float] = None
    cgst_amount: Optional[float] = None
    sgst_amount: Optional[float] = None
    igst_amount: Optional[float] = None
    payment_status: Optional[str] = None
    credit_days: Optional[int] = None
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

