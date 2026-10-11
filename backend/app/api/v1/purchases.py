import uuid
from fastapi import APIRouter
from app.schemas.domain import APIResponse, PurchaseCreate
from app.db.mock_db import MOCK_DB
from datetime import datetime

router = APIRouter()

@router.get("", response_model=APIResponse)
def list_purchases():
    return APIResponse(success=True, message="Purchases retrieved", data=MOCK_DB["purchases"])

@router.post("", response_model=APIResponse)
def create_purchase(po: PurchaseCreate):
    vendor = next((p for p in MOCK_DB["parties"] if p["id"] == po.vendor_id), None)
    vendor_name = vendor["name"] if vendor else "Vendor"
    
    total_amt = sum(item.ordered_quantity * item.rate for item in po.items)
    gst_amt = total_amt * 0.18
    net_amt = total_amt + gst_amt + po.transport_charges + po.other_charges
    
    new_po = {
        "id": f"pur-{uuid.uuid4().hex[:6]}",
        "vendor_id": po.vendor_id,
        "vendor_name": vendor_name,
        "po_number": po.po_number,
        "order_date": str(po.order_date),
        "expected_date": str(po.expected_date) if po.expected_date else None,
        "status": "PO_Issued",
        "total_amount": round(total_amt, 2),
        "gst_amount": round(gst_amt, 2),
        "transport_charges": po.transport_charges,
        "other_charges": po.other_charges,
        "net_amount": round(net_amt, 2),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    MOCK_DB["purchases"].append(new_po)
    return APIResponse(success=True, message="Purchase order created", data=new_po)
