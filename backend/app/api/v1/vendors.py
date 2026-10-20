"""Legacy alias router for Parties under /vendors."""
from fastapi import APIRouter
from app.api.v1.parties import router as parties_router

router = APIRouter(prefix="/vendors", tags=["Vendors (Alias)"])

for route in parties_router.routes:
    router.routes.append(route)
