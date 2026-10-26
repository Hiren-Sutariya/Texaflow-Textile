from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
import re

from app.core.database import get_db
from app.models.sales_invoice import SalesInvoice
from app.models.sales_challan import SalesChallan
from app.schemas.sales_invoice import SalesInvoiceCreate, SalesInvoiceUpdate, SalesInvoiceResponse
from app.core.formatters import format_to_dd_mm_yyyy
from app.core.tenant import get_tenant_company_id

router = APIRouter(prefix="/sales-invoices", tags=["Sales Invoices"])

@router.get("", response_model=List[SalesInvoiceResponse])
def get_sales_invoices(
    customer_name: Optional[str] = None,
    payment_status: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 300,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    query = db.query(SalesInvoice).filter(
        SalesInvoice.company_id == company_id,
        SalesInvoice.is_deleted == False
    )

    if customer_name and customer_name != "All":
        query = query.filter(SalesInvoice.customer_name == customer_name)
    if payment_status and payment_status != "All":
        query = query.filter(SalesInvoice.payment_status == payment_status)
    if start_date:
        query = query.filter(SalesInvoice.date >= start_date)
    if end_date:
        query = query.filter(SalesInvoice.date <= end_date)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (SalesInvoice.invoice_no.ilike(search_pattern)) |
            (SalesInvoice.customer_name.ilike(search_pattern)) |
            (SalesInvoice.items_description.ilike(search_pattern)) |
            (SalesInvoice.customer_gstin.ilike(search_pattern)) |
            (SalesInvoice.notes.ilike(search_pattern))
        )

    return query.order_by(SalesInvoice.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=SalesInvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_sales_invoice(
    invoice_in: SalesInvoiceCreate,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    inv_data = invoice_in.model_dump()
    inv_data["company_id"] = company_id
    inv_data["is_deleted"] = False

    # Convert complex fields to JSON string if needed
    for json_col in ["items", "linked_challan_ids", "linked_challan_nos"]:
        if inv_data.get(json_col) is not None and isinstance(inv_data[json_col], (list, dict)):
            inv_data[json_col] = json.dumps(inv_data[json_col])

    if inv_data.get("date"):
        inv_data["date"] = format_to_dd_mm_yyyy(inv_data["date"])

    # ID generation: inv-0001, inv-0002 ...
    existing_all = db.query(SalesInvoice.id).all()
    max_id = 0
    for (iid,) in existing_all:
        if iid and "inv-" in iid:
            try:
                num = int(iid.split("-")[-1])
                if num > max_id:
                    max_id = num
            except ValueError:
                pass

    new_id_num = max_id + 1
    new_id = f"inv-{new_id_num:04d}"
    while db.query(SalesInvoice.id).filter(SalesInvoice.id == new_id).first():
        new_id_num += 1
        new_id = f"inv-{new_id_num:04d}"
    inv_data["id"] = new_id

    # Invoice no generation if empty
    user_inv_no = (inv_data.get("invoice_no") or "").strip()
    if not user_inv_no:
        inv_data["invoice_no"] = f"INV-{new_id_num:04d}"
    else:
        inv_data["invoice_no"] = user_inv_no

    new_invoice = SalesInvoice(**inv_data)
    db.add(new_invoice)

    # If linked challans exist, update their status to Billed
    if inv_data.get("linked_challan_ids"):
        try:
            ids_list = json.loads(inv_data["linked_challan_ids"]) if isinstance(inv_data["linked_challan_ids"], str) else inv_data["linked_challan_ids"]
            if isinstance(ids_list, list):
                db.query(SalesChallan).filter(
                    SalesChallan.id.in_(ids_list),
                    SalesChallan.company_id == company_id
                ).update({
                    "billing_status": "Billed",
                    "linked_invoice_no": inv_data["invoice_no"]
                }, synchronize_session=False)
        except Exception:
            pass

    db.commit()
    db.refresh(new_invoice)
    return new_invoice

@router.get("/next-no")
def get_next_invoice_no(
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    invoices = db.query(SalesInvoice.invoice_no).filter(
        SalesInvoice.company_id == company_id,
        SalesInvoice.is_deleted == False
    ).all()
    
    max_num = 0
    for (inv_no,) in invoices:
        if inv_no:
            match = re.search(r'INV-(\d+)', str(inv_no).upper())
            if match:
                try:
                    num = int(match.group(1))
                    if num > max_num:
                        max_num = num
                except ValueError:
                    pass
    return {"next_invoice_no": f"INV-{str(max_num + 1).padStart(4, '0') if hasattr(str, 'padStart') else f'{max_num + 1:04d}'}"}

@router.get("/{invoice_id}", response_model=SalesInvoiceResponse)
def get_sales_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    invoice = db.query(SalesInvoice).filter(
        (SalesInvoice.id == invoice_id) | (SalesInvoice.invoice_no == invoice_id),
        SalesInvoice.company_id == company_id,
        SalesInvoice.is_deleted == False
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Sales Invoice not found")
    return invoice

@router.put("/{invoice_id}", response_model=SalesInvoiceResponse)
def update_sales_invoice(
    invoice_id: str,
    invoice_in: SalesInvoiceUpdate,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    invoice = db.query(SalesInvoice).filter(
        (SalesInvoice.id == invoice_id) | (SalesInvoice.invoice_no == invoice_id),
        SalesInvoice.company_id == company_id,
        SalesInvoice.is_deleted == False
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Sales Invoice not found")

    update_data = invoice_in.model_dump(exclude_unset=True)
    for json_col in ["items", "linked_challan_ids", "linked_challan_nos"]:
        if json_col in update_data and update_data[json_col] is not None and isinstance(update_data[json_col], (list, dict)):
            update_data[json_col] = json.dumps(update_data[json_col])

    if "date" in update_data and update_data["date"]:
        update_data["date"] = format_to_dd_mm_yyyy(update_data["date"])

    for field, value in update_data.items():
        setattr(invoice, field, value)

    db.commit()
    db.refresh(invoice)
    return invoice

@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sales_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    invoice = db.query(SalesInvoice).filter(
        (SalesInvoice.id == invoice_id) | (SalesInvoice.invoice_no == invoice_id),
        SalesInvoice.company_id == company_id,
        SalesInvoice.is_deleted == False
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Sales Invoice not found")

    # Revert linked challans back to Unbilled
    if invoice.linked_challan_ids:
        try:
            ids_list = json.loads(invoice.linked_challan_ids) if isinstance(invoice.linked_challan_ids, str) else invoice.linked_challan_ids
            if isinstance(ids_list, list):
                db.query(SalesChallan).filter(
                    SalesChallan.id.in_(ids_list),
                    SalesChallan.company_id == company_id
                ).update({
                    "billing_status": "Unbilled",
                    "linked_invoice_no": None
                }, synchronize_session=False)
        except Exception:
            pass

    invoice.is_deleted = True
    invoice.deleted_at = datetime.utcnow()
    invoice.deleted_by = "Admin"
    db.commit()
    return None
