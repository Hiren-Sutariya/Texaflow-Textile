from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.party import Party
from app.schemas.party import PartyCreate, PartyResponse

router = APIRouter(prefix="/parties", tags=["Parties"])

@router.get("", response_model=List[PartyResponse])
def get_parties(
    party_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Party)
    if party_type and party_type != "All":
        query = query.filter(Party.party_type == party_type)
    if search:
        query = query.filter(Party.name.ilike(f"%{search}%"))
    return query.order_by(Party.name.asc()).all()

@router.post("", response_model=PartyResponse, status_code=status.HTTP_201_CREATED)
def create_party(party_in: PartyCreate, db: Session = Depends(get_db)):
    existing = db.query(Party).filter(Party.name == party_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Party with this name already exists")
    party = Party(**party_in.model_dump())
    db.add(party)
    db.commit()
    db.refresh(party)
    return party
