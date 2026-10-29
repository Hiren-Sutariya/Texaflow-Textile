"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import {
  Users,
  UserCheck,
  BadgeCheck,
  Calendar,
  Plus,
  Search,
  Wallet,
  X,
  Phone,
  Coins,
  ChevronDown,
  Check,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUpRight,
  RefreshCw,
  ChevronRight,
  User,
  ShoppingBag,
  Key,
  FileText,
  Image as ImageIcon,
  Settings,
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Upload
} from "lucide-react";
import { ExcelImportModal } from "@/components/common/ExcelImportModal";

interface CustomSelectOption {
  value: string;
  label: string;
  shortLabel?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  uppercase?: boolean;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  uppercase = false
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

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-xs select-none ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`custom-select-trigger w-full h-9 px-3 bg-white border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""
        } ${uppercase && selectedOption ? "uppercase" : ""}`}
      >
        <span className={`truncate ${selectedOption ? "font-bold text-slate-900" : "font-medium text-slate-400"}`}>
          {selectedOption ? (selectedOption.shortLabel || selectedOption.label) : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-[18px] min-w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1.5 max-h-56 overflow-y-auto no-scrollbar space-y-1">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-blue-50 text-blue-950 font-extrabold border-blue-500 shadow-2xs"
                    : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                } ${uppercase ? "uppercase" : ""}`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface HelperWorker {
  id: string;
  name: string;
  mobile: string;
}

export interface PortalCredential {
  id: string;
  email: string;
  password?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  size: string;
  date: string;
  type?: "pdf" | "image";
  url?: string;
}

export interface Employee {
  id: string;
  srNo: number;
  code: string;
  name: string;
  role: string;
  employee_type: "Karigar" | "Salaried Staff";
  mobile: string;
  email?: string;
  assigned_machine: string;
  shift: "Day Shift" | "Night Shift";
  monthly_salary: number; // ₹ per month
  advance_balance: number; // ₹ Total advance
  status: "Active" | "Inactive";
  photoUrl?: string;
  helpers?: HelperWorker[];
  bank_details?: {
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    branch_name: string;
    upi_id: string;
  };
  portal_credentials?: PortalCredential[];
  documents?: DocumentItem[];
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  employee_id: string;
  employee_name: string;
  status: "Present" | "Half Day" | "Absent";
  shift: "Day Shift" | "Night Shift";
  pieces_completed: number;
  earned_amount: number;
  advance_taken: number;
}

const initialEmployees: Employee[] = [];

const initialAttendance: AttendanceRecord[] = [];


export default function EmployeesPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [employees, setEmployees] = useState<Employee[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("app_employees_data");
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            if (parsed.length === 0) return [];
            return parsed.map((emp: any, idx: number) => {
              const codeMatch = (emp.code || "").match(/\d+/);
              const fallbackSr = codeMatch ? parseInt(codeMatch[0], 10) : (idx + 1);
              return {
                ...emp,
                srNo: Number(emp.srNo || emp.sr_no) || fallbackSr,
                photoUrl:
                  emp.photoUrl &&
                  emp.photoUrl.includes("photo-1507003211169-0a1dd7228f2d") &&
                  emp.name !== "Ramesh Bhai Patel"
                    ? undefined
                    : (emp.photoUrl && emp.photoUrl.trim() ? emp.photoUrl : undefined)
              };
            });
          }
        }
      } catch {}
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const loadEmployeesFromApi = async () => {
    try {
      const live = await fetchApi<any[]>("/employees");
      if (Array.isArray(live)) {
        if (live.length === 0) {
          setEmployees([]);
          localStorage.setItem("app_employees_data", "[]");
          setIsLoading(false);
          return;
        }
        const mapped: Employee[] = live.map((e, idx) => {
          let parsedHelpers: any[] = [];
          let parsedBank = undefined;
          let parsedPortal: any[] = [];
          let parsedDocs: any[] = [];

          if (e.helpers) {
            try {
              parsedHelpers = typeof e.helpers === "string" ? JSON.parse(e.helpers) : e.helpers;
            } catch {}
          }
          if (e.bank_details) {
            try {
              parsedBank = typeof e.bank_details === "string" ? JSON.parse(e.bank_details) : e.bank_details;
            } catch {}
          }
          if (e.portal_credentials) {
            try {
              parsedPortal = typeof e.portal_credentials === "string" ? JSON.parse(e.portal_credentials) : e.portal_credentials;
            } catch {}
          }
          if (e.documents) {
            try {
              parsedDocs = typeof e.documents === "string" ? JSON.parse(e.documents) : e.documents;
            } catch {}
          }

          const isKarigar = e.employee_type
            ? e.employee_type === "Karigar"
            : ((e.role || "").toLowerCase().includes("karigar") || (e.role || "").toLowerCase().includes("operator"));

          const cleanWorkerPhoto = (url?: string, name?: string) => {
            if (!url || !url.trim() || url === "undefined" || url === "null") return undefined;
            // Never force the default Unsplash photo onto new workers
            if (url.includes("photo-1507003211169-0a1dd7228f2d") && name !== "Ramesh Bhai Patel") {
              return undefined;
            }
            return url;
          };

          const codeMatch = (e.code || "").match(/\d+/);
          const fallbackSr = codeMatch ? parseInt(codeMatch[0], 10) : (idx + 1);
          const resolvedSrNo = Number(e.sr_no || e.srNo) || fallbackSr;

          return {
            id: e.id || `emp-${idx + 1}`,
            srNo: resolvedSrNo,
            code: e.code || (isKarigar ? `KAR-00${idx + 1}` : `STF-00${idx + 1}`),
            name: e.name,
            role: e.role || (isKarigar ? "Karigar" : "Staff"),
            employee_type: (e.employee_type || (isKarigar ? "Karigar" : "Salaried Staff")) as any,
            mobile: e.mobile || e.phone || "-",
            email: e.email || "",
            assigned_machine: e.assigned_machine || "Machine 1",
            shift: (e.shift || "Day Shift") as any,
            monthly_salary: Number(e.monthly_salary) || 0,
            advance_balance: Number(e.advance_balance || e.current_advance) || 0,
            status: (e.status === "Inactive" ? "Inactive" : "Active") as any,
            photoUrl: cleanWorkerPhoto(e.photo_url || e.photoUrl, e.name),
            helpers: Array.isArray(parsedHelpers) ? parsedHelpers : [],
            bank_details: parsedBank,
            portal_credentials: Array.isArray(parsedPortal) ? parsedPortal : [],
            documents: Array.isArray(parsedDocs) ? parsedDocs : [],
            created_at: e.created_at
          };
        });
        setEmployees(mapped);
        localStorage.setItem("app_employees_data", JSON.stringify(mapped));
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Backend employees load fallback", err);
    }

    try {
      const saved = localStorage.getItem("app_employees_data");
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            setEmployees([]);
            setIsLoading(false);
            return;
          }
          const cleaned = parsed.map((emp: any, idx: number) => {
            const codeMatch = (emp.code || "").match(/\d+/);
            const fallbackSr = codeMatch ? parseInt(codeMatch[0], 10) : (idx + 1);
            return {
              ...emp,
              srNo: Number(emp.srNo || emp.sr_no) || fallbackSr,
              photoUrl:
                emp.photoUrl &&
                emp.photoUrl.includes("photo-1507003211169-0a1dd7228f2d") &&
                emp.name !== "Ramesh Bhai Patel"
                  ? undefined
                  : (emp.photoUrl && emp.photoUrl.trim() ? emp.photoUrl : undefined)
            };
          });
          setEmployees(cleaned);
          localStorage.setItem("app_employees_data", JSON.stringify(cleaned));
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setHasMounted(true);
    loadEmployeesFromApi();
  }, []);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Karigar" | "Salaried Staff">("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Full Page Add / Edit Form State matching Screenshots 1-4
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);

  const [activeFormTab, setActiveFormTab] = useState<"Basic Info" | "Bank Details" | "Portal Login" | "Documents">("Basic Info");

  // Basic Info Form States
  const [formName, setFormName] = useState("");
  const [formKhataNo, setFormKhataNo] = useState("");
  const [formMachineNo, setFormMachineNo] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCategory, setFormCategory] = useState<"Karigar" | "Salaried Staff">("Karigar");
  const [formShift, setFormShift] = useState<"Day Shift" | "Night Shift">("Day Shift");
  const [formSalary, setFormSalary] = useState<string>("");
  const [formAdvance, setFormAdvance] = useState<string>("");
  const [formPhotoUrl, setFormPhotoUrl] = useState("");

  // Machine Management States matching Screenshots 1 & 2
  const [configuredMachines, setConfiguredMachines] = useState<string[]>([
    "Machine 1",
    "Machine 2",
    "Machine 3",
    "Machine 4",
    "Machine 5"
  ]);
  const [isMachineDropdownOpen, setIsMachineDropdownOpen] = useState(false);
  const [isManageMachinesModalOpen, setIsManageMachinesModalOpen] = useState(false);
  const [manageMachineInput, setManageMachineInput] = useState("");
  const [isShowAutoRange, setIsShowAutoRange] = useState(false);
  const [autoRangeStart, setAutoRangeStart] = useState("1");
  const [autoRangeEnd, setAutoRangeEnd] = useState("50");
  const [autoRangePrefix, setAutoRangePrefix] = useState("Machine ");
  const [machineSuccessMsg, setMachineSuccessMsg] = useState<string | null>(null);

  // Helpers List
  const [helpersList, setHelpersList] = useState<HelperWorker[]>([]);
  const [isAddHelperOpen, setIsAddHelperOpen] = useState(false);
  const [helperNameInput, setHelperNameInput] = useState("");
  const [helperMobileInput, setHelperMobileInput] = useState("");

  // Bank Details Form States
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [reAccountNumber, setReAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [showAccNo, setShowAccNo] = useState(false);

  // Portal Login Credentials Form States
  const [portalCredentials, setPortalCredentials] = useState<PortalCredential[]>([]);
  const [portalEmailInput, setPortalEmailInput] = useState("");
  const [portalPasswordInput, setPortalPasswordInput] = useState("");
  const [showPortalPassword, setShowPortalPassword] = useState(false);

  // Documents Form States
  const [documentsList, setDocumentsList] = useState<DocumentItem[]>([]);

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newDocs: DocumentItem[] = Array.from(e.target.files).map((file, i) => {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      const fileUrl = URL.createObjectURL(file);
      return {
        id: `d-${Date.now()}-${i}`,
        name: file.name,
        size: sizeStr,
        date: new Date().toLocaleDateString(),
        type: isPdf ? "pdf" : "image",
        url: fileUrl
      };
    });
    setDocumentsList((prev) => [...prev, ...newDocs]);
    e.target.value = "";
  };

  const handleViewDocument = (d: DocumentItem) => {
    let targetUrl = d.url;
    if (!targetUrl) {
      if (d.type === "image") {
        targetUrl = "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=1200&auto=format&fit=crop&q=80";
      } else {
        targetUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
      }
    }
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  // Enter Key Navigation Handler
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const container = document.getElementById("worker-registration-form-container");
      if (!container) return;
      const inputs = Array.from(
        container.querySelectorAll<HTMLInputElement>(
          'input:not([type="hidden"]):not([disabled]):not([type="file"])'
        )
      );
      const currentIndex = inputs.indexOf(e.currentTarget);
      if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
      } else if (currentIndex === inputs.length - 1) {
        handleSaveFullWorker();
      }
    }
  };

  // Modals for Attendance & Advance
  const [isMarkAttendanceModalOpen, setIsMarkAttendanceModalOpen] = useState(false);
  const [attEmployeeId, setAttEmployeeId] = useState("");
  const [attStatus, setAttStatus] = useState<"Present" | "Half Day" | "Absent">("Present");
  const [attShift, setAttShift] = useState<"Day Shift" | "Night Shift">("Day Shift");
  const [attPieces, setAttPieces] = useState<number>(120);
  const [attAdvance, setAttAdvance] = useState<number>(0);

  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceEmpId, setAdvanceEmpId] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState<number>(500);

  // Action Menu State (Three Dots Filter & Options matching screenshots)
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [activeHoverMenu, setActiveHoverMenu] = useState<"sort" | "refresh" | null>("sort");
  const [sortBy, setSortBy] = useState<"name" | "created" | "modified">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const machineDropdownRef = useRef<HTMLDivElement>(null);

  // Worker Row Click Detail Preview State
  const [previewWorker, setPreviewWorker] = useState<Employee | null>(null);
  const [activeZoomedImage, setActiveZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
      if (machineDropdownRef.current && !machineDropdownRef.current.contains(event.target as Node)) {
        setIsMachineDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRefreshList = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setIsActionMenuOpen(false);
    }, 600);
  };

  const openNewWorkerForm = () => {
    setEditingWorkerId(null);
    setFormName("");
    setFormKhataNo("");
    setFormMachineNo("");
    setIsMachineDropdownOpen(false);
    setFormMobile("");
    setFormEmail("");
    setFormCategory("Karigar");
    setFormShift("Day Shift");
    setFormSalary("");
    setFormAdvance("");
    setFormPhotoUrl("");
    setHelpersList([]);
    setBankName("");
    setAccountNumber("");
    setReAccountNumber("");
    setIfscCode("");
    setBranchName("");
    setUpiId("");
    setPortalCredentials([]);
    setDocumentsList([]);
    setActiveFormTab("Basic Info");
    setIsFormOpen(true);
  };

  const openEditWorkerForm = (emp: Employee) => {
    setEditingWorkerId(emp.id);
    setFormName(emp.name);
    setFormKhataNo(emp.code);
    setFormMachineNo(emp.assigned_machine);
    setIsMachineDropdownOpen(false);
    setFormMobile(emp.mobile === "-" ? "" : emp.mobile);
    setFormEmail(emp.email || "");
    setFormCategory(emp.employee_type);
    setFormShift(emp.shift);
    setFormSalary(emp.monthly_salary ? String(emp.monthly_salary) : "");
    setFormAdvance(emp.advance_balance ? String(emp.advance_balance) : "");
    setFormPhotoUrl(emp.photoUrl || "");
    setHelpersList(emp.helpers || []);
    setBankName(emp.bank_details?.bank_name || "");
    setAccountNumber(emp.bank_details?.account_number || "");
    setReAccountNumber(emp.bank_details?.account_number || "");
    setIfscCode(emp.bank_details?.ifsc_code || "");
    setBranchName(emp.bank_details?.branch_name || "");
    setUpiId(emp.bank_details?.upi_id || "");
    setPortalCredentials(emp.portal_credentials || []);
    setDocumentsList(emp.documents || []);
    setActiveFormTab("Basic Info");
    setIsFormOpen(true);
  };

  const handleDeleteWorker = async (id: string) => {
    if (confirm("Are you sure you want to delete this Worker record?")) {
      try {
        await fetchApi(`/employees/${id}`, { method: "DELETE" });
      } catch (err) {
        console.warn("Backend employee delete fallback", err);
      }
      const updated = employees.filter((e) => e.id !== id);
      setEmployees(updated);
      try {
        localStorage.setItem("app_employees_data", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleWorkerStatus = async (emp: Employee) => {
    const nextStatus: "Active" | "Inactive" = emp.status === "Active" ? "Inactive" : "Active";
    setEmployees((prev) => {
      const next = prev.map((x) => (x.id === emp.id ? { ...x, status: nextStatus } : x));
      try { localStorage.setItem("app_employees_data", JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      await fetchApi(`/employees/${emp.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (err) {
      console.warn("Backend status update error", err);
    }
  };

  const handleSaveFullWorker = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSavingRef.current) return;

    if (!formName.trim()) {
      alert("Please enter Worker Name.");
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {

    const isKarigar = formCategory === "Karigar";
    const khata = formKhataNo.trim() || (isKarigar ? `KAR-00${employees.length + 1}` : `STF-00${employees.length + 1}`);

    const compiledBank = bankName.trim() || accountNumber.trim() ? {
      bank_name: bankName.trim(),
      account_number: accountNumber.trim(),
      ifsc_code: ifscCode.trim(),
      branch_name: branchName.trim(),
      upi_id: upiId.trim()
    } : undefined;

    const cleanFormPhoto = formPhotoUrl && formPhotoUrl.trim() ? formPhotoUrl.trim() : "";

    if (editingWorkerId) {
      try {
        await fetchApi(`/employees/${editingWorkerId}`, {
          method: "PUT",
          body: JSON.stringify({
            code: khata,
            name: formName.trim(),
            role: isKarigar ? "Karigar" : "Staff",
            employee_type: formCategory,
            mobile: formMobile.trim() || "-",
            email: formEmail.trim(),
            assigned_machine: formMachineNo.trim() || "Machine 1",
            shift: formShift,
            monthly_salary: Number(formSalary) || 0,
            advance_balance: Number(formAdvance) || 0,
            status: "Active",
            photo_url: cleanFormPhoto,
            helpers: JSON.stringify(helpersList),
            bank_details: JSON.stringify(compiledBank),
            portal_credentials: JSON.stringify(portalCredentials),
            documents: JSON.stringify(documentsList)
          })
        });
      } catch (err) {
        console.warn("Backend employee update fallback", err);
      }

      setEmployees((prev) => {
        const next = prev.map((emp) =>
          emp.id === editingWorkerId
            ? {
                ...emp,
                name: formName.trim(),
                code: khata,
                assigned_machine: formMachineNo.trim() || "Machine 1",
                mobile: formMobile.trim() || "-",
                email: formEmail.trim(),
                employee_type: formCategory,
                shift: formShift,
                monthly_salary: Number(formSalary) || 0,
                advance_balance: Number(formAdvance) || 0,
                photoUrl: cleanFormPhoto ? cleanFormPhoto : undefined,
                helpers: helpersList,
                bank_details: compiledBank,
                portal_credentials: portalCredentials,
                documents: documentsList
              }
            : emp
        );
        try { localStorage.setItem("app_employees_data", JSON.stringify(next)); } catch {}
        return next;
      });
    } else {
      let assignedId = `emp-${Date.now()}`;
      try {
        const backendRes = await fetchApi<any>("/employees", {
          method: "POST",
          body: JSON.stringify({
            code: khata,
            name: formName.trim(),
            role: isKarigar ? "Karigar" : "Staff",
            employee_type: formCategory,
            mobile: formMobile.trim() || "-",
            email: formEmail.trim(),
            assigned_machine: formMachineNo.trim() || "Machine 1",
            shift: formShift,
            monthly_salary: Number(formSalary) || 0,
            advance_balance: Number(formAdvance) || 0,
            status: "Active",
            photo_url: cleanFormPhoto,
            helpers: JSON.stringify(helpersList),
            bank_details: JSON.stringify(compiledBank),
            portal_credentials: JSON.stringify(portalCredentials),
            documents: JSON.stringify(documentsList)
          })
        });
        if (backendRes?.id) {
          assignedId = backendRes.id;
        }
      } catch (err) {
        console.warn("Backend employee create fallback", err);
      }


      const nextSrNo = employees.length > 0 ? Math.max(...employees.map((e) => e.srNo || 0)) + 1 : 1;

      const newEmp: Employee = {
        id: assignedId,
        srNo: nextSrNo,
        code: khata,
        name: formName.trim(),
        role: isKarigar ? "Karigar" : "Staff",
        employee_type: formCategory,
        mobile: formMobile.trim() || "-",
        email: formEmail.trim(),
        assigned_machine: formMachineNo.trim() || "Machine 1",
        shift: formShift,
        monthly_salary: Number(formSalary) || 0,
        advance_balance: Number(formAdvance) || 0,
        status: "Active",
        photoUrl: cleanFormPhoto ? cleanFormPhoto : undefined,
        helpers: helpersList,
        bank_details: compiledBank,
        portal_credentials: portalCredentials,
        documents: documentsList,
        created_at: new Date().toISOString()
      };

      setEmployees((prev) => {
        const next = [...prev, newEmp];
        try { localStorage.setItem("app_employees_data", JSON.stringify(next)); } catch {}
        return next;
      });
    }

    setIsMachineDropdownOpen(false);
    setIsFormOpen(false);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };


  const filteredEmployees = useMemo(() => {
    const result = employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.code.toLowerCase().includes(search.toLowerCase()) ||
        emp.assigned_machine.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "All" || emp.employee_type === typeFilter;
      const matchesStatus = statusFilter === "All" || emp.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    return result.sort((a, b) => {
      let valA = "";
      let valB = "";
      if (sortBy === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === "created") {
        const numA = Number(a.srNo) || 0;
        const numB = Number(b.srNo) || 0;
        if (numA !== numB) {
          return sortOrder === "asc" ? numA - numB : numB - numA;
        }
        valA = a.created_at || a.id;
        valB = b.created_at || b.id;
      } else {
        valA = a.code.toLowerCase();
        valB = b.code.toLowerCase();
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [employees, search, typeFilter, statusFilter, sortBy, sortOrder]);

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === attEmployeeId);
    if (!emp) return;

    const pcs = attStatus === "Absent" ? 0 : Number(attPieces) || 0;
    const earned = attStatus === "Absent" ? 0 : Math.round((emp.monthly_salary / 30) * (attStatus === "Half Day" ? 0.5 : 1));
    const adv = Number(attAdvance) || 0;

    const newLog: AttendanceRecord = {
      id: `att-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      employee_id: emp.id,
      employee_name: emp.name,
      status: attStatus,
      shift: attShift,
      pieces_completed: pcs,
      earned_amount: earned,
      advance_taken: adv
    };

    if (adv > 0) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, advance_balance: e.advance_balance + adv } : e))
      );
    }

    setAttendanceLogs([newLog, ...attendanceLogs]);
    setIsMarkAttendanceModalOpen(false);
  };

  const handleSaveAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(advanceAmount) || 0;
    if (amount <= 0 || !advanceEmpId) return;

    setEmployees((prev) =>
      prev.map((e) => (e.id === advanceEmpId ? { ...e, advance_balance: e.advance_balance + amount } : e))
    );

    setIsAdvanceModalOpen(false);
  };

  // FULL PAGE FORM VIEW MATCHING VENDORS PAGE AND SCREENSHOTS 1-4
  if (isFormOpen) {
    return (
      <div className="space-y-4 text-xs font-sans pb-16">
        {/* TOP TOOLBAR HEADER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">
              {editingWorkerId ? "EDIT WORKER & STAFF DETAILS" : "NEW WORKER & STAFF REGISTRATION"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Worker List</span>
          </button>
        </div>

        {/* COMBINED MAIN FORM CARD WITH SUB-TABS (Matching Vendor Form pattern) */}
        <div id="worker-registration-form-container" className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4">
          {/* SUB TABS NAVIGATION BAR */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-2 text-xs font-bold overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveFormTab("Basic Info")}
              className={`py-2 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeFormTab === "Basic Info"
                  ? "border-blue-600 text-blue-800 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Basic Info</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFormTab("Bank Details")}
              className={`py-2 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeFormTab === "Bank Details"
                  ? "border-blue-600 text-blue-800 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Bank Details</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFormTab("Portal Login")}
              className={`py-2 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeFormTab === "Portal Login"
                  ? "border-blue-600 text-blue-800 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Portal Login</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFormTab("Documents")}
              className={`py-2 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeFormTab === "Documents"
                  ? "border-blue-600 text-blue-800 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </button>
          </div>

          {/* TAB CONTENTS */}
          {/* TAB 1: BASIC INFO */}
          {activeFormTab === "Basic Info" && (
            <div className="space-y-6 pt-1">
              {/* Photo & Core Fields Grid */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Worker Photo (Optional)</label>
                  <div className="flex items-start gap-3">
                    <label
                      htmlFor="worker-photo-file-input"
                      className="w-32 h-28 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/70 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-blue-500 transition-colors relative overflow-hidden group shrink-0"
                    >
                      {formPhotoUrl ? (
                        <>
                          <img src={formPhotoUrl} alt="Worker Photo" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1">
                            <Edit3 className="w-4 h-4" />
                            <span>Change</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-700 mt-1">Upload Photo</span>
                          <span className="text-[9px] text-blue-600 font-semibold">JPG / PNG</span>
                        </>
                      )}
                    </label>

                    {formPhotoUrl ? (
                      <div className="pt-2 space-y-1.5">
                        <label
                          htmlFor="worker-photo-file-input"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-blue-200/80"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Change Image</span>
                        </label>
                        <div>
                          <button
                            type="button"
                            onClick={() => setFormPhotoUrl("")}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer px-1 py-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove Photo</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 text-[11px] text-slate-400 font-medium leading-relaxed max-w-[200px]">
                        Select a profile photo from device. Photo will be resized automatically.
                      </div>
                    )}
                  </div>

                  <input
                    id="worker-photo-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const result = event.target?.result as string;
                          if (!result) return;
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement("canvas");
                            const maxDim = 320;
                            let width = img.width;
                            let height = img.height;
                            if (width > height) {
                              if (width > maxDim) {
                                height = Math.round((height * maxDim) / width);
                                width = maxDim;
                              }
                            } else {
                              if (height > maxDim) {
                                width = Math.round((width * maxDim) / height);
                                height = maxDim;
                              }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext("2d");
                            ctx?.drawImage(img, 0, 0, width, height);
                            const compressed = canvas.toDataURL("image/jpeg", 0.85);
                            setFormPhotoUrl(compressed);
                          };
                          img.src = result;
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Worker Name *</label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Account No. (Khata No.)</label>
                    <input
                      type="text"
                      placeholder="e.g. K-001"
                      value={formKhataNo}
                      onChange={(e) => setFormKhataNo(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Machine Number</label>
                    <div className="flex items-center gap-1.5 relative">
                      <div ref={machineDropdownRef} className="relative flex-1">
                        <input
                          type="text"
                          placeholder="MACHINE 1"
                          value={formMachineNo}
                          onChange={(e) => {
                            setFormMachineNo(e.target.value);
                            setIsMachineDropdownOpen(true);
                          }}
                          onFocus={() => setIsMachineDropdownOpen(true)}
                          onKeyDown={handleInputKeyDown}
                          className="w-full h-9 pl-3 pr-14 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 uppercase cursor-pointer"
                        />
                        <div className="absolute right-2.5 top-2 flex items-center gap-1">
                          {formMachineNo && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormMachineNo("");
                              }}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                              title="Clear Machine Number"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsMachineDropdownOpen((prev) => !prev);
                            }}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                            title="Toggle machine dropdown"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMachineDropdownOpen ? "rotate-180 text-blue-600" : ""}`} />
                          </button>
                        </div>

                        {/* DROPDOWN MENU MATCHING SCREENSHOT 2 */}
                        {isMachineDropdownOpen && (
                          <div className="absolute left-0 right-0 top-11 z-50 bg-white border-2 border-blue-500 rounded-2xl shadow-xl p-2 space-y-2 animate-in fade-in duration-100">
                            <div className="max-h-48 overflow-y-auto space-y-1 no-scrollbar">
                              {configuredMachines.length === 0 ? (
                                <div className="p-3 text-center text-slate-400 text-xs font-medium">
                                  No machines configured yet
                                </div>
                              ) : (
                                configuredMachines.map((m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                      setFormMachineNo(m);
                                      setIsMachineDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                                      formMachineNo === m
                                        ? "bg-blue-600 text-white font-extrabold"
                                        : "hover:bg-slate-100 text-slate-800"
                                    }`}
                                  >
                                    <span>{m}</span>
                                    {formMachineNo === m && <Check className="w-4 h-4" />}
                                  </button>
                                ))
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setIsMachineDropdownOpen(false);
                                setIsManageMachinesModalOpen(true);
                              }}
                              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
                            >
                              <Settings className="w-3.5 h-3.5 text-slate-500" />
                              <span>Manage</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsManageMachinesModalOpen(true)}
                        className="p-2 border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer text-slate-600 shrink-0"
                        title="Manage Factory Machines"
                      >
                        <Settings className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={formMobile}
                      onChange={(e) => setFormMobile(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="worker@example.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Category / Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormCategory("Karigar")}
                        className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center border transition-all cursor-pointer ${
                          formCategory === "Karigar"
                            ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-extrabold"
                            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Karigar
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormCategory("Salaried Staff")}
                        className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center border transition-all cursor-pointer ${
                          formCategory === "Salaried Staff"
                            ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-extrabold"
                            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Salaried Staff
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Working Shift</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormShift("Day Shift")}
                        className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center border transition-all cursor-pointer ${
                          formShift === "Day Shift"
                            ? "bg-amber-50 border-amber-500 text-amber-900 font-extrabold shadow-2xs"
                            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        ☀️ Day Shift
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormShift("Night Shift")}
                        className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center border transition-all cursor-pointer ${
                          formShift === "Night Shift"
                            ? "bg-indigo-50 border-indigo-500 text-indigo-900 font-extrabold shadow-2xs"
                            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        🌙 Night Shift
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Monthly Salary / Wage (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        placeholder="e.g. 25000"
                        value={formSalary}
                        onChange={(e) => setFormSalary(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        className="w-full h-9 pl-7 pr-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Opening Advance / Upad (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={formAdvance}
                        onChange={(e) => setFormAdvance(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        className="w-full h-9 pl-7 pr-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* HELPERS / CHILD WORKERS SUB SECTION (Image 1) */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Helpers / Child Workers</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Add helper workers under this Main Worker. Khata No. and Machine No. are automatically linked.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddHelperOpen(!isAddHelperOpen)}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold border border-blue-200/80 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Helper</span>
                  </button>
                </div>

                {isAddHelperOpen && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2 animate-in fade-in duration-100">
                    <input
                      type="text"
                      placeholder="Helper Name"
                      value={helperNameInput}
                      onChange={(e) => setHelperNameInput(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      className="w-full sm:w-1/2 h-8 px-3 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Mobile No"
                      value={helperMobileInput}
                      onChange={(e) => setHelperMobileInput(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      className="w-full sm:w-1/2 h-8 px-3 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (helperNameInput.trim()) {
                          setHelpersList([...helpersList, { id: `h-${Date.now()}`, name: helperNameInput.trim(), mobile: helperMobileInput.trim() }]);
                          setHelperNameInput("");
                          setHelperMobileInput("");
                          setIsAddHelperOpen(false);
                        }
                      }}
                      className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                )}

                {helpersList.length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 font-medium text-xs">
                    No child / helper workers added to this Main Worker.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {helpersList.map((h) => (
                      <div key={h.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{h.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{h.mobile || "No Mobile"}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHelpersList(helpersList.filter((x) => x.id !== h.id))}
                          className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BANK DETAILS */}
          {activeFormTab === "Bank Details" && (
            <div className="space-y-5 pt-1">
              <div className="bg-amber-50/80 border border-amber-200 text-amber-900 rounded-xl p-3 flex items-center gap-2.5 text-xs font-semibold">
                <Wallet className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bank details are optional. Fill only if payment via bank transfer is needed.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. SBI, HDFC"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Number</label>
                  <div className="relative">
                    <input
                      type={showAccNo ? "text" : "password"}
                      placeholder="Enter account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      className="w-full h-9 pl-3 pr-8 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccNo(!showAccNo)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showAccNo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Re-enter Account No.</label>
                  <input
                    type="password"
                    placeholder="Confirm account number"
                    value={reAccountNumber}
                    onChange={(e) => setReAccountNumber(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    onKeyDown={handleInputKeyDown}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Surat Main Branch"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210@ybl"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PORTAL LOGIN */}
          {activeFormTab === "Portal Login" && (
            <div className="space-y-5 pt-1">
              <div className="bg-blue-50/80 border border-blue-200 text-blue-900 rounded-xl p-3 flex items-center gap-2.5 text-xs font-semibold">
                <Key className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Add multiple portal login credentials for this worker. Each credential is a separate Email + Password pair.</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-xs">Add New Credential</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    placeholder="Portal Email / Username"
                    value={portalEmailInput}
                    onChange={(e) => setPortalEmailInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs"
                  />
                  <div className="relative">
                    <input
                      type={showPortalPassword ? "text" : "password"}
                      placeholder="Password"
                      value={portalPasswordInput}
                      onChange={(e) => setPortalPasswordInput(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      className="w-full h-9 pl-3 pr-8 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPortalPassword(!showPortalPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPortalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (portalEmailInput.trim()) {
                      setPortalCredentials([...portalCredentials, { id: `pc-${Date.now()}`, email: portalEmailInput.trim(), password: portalPasswordInput }]);
                      setPortalEmailInput("");
                      setPortalPasswordInput("");
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Credential</span>
                </button>
              </div>

              {portalCredentials.length > 0 && (
                <div className="space-y-2">
                  {portalCredentials.map((c) => (
                    <div key={c.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="font-bold text-slate-900 font-mono text-xs">{c.email}</div>
                      <button
                        type="button"
                        onClick={() => setPortalCredentials(portalCredentials.filter((x) => x.id !== c.id))}
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOCUMENTS */}
          {activeFormTab === "Documents" && (
            <div className="space-y-5 pt-1">
              <div>
                <label
                  htmlFor="worker-document-upload-input"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-2xs inline-flex transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Documents</span>
                </label>
                <input
                  id="worker-document-upload-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,image/*,application/pdf"
                  multiple
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
              </div>

              {documentsList.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 font-medium text-xs flex flex-col items-center justify-center gap-2">
                  <FileText className="w-8 h-8 text-slate-300" />
                  <span>No documents uploaded yet.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {documentsList.map((d) => (
                    <div key={d.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${d.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                          {d.type === 'pdf' ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            <span>{d.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">{d.size} • Uploaded {d.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewDocument(d)}
                          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold rounded-full text-xs tracking-wider uppercase border border-slate-200 hover:border-slate-300 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs shrink-0"
                          title="View / Download Document"
                        >
                          <span>VIEW/DOWNLOAD</span>
                          <ArrowUpRight className="w-4 h-4 text-slate-500 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocumentsList(documentsList.filter((x) => x.id !== d.id))}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* UNIFIED FIXED BOTTOM ACTION BAR */}
        <BottomActionBar
          leftContent={
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
          }
          rightContent={
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveFullWorker()}
              className={`px-6 py-2.5 font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 ${
                isSaving
                  ? "bg-blue-400 text-white cursor-not-allowed pointer-events-none opacity-80"
                  : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Worker...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Worker</span>
                </>
              )}
            </button>
          }
        />

        {/* MANAGE FACTORY MACHINES MODAL MATCHING SCREENSHOT 1 */}
        {isManageMachinesModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              {/* MODAL HEADER */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Manage Factory Machines</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Add and configure machines in your setup</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManageMachinesModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="p-5 space-y-4">
                {/* SUCCESS NOTIFICATION TOAST */}
                {machineSuccessMsg && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-950 font-extrabold text-xs rounded-xl flex items-center justify-between animate-in fade-in duration-100">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>{machineSuccessMsg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMachineSuccessMsg(null)}
                      className="text-blue-700 hover:text-blue-900 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Add Input Row */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter machine number(s) (comma separated)"
                    value={manageMachineInput}
                    onChange={(e) => setManageMachineInput(e.target.value)}
                    className="flex-1 h-10 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (manageMachineInput.trim()) {
                        const added = manageMachineInput
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s.length > 0 && !configuredMachines.includes(s));
                        if (added.length > 0) {
                          setConfiguredMachines([...configuredMachines, ...added]);
                          setMachineSuccessMsg(`✓ Added ${added.length} Machine(s) successfully!`);
                          setTimeout(() => setMachineSuccessMsg(null), 3000);
                        }
                        setManageMachineInput("");
                      }
                    }}
                    className="px-4 h-10 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>

                {/* Auto Range Generator Toggle */}
                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsShowAutoRange(!isShowAutoRange)}
                    className="font-bold text-blue-700 text-xs flex items-center gap-1.5 cursor-pointer hover:underline"
                  >
                    <span>Show Auto-Range Generator (e.g. 1 to 50)</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isShowAutoRange ? "rotate-180" : ""}`} />
                  </button>

                  {isShowAutoRange && (
                    <div className="pt-2 border-t border-slate-200 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Prefix</label>
                          <input
                            type="text"
                            value={autoRangePrefix}
                            onChange={(e) => setAutoRangePrefix(e.target.value)}
                            className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">From</label>
                          <input
                            type="number"
                            value={autoRangeStart}
                            onChange={(e) => setAutoRangeStart(e.target.value)}
                            className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">To</label>
                          <input
                            type="number"
                            value={autoRangeEnd}
                            onChange={(e) => setAutoRangeEnd(e.target.value)}
                            className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const start = parseInt(autoRangeStart) || 1;
                          const end = parseInt(autoRangeEnd) || 1;
                          const generated: string[] = [];
                          for (let i = start; i <= end; i++) {
                            const name = `${autoRangePrefix}${i}`;
                            if (!configuredMachines.includes(name)) {
                              generated.push(name);
                            }
                          }
                          if (generated.length > 0) {
                            setConfiguredMachines([...configuredMachines, ...generated]);
                            setMachineSuccessMsg(`✓ Generated ${generated.length} Machine(s) successfully!`);
                            setTimeout(() => setMachineSuccessMsg(null), 3000);
                          }
                        }}
                        className="w-full py-2 bg-blue-600 text-white font-extrabold rounded-xl text-xs cursor-pointer hover:bg-blue-700 transition-colors"
                      >
                        Generate Machines ({autoRangePrefix}{autoRangeStart} to {autoRangePrefix}{autoRangeEnd})
                      </button>
                    </div>
                  )}
                </div>

                {/* Machine List & Clear All Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                      Configured Machines ({configuredMachines.length})
                    </span>
                    {configuredMachines.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Are you sure you want to remove ALL configured machines?")) {
                            setConfiguredMachines([]);
                            setMachineSuccessMsg("✓ All machines cleared!");
                            setTimeout(() => setMachineSuccessMsg(null), 3000);
                          }
                        }}
                        className="text-xs font-extrabold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 p-1 border border-slate-100 rounded-2xl">
                    {configuredMachines.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 font-medium text-xs">
                        No machines configured yet
                      </div>
                    ) : (
                      configuredMachines.map((m) => (
                        <div key={m} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{m}</span>
                          <button
                            type="button"
                            onClick={() => setConfiguredMachines(configuredMachines.filter((x) => x !== m))}
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT VIEW: WORKER DIRECTORY TABLE LIST PAGE
  if (!hasMounted) return null;

  return (
    <div className="space-y-4 pb-12">
      {/* SEARCH & ACTIONS TOOLBAR CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Left Side: Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Karigar Name, Code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium shadow-2xs hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
        </div>

        {/* Right Side: Status Filter Dropdown, Add Worker & Action Menu */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Custom Select Status Filter */}
          <div className="w-full sm:w-40">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: "All", label: "All Status" },
                { value: "Active", label: "Active Workers" },
                { value: "Inactive", label: "Inactive Workers" }
              ]}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
              title="કારીગરોનું એક્સેલ ઇમ્પોર્ટ"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import Excel</span>
            </button>
            <button
              type="button"
              onClick={openNewWorkerForm}
              className="flex-1 sm:flex-none h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Worker</span>
            </button>

            {/* Action Menu (Three Dots Button matching screenshots) */}
            <div ref={actionMenuRef} className="relative inline-block shrink-0">
              <button
                type="button"
                onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                  isActionMenuOpen
                    ? "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20"
                    : "bg-white hover:bg-slate-100 border-slate-300 text-slate-600"
                }`}
                title="More Actions & Filters"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

            {isActionMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl p-2 sm:p-2.5 w-[260px] sm:w-[340px] max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-150 font-sans"
              >
                {/* Mobile Single-Column Touch Menu (< sm) */}
                <div className="block sm:hidden space-y-2 text-xs">
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Sort Workers
                    </div>
                    <div className="space-y-1 mt-0.5">
                      {[
                        { id: "name", label: "Name" },
                        { id: "created", label: "Created Time" },
                        { id: "modified", label: "Last Modified" }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (sortBy === item.id) {
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy(item.id as any);
                              setSortOrder("asc");
                            }
                            setIsActionMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                            sortBy === item.id
                              ? "bg-blue-600 text-white font-bold shadow-2xs"
                              : "text-slate-700 hover:bg-slate-100 font-medium"
                          }`}
                        >
                          <span>{item.label}</span>
                          {sortBy === item.id && <ArrowUpDown className="w-3.5 h-3.5 opacity-90 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-1.5 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleRefreshList();
                        setIsActionMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 bg-blue-50 text-blue-950 font-bold rounded-xl border border-blue-200/80 shadow-2xs hover:bg-blue-100 text-xs flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isRefreshing ? "animate-spin" : ""}`} />
                        <span>Refresh List</span>
                      </div>
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTypeFilter("All");
                        setStatusFilter("All");
                        setSearch("");
                        setIsActionMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </div>

                {/* Desktop Split-Panel Menu (sm and above) */}
                <div
                  className="hidden sm:flex items-stretch divide-x divide-slate-100"
                  onMouseLeave={() => setActiveHoverMenu(null)}
                >
                  {/* Left Sub-Panel */}
                  <div className="w-1/2 pr-2.5 flex flex-col justify-start gap-1">
                    {(!activeHoverMenu || activeHoverMenu === "sort") && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (sortBy === "name") {
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy("name");
                            }
                          }}
                          className={`w-full text-left px-3.5 py-2 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                            sortBy === "name"
                              ? "bg-blue-600 text-white font-bold shadow-md"
                              : "text-slate-700 hover:bg-slate-100 font-medium"
                          }`}
                        >
                          <span>Name</span>
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-90 ml-1 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (sortBy === "created") {
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy("created");
                              setSortOrder("asc");
                            }
                          }}
                          className={`w-full text-left px-3.5 py-2 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                            sortBy === "created"
                              ? "bg-blue-600 text-white font-bold shadow-md"
                              : "text-slate-700 hover:bg-slate-100 font-medium"
                          }`}
                        >
                          <span>Created Time</span>
                          {sortBy === "created" && <ArrowUpDown className="w-3.5 h-3.5 opacity-90 ml-1 shrink-0" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (sortBy === "modified") {
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy("modified");
                              setSortOrder("asc");
                            }
                          }}
                          className={`w-full text-left px-3.5 py-2 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                            sortBy === "modified"
                              ? "bg-blue-600 text-white font-bold shadow-md"
                              : "text-slate-700 hover:bg-slate-100 font-medium"
                          }`}
                        >
                          <span>Last Modified</span>
                          {sortBy === "modified" && <ArrowUpDown className="w-3.5 h-3.5 opacity-90 ml-1 shrink-0" />}
                        </button>
                      </>
                    )}

                    {activeHoverMenu === "refresh" && (
                      <>
                        <button
                          type="button"
                          onClick={handleRefreshList}
                          className="w-full text-left px-3.5 py-2 bg-blue-50 text-blue-950 font-bold rounded-2xl border border-blue-200/80 shadow-2xs hover:bg-blue-100 text-xs transition-all cursor-pointer"
                        >
                          <span>Refresh List</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTypeFilter("All");
                            setStatusFilter("All");
                            setSearch("");
                            setIsActionMenuOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-100 font-medium rounded-2xl text-xs transition-all cursor-pointer"
                        >
                          <span>Reset All Filters</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Right Panel: Main Actions List */}
                  <div className="w-1/2 pl-2.5 flex flex-col gap-1 text-xs text-slate-700 font-semibold">
                    <div
                      onMouseEnter={() => setActiveHoverMenu("sort")}
                      onClick={() => setActiveHoverMenu(activeHoverMenu === "sort" ? null : "sort")}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-bold transition-all cursor-pointer ${
                        activeHoverMenu === "sort" || !activeHoverMenu
                          ? "bg-blue-50 text-blue-950 font-extrabold border border-blue-200/80 shadow-2xs"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-3.5 h-3.5 text-blue-700" />
                        <span>Sort by</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-700" />
                    </div>

                    <button
                      type="button"
                      onMouseEnter={() => setActiveHoverMenu("refresh")}
                      onClick={handleRefreshList}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-bold transition-all cursor-pointer ${
                        activeHoverMenu === "refresh"
                          ? "bg-blue-50 text-blue-950 font-extrabold border border-blue-200/80 shadow-2xs"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
                        <span>Refresh List</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* 1. MOBILE RESPONSIVE CARD VIEW (NO HORIZONTAL SCROLLING REQUIRED) */}
      <div className="block md:hidden space-y-3">
        {filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-8 text-center text-slate-400 font-medium text-xs">
            No worker records found matching your filters. Click &quot;+ Add Worker&quot; to add a record.
          </div>
        ) : (
          filteredEmployees.map((emp, index) => (
            <div
              key={emp.id}
              onClick={() => setPreviewWorker(emp)}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2.5 hover:border-blue-300 transition-all cursor-pointer active:scale-[0.99]"
            >
              {/* Card Header: Avatar + Name + Status Pill + SR */}
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {emp.photoUrl ? (
                    <img
                      src={emp.photoUrl}
                      alt={emp.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveZoomedImage(emp.photoUrl || null);
                      }}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 font-extrabold text-sm flex items-center justify-center shrink-0 border border-blue-200">
                      {emp.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-sm truncate">
                      {emp.name}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">
                      #{emp.srNo} • {emp.role || "Karigar"}
                    </span>
                  </div>
                </div>

                {/* Status Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleWorkerStatus(emp);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all shrink-0 ${
                    emp.status === "Active"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : "bg-slate-100 text-slate-600 border-slate-300"
                  }`}
                >
                  {emp.status}
                </button>
              </div>

              {/* Card Meta Badges Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Khata</span>
                  <span className="font-mono font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    {emp.code || "-"}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Machine</span>
                  <span className="font-mono font-bold text-slate-800 text-[11px] truncate">
                    {emp.assigned_machine || "Not Assigned"}
                  </span>
                </div>
              </div>

              {/* Contact & Helpers Row */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700 font-mono font-bold">
                  {emp.mobile && emp.mobile !== "-" ? (
                    <a
                      href={`tel:${emp.mobile}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{emp.mobile}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs">No Phone</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => openEditWorkerForm(emp)}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Worker"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteWorker(emp.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Worker"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 2. DESKTOP / TABLET DATA TABLE (VISIBLE ON md: AND ABOVE) - EXCEL-STYLE BOX GRID */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-100/80 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">
              <tr>
                <th className="px-4 py-2.5 text-center w-12 border-r border-slate-200/80">SR NO.</th>
                <th className="px-3 py-2.5 text-center w-14 border-r border-slate-200/80">PHOTO</th>
                <th className="px-4 py-2.5 border-r border-slate-200/80">WORKER NAME</th>
                <th className="px-4 py-2.5 border-r border-slate-200/80">KHATA NO.</th>
                <th className="px-4 py-2.5 border-r border-slate-200/80">MACHINE NUMBER</th>
                <th className="px-4 py-2.5 border-r border-slate-200/80">MOBILE NUMBER</th>
                <th className="px-4 py-2.5 text-center border-r border-slate-200/80">SHIFT</th>
                <th className="px-4 py-2.5 text-right border-r border-slate-200/80">SALARY (₹)</th>
                <th className="px-4 py-2.5 border-r border-slate-200/80">HELPERS</th>
                <th className="px-4 py-2.5 text-center border-r border-slate-200/80">STATUS</th>
                <th className="px-4 py-2.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800 text-xs bg-white">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
                    No worker records found matching your filters. Click &quot;+ Add Worker&quot; to add a record.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => (
                <tr
                  key={emp.id}
                  onClick={() => setPreviewWorker(emp)}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                >
                  {/* SR NO */}
                  <td className="px-4 py-3 text-center font-bold text-slate-500 font-mono text-xs border-r border-slate-200/70">
                    {emp.srNo}
                  </td>

                  {/* PHOTO */}
                  <td className="px-3 py-2 text-center align-middle whitespace-nowrap border-r border-slate-200/70">
                    <div className="flex items-center justify-center">
                      {emp.photoUrl ? (
                        <img
                          src={emp.photoUrl}
                          alt={emp.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveZoomedImage(emp.photoUrl || null);
                          }}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs cursor-zoom-in hover:opacity-90 hover:ring-2 hover:ring-blue-500 transition-all"
                          title="Click to zoom photo"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-800 font-extrabold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                          {emp.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* WORKER NAME */}
                  <td className="px-4 py-3 whitespace-nowrap border-r border-slate-200/70">
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-blue-700 transition-colors">
                      {emp.name}
                    </span>
                  </td>

                  {/* KHATA NO */}
                  <td className="px-4 py-3 whitespace-nowrap border-r border-slate-200/70">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {emp.code || "-"}
                    </span>
                  </td>

                  {/* MACHINE NUMBER */}
                  <td className="px-4 py-3 whitespace-nowrap border-r border-slate-200/70">
                    <span className="font-mono text-xs font-medium text-slate-700">
                      {emp.assigned_machine || "-"}
                    </span>
                  </td>

                  {/* MOBILE NUMBER */}
                  <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-800 border-r border-slate-200/70">
                    {emp.mobile && emp.mobile !== "-" ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{emp.mobile}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">-</span>
                    )}
                  </td>

                  {/* SHIFT */}
                  <td className="px-4 py-3 whitespace-nowrap text-center border-r border-slate-200/70">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                      emp.shift === "Night Shift"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}>
                      {emp.shift === "Night Shift" ? "🌙 Night" : "☀️ Day"}
                    </span>
                  </td>

                  {/* MONTHLY SALARY */}
                  <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-slate-900 border-r border-slate-200/70">
                    {emp.monthly_salary > 0 ? (
                      <span>₹{Number(emp.monthly_salary).toLocaleString("en-IN")}</span>
                    ) : (
                      <span className="text-slate-400 font-normal">-</span>
                    )}
                  </td>

                  {/* HELPERS */}
                  <td className="px-4 py-3 whitespace-nowrap border-r border-slate-200/70">
                    {emp.helpers && emp.helpers.length > 0 ? (
                      <span className="text-xs font-medium text-slate-700">
                        {emp.helpers.length} Helper{emp.helpers.length > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">0 Helpers</span>
                    )}
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-3 whitespace-nowrap text-center border-r border-slate-200/70">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWorkerStatus(emp);
                      }}
                      className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-xs"
                      title="Click to Toggle Status"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${emp.status === "Active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                      <span className={emp.status === "Active" ? "text-emerald-700" : "text-slate-500"}>
                        {emp.status}
                      </span>
                    </button>
                  </td>

                  {/* ACTION */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openEditWorkerForm(emp)}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Worker"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteWorker(emp.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Worker"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WORKER DETAILS PREVIEW DRAWER / MODAL */}
      {previewWorker && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150">
            {/* HEADER - SPACIOUS & UNCROWDED */}
            <div className="p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  {previewWorker.photoUrl ? (
                    <div className="relative group shrink-0">
                      <img
                        src={previewWorker.photoUrl}
                        alt={previewWorker.name}
                        onClick={() => setActiveZoomedImage(previewWorker.photoUrl || null)}
                        className="w-13 h-13 rounded-2xl object-cover border-2 border-slate-200/90 shadow-2xs cursor-zoom-in hover:border-blue-500 transition-all"
                        title="Click to view full photo"
                      />
                      <div className="absolute inset-0 bg-slate-900/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-800 font-black text-lg flex items-center justify-center border-2 border-blue-200/80 shrink-0">
                      {previewWorker.name.charAt(0)}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">{previewWorker.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                        previewWorker.status === "Active"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-slate-100 text-slate-600 border-slate-300"
                      }`}>
                        {previewWorker.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-950 border border-blue-200/80 rounded-md font-extrabold text-[11px]">
                        Khata: {previewWorker.code || "-"}
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-md font-bold text-[11px]">
                        Machine: {previewWorker.assigned_machine || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start">
                  <button
                    type="button"
                    onClick={() => setPreviewWorker(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* BODY */}
            <div className="p-5 space-y-5 text-xs">
              {/* BASIC DETAILS GRID */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Khata No.</div>
                  <div className="font-extrabold text-slate-900 mt-0.5 font-mono">{previewWorker.code || "-"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Machine Number</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">{previewWorker.assigned_machine || "-"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number</div>
                  <div className="font-extrabold text-slate-900 mt-0.5 font-mono">
                    {previewWorker.mobile && previewWorker.mobile !== "-" ? previewWorker.mobile : "-"}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Email Address</div>
                  <div className="font-bold text-slate-900 mt-0.5">{previewWorker.email || "-"}</div>
                </div>
              </div>

              {/* HELPERS LIST (ALWAYS SHOWN) */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Helpers / Child Workers ({previewWorker.helpers?.length || 0})</span>
                </h4>
                {previewWorker.helpers && previewWorker.helpers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewWorker.helpers.map((h) => (
                      <div key={h.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="font-bold text-slate-900">{h.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{h.mobile || "-"}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 font-bold text-center text-xs font-mono">
                    - No helper workers linked -
                  </div>
                )}
              </div>

              {/* BANK DETAILS (ALWAYS SHOWN) */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Bank Account Details</span>
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</div>
                    <div className="font-bold text-slate-800 mt-0.5">{previewWorker.bank_details?.bank_name || "-"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Account Number</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">{previewWorker.bank_details?.account_number || "-"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">IFSC Code</div>
                    <div className="font-mono font-bold text-slate-800 uppercase mt-0.5">{previewWorker.bank_details?.ifsc_code || "-"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">UPI ID</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">{previewWorker.bank_details?.upi_id || "-"}</div>
                  </div>
                </div>
              </div>

              {/* PORTAL CREDENTIALS (ALWAYS SHOWN) */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span>Portal Login Credentials ({previewWorker.portal_credentials?.length || 0})</span>
                </h4>
                {previewWorker.portal_credentials && previewWorker.portal_credentials.length > 0 ? (
                  <div className="space-y-1.5">
                    {previewWorker.portal_credentials.map((c) => (
                      <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 flex items-center justify-between">
                        <span>{c.email}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 font-bold text-center text-xs font-mono">
                    - No portal login credentials created -
                  </div>
                )}
              </div>

              {/* DOCUMENTS (ALWAYS SHOWN WITH VIEW BUTTON) */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Uploaded Documents ({previewWorker.documents?.length || 0})</span>
                </h4>
                {previewWorker.documents && previewWorker.documents.length > 0 ? (
                  <div className="space-y-2">
                    {previewWorker.documents.map((d) => (
                      <div
                        key={d.id}
                        className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 ${d.type === 'pdf' ? 'bg-rose-50 text-rose-600 border border-rose-200/60' : 'bg-sky-50 text-sky-600 border border-sky-200/60'}`}>
                            {d.type === 'pdf' ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                          </div>
                          <div className="truncate">
                            <div className="font-extrabold text-slate-900 text-xs truncate group-hover:text-emerald-700 transition-colors">
                              {d.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {d.size} • Uploaded {d.date}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleViewDocument(d)}
                          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold rounded-full text-xs tracking-wider uppercase border border-slate-200 hover:border-slate-300 flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer active:scale-95 ml-2"
                        >
                          <span>VIEW/DOWNLOAD</span>
                          <ArrowUpRight className="w-4 h-4 text-slate-500 shrink-0" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 font-bold text-center text-xs font-mono">
                    - No documents uploaded -
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      {activeZoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setActiveZoomedImage(null)}
        >
          <div
            className="relative w-[400px] sm:w-[440px] max-w-[92vw] h-[400px] sm:h-[440px] max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center border border-slate-100 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveZoomedImage(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-xs border border-white/20"
              title="Close image preview"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={activeZoomedImage}
              alt="Worker Full View"
              className="w-full h-full object-cover rounded-3xl"
            />
          </div>
        </div>
      )}

      {/* MODAL: MARK DAILY ATTENDANCE */}
      {isMarkAttendanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Mark Daily Attendance</h3>
              <button
                type="button"
                onClick={() => setIsMarkAttendanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Worker</label>
                <select
                  value={attEmployeeId}
                  onChange={(e) => setAttEmployeeId(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.code} - {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Attendance Status</label>
                  <select
                    value={attStatus}
                    onChange={(e) => setAttStatus(e.target.value as any)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
                  >
                    <option value="Present">Present</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Shift</label>
                  <select
                    value={attShift}
                    onChange={(e) => setAttShift(e.target.value as any)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
                  >
                    <option value="Day Shift">Day Shift</option>
                    <option value="Night Shift">Night Shift</option>
                  </select>
                </div>
              </div>

              {attStatus !== "Absent" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Pieces Completed Today</label>
                  <input
                    type="number"
                    value={attPieces}
                    onChange={(e) => setAttPieces(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Advance Taken Today (₹)</label>
                <input
                  type="number"
                  value={attAdvance}
                  onChange={(e) => setAttAdvance(Number(e.target.value))}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMarkAttendanceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-2xs cursor-pointer"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GIVE ADVANCE */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-600" />
                <span>Give Advance Payment</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAdvanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdvance} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Advance Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-2xs cursor-pointer"
                >
                  Record Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal for Workers */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entityType="workers"
        onSuccess={() => loadEmployeesFromApi()}
      />
    </div>
  );
}
