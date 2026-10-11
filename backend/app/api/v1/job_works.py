from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.job_work import JobOrder
from app.schemas.job_work import JobOrderCreate, JobOrderResponse

router = APIRouter(prefix="/job-works", tags=["Job Works"])

@router.get("/orders", response_model=List[JobOrderResponse])
def get_job_orders(
    status: Optional[str] = None,
    party_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(JobOrder)
    if status and status != "All":
        query = query.filter(JobOrder.status == status)
    if party_name:
        query = query.filter(JobOrder.party_name == party_name)
    return query.order_by(JobOrder.created_at.desc()).all()

@router.post("/orders", response_model=JobOrderResponse, status_code=status.HTTP_201_CREATED)
def create_job_order(order_in: JobOrderCreate, db: Session = Depends(get_db)):
    order = JobOrder(**order_in.model_dump())
    db.add(order)
    db.commit()
    db.refresh(order)
    return order
