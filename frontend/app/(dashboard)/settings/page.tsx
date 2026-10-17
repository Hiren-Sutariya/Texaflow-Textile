"use client";

import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Landmark,
  Receipt,
  KeyRound,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Upload,
  QrCode,
  Trash2,
  RefreshCw,
  Sparkles,
  Database,
  HardDrive,
  AlertTriangle,
  ShieldAlert,
  FileSpreadsheet,
  Download
} from "lucide-react";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getStoredCompanyId, getStoredUserName } from "@/lib/tenantStorage";
import { BottomActionBar } from "@/components/layout/BottomActionBar";

const PAYMENT_TERMS_OPTIONS = [
  "Due on Receipt",
  "Net 7 Days",
  "Net 15 Days (Surat Market Standard)",
  "Net 30 Days"
];

const GST_RATES = [
  "5% (Textile Embroidery Jobwork)",
  "12% (Apparel & Made-ups)",
  "18% (Standard Services)",
  "0% (Exempted)"
];

const ACCOUNT_TYPES = [
  "Current Account",
  "Cash Credit (CC) Account",
  "Overdraft (OD) Account",
  "Savings Account"
];

function getDefaultSettings(cid: string, firmName?: string) {
  if (cid === "comp-001") {
    const fName = firmName || "Shiv Creation";
    return {
      company_name: fName,
      brand_name: "SHIV CREATION",
      tagline: "High Precision Multi-Head Embroidery Job Work",
      phone: "9978987181",
      alt_phone: "",
      email: "owner@shivcreation.com",
      address: "Plot No. 104-106, GIDC Khatodara Industrial Estate",
      city_state: "Surat, Gujarat",
      pincode: "395002",
      msme_no: "UDYAM-GJ-24-0091823",
      website: "",
      gstin: "",
      pan: "",
      bank_name: "State Bank of India",
      account_holder: fName,
      account_no: "",
      account_type: "Current Account",
      ifsc: "SBIN0001234",
      branch_name: "Ring Road Branch, Surat",
      upi_id: "shivcreation@sbi",
      qr_code_image: "",
      invoice_title: "TAX INVOICE / JOBWORK BILL",
      challan_title: "DELIVERY CHALLAN / TAKKA DISPATCH SLIP",
      invoice_prefix: "SC/26-27/",
      next_invoice_no: "101",
      challan_prefix: "DC/26-27/",
      next_challan_no: "101",
      hsn_sac_code: "998822 (Textile Jobwork)",
      gst_rate: "5% (Textile Embroidery Jobwork)",
      payment_terms: "Due on Receipt",
      signatory_label: `For ${fName} (Authorized Signatory)`,
      eway_threshold: "50000",
      print_qr: true,
      terms_conditions:
        "1. Goods once delivered will not be taken back without inspection.\n2. Payment strictly due as per credit terms.\n3. Subject to Surat Jurisdiction only."
    };
  }

  if (cid === "comp-002") {
    const fName = firmName || "Om Sai Enterprise";
    return {
      company_name: fName,
      brand_name: "OM SAI ENTERPRISE",
      owner_name: "Nilesh Sutariya",
      tagline: "High Precision Multi-Head Embroidery Job Work",
      phone: "9978987181",
      alt_phone: "",
      email: "owner@om-sai.com",
      address: "Plot No. 104-106, GIDC Khatodara / Kadodara",
      city_state: "Surat, Gujarat",
      pincode: "395002",
      msme_no: "UDYAM-GJ-24-0091823",
      website: "",
      gstin: "",
      pan: "",
      bank_name: "State Bank of India",
      account_holder: fName,
      account_no: "",
      account_type: "Current Account",
      ifsc: "SBIN0001234",
      branch_name: "Ring Road Branch, Surat",
      upi_id: "omsai@sbi",
      qr_code_image: "",
      invoice_title: "TAX INVOICE / JOBWORK BILL",
      challan_title: "DELIVERY CHALLAN / TAKKA DISPATCH SLIP",
      invoice_prefix: "OS/26-27/",
      next_invoice_no: "101",
      challan_prefix: "DC/26-27/",
      next_challan_no: "101",
      hsn_sac_code: "998822 (Textile Jobwork)",
      gst_rate: "5% (Textile Embroidery Jobwork)",
      payment_terms: "Due on Receipt",
      signatory_label: `For ${fName} (Authorized Signatory)`,
      eway_threshold: "50000",
      print_qr: true,
      terms_conditions:
        "1. Goods once delivered will not be taken back without inspection.\n2. Payment strictly due as per credit terms.\n3. Subject to Surat Jurisdiction only."
    };
  }

  // Any newly registered company or other tenant
  const fName = firmName || "New Enterprise";
  const prefix = fName.split(" ").filter(Boolean).map(w => w[0]).slice(0, 3).join("").toUpperCase() || "INV";
  return {
    company_name: fName,
    brand_name: fName.toUpperCase(),
    tagline: "Textile & Embroidery Manufacturing",
    phone: "",
    alt_phone: "",
    email: "",
    address: "Surat, Gujarat",
    city_state: "Surat, Gujarat",
    pincode: "395002",
    msme_no: "",
    website: "",
    gstin: "",
    pan: "",
    bank_name: "",
    account_holder: fName,
    account_no: "",
    account_type: "Current Account",
    ifsc: "",
    branch_name: "",
    upi_id: "",
    qr_code_image: "",
    invoice_title: "TAX INVOICE / JOBWORK BILL",
    challan_title: "DELIVERY CHALLAN / TAKKA DISPATCH SLIP",
    invoice_prefix: `${prefix}/26-27/`,
    next_invoice_no: "101",
    challan_prefix: "DC/26-27/",
    next_challan_no: "101",
    hsn_sac_code: "998822 (Textile Jobwork)",
    gst_rate: "5% (Textile Embroidery Jobwork)",
    payment_terms: "Due on Receipt",
    signatory_label: `For ${fName} (Authorized Signatory)`,
    eway_threshold: "50000",
    print_qr: true,
    terms_conditions:
      "1. Goods once delivered will not be taken back without inspection.\n2. Payment strictly due as per credit terms.\n3. Subject to Surat Jurisdiction only."
  };
}

type SettingsFormData = ReturnType<typeof getDefaultSettings>;

