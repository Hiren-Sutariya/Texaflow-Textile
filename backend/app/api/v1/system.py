from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.employee import Employee
from app.models.vendor import Vendor
from app.models.design import Design
from app.models.expense import Expense
from app.models.payment import PaymentVoucher

router = APIRouter(prefix="/system", tags=["System"])

@router.delete("/purge-all-data", status_code=status.HTTP_200_OK)
@router.post("/purge-all-data", status_code=status.HTTP_200_OK)
def purge_all_data(db: Session = Depends(get_db)):
    """Permanently delete all operational factory data (Employees, Vendors, Designs, Expenses, Payments)."""
    try:
        # Delete dependent and main records
        deleted_payments = db.query(PaymentVoucher).delete()
        deleted_expenses = db.query(Expense).delete()
        deleted_designs = db.query(Design).delete()
        deleted_vendors = db.query(Vendor).delete()
        deleted_employees = db.query(Employee).delete()
        db.commit()
        return {
            "status": "success",
            "message": "All factory records have been successfully purged from the database.",
            "deleted_counts": {
                "payments": deleted_payments,
                "expenses": deleted_expenses,
                "designs": deleted_designs,
                "vendors": deleted_vendors,
                "employees": deleted_employees
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database purge failed: {str(e)}")
