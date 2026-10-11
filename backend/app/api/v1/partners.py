from typing import List
from fastapi import APIRouter
from app.schemas.domain import APIResponse, PartnerConfigUpdate
from app.services.partner_service import PartnerService
from app.db.mock_db import MOCK_DB

router = APIRouter()

@router.get("", response_model=APIResponse)
def list_partners():
    return APIResponse(success=True, message="Partners retrieved", data=MOCK_DB["partners"])

@router.put("/percentages", response_model=APIResponse)
def update_partner_percentages(configs: List[PartnerConfigUpdate]):
    # Validate sum equals 100.0%
    PartnerService.validate_partner_percentages(configs)
    
    for c in configs:
        for p in MOCK_DB["partners"]:
            if p["id"] == c.id:
                p["profit_share_percent"] = c.profit_share_percent
                p["loss_share_percent"] = c.loss_share_percent
                
    return APIResponse(success=True, message="Partner percentages updated successfully", data=MOCK_DB["partners"])

@router.get("/distribution", response_model=APIResponse)
def get_partner_profit_distribution(net_profit: float = 145000.0):
    configs = [PartnerConfigUpdate(**p) for p in MOCK_DB["partners"]]
    dist = PartnerService.calculate_distribution(net_profit, configs)
    return APIResponse(success=True, message="Profit allocation report generated", data=dist)
