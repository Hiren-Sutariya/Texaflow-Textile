from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.purchase import Purchase
from app.schemas.purchase import PurchaseCreate, PurchaseUpdate, PurchaseResponse
from app.core.formatters import format_to_dd_mm_yyyy
from app.core.tenant import get_tenant_company_id

router = APIRouter(prefix="/purchases", tags=["Purchases"])

@router.get("", response_model=List[PurchaseResponse])
def get_purchases(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    query = db.query(Purchase).filter(Purchase.company_id == company_id, Purchase.is_deleted == False)

    if category and category != "All":
        query = query.filter(Purchase.category == category)
    if status and status != "All":
        query = query.filter(Purchase.payment_status == status)
    if start_date:
        query = query.filter(Purchase.date >= start_date)
    if end_date:
        query = query.filter(Purchase.date <= end_date)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Purchase.vendor_name.ilike(search_pattern)) |
            (Purchase.category.ilike(search_pattern)) |
            (Purchase.notes.ilike(search_pattern)) |
            (Purchase.purchase_no.ilike(search_pattern))
        )

    return query.order_by(Purchase.purchase_no.desc(), Purchase.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=PurchaseResponse, status_code=status.HTTP_201_CREATED)
def create_purchase(
    purchase_in: PurchaseCreate, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    purchase_data = purchase_in.model_dump()
    purchase_data["company_id"] = company_id
    purchase_data["is_deleted"] = False

    if purchase_data.get("items") is not None:
        if isinstance(purchase_data["items"], (list, dict)):
            import json
            purchase_data["items"] = json.dumps(purchase_data["items"])

    if purchase_data.get("date"):
        purchase_data["date"] = format_to_dd_mm_yyyy(purchase_data["date"])

    existing_all = db.query(Purchase.id).all()
    max_id = 0
    for (pid,) in existing_all:
        if pid and "pur-" in pid:
            try:
                num = int(pid.split("-")[-1])
                if num > max_id:
                    max_id = num
            except ValueError:
                pass

    new_id_num = max_id + 1
    new_id = f"pur-{new_id_num:03d}"
    while db.query(Purchase.id).filter(Purchase.id == new_id).first():
        new_id_num += 1
        new_id = f"pur-{new_id_num:03d}"
    purchase_data["id"] = new_id

    user_bill_no = (purchase_data.get("purchase_no") or "").strip()
    if not user_bill_no or user_bill_no in ["PB-NEW", "e.g. PB-001"]:
        purchase_data["purchase_no"] = f"PB-{new_id_num:03d}"
    else:
        purchase_data["purchase_no"] = user_bill_no

    new_purchase = Purchase(**purchase_data)
    db.add(new_purchase)
    db.commit()
    db.refresh(new_purchase)
    return new_purchase

@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(
    purchase_id: str, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    purchase = db.query(Purchase).filter(
        Purchase.id == purchase_id,
        Purchase.company_id == company_id,
        Purchase.is_deleted == False
    ).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase record not found")
    return purchase

@router.put("/{purchase_id}", response_model=PurchaseResponse)
def update_purchase(
    purchase_id: str, 
    purchase_in: PurchaseUpdate, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    purchase = db.query(Purchase).filter(
        Purchase.id == purchase_id,
        Purchase.company_id == company_id,
        Purchase.is_deleted == False
    ).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase record not found")

    update_data = purchase_in.model_dump(exclude_unset=True)
    if "items" in update_data and update_data["items"] is not None:
        if isinstance(update_data["items"], (list, dict)):
            import json
            update_data["items"] = json.dumps(update_data["items"])

    if "date" in update_data and update_data["date"]:
        update_data["date"] = format_to_dd_mm_yyyy(update_data["date"])

    if "purchase_no" in update_data and update_data["purchase_no"]:
        update_data["purchase_no"] = update_data["purchase_no"].strip()

    for field, value in update_data.items():
        setattr(purchase, field, value)

    db.commit()
    db.refresh(purchase)
    return purchase

@router.delete("/{purchase_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_purchase(
    purchase_id: str, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    purchase = db.query(Purchase).filter(
        (Purchase.id == purchase_id) | (Purchase.purchase_no == purchase_id),
        Purchase.company_id == company_id,
        Purchase.is_deleted == False
    ).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase record not found")

    purchase.is_deleted = True
    purchase.deleted_at = datetime.utcnow()
    purchase.deleted_by = "Admin"
    db.commit()
    return None

