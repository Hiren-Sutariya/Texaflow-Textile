from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

# --- Generic API Response ---
class APIResponse(BaseModel):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[dict | list] = None
    code: Optional[str] = None

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    token: Optional[str] = None

# --- Party Schemas ---
class PartyCreate(BaseModel):
    code: str
    name: str
    party_type: str = Field(..., description="Job Work Party, Customer, Vendor, Supplier, Broker, Trader, Other")
    gstin: Optional[str] = None
    pan: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    credit_days: int = 30

class PartyResponse(PartyCreate):
    id: str
    created_at: datetime

# --- Design Schemas ---
class DesignCreate(BaseModel):
    design_number: str
    design_name: str
    stitch_count: int = 0
    machine_requirement: str = "Multi-head Embroidery"
    default_rate: float = 0.0
    image_url: Optional[str] = None
    file_url: Optional[str] = None
    notes: Optional[str] = None

class DesignResponse(DesignCreate):
    id: str
    created_at: datetime

# --- Material & Inventory Schemas ---
class MaterialCreate(BaseModel):
    code: str
    name: str
    category_name: str = "Thread"
    unit: str = "kg"
    min_stock_alert: float = 5.0
    reorder_level: float = 10.0

class MaterialResponse(MaterialCreate):
    id: str
    created_at: datetime

class StockItemResponse(BaseModel):
    id: str
    material_id: str
    material_code: str
    material_name: str
    unit: str
    warehouse_name: str
    ownership_type: str  # Company or Party
    party_id: Optional[str] = None
    party_name: Optional[str] = None
    current_stock_quantity: float
    updated_at: datetime

class StockMovementCreate(BaseModel):
    material_id: str
    warehouse_name: str = "Raw Material"
    ownership_type: str = "Company"
    party_id: Optional[str] = None
    movement_type: str  # Opening, Purchase_Receive, Production_Consume, Production_Return, Dispatch, Party_Receive, Party_Return, Adjustment
    quantity: float
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None

# --- Job Work Schemas ---
class JobWorkFabricCreate(BaseModel):
    fabric_name: str
    fabric_type: Optional[str] = None
    color: Optional[str] = None
    lot_number: Optional[str] = None
    quantity_meters: float
    received_date: date

class JobWorkDesignCreate(BaseModel):
    design_id: str
    color: str
    fabric: str
    required_quantity: int
    rate_per_piece: float
    expected_prod_time_mins: int = 0
    notes: Optional[str] = None

class JobWorkMaterialCreate(BaseModel):
    material_id: str
    required_quantity: float
    unit: str
    provided_by: str = Field(..., description="Party, Company, Purchase_Required")

class JobWorkCreate(BaseModel):
    jw_number: str
    party_id: str
    received_date: date
    expected_delivery_date: date
    payment_terms: str = "30 Days"
    rate_type: str = "Per Piece"
    notes: Optional[str] = None
    fabrics: List[JobWorkFabricCreate] = []
    designs: List[JobWorkDesignCreate] = []
    required_materials: List[JobWorkMaterialCreate] = []

class ShortageItem(BaseModel):
    material_id: str
    material_code: str
    material_name: str
    unit: str
    required_quantity: float
    available_stock: float
    shortage_quantity: float
    purchase_required: bool

class ShortageReportResponse(BaseModel):
    job_work_id: str
    jw_number: str
    party_name: str
    shortage_items: List[ShortageItem]
    total_shortage_items_count: int

# --- Production & Machine Schemas ---
class MachineResponse(BaseModel):
    id: str
    machine_number: str
    machine_name: str
    machine_type: str
    head_count: int
    status: str  # Running, Idle, Breakdown, Maintenance
    current_worker_name: Optional[str] = None
    current_design_name: Optional[str] = None

class WorkerResponse(BaseModel):
    id: str
    employee_name: str
    mobile: str
    skill_level: str
    machine_specialization: str
    production_rate_per_unit: float
    shift: str = "Day Shift"

class ProductionEntryCreate(BaseModel):
    production_order_id: str
    entry_date: date
    shift: str = "Day Shift"
    machine_id: str
    worker_id: str
    produced_quantity: int
    rejected_quantity: int = 0
    rejection_reason: Optional[str] = None  # Design Issue, Thread Issue, Fabric Issue, Machine Issue, Worker Error, Other
    machine_hours: float = 8.0
    notes: Optional[str] = None

class ProductionEntryResponse(BaseModel):
    id: str
    production_order_id: str
    entry_date: date
    shift: str
    machine_number: str
    worker_name: str
    produced_quantity: int
    rejected_quantity: int
    accepted_quantity: int
    machine_hours: float
    rejection_reason: Optional[str] = None

# --- Purchase Schemas ---
class PurchaseItemCreate(BaseModel):
    material_id: str
    ordered_quantity: float
    rate: float
    gst_percent: float = 18.0

class PurchaseCreate(BaseModel):
    vendor_id: str
    po_number: str
    order_date: date
    expected_date: Optional[date] = None
    transport_charges: float = 0.0
    other_charges: float = 0.0
    items: List[PurchaseItemCreate]

# --- Finance & Costing Schemas ---
class ExpenseCreate(BaseModel):
    category: str
    amount: float
    expense_date: date
    payment_method: str = "Bank"
    description: Optional[str] = None

class PaymentCreate(BaseModel):
    payment_type: str  # Receive or Pay
    party_id: Optional[str] = None
    vendor_id: Optional[str] = None
    amount: float
    payment_date: date
    payment_mode: str = "Bank"
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class JobCostingResponse(BaseModel):
    job_work_id: str
    jw_number: str
    party_name: str
    total_revenue: float
    material_cost: float
    worker_cost: float
    machine_cost: float
    electricity_cost: float
    allocated_overhead: float
    total_cost: float
    net_profit: float
    profit_margin_percent: float
    profit_per_piece: float
    is_costing_complete: bool = True

# --- Partner Schemas ---
class PartnerConfigUpdate(BaseModel):
    id: str
    name: str
    profit_share_percent: float
    loss_share_percent: float

class PartnerTransactionCreate(BaseModel):
    partner_id: str
    transaction_type: str  # Investment, Profit_Distribution, Loss_Allocation, Drawing, Withdrawal, Settlement
    amount: float
    transaction_date: date
    notes: Optional[str] = None

# --- Task Schemas ---
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: str = "Medium"
    due_date: date

class TaskStatusUpdate(BaseModel):
    status: str  # Assigned, Seen, In_Progress, Completed
