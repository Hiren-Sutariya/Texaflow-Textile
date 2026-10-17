from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.core.formatters import format_to_dd_mm_yyyy
from app.core.tenant import get_tenant_company_id

router = APIRouter(prefix="/expenses", tags=["Expenses"])

def renumber_all_expenses(db: Session, company_id: str):
    expenses = db.query(Expense).filter(Expense.company_id == company_id).all()
    if not expenses:
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

    sorted_exp = sorted(
        expenses,
        key=lambda x: (
            parse_d(x.date),
            int(x.id.split("-")[-1]) if x.id and x.id.split("-")[-1].isdigit() else 0
        )
    )

    needs_renumber = False
    for idx, exp in enumerate(sorted_exp, start=1):
        expected_no = f"EB-{idx:03d}"
        if exp.expense_no != expected_no:
            needs_renumber = True
            break
        if exp.vendor_name in ("General Vendor", "general vendor", "General vendor"):
            needs_renumber = True
            break

    if needs_renumber:
        for idx, exp in enumerate(sorted_exp, start=1):
            exp.expense_no = f"EB-{idx:03d}"
            if exp.vendor_name in ("General Vendor", "general vendor", "General vendor"):
                exp.vendor_name = None
        db.commit()

@router.get("", response_model=List[ExpenseResponse])
def get_expenses(
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
    query = db.query(Expense).filter(Expense.company_id == company_id)

    if category and category != "All":
        query = query.filter(Expense.category == category)
    if status and status != "All":
        query = query.filter(Expense.payment_status == status)
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Expense.vendor_name.ilike(search_pattern)) |
            (Expense.category.ilike(search_pattern)) |
            (Expense.notes.ilike(search_pattern)) |
            (Expense.expense_no.ilike(search_pattern))
        )

    return query.order_by(Expense.expense_no.desc(), Expense.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_in: ExpenseCreate, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    renumber_all_expenses(db, company_id)
    expense_data = expense_in.model_dump()
    expense_data["company_id"] = company_id

    # 1. Format date to DD-MM-YYYY (e.g., 12-10-2026)
    if expense_data.get("date"):
        expense_data["date"] = format_to_dd_mm_yyyy(expense_data["date"])
    if expense_data.get("due_date"):
        expense_data["due_date"] = format_to_dd_mm_yyyy(expense_data["due_date"])

    # 2. Synchronized 3-digit zero-padded ID and expense_no scoped to company_id
    existing_records = db.query(Expense.expense_no, Expense.id).filter(Expense.company_id == company_id).all()
    max_num = 0
    for (eno, eid) in existing_records:
        if eno and eno.startswith("EB-"):
            m = eno.replace("EB-", "")
            if m.isdigit():
                max_num = max(max_num, int(m))

    next_num = (max_num + 1) if max_num > 0 else (len(existing_records) + 1)

    # Globally unique primary key id
    if company_id == "comp-001":
        candidate_id = f"exp-{next_num:03d}"
        if db.query(Expense.id).filter(Expense.id == candidate_id).first():
            total_all = db.query(Expense.id).count()
            candidate_id = f"exp-{total_all + 1:03d}"
    else:
        candidate_id = f"{company_id}-exp-{next_num:03d}"

    expense_data["id"] = candidate_id
    expense_data["expense_no"] = f"EB-{next_num:03d}"

    # 3. Clean General Vendor
    vname = expense_data.get("vendor_name")
    if vname in ("General Vendor", "general vendor", "General vendor", ""):
        expense_data["vendor_name"] = None

    expense = Expense(**expense_data)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: str, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.company_id == company_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: str, 
    expense_in: ExpenseUpdate, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.company_id == company_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    update_data = expense_in.model_dump(exclude_unset=True)
    if "vendor_name" in update_data and update_data["vendor_name"] in ("General Vendor", "general vendor", "General vendor", ""):
        update_data["vendor_name"] = None
    if update_data.get("date"):
        update_data["date"] = format_to_dd_mm_yyyy(update_data["date"])
    if update_data.get("due_date"):
        update_data["due_date"] = format_to_dd_mm_yyyy(update_data["due_date"])

    for field, value in update_data.items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: str, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.company_id == company_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.delete(expense)
    db.commit()
    return None
