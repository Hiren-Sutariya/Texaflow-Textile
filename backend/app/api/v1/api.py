from fastapi import APIRouter
from app.api.v1.expenses import router as expenses_router
from app.api.v1.payments import router as payments_router
from app.api.v1.vendors import router as vendors_router
from app.api.v1.employees import router as employees_router
from app.api.v1.designs import router as designs_router
from app.api.v1.dashboard import router as dashboard_router

api_router = APIRouter()

api_router.include_router(expenses_router)
api_router.include_router(payments_router)
api_router.include_router(vendors_router)
api_router.include_router(employees_router)
api_router.include_router(designs_router)
api_router.include_router(dashboard_router)
