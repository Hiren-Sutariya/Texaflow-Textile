from fastapi import APIRouter, Depends, status, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.core.database import get_db
from app.models.worker import Worker
from app.models.party import Party
from app.models.design import Design
from app.models.expense import Expense
from app.models.purchase import Purchase
from app.models.payment import PaymentVoucher
from app.core.tenant import get_required_current_user

router = APIRouter(prefix="/system", tags=["System"])

@router.delete("/purge-all-data", status_code=status.HTTP_200_OK)
@router.post("/purge-all-data", status_code=status.HTTP_200_OK)
def purge_all_data(
    confirm_purge: Optional[str] = Header(None, alias="x-confirm-purge"),
    current_user: Dict[str, Any] = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete tenant operational factory data. Requires Owner authorization and explicit confirmation."""
    if current_user.get("role") != "Owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company Owner accounts can authorize factory data purge."
        )

    if confirm_purge != "CONFIRM_PERMANENT_PURGE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing or invalid confirmation header 'x-confirm-purge: CONFIRM_PERMANENT_PURGE'."
        )

    company_id = current_user.get("company_id")
    try:
        deleted_payments = db.query(PaymentVoucher).filter(PaymentVoucher.company_id == company_id).delete()
        deleted_purchases = db.query(Purchase).filter(Purchase.company_id == company_id).delete()
        deleted_expenses = db.query(Expense).filter(Expense.company_id == company_id).delete()
        deleted_designs = db.query(Design).filter(Design.company_id == company_id).delete()
        deleted_parties = db.query(Party).filter(Party.company_id == company_id).delete()
        deleted_workers = db.query(Worker).filter(Worker.company_id == company_id).delete()
        db.commit()
        return {
            "status": "success",
            "message": f"All factory records for company '{company_id}' have been purged.",
            "deleted_counts": {
                "payments": deleted_payments,
                "purchases": deleted_purchases,
                "expenses": deleted_expenses,
                "designs": deleted_designs,
                "parties": deleted_parties,
                "workers": deleted_workers
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database purge failed: {str(e)}")
