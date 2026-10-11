from fastapi import APIRouter
from app.schemas.domain import APIResponse
from app.db.mock_db import MOCK_DB

router = APIRouter()

@router.get("/summary", response_model=APIResponse)
def get_dashboard_summary():
    # Calculate live dashboard metrics from MOCK_DB
    today_production = sum(pe["accepted_quantity"] for pe in MOCK_DB["production_entries"])
    pending_job_works = sum(1 for jw in MOCK_DB["job_works"] if jw["status"] in ["Draft", "Planned", "In_Production"])
    
    total_company_stock = sum(s["current_stock_quantity"] for s in MOCK_DB["stock"] if s["ownership_type"] == "Company")
    total_party_stock = sum(s["current_stock_quantity"] for s in MOCK_DB["stock"] if s["ownership_type"] == "Party")
    
    receivables_total = sum(r["balance_amount"] for r in MOCK_DB["receivables"])
    payables_total = sum(p["balance_amount"] for p in MOCK_DB["payables"])
    today_expenses = sum(e["amount"] for e in MOCK_DB["expenses"])
    current_month_profit = 145000.0  # Revenue - Cost
    
    # Production snapshot
    production_snapshot = [
        {
            "machine": m["machine_number"],
            "worker": m["current_worker_name"] or "Unassigned",
            "design": m["current_design_name"] or "None",
            "quantity": 1200 if m["status"] == "Running" else 0,
            "status": m["status"]
        }
        for m in MOCK_DB["machines"]
    ]
    
    # Operational Alerts
    alerts = [
        {"type": "Delayed Job Work", "title": "JW-2026-001 (ABC Tex)", "message": "Expected delivery due in 4 days. High priority.", "severity": "Amber"},
        {"type": "Material Shortage", "title": "Gold Metallic Jari 250D", "message": "Shortage of 6 kg for JW-2026-001. Purchase PO pending.", "severity": "Red"},
        {"type": "Overdue Payment", "title": "ABC Tex Fabrics", "message": "Receivable invoice INV-2026-012 balance ₹15,000 pending.", "severity": "Amber"},
        {"type": "Machine Maintenance", "title": "SURAJ 500 (M-104)", "message": "Scheduled head oiling & tension adjustment in progress.", "severity": "Blue"}
    ]
    
    data = {
        "metrics": {
            "today_production_pieces": today_production,
            "pending_job_works_count": pending_job_works,
            "total_company_stock_qty": total_company_stock,
            "total_party_stock_qty": total_party_stock,
            "receivable_amount": receivables_total,
            "payable_amount": payables_total,
            "today_expenses": today_expenses,
            "current_month_profit": current_month_profit
        },
        "production_snapshot": production_snapshot,
        "alerts": alerts
    }
    
    return APIResponse(success=True, message="Dashboard summary retrieved", data=data)
