from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class EmployeeBase(BaseModel):
    code: Optional[str] = None
    name: str
    role: Optional[str] = "Karigar"
    employee_type: str = "Karigar"
    mobile: Optional[str] = None
    email: Optional[str] = None
    assigned_machine: Optional[str] = None
    shift: str = "Day Shift"
    monthly_salary: float = 0.0
    advance_balance: float = 0.0
    status: str = "Active"
    photo_url: Optional[str] = None
    helpers: Optional[str] = None
    bank_details: Optional[str] = None
    portal_credentials: Optional[str] = None
    documents: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    id: Optional[str] = None

class EmployeeUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    employee_type: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    assigned_machine: Optional[str] = None
    shift: Optional[str] = None
    monthly_salary: Optional[float] = None
    advance_balance: Optional[float] = None
    status: Optional[str] = None
    photo_url: Optional[str] = None
    helpers: Optional[str] = None
    bank_details: Optional[str] = None
    portal_credentials: Optional[str] = None
    documents: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


