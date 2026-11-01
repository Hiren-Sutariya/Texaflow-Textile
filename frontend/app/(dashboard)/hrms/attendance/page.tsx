"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Clock, 
  Calendar, 
  CalendarDays,
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
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  ChevronDown,
  User,
  Sliders,
  Briefcase,
  Trash2,
  ArrowLeft,
  Settings
} from "lucide-react";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import { useLanguage } from "@/context/LanguageContext";
import { fetchApi } from "@/lib/api";
import { getStoredCompanyId, getTenantItem } from "@/lib/tenantStorage";
import { 
  calculateAttendanceStatus, 
  getStoredAttendance, 
  saveAttendancePunch,
  deleteAttendancePunch,
  CompanyHolidayRules,
  CompanyCustomEvent,
  getCompanyHolidayRules,
  saveCompanyHolidayRules
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

// Comprehensive Gujarati & Indian festive calendar for 2026 (સંપૂર્ણ ગુજરાતી પંચાંગ ઉત્સવો)
const INDIAN_HOLIDAYS_2026: Record<string, string> = {
  // January 2026
  "2026-01-01": "New Year (નવું વર્ષ)",
  "2026-01-14": "Makar Sankranti (ઉત્તરાયણ)",
  "2026-01-15": "Vasi Uttarayan (વાસી ઉત્તરાયણ)",
  "2026-01-23": "Vasant Panchami (વસંત પંચમી)",
  "2026-01-26": "Republic Day (પ્રજાસત્તાક દિન)",
  "2026-01-29": "Putrada Ekadashi (પુત્રદા અગિયારસ)",

  // February 2026
  "2026-02-15": "Maha Shivratri (મહા શિવરાત્રી)",
  "2026-02-19": "Shivaji Jayanti (શિવાજી જયંતી)",

  // March 2026
  "2026-03-03": "Holi (હોળી પ્રાગટ્ય)",
  "2026-03-04": "Dhuleti (ધૂળેટી / રંગોત્સવ)",
  "2026-03-19": "Cheti Chand / Chaitra Navratri",
  "2026-03-27": "Ram Navami (શ્રીરામ નવમી)",
  "2026-03-31": "Mahavir Jayanti (મહાવીર જન્મ કલ્યાણક)",

  // April 2026
  "2026-04-02": "Hanuman Jayanti (હનુમાન જયંતી)",
  "2026-04-03": "Good Friday",
  "2026-04-14": "Dr. Ambedkar Jayanti",
  "2026-04-19": "Akshaya Tritiya (અખાત્રીજ)",

  // May 2026
  "2026-05-01": "Gujarat Day (ગુજરાત સ્થાપના દિન)",
  "2026-05-02": "Buddha Purnima (બુદ્ધ પૂર્ણિમા)",

  // June 2026
  "2026-06-25": "Nirjala Ekadashi (ભીમ અગિયારસ)",

  // July 2026
  "2026-07-16": "Rath Yatra (અષાઢી બીજ / રથયાત્રા)",
  "2026-07-29": "Guru Purnima (ગુરુ પૂર્ણિમા)",

  // August 2026
  "2026-08-02": "Nag Panchami (નાગ પાંચમ)",
  "2026-08-15": "Independence Day (સ્વાતંત્ર્ય દિન)",
  "2026-08-28": "Raksha Bandhan (રક્ષાબંધન / બળેવ)",

  // September 2026
  "2026-09-02": "Randhan Chhath (રાંધણ છઠ)",
  "2026-09-03": "Shitala Satam (શીતળા સાતમ)",
  "2026-09-04": "Janmashtami (શ્રીકૃષ્ણ જન્માષ્ટમી)",
  "2026-09-05": "Nand Mahotsav (નંદ મહોત્સવ)",
  "2026-09-14": "Ganesh Chaturthi (ગણેશ સ્થાપના)",
  "2026-09-24": "Anant Chaturdashi (ગણેશ વિસર્જન)",

  // October 2026
  "2026-10-02": "Mahatma Gandhi Jayanti",
  "2026-10-11": "Navratri Starts (નવરાત્રી ઘટસ્થાપન)",
  "2026-10-19": "Maha Ashtami (દુર્ગાષ્ટમી)",
  "2026-10-20": "Dussehra (દશેરા / વિજયાદશમી)",
  "2026-10-25": "Sharad Purnima (શરદ પૂનમ)",
  "2026-10-26": "Maharishi Valmiki Jayanti",
  "2026-10-29": "Karva Chauth (કરવા ચોથ)",
  "2026-10-31": "Sardar Patel Jayanti (રાષ્ટ્રીય એકતા દિન)",

  // November 2026 (Diwali Festive Week)
  "2026-11-06": "Dhanteras (ધનતેરસ / પૂજન)",
  "2026-11-07": "Kali Chaudas (કાળી ચૌદસ)",
  "2026-11-08": "Diwali (દિવાળી / લક્ષ્મીપૂજન)",
  "2026-11-09": "Bestu Varas (નૂતન વર્ષ ૨૦૮૩)",
  "2026-11-10": "Bhai Beej (ભાઈબીજ)",
  "2026-11-13": "Labh Pancham (લાભ પાંચમ / મુહૂર્ત)",
  "2026-11-15": "Jalaram Jayanti (જલારામ બાપા જયંતી)",
  "2026-11-20": "Dev Uthani Ekadashi (દેવ ઉઠી અગિયારસ)",
  "2026-11-21": "Tulsi Vivah (તુલસી વિવાહ)",
  "2026-11-24": "Dev Diwali (દેવ દિવાળી)",

  // December 2026
  "2026-12-20": "Gita Jayanti (મોક્ષદા એકાદશી)",
  "2026-12-25": "Christmas (નાતાલ)"
};

interface CalendarCell {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
  holidayName?: string;
  holidayTarget?: "all" | "staff" | "karigar";
  isSundayOff?: boolean;
  isSundayHalfDay?: boolean;
  isEmpty?: boolean;
}

// Generate grid cells for box-style monthly calendar (Sun - Sat)
// ONLY the selected month dates (1 to last day) are included!
// Extra leading & trailing slots are strictly blank/empty boxes - NO other month dates or events!
const buildMonthlyCalendarGrid = (
  yearMonth: string, 
  todayStr: string,
  holidayRules: CompanyHolidayRules,
  targetType: "all" | "staff" | "karigar"
): CalendarCell[] => {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-based (1 to 12)

  const firstDayOfMonth = new Date(year, month - 1, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun ... 6 = Sat

  const daysInCurrentMonth = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];

  // 1. Leading empty slots before day 1 (strictly empty, no date numbers)
  for (let i = 0; i < startingDayOfWeek; i++) {
    cells.push({
      dateStr: "",
      dayNumber: 0,
      isCurrentMonth: false,
      isToday: false,
      isSunday: i === 0,
      isEmpty: true
    });
  }

  // 2. ONLY current month days (1 to daysInCurrentMonth)
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dStr = `${yearMonth}-${String(day).padStart(2, "0")}`;
    const dateObj = new Date(year, month - 1, day);
    const isSunday = dateObj.getDay() === 0;

    // Check Sunday Off / Half Day rule according to company policy
    let isSundayOff = false;
    let isSundayHalfDay = false;
    if (isSunday) {
      const getPol = (target: "karigar" | "staff") => {
        if (target === "karigar") {
          return holidayRules.karigar_sunday_policy || (holidayRules.karigar_sunday_off ? "off" : "working");
        }
        return holidayRules.staff_sunday_policy || (holidayRules.staff_sunday_off ? "off" : "working");
      };

      if (targetType === "karigar") {
        const pol = getPol("karigar");
        isSundayOff = pol === "off";
        isSundayHalfDay = pol === "half_day";
      } else if (targetType === "staff") {
        const pol = getPol("staff")
        isSundayOff = pol === "off";
        isSundayHalfDay = pol === "half_day";
      } else {
        // Events & Holidays view
        const kp = getPol("karigar");
        const sp = getPol("staff");
        isSundayOff = kp === "off" || sp === "off";
        isSundayHalfDay = !isSundayOff && (kp === "half_day" || sp === "half_day");
      }
    }

    // Check custom company events first (with multi-day vacation range support)
    const customEvt = holidayRules.custom_events?.find((e) => {
      const start = e.date;
      const end = e.end_date || e.date;
      return dStr >= start && dStr <= end;
    });
    let holidayName: string | undefined = undefined;
    let holidayTarget: "all" | "staff" | "karigar" | undefined = undefined;

    if (customEvt) {
      if (targetType === "all") {
        holidayName = customEvt.name;
        holidayTarget = customEvt.target;
      } else if (customEvt.target === "all" || customEvt.target === targetType) {
        holidayName = customEvt.name;
        holidayTarget = customEvt.target;
      }
    } else if (INDIAN_HOLIDAYS_2026[dStr]) {
      // Standard Gujarati / Indian festival
      holidayName = INDIAN_HOLIDAYS_2026[dStr];
      holidayTarget = "all";
    }

    cells.push({
      dateStr: dStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dStr === todayStr,
      isSunday,
      isSundayOff,
      isSundayHalfDay,
      holidayName,
      holidayTarget,
      isEmpty: false
    });
  }

  // 3. Trailing empty slots to complete the current row (strictly empty, NO next month dates or events!)
  const totalSlots = Math.ceil((startingDayOfWeek + daysInCurrentMonth) / 7) * 7;
  const remainingCells = totalSlots - cells.length;
  for (let i = 0; i < remainingCells; i++) {
    const dayOfWeek = cells.length % 7;
    cells.push({
      dateStr: "",
      dayNumber: 0,
      isCurrentMonth: false,
      isToday: false,
      isSunday: dayOfWeek === 0,
      isEmpty: true
    });
  }

  return cells;
};

