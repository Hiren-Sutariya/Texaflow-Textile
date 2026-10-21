from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.core.tenant import get_tenant_company_id
from app.models.party import Party
from app.models.purchase import Purchase
from app.models.expense import Expense
from app.models.category import Category
from app.models.worker import Worker
from app.models.design import Design
from app.models.payment import PaymentVoucher

router = APIRouter(prefix="/recycle-bin", tags=["Recycle Bin"])

RETENTION_DAYS = 30

def get_model_by_module(module: str):
    module_lower = module.lower().strip()
    mapping = {
        "parties": Party,
        "party": Party,
        "vendors": Party,
        "purchases": Purchase,
        "purchase": Purchase,
        "expenses": Expense,
        "expense": Expense,
        "categories": Category,
        "category": Category,
        "workers": Worker,
        "worker": Worker,
        "designs": Design,
        "design": Design,
        "payments": PaymentVoucher,
        "payment": PaymentVoucher,
    }
    model = mapping.get(module_lower)
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid module: {module}")
    return model

def auto_purge_expired_records(db: Session, company_id: str):
    """Automatically permanently purge records deleted more than 30 days ago."""
    cutoff_date = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
    models = [Party, Purchase, Expense, Category, Worker, Design, PaymentVoucher]
    purged_count = 0
    for model in models:
        try:
            expired_items = db.query(model).filter(
                model.company_id == company_id,
                model.is_deleted == True,
                model.deleted_at != None,
                model.deleted_at < cutoff_date
            ).all()
            for item in expired_items:
                db.delete(item)
                purged_count += 1
        except Exception:
            pass
    if purged_count > 0:
        db.commit()

