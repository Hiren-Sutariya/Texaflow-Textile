from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.production import Machine
from app.schemas.production import MachineResponse

router = APIRouter(prefix="/production", tags=["Production"])

@router.get("/machines", response_model=List[MachineResponse])
def get_machines(db: Session = Depends(get_db)):
    return db.query(Machine).order_by(Machine.name.asc()).all()
