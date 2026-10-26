from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from app.core.database import get_db
from app.models.sales_challan import SalesChallan
from app.schemas.sales_challan import SalesChallanCreate, SalesChallanUpdate, SalesChallanResponse
from app.core.formatters import format_to_dd_mm_yyyy
from app.core.tenant import get_tenant_company_id

router = APIRouter(prefix="/sales-challans", tags=["Sales Challans"])

@router.get("", response_model=List[SalesChallanResponse])
def get_sales_challans(
    party_name: Optional[str] = None,
    billing_status: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 300,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    query = db.query(SalesChallan).filter(
        SalesChallan.company_id == company_id,
        SalesChallan.is_deleted == False
    )

    if party_name and party_name != "All":
        query = query.filter(SalesChallan.party_name == party_name)
    if billing_status and billing_status != "All":
        query = query.filter(SalesChallan.billing_status == billing_status)
    if start_date:
        query = query.filter(SalesChallan.date >= start_date)
    if end_date:
        query = query.filter(SalesChallan.date <= end_date)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (SalesChallan.challan_no.ilike(search_pattern)) |
            (SalesChallan.party_name.ilike(search_pattern)) |
            (SalesChallan.transport.ilike(search_pattern)) |
            (SalesChallan.vehicle_no.ilike(search_pattern)) |
            (SalesChallan.notes.ilike(search_pattern))
        )

    return query.order_by(SalesChallan.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=SalesChallanResponse, status_code=status.HTTP_201_CREATED)
def create_sales_challan(
    challan_in: SalesChallanCreate,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    challan_data = challan_in.model_dump()
    challan_data["company_id"] = company_id
    challan_data["is_deleted"] = False

    if challan_data.get("items") is not None and isinstance(challan_data["items"], (list, dict)):
        challan_data["items"] = json.dumps(challan_data["items"])

    if challan_data.get("date"):
        challan_data["date"] = format_to_dd_mm_yyyy(challan_data["date"])

    # ID generation: sc-101, sc-102 ...
    existing_all = db.query(SalesChallan.id).all()
    max_id = 0
    for (cid,) in existing_all:
        if cid and "sc-" in cid:
            try:
                num = int(cid.split("-")[-1])
                if num > max_id:
                    max_id = num
            except ValueError:
                pass

    new_id_num = max_id + 1
    new_id = f"sc-{new_id_num}"
    while db.query(SalesChallan.id).filter(SalesChallan.id == new_id).first():
        new_id_num += 1
        new_id = f"sc-{new_id_num}"
    challan_data["id"] = new_id

    # Challan no generation if empty
    user_challan_no = (challan_data.get("challan_no") or "").strip()
    if not user_challan_no:
        challan_data["challan_no"] = str(new_id_num)
    else:
        challan_data["challan_no"] = user_challan_no

    new_challan = SalesChallan(**challan_data)
    db.add(new_challan)
    db.commit()
    db.refresh(new_challan)
    return new_challan

@router.get("/next-no")
def get_next_challan_no(
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    challans = db.query(SalesChallan.challan_no).filter(
        SalesChallan.company_id == company_id,
        SalesChallan.is_deleted == False
    ).all()
    
    max_num = 100
    import re
    for (c_no,) in challans:
        if c_no:
            match = re.search(r'(\d+)$', str(c_no).strip())
            if match:
                try:
                    num = int(match.group(1))
                    if num > max_num:
                        max_num = num
                except ValueError:
                    pass
    return {"next_challan_no": str(max_num + 1)}

@router.get("/{challan_id}", response_model=SalesChallanResponse)
def get_sales_challan(
    challan_id: str,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    challan = db.query(SalesChallan).filter(
        (SalesChallan.id == challan_id) | (SalesChallan.challan_no == challan_id),
        SalesChallan.company_id == company_id,
        SalesChallan.is_deleted == False
    ).first()
    if not challan:
        raise HTTPException(status_code=404, detail="Sales Challan not found")
    return challan

@router.put("/{challan_id}", response_model=SalesChallanResponse)
def update_sales_challan(
    challan_id: str,
    challan_in: SalesChallanUpdate,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    challan = db.query(SalesChallan).filter(
        (SalesChallan.id == challan_id) | (SalesChallan.challan_no == challan_id),
        SalesChallan.company_id == company_id,
        SalesChallan.is_deleted == False
    ).first()
    if not challan:
        raise HTTPException(status_code=404, detail="Sales Challan not found")

    update_data = challan_in.model_dump(exclude_unset=True)
    if "items" in update_data and update_data["items"] is not None and isinstance(update_data["items"], (list, dict)):
        update_data["items"] = json.dumps(update_data["items"])

    if "date" in update_data and update_data["date"]:
        update_data["date"] = format_to_dd_mm_yyyy(update_data["date"])

    for field, value in update_data.items():
        setattr(challan, field, value)

    db.commit()
    db.refresh(challan)
    return challan

@router.delete("/{challan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sales_challan(
    challan_id: str,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    challan = db.query(SalesChallan).filter(
        (SalesChallan.id == challan_id) | (SalesChallan.challan_no == challan_id),
        SalesChallan.company_id == company_id,
        SalesChallan.is_deleted == False
    ).first()
    if not challan:
        raise HTTPException(status_code=404, detail="Sales Challan not found")

    challan.is_deleted = True
    challan.deleted_at = datetime.utcnow()
    challan.deleted_by = "Admin"
    db.commit()
    return None
