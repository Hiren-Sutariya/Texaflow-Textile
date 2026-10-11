from fastapi import APIRouter
from app.schemas.domain import APIResponse
from app.db.mock_db import MOCK_DB

router = APIRouter()

@router.get("/production", response_model=APIResponse)
def get_production_report():
    data = {
        "daily_summary": MOCK_DB["production_entries"],
        "worker_performance": [
            {"worker_name": "Ramesh Karigar", "total_produced": 1200, "accepted": 1180, "rejected": 20, "efficiency_pct": 98.3, "payout": 177.0},
            {"worker_name": "Suresh Operator", "total_produced": 1400, "accepted": 1390, "rejected": 10, "efficiency_pct": 99.2, "payout": 208.5}
        ],
        "machine_efficiency": [
            {"machine": "M-101", "running_hours": 8.0, "status": "Running", "output_pieces": 1200},
            {"machine": "M-102", "running_hours": 7.5, "status": "Running", "output_pieces": 1400}
        ]
    }
    return APIResponse(success=True, message="Production report generated", data=data)

@router.get("/financial", response_model=APIResponse)
def get_financial_report():
    data = {
        "monthly_revenue": 245000.0,
        "total_material_cost": 45000.0,
        "total_worker_payout": 28000.0,
        "total_expenses": 22700.0,
        "net_profit": 149300.0,
        "receivables_outstanding": 15000.0,
        "payables_outstanding": 15050.0
    }
    return APIResponse(success=True, message="Financial report generated", data=data)
