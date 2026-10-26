from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any, Union
from datetime import datetime

class SalesLineItemSchema(BaseModel):
    id: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    hsn_code: Optional[str] = None
    item: Optional[Union[float, int, str]] = None
    quantity: Optional[Union[float, int, str]] = None
    takka: Optional[Union[float, int, str]] = None
    meters: Optional[Union[float, int, str]] = None
    design_no: Optional[str] = None
    weight: Optional[Union[float, int, str]] = None
    cartoon: Optional[Union[float, int, str]] = None
    rate: Optional[Union[float, int, str]] = None
    amount: float = 0.0

class SalesChallanBase(BaseModel):
    challan_no: str
    date: str
    party_name: str
    transport: Optional[str] = None
    vehicle_no: Optional[str] = None
    items: Optional[Union[List[Any], str]] = None
    total_item: Optional[float] = 0.0
    total_quantity: Optional[float] = 0.0
    total_weight: Optional[float] = 0.0
    total_cartoon: Optional[float] = 0.0
    total_amount: float = 0.0
    credit_days: Optional[int] = 30
    due_date: Optional[str] = None
    billing_status: Optional[str] = "Unbilled"
    linked_invoice_no: Optional[str] = None
    notes: Optional[str] = None

class SalesChallanCreate(SalesChallanBase):
    id: Optional[str] = None

class SalesChallanUpdate(BaseModel):
    challan_no: Optional[str] = None
    date: Optional[str] = None
    party_name: Optional[str] = None
    transport: Optional[str] = None
    vehicle_no: Optional[str] = None
    items: Optional[Union[List[Any], str]] = None
    total_item: Optional[float] = None
    total_quantity: Optional[float] = None
    total_weight: Optional[float] = None
    total_cartoon: Optional[float] = None
    total_amount: Optional[float] = None
    credit_days: Optional[int] = None
    due_date: Optional[str] = None
    billing_status: Optional[str] = None
    linked_invoice_no: Optional[str] = None
    notes: Optional[str] = None

class SalesChallanResponse(SalesChallanBase):
    id: str
    company_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
