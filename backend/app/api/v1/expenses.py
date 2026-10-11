import uuid
from fastapi import APIRouter
from app.schemas.domain import APIResponse, ExpenseCreate
from app.db.mock_db import MOCK_DB

router = APIRouter()

@router.get("", response_model=APIResponse)
def list_expenses():
    return APIResponse(success=True, message="Expenses retrieved", data=MOCK_DB["expenses"])

@router.post("", response_model=APIResponse)
def create_expense(exp: ExpenseCreate):
    new_exp = exp.model_dump()
    new_exp["id"] = f"exp-{uuid.uuid4().hex[:6]}"
    MOCK_DB["expenses"].append(new_exp)
    return APIResponse(success=True, message="Expense logged successfully", data=new_exp)
