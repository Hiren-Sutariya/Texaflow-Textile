"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Wallet, 
  Receipt, 
  Printer, 
  FileText, 
  AlertCircle,
  User,
  ExternalLink
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fetchApi } from "@/lib/api";
import { getStoredCompanyId, getStoredFirmName, getTenantItem } from "@/lib/tenantStorage";
import { 
  getStoredAttendance, 
  saveAttendancePunch, 
  getStoredPayouts, 
  getWorkerMonthlyUpad,
  getStoredWorkers,
  refreshWorkersFromApi,
  WorkerItem
} from "@/lib/hrmsStorage";
import { AttendancePunch, SalaryPayoutRecord, SalaryDeductionItem } from "@/types/hrms";

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function WorkerPortalPage() {
  const { t } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());
  const [firmName, setFirmName] = useState("Om Sai Enterprise");

  // Instant 0ms synchronous initialization
  const [workers, setWorkers] = useState<WorkerItem[]>(getStoredWorkers);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(() => {
    const list = getStoredWorkers();
    return list[0]?.id || "";
  });
  const [selectedMonth, setSelectedMonth] = useState(() => getTodayStr().slice(0, 7));

  const [attendanceLogs, setAttendanceLogs] = useState<AttendancePunch[]>(getStoredAttendance);
  const [payoutRecords, setPayoutRecords] = useState<SalaryPayoutRecord[]>(getStoredPayouts);

  // Slip modal
  const [selectedSlip, setSelectedSlip] = useState<SalaryPayoutRecord | null>(null);

  // Live clock & live ticker
  useEffect(() => {
    setHasMounted(true);
    setFirmName(getStoredFirmName() || "Om Sai Enterprise");

    const updateTime = () => {
      const now = new Date();
      setNowTick(now.getTime());
      setCurrentTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync workers & data with instant cache and background API refresh
  useEffect(() => {
    // 1. Immediately reload latest workers
    const latest = getStoredWorkers();
    setWorkers(latest);
    if (!selectedWorkerId && latest[0]) {
      setSelectedWorkerId(latest[0].id);
    }

    // 2. Non-blocking background API refresh
    refreshWorkersFromApi((live) => {
      if (live.length > 0) {
        setWorkers(live);
        if (!selectedWorkerId && live[0]) {
          setSelectedWorkerId(live[0].id);
        }
      }
    });

    const refreshData = () => {
      setAttendanceLogs(getStoredAttendance());
      setPayoutRecords(getStoredPayouts());
    };
    refreshData();

    const handleWorkerUpdate = () => {
      const refreshed = getStoredWorkers();
      setWorkers(refreshed);
      if (!selectedWorkerId && refreshed[0]) {
        setSelectedWorkerId(refreshed[0].id);
      }
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

  const activeWorker = useMemo(() => {
    return workers.find((w) => w.id === selectedWorkerId) || workers[0] || null;
  }, [workers, selectedWorkerId]);

  const todayStr = getTodayStr();
  const todayPunch = useMemo(() => {
    if (!activeWorker) return null;
    return attendanceLogs.find((p) => p.worker_id === activeWorker.id && p.date === todayStr) || null;
  }, [attendanceLogs, activeWorker, todayStr]);

  const isAbsentToday = Boolean(todayPunch && todayPunch.status === "Absent");
  const isClockedIn = Boolean(todayPunch && !isAbsentToday && todayPunch.clock_in && !todayPunch.clock_out);
  const isCompletedToday = Boolean(todayPunch && !isAbsentToday && todayPunch.clock_in && todayPunch.clock_out);

  const liveElapsedStr = useMemo(() => {
    if (!isClockedIn || !todayPunch) return "0 hrs";
    let startMs = nowTick;
    if (todayPunch.created_at) {
      const p = new Date(todayPunch.created_at).getTime();
      if (!isNaN(p)) startMs = p;
    } else if (todayPunch.clock_in) {
      const parts = todayPunch.clock_in.split(":").map(Number);
      const d = new Date();
      d.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
      startMs = d.getTime();
    }
    const diffSec = Math.max(0, Math.floor((nowTick - startMs) / 1000));
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }, [isClockedIn, todayPunch, nowTick]);

  // Clock In Action
  const handleClockIn = () => {
    if (!activeWorker) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const existing = todayPunch;

    const punch: AttendancePunch = {
      id: existing?.id || `att-${Date.now()}-${activeWorker.id}`,
      company_id: getStoredCompanyId() || "comp-001",
      worker_id: activeWorker.id,
      worker_name: activeWorker.name,
      worker_code: activeWorker.code,
      date: todayStr,
      shift: activeWorker.shift || "Day Shift",
      clock_in: timeStr,
      clock_out: null,
      total_hours: 0,
      overtime_hours: 0,
      status: "Present",
      notes: "Punched via Worker Portal",
      created_at: now.toISOString()
    };

    saveAttendancePunch(punch);
    setAttendanceLogs(getStoredAttendance());
  };

  // Clock Out Action
  const handleClockOut = () => {
    if (!activeWorker || !todayPunch || !todayPunch.clock_in) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

    let startMs = now.getTime();
    if (todayPunch.created_at) {
      const p = new Date(todayPunch.created_at).getTime();
      if (!isNaN(p)) startMs = p;
    } else {
      const parts = todayPunch.clock_in.split(":").map(Number);
      const d = new Date();
      d.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
      startMs = d.getTime();
    }
    const diffSeconds = Math.max(0, Math.floor((now.getTime() - startMs) / 1000));
    let hours = Math.round((diffSeconds / 3600) * 100) / 100;

    const isFullDay = hours >= 7;
    const isHalfDay = hours >= 3.5 && hours < 7;
    const status = isFullDay ? "Full Day" : isHalfDay ? "Half Day" : hours > 0.05 ? "Half Day" : "Present";

    const punch: AttendancePunch = {
      ...todayPunch,
      clock_out: timeStr,
      total_hours: hours,
      status: status as any,
      notes: "Clocked out via Worker Portal",
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

  // Net payable calculation
  const calculatedDays = monthAttendance.fullDays + (monthAttendance.halfDays * 0.5) || 26;
  const estimatedGross = Math.round(((activeWorker?.monthly_salary || 0) / 30) * calculatedDays);
  const estimatedNet = Math.max(0, estimatedGross - upadInfo.total);

  if (!hasMounted) return null;

  return (
    <div className="space-y-4 font-sans text-xs pb-16">
      {/* 1. TOP 4 STATS OVERVIEW CARDS (MATCHING EXPENSES / WORKER STYLE) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Monthly Base Salary */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">BASE SALARY</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">₹{(activeWorker?.monthly_salary || 0).toLocaleString("en-IN")}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        {/* Paid Days */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider truncate">DAYS WORKED</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">
              {monthAttendance.fullDays + (monthAttendance.halfDays * 0.5) || 26} <span className="text-xs font-bold text-slate-400">Days</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Upad Taken */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider truncate">UPAD ADVANCE</p>
            <p className="text-xl font-black text-amber-700 mt-0.5">-₹{upadInfo.total.toLocaleString("en-IN")}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
        </div>

        {/* Net Salary Payable */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider truncate">
              {workerPayout?.payment_status === "Paid" ? "NET SALARY PAID" : "ESTIMATED NET"}
            </p>
            <p className="text-xl font-black text-blue-700 mt-0.5">
              ₹{(workerPayout ? workerPayout.net_payable : estimatedNet).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. COMPACT CONTROLS TOOLBAR (WORKER SELECTOR + MONTH PICKER + DIGITAL TIME) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Worker Selector */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-extrabold text-xs shrink-0">
            {activeWorker ? activeWorker.name.charAt(0).toUpperCase() : "W"}
          </div>
          <div className="w-full sm:w-72">
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code || "KAR"}) - {w.assigned_machine || w.role || "Worker"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Month Selector & Live Time */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 h-9 shadow-2xs cursor-pointer">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 px-3 h-9 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono font-bold text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentTime}</span>
          </div>

          {workerPayout && (
            <button
              type="button"
              onClick={() => setSelectedSlip(workerPayout)}
              className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Salary Slip</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. TODAY'S SHIFT PUNCH CARD (CLEAN WHITE CARD MATCHING SOFTWARE STYLE) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">TODAY'S SHIFT PUNCH (આજની હાજરી)</span>
            <h2 className="text-sm font-extrabold text-slate-900 mt-0.5">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
            </h2>
          </div>

          <div>
            {isAbsentToday ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                ABSENT (ગેરહાજર)
              </span>
            ) : isClockedIn ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Active on Shift
              </span>
            ) : isCompletedToday ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                ✓ Shift Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                Not Clocked In
              </span>
            )}
          </div>
        </div>

        {/* Timestamps Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-center">
            <span className="text-[10px] text-slate-500 block font-bold uppercase">CLOCK IN</span>
            <span className="font-mono font-black text-base text-slate-900 mt-0.5 block">
              {todayPunch?.clock_in || "--:--"}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-center">
            <span className="text-[10px] text-slate-500 block font-bold uppercase">CLOCK OUT</span>
            <span className="font-mono font-black text-base text-slate-900 mt-0.5 block">
              {todayPunch?.clock_out || "--:--"}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-center">
            <span className="text-[10px] text-slate-500 block font-bold uppercase">
              {isClockedIn ? "LIVE WORKING TIME" : "HOURS WORKED"}
            </span>
            <span className={`font-mono font-black text-base mt-0.5 block ${isClockedIn ? "text-emerald-700" : "text-blue-600"}`}>
              {isAbsentToday
                ? "0 hrs"
                : isClockedIn
                ? liveElapsedStr
                : todayPunch?.total_hours
                ? `${todayPunch.total_hours} hrs`
                : "0 hrs"}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isAbsentToday ? (
            <div className="py-2.5 px-4 text-center bg-rose-50 text-rose-800 border border-rose-200 rounded-xl font-bold text-xs">
              આજની તારીખમાં તમે ગેરહાજર (ABSENT) નોંધાયેલા છો.
            </div>
          ) : !isClockedIn && !isCompletedToday ? (
            <button
              type="button"
              onClick={handleClockIn}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>CLOCK IN (કામ શરૂ - હાજરી નોંધો)</span>
            </button>
          ) : isClockedIn ? (
            <button
              type="button"
              onClick={handleClockOut}
              className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>CLOCK OUT (કામ પૂરું - રજા નોંધો)</span>
            </button>
          ) : (
            <div className="py-2.5 px-4 text-center bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs">
              ✓ આજની શિફ્ટ સફળતાપૂર્વક નોંધાઈ ગઈ છે! (Today's Punch Complete)
            </div>
          )}
        </div>
      </div>

      {/* 4. UPAD DETAILS & RECENT VOUCHERS CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <h3 className="font-extrabold text-slate-900 text-xs">Upad Advance Vouchers (તમે લીધેલો ઉપાડ)</h3>
            <p className="text-[11px] text-slate-500">Expenses voucher record for {selectedMonth}</p>
          </div>
          <span className="text-xs font-mono font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            Total: ₹{upadInfo.total.toLocaleString("en-IN")}
          </span>
        </div>

        {upadInfo.items.length === 0 ? (
          <p className="py-4 text-center text-slate-400 font-medium">આ મહિનામાં કોઈ ઉપાડ લીધેલ નથી (No upad advances taken this month).</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {upadInfo.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="font-mono font-bold text-slate-900">{item.expense_no}</span>
                  <span className="text-slate-500 font-medium ml-1.5 text-[11px]">({item.date})</span>
                </div>
                <span className="font-mono font-black text-amber-700">₹{item.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. OFFICIAL SALARY SLIP MODAL */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-xs text-slate-500 uppercase">OFFICIAL SALARY SLIP</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSlip(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
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
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
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
