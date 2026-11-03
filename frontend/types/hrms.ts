export interface AttendancePunch {
  id: string;
  company_id: string;
  worker_id: string;
  worker_name: string;
  worker_code?: string;
  date: string; // YYYY-MM-DD
  clock_in: string | null; // HH:MM or ISO
  clock_out: string | null; // HH:MM or ISO
  total_hours: number;
  status: "Full Day" | "Half Day" | "Absent" | "Overtime" | "Present";
  overtime_hours: number;
  shift: "Day Shift" | "Night Shift";
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface SalaryDeductionItem {
  id: string;
  type: "upad" | "room_rent" | "electricity" | "mess_canteen" | "penalty" | "other";
  label: string;
  amount: number;
  date?: string;
  ref_id?: string; // Expense ID if from expenses
}

export interface SalaryPayoutRecord {
  id: string;
  payout_no: string; // e.g. SAL-2026-10-001
  company_id: string;
  worker_id: string;
  worker_name: string;
  worker_code?: string;
  month: string; // YYYY-MM
  month_label: string; // e.g. October 2026
  monthly_base_salary: number;
  total_days_in_month: number;
  full_days: number;
  half_days: number;
  absent_days: number;
  paid_days: number; // full_days + half_days * 0.5
  earned_gross_salary: number;
  overtime_amount: number;
  bonus_amount?: number;
  total_earnings: number;
  deductions: SalaryDeductionItem[];
  total_upad_deduction: number;
  total_other_deductions: number;
  total_deductions: number;
  net_payable: number;
  paid_amount: number;
  balance_due: number;
  payment_status: "Paid" | "Partially Paid" | "Pending";
  payment_date: string;
  payment_mode: string;
  expense_ref_id?: string;
  remarks?: string;
  created_at: string;
}

