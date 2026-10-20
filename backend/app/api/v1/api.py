from fastapi import APIRouter
from app.api.v1.parties import router as parties_router
from app.api.v1.vendors import router as vendors_router
from app.api.v1.workers import router as workers_router
from app.api.v1.employees import router as employees_router
from app.api.v1.expenses import router as expenses_router
from app.api.v1.purchases import router as purchases_router
from app.api.v1.payments import router as payments_router
from app.api.v1.categories import router as categories_router
from app.api.v1.designs import router as designs_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.auth import router as auth_router
from app.api.v1.system import router as system_router

api_router = APIRouter()

# Core Business Modules matching ERP Workflow
api_router.include_router(parties_router)
api_router.include_router(vendors_router)
api_router.include_router(workers_router)
api_router.include_router(employees_router)
api_router.include_router(expenses_router)
api_router.include_router(purchases_router)
api_router.include_router(payments_router)
api_router.include_router(categories_router)
api_router.include_router(designs_router)
api_router.include_router(dashboard_router)
api_router.include_router(auth_router)
api_router.include_router(system_router)
