from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.inventory import InventoryStock
from app.schemas.inventory import InventoryStockCreate, InventoryStockResponse
from app.core.formatters import generate_short_id

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("", response_model=List[InventoryStockResponse])
def get_inventory(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InventoryStock)
    if category and category != "All":
        query = query.filter(InventoryStock.category == category)
    if search:
        query = query.filter(InventoryStock.item_name.ilike(f"%{search}%"))
    return query.order_by(InventoryStock.item_name.asc()).all()

@router.post("", response_model=InventoryStockResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(item_in: InventoryStockCreate, db: Session = Depends(get_db)):
    data = item_in.model_dump()
    if not data.get("id") or len(str(data.get("id"))) > 10:
        data["id"] = generate_short_id(db, InventoryStock, "stk")
    item = InventoryStock(**data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
