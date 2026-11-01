"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { 
  Wallet, 
  Calendar, 
  Users, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Plus, 
  Trash2, 
  Printer, 
  Download, 
  Share2, 
  X, 
  ChevronRight, 
  ChevronDown, 
  CreditCard, 
  Home, 
  Zap, 
  Coffee, 
  FileText,
  Clock,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fetchApi } from "@/lib/api";
import { getStoredCompanyId, getStoredFirmName, getTenantItem } from "@/lib/tenantStorage";
import { 
  SalaryPayoutRecord, 
  SalaryDeductionItem, 
  AttendancePunch 
} from "@/types/hrms";
import { 
  getStoredPayouts, 
  saveSalaryPayout, 
  getStoredAttendance, 
  getWorkerMonthlyUpad,
  getStoredWorkers,
  refreshWorkersFromApi,
  WorkerItem
} from "@/lib/hrmsStorage";

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function WorkerPayoutPage() {
  const { t } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [firmName, setFirmName] = useState("Om Sai Enterprise");

  // Selected Month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => getTodayStr().slice(0, 7));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Pending">("All");

  // Instant 0ms synchronous initialization
  const [workers, setWorkers] = useState<WorkerItem[]>(getStoredWorkers);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendancePunch[]>(getStoredAttendance);
  const [payoutRecords, setPayoutRecords] = useState<SalaryPayoutRecord[]>(getStoredPayouts);

  // Settlement & Payout Modal State
  const [activeWorkerForPayout, setActiveWorkerForPayout] = useState<WorkerItem | null>(null);
  const [activeExistingPayout, setActiveExistingPayout] = useState<SalaryPayoutRecord | null>(null);

  // Form State in Payout Modal
  const [manualOvertime, setManualOvertime] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<SalaryDeductionItem[]>([
    { id: "ded-rent", type: "room_rent", label: "Room Rent (રૂમનું ભાડું)", amount: 0 },
    { id: "ded-light", type: "electricity", label: "Light / Electricity Bill (લાઇટ બિલ)", amount: 0 },
  ]);
  const [newDeductionLabel, setNewDeductionLabel] = useState("");
  const [newDeductionAmount, setNewDeductionAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(getTodayStr());
  const [amountPaying, setAmountPaying] = useState<number>(0);
  const [payoutNotes, setPayoutNotes] = useState("");

  // Printable Slip Preview Modal
  const [viewingSlipRecord, setViewingSlipRecord] = useState<SalaryPayoutRecord | null>(null);

  useEffect(() => {
    setHasMounted(true);
    setFirmName(getStoredFirmName() || "Om Sai Enterprise");

    // 1. Immediately reload latest workers from local cache
    setWorkers(getStoredWorkers());

    // 2. Non-blocking background API refresh (using correct /employees endpoint)
    refreshWorkersFromApi((live) => {
      if (live.length > 0) {
        setWorkers(live);
      }
    });

    // 3. Sync attendance logs and payout records
    const refreshData = () => {
      setAttendanceLogs(getStoredAttendance());
      setPayoutRecords(getStoredPayouts());
    };
    refreshData();

    const handleWorkerUpdate = () => {
      setWorkers(getStoredWorkers());
    };

    window.addEventListener("hrms_attendance_updated", refreshData);
    window.addEventListener("hrms_payout_updated", refreshData);
    window.addEventListener("app_employees_updated", handleWorkerUpdate);
    window.addEventListener("app_data_update", refreshData);
    window.addEventListener("app_data_update", handleWorkerUpdate);
    return () => {
      window.removeEventListener("hrms_attendance_updated", refreshData);
      window.removeEventListener("hrms_payout_updated", refreshData);
      window.removeEventListener("app_employees_updated", handleWorkerUpdate);
      window.removeEventListener("app_data_update", refreshData);
      window.removeEventListener("app_data_update", handleWorkerUpdate);
    };
  }, []);

  const monthLabel = useMemo(() => {
    const [year, monthNum] = selectedMonth.split("-").map(Number);
    const monthName = MONTH_NAMES[(monthNum || 1) - 1] || "Current Month";
    return `${monthName} ${year}`;
  }, [selectedMonth]);

  // Map of existing payouts for selectedMonth: worker_id -> SalaryPayoutRecord
  const monthPayoutsMap = useMemo(() => {
    const map = new Map<string, SalaryPayoutRecord>();
    payoutRecords
      .filter((p) => p.month === selectedMonth)
      .forEach((p) => map.set(p.worker_id, p));
    return map;
  }, [payoutRecords, selectedMonth]);

  // Aggregate attendance for each worker in selectedMonth
  const workerAttendanceSummary = useMemo(() => {
    const summaryMap = new Map<string, { fullDays: number; halfDays: number; absentDays: number; totalHours: number }>();
    
    workers.forEach((w) => {
      summaryMap.set(w.id, { fullDays: 0, halfDays: 0, absentDays: 0, totalHours: 0 });
    });

    attendanceLogs
      .filter((log) => log.date.startsWith(selectedMonth))
      .forEach((log) => {
        const current = summaryMap.get(log.worker_id) || { fullDays: 0, halfDays: 0, absentDays: 0, totalHours: 0 };
        if (log.status === "Full Day" || log.status === "Overtime" || log.status === "Present") {
          current.fullDays += 1;
        } else if (log.status === "Half Day") {
          current.halfDays += 1;
        } else if (log.status === "Absent") {
          current.absentDays += 1;
        }
        current.totalHours += log.total_hours || 0;
        summaryMap.set(log.worker_id, current);
      });

    return summaryMap;
  }, [workers, attendanceLogs, selectedMonth]);

  // Filtered workers list
  const displayWorkers = useMemo(() => {
    return workers.filter((w) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || (w.name && w.name.toLowerCase().includes(q)) || (w.code && w.code.toLowerCase().includes(q));
      const payout = monthPayoutsMap.get(w.id);
      const isPaid = payout?.payment_status === "Paid";
      const matchesStatus = statusFilter === "All" || (statusFilter === "Paid" ? isPaid : !isPaid);
      return matchesSearch && matchesStatus;
    });
  }, [workers, search, statusFilter, monthPayoutsMap]);

  // High-level KPI Stats for the selected Month
  const monthStats = useMemo(() => {
    let totalGross = 0;
    let totalUpad = 0;
    let totalOtherDed = 0;
    let totalPaid = 0;
    let totalDue = 0;

    workers.forEach((w) => {
      const payout = monthPayoutsMap.get(w.id);
      if (payout) {
        totalGross += payout.total_earnings;
        totalUpad += payout.total_upad_deduction;
        totalOtherDed += payout.total_other_deductions;
        totalPaid += payout.paid_amount;
        totalDue += payout.balance_due;
      } else {
        // Estimated unfinalized
        const base = Number(w.monthly_salary) || 0;
        const att = workerAttendanceSummary.get(w.id) || { fullDays: 24, halfDays: 4, absentDays: 2, totalHours: 0 };
        const paidDays = att.fullDays + (att.halfDays * 0.5) || 26;
        const earned = Math.round((base / 30) * paidDays);
        const upad = getWorkerMonthlyUpad(w.name, selectedMonth).total;
        totalGross += earned;
        totalUpad += upad;
        totalDue += Math.max(0, earned - upad);
      }
    });

    return { totalGross, totalUpad, totalOtherDed, totalPaid, totalDue };
  }, [workers, monthPayoutsMap, workerAttendanceSummary, selectedMonth]);

  // Open Modal to Calculate & Settle Payout
  const handleOpenPayoutModal = (worker: WorkerItem) => {
    setActiveWorkerForPayout(worker);
    const existing = monthPayoutsMap.get(worker.id);
    setActiveExistingPayout(existing || null);

    if (existing) {
      setManualOvertime(existing.overtime_amount || 0);
      setOtherDeductions(existing.deductions.filter((d) => d.type !== "upad"));
      setPaymentMode(existing.payment_mode || "Cash");
      setPaymentDate(existing.payment_date || getTodayStr());
      setAmountPaying(existing.paid_amount || existing.net_payable);
      setPayoutNotes(existing.remarks || "");
    } else {
      setManualOvertime(0);
      setOtherDeductions([
        { id: `ded-${Date.now()}-rent`, type: "room_rent", label: "Room Rent (રૂમનું ભાડું)", amount: 0 },
        { id: `ded-${Date.now()}-light`, type: "electricity", label: "Light / Electricity Bill (લાઇટ બિલ)", amount: 0 }
      ]);
      setPaymentMode("Cash");
      setPaymentDate(getTodayStr());
      setPayoutNotes("");
    }
  };

  // Calculations inside modal
  const modalCalculations = useMemo(() => {
    if (!activeWorkerForPayout) {
      return { baseSalary: 0, fullDays: 0, halfDays: 0, absentDays: 0, paidDays: 0, grossEarned: 0, totalUpad: 0, upadItems: [], otherDedTotal: 0, totalDed: 0, netPayable: 0 };
    }

    const baseSalary = Number(activeWorkerForPayout.monthly_salary) || 0;
    const att = workerAttendanceSummary.get(activeWorkerForPayout.id) || { fullDays: 0, halfDays: 0, absentDays: 0, totalHours: 0 };
    
    // If attendance logs exist, use them; if not yet recorded, default to 30 days calculation
    const hasLogs = (att.fullDays + att.halfDays + att.absentDays) > 0;
    const fullDays = hasLogs ? att.fullDays : 26;
    const halfDays = hasLogs ? att.halfDays : 2;
    const absentDays = hasLogs ? att.absentDays : 2;
    const paidDays = fullDays + (halfDays * 0.5);

    const grossEarned = Math.round((baseSalary / 30) * paidDays) + (Number(manualOvertime) || 0);

    // Auto pull Upads
    const upadData = getWorkerMonthlyUpad(activeWorkerForPayout.name, selectedMonth);
    const totalUpad = upadData.total;

    const otherDedTotal = otherDeductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const totalDed = totalUpad + otherDedTotal;
    const netPayable = Math.max(0, grossEarned - totalDed);

    return {
      baseSalary,
      fullDays,
      halfDays,
      absentDays,
      paidDays,
      grossEarned,
      totalUpad,
      upadItems: upadData.items,
      otherDedTotal,
      totalDed,
      netPayable
    };
  }, [activeWorkerForPayout, workerAttendanceSummary, manualOvertime, otherDeductions, selectedMonth]);

  // Set default amount paying when modal open or net changes
  useEffect(() => {
    if (activeWorkerForPayout && !activeExistingPayout) {
      setAmountPaying(modalCalculations.netPayable);
    }
  }, [activeWorkerForPayout, activeExistingPayout, modalCalculations.netPayable]);

  // Add custom deduction row
  const handleAddDeductionRow = () => {
    if (!newDeductionLabel.trim() || !newDeductionAmount) return;
    const amt = Number(newDeductionAmount) || 0;
    if (amt <= 0) return;

    setOtherDeductions([
      ...otherDeductions,
      {
        id: `ded-${Date.now()}`,
        type: "other",
        label: newDeductionLabel.trim(),
        amount: amt
      }
    ]);
    setNewDeductionLabel("");
    setNewDeductionAmount("");
  };

  const handleRemoveDeduction = (id: string) => {
    setOtherDeductions(otherDeductions.filter((d) => d.id !== id));
  };

  // Confirm and Save Payout Record
  const handleSavePayout = () => {
    if (!activeWorkerForPayout) return;
    const calc = modalCalculations;
    const paidAmt = Number(amountPaying) || 0;
    const balanceDue = Math.max(0, calc.netPayable - paidAmt);
    const status: SalaryPayoutRecord["payment_status"] = balanceDue === 0 ? "Paid" : (paidAmt > 0 ? "Partially Paid" : "Pending");

    // Build deductions list
    const allDeductions: SalaryDeductionItem[] = [
      ...calc.upadItems.map((item) => ({
        id: `upad-${item.id || item.expense_no}`,
        type: "upad" as const,
        label: `Cash Upad (${item.expense_no || "Advance"}) - ${item.date || ""}`,
        amount: Number(item.amount) || 0,
        ref_id: item.id
      })),
      ...otherDeductions.filter((d) => d.amount > 0)
    ];

    const payoutNo = activeExistingPayout?.payout_no || `SAL-${selectedMonth}-${String(Math.floor(Math.random() * 900) + 100)}`;

    const newRecord: SalaryPayoutRecord = {
      id: activeExistingPayout?.id || `payout-${selectedMonth}-${activeWorkerForPayout.id}`,
      payout_no: payoutNo,
      company_id: getStoredCompanyId() || "comp-001",
      worker_id: activeWorkerForPayout.id,
      worker_name: activeWorkerForPayout.name,
      worker_code: activeWorkerForPayout.code,
      month: selectedMonth,
      month_label: monthLabel,
      monthly_base_salary: calc.baseSalary,
      total_days_in_month: 30,
      full_days: calc.fullDays,
      half_days: calc.halfDays,
      absent_days: calc.absentDays,
      paid_days: calc.paidDays,
      earned_gross_salary: calc.grossEarned - (Number(manualOvertime) || 0),
      overtime_amount: Number(manualOvertime) || 0,
      total_earnings: calc.grossEarned,
      deductions: allDeductions,
      total_upad_deduction: calc.totalUpad,
      total_other_deductions: calc.otherDedTotal,
      total_deductions: calc.totalDed,
      net_payable: calc.netPayable,
      paid_amount: paidAmt,
      balance_due: balanceDue,
      payment_status: status,
      payment_date: paymentDate,
      payment_mode: paymentMode,
      remarks: payoutNotes.trim(),
      created_at: activeExistingPayout?.created_at || new Date().toISOString()
    };

    saveSalaryPayout(newRecord);
    setPayoutRecords(getStoredPayouts());
    setActiveWorkerForPayout(null);
    setViewingSlipRecord(newRecord);
  };

  if (!hasMounted) return null;

  return (
    <div className="space-y-4 font-sans text-xs pb-16">
      {/* 1. TOP STATS OVERVIEW CARDS (MATCHING EXPENSES / WORKER STYLE) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* GROSS WAGES */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">GROSS WAGES</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">₹{monthStats.totalGross.toLocaleString("en-IN")}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        {/* CASH UPAD DEDUCTION */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider truncate">ADVANCE DEDUCTED</p>
            <p className="text-xl font-black text-amber-700 mt-0.5">-₹{monthStats.totalUpad.toLocaleString("en-IN")}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
        </div>

        {/* REMAINING DUE */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider truncate">PENDING / DUE</p>
            <p className="text-xl font-black text-rose-700 mt-0.5">₹{monthStats.totalDue.toLocaleString("en-IN")}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        {/* NET SALARY PAID */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider truncate">NET PAID</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">₹{monthStats.totalPaid.toLocaleString("en-IN")}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. COMPACT CONTROLS TOOLBAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3 font-sans">
        {/* Search */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search worker by name, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 h-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        {/* Controls: Month Selector, Status Pill, Attendance Link */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start sm:justify-end text-xs">
          {/* Status Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/90 text-xs shrink-0 w-full sm:w-auto justify-center">
            {(["All", "Paid", "Pending"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex-1 sm:flex-none text-center ${
                  statusFilter === st ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Month Picker */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 h-9 shadow-2xs cursor-pointer">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          <Link
            href="/hrms/attendance"
            className="h-9 px-3.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer flex-1 sm:flex-none"
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Attendance</span>
          </Link>
        </div>
      </div>

      {/* 3. WORKER PAYROLL REGISTER TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[950px]">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2.5 px-4 border-r border-slate-200/80">WORKER NAME</th>
                <th className="py-2.5 px-4 border-r border-slate-200/80">FIXED SALARY</th>
                <th className="py-2.5 px-4 border-r border-slate-200/80">DAYS WORKED</th>
                <th className="py-2.5 px-4 text-right border-r border-slate-200/80">GROSS EARNED</th>
                <th className="py-2.5 px-4 text-right border-r border-slate-200/80">ADVANCE DEDUCTED</th>
                <th className="py-2.5 px-4 text-right border-r border-slate-200/80">OTHER DED.</th>
                <th className="py-2.5 px-4 text-right border-r border-slate-200/80">NET PAYABLE</th>
                <th className="py-2.5 px-4 text-center border-r border-slate-200/80">STATUS</th>
                <th className="py-2.5 px-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
              {displayWorkers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    No workers found for this month.
                  </td>
                </tr>
              ) : (
                displayWorkers.map((worker) => {
                  const payout = monthPayoutsMap.get(worker.id);
                  const isPaid = payout?.payment_status === "Paid";
                  const isPartial = payout?.payment_status === "Partially Paid";

                  // Attendance info
                  const att = workerAttendanceSummary.get(worker.id) || { fullDays: 24, halfDays: 4, absentDays: 2, totalHours: 0 };
                  const hasLogs = (att.fullDays + att.halfDays + att.absentDays) > 0;
                  const fDays = hasLogs ? att.fullDays : 26;
                  const hDays = hasLogs ? att.halfDays : 2;
                  const paidDays = fDays + (hDays * 0.5);

                  const baseSalary = Number(worker.monthly_salary) || 0;
                  const grossEarned = payout ? payout.total_earnings : Math.round((baseSalary / 30) * paidDays);
                  const upadAmt = payout ? payout.total_upad_deduction : getWorkerMonthlyUpad(worker.name, selectedMonth).total;
                  const otherAmt = payout ? payout.total_other_deductions : 0;
                  const netPay = payout ? payout.net_payable : Math.max(0, grossEarned - upadAmt - otherAmt);

                  return (
                    <tr key={worker.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* 1. Worker Name Only */}
                      <td className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 block text-xs">{worker.name}</span>
                      </td>

                      {/* 2. Fixed Salary */}
                      <td className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap font-mono font-bold text-slate-700">
                        ₹{baseSalary.toLocaleString("en-IN")}
                      </td>

                      {/* 3. Days Worked (Clean Total Number Only, No 'Days' suffix) */}
                      <td className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap">
                        <span className="font-mono font-black text-sm text-slate-900">
                          {paidDays}
                        </span>
                      </td>

                      {/* 4. Gross Earned */}
                      <td className="py-3 px-4 text-right border-r border-slate-200/70 whitespace-nowrap font-mono font-bold text-slate-900">
                        ₹{grossEarned.toLocaleString("en-IN")}
                      </td>

                      {/* 5. Upad Deducted */}
                      <td className="py-3 px-4 text-right border-r border-slate-200/70 whitespace-nowrap font-mono font-bold text-amber-700">
                        {upadAmt > 0 ? `-₹${upadAmt.toLocaleString("en-IN")}` : "₹0"}
                      </td>

                      {/* 6. Other Deductions */}
                      <td className="py-3 px-4 text-right border-r border-slate-200/70 whitespace-nowrap font-mono font-bold text-purple-700">
                        {otherAmt > 0 ? `-₹${otherAmt.toLocaleString("en-IN")}` : "₹0"}
                      </td>

                      {/* 7. Net Payable */}
                      <td className="py-3 px-4 text-right border-r border-slate-200/70 whitespace-nowrap font-mono font-black text-sm text-slate-900">
                        ₹{netPay.toLocaleString("en-IN")}
                      </td>

                      {/* 8. Status */}
                      <td className="py-3 px-4 text-center border-r border-slate-200/70 whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            PAID / DONE
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                            PARTIAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* 9. Action */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isPaid ? (
                            <button
                              type="button"
                              onClick={() => handleOpenPayoutModal(worker)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-98 cursor-pointer flex items-center gap-1"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              <span>Settle & Pay</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setViewingSlipRecord(payout)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>View Slip</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. INTERACTIVE PAYOUT & DEDUCTIONS SETTLEMENT MODAL */}
      {activeWorkerForPayout && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 animate-in zoom-in-95 duration-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">MONTHLY SALARY DISBURSEMENT</span>
                <h3 className="font-black text-slate-900 text-base">
                  {activeWorkerForPayout.name} ({activeWorkerForPayout.code || "KAR"})
                </h3>
                <p className="text-xs text-slate-500 font-medium">Payroll Period: {monthLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveWorkerForPayout(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Gross Salary & Attendance Tally */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-800 uppercase">1. Gross Earnings (કમાણી)</span>
                <span className="font-mono font-black text-slate-900 text-sm">₹{modalCalculations.grossEarned.toLocaleString("en-IN")}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">MONTHLY RATE</span>
                  <span className="font-mono font-bold text-slate-800">₹{modalCalculations.baseSalary.toLocaleString("en-IN")}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">DAYS WORKED</span>
                  <span className="font-mono font-bold text-emerald-700">{modalCalculations.paidDays}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">PER DAY (30 D)</span>
                  <span className="font-mono font-bold text-slate-800">₹{Math.round(modalCalculations.baseSalary / 30)}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">OVERTIME (OT ₹)</span>
                  <input
                    type="number"
                    value={manualOvertime || ""}
                    placeholder="₹0"
                    onChange={(e) => setManualOvertime(Number(e.target.value) || 0)}
                    className="w-full text-center font-mono font-bold text-xs text-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Cash Advance Auto-Deductions */}
            <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-amber-900 uppercase">2. Cash Advance Deduction</span>
                <span className="font-mono font-black text-amber-800 text-sm">-₹{modalCalculations.totalUpad.toLocaleString("en-IN")}</span>
              </div>

              {modalCalculations.upadItems.length === 0 ? (
                <p className="text-[11px] text-amber-800 font-medium">✓ No cash advances recorded in Expenses for this worker in {monthLabel}.</p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {modalCalculations.upadItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-amber-200 text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-800">{item.expense_no}</span>
                        <span className="text-slate-500 font-medium ml-2">({item.date}) {item.notes || "Worker Advance"}</span>
                      </div>
                      <span className="font-mono font-black text-amber-700">₹{item.amount.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Other Custom Deductions (Room Rent, Light Bill, Canteen, etc.) */}
            <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-purple-900 uppercase">3. Other Deductions (રૂમ ભાડું, લાઇટ બિલ, અન્ય કપાત)</span>
                <span className="font-mono font-black text-purple-800 text-sm">-₹{modalCalculations.otherDedTotal.toLocaleString("en-IN")}</span>
              </div>

              {/* Existing rows */}
              <div className="space-y-2">
                {otherDeductions.map((ded) => (
                  <div key={ded.id} className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-purple-200 text-xs">
                    <span className="font-bold text-slate-800 flex-1 truncate">{ded.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-500">₹</span>
                      <input
                        type="number"
                        value={ded.amount || ""}
                        placeholder="0"
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setOtherDeductions(otherDeductions.map((d) => (d.id === ded.id ? { ...d, amount: val } : d)));
                        }}
                        className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-xs text-right focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveDeduction(ded.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Remove deduction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Custom Deduction Line */}
              <div className="flex items-center gap-2 pt-1 border-t border-purple-200/60">
                <input
                  type="text"
                  placeholder="New reason (e.g. Mess Food, Mobile Recharge, Damage)..."
                  value={newDeductionLabel}
                  onChange={(e) => setNewDeductionLabel(e.target.value)}
                  className="flex-1 bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none font-medium"
                />
                <input
                  type="number"
                  placeholder="Amount ₹"
                  value={newDeductionAmount}
                  onChange={(e) => setNewDeductionAmount(e.target.value)}
                  className="w-24 bg-white border border-purple-200 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-right focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddDeductionRow}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Step 4: Net Calculation & Payment Details */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">NET PAYABLE (ચૂકવવાપાત્ર ચોખ્ખી રકમ)</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    ₹{modalCalculations.netPayable.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <span>Gross: ₹{modalCalculations.grossEarned}</span>
                  <span className="block text-rose-400">Total Ded: -₹{modalCalculations.totalDed}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="Cash">Cash (રોકડ)</option>
                    <option value="UPI (GPay / PhonePe / Paytm)">UPI (GPay / PhonePe)</option>
                    <option value="BANK TRANSFER (NEFT/RTGS/IMPS)">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Amount Paying Now (₹)</label>
                  <input
                    type="number"
                    value={amountPaying}
                    onChange={(e) => setAmountPaying(Number(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-black text-emerald-400 text-right focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveWorkerForPayout(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePayout}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Payment & Generate Slip (ચૂકવો)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. PRINTABLE / SHAREABLE SALARY SLIP MODAL */}
      {viewingSlipRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-100">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">OFFICIAL SALARY VOUCHER SLIP</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingSlipRecord(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Slip Paper */}
            <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/40">
              {/* Slip Header */}
              <div className="text-center border-b border-slate-200 pb-3">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">{firmName}</h2>
                <p className="text-[11px] text-slate-500 font-medium">Textile & Embroidery Jobwork Unit • Surat, Gujarat</p>
                <div className="mt-1 inline-block bg-blue-50 text-blue-800 border border-blue-200 font-extrabold text-[11px] px-3 py-0.5 rounded-full">
                  PAYROLL SLIP - {viewingSlipRecord.month_label}
                </div>
              </div>

              {/* Worker & Voucher Info */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">WORKER NAME:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{viewingSlipRecord.worker_name}</span>
                  <span className="text-[11px] text-slate-500 block">ID: {viewingSlipRecord.worker_code || "KAR"}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">SLIP NO:</span>
                  <span className="font-mono font-bold text-slate-900">{viewingSlipRecord.payout_no}</span>
                  <span className="text-[11px] text-slate-500 block">Date: {viewingSlipRecord.payment_date}</span>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Earnings Column */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-extrabold text-[11px] text-emerald-800 uppercase border-b border-slate-100 pb-1">
                    EARNINGS
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Base Salary (Rate):</span>
                    <span className="font-mono font-bold text-slate-800">₹{viewingSlipRecord.monthly_base_salary.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Paid Days:</span>
                    <span className="font-mono font-bold text-slate-800">{viewingSlipRecord.paid_days} Days</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Earned Wages:</span>
                    <span className="font-mono font-bold text-slate-800">₹{viewingSlipRecord.earned_gross_salary.toLocaleString("en-IN")}</span>
                  </div>
                  {viewingSlipRecord.overtime_amount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Overtime (OT):</span>
                      <span className="font-mono font-bold text-blue-600">+₹{viewingSlipRecord.overtime_amount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-slate-900 border-t border-slate-100 pt-1">
                    <span>Total Earnings:</span>
                    <span className="font-mono text-emerald-700">₹{viewingSlipRecord.total_earnings.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Deductions Column */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-extrabold text-[11px] text-rose-800 uppercase border-b border-slate-100 pb-1">
                    DEDUCTIONS
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cash Advance:</span>
                    <span className="font-mono font-bold text-amber-700">-₹{viewingSlipRecord.total_upad_deduction.toLocaleString("en-IN")}</span>
                  </div>
                  {viewingSlipRecord.deductions.filter((d) => d.type !== "upad").map((ded, i) => (
                    <div key={i} className="flex justify-between text-slate-600">
                      <span className="truncate pr-1">{ded.label}:</span>
                      <span className="font-mono font-bold text-purple-700">-₹{ded.amount.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-black text-slate-900 border-t border-slate-100 pt-1">
                    <span>Total Deductions:</span>
                    <span className="font-mono text-rose-700">-₹{viewingSlipRecord.total_deductions.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Net Paid Bottom Banner */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">NET PAID DISBURSED ({viewingSlipRecord.payment_mode})</span>
                  <span className="text-xl font-black text-emerald-900 font-mono">₹{viewingSlipRecord.paid_amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    ✓ STATUS: PAID / DONE
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-6 text-center text-xs text-slate-500 font-medium">
                <div>
                  <div className="border-t border-slate-300 w-3/4 mx-auto pt-1">
                    Worker Signature (સહી/અંગૂઠો)
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-300 w-3/4 mx-auto pt-1">
                    Authorized Signatory (ઓનર સહી)
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewingSlipRecord(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
