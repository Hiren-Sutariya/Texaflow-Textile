import uuid
from fastapi import APIRouter, HTTPException, status
from app.schemas.domain import APIResponse, JobWorkCreate
from app.services.shortage_service import ShortageService
from app.services.costing_service import CostingService
from app.db.mock_db import MOCK_DB
from datetime import datetime

router = APIRouter()

@router.get("", response_model=APIResponse)
def list_job_works(status_filter: str = None):
    jws = MOCK_DB["job_works"]
    if status_filter:
        jws = [jw for jw in jws if jw["status"].lower() == status_filter.lower()]
    return APIResponse(success=True, message="Job works retrieved", data=jws)

@router.post("", response_model=APIResponse)
def create_job_work(jw: JobWorkCreate):
    party = next((p for p in MOCK_DB["parties"] if p["id"] == jw.party_id), None)
    if not party:
        raise HTTPException(status_code=400, detail="Invalid party ID")
        
    new_id = f"jw-{uuid.uuid4().hex[:6]}"
    jw_data = jw.model_dump()
    jw_data["id"] = new_id
    jw_data["party_name"] = party["name"]
    jw_data["status"] = "Draft"
    jw_data["created_at"] = datetime.utcnow().isoformat() + "Z"
    
    # Process fabrics into Party Owned Stock
    for fab in jw_data.get("fabrics", []):
        fab["used_quantity"] = 0.0
        fab["returned_quantity"] = 0.0
        MOCK_DB["stock"].append({
            "id": f"s-{uuid.uuid4().hex[:6]}",
            "material_id": f"mat-fab-{uuid.uuid4().hex[:4]}",
            "material_code": "FAB-PARTY",
            "material_name": fab["fabric_name"],
            "unit": "meter",
            "warehouse_name": "Production Floor",
            "ownership_type": "Party",
            "party_id": party["id"],
            "party_name": party["name"],
            "current_stock_quantity": fab["quantity_meters"],
            "updated_at": datetime.utcnow().isoformat() + "Z"
        })

    MOCK_DB["job_works"].append(jw_data)
    return APIResponse(success=True, message="Job work created successfully", data=jw_data)

@router.get("/{jw_id}", response_model=APIResponse)
def get_job_work_detail(jw_id: str):
    jw = next((j for j in MOCK_DB["job_works"] if j["id"] == jw_id), None)
    if not jw:
        raise HTTPException(status_code=404, detail="Job work not found")
    return APIResponse(success=True, message="Job work detail retrieved", data=jw)

@router.get("/{jw_id}/shortage-check", response_model=APIResponse)
def check_job_work_shortage(jw_id: str):
    jw = next((j for j in MOCK_DB["job_works"] if j["id"] == jw_id), None)
    if not jw:
        raise HTTPException(status_code=404, detail="Job work not found")
        
    shortage_report = ShortageService.calculate_job_work_shortage(
        job_work_id=jw["id"],
        jw_number=jw["jw_number"],
        party_name=jw["party_name"],
        required_materials=jw.get("required_materials", []),
        current_inventory=MOCK_DB["stock"]
    )
    
    return APIResponse(success=True, message="Shortage calculation complete", data=shortage_report.model_dump())

@router.get("/{jw_id}/costing", response_model=APIResponse)
def get_job_work_costing(jw_id: str):
    jw = next((j for j in MOCK_DB["job_works"] if j["id"] == jw_id), None)
    if not jw:
        raise HTTPException(status_code=404, detail="Job work not found")
        
    costing = CostingService.calculate_job_costing(
        job_work_id=jw["id"],
        jw_number=jw["jw_number"],
        party_name=jw["party_name"],
        total_produced_pieces=2000,
        rate_per_piece=12.50,
        material_costs=3200.0,
        worker_costs=1500.0,
        machine_hourly_rate=250.0,
        total_machine_hours=16.0
    )
    
    return APIResponse(success=True, message="Job costing report generated", data=costing.model_dump())
