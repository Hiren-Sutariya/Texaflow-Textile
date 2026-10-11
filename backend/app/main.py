from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api.v1 import (
    auth,
    dashboard,
    parties,
    job_works,
    inventory,
    production,
    purchases,
    dispatches,
    payments,
    expenses,
    partners,
    tasks,
    reports,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="DigiScale Production ERP API for Embroidery Manufacturing & Job Work Operations"
)

# CORS Middleware allowing Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router Mounts
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(parties.router, prefix=f"{settings.API_V1_STR}/parties", tags=["Parties"])
app.include_router(job_works.router, prefix=f"{settings.API_V1_STR}/job-works", tags=["Job Works"])
app.include_router(inventory.router, prefix=f"{settings.API_V1_STR}/inventory", tags=["Inventory"])
app.include_router(production.router, prefix=f"{settings.API_V1_STR}/production", tags=["Production"])
app.include_router(purchases.router, prefix=f"{settings.API_V1_STR}/purchases", tags=["Purchases"])
app.include_router(dispatches.router, prefix=f"{settings.API_V1_STR}/dispatches", tags=["Dispatches"])
app.include_router(payments.router, prefix=f"{settings.API_V1_STR}/payments", tags=["Payments"])
app.include_router(expenses.router, prefix=f"{settings.API_V1_STR}/expenses", tags=["Expenses"])
app.include_router(partners.router, prefix=f"{settings.API_V1_STR}/partners", tags=["Partners"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["Tasks"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports"])

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }
