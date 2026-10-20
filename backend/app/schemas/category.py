from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CategoryBase(BaseModel):
    name: str
    module: str  # material, expense, design
    color: Optional[str] = None
    is_system: Optional[bool] = False

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    module: Optional[str] = None
    color: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: str
    company_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
