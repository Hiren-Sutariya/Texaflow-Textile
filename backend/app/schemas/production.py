from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MachineBase(BaseModel):
    name: str
    heads: int = Field(default=24)
    speed_rpm: int = Field(default=850)
    status: str = Field(default="Running")
    current_order_no: Optional[str] = None
    current_design_no: Optional[str] = None
    operator_name: Optional[str] = None
    shift: str = Field(default="Day")
    efficiency_pct: float = Field(default=95.0)

class MachineCreate(MachineBase):
    pass

class MachineResponse(MachineBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
