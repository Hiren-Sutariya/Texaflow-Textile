from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class InventoryStockBase(BaseModel):
    item_name: str
    category: str = "Yarn"
    quantity: float = 0.0
    unit: str = "Cones"
    min_stock_level: float = 10.0
    unit_price: float = 0.0
    supplier_name: Optional[str] = None

class InventoryStockCreate(InventoryStockBase):
    pass

class InventoryStockResponse(InventoryStockBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
