/**
 * DigiScale Embroidery ERP - Centralized TypeScript Domain Types
 * Supports Multi-Unit Location Isolation & Owner Consolidated View
 */

export type LocationUnit = "unit_1" | "unit_2" | "all";

// 1. Party & Client Directory Types
export interface Party {
  id: string;
  unit_id?: string;
  code?: string;
  name: string;
  party_type: string;
  gstin?: string;
  pan?: string;
  mobile_number?: string;
  address?: string;
  city?: string;
  state?: string;
  credit_days?: number;
  created_at?: string;
}

// 2. Job Work Orders Types
export interface ColorwayBreakdown {
  color_name: string;
  pcs: number;
}

export interface JobOrder {
  id: string;
  unit_id?: string;
  order_no: string;
  party_name: string;
  design_code: string;
  design_name: string;
  colorways?: ColorwayBreakdown[];
  total_quantity: number;
  completed_pcs?: number;
  assigned_machine?: string;
  status: "Pending" | "In Production" | "Dhaga Cutting" | "Ready for Dispatch" | "Dispatched" | "Completed";
  target_date?: string;
  created_at?: string;
}

// 3. Embroidery Machine & Floor Production Types
export interface MachineJob {
  order_id?: string;
  party_name: string;
  design_code: string;
  design_name: string;
  target_pcs: number;
  completed_pcs: number;
  operator_name: string;
  started_date: string;
  completed_stitches?: number;
}

export interface EmbroideryMachine {
  id: string;
  unit_id?: string;
  machine_number: string;
  head_count: number;
  needle_count: number;
  status: "Running" | "Idle" | "Maintenance" | "No Material";
  current_job?: MachineJob;
}

export interface ProductionLog {
  id: string;
  unit_id?: string;
  date: string;
  machine_id: string;
  machine_name: string;
  shift: "Day" | "Night";
  operator_name: string;
  party_name: string;
  design_code: string;
  color_name?: string;
  completed_pcs: number;
  completed_stitches?: number;
  notes?: string;
}

// 4. Dispatches & Dhaga Cutting Stock Types
export interface FinishedDesignItem {
  id: string;
  unit_id?: string;
  order_id?: string;
  design_code: string;
  design_name: string;
  party_name: string;
  machine_number: string;
  total_pcs_produced: number;
  total_stitches?: number;
  completion_date: string;
  status: "Dhaga Cutting" | "Ready for Dispatch" | "Dispatched" | "Completed";
  dispatched_pcs?: number;
  remaining_pcs?: number;
}

// 5. Finance, Expenses & Payment Vouchers Types
export interface ExpenseItem {
  id: string;
  unit_id?: string;
  date: string;
  expense_category: string;
  title: string;
  amount: number;
  paid_by: string;
  payment_method: string;
  notes?: string;
}

export interface PaymentVoucher {
  id: string;
  unit_id?: string;
  date: string;
  party_name: string;
  voucher_no: string;
  amount: number;
  payment_mode: string;
  reference_no?: string;
  notes?: string;
}

// 6. Inventory & Yarn Stock Types
export interface InventoryStockItem {
  id: string;
  unit_id?: string;
  item_code: string;
  item_name: string;
  category: "Yarn" | "Fabric" | "Jari" | "Spares" | "Other";
  unit: "kg" | "meters" | "boxes" | "pcs";
  current_quantity: number;
  min_alert_limit: number;
  ownership: "Company" | "Party";
  party_name?: string;
  last_updated?: string;
}

// 7. Karigar & Staff Types
export interface Employee {
  id: string;
  unit_id?: string;
  code: string;
  name: string;
  role: "Operator" | "Helper" | "Master" | "Manager" | "Technician";
  shift: "Day" | "Night";
  mobile_number?: string;
  monthly_salary?: number;
  status: "Active" | "Inactive";
}
