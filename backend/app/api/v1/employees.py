from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.core.formatters import generate_short_id
from app.core.tenant import get_tenant_company_id

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("", response_model=List[EmployeeResponse])
def get_employees(
    role: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    query = db.query(Employee).filter(Employee.company_id == company_id)
    if role and role != "All":
        query = query.filter(Employee.role == role)
    if status and status != "All":
        query = query.filter(Employee.status == status)
    return query.order_by(Employee.id.asc()).all()

@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    emp_in: EmployeeCreate, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    data = emp_in.model_dump()
    data["company_id"] = company_id
    if not data.get("id") or len(str(data.get("id"))) > 10:
        data["id"] = generate_short_id(db, Employee, "emp")
    employee = Employee(**data)
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee

@router.put("/{emp_id}", response_model=EmployeeResponse)
def update_employee(
    emp_id: str, 
    emp_in: EmployeeUpdate, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    employee = db.query(Employee).filter(Employee.id == emp_id, Employee.company_id == company_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    update_data = emp_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(employee, key, value)
    db.commit()
    db.refresh(employee)
    return employee

@router.delete("/{emp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    emp_id: str, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    employee = db.query(Employee).filter(Employee.id == emp_id, Employee.company_id == company_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(employee)
    db.commit()
    return None

