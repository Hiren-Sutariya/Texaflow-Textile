from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.employee import Employee
from app.models.vendor import Vendor
from app.models.design import Design
from app.models.expense import Expense
from app.models.payment import PaymentVoucher
from app.core.tenant import get_tenant_company_id

router = APIRouter(prefix="/system", tags=["System"])

@router.delete("/purge-all-data", status_code=status.HTTP_200_OK)
@router.post("/purge-all-data", status_code=status.HTTP_200_OK)
def purge_all_data(
    company_id: str = Depends(get_tenant_company_id),
    db: Session = Depends(get_db)
):
    """Permanently delete tenant operational factory data (Employees, Vendors, Designs, Expenses, Payments)."""
    try:
        # Delete dependent and main records for this tenant only
        deleted_payments = db.query(PaymentVoucher).filter(PaymentVoucher.company_id == company_id).delete()
        deleted_expenses = db.query(Expense).filter(Expense.company_id == company_id).delete()
        deleted_designs = db.query(Design).filter(Design.company_id == company_id).delete()
        deleted_vendors = db.query(Vendor).filter(Vendor.company_id == company_id).delete()
        deleted_employees = db.query(Employee).filter(Employee.company_id == company_id).delete()
        db.commit()
        return {
            "status": "success",
            "message": f"All factory records for company '{company_id}' have been purged.",
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

