import uuid
from fastapi import APIRouter, HTTPException, status
from app.schemas.domain import APIResponse, ProductionEntryCreate
from app.db.mock_db import MOCK_DB

router = APIRouter()

@router.get("/entries", response_model=APIResponse)
def list_production_entries():
    return APIResponse(success=True, message="Production entries retrieved", data=MOCK_DB["production_entries"])

@router.post("/entries", response_model=APIResponse)
def create_production_entry(entry: ProductionEntryCreate):
    # Rule 4 & 5: Validation - Accepted = Produced - Rejected. Rejected cannot exceed produced.
    if entry.rejected_quantity > entry.produced_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rejected quantity ({entry.rejected_quantity}) cannot exceed produced quantity ({entry.produced_quantity})"
        )
        
    accepted_qty = entry.produced_quantity - entry.rejected_quantity
    
    new_entry = entry.model_dump()
    new_entry["id"] = f"pe-{uuid.uuid4().hex[:6]}"
    new_entry["accepted_quantity"] = accepted_qty
    new_entry["machine_number"] = "M-101"
    new_entry["worker_name"] = "Ramesh Karigar"
    
    MOCK_DB["production_entries"].append(new_entry)
    return APIResponse(success=True, message="Production entry recorded successfully", data=new_entry)

@router.get("/machines", response_model=APIResponse)
def list_machines():
    return APIResponse(success=True, message="Machines retrieved", data=MOCK_DB["machines"])

@router.get("/workers", response_model=APIResponse)
def list_workers():
    return APIResponse(success=True, message="Workers retrieved", data=MOCK_DB["workers"])
