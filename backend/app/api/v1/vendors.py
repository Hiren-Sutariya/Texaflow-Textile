from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.party import Party
from app.schemas.party import PartyCreate, PartyUpdate, PartyResponse
from app.core.formatters import generate_short_id
from app.core.tenant import get_tenant_company_id

from datetime import datetime

router = APIRouter(prefix="/vendors", tags=["Vendors"])

@router.get("", response_model=List[PartyResponse])
def get_vendors(
    account_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    query = db.query(Party).filter(Party.company_id == company_id, Party.is_deleted == False)
    if account_type and account_type != "All":
        query = query.filter(Party.account_type == account_type)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Party.company_name.ilike(pattern)) |
            (Party.display_name.ilike(pattern)) |
            (Party.mobile.ilike(pattern)) |
            (Party.gstin.ilike(pattern))
        )
    return query.order_by(Party.created_at.desc(), Party.id.desc()).all()

@router.post("", response_model=PartyResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(
    party_in: PartyCreate, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    data = party_in.model_dump()
    data["company_id"] = company_id
    data["is_deleted"] = False
    if not data.get("id") or len(str(data.get("id"))) > 10:
        data["id"] = generate_short_id(db, Party, "pty")
    if not data.get("sr_no"):
        data["sr_no"] = db.query(Party).filter(Party.company_id == company_id, Party.is_deleted == False).count() + 1
    party = Party(**data)
    db.add(party)
    db.commit()
    db.refresh(party)
    return party

@router.put("/{party_id}", response_model=PartyResponse)
def update_vendor(
    party_id: str, 
    party_in: PartyUpdate, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    party = db.query(Party).filter(Party.id == party_id, Party.company_id == company_id, Party.is_deleted == False).first()
    if not party:
        raise HTTPException(status_code=404, detail="Vendor not found")
    update_data = party_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(party, key, value)
    db.commit()
    db.refresh(party)
    return party

@router.delete("/{party_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(
    party_id: str, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    party = db.query(Party).filter(Party.id == party_id, Party.company_id == company_id, Party.is_deleted == False).first()
    if not party:
        raise HTTPException(status_code=404, detail="Vendor not found")
    party.is_deleted = True
    party.deleted_at = datetime.utcnow()
    party.deleted_by = "Admin"
    db.commit()
    return None
