from typing import List
from fastapi import HTTPException, status
from app.schemas.domain import PartnerConfigUpdate

class PartnerService:
    @staticmethod
    def validate_partner_percentages(partners: List[PartnerConfigUpdate]) -> bool:
        """
        Validates that total profit share and loss share across all active partners equals 100.0%.
        Does NOT allow hardcoding 33.33/33.33/33.33. Supports 50/25/25 or 33.33/33.33/33.34.
        """
        total_profit = sum(p.profit_share_percent for p in partners)
        total_loss = sum(p.loss_share_percent for p in partners)
        
        if abs(total_profit - 100.0) > 0.01:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Total profit share percentage must equal 100.0%. Current total: {total_profit:.2f}%"
            )
            
        if abs(total_loss - 100.0) > 0.01:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Total loss share percentage must equal 100.0%. Current total: {total_loss:.2f}%"
            )
            
        return True

    @staticmethod
    def calculate_distribution(net_profit_loss: float, partners: List[PartnerConfigUpdate]) -> List[dict]:
        """
        Distributes monthly/yearly profit or loss to partners based on configured percentages.
        """
        is_profit = net_profit_loss >= 0
        distribution = []
        
        for p in partners:
            pct = p.profit_share_percent if is_profit else p.loss_share_percent
            allocated_amount = (net_profit_loss * pct) / 100.0
            distribution.append({
                "partner_id": p.id,
                "partner_name": p.name,
                "share_percent": pct,
                "allocated_amount": round(allocated_amount, 2),
                "type": "Profit" if is_profit else "Loss"
            })
            
        return distribution
