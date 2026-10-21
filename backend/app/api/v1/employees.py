from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.worker import Worker
from app.schemas.worker import WorkerCreate, WorkerUpdate, WorkerResponse
from app.core.formatters import generate_short_id
from app.core.tenant import get_tenant_company_id

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("", response_model=List[WorkerResponse])
def get_employees(
    role: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    query = db.query(Worker).filter(Worker.company_id == company_id, Worker.is_deleted == False)
    if role and role != "All":
        query = query.filter(Worker.role == role)
    if status and status != "All":
        query = query.filter(Worker.status == status)
    return query.order_by(Worker.id.asc()).all()

@router.post("", response_model=WorkerResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    worker_in: WorkerCreate, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    data = worker_in.model_dump()
    data["company_id"] = company_id
    data["is_deleted"] = False
    if not data.get("id") or len(str(data.get("id"))) > 10:
        data["id"] = generate_short_id(db, Worker, "wrk")
    worker = Worker(**data)
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker

@router.put("/{worker_id}", response_model=WorkerResponse)
def update_employee(
    worker_id: str, 
    worker_in: WorkerUpdate, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    worker = db.query(Worker).filter(Worker.id == worker_id, Worker.company_id == company_id, Worker.is_deleted == False).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Employee not found")
    update_data = worker_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(worker, key, value)
    db.commit()
    db.refresh(worker)
    return worker

@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    worker_id: str, 
    db: Session = Depends(get_db),
    company_id: str = Depends(get_tenant_company_id)
):
    worker = db.query(Worker).filter(Worker.id == worker_id, Worker.company_id == company_id, Worker.is_deleted == False).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Employee not found")
    worker.is_deleted = True
    worker.deleted_at = datetime.utcnow()
    worker.deleted_by = "Admin"
    db.commit()
    return None
