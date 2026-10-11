from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PartyBase(BaseModel):
    name: str = Field(..., min_length=1)
    party_type: str = Field(default="Customer")
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    gstin: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    opening_balance: float = Field(default=0.0)
    current_balance: float = Field(default=0.0)

class PartyCreate(PartyBase):
    pass

class PartyResponse(PartyBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
