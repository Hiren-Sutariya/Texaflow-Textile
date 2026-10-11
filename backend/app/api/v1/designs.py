from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.design import Design
from app.schemas.design import DesignCreate, DesignUpdate, DesignResponse
from app.core.formatters import generate_short_id, format_to_dd_mm_yyyy

router = APIRouter(prefix="/designs", tags=["Designs"])

@router.get("", response_model=List[DesignResponse])
def get_designs(
    party_name: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Design)
    if party_name and party_name != "All":
        query = query.filter(Design.party_name == party_name)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Design.folder_code.ilike(pattern)) |
            (Design.title.ilike(pattern)) |
            (Design.party_name.ilike(pattern))
        )
    return query.order_by(Design.created_at.desc(), Design.id.desc()).all()

@router.post("", response_model=DesignResponse, status_code=status.HTTP_201_CREATED)
def create_design(design_in: DesignCreate, db: Session = Depends(get_db)):
    data = design_in.model_dump()
    if data.get("created_date"):
        data["created_date"] = format_to_dd_mm_yyyy(data["created_date"])
    if not data.get("id") or len(str(data.get("id"))) > 10:
        data["id"] = generate_short_id(db, Design, "des")
    design = Design(**data)
    db.add(design)
    db.commit()
    db.refresh(design)
    return design

@router.put("/{design_id}", response_model=DesignResponse)
def update_design(design_id: str, design_in: DesignUpdate, db: Session = Depends(get_db)):
    design = db.query(Design).filter(Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    data = design_in.model_dump(exclude_unset=True)
    if data.get("created_date"):
        data["created_date"] = format_to_dd_mm_yyyy(data["created_date"])
    for key, value in data.items():
        setattr(design, key, value)
    db.commit()
    db.refresh(design)
    return design

@router.delete("/{design_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_design(design_id: str, db: Session = Depends(get_db)):
    design = db.query(Design).filter(Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    db.delete(design)
    db.commit()
    return None

