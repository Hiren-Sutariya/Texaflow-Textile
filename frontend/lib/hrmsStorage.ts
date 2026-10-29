import { getTenantItem, setTenantItem, getStoredCompanyId } from "./tenantStorage";
import { fetchApi } from "./api";
import { AttendancePunch, SalaryPayoutRecord, SalaryDeductionItem } from "@/types/hrms";

const ATTENDANCE_STORAGE_KEY = "texaflow_hrms_attendance_logs";
const PAYOUT_STORAGE_KEY = "texaflow_hrms_payout_records";

// Calculate status from hours
export function calculateAttendanceStatus(hours: number): {
  status: "Full Day" | "Half Day" | "Absent" | "Overtime" | "Present";
  overtime_hours: number;
} {
  if (hours <= 0) {
    return { status: "Present", overtime_hours: 0 };
  }
  if (hours >= 9.5) {
    return { status: "Overtime", overtime_hours: Math.round((hours - 8) * 10) / 10 };
  }
  if (hours >= 7.5) {
    return { status: "Full Day", overtime_hours: 0 };
  }
  if (hours >= 3.5) {
    return { status: "Half Day", overtime_hours: 0 };
  }
  return { status: "Absent", overtime_hours: 0 };
}

// 1. Attendance Storage helpers
export function getStoredAttendance(): AttendancePunch[] {
  if (typeof window === "undefined") return [];
  try {
    const cid = getStoredCompanyId() || "comp-001";
    const logs = getTenantItem<AttendancePunch[]>(ATTENDANCE_STORAGE_KEY) || [];
    return logs.filter((l) => (l.company_id || cid) === cid);
  } catch {
    return [];
  }
}

export function saveAttendancePunch(punch: AttendancePunch): AttendancePunch[] {
  try {
    const cid = getStoredCompanyId() || "comp-001";
    const all = getTenantItem<AttendancePunch[]>(ATTENDANCE_STORAGE_KEY) || [];
    const filtered = all.filter((l) => !(l.id === punch.id || (l.worker_id === punch.worker_id && l.date === punch.date)));
    const updated = [{ ...punch, company_id: cid }, ...filtered];
    setTenantItem(ATTENDANCE_STORAGE_KEY, updated);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hrms_attendance_updated"));
      window.dispatchEvent(new CustomEvent("app_data_update"));
    }
    return updated;
  } catch {
    return [];
  }
}

// 2. Salary Payout helpers
export function getStoredPayouts(): SalaryPayoutRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const cid = getStoredCompanyId() || "comp-001";
    const payouts = getTenantItem<SalaryPayoutRecord[]>(PAYOUT_STORAGE_KEY) || [];
    return payouts.filter((p) => (p.company_id || cid) === cid);
  } catch {
    return [];
  }
}

export function saveSalaryPayout(record: SalaryPayoutRecord): SalaryPayoutRecord[] {
  try {
    const cid = getStoredCompanyId() || "comp-001";
    const all = getTenantItem<SalaryPayoutRecord[]>(PAYOUT_STORAGE_KEY) || [];
    const filtered = all.filter((p) => p.id !== record.id);
    const updated = [{ ...record, company_id: cid }, ...filtered];
    setTenantItem(PAYOUT_STORAGE_KEY, updated);

    // Auto-create Karigar Salary expense in Expenses table if paid
    if (record.payment_status === "Paid" && record.paid_amount > 0) {
      autoRecordSalaryExpense(record);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hrms_payout_updated"));
      window.dispatchEvent(new CustomEvent("app_data_update"));
    }
    return updated;
  } catch {
    return [];
  }
}

// Automatically create an expense in expenses table under "Karigar Salary"
export function autoRecordSalaryExpense(payout: SalaryPayoutRecord) {
  try {
    const cid = getStoredCompanyId() || "comp-001";
    const existingExpenses = getTenantItem<any[]>("texaflow_expenses") || [];
    
    // Check if already created for this payout
    const alreadyExists = existingExpenses.some(
      (e) => e.notes && e.notes.includes(payout.payout_no)
    );
    if (alreadyExists) return;

    let maxSeq = 0;
    existingExpenses.forEach((item) => {
      if (item.expense_no) {
        const m = item.expense_no.match(/EB-(\d+)/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      }
    });
    const nextExpenseNo = `EB-${String(maxSeq + 1).padStart(3, "0")}`;

    const parts = payout.payment_date.split("-");
    const formattedDate = parts.length === 3 && parts[0].length === 4
      ? `${parts[2]}-${parts[1]}-${parts[0]}`
      : payout.payment_date;

    const breakdownNote = `${payout.worker_name} Salary (${payout.month_label}) | Gross: ₹${payout.total_earnings} - Deductions: ₹${payout.total_deductions} [Ref: ${payout.payout_no}]`;

    const newExpense = {
      id: `exp-sal-${Date.now()}`,
      expense_no: nextExpenseNo,
      company_id: cid,
      date: formattedDate,
      category: "Karigar Salary",
      vendor_name: payout.worker_name,
      amount: payout.paid_amount,
      payment_status: "Paid",
      paid_via: payout.payment_mode || "Cash",
      notes: breakdownNote,
      created_at: new Date().toISOString()
    };

    const updated = [newExpense, ...existingExpenses];
    setTenantItem("texaflow_expenses", updated);

    // Call API in background
    fetchApi("/expenses", {
      method: "POST",
      body: JSON.stringify(newExpense)
    }).catch(() => {});
  } catch (err) {
    console.error("Auto record salary expense error:", err);
  }
}

// Fetch Upad / Advances taken by worker in a given month from Expenses
export function getWorkerMonthlyUpad(workerName: string, monthStr: string): { total: number; items: any[] } {
  if (typeof window === "undefined" || !workerName) return { total: 0, items: [] };
  try {
    const expenses = getTenantItem<any[]>("texaflow_expenses") || [];
    const cleanWorker = workerName.trim().toLowerCase();

    // monthStr: YYYY-MM
    const matching = expenses.filter((e) => {
      const isUpadCat = e.category && (
        e.category.toLowerCase().includes("upad") ||
        e.category.toLowerCase().includes("advance") ||
        e.category.toLowerCase().includes("worker advance")
      );
      if (!isUpadCat) return false;

      // Check if payee or notes contains the worker's name
      const payee = (e.vendor_name || "").toLowerCase();
      const notes = (e.notes || "").toLowerCase();
      const matchesWorker = payee.includes(cleanWorker) || notes.includes(cleanWorker);
      if (!matchesWorker) return false;

      // Check date match for month
      // Date in expense can be DD-MM-YYYY or YYYY-MM-DD
      const d = String(e.date || "");
      if (d.includes(monthStr)) return true;
      const parts = d.split("-");
      if (parts.length === 3 && parts[2].length === 4) {
        // DD-MM-YYYY -> YYYY-MM
        const yyyymm = `${parts[2]}-${parts[1]}`;
        return yyyymm === monthStr;
      }
      return false;
    });

    const total = matching.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    return { total, items: matching };
  } catch {
    return { total: 0, items: [] };
  }
}
