from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.party import Party
from app.schemas.party import PartyResponse

router = APIRouter(prefix="/vendors", tags=["Vendors"])

@router.get("", response_model=List[PartyResponse])
def get_vendors(
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Party).filter(Party.party_type.ilike("%vendor%"))
    if search:
        query = query.filter(Party.name.ilike(f"%{search}%"))
    return query.order_by(Party.name.asc()).all()
