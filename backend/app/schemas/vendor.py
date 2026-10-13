from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VendorBase(BaseModel):
    id: Optional[str] = None
    sr_no: Optional[int] = None
    account_type: str = "Supplier / Vendor"
    salutation: Optional[str] = "MR."
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: str
    display_name: str
    email: Optional[str] = None
    gstin: Optional[str] = None
    work_phone: Optional[str] = None
    mobile: str
    pan: Optional[str] = None
    is_msme: bool = False
    payment_terms: Optional[str] = "Net 30"
    opening_balance: float = 0.0
    city: Optional[str] = None
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    bank_details: Optional[str] = None
    contact_persons: Optional[str] = None
    remarks: Optional[str] = None
    company_id: Optional[str] = "comp-001"

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    account_type: Optional[str] = None
    salutation: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    display_name: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    work_phone: Optional[str] = None
    mobile: Optional[str] = None
    pan: Optional[str] = None
    is_msme: Optional[bool] = None
    payment_terms: Optional[str] = None
    opening_balance: Optional[float] = None
    city: Optional[str] = None
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    bank_details: Optional[str] = None
    contact_persons: Optional[str] = None
    remarks: Optional[str] = None


class VendorResponse(VendorBase):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
