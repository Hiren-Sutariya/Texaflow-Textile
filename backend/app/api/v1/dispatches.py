import uuid
from fastapi import APIRouter
from app.schemas.domain import APIResponse
from app.db.mock_db import MOCK_DB

router = APIRouter()

@router.get("", response_model=APIResponse)
def list_dispatches():
    return APIResponse(success=True, message="Dispatches retrieved", data=MOCK_DB["dispatches"])

@router.post("", response_model=APIResponse)
def create_dispatch(payload: dict):
    new_disp = {
        "id": f"disp-{uuid.uuid4().hex[:6]}",
        "dispatch_number": payload.get("dispatch_number", f"DISP-{uuid.uuid4().hex[:4].upper()}"),
        "job_work_id": payload.get("job_work_id"),
        "party_name": payload.get("party_name", "ABC Tex Fabrics"),
        "dispatch_date": payload.get("dispatch_date", "2026-09-21"),
        "transport_name": payload.get("transport_name", "Local Transport"),
        "vehicle_number": payload.get("vehicle_number", "GJ-05-AB-1234"),
        "challan_number": payload.get("challan_number", "CH-9001"),
        "dispatched_quantity": payload.get("dispatched_quantity", 500)
    }
    MOCK_DB["dispatches"].append(new_disp)
    return APIResponse(success=True, message="Dispatch recorded successfully", data=new_disp)
