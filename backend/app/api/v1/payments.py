from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.payment import PaymentVoucher
from app.schemas.payment import PaymentVoucherCreate, PaymentVoucherResponse

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("", response_model=List[PaymentVoucherResponse])
def get_payment_vouchers(
    voucher_type: Optional[str] = None,
    party_name: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    query = db.query(PaymentVoucher)
    if voucher_type:
        query = query.filter(PaymentVoucher.voucher_type == voucher_type)
    if party_name:
        query = query.filter(PaymentVoucher.party_name == party_name)
    return query.order_by(PaymentVoucher.date.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=PaymentVoucherResponse, status_code=status.HTTP_201_CREATED)
def create_payment_voucher(voucher_in: PaymentVoucherCreate, db: Session = Depends(get_db)):
    data = voucher_in.model_dump()
    if not data.get("voucher_no"):
        count = db.query(PaymentVoucher).count()
        data["voucher_no"] = f"VCH-2026-{200 + count + 1}"

    voucher = PaymentVoucher(**data)
    db.add(voucher)
    db.commit()
    db.refresh(voucher)
    return voucher

@router.delete("/{voucher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment_voucher(voucher_id: str, db: Session = Depends(get_db)):
    voucher = db.query(PaymentVoucher).filter(PaymentVoucher.id == voucher_id).first()
    if not voucher:
        raise HTTPException(status_code=404, detail="Voucher not found")
    db.delete(voucher)
    db.commit()
    return None
