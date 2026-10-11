from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FinishedDesignBase(BaseModel):
    order_id: Optional[str] = None
    design_code: str
    design_name: str
    party_name: str
    machine_number: str
    total_pcs_produced: int = 0
    total_stitches: Optional[int] = 0
    completion_date: str
    status: str = "Ready for Dispatch"
    dispatched_pcs: int = 0
    remaining_pcs: int = 0

class FinishedDesignCreate(FinishedDesignBase):
    pass

class FinishedDesignResponse(FinishedDesignBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
