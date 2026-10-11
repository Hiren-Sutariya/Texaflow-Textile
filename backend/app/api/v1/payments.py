import uuid
from fastapi import APIRouter
from app.schemas.domain import APIResponse, PaymentCreate
from app.db.mock_db import MOCK_DB

router = APIRouter()

@router.get("/receivables", response_model=APIResponse)
def list_receivables():
    return APIResponse(success=True, message="Receivables retrieved", data=MOCK_DB["receivables"])

@router.get("/payables", response_model=APIResponse)
def list_payables():
    return APIResponse(success=True, message="Payables retrieved", data=MOCK_DB["payables"])

@router.post("", response_model=APIResponse)
def record_payment(pay: PaymentCreate):
    new_pay = pay.model_dump()
    new_pay["id"] = f"pmt-{uuid.uuid4().hex[:6]}"
    return APIResponse(success=True, message="Payment recorded successfully", data=new_pay)
