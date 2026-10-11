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
    pass

class EmployeeResponse(EmployeeBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
