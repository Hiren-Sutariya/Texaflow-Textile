import uuid
from fastapi import APIRouter, HTTPException, status
from app.schemas.domain import APIResponse, PartyCreate
from app.db.mock_db import MOCK_DB
from datetime import datetime

router = APIRouter()

@router.get("", response_model=APIResponse)
def list_parties(party_type: str = None, search: str = None):
    parties = MOCK_DB["parties"]
    if party_type:
        parties = [p for p in parties if p["party_type"].lower() == party_type.lower()]
    if search:
        s = search.lower()
        parties = [p for p in parties if s in p["name"].lower() or s in p["code"].lower()]
        
    return APIResponse(success=True, message="Parties retrieved", data=parties)

@router.post("", response_model=APIResponse)
def create_party(party: PartyCreate):
    new_id = f"p-{uuid.uuid4().hex[:6]}"
    new_party = party.model_dump()
    new_party["id"] = new_id
    new_party["created_at"] = datetime.utcnow().isoformat() + "Z"
    
    MOCK_DB["parties"].append(new_party)
    return APIResponse(success=True, message="Party created successfully", data=new_party)

@router.get("/{party_id}", response_model=APIResponse)
def get_party_detail(party_id: str):
    party = next((p for p in MOCK_DB["parties"] if p["id"] == party_id), None)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
        
    # Gather party history
    job_works = [jw for jw in MOCK_DB["job_works"] if jw["party_id"] == party_id]
    receivables = [r for r in MOCK_DB["receivables"] if r.get("party_name") == party["name"]]
    
    data = {
        "party": party,
        "job_works": job_works,
        "receivables": receivables,
        "outstanding_balance": sum(r["balance_amount"] for r in receivables)
    }
    
    return APIResponse(success=True, message="Party detail retrieved", data=data)
