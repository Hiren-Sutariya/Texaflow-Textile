from typing import List, Dict
from app.schemas.domain import ShortageItem, ShortageReportResponse

class ShortageService:
    @staticmethod
    def calculate_job_work_shortage(
        job_work_id: str,
        jw_number: str,
        party_name: str,
        required_materials: List[Dict],
        current_inventory: List[Dict]
    ) -> ShortageReportResponse:
        """
        Calculates material shortage for a job work against available company stock.
        Formula: Shortage = max(0, Required Quantity - Available Stock)
        """
        inventory_map = {item["material_id"]: item["current_stock_quantity"] for item in current_inventory}
        
        shortage_items: List[ShortageItem] = []
        for req in required_materials:
            mat_id = req["material_id"]
            req_qty = float(req["required_quantity"])
            avail_stock = float(inventory_map.get(mat_id, 0.0))
            
            # If provided by party, no purchase required from company stock
            if req.get("provided_by") == "Party":
                shortage_qty = 0.0
                purchase_req = False
            else:
                shortage_qty = max(0.0, req_qty - avail_stock)
                purchase_req = shortage_qty > 0.0

            shortage_items.append(
                ShortageItem(
                    material_id=mat_id,
                    material_code=req.get("material_code", "MAT-UNK"),
                    material_name=req.get("material_name", "Material"),
                    unit=req.get("unit", "kg"),
                    required_quantity=req_qty,
                    available_stock=avail_stock,
                    shortage_quantity=shortage_qty,
                    purchase_required=purchase_req
                )
            )

        return ShortageReportResponse(
            job_work_id=job_work_id,
            jw_number=jw_number,
            party_name=party_name,
            shortage_items=shortage_items,
            total_shortage_items_count=sum(1 for x in shortage_items if x.purchase_required)
        )
