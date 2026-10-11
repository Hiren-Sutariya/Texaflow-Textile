from fastapi import APIRouter
from app.schemas.domain import APIResponse, StockMovementCreate
from app.db.mock_db import MOCK_DB
from datetime import datetime

router = APIRouter()

@router.get("/stock", response_model=APIResponse)
def get_inventory_stock(ownership: str = None):
    stock = MOCK_DB["stock"]
    if ownership:
        stock = [s for s in stock if s["ownership_type"].lower() == ownership.lower()]
    return APIResponse(success=True, message="Inventory stock retrieved", data=stock)

@router.get("/movements", response_model=APIResponse)
def get_stock_movements():
    # Sample stock movements audit trail
    movements = [
        {
            "id": "sm-101",
            "material_name": "Red Viscose Thread",
            "movement_type": "Purchase_Receive",
            "ownership_type": "Company",
            "quantity": 15.5,
            "unit": "kg",
            "reference": "PO-2026-089",
            "timestamp": "2026-09-18T14:30:00Z"
        },
        {
            "id": "sm-102",
            "material_name": "Blue Cotton Fabric",
            "movement_type": "Party_Receive",
            "ownership_type": "Party",
            "party_name": "ABC Tex Fabrics",
            "quantity": 500.0,
            "unit": "meter",
            "reference": "JW-2026-001",
            "timestamp": "2026-09-15T09:00:00Z"
        }
    ]
    return APIResponse(success=True, message="Stock movement log retrieved", data=movements)
