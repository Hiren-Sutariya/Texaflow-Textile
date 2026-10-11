from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.expense import Expense
from app.models.payment import PaymentVoucher

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    total_expenses = db.query(func.sum(Expense.amount)).scalar() or 0.0
    paid_expenses = db.query(func.sum(Expense.amount)).filter(Expense.payment_status == "Paid").scalar() or 0.0
    pending_expenses = db.query(func.sum(Expense.amount)).filter(Expense.payment_status == "Pending").scalar() or 0.0

    return {
        "total_expenses": total_expenses,
        "paid_expenses": paid_expenses,
        "pending_expenses": pending_expenses,
        "active_machines": 0,
        "active_orders": 0
    }

