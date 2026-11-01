import { getTenantItem, setTenantItem, getStoredCompanyId } from "./tenantStorage";
import { fetchApi } from "./api";
import { AttendancePunch, SalaryPayoutRecord, SalaryDeductionItem } from "@/types/hrms";

export interface WorkerItem {
  id: string;
  name: string;
  code?: string;
  role?: string;
  shift?: "Day Shift" | "Night Shift";
  assigned_machine?: string;
  monthly_salary?: number;
  phone?: string;
  photoUrl?: string;
  status?: string;
  company_id?: string;
}

export const DEFAULT_WORKERS: WorkerItem[] = [
  { id: "wrk-001", name: "Rakesh Bind", code: "KAR-001", role: "Karigar", shift: "Day Shift", assigned_machine: "Machine 1", monthly_salary: 33000 },
  { id: "wrk-002", name: "Gaurav", code: "KAR-002", role: "Karigar", shift: "Day Shift", assigned_machine: "Machine 3", monthly_salary: 33000 },
  { id: "wrk-003", name: "RajKumar", code: "STF-005", role: "Staff", shift: "Day Shift", monthly_salary: 10000 },
  { id: "wrk-004", name: "Tanuja", code: "STF-006", role: "Staff", shift: "Day Shift", monthly_salary: 10000 },
  { id: "wrk-005", name: "Kailash", code: "STF-007", role: "Staff", shift: "Day Shift", monthly_salary: 9500 },
];

export function getStoredWorkers(): WorkerItem[] {
  if (typeof window === "undefined") return DEFAULT_WORKERS;
  try {
    const cid = getStoredCompanyId() || "comp-001";

    // 1. Primary Source: app_employees_data (synchronized with Employees / Workers master)
    const saved = localStorage.getItem("app_employees_data");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const activeEmps = parsed.filter((e: any) => (e.company_id || cid) === cid && e.status !== "Inactive");
        if (activeEmps.length > 0) {
          return activeEmps.map((e: any, idx: number) => {
            const role = e.role || e.designation || (String(e.code || "").toUpperCase().startsWith("STF") ? "Staff" : "Karigar");
            const isStaff = role === "Staff" || e.employee_type === "Salaried Staff";
            const machine = isStaff ? undefined : (e.assignedMachine || e.assigned_machine || e.machine || "Machine 1");

            return {
              id: String(e.id || e._id || `emp-${idx + 1}`),
              name: e.name || e.employeeName || `Worker ${idx + 1}`,
              code: e.code || e.employeeCode || (isStaff ? `STF-${String(idx + 1).padStart(3, "0")}` : `KAR-${String(idx + 1).padStart(3, "0")}`),
              role,
              shift: e.shift === "Night Shift" ? "Night Shift" : "Day Shift",
              assigned_machine: machine,
              monthly_salary: Number(e.monthly_salary || e.baseSalary || e.salary || 30000),
              phone: e.phone,
              photoUrl: e.photoUrl,
              status: e.status || "Active",
              company_id: e.company_id || cid,
            };
          });
        }
      }
    }

    // 2. Secondary Source: Tenant storage
    const tenantWorkers = getTenantItem<any[]>("texaflow_workers") || getTenantItem<any[]>("texaflow_employees");
    if (Array.isArray(tenantWorkers) && tenantWorkers.length > 0) {
      const activeTenant = tenantWorkers.filter((w) => (w.company_id || cid) === cid && w.status !== "Inactive");
      if (activeTenant.length > 0) {
        return activeTenant.map((w: any, idx: number) => {
          const role = w.role || w.designation || (String(w.code || "").toUpperCase().startsWith("STF") ? "Staff" : "Karigar");
          const isStaff = role === "Staff" || w.employee_type === "Salaried Staff";
          const machine = isStaff ? undefined : (w.assigned_machine || w.assignedMachine || "Machine 1");

          return {
            id: String(w.id || `wrk-${idx + 1}`),
            name: w.name || "Worker",
            code: w.code || (isStaff ? `STF-${String(idx + 1).padStart(3, "0")}` : `KAR-${String(idx + 1).padStart(3, "0")}`),
            role,
            shift: w.shift === "Night Shift" ? "Night Shift" : "Day Shift",
            assigned_machine: machine,
            monthly_salary: Number(w.monthly_salary || w.salary || 30000),
            phone: w.phone,
            status: w.status || "Active",
            company_id: w.company_id || cid,
          };
        });
      }
    }
  } catch {}

  return DEFAULT_WORKERS;
}

