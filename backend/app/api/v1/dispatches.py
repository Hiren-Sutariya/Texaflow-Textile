from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.dispatch import FinishedDesign
from app.schemas.dispatch import FinishedDesignCreate, FinishedDesignResponse
from app.core.formatters import format_to_dd_mm_yyyy, generate_short_id

router = APIRouter(prefix="/dispatches", tags=["Dispatches"])

@router.get("/stock", response_model=List[FinishedDesignResponse])
def get_finished_designs_stock(
    status: Optional[str] = None,
    party_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(FinishedDesign)
    if status and status != "All":
        query = query.filter(FinishedDesign.status == status)
    if party_name:
        query = query.filter(FinishedDesign.party_name == party_name)
    return query.order_by(FinishedDesign.created_at.desc(), FinishedDesign.id.desc()).all()

@router.post("/stock", response_model=FinishedDesignResponse, status_code=status.HTTP_201_CREATED)
def create_finished_design(design_in: FinishedDesignCreate, db: Session = Depends(get_db)):
    data = design_in.model_dump()
    if data.get("completion_date"):
        data["completion_date"] = format_to_dd_mm_yyyy(data["completion_date"])
    if not data.get("id") or len(str(data.get("id"))) > 10:
        data["id"] = generate_short_id(db, FinishedDesign, "dsp")
    item = FinishedDesign(**data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
