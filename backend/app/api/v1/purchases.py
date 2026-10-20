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

def renumber_all_purchases(db: Session, company_id: str):
    purchases = db.query(Purchase).filter(Purchase.company_id == company_id).all()
    if not purchases:
        return

    def parse_d(d_str):
        if not d_str:
            return datetime(2026, 1, 1)
        parts = d_str.strip().split("-")
        if len(parts) == 3:
            if len(parts[0]) == 4:
                return datetime.strptime(d_str, "%Y-%m-%d")
            return datetime.strptime(d_str, "%d-%m-%Y")
        return datetime(2026, 1, 1)

    sorted_pur = sorted(
        purchases,
        key=lambda x: (
            parse_d(x.date),
            int(x.id.split("-")[-1]) if x.id and x.id.split("-")[-1].isdigit() else 0
        )
    )

    needs_renumber = False
    for idx, pur in enumerate(sorted_pur, start=1):
        expected_no = f"PB-{idx:03d}"
        if pur.purchase_no != expected_no:
            needs_renumber = True
            break

    if needs_renumber:
        for idx, pur in enumerate(sorted_pur, start=1):
            pur.purchase_no = f"PB-{idx:03d}"
        db.commit()

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
    query = db.query(Purchase).filter(Purchase.company_id == company_id)

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
            (Purchase.purchase_no.ilike(search_pattern)) |
            (Purchase.linked_order.ilike(search_pattern))
        )

    return query.order_by(Purchase.purchase_no.desc(), Purchase.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=PurchaseResponse, status_code=status.HTTP_201_CREATED)
def create_purchase(
    purchase_in: PurchaseCreate, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    renumber_all_purchases(db, company_id)
    purchase_data = purchase_in.model_dump()
    purchase_data["company_id"] = company_id

    if purchase_data.get("items") is not None:
        if isinstance(purchase_data["items"], (list, dict)):
            import json
            purchase_data["items"] = json.dumps(purchase_data["items"])

    if purchase_data.get("date"):
        purchase_data["date"] = format_to_dd_mm_yyyy(purchase_data["date"])
    if purchase_data.get("due_date"):
        purchase_data["due_date"] = format_to_dd_mm_yyyy(purchase_data["due_date"])

    existing_purchases = db.query(Purchase).filter(Purchase.company_id == company_id).all()
    max_id = 0
    for p in existing_purchases:
        if p.id and p.id.startswith("pur-"):
            try:
                num = int(p.id.split("-")[-1])
                if num > max_id:
                    max_id = num
            except ValueError:
                pass

    new_id_num = max_id + 1
    new_id = f"pur-{new_id_num:03d}"
    purchase_data["id"] = new_id

    if not purchase_data.get("purchase_no") or purchase_data.get("purchase_no") == "PB-NEW":
        purchase_data["purchase_no"] = f"PB-{new_id_num:03d}"

    new_purchase = Purchase(**purchase_data)
    db.add(new_purchase)
    db.commit()
    db.refresh(new_purchase)
    renumber_all_purchases(db, company_id)
    return new_purchase

@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(
    purchase_id: str, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    purchase = db.query(Purchase).filter(
        Purchase.id == purchase_id,
        Purchase.company_id == company_id
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
        Purchase.company_id == company_id
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
    if "due_date" in update_data and update_data["due_date"]:
        update_data["due_date"] = format_to_dd_mm_yyyy(update_data["due_date"])

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
        Purchase.id == purchase_id,
        Purchase.company_id == company_id
    ).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase record not found")

    db.delete(purchase)
    db.commit()
    renumber_all_purchases(db, company_id)
    return None
