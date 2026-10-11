from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class JobOrderBase(BaseModel):
    order_no: str
    party_name: str
    design_no: str
    fabric_type: Optional[str] = None
    stitches: int = Field(default=0)
    total_meters: float = Field(default=0.0)
    rate_per_meter: float = Field(default=0.0)
    status: str = Field(default="Pending")
    assigned_machine: Optional[str] = None
    start_date: Optional[str] = None
    delivery_date: Optional[str] = None
    remarks: Optional[str] = None

class JobOrderCreate(JobOrderBase):
    pass

class JobOrderResponse(JobOrderBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
