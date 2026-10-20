"""Legacy alias router for Workers under /employees."""
from fastapi import APIRouter
from app.api.v1.workers import router as workers_router

router = APIRouter(prefix="/employees", tags=["Employees (Alias)"])

for route in workers_router.routes:
    router.routes.append(route)