interface CustomSelectOption {
  value: string;
  label: string;
  shortLabel?: string;
  icon?: any;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = ""
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-xs select-none ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-2.5 bg-white border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""
        }`}
      >
        <div className="flex items-center gap-1.5 truncate pr-1">
          {selectedOption?.value === "events" || selectedOption?.value === "all" ? (
            <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          ) : (
            <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          )}
          <span className={`truncate text-xs ${selectedOption ? "font-bold text-slate-900" : "font-medium text-slate-400"}`}>
            {selectedOption ? (selectedOption.shortLabel || selectedOption.label) : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-1.5 w-full min-w-[175px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1.5 max-h-72 overflow-y-auto space-y-1">
          {options.map((opt) => {
            const isSelected = opt.value === value || (value === "all" && opt.value === "events");
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-blue-50 text-blue-950 font-extrabold border-blue-500 shadow-2xs"
                    : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.value === "events" || opt.value === "all" ? (
                    <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AttendancePage() {
  const { t } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => getTodayStr());
  const [selectedMonth, setSelectedMonth] = useState(() => getTodayStr().slice(0, 7));
  const [selectedShift, setSelectedShift] = useState<"All" | "Day Shift" | "Night Shift">("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");

  // Filter in Monthly Calendar view: "events" (Factory Events & Holidays) or specific worker id
  const [calendarWorkerFilter, setCalendarWorkerFilter] = useState<string>("events");

  // Company Attendance & Holiday Policy Rules
  const [holidayRules, setHolidayRules] = useState<CompanyHolidayRules>(getCompanyHolidayRules);

  // Dedicated Rules & Events Page View (Matching Worker Registration style)
  const [isRulesPageOpen, setIsRulesPageOpen] = useState(false);

  // New Event Form State
  const [newEventName, setNewEventName] = useState("");
  const [newEventIsMultiDay, setNewEventIsMultiDay] = useState(false);
  const [newEventDate, setNewEventDate] = useState(() => getTodayStr());
  const [newEventEndDate, setNewEventEndDate] = useState(() => getTodayStr());
  const [newEventTarget, setNewEventTarget] = useState<"all" | "staff" | "karigar">("all");
  const [newEventPayType, setNewEventPayType] = useState<"paid" | "unpaid">("paid");

  useEffect(() => {
    const handleRulesUpdate = (e: any) => {
      if (e.detail) {
        setHolidayRules(e.detail);
      } else {
        setHolidayRules(getCompanyHolidayRules());
      }
    };
    window.addEventListener("company_holiday_rules_updated", handleRulesUpdate);
    return () => window.removeEventListener("company_holiday_rules_updated", handleRulesUpdate);
  }, []);

  const handleSaveHolidayRules = (updated: CompanyHolidayRules) => {
    setHolidayRules(updated);
    saveCompanyHolidayRules(updated);
  };

  // Local state for numeric inputs so typing 0 or clearing doesn't get overwritten
  const [otRateInput, setOtRateInput] = useState<string>(() => String(holidayRules.ot_hourly_rate ?? 0));
  const [minHoursInput, setMinHoursInput] = useState<string>(() => String(holidayRules.min_hours_for_ot ?? 12));

  useEffect(() => {
    setOtRateInput(String(holidayRules.ot_hourly_rate ?? 0));
    setMinHoursInput(String(holidayRules.min_hours_for_ot ?? 12));
  }, [holidayRules.ot_hourly_rate, holidayRules.min_hours_for_ot]);

  const handleAddCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim() || !newEventDate) return;
    const newEvt: CompanyCustomEvent = {
      id: `evt-${Date.now()}`,
      name: newEventName.trim(),
      date: newEventDate,
      end_date: newEventIsMultiDay && newEventEndDate && newEventEndDate >= newEventDate ? newEventEndDate : undefined,
      target: newEventTarget,
      pay_type: newEventPayType,
    };
    const updated: CompanyHolidayRules = {
      ...holidayRules,
      custom_events: [newEvt, ...(holidayRules.custom_events || [])]
    };
    handleSaveHolidayRules(updated);
    setNewEventName("");
  };

  const handleDeleteCustomEvent = (id: string) => {
    const updated: CompanyHolidayRules = {
      ...holidayRules,
      custom_events: (holidayRules.custom_events || []).filter((e) => e.id !== id)
    };
    handleSaveHolidayRules(updated);
  };

  // Custom Date Picker Popover State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [pickerYear, setPickerYear] = useState<number>(() => {
    const parts = getTodayStr().split("-").map(Number);
    return parts[0] || new Date().getFullYear();
  });
  const [pickerMonth, setPickerMonth] = useState<number>(() => {
    const parts = getTodayStr().split("-").map(Number);
    return parts[1] || (new Date().getMonth() + 1);
  });

  // Close Date Picker Popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    if (isDatePickerOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isDatePickerOpen]);

  const handlePickerPrevMonth = () => {
    if (pickerMonth === 1) {
      setPickerYear(pickerYear - 1);
      setPickerMonth(12);
    } else {
      setPickerMonth(pickerMonth - 1);
    }
  };

  const handlePickerNextMonth = () => {
    if (pickerMonth === 12) {
      setPickerYear(pickerYear + 1);
      setPickerMonth(1);
    } else {
      setPickerMonth(pickerMonth + 1);
    }
  };

  // Grid cells for Date Picker Popover
  const pickerCalendarCells = useMemo(() => {
    const year = pickerYear;
    const month = pickerMonth;
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month, 0).getDate();
    const prevMonthTotalDays = new Date(year, month - 1, 0).getDate();

    const cells: { dateStr: string; dayNum: number; isCurrent: boolean; isSunday: boolean }[] = [];

    // Prev month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevM = month === 1 ? 12 : month - 1;
      const prevY = month === 1 ? year - 1 : year;
      const dStr = `${prevY}-${String(prevM).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dateStr: dStr, dayNum: d, isCurrent: false, isSunday: new Date(prevY, prevM - 1, d).getDay() === 0 });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dateStr: dStr, dayNum: d, isCurrent: true, isSunday: new Date(year, month - 1, d).getDay() === 0 });
    }

    // Next month days to reach 35 or 42
    const remaining = (cells.length <= 35 ? 35 : 42) - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 12 ? 1 : month + 1;
      const nextY = month === 12 ? year + 1 : year;
      const dStr = `${nextY}-${String(nextM).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dateStr: dStr, dayNum: d, isCurrent: false, isSunday: new Date(nextY, nextM - 1, d).getDay() === 0 });
    }

    return cells;
  }, [pickerYear, pickerMonth]);

  // Workers list
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  // Attendance records
  const [attendanceList, setAttendanceList] = useState<AttendancePunch[]>([]);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  // Edit / Manual Punch Modal State
  const [editPunchModal, setEditPunchModal] = useState<{
    worker: WorkerItem;
    punch?: AttendancePunch;
    clockIn: string;
    clockOut: string;
    manualStatus: "Full Day" | "Half Day" | "Absent" | "Overtime" | "Auto";
    notes: string;
  } | null>(null);

  // Live ticking clock & real-time counter (every second)
  useEffect(() => {
    setHasMounted(true);
    const updateTime = () => {
      const now = new Date();
      setNowTick(now.getTime());
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
          { id: "wrk-001", name: "Rakesh Bid", code: "KAR-001", role: "Karigar", shift: "Day Shift", assigned_machine: "Machine 1", monthly_salary: 33000 },
          { id: "wrk-002", name: "Gaurav", code: "KAR-002", role: "Karigar", shift: "Day Shift", assigned_machine: "Machine 3", monthly_salary: 33000 },
          { id: "wrk-003", name: "RajKumar", code: "STF-005", role: "Staff", shift: "Day Shift", assigned_machine: "Machine 1", monthly_salary: 10000 },
          { id: "wrk-004", name: "Tanuja", code: "STF-006", role: "Staff", shift: "Day Shift", assigned_machine: "Machine 1", monthly_salary: 10000 },
          { id: "wrk-005", name: "Kailash", code: "STF-007", role: "Staff", shift: "Day Shift", assigned_machine: "Machine 1", monthly_salary: 9500 },
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

  // Options for Monthly Calendar Dropdown matching CustomSelect design in Image 2
  const calendarFilterOptions = useMemo(() => [
    { value: "events", label: "Events & Holidays" },
    ...workers.map((w) => {
      const isStaff = w.role === "Staff" || String(w.code || "").toUpperCase().startsWith("STF");
      return {
        value: w.id,
        label: `${w.name} (${isStaff ? "Staff" : "Karigar"})`,
        shortLabel: w.name
      };
    })
  ], [workers]);

  // Target role for monthly calendar grid
  const currentRoleTarget = useMemo<"all" | "staff" | "karigar">(() => {
    if (calendarWorkerFilter === "events" || calendarWorkerFilter === "all") return "all";
    const w = workers.find((item) => item.id === calendarWorkerFilter);
    if (!w) return "all";
    const isStaff = w.role === "Staff" || String(w.code || "").toUpperCase().startsWith("STF");
    return isStaff ? "staff" : "karigar";
  }, [calendarWorkerFilter, workers]);

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

  // Grid cells for box-style monthly calendar
  const calendarCells = useMemo(() => {
    return buildMonthlyCalendarGrid(selectedMonth, getTodayStr(), holidayRules, currentRoleTarget);
  }, [selectedMonth, holidayRules, currentRoleTarget]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleSetCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  };

  // Formatted Month Title (e.g. October 2026)
  const monthTitle = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  // Action: Clock In
  const handleClockIn = (worker: WorkerItem) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const existing = todayPunchMap.get(worker.id);

    const punch: AttendancePunch = {
      id: existing?.id || `att-${Date.now()}-${worker.id}`,
      company_id: getStoredCompanyId() || "comp-001",
      worker_id: worker.id,
      worker_name: worker.name,
      worker_code: worker.code,
      date: selectedDate,
      clock_in: timeStr,
      clock_out: null,
      total_hours: 0,
      status: "Present",
      overtime_hours: 0,
      shift: worker.shift || "Day Shift",
      notes: "",
      created_at: now.toISOString()
    };

    saveAttendancePunch(punch);
    setAttendanceList(getStoredAttendance());
  };

  // Action: Clock Out
  const handleClockOut = (worker: WorkerItem) => {
    const existing = todayPunchMap.get(worker.id);
    if (!existing || !existing.clock_in) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

    // Calculate elapsed time from created_at or clock_in
    let startMs = now.getTime();
    if (existing.created_at) {
      const p = new Date(existing.created_at).getTime();
      if (!isNaN(p)) startMs = p;
    } else {
      const parts = existing.clock_in.split(":").map(Number);
      const d = new Date(selectedDate);
      d.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
      startMs = d.getTime();
    }

    const diffSeconds = Math.max(0, Math.floor((now.getTime() - startMs) / 1000));
    let hours = Math.round((diffSeconds / 3600) * 100) / 100;

    let { status, overtime_hours } = calculateAttendanceStatus(hours);
    if (hours < 3.5 && hours > 0.05) {
      status = "Half Day";
    } else if (hours <= 0.05) {
      status = "Present";
    }

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

  // Action: Quick Mark Absent (1-click from table)
  const handleMarkAbsent = (worker: WorkerItem) => {
    const existing = todayPunchMap.get(worker.id);
    const punch: AttendancePunch = {
      id: existing?.id || `att-${Date.now()}-${worker.id}`,
      company_id: getStoredCompanyId() || "comp-001",
      worker_id: worker.id,
      worker_name: worker.name,
      worker_code: worker.code,
      date: selectedDate,
      clock_in: null,
      clock_out: null,
      total_hours: 0,
      status: "Absent",
      overtime_hours: 0,
      shift: worker.shift || "Day Shift",
      notes: "Marked Absent",
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    saveAttendancePunch(punch);
    setAttendanceList(getStoredAttendance());
  };

  // Action: Quick Reset / Clear punch for today
  const handleResetPunch = (worker: WorkerItem) => {
    deleteAttendancePunch(worker.id, selectedDate);
    setAttendanceList(getStoredAttendance());
  };

  // Manual Punch Save
  const handleSaveManualPunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPunchModal) return;
    const { worker, punch: existing, clockIn, clockOut, manualStatus, notes } = editPunchModal;

    // Explicitly handle Absent
    if (manualStatus === "Absent") {
      const punch: AttendancePunch = {
        id: existing?.id || `att-${Date.now()}-${worker.id}`,
        company_id: getStoredCompanyId() || "comp-001",
        worker_id: worker.id,
        worker_name: worker.name,
        worker_code: worker.code,
        date: selectedDate,
        clock_in: null,
        clock_out: null,
        total_hours: 0,
        status: "Absent",
        overtime_hours: 0,
        shift: worker.shift || "Day Shift",
        notes: notes.trim() || "Marked Absent via modal",
        created_at: existing?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      saveAttendancePunch(punch);
      setAttendanceList(getStoredAttendance());
      setEditPunchModal(null);
      return;
    }

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

  if (isRulesPageOpen) {
    return (
      <div className="space-y-4 font-sans text-xs pb-24 animate-in fade-in duration-150">
        {/* TOP TOOLBAR / PAGE HEADER */}
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex items-center justify-between gap-3 text-xs shadow-2xs">
          <h2 className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">
            COMPANY HOLIDAY & ATTENDANCE RULES
          </h2>
          <button
            type="button"
            onClick={() => setIsRulesPageOpen(false)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Attendance</span>
          </button>
        </div>

        {/* 2 PARTS / SCREEN DIVISION (LEFT: SHIFTS & RULES, RIGHT: ADD EVENT FORM) - COMPACT & EQUAL HEIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">

          {/* ================= PART 1 (LEFT SIDE): ATTENDANCE & SHIFT POLICIES ================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">

              {/* 1. WEEKLY OFF POLICY (SUNDAY RULES) */}
              <div className="space-y-2.5">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-200/70 pb-1.5">
                  Weekly Off Policy (Sunday Rules)
                </h3>

                {/* Karigar Sunday Policy Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[115px_1fr] gap-2.5 items-center text-xs">
                  <label className="text-[11px] font-bold text-slate-600">Karigar Sunday</label>
                  <div className="flex items-center gap-1.5 max-w-sm w-full">
                    <button
                      type="button"
                      onClick={() => handleSaveHolidayRules({ 
                        ...holidayRules, 
                        karigar_sunday_policy: "off", 
                        karigar_sunday_off: true 
                      })}
                      className={`h-8 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer whitespace-nowrap flex-1 ${
                        (holidayRules.karigar_sunday_policy || (holidayRules.karigar_sunday_off ? "off" : "working")) === "off"
                          ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-extrabold"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      ✓ Sunday Off
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveHolidayRules({ 
                        ...holidayRules, 
                        karigar_sunday_policy: "half_day", 
                        karigar_sunday_off: false 
                      })}
                      className={`h-8 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer whitespace-nowrap flex-1 ${
                        holidayRules.karigar_sunday_policy === "half_day"
                          ? "bg-amber-50 border-amber-600 text-amber-700 shadow-2xs font-extrabold"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      ½ Half Day
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveHolidayRules({ 
                        ...holidayRules, 
                        karigar_sunday_policy: "working", 
                        karigar_sunday_off: false 
                      })}
                      className={`h-8 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer whitespace-nowrap flex-1 ${
                        (holidayRules.karigar_sunday_policy || (holidayRules.karigar_sunday_off ? "off" : "working")) === "working"
                          ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-extrabold"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Working
                    </button>
                  </div>
                </div>

                {/* Staff Sunday Policy Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[115px_1fr] gap-2.5 items-center text-xs">
                  <label className="text-[11px] font-bold text-slate-600">Staff Sunday</label>
                  <div className="flex items-center gap-1.5 max-w-sm w-full">
                    <button
                      type="button"
                      onClick={() => handleSaveHolidayRules({ 
                        ...holidayRules, 
                        staff_sunday_policy: "off", 
                        staff_sunday_off: true 
                      })}
                      className={`h-8 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer whitespace-nowrap flex-1 ${
                        (holidayRules.staff_sunday_policy || (holidayRules.staff_sunday_off ? "off" : "working")) === "off"
                          ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-extrabold"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      ✓ Sunday Off
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveHolidayRules({ 
                        ...holidayRules, 
                        staff_sunday_policy: "half_day", 
                        staff_sunday_off: false 
                      })}
                      className={`h-8 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer whitespace-nowrap flex-1 ${
                        holidayRules.staff_sunday_policy === "half_day"
                          ? "bg-amber-50 border-amber-600 text-amber-700 shadow-2xs font-extrabold"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      ½ Half Day
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveHolidayRules({ 
                        ...holidayRules, 
                        staff_sunday_policy: "working", 
                        staff_sunday_off: false 
                      })}
                      className={`h-8 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer whitespace-nowrap flex-1 ${
                        (holidayRules.staff_sunday_policy || (holidayRules.staff_sunday_off ? "off" : "working")) === "working"
                          ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-extrabold"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Working
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. WORKING SHIFTS & GRACE TIME */}
              <div className="space-y-2.5">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-200/70 pb-1.5">
                  Working Shifts & Grace Time
                </h3>

                {/* Day Shift Hours Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[115px_1fr] gap-2.5 items-center text-xs">
                  <label className="text-[11px] font-bold text-slate-600">Day Shift</label>
                  <div className="flex items-center gap-2 max-w-xs w-full">
                    <input
                      type="time"
                      value={holidayRules.day_shift_start || "08:00"}
                      onChange={(e) => handleSaveHolidayRules({ ...holidayRules, day_shift_start: e.target.value })}
                      className="h-8 px-2.5 bg-white border border-slate-300 rounded-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs flex-1 text-xs"
                    />
                    <span className="text-slate-400 font-bold text-[11px]">to</span>
                    <input
                      type="time"
                      value={holidayRules.day_shift_end || "20:00"}
                      onChange={(e) => handleSaveHolidayRules({ ...holidayRules, day_shift_end: e.target.value })}
                      className="h-8 px-2.5 bg-white border border-slate-300 rounded-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs flex-1 text-xs"
                    />
                  </div>
                </div>

                {/* Night Shift Hours Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[115px_1fr] gap-2.5 items-center text-xs">
                  <label className="text-[11px] font-bold text-slate-600">Night Shift</label>
                  <div className="flex items-center gap-2 max-w-xs w-full">
                    <input
                      type="time"
                      value={holidayRules.night_shift_start || "20:00"}
                      onChange={(e) => handleSaveHolidayRules({ ...holidayRules, night_shift_start: e.target.value })}
                      className="h-8 px-2.5 bg-white border border-slate-300 rounded-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs flex-1 text-xs"
                    />
                    <span className="text-slate-400 font-bold text-[11px]">to</span>
                    <input
                      type="time"
                      value={holidayRules.night_shift_end || "08:00"}
                      onChange={(e) => handleSaveHolidayRules({ ...holidayRules, night_shift_end: e.target.value })}
                      className="h-8 px-2.5 bg-white border border-slate-300 rounded-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs flex-1 text-xs"
                    />
                  </div>
                </div>

                {/* Grace Time Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[115px_1fr] gap-2.5 items-center text-xs">
                  <label className="text-[11px] font-bold text-slate-600">Grace Time</label>
                  <div className="flex items-center gap-2 max-w-xs w-full">
                    {[15, 30, 45].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleSaveHolidayRules({ ...holidayRules, grace_period_mins: mins })}
                        className={`h-8 px-3 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer whitespace-nowrap flex-1 ${
                          (holidayRules.grace_period_mins || 15) === mins
                            ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-extrabold"
                            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {mins} Min
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. OVERTIME (OT) CALCULATION RULES (SIDE BY SIDE IN 1 ROW) */}
              <div className="space-y-2.5">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-200/70 pb-1.5">
                  Overtime (OT) Calculation Rules
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  {/* Trigger OT Field */}
                  <div className="grid grid-cols-[115px_1fr] gap-2 items-center text-xs">
                    <label className="text-[11px] font-bold text-slate-600">Trigger OT</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={24}
                        value={minHoursInput}
                        onChange={(e) => {
                          setMinHoursInput(e.target.value);
                          const val = Number(e.target.value);
                          if (!isNaN(val)) {
                            handleSaveHolidayRules({ ...holidayRules, min_hours_for_ot: val });
                          }
                        }}
                        onBlur={() => {
                          if (minHoursInput === "" || isNaN(Number(minHoursInput))) {
                            setMinHoursInput("12");
                            handleSaveHolidayRules({ ...holidayRules, min_hours_for_ot: 12 });
                          }
                        }}
                        className="w-16 h-8 px-2 bg-white border border-slate-300 rounded-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs text-center"
                      />
                      <span className="text-slate-500 text-[11px] font-bold whitespace-nowrap">Hrs / Shift</span>
                    </div>
                  </div>

                  {/* Overtime Rate Field */}
                  <div className="grid grid-cols-[70px_1fr] sm:grid-cols-[65px_1fr] gap-2 items-center text-xs">
                    <label className="text-[11px] font-bold text-slate-600">OT Rate</label>
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-24">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={otRateInput}
                          onChange={(e) => {
                            setOtRateInput(e.target.value);
                            const val = Number(e.target.value);
                            if (!isNaN(val)) {
                              handleSaveHolidayRules({ ...holidayRules, ot_hourly_rate: val });
                            }
                          }}
                          onBlur={() => {
                            if (otRateInput === "" || isNaN(Number(otRateInput))) {
                              setOtRateInput("0");
                              handleSaveHolidayRules({ ...holidayRules, ot_hourly_rate: 0 });
                            }
                          }}
                          className="w-full h-8 pl-6 pr-2 bg-white border border-slate-300 rounded-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                        />
                      </div>
                      <span className="text-slate-500 text-[11px] font-bold whitespace-nowrap">/ Hour</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ================= PART 2 (RIGHT SIDE): ADD COMPANY EVENT & HOLIDAY ================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4 h-full flex flex-col justify-between">
            <form onSubmit={handleAddCustomEvent} className="space-y-3">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-200/70 pb-1.5">
                Add Company Event & Holiday
              </h3>

              {/* Duration Type Row */}
              <div className="grid grid-cols-1 sm:grid-cols-[115px_1fr] gap-2.5 items-center text-xs">
                <label className="text-[11px] font-bold text-slate-600">Duration</label>
                <div className="flex items-center gap-2 w-full max-w-sm">
                  <button
                    type="button"
                    onClick={() => setNewEventIsMultiDay(false)}
                    className={`h-8 px-3 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer whitespace-nowrap flex-1 ${
                      !newEventIsMultiDay
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-extrabold"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Single Day
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewEventIsMultiDay(true);
                      if (!newEventEndDate || newEventEndDate < newEventDate) {
                        setNewEventEndDate(newEventDate);
                      }
                    }}
                    className={`h-8 px-3 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer whitespace-nowrap flex-1 ${
                      newEventIsMultiDay
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-extrabold"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Date Range / Vacation
                  </button>
                </div>
              </div>

              {/* Event Name Row */}
              <div className="grid grid-cols-1 sm:grid-cols-[115px_1fr] gap-2.5 items-center text-xs">
                <label className="text-[11px] font-bold text-slate-600">Event Name*</label>
                <div className="w-full">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diwali Vacation, Annual Gathering"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Event Date(s) Row */}
              <div className="grid grid-cols-1 sm:grid-cols-[115px_1fr] gap-2.5 items-center text-xs">
                <label className="text-[11px] font-bold text-slate-600">
                  {!newEventIsMultiDay ? "Event Date*" : "Dates*"}
                </label>
                {!newEventIsMultiDay ? (
                  <div className="max-w-xs">
                    <input
                      type="date"
                      required
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      required
                      value={newEventDate}
                      onChange={(e) => {
                        setNewEventDate(e.target.value);
                        if (newEventEndDate < e.target.value) setNewEventEndDate(e.target.value);
                      }}
                      className="h-8 px-2.5 bg-white border border-slate-300 rounded-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs flex-1 text-xs"
                    />
                    <span className="text-slate-400 font-bold text-[11px]">to</span>
                    <input
                      type="date"
                      required
                      min={newEventDate}
                      value={newEventEndDate}
                      onChange={(e) => setNewEventEndDate(e.target.value)}
                      className="h-8 px-2.5 bg-white border border-slate-300 rounded-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs flex-1 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Pay Policy Row */}
              <div className="grid grid-cols-1 sm:grid-cols-[115px_1fr] gap-2.5 items-center text-xs">
                <label className="text-[11px] font-bold text-slate-600">Pay Policy*</label>
                <div className="flex items-center gap-2 max-w-sm w-full">
                  <button
                    type="button"
                    onClick={() => setNewEventPayType("paid")}
                    className={`h-8 px-3 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer whitespace-nowrap flex-1 ${
                      newEventPayType === "paid"
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-extrabold"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Paid Holiday
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEventPayType("unpaid")}
                    className={`h-8 px-3 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer whitespace-nowrap flex-1 ${
                      newEventPayType === "unpaid"
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-extrabold"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Unpaid Off
                  </button>
                </div>
              </div>

              {/* Applicable To Row */}
              <div className="grid grid-cols-1 sm:grid-cols-[115px_1fr] gap-2.5 items-center text-xs">
                <label className="text-[11px] font-bold text-slate-600">Applicable To*</label>
                <div className="flex items-center gap-2 max-w-sm w-full">
                  <button
                    type="button"
                    onClick={() => setNewEventTarget("all")}
                    className={`h-8 px-3 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer whitespace-nowrap flex-1 ${
                      newEventTarget === "all"
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-extrabold"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEventTarget("staff")}
                    className={`h-8 px-3 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer whitespace-nowrap flex-1 ${
                      newEventTarget === "staff"
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-extrabold"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEventTarget("karigar")}
                    className={`h-8 px-3 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer whitespace-nowrap flex-1 ${
                      newEventTarget === "karigar"
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-extrabold"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Karigar
                  </button>
                </div>
              </div>

              {/* Submit Button Row */}
              <div className="grid grid-cols-1 sm:grid-cols-[115px_1fr] gap-2.5 items-center text-xs pt-1.5">
                <div></div>
                <div>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Event</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>

        {/* FULL-WIDTH CONFIGURED COMPANY EVENTS TABLE (OUTSIDE THE 2 PARTS) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3 mb-16">
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-200/70 pb-2">
            Configured Company Events ({holidayRules.custom_events?.length || 0})
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-4">DATE(S)</th>
                  <th className="py-2.5 px-4">EVENT NAME</th>
                  <th className="py-2.5 px-4">PAY POLICY</th>
                  <th className="py-2.5 px-4">APPLICABLE TO</th>
                  <th className="py-2.5 px-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!holidayRules.custom_events || holidayRules.custom_events.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                      No custom events configured yet.
                    </td>
                  </tr>
                ) : (
                  holidayRules.custom_events.map((evt) => {
                    const isMulti = evt.end_date && evt.end_date !== evt.date;
                    let durationDays = 1;
                    if (isMulti && evt.end_date) {
                      const d1 = new Date(evt.date);
                      const d2 = new Date(evt.end_date);
                      durationDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1);
                    }

                    return (
                      <tr key={evt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                          {isMulti ? (
                            <div className="flex items-center gap-1.5">
                              <span>{evt.date} → {evt.end_date}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                                {durationDays} Days
                              </span>
                            </div>
                          ) : (
                            <span>{evt.date}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-extrabold text-slate-900">{evt.name}</td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            evt.pay_type === "unpaid"
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {evt.pay_type === "unpaid" ? "⛔ Unpaid Off" : "💰 Paid Holiday"}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            evt.target === "staff"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : evt.target === "karigar"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>
                            {evt.target === "staff" ? "👔 Staff Only" : evt.target === "karigar" ? "🧵 Karigar Only" : "👥 All"}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomEvent(evt.id)}
                            className="px-2.5 py-1 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 mx-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* UNIFIED FIXED BOTTOM ACTION BAR */}
        <BottomActionBar
          leftContent={
            <button
              type="button"
              onClick={() => setIsRulesPageOpen(false)}
              className="px-5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
          }
          rightContent={
            <button
              type="button"
              onClick={() => setIsRulesPageOpen(false)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Save & Return to Attendance</span>
            </button>
          }
        />
      </div>
    );
  }


  return (
    <div className="space-y-4 font-sans text-xs pb-16">
      {/* 1. TOP STATS OVERVIEW CARDS (CLEAN & SIMPLE) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">TOTAL WORKERS</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-black">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider truncate">PRESENT (FULL)</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{stats.present}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider truncate">HALF DAY (0.5)</p>
            <p className="text-xl font-black text-amber-700 mt-0.5">{stats.halfDay}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider truncate">ABSENT / PENDING</p>
            <p className="text-xl font-black text-rose-700 mt-0.5">{stats.absent}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. COMPACT CONTROLS TOOLBAR & VIEW SWITCHER */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Left: View Mode Tabs (Daily Register vs Monthly Box Calendar) & Search */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("daily")}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "daily" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Daily Register</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("monthly")}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "monthly" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              <span>Monthly Calendar</span>
            </button>
          </div>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search worker by name, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 h-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Right: Date/Month Selector & Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          {viewMode === "daily" ? (
            <>
              {/* Custom Styled Date Picker Popover */}
              <div className="relative" ref={datePickerRef}>
                <button
                  type="button"
                  onClick={() => {
                    const [y, m] = selectedDate.split("-").map(Number);
                    if (y && m) {
                      setPickerYear(y);
                      setPickerMonth(m);
                    }
                    setIsDatePickerOpen(!isDatePickerOpen);
                  }}
                  className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 hover:border-blue-400 rounded-xl px-3 h-9 shadow-2xs transition-all cursor-pointer group"
                  title="Select attendance date"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {(() => {
                      const parts = selectedDate.split("-");
                      return parts.length === 3 ? `${parts[2]} / ${parts[1]} / ${parts[0]}` : selectedDate;
                    })()}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDatePickerOpen ? "rotate-180 text-blue-600" : ""}`} />
                </button>

                {isDatePickerOpen && (
                  <div className="absolute right-0 sm:left-0 top-full mt-2 z-50 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3.5 animate-in fade-in zoom-in-95 duration-150">
                    {/* Header: Month & Year Navigator */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={handlePickerPrevMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Previous Month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-black text-slate-900 tracking-tight">
                        {MONTH_NAMES[pickerMonth - 1]} {pickerYear}
                      </span>
                      <button
                        type="button"
                        onClick={handlePickerNextMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Next Month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Day Names Row */}
                    <div className="grid grid-cols-7 text-center font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                      <div className="text-rose-500">Su</div>
                      <div>Mo</div>
                      <div>Tu</div>
                      <div>We</div>
                      <div>Th</div>
                      <div>Fr</div>
                      <div>Sa</div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {pickerCalendarCells.map((cell, idx) => {
                        const isSelected = cell.dateStr === selectedDate;
                        const isToday = cell.dateStr === getTodayStr();

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedDate(cell.dateStr);
                              setIsDatePickerOpen(false);
                            }}
                            className={`h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer relative ${
                              isSelected
                                ? "bg-blue-600 text-white shadow-xs scale-105"
                                : !cell.isCurrent
                                ? "text-slate-300 hover:text-slate-500 hover:bg-slate-50"
                                : cell.isSunday
                                ? "text-rose-600 hover:bg-rose-50"
                                : "text-slate-800 hover:bg-blue-50 hover:text-blue-600"
                            }`}
                          >
                            <span>{cell.dayNum}</span>
                            {isToday && !isSelected && (
                              <span className="w-1 h-1 rounded-full bg-blue-600 absolute bottom-1"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Shortcuts in Popover Footer */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          const today = getTodayStr();
                          setSelectedDate(today);
                          const [y, m] = today.split("-").map(Number);
                          setPickerYear(y);
                          setPickerMonth(m);
                          setIsDatePickerOpen(false);
                        }}
                        className="text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        Today
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                        {selectedDate}
                      </span>
                    </div>
                  </div>
                )}
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
            </>
          ) : (
            <>
              {/* Monthly Calendar View Controls: Custom Dropdown Menu matching Image 2 */}
              <div className="w-44 sm:w-48">
                <CustomSelect
                  value={calendarWorkerFilter}
                  onChange={(val) => setCalendarWorkerFilter(val)}
                  options={calendarFilterOptions}
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-white rounded-lg text-slate-700 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono font-bold text-xs px-2 text-slate-900 whitespace-nowrap">
                  {selectedMonth}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-white rounded-lg text-slate-700 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleSetCurrentMonth}
                className="h-9 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl border border-blue-200 transition-colors cursor-pointer"
              >
                This Month
              </button>

              <button
                type="button"
                onClick={() => setIsRulesPageOpen(true)}
                className="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Company Holiday & Attendance Rules"
              >
                <Settings className="w-3.5 h-3.5 text-blue-600" />
                <span>Company Rules</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3A. DAILY ATTENDANCE REGISTER TABLE (STANDARDIZED ACTION COLUMN) */}
      {viewMode === "daily" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-4 border-r border-slate-200/80">WORKER / KARIGAR</th>
                  <th className="py-2.5 px-4 text-center border-r border-slate-200/80">SHIFT</th>
                  <th className="py-2.5 px-4 text-center border-r border-slate-200/80">CLOCK IN</th>
                  <th className="py-2.5 px-4 text-center border-r border-slate-200/80">CLOCK OUT</th>
                  <th className="py-2.5 px-4 text-center border-r border-slate-200/80">LIVE WORKING TIME</th>
                  <th className="py-2.5 px-4 text-center border-r border-slate-200/80">OVERTIME (OT)</th>
                  <th className="py-2.5 px-4 border-r border-slate-200/80">REMARKS / NOTES</th>
                  <th className="py-2.5 px-4 text-center border-r border-slate-200/80">STATUS</th>
                  <th className="py-2.5 px-4 text-center w-[230px]">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      No active workers found matching your filter.
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => {
                    const punch = todayPunchMap.get(worker.id);
                    const isAbsent = Boolean(punch && punch.status === "Absent");
                    const isClockedIn = Boolean(punch && !isAbsent && punch.clock_in && !punch.clock_out);
                    const isCompleted = Boolean(punch && !isAbsent && punch.clock_in && punch.clock_out);

                    return (
                      <tr key={worker.id} className="hover:bg-blue-50/30 transition-colors">
                        {/* 1. Worker Name Only */}
                        <td className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap">
                          <span className="font-extrabold text-slate-900 text-xs">{worker.name}</span>
                        </td>

                        {/* 2. Shift (Day / Night) */}
                        <td className="py-3 px-4 text-center border-r border-slate-200/70 whitespace-nowrap">
                          {worker.shift === "Night Shift" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Moon className="w-3 h-3 text-indigo-500" />
                              Night
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Sun className="w-3 h-3 text-amber-500" />
                              Day
                            </span>
                          )}
                        </td>

                        {/* 4. Clock In */}
                        <td className="py-3 px-4 text-center border-r border-slate-200/70 whitespace-nowrap font-mono font-bold text-slate-800">
                          {punch?.clock_in && !isAbsent ? (
                            <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                              {punch.clock_in}
                            </span>
                          ) : (
                            <span className="text-slate-300">--:--</span>
                          )}
                        </td>

                        {/* 5. Clock Out */}
                        <td className="py-3 px-4 text-center border-r border-slate-200/70 whitespace-nowrap font-mono font-bold text-slate-800">
                          {punch?.clock_out && !isAbsent ? (
                            <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                              {punch.clock_out}
                            </span>
                          ) : (
                            <span className="text-slate-300">--:--</span>
                          )}
                        </td>

                        {/* 6. Live Working Time (Live counting second-by-second) */}
                        <td className="py-3 px-4 text-center border-r border-slate-200/70 whitespace-nowrap">
                          {(() => {
                            if (isAbsent) {
                              return <span className="text-slate-400 font-mono text-xs font-bold">-</span>;
                            }
                            if (isClockedIn) {
                              let startMs = nowTick;
                              if (punch?.created_at) {
                                const p = new Date(punch.created_at).getTime();
                                if (!isNaN(p)) startMs = p;
                              } else if (punch?.clock_in) {
                                const parts = punch.clock_in.split(":").map(Number);
                                const d = new Date(selectedDate);
                                d.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
                                startMs = d.getTime();
                              }
                              const diffSec = Math.max(0, Math.floor((nowTick - startMs) / 1000));
                              const h = Math.floor(diffSec / 3600);
                              const m = Math.floor((diffSec % 3600) / 60);
                              const s = diffSec % 60;
                              const timeStr = `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;

                              return (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-300 shadow-2xs">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                                  </span>
                                  <span className="font-mono font-black text-xs text-emerald-800 tracking-wider">
                                    {timeStr}
                                  </span>
                                  <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-200/60 px-1 py-0.5 rounded">
                                    LIVE
                                  </span>
                                </div>
                              );
                            }
                            if (isCompleted) {
                              const totH = punch?.total_hours || 0;
                              const h = Math.floor(totH);
                              const m = Math.round((totH - h) * 60);
                              return (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 font-mono font-bold text-xs text-slate-800">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{h}h {String(m).padStart(2, "0")}m ({totH} hrs)</span>
                                </div>
                              );
                            }
                            return <span className="text-slate-300 font-mono text-xs">--:--:--</span>;
                          })()}
                        </td>

                        {/* 7. Overtime (OT) */}
                        <td className="py-3 px-4 text-center border-r border-slate-200/70 whitespace-nowrap font-mono font-bold">
                          {punch?.overtime_hours && punch.overtime_hours > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
                              +{punch.overtime_hours} hrs
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </td>

                        {/* 8. Remarks / Notes */}
                        <td className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap text-slate-500 text-[11px] max-w-[140px] truncate" title={punch?.notes || "No notes"}>
                          {punch?.notes ? (
                            <span className="text-slate-700 font-medium">{punch.notes}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* 9. Status */}
                        <td className="py-3 px-4 text-center border-r border-slate-200/70 whitespace-nowrap">
                          {isAbsent ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              ABSENT
                            </span>
                          ) : isClockedIn ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                              ON SHIFT
                            </span>
                          ) : punch?.status === "Half Day" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              HALF DAY (0.5)
                            </span>
                          ) : punch?.status === "Overtime" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              OVERTIME (+{punch.overtime_hours}h)
                            </span>
                          ) : isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              FULL DAY (1.0)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              PENDING
                            </span>
                          )}
                        </td>

                        {/* 10. STANDARDIZED UNIFORM ACTION COLUMN (IDENTICAL WIDTH & HEIGHT IN EVERY ROW) */}
                        <td className="py-3 px-4 text-center whitespace-nowrap w-[230px]">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Primary Action Button (Fixed w-28, h-8 across all rows) */}
                            {isAbsent ? (
                              <button
                                type="button"
                                onClick={() => handleClockIn(worker)}
                                className="w-28 h-8 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                                title="Mark Present / Clock In"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Present</span>
                              </button>
                            ) : isClockedIn ? (
                              <button
                                type="button"
                                onClick={() => handleClockOut(worker)}
                                className="w-28 h-8 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                                title="Record Shift Out Time"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Clock Out</span>
                              </button>
                            ) : isCompleted ? (
                              <div className="w-28 h-8 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Completed</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleClockIn(worker)}
                                className="w-28 h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                                title="Clock In for Shift"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Clock In</span>
                              </button>
                            )}

                            {/* Secondary Quick Action Button (Fixed w-8, h-8) */}
                            {!isClockedIn && !isCompleted && !isAbsent ? (
                              <button
                                type="button"
                                onClick={() => handleMarkAbsent(worker)}
                                className="w-8 h-8 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                                title="Mark Absent for today"
                              >
                                <XCircle className="w-4 h-4 text-rose-600" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleResetPunch(worker)}
                                className="w-8 h-8 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                                title="Reset Today's Punch"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Calendar View Button - Direct Switch to Monthly View (No Pop-up) */}
                            <button
                              type="button"
                              onClick={() => {
                                setCalendarWorkerFilter(worker.id);
                                setViewMode("monthly");
                              }}
                              className="w-8 h-8 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 border border-slate-200 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                              title="View Monthly Attendance Calendar"
                            >
                              <CalendarDays className="w-3.5 h-3.5" />
                            </button>

                            {/* Manual Edit Modal Button (Fixed w-8, h-8) */}
                            <button
                              type="button"
                              onClick={() => setEditPunchModal({
                                worker,
                                punch,
                                clockIn: punch?.clock_in || "08:30",
                                clockOut: punch?.clock_out || "20:30",
                                manualStatus: isAbsent ? "Absent" : punch?.status === "Present" ? "Full Day" : (punch?.status || "Auto"),
                                notes: punch?.notes || ""
                              })}
                              className="w-8 h-8 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 border border-slate-200 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                              title="Adjust Time / Status"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
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
      )}

      {/* 3B. MONTHLY BOX-STYLE CALENDAR GRID (FULL WIDTH, NO HORIZONTAL SCROLL) */}
      {viewMode === "monthly" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Calendar Header with Title & Compact Legend (Minimal Text) */}
          <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                {monthTitle}
              </h2>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[180px] sm:max-w-xs flex items-center gap-1.5">
                {calendarWorkerFilter === "events" || calendarWorkerFilter === "all" ? (
                  <span>Events & Holidays</span>
                ) : (
                  <>
                    <span>{workers.find((w) => w.id === calendarWorkerFilter)?.name}</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                      currentRoleTarget === "staff" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {currentRoleTarget === "staff" ? "Staff" : "Karigar"}
                    </span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Compact Contextual Legend */}
              {calendarWorkerFilter === "events" || calendarWorkerFilter === "all" ? (
                <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200/90 px-2.5 py-1 rounded-xl">
                  <span className="flex items-center gap-1.5 text-sky-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Holiday / Festival
                  </span>
                  <span className="text-slate-200">|</span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Sunday Off
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200/90 px-2.5 py-1 rounded-xl">
                  <span className="flex items-center gap-1.5 text-emerald-900">
                    <span className="w-4 h-4 rounded bg-emerald-200 border border-emerald-300 text-emerald-900 font-black flex items-center justify-center text-[9px] shadow-2xs">P</span> Present
                  </span>
                  <span className="text-slate-200">|</span>
                  <span className="flex items-center gap-1.5 text-amber-900">
                    <span className="w-5 h-4 rounded bg-amber-200 border border-amber-300 text-amber-900 font-black flex items-center justify-center text-[8px] shadow-2xs">1/2</span> Half Day
                  </span>
                  <span className="text-slate-200">|</span>
                  <span className="flex items-center gap-1.5 text-rose-900">
                    <span className="w-4 h-4 rounded bg-rose-200 border border-rose-300 text-rose-900 font-black flex items-center justify-center text-[9px] shadow-2xs">A</span> Absent
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsRulesPageOpen(true)}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] shadow-2xs"
                title="Manage Sunday Off & Custom Events"
              >
                <Settings className="w-3.5 h-3.5 text-blue-600" />
                <span>Rules</span>
              </button>
            </div>
          </div>

          {/* 7-COLUMN BOX CALENDAR GRID (100% WIDTH, ZERO HORIZONTAL SCROLL) */}
          <div className="w-full">
            {/* Day of Week Header (Sun, Mon, Tue, Wed, Thu, Fri, Sat) */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/90 text-center font-extrabold text-[10px] sm:text-[11px] text-slate-600 uppercase tracking-wider py-2">
              <div className="text-rose-600">Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Day Boxes (Responsive boxes that fit exactly without scrolling) */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 bg-slate-200/50">
              {calendarCells.map((cell, idx) => {
                // If this is a leading or trailing empty slot (outside the selected month), keep it completely blank
                if (cell.isEmpty || !cell.isCurrentMonth) {
                  return (
                    <div
                      key={idx}
                      className="min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 bg-slate-50/40 select-none"
                    />
                  );
                }

                const isEventsMode = calendarWorkerFilter === "events" || calendarWorkerFilter === "all";
                const singleWorkerPunch = !isEventsMode 
                  ? attendanceList.find((p) => p.date === cell.dateStr && p.worker_id === calendarWorkerFilter)
                  : null;
                const isHoliday = Boolean(cell.holidayName);
                const isPresent = !isEventsMode && Boolean(
                  singleWorkerPunch && (singleWorkerPunch.status === "Full Day" || singleWorkerPunch.status === "Present" || singleWorkerPunch.status === "Overtime")
                );
                const isHalfDay = !isEventsMode && singleWorkerPunch?.status === "Half Day";
                const isAbsent = !isEventsMode && singleWorkerPunch?.status === "Absent";

                return (
                  <div
                    key={idx}
                    className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors select-none ${
                      isHoliday
                        ? "bg-sky-100 hover:bg-sky-200/80 text-sky-950"
                        : isPresent
                        ? "bg-emerald-100/70 hover:bg-emerald-100/90 text-emerald-950"
                        : isHalfDay
                        ? "bg-amber-100/70 hover:bg-amber-100/90 text-amber-950"
                        : isAbsent
                        ? "bg-rose-100/70 hover:bg-rose-100/90 text-rose-950"
                        : cell.isSunday && cell.isSundayOff
                        ? "bg-slate-50/60 text-slate-800"
                        : "bg-white text-slate-800"
                    }`}
                  >
                    {/* Top Bar: Date number + Small Corner Attendance Tag (when viewing worker) */}
                    <div className="flex items-start justify-between gap-1">
                      {cell.isToday ? (
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-600 text-white font-mono font-black text-[10px] sm:text-xs flex items-center justify-center shadow-xs shrink-0">
                          {cell.dayNumber}
                        </span>
                      ) : (
                        <span
                          className={`font-mono font-bold text-[11px] sm:text-xs ${
                            isHoliday
                              ? "text-sky-950 font-black"
                              : isPresent
                              ? "text-emerald-950 font-black"
                              : isHalfDay
                              ? "text-amber-950 font-black"
                              : isAbsent
                              ? "text-rose-950 font-black"
                              : cell.isSunday && cell.isSundayOff
                              ? "text-rose-500 font-extrabold"
                              : "text-slate-700"
                          }`}
                        >
                          {cell.dayNumber}
                        </span>
                      )}

                      {/* Small Corner Badge in Worker Calendar */}
                      {!isEventsMode && singleWorkerPunch && (
                        <div className="flex items-center gap-1">
                          {isAbsent ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black text-rose-900 bg-rose-200/90 border border-rose-300 shadow-2xs">
                              A
                            </span>
                          ) : isHalfDay ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black text-amber-900 bg-amber-200/90 border border-amber-300 shadow-2xs">
                              1/2
                            </span>
                          ) : isPresent ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black text-emerald-900 bg-emerald-200/90 border border-emerald-300 shadow-2xs">
                              P
                            </span>
                          ) : null}

                          {Number(singleWorkerPunch.overtime_hours) > 0 && (
                            <span className="px-1 py-0.5 rounded text-[8px] font-extrabold text-purple-900 bg-purple-200/90 border border-purple-300">
                              +{singleWorkerPunch.overtime_hours}h
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Middle: Events (when in Factory Events mode) OR Clean spacing for worker */}
                    <div className="my-auto py-1 space-y-0.5">
                      {isEventsMode ? (
                        /* FACTORY EVENTS & HOLIDAYS MODE: Clean text without inner box */
                        cell.holidayName ? (
                          <div className="text-center px-1.5 space-y-0.5">
                            <span
                              className="text-[10px] sm:text-[11px] font-black text-sky-950 block leading-tight line-clamp-2"
                              title={cell.holidayName}
                            >
                              {cell.holidayName}
                            </span>
                            {cell.holidayTarget && cell.holidayTarget !== "all" && (
                              <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-sky-200/90 text-sky-900 border border-sky-300">
                                {cell.holidayTarget === "staff" ? "Staff Only" : "Karigar Only"}
                              </span>
                            )}
                          </div>
                        ) : cell.isSunday ? (
                          <span className="text-[10px] font-bold block text-center py-0.5">
                            {cell.isSundayHalfDay ? (
                              <span className="text-amber-700 font-extrabold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[9px] inline-block">
                                ½ Half Day
                              </span>
                            ) : cell.isSundayOff ? (
                              <span className="text-slate-400 font-bold">Sunday Off</span>
                            ) : (
                              <span className="text-slate-400 font-medium">Working Day</span>
                            )}
                          </span>
                        ) : null
                      ) : (
                        /* INDIVIDUAL WORKER VIEW: Clean view (Attendance indicator is in the corner) */
                        cell.holidayName ? (
                          <div className="text-center px-1.5 space-y-0.5">
                            <span
                              className="text-[10px] sm:text-[11px] font-black text-sky-950 block leading-tight line-clamp-2"
                              title={cell.holidayName}
                            >
                              {cell.holidayName}
                            </span>
                            {cell.holidayTarget && cell.holidayTarget !== "all" && (
                              <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-sky-200/90 text-sky-900 border border-sky-300">
                                {cell.holidayTarget === "staff" ? "Staff Holiday" : "Karigar Holiday"}
                              </span>
                            )}
                          </div>
                        ) : !singleWorkerPunch && cell.isSunday ? (
                          cell.isSundayHalfDay ? (
                            <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded block text-center mx-auto w-fit">
                              ½ Half Day
                            </span>
                          ) : cell.isSundayOff ? (
                            <span className="text-[10px] font-bold text-slate-400 block text-center py-0.5">
                              Sunday Off
                            </span>
                          ) : null
                        ) : null
                      )}
                    </div>

                    {/* Bottom Indicator */}
                    <div className="text-[8px] sm:text-[9px] text-slate-400 text-right font-medium">
                      {cell.isToday && cell.isCurrentMonth && <span className="text-rose-600 font-extrabold">Today</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. MANUAL PUNCH ADJUSTMENT MODAL */}
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualPunch} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Override Day Status</label>
                <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {(["Auto", "Full Day", "Half Day", "Absent"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        if (st === "Absent") {
                          setEditPunchModal({
                            ...editPunchModal,
                            manualStatus: "Absent",
                            clockIn: "",
                            clockOut: ""
                          });
                        } else if (st === "Half Day") {
                          setEditPunchModal({
                            ...editPunchModal,
                            manualStatus: "Half Day",
                            clockIn: editPunchModal.clockIn || "08:30",
                            clockOut: editPunchModal.clockOut || "14:00"
                          });
                        } else if (st === "Full Day") {
                          setEditPunchModal({
                            ...editPunchModal,
                            manualStatus: "Full Day",
                            clockIn: editPunchModal.clockIn || "08:30",
                            clockOut: editPunchModal.clockOut || "20:30"
                          });
                        } else {
                          setEditPunchModal({
                            ...editPunchModal,
                            manualStatus: "Auto",
                            clockIn: editPunchModal.clockIn || "08:30",
                            clockOut: editPunchModal.clockOut || "20:30"
                          });
                        }
                      }}
                      className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        editPunchModal.manualStatus === st ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {editPunchModal.manualStatus === "Absent" ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs font-medium text-center space-y-0.5">
                  <p className="font-extrabold text-rose-900">⚠️ કારીગર ગેરહાજર (ABSENT) રહેશે</p>
                  <p className="text-[11px] text-rose-700">આજના દિવસના કામના કલાકો 0 ગણાશે અને ઇન/આઉટ ટાઈમ ક્લીયર થશે.</p>
                </div>
              ) : (
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
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Reason / Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Left early with permission, sick leave..."
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
