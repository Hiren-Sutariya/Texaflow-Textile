import uuid
from fastapi import APIRouter, HTTPException
from app.schemas.domain import APIResponse, TaskCreate, TaskStatusUpdate
from app.db.mock_db import MOCK_DB
from datetime import datetime

router = APIRouter()

@router.get("", response_model=APIResponse)
def list_tasks():
    return APIResponse(success=True, message="Tasks retrieved", data=MOCK_DB["tasks"])

@router.post("", response_model=APIResponse)
def create_task(task: TaskCreate):
    new_t = task.model_dump()
    new_t["id"] = f"t-{uuid.uuid4().hex[:6]}"
    new_t["assigned_by"] = "Owner"
    new_t["status"] = "Assigned"
    new_t["assigned_at"] = datetime.utcnow().isoformat() + "Z"
    new_t["seen_at"] = None
    new_t["started_at"] = None
    new_t["completed_at"] = None
    
    MOCK_DB["tasks"].append(new_t)
    return APIResponse(success=True, message="Task created successfully", data=new_t)

@router.patch("/{task_id}/status", response_model=APIResponse)
def update_task_status(task_id: str, status_payload: TaskStatusUpdate):
    task = next((t for t in MOCK_DB["tasks"] if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    now = datetime.utcnow().isoformat() + "Z"
    new_status = status_payload.status
    
    if new_status == "Seen" and not task.get("seen_at"):
        task["seen_at"] = now
    elif new_status == "In_Progress":
        if not task.get("seen_at"):
            task["seen_at"] = now
        if not task.get("started_at"):
            task["started_at"] = now
    elif new_status == "Completed":
        if not task.get("seen_at"):
            task["seen_at"] = now
        if not task.get("started_at"):
            task["started_at"] = now
        task["completed_at"] = now
        
    task["status"] = new_status
    return APIResponse(success=True, message=f"Task status updated to {new_status}", data=task)
