from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class EmployeeBase(BaseModel):
    name: str
    role: str = "Karigar"
    phone: Optional[str] = None
    monthly_salary: float = 0.0
    current_advance: float = 0.0
    status: str = "Active"

class EmployeeCreate(EmployeeBase):
    id: Optional[str] = None

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    monthly_salary: Optional[float] = None
    current_advance: Optional[float] = None
    status: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

