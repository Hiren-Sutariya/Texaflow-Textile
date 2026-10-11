from fastapi import APIRouter
from app.api.v1.expenses import router as expenses_router
from app.api.v1.payments import router as payments_router
from app.api.v1.parties import router as parties_router
from app.api.v1.vendors import router as vendors_router
from app.api.v1.job_works import router as job_works_router
from app.api.v1.production import router as production_router
from app.api.v1.dispatches import router as dispatches_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.employees import router as employees_router
from app.api.v1.dashboard import router as dashboard_router

api_router = APIRouter()

api_router.include_router(expenses_router)
api_router.include_router(payments_router)
api_router.include_router(parties_router)
api_router.include_router(vendors_router)
api_router.include_router(job_works_router)
api_router.include_router(production_router)
api_router.include_router(dispatches_router)
api_router.include_router(inventory_router)
api_router.include_router(employees_router)
api_router.include_router(dashboard_router)