interface AuthDataState {
  username: string;
  name: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const { user, updateUserSession } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);

  // Active Subtab (Merged Company & Address with Bank & GST into single "Company" tab)
  const [activeTab, setActiveTab] = useState<
    "Company" | "Invoice & Bill" | "Login & Password" | "Data & Storage"
  >("Company");

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [authErrorMsg, setAuthErrorMsg] = useState("");

  // Data & Storage Maintenance states
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isEraseModalOpen, setIsEraseModalOpen] = useState(false);
  const [eraseConfirmInput, setEraseConfirmInput] = useState("");
  const [isErasing, setIsErasing] = useState(false);
  const [eraseStatusText, setEraseStatusText] = useState("");
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Custom Dropdowns
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isGstOpen, setIsGstOpen] = useState(false);
  const [isAccTypeOpen, setIsAccTypeOpen] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);
  const gstRef = useRef<HTMLDivElement>(null);
  const accTypeRef = useRef<HTMLDivElement>(null);

  // Form State: Company, Bank & Invoice Details (Initialized per-tenant with zero millisecond leakage!)
  const [formData, setFormData] = useState<SettingsFormData>(() => {
    if (typeof window !== "undefined") {
      const cid = getStoredCompanyId();
      try {
        const savedTenant = localStorage.getItem(`app_settings_${cid}`);
        if (savedTenant) {
          const parsed = JSON.parse(savedTenant);
          const isPoisoned = (cid === "comp-001" && parsed?.company_name?.toLowerCase().includes("om sai")) ||
                             (cid === "comp-002" && parsed?.company_name?.toLowerCase().includes("shiv"));
          if (!isPoisoned) return parsed;
        }
      } catch {}
      return getDefaultSettings(cid);
    }
    return getDefaultSettings(getStoredCompanyId());
  });

  const isUserEditingRef = useRef(false);

  // Form State: Login & Password
  const [authData, setAuthData] = useState<AuthDataState>(() => {
    if (typeof window !== "undefined") {
      const cid = getStoredCompanyId();
      let localUsername = localStorage.getItem(`texaflow_login_username_${cid}`);
      const sessionStr = sessionStorage.getItem("texaflow_auth_session") || localStorage.getItem("texaflow_auth_session");
      let sessionUser: any = null;
      try {
        if (sessionStr) sessionUser = JSON.parse(sessionStr);
      } catch {}

      // Reject cross-tenant leakage:
      if (cid === "comp-001" && localUsername?.includes("om-sai")) localUsername = null;
      if (cid === "comp-002" && localUsername?.includes("shiv")) localUsername = null;

      const initUsername = localUsername || sessionUser?.username || sessionUser?.email || (cid === "comp-001" ? "owner@shivcreation.com" : (cid === "comp-002" ? "owner@om-sai.com" : "owner"));
      const initName = (cid === "comp-001" ? "Hiren Sutariya" : (cid === "comp-002" ? "Nilesh Sutariya" : (sessionUser?.name || "Owner")));

      return {
        username: initUsername,
        name: initName,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      };
    }
    const ssrCid = getStoredCompanyId();
    return {
      username: ssrCid === "comp-002" ? "owner@om-sai.com" : "owner@shivcreation.com",
      name: ssrCid === "comp-002" ? "Nilesh Sutariya" : "Hiren Sutariya",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    };
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (termsRef.current && !termsRef.current.contains(event.target as Node)) {
        setIsTermsOpen(false);
      }
      if (gstRef.current && !gstRef.current.contains(event.target as Node)) {
        setIsGstOpen(false);
      }
      if (accTypeRef.current && !accTypeRef.current.contains(event.target as Node)) {
        setIsAccTypeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load saved settings & credentials on mount strictly isolated per tenant
  useEffect(() => {
    setHasMounted(true);
    const cid = user?.companyId || getStoredCompanyId();

    // 1. Wipe legacy keys
    try {
      localStorage.removeItem("app_settings_om_sai");
    } catch {}

    // 2. Load tenant-isolated settings from localStorage
    try {
      const savedTenant = localStorage.getItem(`app_settings_${cid}`);
      if (savedTenant) {
        const parsed = JSON.parse(savedTenant);
        const isPoisoned = (cid === "comp-001" && parsed?.company_name?.toLowerCase().includes("om sai")) ||
                           (cid === "comp-002" && parsed?.company_name?.toLowerCase().includes("shiv"));
        if (!isPoisoned) {
          setFormData((prev) => ({ ...prev, ...parsed }));
        } else {
          setFormData(getDefaultSettings(cid, user?.firmName));
        }
      } else {
        setFormData(getDefaultSettings(cid, user?.firmName));
      }
    } catch {}

    // 2. Fetch live company profile from Backend API (Supabase) to keep in sync
    const fetchCompanySettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/company-settings?company_id=${cid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.company_name) {
            setFormData((prev) => {
              const updated = {
                ...prev,
                company_name: data.company_name,
                brand_name: data.brand_name || data.company_name.toUpperCase(),
                phone: (data.phone && data.phone.trim()) ? data.phone.trim() : prev.phone,
                email: (data.email && data.email.trim()) ? data.email.trim() : (cid === "comp-001" ? "owner@shivcreation.com" : (cid === "comp-002" ? "owner@om-sai.com" : prev.email)),
                address: (data.address && data.address.trim()) ? data.address.trim() : prev.address,
                gstin: (data.gstin && data.gstin.trim()) ? data.gstin.trim() : prev.gstin
              };
              try {
                localStorage.setItem(`app_settings_${cid}`, JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
          if (data.username && !isUserEditingRef.current) {
            setAuthData((prev) => ({
              ...prev,
              username: data.username,
              name: data.owner_name || (cid === "comp-002" ? "Nilesh Sutariya" : (cid === "comp-001" ? "Hiren Sutariya" : prev.name))
            }));
            try {
              localStorage.setItem(`texaflow_login_username_${cid}`, data.username);
            } catch {}
          }
        }
      } catch (err) {
        console.warn("Could not fetch company settings from backend:", err);
      }
    };

    fetchCompanySettings();

    // 3. Synchronize authData from current logged-in user session immediately if user hasn't edited yet
    if (user && !isUserEditingRef.current) {
      let localUsername = typeof window !== "undefined" ? localStorage.getItem(`texaflow_login_username_${cid}`) : null;
      if (cid === "comp-001" && localUsername?.includes("om-sai")) localUsername = null;
      if (cid === "comp-002" && localUsername?.includes("shiv")) localUsername = null;

      setAuthData((prev) => ({
        ...prev,
        username: localUsername || user.username || user.email || (cid === "comp-001" ? "owner@shivcreation.com" : (cid === "comp-002" ? "owner@om-sai.com" : prev.username)),
        name: user.name || (cid === "comp-002" ? "Nilesh Sutariya" : (cid === "comp-001" ? "Hiren Sutariya" : prev.name))
      }));
    }

    const fetchCredentials = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (user?.id) queryParams.set("user_id", user.id);
        if (cid) queryParams.set("company_id", cid);
        if (user?.username || user?.email) queryParams.set("username", user.username || user.email || "");

        const url = `${API_BASE_URL}/auth/credentials?${queryParams.toString()}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          // Strict Tenant Guard: NEVER overwrite current tenant with another tenant's credentials
          if (data.company_id && data.company_id !== cid) {
            console.warn("Ignoring mismatched tenant credentials:", data);
            return;
          }
          if (data.username && !isUserEditingRef.current) {
            setAuthData((prev) => ({
              ...prev,
              username: data.username,
              name: data.name || (cid === "comp-002" ? "Nilesh Sutariya" : (cid === "comp-001" ? "Hiren Sutariya" : prev.name))
            }));
            try {
              localStorage.setItem(`texaflow_login_username_${cid}`, data.username);
            } catch {}
          }
        }
      } catch (e) {
        if (user && !isUserEditingRef.current) {
          const localUsername = typeof window !== "undefined" ? localStorage.getItem(`texaflow_login_username_${cid}`) : null;
          setAuthData((prev) => ({
            ...prev,
            username: localUsername || user.username || user.email || prev.username,
            name: user.name || prev.name
          }));
        }
      }
    };

    fetchCredentials();
  }, [user]);

  // Handle QR Code Image Upload
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("QR Code image must be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData((prev) => ({ ...prev, qr_code_image: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-generate QR code from UPI ID
  const handleAutoGenerateQr = () => {
    if (!formData.upi_id.trim()) {
      alert("Please enter a valid UPI ID first to generate QR code.");
      return;
    }
    const upiPayload = `upi://pay?pa=${encodeURIComponent(formData.upi_id.trim())}&pn=${encodeURIComponent(
      formData.company_name.trim()
    )}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayload)}`;
    setFormData((prev) => ({ ...prev, qr_code_image: qrUrl }));
    setSaveSuccessMsg("QR Code generated from UPI ID!");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  // Handle Clear Cache
  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      // 1. Unregister all service workers
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.unregister();
          }
        } catch (swErr) {
          console.warn("ServiceWorker unregister notice:", swErr);
        }
      }

      // 2. Clear browser cache storage
      if (typeof window !== "undefined" && "caches" in window) {
        try {
          const cacheKeys = await window.caches.keys();
          await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
        } catch (cacheErr) {
          console.warn("Caches delete notice:", cacheErr);
        }
      }

      // 3. Keep user auth session safe while purging temporary session storage
      if (typeof window !== "undefined") {
        const authSession = sessionStorage.getItem("texaflow_auth_session");
        sessionStorage.clear();
        if (authSession) {
          sessionStorage.setItem("texaflow_auth_session", authSession);
        }
      }

      // 4. Remove temporary frontend query/filter caches from localStorage
      const tempKeys = [
        "next_cache",
        "temp_query_cache",
        "cached_filters",
        "temp_design_cache",
        "temp_order_filter",
        "temp_nav_state"
      ];
      tempKeys.forEach((k) => localStorage.removeItem(k));

      setSaveSuccessMsg("System cache & service workers successfully purged! Reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (err) {
      console.error("Cache clear failed:", err);
      alert("Failed to clear cache: " + (err instanceof Error ? err.message : String(err)));
      setIsClearingCache(false);
    }
  };

  // Handle Erase All Software Data (Factory Reset)
  const handleEraseAllData = async () => {
    if (eraseConfirmInput.trim().toUpperCase() !== "DELETE") {
      alert("Please type DELETE in uppercase to confirm data erasure.");
      return;
    }

    setIsErasing(true);
    setEraseStatusText("Initializing factory reset...");

    try {
      // 1. Attempt server bulk wipe endpoint
      let serverWiped = false;
      try {
        setEraseStatusText("Attempting direct cloud database reset...");
        await fetchApi("/system/purge-all-data", { method: "DELETE" });
        serverWiped = true;
      } catch (bulkErr) {
        console.warn("Bulk purge endpoint not available, falling back to individual item purge:", bulkErr);
      }

      // 2. If bulk endpoint wasn't available, delete items via individual REST endpoints
      if (!serverWiped) {
        // A. Workers / Employees
        try {
          setEraseStatusText("Erasing workers & karigars from cloud database...");
          const emps = await fetchApi<any[]>("/employees").catch(() => []);
          if (Array.isArray(emps) && emps.length > 0) {
            await Promise.allSettled(
              emps.map((e) => fetchApi(`/employees/${e.id || e.emp_id}`, { method: "DELETE" }))
            );
          }
        } catch (e) {
          console.warn("Employee erase warning:", e);
        }

        // B. Vendors & Suppliers
        try {
          setEraseStatusText("Erasing vendors & suppliers from cloud database...");
          const vends = await fetchApi<any[]>("/vendors").catch(() => []);
          if (Array.isArray(vends) && vends.length > 0) {
            await Promise.allSettled(
              vends.map((v) => fetchApi(`/vendors/${v.id || v.vendor_id}`, { method: "DELETE" }))
            );
          }
        } catch (e) {
          console.warn("Vendor erase warning:", e);
        }

        // C. Designs Library
        try {
          setEraseStatusText("Erasing design library from cloud database...");
          const des = await fetchApi<any[]>("/designs").catch(() => []);
          if (Array.isArray(des) && des.length > 0) {
            await Promise.allSettled(
              des.map((d) => fetchApi(`/designs/${d.id || d.design_id}`, { method: "DELETE" }))
            );
          }
        } catch (e) {
          console.warn("Design erase warning:", e);
        }

        // D. Expenses
        try {
          setEraseStatusText("Erasing expense records from cloud database...");
          const exps = await fetchApi<any[]>("/expenses").catch(() => []);
          if (Array.isArray(exps) && exps.length > 0) {
            await Promise.allSettled(
              exps.map((x) => fetchApi(`/expenses/${x.id || x.expense_id}`, { method: "DELETE" }))
            );
          }
        } catch (e) {
          console.warn("Expense erase warning:", e);
        }

        // E. Payments
        try {
          setEraseStatusText("Erasing payment vouchers from cloud database...");
          const pays = await fetchApi<any[]>("/payments").catch(() => []);
          if (Array.isArray(pays) && pays.length > 0) {
            await Promise.allSettled(
              pays.map((p) => fetchApi(`/payments/${p.id || p.voucher_id}`, { method: "DELETE" }))
            );
          }
        } catch (e) {
          console.warn("Payment erase warning:", e);
        }
      }

      // 3. Clear local storage records and set explicit empty markers
      setEraseStatusText("Clearing local storage and browser caches...");
      if (typeof window !== "undefined") {
        // Preserve active auth session
        const authSession = sessionStorage.getItem("texaflow_auth_session");

        window.localStorage.clear();

        // Set explicit empty markers so all pages know records were reset to 0
        window.localStorage.setItem("app_employees_data", "[]");
        window.localStorage.setItem("app_vendors_master", "[]");
        window.localStorage.setItem("om_sai_vendors", "[]");
        window.localStorage.setItem("app_design_folders", "[]");
        window.localStorage.setItem("om_sai_designs_library", "[]");
        window.localStorage.setItem("app_finished_designs", "[]");
        window.localStorage.setItem("app_job_orders", "[]");
        window.localStorage.setItem("om_sai_expenses", "[]");
        window.localStorage.setItem("om_sai_vouchers", "[]");
        window.localStorage.setItem("om_sai_payments", "[]");
        window.localStorage.setItem("app_machines", "[]");
        window.localStorage.setItem("app_machines_unit_1", "[]");
        window.localStorage.setItem("app_machines_unit_2", "[]");
        window.localStorage.setItem("app_production_logs", "[]");
        window.localStorage.setItem("app_dispatches", "[]");
        window.localStorage.setItem("app_worker_payouts", "[]");
        window.localStorage.setItem("app_inventory", "[]");
        window.localStorage.setItem("app_documents", "[]");
        window.localStorage.setItem("app_tasks", "[]");
        window.localStorage.setItem("app_party_master", "[]");
        window.localStorage.setItem("app_parties", "[]");
        window.localStorage.setItem("app_parties_list", "[]");
        window.localStorage.setItem("parties_register_data", "[]");
        window.localStorage.setItem("om_sai_custom_expense_categories", "[]");

        // Clear sessionStorage and restore auth session
        window.sessionStorage.clear();
        if (authSession) {
          window.sessionStorage.setItem("texaflow_auth_session", authSession);
        }

        // Unregister service workers and clear browser caches
        if ("serviceWorker" in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const reg of registrations) {
              await reg.unregister();
            }
          } catch {}
        }
        if ("caches" in window) {
          try {
            const cacheKeys = await window.caches.keys();
            await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
          } catch {}
        }

        // Notify app components of updated data
        window.dispatchEvent(new Event("app_data_update"));
      }

      setEraseStatusText("All software data erased successfully! Redirecting...");
      setSaveSuccessMsg("All cloud records and local data have been permanently erased! Redirecting...");

      setTimeout(() => {
        setIsEraseModalOpen(false);
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      console.error("Data erase failed:", err);
      alert("Failed to erase all data: " + (err instanceof Error ? err.message : String(err)));
      setIsErasing(false);
      setEraseStatusText("");
    }
  };

  // Export Complete Backup to Structured Multi-Sheet Excel (.xlsx)
  const handleExportExcelBackup = async () => {
    setIsExportingExcel(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const getArray = (key: string): any[] => {
        if (typeof window === "undefined") return [];
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return [];
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [];
        }
      };

      const createAutoWidthSheet = (data: any[]) => {
        const ws = XLSX.utils.json_to_sheet(data);
        if (data.length > 0) {
          const keys = Object.keys(data[0]);
          ws["!cols"] = keys.map((key) => {
            let maxLen = key.length;
            data.forEach((row) => {
              const val = row[key];
              const str = val !== null && val !== undefined ? String(val) : "";
              if (str.length > maxLen) {
                maxLen = Math.min(str.length, 50);
              }
            });
            return { wch: Math.max(maxLen + 4, 12) };
          });
        }
        return ws;
      };

      // 1. WORKERS & KARIGARS (Active Module: /employees)
      let employeesData: any[] = [];
      try {
        const live = await fetchApi<any[]>("/employees");
        if (Array.isArray(live) && live.length > 0) employeesData = live;
      } catch {}
      if (employeesData.length === 0) employeesData = getArray("app_employees_data");

      if (employeesData.length > 0) {
        const formattedEmployees = employeesData.map((e, idx) => ({
          "No.": idx + 1,
          "Worker ID": e.id || e.emp_id || `EMP-${idx + 1}`,
          "Worker Name": e.name || "N/A",
          "Designation / Role": e.role || e.designation || "Karigar",
          "Contact Phone": e.phone || "N/A",
          "Salary / Rate (₹)": e.rate || e.salary || 0,
          "Payment Type": e.payment_type || e.salary_type || "Daily",
          "Work Status": e.status || "Active",
          "Shift": e.shift || "Day",
          "Joining Date": e.join_date || e.created_at || "N/A",
          "Address / Hometown": e.address || "N/A"
        }));
        const wsEmp = createAutoWidthSheet(formattedEmployees);
        XLSX.utils.book_append_sheet(wb, wsEmp, "Workers & Karigars");
      }

      // 2. VENDORS & SUPPLIERS (Active Module: /vendors)
      let vendorsData: any[] = [];
      try {
        const live = await fetchApi<any[]>("/vendors");
        if (Array.isArray(live) && live.length > 0) vendorsData = live;
      } catch {}
      if (vendorsData.length === 0) vendorsData = getArray("app_vendors_master");

      if (vendorsData.length > 0) {
        const formattedVendors = vendorsData.map((v, idx) => ({
          "No.": idx + 1,
          "Vendor ID": v.id || v.vendor_id || `VEN-${idx + 1}`,
          "Company / Firm Name": v.company_name || v.name || "N/A",
          "Contact Person": v.contact_person || "N/A",
          "Phone Number": v.phone || "N/A",
          "City": v.city || "Surat",
          "GSTIN": v.gstin || "N/A",
          "PAN": v.pan || "N/A",
          "Balance Due (₹)": v.balance || 0,
          "Credit Terms": v.credit_terms || "Due on Receipt",
          "Full Address": v.address || "N/A"
        }));
        const wsVen = createAutoWidthSheet(formattedVendors);
        XLSX.utils.book_append_sheet(wb, wsVen, "Vendors & Suppliers");
      }

      // 3. JOB ORDERS (Active Module: /orders & /job-works)
      const ordersData = getArray("app_job_orders");
      if (ordersData.length > 0) {
        const formattedOrders = ordersData.map((o, idx) => ({
          "No.": idx + 1,
          "Job Order #": o.order_no || o.id || `ORD-${idx + 1}`,
          "Order Date": o.date || o.order_date || o.created_at || "N/A",
          "Party / Client Name": o.party_name || o.vendor || "N/A",
          "Main Merchant": o.main_merchant || "N/A",
          "Design Description": o.design_name || "N/A",
          "Design Code": o.design_code || o.design_no || "N/A",
          "Fabric Quality": o.fabric_quality || "N/A",
          "Stitches": o.stitches || o.total_stitches || 0,
          "Order Qty (Pcs)": o.total_quantity || o.quantity || 0,
          "Rate (₹)": o.rate || o.rate_per_1k || 0,
          "Assigned Machine": o.assigned_machine || "N/A",
          "Target Date": o.target_date || "N/A",
          "Status": o.status || "Pending",
          "Special Notes": o.notes || ""
        }));
        const wsOrders = createAutoWidthSheet(formattedOrders);
        XLSX.utils.book_append_sheet(wb, wsOrders, "Job Orders");
      }

      // 4. DESIGN LIBRARY (Active Module: /designs)
      let designsData: any[] = [];
      try {
        const live = await fetchApi<any[]>("/designs");
        if (Array.isArray(live) && live.length > 0) designsData = live;
      } catch {}
      if (designsData.length === 0) designsData = getArray("app_design_folders");

      if (designsData.length > 0) {
        const formattedDesigns = designsData.map((d, idx) => ({
          "No.": idx + 1,
          "Design # / ID": d.id || d.design_no || `DES-${idx + 1}`,
          "Design Title": d.name || d.design_name || "N/A",
          "Category": d.category || "Embroidery",
          "Total Stitches": d.stitches || d.total_stitches || 0,
          "Standard Rate (₹)": d.rate || d.average_rate || 0,
          "Fabric Type": d.fabric || d.fabric_type || "N/A",
          "Needles / Colors": d.needles || d.colors || "N/A",
          "Machine Type": d.machine_type || "Multi-Head",
          "Created Date": d.created_at || d.date || "N/A"
        }));
        const wsDesigns = createAutoWidthSheet(formattedDesigns);
        XLSX.utils.book_append_sheet(wb, wsDesigns, "Design Library");
      }

      // 5. FACTORY EXPENSES (Active Module: /expenses)
      let expensesData: any[] = [];
      try {
        const live = await fetchApi<any[]>("/expenses");
        if (Array.isArray(live) && live.length > 0) expensesData = live;
      } catch {}
      if (expensesData.length === 0) expensesData = getArray("app_expenses");

      if (expensesData.length > 0) {
        const formattedExpenses = expensesData.map((x, idx) => ({
          "No.": idx + 1,
          "Expense #": x.id || `EXP-${idx + 1}`,
          "Expense Date": x.date || x.expense_date || "N/A",
          "Category": x.category || "Factory Expense",
          "Amount (₹)": x.amount || 0,
          "Payment Mode": x.payment_mode || "Cash",
          "Paid To": x.paid_to || "N/A",
          "Bill / Ref #": x.bill_no || x.invoice_no || "N/A",
          "Remarks": x.notes || x.description || ""
        }));
        const wsExpenses = createAutoWidthSheet(formattedExpenses);
        XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");
      }

      // 6. PAYMENTS & VOUCHERS (Active Module: /payments)
      let paymentsData: any[] = [];
      try {
        const live = await fetchApi<any[]>("/payments");
        if (Array.isArray(live) && live.length > 0) paymentsData = live;
      } catch {}
      if (paymentsData.length === 0) paymentsData = getArray("app_payments").concat(getArray("om_sai_vouchers"));

      if (paymentsData.length > 0) {
        const formattedPayments = paymentsData.map((p, idx) => ({
          "No.": idx + 1,
          "Voucher #": p.voucher_no || p.id || `VCH-${idx + 1}`,
          "Voucher Date": p.date || p.payment_date || "N/A",
          "Paid To / Received From": p.party_name || p.paid_to || "N/A",
          "Transaction Type": p.payment_type || p.type || "Payment",
          "Amount (₹)": p.amount || 0,
          "Payment Mode": p.payment_mode || "Bank Transfer",
          "Bank / Transaction Ref": p.ref_no || p.cheque_no || "N/A",
          "Narration / Notes": p.notes || p.narration || ""
        }));
        const wsPayments = createAutoWidthSheet(formattedPayments);
        XLSX.utils.book_append_sheet(wb, wsPayments, "Payment Vouchers");
      }

      // 7. PRODUCTION MACHINES (Active Module: /production)
      const machinesData = getArray("app_machines")
        .concat(getArray("app_machines_unit_1"))
        .concat(getArray("app_machines_unit_2"));

      if (machinesData.length > 0) {
        const formattedMachines = machinesData.map((m, idx) => ({
          "No.": idx + 1,
          "Machine #": m.id || m.machine_id || `M-${idx + 1}`,
          "Machine Name": m.name || m.machine_name || `Embroidery Machine ${idx + 1}`,
          "Factory Unit": m.unit || "Unit 1",
          "Heads Count": m.heads || m.total_heads || 12,
          "Operating Status": m.status || "Idle",
          "Current Job": m.current_job || m.job_order || "N/A",
          "Running RPM": m.rpm || m.speed || 850,
          "Shift Operator": m.operator || m.operator_name || "N/A"
        }));
        const wsMachines = createAutoWidthSheet(formattedMachines);
        XLSX.utils.book_append_sheet(wb, wsMachines, "Production Machines");
      }

      // 8. DELIVERY CHALLANS & DISPATCHES (Active Module: /dispatches)
      const dispatchesData = getArray("app_finished_designs").concat(getArray("app_dispatches"));
      if (dispatchesData.length > 0) {
        const formattedDispatches = dispatchesData.map((d, idx) => ({
          "No.": idx + 1,
          "Challan / Dispatch #": d.challan_no || d.id || `DC-${idx + 1}`,
          "Dispatch Date": d.date || d.dispatch_date || "N/A",
          "Party Name": d.party_name || d.party || "N/A",
          "Design Description": d.design_name || d.design_code || "N/A",
          "Dispatched Qty (Pcs)": d.quantity || d.pcs || 0,
          "Takka / Roll Count": d.takka || d.rolls || 1,
          "Transport / Vehicle": d.transport || d.vehicle_no || "Local Delivery",
          "Status": d.status || "Delivered"
        }));
        const wsDispatches = createAutoWidthSheet(formattedDispatches);
        XLSX.utils.book_append_sheet(wb, wsDispatches, "Delivery Challans");
      }

      // 9. COMPANY PROFILE & SETTINGS (Clean 2-Column Vertical Table - Easily Readable in Excel!)
      const companyRows = [
        { "Setting / Parameter": "Company Legal Name", "Configured Value": formData.company_name || "" },
        { "Setting / Parameter": "Brand / Trade Name", "Configured Value": formData.brand_name || "" },
        { "Setting / Parameter": "Business Tagline", "Configured Value": formData.tagline || "" },
        { "Setting / Parameter": "Primary Phone", "Configured Value": formData.phone || "" },
        { "Setting / Parameter": "Alternate Phone", "Configured Value": formData.alt_phone || "N/A" },
        { "Setting / Parameter": "Email Address", "Configured Value": formData.email || "" },
        { "Setting / Parameter": "Factory Address", "Configured Value": formData.address || "" },
        { "Setting / Parameter": "City & State", "Configured Value": formData.city_state || "" },
        { "Setting / Parameter": "Pincode", "Configured Value": formData.pincode || "" },
        { "Setting / Parameter": "MSME Udyam Reg. No.", "Configured Value": formData.msme_no || "N/A" },
        { "Setting / Parameter": "GSTIN Number", "Configured Value": formData.gstin || "" },
        { "Setting / Parameter": "PAN Number", "Configured Value": formData.pan || "" },
        { "Setting / Parameter": "Bank Name", "Configured Value": formData.bank_name || "" },
        { "Setting / Parameter": "Account Holder Name", "Configured Value": formData.account_holder || "" },
        { "Setting / Parameter": "Account Number", "Configured Value": formData.account_no || "" },
        { "Setting / Parameter": "Account Type", "Configured Value": formData.account_type || "" },
        { "Setting / Parameter": "IFSC Code", "Configured Value": formData.ifsc || "" },
        { "Setting / Parameter": "Bank Branch", "Configured Value": formData.branch_name || "" },
        { "Setting / Parameter": "UPI ID", "Configured Value": formData.upi_id || "" },
        { "Setting / Parameter": "Invoice Heading Title", "Configured Value": formData.invoice_title || "" },
        { "Setting / Parameter": "Challan Heading Title", "Configured Value": formData.challan_title || "" },
        { "Setting / Parameter": "Invoice Prefix", "Configured Value": formData.invoice_prefix || "" },
        { "Setting / Parameter": "Next Invoice Number", "Configured Value": formData.next_invoice_no || "" },
        { "Setting / Parameter": "Challan Prefix", "Configured Value": formData.challan_prefix || "" },
        { "Setting / Parameter": "Next Challan Number", "Configured Value": formData.next_challan_no || "" },
        { "Setting / Parameter": "Default HSN / SAC Code", "Configured Value": formData.hsn_sac_code || "" },
        { "Setting / Parameter": "Default GST Rate", "Configured Value": formData.gst_rate || "" },
        { "Setting / Parameter": "Payment Credit Terms", "Configured Value": formData.payment_terms || "" },
        { "Setting / Parameter": "Authorized Signatory Text", "Configured Value": formData.signatory_label || "" },
      ];
      const wsCompany = XLSX.utils.json_to_sheet(companyRows);
      wsCompany["!cols"] = [{ wch: 32 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(wb, wsCompany, "Company Settings");

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Om_Sai_ERP_Full_Backup_${dateStr}.xlsx`);

      setSaveSuccessMsg("Full Excel backup generated with all active modules!");
      setTimeout(() => setSaveSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Excel backup error:", err);
      alert("Failed to export Excel backup file.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Main Save Handler (Triggered from Static Bottom Bar)
  const handleSaveAll = async () => {
    if (isSavingRef.current) return;
    setAuthErrorMsg("");
    setSaveSuccessMsg("");

    // If on Login & Password tab, save credentials to backend DB
    if (activeTab === "Login & Password") {
      const isChangingPassword = Boolean(authData.newPassword.trim() || authData.confirmPassword.trim());

      if (isChangingPassword) {
        if (!authData.currentPassword.trim()) {
          setAuthErrorMsg("Please enter your current password to authorize setting a new password.");
          return;
        }

        if (!authData.newPassword.trim() || !authData.confirmPassword.trim()) {
          setAuthErrorMsg("Please enter new password in both fields to confirm.");
          return;
        }

        if (authData.newPassword.trim().length < 4) {
          setAuthErrorMsg("New password must be at least 4 characters long.");
          return;
        }

        if (authData.newPassword.trim() !== authData.confirmPassword.trim()) {
          setAuthErrorMsg("New Password and Confirm Password do not match. Please re-enter.");
          return;
        }
      }

      isSavingRef.current = true;
      setIsSaving(true);

      try {
        const res = await fetch(`${API_BASE_URL}/auth/change-credentials`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_password: isChangingPassword ? authData.currentPassword.trim() : "",
            new_username: authData.username.trim(),
            name: authData.name.trim(),
            new_password: isChangingPassword ? authData.newPassword.trim() : "",
            user_id: user?.id,
            company_id: user?.companyId || "comp-001"
          })
        });

        const data = await res.json();

        if (res.ok) {
          setSaveSuccessMsg(
            isChangingPassword
              ? "Login User ID, Name & Password updated successfully!"
              : "Login User ID & Profile updated successfully! હવેથી આ નવા User ID થી Login થશે."
          );
          setAuthData((prev) => ({
            ...prev,
            username: data.user?.username || authData.username.trim(),
            name: data.user?.name || authData.name.trim(),
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          }));

          // Immediately update active session in AuthContext so Sidebar updates!
          updateUserSession({
            username: data.user?.username || authData.username.trim(),
            email: data.user?.email || data.user?.username || authData.username.trim(),
            name: data.user?.name || authData.name.trim()
          });

          // Dispatch event so other components receive the updated profile
          window.dispatchEvent(new Event("app_data_update"));

          setTimeout(() => setSaveSuccessMsg(""), 3500);
        } else {
          setAuthErrorMsg(data.detail || "Failed to update profile.");
        }
      } catch (err) {
        setAuthErrorMsg("Cannot connect to backend server.");
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
      return;
    }

    // Otherwise save Settings (Company, Bank, Invoice)
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      const cid = user?.companyId || getStoredCompanyId();
      const settingsToSave = {
        ...formData,
        owner_name: authData.name?.trim() || user?.name || (cid === "comp-002" ? "Nilesh Sutariya" : (cid === "comp-001" ? "Hiren Sutariya" : formData.company_name?.trim()))
      };
      localStorage.setItem(`app_settings_${cid}`, JSON.stringify(settingsToSave));
      localStorage.removeItem("app_settings_om_sai");

      // Update company firmName, username and owner name in active user session so Sidebar and session update immediately!
      const newFirmName = formData.company_name?.trim() || formData.brand_name?.trim();
      const newUsername = authData.username?.trim();
      const newName = authData.name?.trim();
      if (newUsername) {
        localStorage.setItem(`texaflow_login_username_${cid}`, newUsername);
      }
      isUserEditingRef.current = false;

      updateUserSession({
        ...(newFirmName ? { firmName: newFirmName } : {}),
        ...(newUsername ? { username: newUsername } : {}),
        ...(newName ? { name: newName } : {}),
        email: formData.email?.trim() || (newUsername && newUsername.includes("@") ? newUsername : undefined)
      });

      // Dispatch global events
      window.dispatchEvent(new CustomEvent("app_settings_update", { detail: { ...settingsToSave, company_id: cid } }));
      window.dispatchEvent(new Event("app_data_update"));

      // Also sync company name, username and details to backend API
      try {
        await fetch(`${API_BASE_URL}/auth/company-settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: cid,
            user_id: user?.id,
            company_name: formData.company_name.trim(),
            brand_name: formData.brand_name?.trim(),
            tagline: formData.tagline?.trim(),
            phone: formData.phone?.trim(),
            email: formData.email?.trim(),
            username: newUsername,
            address: formData.address?.trim(),
            city_state: formData.city_state?.trim(),
            pincode: formData.pincode?.trim(),
            gstin: formData.gstin?.trim(),
            pan: formData.pan?.trim()
          })
        });

        if (newUsername || newName) {
          await fetch(`${API_BASE_URL}/auth/change-credentials`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              new_username: newUsername || user?.username || user?.email,
              name: newName || "",
              firm_name: newFirmName || "",
              user_id: user?.id,
              company_id: cid
            })
          }).catch(() => {});
        }
      } catch (syncErr) {
        console.warn("Backend company settings sync notice:", syncErr);
      }

      setSaveSuccessMsg("Settings & Username saved successfully! Sidebar updated.");
      setTimeout(() => setSaveSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" &&
        !["button", "submit", "checkbox", "radio", "file"].includes(
          (target as HTMLInputElement).type
        )
      ) {
        e.preventDefault();
        const container = e.currentTarget;
        const visibleInputs = Array.from(
          container.querySelectorAll<HTMLInputElement>(
            'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([disabled]):not([readonly])'
          )
        ).filter((el) => el.offsetParent !== null);

        const currentIndex = visibleInputs.indexOf(target as HTMLInputElement);
        if (currentIndex >= 0 && currentIndex < visibleInputs.length - 1) {
          const nextInput = visibleInputs[currentIndex + 1];
          nextInput.focus();
          nextInput.select?.();
        } else if (currentIndex === visibleInputs.length - 1) {
          handleSaveAll();
        }
      }
    }
  };

  if (!hasMounted) return null;

  return (
    <div className="w-full max-w-4xl font-sans text-slate-800 pb-[72px] sm:pb-[60px] space-y-4 px-1 sm:px-0">
      {/* Toast Notification Banner */}
      {saveSuccessMsg && (
        <div className="fixed top-16 right-5 z-50 inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Settings Card: Seamless Tab Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Seamless Navigation Tab Header (Horizontally scrollable on mobile) */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 pt-3.5 border-b border-slate-200 bg-slate-50/60 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
          <button
            type="button"
            onClick={() => {
              setActiveTab("Company");
              setAuthErrorMsg("");
            }}
            className={`pb-3 px-3 sm:px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "Company"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span>Company</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("Invoice & Bill");
              setAuthErrorMsg("");
            }}
            className={`pb-3 px-3 sm:px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "Invoice & Bill"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Receipt className="w-3.5 h-3.5 shrink-0" />
            <span>Invoice & Bill</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("Login & Password");
              setAuthErrorMsg("");
            }}
            className={`pb-3 px-3 sm:px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "Login & Password"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span>Login & Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("Data & Storage");
              setAuthErrorMsg("");
            }}
            className={`pb-3 px-3 sm:px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "Data & Storage"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>Data & Storage</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4" onKeyDown={handleFormKeyDown}>
          {/* Feedback Error (for Auth Tab) */}
          {authErrorMsg && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>{authErrorMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: COMPANY (MERGED PROFILE, ADDRESS, BANK & STATUTORY DETAILS) */}
          {/* ========================================================================= */}
          {activeTab === "Company" && (
            <div className="space-y-6 animate-in fade-in duration-100">
              {/* SECTION A: COMPANY PROFILE & ADDRESS */}
              <div className="space-y-3.5">
                {/* Company Legal Name */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                  <label className="font-bold text-slate-600">Company Legal Name *</label>
                  <div className="max-w-md w-full">
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="e.g. Registered Company Name"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Brand Name / Short Code */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                  <label className="font-bold text-slate-600">Brand / Short Name</label>
                  <div className="max-w-md w-full">
                    <input
                      type="text"
                      value={formData.brand_name}
                      onChange={(e) => setFormData({ ...formData, brand_name: e.target.value.toUpperCase() })}
                      placeholder="e.g. BRAND NAME"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs uppercase"
                    />
                  </div>
                </div>

                {/* Tagline / Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                  <label className="font-bold text-slate-600">Tagline / Subtitle</label>
                  <div className="max-w-md w-full">
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      placeholder="e.g. High Precision Multi-Head Embroidery Job Work"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    />
                  </div>
                </div>

                {/* Phone / Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                  <label className="font-bold text-slate-600">Primary Mobile *</label>
                  <div className="max-w-md w-full">
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9978987181"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                  <label className="font-bold text-slate-600">Billing / Office Email</label>
                  <div className="max-w-md w-full">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="owner@shivcreation.com"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    />
                  </div>
                </div>

                {/* Factory Address */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                  <label className="font-bold text-slate-600">Factory Address *</label>
                  <div className="max-w-md w-full">
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Plot No. 104-106, GIDC Khatodara / Kadodara"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                      required
                    />
                  </div>
                </div>

                {/* City & State / PIN */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                  <label className="font-bold text-slate-600">City, State & PIN</label>
                  <div className="max-w-md w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={formData.city_state}
                      onChange={(e) => setFormData({ ...formData, city_state: e.target.value })}
                      placeholder="Surat, Gujarat"
                      className="flex-1 h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    />
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="PIN Code"
                      className="w-full sm:w-28 h-9 px-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    />
                  </div>
                </div>

                {/* MSME Udyam Registration */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                  <label className="font-bold text-slate-600">MSME Udyam Reg. No.</label>
                  <div className="max-w-md w-full">
                    <input
                      type="text"
                      value={formData.msme_no}
                      onChange={(e) => setFormData({ ...formData, msme_no: e.target.value.toUpperCase() })}
                      placeholder="UDYAM-GJ-24-0091823"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: BANK & STATUTORY (GST) DETAILS */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 pb-3">
                  <span className="text-xs font-black text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-blue-600" />
                    Bank & Statutory (GST) Details
                  </span>
                </div>

                <div className="space-y-3.5">
                  {/* GSTIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                    <label className="font-bold text-slate-600">GSTIN Number (15 Digits)</label>
                    <div className="max-w-md w-full">
                      <input
                        type="text"
                        maxLength={15}
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                        placeholder="24AAAFA1234A1Z5"
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs uppercase"
                      />
                    </div>
                  </div>

                  {/* PAN */}
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                    <label className="font-bold text-slate-600">PAN Number</label>
                    <div className="max-w-md w-full">
                      <input
                        type="text"
                        maxLength={10}
                        value={formData.pan}
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                        placeholder="AAAFA1234A"
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs uppercase"
                      />
                    </div>
                  </div>

                  {/* Bank Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                    <label className="font-bold text-slate-600">Primary Bank Name</label>
                    <div className="max-w-md w-full">
                      <input
                        type="text"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        placeholder="HDFC Bank Ltd"
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                      />
                    </div>
                  </div>

                  {/* Account Holder Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                    <label className="font-bold text-slate-600">Account Holder Name</label>
                    <div className="max-w-md w-full">
                      <input
                        type="text"
                        value={formData.account_holder}
                        onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                        placeholder="e.g. Account Holder / Legal Firm Name"
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                      />
                    </div>
                  </div>

                  {/* Account Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                    <label className="font-bold text-slate-600">Current Account Number</label>
                    <div className="max-w-md w-full">
                      <input
                        type="text"
                        value={formData.account_no}
                        onChange={(e) => setFormData({ ...formData, account_no: e.target.value })}
                        placeholder="50200012345678"
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                      />
                    </div>
                  </div>

                  {/* Account Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                    <label className="font-bold text-slate-600">Account Type</label>
                    <div className="max-w-md w-full relative" ref={accTypeRef}>
                      <button
                        type="button"
                        onClick={() => setIsAccTypeOpen(!isAccTypeOpen)}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <span className="truncate">{formData.account_type}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
                            isAccTypeOpen ? "rotate-180 text-blue-600" : ""
                          }`}
                        />
                      </button>

                      {isAccTypeOpen && (
                        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                          {ACCOUNT_TYPES.map((type) => {
                            const isSelected = formData.account_type === type;
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, account_type: type });
                                  setIsAccTypeOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-blue-50 text-blue-700 font-bold"
                                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                              >
                                <span>{type}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* IFSC Code & Branch */}
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                    <label className="font-bold text-slate-600">IFSC & Branch Name</label>
                    <div className="max-w-md w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={formData.ifsc}
                        onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                        placeholder="HDFC0000123"
                        className="w-full sm:w-36 h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs uppercase"
                      />
                      <input
                        type="text"
                        value={formData.branch_name}
                        onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                        placeholder="Ring Road Branch, Surat"
                        className="flex-1 h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                      />
                    </div>
                  </div>

                  {/* UPI ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                    <label className="font-bold text-slate-600">UPI ID (VPA)</label>
                    <div className="max-w-md w-full">
                      <input
                        type="text"
                        value={formData.upi_id}
                        onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                        placeholder="omsaienterprise@hdfcbank"
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                      />
                    </div>
                  </div>

                  {/* QR Code Option for Bank Payments */}
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start text-xs pt-2 border-t border-slate-100">
                    <div className="pt-1">
                      <label className="font-bold text-slate-700 block">Bank Payment QR Code</label>
                      <span className="text-[10px] text-slate-400">Prints on bill bottom</span>
                    </div>
                    <div className="max-w-md w-full space-y-3">
                      {formData.qr_code_image ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="w-24 h-24 bg-white p-1.5 rounded-lg border border-slate-200 shrink-0 shadow-2xs flex items-center justify-center">
                            <img
                              src={formData.qr_code_image}
                              alt="Bank UPI QR Code"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="space-y-1.5 text-center sm:text-left">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Active on Invoices</span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              Customers can scan this QR code on physical bill to pay directly.
                            </p>
                            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                              <label
                                htmlFor="qr-file-upload"
                                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer transition-colors shadow-2xs"
                              >
                                Replace QR
                              </label>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, qr_code_image: "" })}
                                className="px-2.5 py-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          {/* Upload QR File */}
                          <label
                            htmlFor="qr-file-upload"
                            className="flex-1 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3 flex items-center gap-3 bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-blue-600 shadow-2xs shrink-0">
                              <Upload className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Upload QR Image</p>
                              <p className="text-[10px] text-slate-400">PNG, JPG or scanner screenshot</p>
                            </div>
                          </label>

                          {/* Auto-generate from UPI */}
                          <button
                            type="button"
                            onClick={handleAutoGenerateQr}
                            className="h-14 px-3 border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors shrink-0"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            <span>Auto-Generate QR</span>
                          </button>
                        </div>
                      )}

                      <input
                        type="file"
                        id="qr-file-upload"
                        accept="image/*"
                        onChange={handleQrUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: INVOICE & BILL */}
          {/* ========================================================================= */}
          {activeTab === "Invoice & Bill" && (
            <div className="space-y-3.5 animate-in fade-in duration-100">
              {/* Invoice Title */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Tax Invoice Title</label>
                <div className="max-w-md w-full">
                  <input
                    type="text"
                    value={formData.invoice_title}
                    onChange={(e) => setFormData({ ...formData, invoice_title: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Delivery Challan Title */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Delivery Challan Title</label>
                <div className="max-w-md w-full">
                  <input
                    type="text"
                    value={formData.challan_title}
                    onChange={(e) => setFormData({ ...formData, challan_title: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Numbering Prefix Series */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Invoice Series & No.</label>
                <div className="max-w-md w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={formData.invoice_prefix}
                    onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                    placeholder="OMS/26-27/"
                    className="flex-1 h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                  <input
                    type="number"
                    value={formData.next_invoice_no}
                    onChange={(e) => setFormData({ ...formData, next_invoice_no: e.target.value })}
                    placeholder="Next: 101"
                    className="w-full sm:w-28 h-9 px-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Challan Prefix Series */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Challan Series & No.</label>
                <div className="max-w-md w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={formData.challan_prefix}
                    onChange={(e) => setFormData({ ...formData, challan_prefix: e.target.value })}
                    placeholder="DC/26-27/"
                    className="flex-1 h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                  <input
                    type="number"
                    value={formData.next_challan_no}
                    onChange={(e) => setFormData({ ...formData, next_challan_no: e.target.value })}
                    placeholder="Next: 101"
                    className="w-full sm:w-28 h-9 px-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* HSN / SAC Code */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">HSN / SAC Code</label>
                <div className="max-w-md w-full">
                  <input
                    type="text"
                    value={formData.hsn_sac_code}
                    onChange={(e) => setFormData({ ...formData, hsn_sac_code: e.target.value })}
                    placeholder="998822 (Textile Jobwork)"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* GST Tax Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Default GST Rate (%)</label>
                <div className="max-w-md w-full relative" ref={gstRef}>
                  <button
                    type="button"
                    onClick={() => setIsGstOpen(!isGstOpen)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <span className="truncate">{formData.gst_rate}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
                        isGstOpen ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>

                  {isGstOpen && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                      {GST_RATES.map((rate) => {
                        const isSelected = formData.gst_rate === rate;
                        return (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, gst_rate: rate });
                              setIsGstOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 text-blue-700 font-bold"
                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <span>{rate}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Default Payment Terms</label>
                <div className="max-w-md w-full relative" ref={termsRef}>
                  <button
                    type="button"
                    onClick={() => setIsTermsOpen(!isTermsOpen)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <span className="truncate">{formData.payment_terms}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
                        isTermsOpen ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>

                  {isTermsOpen && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                      {PAYMENT_TERMS_OPTIONS.map((opt) => {
                        const isSelected = formData.payment_terms === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, payment_terms: opt });
                              setIsTermsOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 text-blue-700 font-bold"
                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Authorized Signatory Label */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Authorized Signatory</label>
                <div className="max-w-md w-full">
                  <input
                    type="text"
                    value={formData.signatory_label}
                    onChange={(e) => setFormData({ ...formData, signatory_label: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Print QR Code Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">QR Code on Invoices</label>
                <div className="max-w-md w-full flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="print_qr_toggle"
                    checked={formData.print_qr}
                    onChange={(e) => setFormData({ ...formData, print_qr: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="print_qr_toggle" className="text-xs font-medium text-slate-800 cursor-pointer select-none">
                    Print Bank UPI QR Code automatically on bottom of invoices
                  </label>
                </div>
              </div>

              {/* Terms and Conditions Textarea */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start text-xs pt-1">
                <label className="font-bold text-slate-600 pt-1.5">Terms & Conditions</label>
                <div className="max-w-md w-full">
                  <textarea
                    rows={3}
                    value={formData.terms_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs resize-y min-h-[70px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: LOGIN & PASSWORD (Direct clean inputs without top banner) */}
          {/* ========================================================================= */}
          {activeTab === "Login & Password" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* User ID */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Login User ID / Username *</label>
                <div className="max-w-md w-full">
                  <input
                    type="text"
                    value={authData.username}
                    onChange={(e) => {
                      isUserEditingRef.current = true;
                      setAuthData({ ...authData, username: e.target.value });
                    }}
                    placeholder="e.g. shivcreation or owner@shivcreation.com"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    required
                  />
                </div>
              </div>

              {/* Display Name */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Display Name</label>
                <div className="max-w-md w-full">
                  <input
                    type="text"
                    value={authData.name}
                    onChange={(e) => {
                      isUserEditingRef.current = true;
                      setAuthData({ ...authData, name: e.target.value });
                    }}
                    placeholder="Hiren Sutariya"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Optional Password Change Section */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                  <p className="text-[11px] font-bold text-slate-500">
                    🔑 Password Change (Optional) — જો ફક્ત User ID કે Name બદલવું હોય તો પાસવર્ડ ખાલી રાખી શકો છો.
                  </p>
                </div>

                {/* Current Password */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                  <label className="font-bold text-slate-600">Current Password</label>
                  <div className="max-w-md w-full relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={authData.currentPassword}
                      onChange={(e) => setAuthData({ ...authData, currentPassword: e.target.value })}
                      placeholder="Only needed if setting new password"
                      className="w-full h-9 pl-3 pr-9 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                  <label className="font-bold text-slate-600">New Password</label>
                  <div className="max-w-md w-full relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={authData.newPassword}
                      onChange={(e) => setAuthData({ ...authData, newPassword: e.target.value })}
                      placeholder="Leave blank to keep existing password"
                      className="w-full h-9 pl-3 pr-9 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-2.5 items-start sm:items-center text-xs">
                  <label className="font-bold text-slate-600">Confirm Password</label>
                  <div className="max-w-md w-full relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={authData.confirmPassword}
                      onChange={(e) => setAuthData({ ...authData, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password if changing"
                      className="w-full h-9 pl-3 pr-9 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: DATA & STORAGE MAINTENANCE (Simple & Clean) */}
          {/* ========================================================================= */}
          {activeTab === "Data & Storage" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* 1. Excel Backup Card */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Export All Data to Excel (.xlsx)</h4>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                      Download a full backup of all factory records (Workers, Job Orders, Vendors, Expenses, and Payments) in an Excel spreadsheet.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isExportingExcel}
                  onClick={handleExportExcelBackup}
                  className="w-full sm:w-auto justify-center shrink-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-60"
                >
                  <Download className={`w-3.5 h-3.5 ${isExportingExcel ? "animate-bounce" : ""}`} />
                  <span>{isExportingExcel ? "Exporting Excel..." : "Download Excel Backup"}</span>
                </button>
              </div>

              {/* 2. Clear Temporary Cache Card */}
              <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Clear Temporary Cache</h4>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                      Clear temporary browser cache and session memory to optimize system performance. Your business data will not be deleted.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isClearingCache}
                  onClick={handleClearCache}
                  className="w-full sm:w-auto justify-center shrink-0 px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isClearingCache ? "animate-spin" : ""}`} />
                  <span>{isClearingCache ? "Cleaning..." : "Clear Cache Now"}</span>
                </button>
              </div>

              {/* 3. Erase All Data (Factory Reset) Card */}
              <div className="border border-red-200 bg-red-50/20 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-red-700">Factory Reset / Erase All Data</h4>
                    <p className="text-xs text-red-600/80 mt-0.5 max-w-xl">
                      Permanently delete all records from this software (Orders, Karigars, Expenses, Payments, and Settings).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEraseConfirmInput("");
                    setIsEraseModalOpen(true);
                  }}
                  className="w-full sm:w-auto justify-center shrink-0 px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Erase All Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for All Data Erase */}
      {isEraseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Confirm All Data Erase</h3>
                <p className="text-xs text-red-600 font-semibold">This action cannot be undone!</p>
              </div>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1.5 font-medium">
              <p>⚠️ All Job Orders, Vouchers, Worker Records, Expenses, and Settings will be permanently erased.</p>
              <p>To confirm, please type <strong className="font-black text-red-800">DELETE</strong> in uppercase below:</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Confirmation Word *</label>
              <input
                type="text"
                disabled={isErasing}
                value={eraseConfirmInput}
                onChange={(e) => setEraseConfirmInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-red-500 shadow-2xs text-xs tracking-wider disabled:bg-slate-100 disabled:opacity-60"
                autoFocus
              />
            </div>

            {isErasing && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-bold flex items-center gap-2.5 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-red-600 shrink-0" />
                <span className="truncate">{eraseStatusText || "Erasing software records..."}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isErasing}
                onClick={() => {
                  setIsEraseModalOpen(false);
                  setEraseConfirmInput("");
                  setEraseStatusText("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={eraseConfirmInput.trim().toUpperCase() !== "DELETE" || isErasing}
                onClick={handleEraseAllData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {isErasing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Erasing Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Erase All Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNIFIED STATIC / FIXED BOTTOM ACTIONS BAR */}
      {/* ========================================================================= */}
      <BottomActionBar
        showSynced={true}
        rightContent={
          activeTab === "Data & Storage" ? (
            <button
              type="button"
              disabled={isExportingExcel}
              onClick={handleExportExcelBackup}
              className="px-4 py-2 font-extrabold rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isExportingExcel ? "Exporting Excel..." : "Download Excel Backup"}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAll}
              className={`px-5 py-2 font-extrabold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                isSaving
                  ? "bg-blue-400 text-white cursor-not-allowed pointer-events-none opacity-80"
                  : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>
                    {activeTab === "Login & Password"
                      ? "Updating Credentials..."
                      : "Saving Settings..."}
                  </span>
                </>
              ) : (
                <span>
                  {activeTab === "Login & Password"
                    ? "Update Login Credentials"
                    : "Save Settings"}
                </span>
              )}
            </button>
          )
        }
      />
    </div>
  );
}
