from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any, Union
from datetime import datetime

class SalesInvoiceBase(BaseModel):
    invoice_no: str
    date: str
    customer_name: str
    customer_gstin: Optional[str] = None
    customer_address: Optional[str] = None
    category: Optional[str] = None
    items_description: Optional[str] = None
    is_direct: Optional[bool] = True
    linked_challan_ids: Optional[Union[List[str], str]] = None
    linked_challan_nos: Optional[Union[List[str], str]] = None
    items: Optional[Union[List[Any], str]] = None
    total_item: Optional[float] = 0.0
    total_quantity: Optional[float] = 0.0
    total_weight: Optional[float] = 0.0
    total_cartoon: Optional[float] = 0.0
    subtotal: float = 0.0
    taxable_amount: float = 0.0
    gst_rate: Optional[float] = 5.0
    tax_mode: Optional[str] = "cgst_sgst"
    cgst_amount: Optional[float] = 0.0
    sgst_amount: Optional[float] = 0.0
    igst_amount: Optional[float] = 0.0
    discount_rate: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    round_off: Optional[float] = 0.0
    total_amount: float = 0.0
    place_of_supply: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_days: Optional[int] = 30
    due_date: Optional[str] = None
    payment_status: Optional[str] = "Pending"
    paid_via: Optional[str] = None
    notes: Optional[str] = None

class SalesInvoiceCreate(SalesInvoiceBase):
    id: Optional[str] = None

class SalesInvoiceUpdate(BaseModel):
    invoice_no: Optional[str] = None
    date: Optional[str] = None
    customer_name: Optional[str] = None
    customer_gstin: Optional[str] = None
    customer_address: Optional[str] = None
    category: Optional[str] = None
    items_description: Optional[str] = None
    is_direct: Optional[bool] = None
    linked_challan_ids: Optional[Union[List[str], str]] = None
    linked_challan_nos: Optional[Union[List[str], str]] = None
    items: Optional[Union[List[Any], str]] = None
    total_item: Optional[float] = None
    total_quantity: Optional[float] = None
    total_weight: Optional[float] = None
    total_cartoon: Optional[float] = None
    subtotal: Optional[float] = None
    taxable_amount: Optional[float] = None
    gst_rate: Optional[float] = None
    tax_mode: Optional[str] = None
    cgst_amount: Optional[float] = None
    sgst_amount: Optional[float] = None
    igst_amount: Optional[float] = None
    discount_rate: Optional[float] = None
    discount_amount: Optional[float] = None
    round_off: Optional[float] = None
    total_amount: Optional[float] = None
    place_of_supply: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_days: Optional[int] = None
    due_date: Optional[str] = None
    payment_status: Optional[str] = None
    paid_via: Optional[str] = None
    notes: Optional[str] = None

class SalesInvoiceResponse(SalesInvoiceBase):
    id: str
    company_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
