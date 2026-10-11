from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.inventory import InventoryStock
from app.schemas.inventory import InventoryStockCreate, InventoryStockResponse

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
    item = InventoryStock(**item_in.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
