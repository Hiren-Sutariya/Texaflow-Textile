from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.vendor import Vendor
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse
from app.core.formatters import generate_short_id

router = APIRouter(prefix="/vendors", tags=["Vendors"])

@router.get("", response_model=List[VendorResponse])
def get_vendors(
    account_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Vendor)
    if account_type and account_type != "All":
        query = query.filter(Vendor.account_type == account_type)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Vendor.company_name.ilike(pattern)) |
            (Vendor.display_name.ilike(pattern)) |
            (Vendor.mobile.ilike(pattern)) |
            (Vendor.gstin.ilike(pattern))
        )
    return query.order_by(Vendor.created_at.desc(), Vendor.id.desc()).all()

@router.post("", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(vendor_in: VendorCreate, db: Session = Depends(get_db)):
    data = vendor_in.model_dump()
    if not data.get("id") or len(str(data.get("id"))) > 10:
        data["id"] = generate_short_id(db, Vendor, "ven")
    if not data.get("sr_no"):
        data["sr_no"] = db.query(Vendor).count() + 1
    vendor = Vendor(**data)
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor

@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor(vendor_id: str, vendor_in: VendorUpdate, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    update_data = vendor_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vendor, key, value)
    db.commit()
    db.refresh(vendor)
    return vendor

@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(vendor_id: str, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    db.delete(vendor)
    db.commit()
    return None