export async function refreshWorkersFromApi(onSuccess?: (workers: WorkerItem[]) => void): Promise<WorkerItem[]> {
  try {
    const cid = getStoredCompanyId() || "comp-001";
    // Target the real /employees endpoint, not non-existent /workers
    const live = await fetchApi<any[]>("/employees");
    if (Array.isArray(live) && live.length > 0) {
      const scoped: WorkerItem[] = live
        .filter((w) => (w.company_id || cid) === cid && w.status !== "Inactive")
        .map((e: any, idx: number) => {
          const role = e.role || e.designation || (String(e.code || "").toUpperCase().startsWith("STF") ? "Staff" : "Karigar");
          const isStaff = role === "Staff" || e.employee_type === "Salaried Staff";
          const machine = isStaff ? undefined : (e.assignedMachine || e.assigned_machine || e.machine || "Machine 1");

          return {
            id: String(e.id || e._id || `emp-${idx + 1}`),
            name: e.name || e.employeeName || `Worker ${idx + 1}`,
            code: e.code || e.employeeCode || (isStaff ? `STF-${String(idx + 1).padStart(3, "0")}` : `KAR-${String(idx + 1).padStart(3, "0")}`),
            role,
            shift: e.shift === "Night Shift" ? "Night Shift" : "Day Shift",
            assigned_machine: machine,
            monthly_salary: Number(e.monthly_salary || e.baseSalary || e.salary || 30000),
            phone: e.phone,
            photoUrl: e.photoUrl,
            status: e.status || "Active",
            company_id: e.company_id || cid,
          };
        });
      if (scoped.length > 0) {
        onSuccess?.(scoped);
        return scoped;
      }
    }
  } catch {}
  return [];
}

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

export function deleteAttendancePunch(idOrWorkerId: string, date?: string): AttendancePunch[] {
  try {
    const all = getTenantItem<AttendancePunch[]>(ATTENDANCE_STORAGE_KEY) || [];
    const updated = all.filter((l) => {
      if (date) {
        return !(l.worker_id === idOrWorkerId && l.date === date);
      }
      return l.id !== idOrWorkerId;
    });
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

export interface CompanyCustomEvent {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD (start date)
  end_date?: string; // YYYY-MM-DD (end date if multi-day vacation)
  target: "all" | "staff" | "karigar";
  pay_type?: "paid" | "unpaid"; // Paid vs Unpaid Holiday
  description?: string;
}

export type SundayPolicy = "off" | "half_day" | "working";

export interface CompanyHolidayRules {
  karigar_sunday_policy?: SundayPolicy;
  staff_sunday_policy?: SundayPolicy;
  karigar_sunday_off: boolean;
  staff_sunday_off: boolean;
  // Shift Timings & Grace Time
  day_shift_start?: string;
  day_shift_end?: string;
  night_shift_start?: string;
  night_shift_end?: string;
  grace_period_mins?: number;
  // Overtime (OT) Rules
  ot_hourly_rate?: number;
  min_hours_for_ot?: number;
  custom_events: CompanyCustomEvent[];
}

export const DEFAULT_HOLIDAY_RULES: CompanyHolidayRules = {
  karigar_sunday_policy: "off",
  staff_sunday_policy: "off",
  karigar_sunday_off: true,
  staff_sunday_off: true,
  day_shift_start: "08:00",
  day_shift_end: "20:00",
  night_shift_start: "20:00",
  night_shift_end: "08:00",
  grace_period_mins: 15,
  ot_hourly_rate: 50,
  min_hours_for_ot: 12,
  custom_events: []
};

export function getCompanyHolidayRules(): CompanyHolidayRules {
  if (typeof window === "undefined") return DEFAULT_HOLIDAY_RULES;
  try {
    const saved = localStorage.getItem("texaflow_company_holiday_rules");
    if (saved) {
      const parsed = JSON.parse(saved);
      const kPol: SundayPolicy = parsed.karigar_sunday_policy || (parsed.karigar_sunday_off === false ? "working" : "off");
      const sPol: SundayPolicy = parsed.staff_sunday_policy || (parsed.staff_sunday_off === false ? "working" : "off");
      return {
        karigar_sunday_policy: kPol,
        staff_sunday_policy: sPol,
        karigar_sunday_off: kPol === "off",
        staff_sunday_off: sPol === "off",
        day_shift_start: parsed.day_shift_start || "08:00",
        day_shift_end: parsed.day_shift_end || "20:00",
        night_shift_start: parsed.night_shift_start || "20:00",
        night_shift_end: parsed.night_shift_end || "08:00",
        grace_period_mins: parsed.grace_period_mins !== undefined ? Number(parsed.grace_period_mins) : 15,
        ot_hourly_rate: parsed.ot_hourly_rate !== undefined && parsed.ot_hourly_rate !== null && !isNaN(Number(parsed.ot_hourly_rate)) ? Number(parsed.ot_hourly_rate) : 50,
        min_hours_for_ot: parsed.min_hours_for_ot !== undefined && parsed.min_hours_for_ot !== null && !isNaN(Number(parsed.min_hours_for_ot)) ? Number(parsed.min_hours_for_ot) : 12,
        custom_events: Array.isArray(parsed.custom_events) 
          ? parsed.custom_events.filter((e: any) => !e.id?.startsWith("evt-init-"))
          : []
      };
    }
  } catch {}
  return DEFAULT_HOLIDAY_RULES;
}

export function saveCompanyHolidayRules(rules: CompanyHolidayRules): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("texaflow_company_holiday_rules", JSON.stringify(rules));
    window.dispatchEvent(new CustomEvent("company_holiday_rules_updated", { detail: rules }));
  } catch (err) {
    console.error("Failed to save holiday rules:", err);
  }
}


