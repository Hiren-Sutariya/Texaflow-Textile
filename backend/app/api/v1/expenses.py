from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.core.formatters import format_to_dd_mm_yyyy, generate_short_id

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("", response_model=List[ExpenseResponse])
def get_expenses(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    query = db.query(Expense)

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
            (Expense.invoice_no.ilike(search_pattern)) |
            (Expense.notes.ilike(search_pattern)) |
            (Expense.title.ilike(search_pattern))
        )

    return query.order_by(Expense.created_at.desc(), Expense.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(expense_in: ExpenseCreate, db: Session = Depends(get_db)):
    expense_data = expense_in.model_dump()

    # 1. Format date to DD-MM-YYYY (e.g., 12-10-2026)
    if expense_data.get("date"):
        expense_data["date"] = format_to_dd_mm_yyyy(expense_data["date"])

    # 2. Simple Short ID Generation (e.g., exp-1, exp-2, exp-9)
    if not expense_data.get("id") or len(str(expense_data.get("id"))) > 10:
        expense_data["id"] = generate_short_id(db, Expense, "exp")

    # 3. Auto-generate expense_no if not provided
    if not expense_data.get("expense_no"):
        count = db.query(Expense).count()
        expense_data["expense_no"] = f"EXP-2026-{100 + count + 1}"

    if not expense_data.get("title"):
        expense_data["title"] = expense_data.get("notes") or f"{expense_data['category']} Expense"

    expense = Expense(**expense_data)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: str, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: str, expense_in: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    update_data = expense_in.model_dump(exclude_unset=True)
    if update_data.get("date"):
        update_data["date"] = format_to_dd_mm_yyyy(update_data["date"])

    for field, value in update_data.items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: str, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.delete(expense)
    db.commit()
    return None