@router.get("")
def list_trash_items(
    module: Optional[str] = Query(None, description="Filter by module"),
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    """
    Retrieve all soft-deleted records for the active tenant company within the 30-day retention window.
    """
    auto_purge_expired_records(db, company_id)

    results: List[Dict[str, Any]] = []
    now = datetime.utcnow()

    # 1. Parties
    if not module or module.lower() in ("parties", "party", "vendors"):
        parties = db.query(Party).filter(
            Party.company_id == company_id,
            Party.is_deleted == True
        ).all()
        for p in parties:
            del_at = p.deleted_at or p.updated_at or now
            days_passed = max(0, (now - del_at).days)
            results.append({
                "id": p.id,
                "module": "parties",
                "module_label": "Parties",
                "title": p.display_name or p.company_name or "Unnamed Party",
                "subtitle": f"Type: {p.account_type} | Mobile: {p.mobile or 'N/A'}",
                "deleted_at": del_at.isoformat(),
                "deleted_by": getattr(p, "deleted_by", None) or "Admin",
                "days_remaining": max(0, RETENTION_DAYS - days_passed),
                "amount": getattr(p, "opening_balance", None)
            })

    # 2. Purchases
    if not module or module.lower() in ("purchases", "purchase"):
        purchases = db.query(Purchase).filter(
            Purchase.company_id == company_id,
            Purchase.is_deleted == True
        ).all()
        for pur in purchases:
            del_at = pur.deleted_at or pur.updated_at or now
            days_passed = max(0, (now - del_at).days)
            results.append({
                "id": pur.id,
                "module": "purchases",
                "module_label": "Purchase Bills",
                "title": f"Bill #{pur.purchase_no or pur.id} - {pur.vendor_name}",
                "subtitle": f"Date: {pur.date} | Category: {pur.category}",
                "deleted_at": del_at.isoformat(),
                "deleted_by": getattr(pur, "deleted_by", None) or "Admin",
                "days_remaining": max(0, RETENTION_DAYS - days_passed),
                "amount": pur.amount
            })

    # 3. Expenses
    if not module or module.lower() in ("expenses", "expense"):
        expenses = db.query(Expense).filter(
            Expense.company_id == company_id,
            Expense.is_deleted == True
        ).all()
        for exp in expenses:
            del_at = exp.deleted_at or exp.updated_at or now
            days_passed = max(0, (now - del_at).days)
            results.append({
                "id": exp.id,
                "module": "expenses",
                "module_label": "Expenses",
                "title": f"Voucher #{exp.expense_no} - {exp.category}",
                "subtitle": f"Date: {exp.date} | Paid Via: {exp.paid_via}",
                "deleted_at": del_at.isoformat(),
                "deleted_by": getattr(exp, "deleted_by", None) or "Admin",
                "days_remaining": max(0, RETENTION_DAYS - days_passed),
                "amount": exp.amount
            })

    # 4. Categories
    if not module or module.lower() in ("categories", "category"):
        categories = db.query(Category).filter(
            Category.company_id == company_id,
            Category.is_deleted == True
        ).all()
        for cat in categories:
            del_at = cat.deleted_at or cat.updated_at or now
            days_passed = max(0, (now - del_at).days)
            results.append({
                "id": cat.id,
                "module": "categories",
                "module_label": "Categories",
                "title": cat.name,
                "subtitle": f"Module: {cat.module.capitalize()}",
                "deleted_at": del_at.isoformat(),
                "deleted_by": getattr(cat, "deleted_by", None) or "Admin",
                "days_remaining": max(0, RETENTION_DAYS - days_passed),
                "amount": None
            })

    # 5. Workers
    if not module or module.lower() in ("workers", "worker"):
        workers = db.query(Worker).filter(
            Worker.company_id == company_id,
            Worker.is_deleted == True
        ).all()
        for w in workers:
            del_at = w.deleted_at or w.updated_at or now
            days_passed = max(0, (now - del_at).days)
            results.append({
                "id": w.id,
                "module": "workers",
                "module_label": "Workers",
                "title": w.name,
                "subtitle": f"Code: {w.code or 'N/A'} | Role: {getattr(w, 'role', 'Worker')}",
                "deleted_at": del_at.isoformat(),
                "deleted_by": getattr(w, "deleted_by", None) or "Admin",
                "days_remaining": max(0, RETENTION_DAYS - days_passed),
                "amount": None
            })

    # Sort newest deleted first
    results.sort(key=lambda x: x["deleted_at"], reverse=True)
    return results

@router.post("/{module}/{record_id}/restore")
def restore_item(
    module: str,
    record_id: str,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    """
    Restore a soft-deleted record back to active status.
    """
    model = get_model_by_module(module)
    item = db.query(model).filter(
        model.id == record_id,
        model.company_id == company_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found in Recycle Bin")

    item.is_deleted = False
    item.deleted_at = None
    item.deleted_by = None
    db.commit()

    title = getattr(item, "display_name", None) or getattr(item, "purchase_no", None) or getattr(item, "name", None) or record_id
    return {
        "success": True,
        "message": f"Successfully restored '{title}'"
    }

@router.delete("/{module}/{record_id}/permanent", status_code=status.HTTP_200_OK)
def permanently_delete_item(
    module: str,
    record_id: str,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    """
    Permanently delete an item from the database. This action cannot be undone.
    """
    model = get_model_by_module(module)
    item = db.query(model).filter(
        model.id == record_id,
        model.company_id == company_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found in Recycle Bin")

    db.delete(item)
    db.commit()
    return {
        "success": True,
        "message": "Item permanently deleted from database"
    }

@router.post("/restore-all")
def restore_all(
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    """
    Restore all items in the Recycle Bin for the active tenant company.
    """
    models = [Party, Purchase, Expense, Category, Worker, Design, PaymentVoucher]
    restored_count = 0
    for model in models:
        items = db.query(model).filter(
            model.company_id == company_id,
            model.is_deleted == True
        ).all()
        for item in items:
            item.is_deleted = False
            item.deleted_at = None
            item.deleted_by = None
            restored_count += 1
    db.commit()
    return {
        "success": True,
        "message": f"Restored {restored_count} items from Recycle Bin"
    }

@router.delete("/empty")
def empty_recycle_bin(
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    """
    Permanently delete all items currently in the Recycle Bin for the active tenant company.
    """
    models = [Party, Purchase, Expense, Category, Worker, Design, PaymentVoucher]
    deleted_count = 0
    for model in models:
        items = db.query(model).filter(
            model.company_id == company_id,
            model.is_deleted == True
        ).all()
        for item in items:
            db.delete(item)
            deleted_count += 1
    db.commit()
    return {
        "success": True,
        "message": f"Permanently deleted {deleted_count} items. Recycle Bin is now empty."
    }
