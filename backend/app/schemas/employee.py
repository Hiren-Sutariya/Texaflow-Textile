"""Legacy alias for Worker schemas."""
from app.schemas.worker import (
    WorkerBase as EmployeeBase,
    WorkerCreate as EmployeeCreate,
    WorkerUpdate as EmployeeUpdate,
    WorkerResponse as EmployeeResponse,
    WorkerBase,
    WorkerCreate,
    WorkerUpdate,
    WorkerResponse,
)

__all__ = [
    "EmployeeBase",
    "EmployeeCreate",
    "EmployeeUpdate",
    "EmployeeResponse",
    "WorkerBase",
    "WorkerCreate",
    "WorkerUpdate",
    "WorkerResponse",
]
