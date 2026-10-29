"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Clock, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Plus, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fetchApi } from "@/lib/api";
import { getStoredCompanyId, getTenantItem } from "@/lib/tenantStorage";
import { 
  calculateAttendanceStatus, 
  getStoredAttendance, 
  saveAttendancePunch 
} from "@/lib/hrmsStorage";
import { AttendancePunch } from "@/types/hrms";

interface WorkerItem {
  id: string;
  name: string;
  code?: string;
  role?: string;
  shift?: "Day Shift" | "Night Shift";
  assigned_machine?: string;
  monthly_salary?: number;
  status?: string;
}

const getTodayStr = () => new Date().toISOString().split("T")[0];

export default function AttendancePage() {
  const { t } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedShift, setSelectedShift] = useState<"All" | "Day Shift" | "Night Shift">("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"punch" | "monthly">("punch");

  // Workers list
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  // Attendance records
  const [attendanceList, setAttendanceList] = useState<AttendancePunch[]>([]);

  // Edit / Manual Punch Modal State
  const [editPunchModal, setEditPunchModal] = useState<{
    worker: WorkerItem;
    punch?: AttendancePunch;
    clockIn: string;
    clockOut: string;
    manualStatus: "Full Day" | "Half Day" | "Absent" | "Overtime" | "Auto";
    notes: string;
  } | null>(null);

  // Live ticking clock
  useEffect(() => {
    setHasMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load workers and attendance records
  useEffect(() => {
    const currentCid = getStoredCompanyId() || "comp-001";

    // 1. Load workers
    async function loadWorkers() {
      try {
        const live = await fetchApi<any[]>("/workers");
        if (Array.isArray(live) && live.length > 0) {
          const scoped = live.filter((w) => (w.company_id || currentCid) === currentCid && w.status !== "Inactive");
          setWorkers(scoped);
          return;
        }
      } catch {}

      // Fallback from localStorage
      const localWorkers = getTenantItem<any[]>("texaflow_workers") || getTenantItem<any[]>("texaflow_employees") || [];
      if (Array.isArray(localWorkers) && localWorkers.length > 0) {
        setWorkers(localWorkers.filter((w) => w.status !== "Inactive"));
      } else {
        // Seed default karigars if empty
        setWorkers([
          { id: "wrk-001", name: "Pradeep Upad", code: "KAR-001", role: "Karigar", shift: "Day Shift", assigned_machine: "Machine 1", monthly_salary: 33000 },
          { id: "wrk-002", name: "Rajkumar", code: "KAR-002", role: "Karigar", shift: "Day Shift", assigned_machine: "Machine 2", monthly_salary: 28000 },
          { id: "wrk-003", name: "Mama Upad", code: "KAR-003", role: "Karigar", shift: "Night Shift", assigned_machine: "Machine 3", monthly_salary: 35000 },
          { id: "wrk-004", name: "Shiva Bhai", code: "KAR-004", role: "Thread Cutter", shift: "Day Shift", assigned_machine: "Floor", monthly_salary: 20000 },
          { id: "wrk-005", name: "Ambika Ben", code: "KAR-005", role: "Checking Staff", shift: "Day Shift", assigned_machine: "QC Desk", monthly_salary: 18000 },
        ]);
      }
    }

    loadWorkers();

    // 2. Load attendance
    const refreshAttendance = () => {
      setAttendanceList(getStoredAttendance());
    };
    refreshAttendance();

    window.addEventListener("hrms_attendance_updated", refreshAttendance);
    window.addEventListener("app_data_update", refreshAttendance);
    return () => {
      window.removeEventListener("hrms_attendance_updated", refreshAttendance);
      window.removeEventListener("app_data_update", refreshAttendance);
    };
  }, []);

  // Map of worker_id -> AttendancePunch for selectedDate
  const todayPunchMap = useMemo(() => {
    const map = new Map<string, AttendancePunch>();
    attendanceList
      .filter((p) => p.date === selectedDate)
      .forEach((p) => map.set(p.worker_id, p));
    return map;
  }, [attendanceList, selectedDate]);

  // Filtered workers
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || (w.name && w.name.toLowerCase().includes(q)) || (w.code && w.code.toLowerCase().includes(q));
      const matchesShift = selectedShift === "All" || w.shift === selectedShift;
      return matchesSearch && matchesShift;
    });
  }, [workers, search, selectedShift]);

  // Statistics for selected date
  const stats = useMemo(() => {
    let presentCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;
    let activeNow = 0;

    workers.forEach((w) => {
      const punch = todayPunchMap.get(w.id);
      if (!punch || punch.status === "Absent") {
        absentCount++;
      } else {
        if (punch.status === "Half Day") halfDayCount++;
        else presentCount++;
        if (punch.clock_in && !punch.clock_out) activeNow++;
      }
    });

    return { total: workers.length, present: presentCount, halfDay: halfDayCount, absent: absentCount, activeNow };
  }, [workers, todayPunchMap]);

  // Action: Clock In
  const handleClockIn = (worker: WorkerItem) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    const existing = todayPunchMap.get(worker.id);

    const punch: AttendancePunch = {
      id: existing?.id || `att-${Date.now()}-${worker.id}`,
      company_id: getStoredCompanyId() || "comp-001",
      worker_id: worker.id,
      worker_name: worker.name,
      worker_code: worker.code,
      date: selectedDate,
      clock_in: existing?.clock_in || timeStr,
      clock_out: null,
      total_hours: 0,
      status: "Present",
      overtime_hours: 0,
      shift: worker.shift || "Day Shift",
      created_at: new Date().toISOString()
    };

    saveAttendancePunch(punch);
    setAttendanceList(getStoredAttendance());
  };

  // Action: Clock Out
  const handleClockOut = (worker: WorkerItem) => {
    const existing = todayPunchMap.get(worker.id);
    if (!existing || !existing.clock_in) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

    // Calculate elapsed hours
    let hours = 0;
    try {
      const [inH, inM] = existing.clock_in.split(":").map(Number);
      const [outH, outM] = timeStr.split(":").map(Number);
      let diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
      if (diffMinutes < 0) diffMinutes += 24 * 60; // Over midnight shift
      hours = Math.round((diffMinutes / 60) * 10) / 10;
    } catch {
      hours = 8;
    }

    const { status, overtime_hours } = calculateAttendanceStatus(hours);

    const punch: AttendancePunch = {
      ...existing,
      clock_out: timeStr,
      total_hours: hours,
      status,
      overtime_hours,
      updated_at: new Date().toISOString()
    };

    saveAttendancePunch(punch);
    setAttendanceList(getStoredAttendance());
  };

  // Manual Punch Save
  const handleSaveManualPunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPunchModal) return;
    const { worker, punch: existing, clockIn, clockOut, manualStatus, notes } = editPunchModal;

    let hours = 0;
    if (clockIn && clockOut) {
      const [inH, inM] = clockIn.split(":").map(Number);
      const [outH, outM] = clockOut.split(":").map(Number);
      let diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
      if (diffMinutes < 0) diffMinutes += 24 * 60;
      hours = Math.round((diffMinutes / 60) * 10) / 10;
    } else if (manualStatus === "Full Day") {
      hours = 8;
    } else if (manualStatus === "Half Day") {
      hours = 4;
    }

    let finalStatus: AttendancePunch["status"] = "Present";
    let finalOt = 0;
    if (manualStatus !== "Auto") {
      finalStatus = manualStatus;
    } else {
      const calc = calculateAttendanceStatus(hours);
      finalStatus = calc.status;
      finalOt = calc.overtime_hours;
    }

    const punch: AttendancePunch = {
      id: existing?.id || `att-${Date.now()}-${worker.id}`,
      company_id: getStoredCompanyId() || "comp-001",
      worker_id: worker.id,
      worker_name: worker.name,
      worker_code: worker.code,
      date: selectedDate,
      clock_in: clockIn || null,
      clock_out: clockOut || null,
      total_hours: hours,
      status: finalStatus,
      overtime_hours: finalOt,
      shift: worker.shift || "Day Shift",
      notes: notes.trim(),
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    saveAttendancePunch(punch);
    setAttendanceList(getStoredAttendance());
    setEditPunchModal(null);
  };

  if (!hasMounted) return null;

  return (
    <div className="space-y-4 font-sans text-xs pb-16">
      {/* 1. TOP HEADER WITH LIVE DIGITAL CLOCK */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">HRMS & WORKER ATTENDANCE</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-0.5">Daily Clock In / Clock Out Register</h1>
        </div>

        {/* Live Clock & Shift Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-2.5 shadow-xs">
            <Clock className="w-4 h-4 text-emerald-400" />
            <div className="text-right">
              <span className="font-mono font-black text-sm tracking-wider text-emerald-400">{currentTime}</span>
              <span className="text-[10px] text-slate-400 block font-medium">Live Factory Clock</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">TOTAL WORKERS</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-black">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase">PRESENT (FULL)</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{stats.present}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 uppercase">HALF DAY</p>
            <p className="text-xl font-black text-amber-700 mt-0.5">{stats.halfDay}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-blue-600 uppercase">ON SHIFT NOW</p>
            <p className="text-xl font-black text-blue-700 mt-0.5">{stats.activeNow}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[11px] font-bold text-rose-600 uppercase">ABSENT / PENDING</p>
            <p className="text-xl font-black text-rose-700 mt-0.5">{stats.absent}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. CONTROL & FILTER BAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search worker by name, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 h-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        {/* Date Selector & Shift Toggle */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-9">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs">
            {(["All", "Day Shift", "Night Shift"] as const).map((sh) => (
              <button
                key={sh}
                type="button"
                onClick={() => setSelectedShift(sh)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  selectedShift === sh ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {sh}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(getTodayStr())}
            className="h-9 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl border border-blue-200 transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* 4. LIVE WORKERS PUNCH CARDS (GRID VIEW) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredWorkers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No active workers found matching your filter.
          </div>
        ) : (
          filteredWorkers.map((worker) => {
            const punch = todayPunchMap.get(worker.id);
            const isClockedIn = Boolean(punch && punch.clock_in && !punch.clock_out);
            const isCompleted = Boolean(punch && punch.clock_in && punch.clock_out);
            const isAbsent = Boolean(punch && punch.status === "Absent");
            const isHalfDay = Boolean(punch && punch.status === "Half Day");

            return (
              <div 
                key={worker.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between gap-3 hover:border-slate-300 transition-all"
              >
                {/* Header: Name, Code & Shift */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">{worker.name}</h3>
                      <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {worker.code || "KAR"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {worker.role || "Karigar"} • <span className="font-semibold text-slate-700">{worker.assigned_machine || "No machine"}</span>
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isClockedIn ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                        ON SHIFT
                      </span>
                    ) : isHalfDay ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                        HALF DAY (0.5)
                      </span>
                    ) : isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        COMPLETED
                      </span>
                    ) : isAbsent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                        ABSENT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        NOT ARRIVED
                      </span>
                    )}
                  </div>
                </div>

                {/* Punch Details: In, Out & Hours */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">IN TIME</span>
                    <span className="font-mono font-black text-slate-800 text-xs mt-0.5 block">
                      {punch?.clock_in || "--:--"}
                    </span>
                  </div>
                  <div className="border-x border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">OUT TIME</span>
                    <span className="font-mono font-black text-slate-800 text-xs mt-0.5 block">
                      {punch?.clock_out || "--:--"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">HOURS</span>
                    <span className="font-mono font-black text-blue-700 text-xs mt-0.5 block">
                      {punch?.total_hours ? `${punch.total_hours}h` : "0h"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Clock In / Clock Out / Manual Edit */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  {!isClockedIn && !isCompleted ? (
                    <button
                      type="button"
                      onClick={() => handleClockIn(worker)}
                      className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-2xs transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Clock In (આગમન)</span>
                    </button>
                  ) : isClockedIn ? (
                    <button
                      type="button"
                      onClick={() => handleClockOut(worker)}
                      className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-2xs transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Clock Out (છૂટી)</span>
                    </button>
                  ) : (
                    <div className="flex-1 py-1 text-center font-bold text-xs text-slate-500 bg-slate-100 rounded-xl">
                      ✓ Punch Recorded
                    </div>
                  )}

                  {/* Manual Edit Modal Opener */}
                  <button
                    type="button"
                    onClick={() => setEditPunchModal({
                      worker,
                      punch,
                      clockIn: punch?.clock_in || "08:30",
                      clockOut: punch?.clock_out || "20:30",
                      manualStatus: punch?.status === "Present" ? "Full Day" : (punch?.status || "Auto"),
                      notes: punch?.notes || ""
                    })}
                    className="h-9 w-9 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Manual Time & Status Adjustment"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. MANUAL PUNCH ADJUSTMENT MODAL */}
      {editPunchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Attendance Adjustment</h3>
                <p className="text-xs text-slate-500 font-medium">{editPunchModal.worker.name} ({editPunchModal.worker.code})</p>
              </div>
              <button
                type="button"
                onClick={() => setEditPunchModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualPunch} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Clock In Time</label>
                  <input
                    type="time"
                    value={editPunchModal.clockIn}
                    onChange={(e) => setEditPunchModal({ ...editPunchModal, clockIn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Clock Out Time</label>
                  <input
                    type="time"
                    value={editPunchModal.clockOut}
                    onChange={(e) => setEditPunchModal({ ...editPunchModal, clockOut: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Override Day Status</label>
                <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {(["Auto", "Full Day", "Half Day", "Absent"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditPunchModal({ ...editPunchModal, manualStatus: st })}
                      className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        editPunchModal.manualStatus === st ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Reason / Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Left early with permission, forgot to punch..."
                  value={editPunchModal.notes}
                  onChange={(e) => setEditPunchModal({ ...editPunchModal, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditPunchModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Save Punch Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
