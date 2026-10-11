from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DesignBase(BaseModel):
    id: Optional[str] = None
    folder_code: str
    title: str
    party_name: Optional[str] = None
    created_date: str # DD-MM-YYYY
    machine_requirement: Optional[str] = None
    takko_length_meters: float = 104.0
    cut_length_meters: float = 0.93
    items: Optional[str] = None
    colorways: Optional[str] = None

class DesignCreate(DesignBase):
    pass

class DesignUpdate(BaseModel):
    folder_code: Optional[str] = None
    title: Optional[str] = None
    party_name: Optional[str] = None
    created_date: Optional[str] = None
    machine_requirement: Optional[str] = None
    takko_length_meters: Optional[float] = None
    cut_length_meters: Optional[float] = None
    items: Optional[str] = None
    colorways: Optional[str] = None

class DesignResponse(DesignBase):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

