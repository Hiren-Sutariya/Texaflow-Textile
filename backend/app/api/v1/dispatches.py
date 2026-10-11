from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.dispatch import FinishedDesign
from app.schemas.dispatch import FinishedDesignCreate, FinishedDesignResponse

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
    return query.order_by(FinishedDesign.completion_date.desc()).all()

@router.post("/stock", response_model=FinishedDesignResponse, status_code=status.HTTP_201_CREATED)
def create_finished_design(design_in: FinishedDesignCreate, db: Session = Depends(get_db)):
    item = FinishedDesign(**design_in.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
