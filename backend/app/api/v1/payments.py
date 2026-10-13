from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.payment import PaymentVoucher
from app.schemas.payment import PaymentVoucherCreate, PaymentVoucherResponse
from app.core.formatters import format_to_dd_mm_yyyy, generate_short_id
from app.core.tenant import get_tenant_company_id

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("", response_model=List[PaymentVoucherResponse])
def get_payment_vouchers(
    voucher_type: Optional[str] = None,
    party_name: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    company_id: str = Depends(get_tenant_company_id),
    db: Session = Depends(get_db)
):
    query = db.query(PaymentVoucher).filter(PaymentVoucher.company_id == company_id)
    if voucher_type:
        query = query.filter(PaymentVoucher.voucher_type == voucher_type)
    if party_name:
        query = query.filter(PaymentVoucher.party_name == party_name)
    return query.order_by(PaymentVoucher.created_at.desc(), PaymentVoucher.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=PaymentVoucherResponse, status_code=status.HTTP_201_CREATED)
def create_payment_voucher(
    voucher_in: PaymentVoucherCreate,
    company_id: str = Depends(get_tenant_company_id),
    db: Session = Depends(get_db)
):
    data = voucher_in.model_dump()
    data["company_id"] = company_id
    if data.get("date"):
        data["date"] = format_to_dd_mm_yyyy(data["date"])
    if not data.get("id") or len(str(data.get("id"))) > 10:
        data["id"] = generate_short_id(db, PaymentVoucher, "pay")
    if not data.get("voucher_no"):
        count = db.query(PaymentVoucher).filter(PaymentVoucher.company_id == company_id).count()
        data["voucher_no"] = f"VCH-2026-{200 + count + 1}"

    voucher = PaymentVoucher(**data)
    db.add(voucher)
    db.commit()
    db.refresh(voucher)
    return voucher

@router.delete("/{voucher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment_voucher(
    voucher_id: str,
    company_id: str = Depends(get_tenant_company_id),
    db: Session = Depends(get_db)
):
    voucher = db.query(PaymentVoucher).filter(
        PaymentVoucher.id == voucher_id,
        PaymentVoucher.company_id == company_id
    ).first()
    if not voucher:
        raise HTTPException(status_code=404, detail="Voucher not found")
    db.delete(voucher)
    db.commit()
    return None

