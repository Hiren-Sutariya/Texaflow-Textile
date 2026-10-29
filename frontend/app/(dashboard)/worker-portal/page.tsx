"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Wallet, 
  Receipt, 
  Home, 
  Zap, 
  Printer, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  UserCheck,
  ChevronDown
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fetchApi } from "@/lib/api";
import { getStoredCompanyId, getStoredFirmName, getTenantItem } from "@/lib/tenantStorage";
import { 
  calculateAttendanceStatus, 
  getStoredAttendance, 
  saveAttendancePunch, 
  getStoredPayouts, 
  getWorkerMonthlyUpad 
} from "@/lib/hrmsStorage";
import { AttendancePunch, SalaryPayoutRecord, SalaryDeductionItem } from "@/types/hrms";

interface WorkerItem {
  id: string;
  name: string;
  code?: string;
  role?: string;
  shift?: "Day Shift" | "Night Shift";
  assigned_machine?: string;
  monthly_salary?: number;
}

const getTodayStr = () => new Date().toISOString().split("T")[0];

export default function WorkerPortalPage() {
  const { t } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [firmName, setFirmName] = useState("Om Sai Enterprise");

  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState("2026-10");

  const [attendanceLogs, setAttendanceLogs] = useState<AttendancePunch[]>([]);
  const [payoutRecords, setPayoutRecords] = useState<SalaryPayoutRecord[]>([]);

  // Slip modal
  const [selectedSlip, setSelectedSlip] = useState<SalaryPayoutRecord | null>(null);

  // Live clock
  useEffect(() => {
    setHasMounted(true);
    setFirmName(getStoredFirmName() || "Om Sai Enterprise");

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load workers
  useEffect(() => {
    const currentCid = getStoredCompanyId() || "comp-001";
    async function loadData() {
      try {
        const live = await fetchApi<any[]>("/workers");
        if (Array.isArray(live) && live.length > 0) {
          const scoped = live.filter((w) => (w.company_id || currentCid) === currentCid && w.status !== "Inactive");
          setWorkers(scoped);
          if (scoped[0]) setSelectedWorkerId(scoped[0].id);
          return;
        }
      } catch {}

      const localWorkers = getTenantItem<any[]>("texaflow_workers") || getTenantItem<any[]>("texaflow_employees") || [];
      if (Array.isArray(localWorkers) && localWorkers.length > 0) {
        setWorkers(localWorkers);
        if (localWorkers[0]) setSelectedWorkerId(localWorkers[0].id);
      } else {
        const defaults = [
          { id: "wrk-001", name: "Pradeep Upad", code: "KAR-001", role: "Karigar", shift: "Day Shift" as const, monthly_salary: 33000, assigned_machine: "Machine 1" },
          { id: "wrk-002", name: "Rajkumar", code: "KAR-002", role: "Karigar", shift: "Day Shift" as const, monthly_salary: 28000, assigned_machine: "Machine 2" },
          { id: "wrk-003", name: "Mama Upad", code: "KAR-003", role: "Karigar", shift: "Night Shift" as const, monthly_salary: 35000, assigned_machine: "Machine 3" },
        ];
        setWorkers(defaults);
        setSelectedWorkerId(defaults[0].id);
      }
    }

    loadData();

    const refreshData = () => {
      setAttendanceLogs(getStoredAttendance());
      setPayoutRecords(getStoredPayouts());
    };
    refreshData();

    window.addEventListener("hrms_attendance_updated", refreshData);
    window.addEventListener("hrms_payout_updated", refreshData);
    window.addEventListener("app_data_update", refreshData);
    return () => {
      window.removeEventListener("hrms_attendance_updated", refreshData);
      window.removeEventListener("hrms_payout_updated", refreshData);
      window.removeEventListener("app_data_update", refreshData);
    };
  }, []);

  const activeWorker = useMemo(() => {
    return workers.find((w) => w.id === selectedWorkerId) || workers[0];
  }, [workers, selectedWorkerId]);

  // Today's punch for this worker
  const todayPunch = useMemo(() => {
    if (!activeWorker) return null;
    const today = getTodayStr();
    return attendanceLogs.find((p) => p.worker_id === activeWorker.id && p.date === today) || null;
  }, [attendanceLogs, activeWorker]);

  const isClockedIn = Boolean(todayPunch && todayPunch.clock_in && !todayPunch.clock_out);
  const isCompletedToday = Boolean(todayPunch && todayPunch.clock_in && todayPunch.clock_out);

  // Clock In Action
  const handleClockIn = () => {
    if (!activeWorker) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

    const punch: AttendancePunch = {
      id: todayPunch?.id || `att-${Date.now()}-${activeWorker.id}`,
      company_id: getStoredCompanyId() || "comp-001",
      worker_id: activeWorker.id,
      worker_name: activeWorker.name,
      worker_code: activeWorker.code,
      date: getTodayStr(),
      clock_in: todayPunch?.clock_in || timeStr,
      clock_out: null,
      total_hours: 0,
      status: "Present",
      overtime_hours: 0,
      shift: activeWorker.shift || "Day Shift",
      created_at: new Date().toISOString()
    };

    saveAttendancePunch(punch);
    setAttendanceLogs(getStoredAttendance());
  };

  // Clock Out Action
  const handleClockOut = () => {
    if (!activeWorker || !todayPunch || !todayPunch.clock_in) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

    let hours = 0;
    try {
      const [inH, inM] = todayPunch.clock_in.split(":").map(Number);
      const [outH, outM] = timeStr.split(":").map(Number);
      let diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
      if (diffMinutes < 0) diffMinutes += 24 * 60;
      hours = Math.round((diffMinutes / 60) * 10) / 10;
    } catch {
      hours = 8;
    }

    const { status, overtime_hours } = calculateAttendanceStatus(hours);

    const punch: AttendancePunch = {
      ...todayPunch,
      clock_out: timeStr,
      total_hours: hours,
      status,
      overtime_hours,
      updated_at: new Date().toISOString()
    };

    saveAttendancePunch(punch);
    setAttendanceLogs(getStoredAttendance());
  };

  // Month Attendance Summary for active worker
  const monthAttendance = useMemo(() => {
    if (!activeWorker) return { fullDays: 0, halfDays: 0, absentDays: 0, totalHours: 0, logs: [] };
    const logs = attendanceLogs.filter((p) => p.worker_id === activeWorker.id && p.date.startsWith(selectedMonth));
    let fullDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let totalHours = 0;

    logs.forEach((l) => {
      if (l.status === "Full Day" || l.status === "Overtime" || l.status === "Present") fullDays++;
      else if (l.status === "Half Day") halfDays++;
      else if (l.status === "Absent") absentDays++;
      totalHours += l.total_hours || 0;
    });

    return { fullDays, halfDays, absentDays, totalHours, logs };
  }, [attendanceLogs, activeWorker, selectedMonth]);

  // Upad info for active worker in selectedMonth
  const upadInfo = useMemo(() => {
    if (!activeWorker) return { total: 0, items: [] };
    return getWorkerMonthlyUpad(activeWorker.name, selectedMonth);
  }, [activeWorker, selectedMonth]);

  // Payout record for active worker in selectedMonth
  const workerPayout = useMemo(() => {
    if (!activeWorker) return null;
    return payoutRecords.find((p) => p.worker_id === activeWorker.id && p.month === selectedMonth) || null;
  }, [payoutRecords, activeWorker, selectedMonth]);

  if (!hasMounted) return null;

  return (
    <div className="space-y-4 font-sans text-xs pb-16 max-w-4xl mx-auto">
      {/* 1. TOP HEADER & WORKER SELECTOR */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
            {activeWorker ? activeWorker.name.charAt(0).toUpperCase() : "W"}
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">WORKER SELF-SERVICE PORTAL</span>
            <div className="relative inline-block mt-0.5">
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="font-black text-slate-900 text-lg bg-transparent border-b-2 border-blue-500 pb-0.5 pr-6 focus:outline-none cursor-pointer"
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code || "KAR"})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {firmName} • {activeWorker?.role || "Karigar"} • Machine: {activeWorker?.assigned_machine || "Main Floor"}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-right shrink-0 shadow-sm">
          <span className="font-mono font-black text-base tracking-wider text-emerald-400 block">{currentTime}</span>
          <span className="text-[10px] text-slate-400 block font-medium">Live Digital Time</span>
        </div>
      </div>

      {/* 2. TODAY'S PUNCH INTERACTIVE CARD */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-xs text-blue-300 font-bold uppercase tracking-wider block">TODAY'S SHIFT PUNCH (આજની હાજરી)</span>
            <h2 className="text-xl font-black mt-0.5">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}</h2>
          </div>
          <div>
            {isClockedIn ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
                ACTIVE ON SHIFT
              </span>
            ) : isCompletedToday ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-400/20 text-blue-200 border border-blue-400/30">
                ✓ SHIFT COMPLETED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-300">
                NOT CLOCKED IN
              </span>
            )}
          </div>
        </div>

        {/* Big Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {!isClockedIn && !isCompletedToday ? (
            <button
              type="button"
              onClick={handleClockIn}
              className="col-span-full h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>CLOCK IN - હું કામ પર આવ્યો</span>
            </button>
          ) : isClockedIn ? (
            <button
              type="button"
              onClick={handleClockOut}
              className="col-span-full h-14 bg-rose-500 hover:bg-rose-400 text-white font-black text-base rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Clock className="w-6 h-6" />
              <span>CLOCK OUT - કામ પૂરું થયું / રજા</span>
            </button>
          ) : (
            <div className="col-span-full py-3 text-center bg-white/10 rounded-2xl font-bold text-sm text-emerald-300">
              ✓ આજની શિફ્ટ સફળતાપૂર્વક નોંધાઈ ગઈ છે! (Today's Punch Complete)
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-3 gap-2 bg-white/10 p-3 rounded-2xl text-center text-xs">
          <div>
            <span className="text-[10px] text-blue-200 block font-bold">CLOCK IN</span>
            <span className="font-mono font-black text-base mt-0.5 block">{todayPunch?.clock_in || "--:--"}</span>
          </div>
          <div className="border-x border-white/10">
            <span className="text-[10px] text-blue-200 block font-bold">CLOCK OUT</span>
            <span className="font-mono font-black text-base mt-0.5 block">{todayPunch?.clock_out || "--:--"}</span>
          </div>
          <div>
            <span className="text-[10px] text-blue-200 block font-bold">TODAY'S HOURS</span>
            <span className="font-mono font-black text-base text-emerald-400 mt-0.5 block">
              {todayPunch?.total_hours ? `${todayPunch.total_hours} hrs` : "0 hrs"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. MY MONTHLY SUMMARY CARDS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">My Monthly Summary (મારો માસિક હિસાબ)</h3>
            <p className="text-xs text-slate-500 font-medium">Attendance, Upad and Payout for October 2026</p>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-slate-800"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">MONTHLY SALARY RATE</span>
            <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
              ₹{(activeWorker?.monthly_salary || 0).toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-slate-500">₹{Math.round((activeWorker?.monthly_salary || 0) / 30)}/day</span>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 block uppercase">PAID DAYS WORKED</span>
            <span className="text-base font-black text-emerald-900 font-mono mt-0.5 block">
              {monthAttendance.fullDays + (monthAttendance.halfDays * 0.5) || 26} Days
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">
              {monthAttendance.fullDays || 24} Full | {monthAttendance.halfDays || 4} Half
            </span>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
            <span className="text-[10px] font-bold text-amber-700 block uppercase">CASH UPAD TAKEN</span>
            <span className="text-base font-black text-amber-900 font-mono mt-0.5 block">
              ₹{upadInfo.total.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-amber-700 font-medium">{upadInfo.items.length} advance vouchers</span>
          </div>

          <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200">
            <span className="text-[10px] font-bold text-blue-700 block uppercase">ESTIMATED NET SALARY</span>
            <span className="text-base font-black text-blue-900 font-mono mt-0.5 block">
              {workerPayout
                ? `₹${workerPayout.net_payable.toLocaleString("en-IN")}`
                : `₹${Math.max(0, Math.round(((activeWorker?.monthly_salary || 0) / 30) * 26) - upadInfo.total).toLocaleString("en-IN")}`}
            </span>
            <span className="text-[10px] text-blue-700 font-medium">
              {workerPayout?.payment_status === "Paid" ? "✓ Paid / Done" : "Pending Disbursal"}
            </span>
          </div>
        </div>

        {/* Upad Breakdown Date-wise (Zero dispute guarantee) */}
        {upadInfo.items.length > 0 && (
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <span className="font-extrabold text-xs text-slate-800 block">Upad Vouchers Taken (તમે લીધેલો ઉપાડ):</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {upadInfo.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-mono font-bold text-slate-800">{item.expense_no}</span>
                    <span className="text-slate-500 font-medium ml-2">({item.date})</span>
                  </div>
                  <span className="font-mono font-black text-amber-700">₹{item.amount.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Salary Slip Action if Payout Exists */}
        {workerPayout && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black text-emerald-800 block">
                ✓ SALARY SLIP AVAILABLE FOR {workerPayout.month_label}
              </span>
              <p className="text-xs text-emerald-700 font-medium mt-0.5">
                Paid Amount: ₹{workerPayout.paid_amount.toLocaleString("en-IN")} via {workerPayout.payment_mode}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSlip(workerPayout)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>View Salary Slip</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. SALARY SLIP MODAL */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-xs text-slate-500 uppercase">OFFICIAL SALARY SLIP</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSlip(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
              <div className="text-center border-b border-slate-200 pb-2">
                <h2 className="text-base font-black text-slate-900 uppercase">{firmName}</h2>
                <p className="text-[10px] text-slate-500">PAYROLL SLIP - {selectedSlip.month_label}</p>
              </div>

              <div className="flex justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">WORKER</span>
                  <span className="font-bold text-slate-900">{selectedSlip.worker_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">SLIP NO</span>
                  <span className="font-mono font-bold text-slate-900">{selectedSlip.payout_no}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Earned Gross Salary:</span>
                  <span className="font-mono font-bold text-slate-900">₹{selectedSlip.total_earnings.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Cash Upad Deducted:</span>
                  <span className="font-mono font-bold">-₹{selectedSlip.total_upad_deduction.toLocaleString("en-IN")}</span>
                </div>
                {selectedSlip.deductions.filter((d: SalaryDeductionItem) => d.type !== "upad").map((ded: SalaryDeductionItem, i: number) => (
                  <div key={i} className="flex justify-between text-purple-700">
                    <span>{ded.label}:</span>
                    <span className="font-mono font-bold">-₹{ded.amount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="flex justify-between font-black text-sm text-emerald-900 border-t border-slate-100 pt-1.5">
                  <span>NET PAID:</span>
                  <span className="font-mono">₹{selectedSlip.paid_amount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSlip(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
