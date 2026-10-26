"use client";

import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Landmark,
  Receipt,
  KeyRound,
  Check,
  ChevronDown,
  ChevronRight,
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
  Download,
  Save,
  Keyboard,
  Truck,
  FileCheck,
  ShoppingCart,
  CreditCard,
  BookOpen,
  Laptop,
  RotateCcw,
  Edit3
} from "lucide-react";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  ShortcutBinding,
  isMacUser,
  getSavedShortcuts,
  saveShortcuts,
  resetShortcuts,
  formatShortcutDisplay
} from "@/lib/shortcutsStorage";
import { getStoredCompanyId, getStoredUserName } from "@/lib/tenantStorage";
import { CompanySettings, CustomFieldLabels } from "@/lib/companySettings";
import { BottomActionBar } from "@/components/layout/BottomActionBar";

const PAYMENT_TERMS_OPTIONS = [
  "Due on Receipt",
  "Net 7 Days",
  "Net 15 Days (Surat Market Standard)",
  "Net 30 Days"
];

const GST_RATES = [
  "0% (Exempted)",
  "5% (Textile Embroidery Jobwork)",
  "12% (Apparel & Made-ups)",
  "18% (Standard Services)"
];

const ACCOUNT_TYPES = [
  "Current Account",
  "Cash Credit (CC) Account",
  "Overdraft (OD) Account",
  "Savings Account"
];

const BILL_FORMAT_OPTIONS = [
  {
    id: "standard",
    label: "Standard Textile GST Format (A4)",
    tag: "Active Default",
    desc: "Complete GST jobwork bill with HSN, Tax breakdown, and Bank UPI QR",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "modern",
    label: "Modern Minimalist GST Format (A4)",
    tag: "Coming Soon",
    desc: "Compact modern layout with stylish headers and summary card",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "compact",
    label: "Compact Dispatch Slip / Challan (A5)",
    tag: "Coming Soon",
    desc: "Half-page compact layout for quick delivery challans",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  }
];

function getDefaultSettings(cid: string, firmName?: string): CompanySettings {
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
      bill_format: "Standard Textile GST Format (A4)",
      sales_invoice_title: "TAX INVOICE / JOBWORK BILL",
      invoice_title: "TAX INVOICE / JOBWORK BILL",
      challan_title: "DELIVERY CHALLAN / TAKKA DISPATCH SLIP",
      sales_invoice_prefix: "SC/26/",
      next_sales_invoice_no: "101",
      invoice_prefix: "INV/26-27/",
      next_invoice_no: "101",
      challan_prefix: "DC/26-27/",
      next_challan_no: "101",
      hsn_sac_code: "998822 (Textile Jobwork)",
      gst_rate: "0% (Exempted)",
      payment_terms: "Due on Receipt",
      signatory_label: `For ${fName} (Authorized Signatory)`,
      eway_threshold: "50000",
      print_qr: true,
      terms_conditions:
        "1. Goods once delivered will not be taken back without inspection.\n2. Payment strictly due as per credit terms.\n3. Subject to Surat Jurisdiction only.",
      custom_labels: {
        party_name: "Party Name",
        supplier_name: "Supplier / Mill",
        item_name: "Particulars",
        item_unit: "Item",
        quantity: "Qty",
        weight: "Weight",
        cartoon: "Cartoon",
        rate: "Rate (₹)",
        total_amount: "Amount (₹)",
        challan_no: "Challan No",
        bill_no: "Bill / Invoice No",
        hsn_code: "HSN Code",
        design_no: "Particulars",
        sales_party: "Party Name",
        purchase_supplier: "Supplier / Mill",
        sales_item: "Particulars",
        purchase_item: "Particulars",
        sales_qty: "Qty",
        purchase_qty: "Qty",
        sales_rate: "Rate (₹)",
        purchase_rate: "Rate (₹)",
        sales_total: "Amount (₹)",
        purchase_total: "Amount (₹)",
        sales_bill_no: "Bill / Invoice No",
        purchase_bill_no: "Challan No"
      }
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
      bill_format: "Standard Textile GST Format (A4)",
      sales_invoice_title: "TAX INVOICE / JOBWORK BILL",
      invoice_title: "TAX INVOICE / JOBWORK BILL",
      challan_title: "DELIVERY CHALLAN / TAKKA DISPATCH SLIP",
      sales_invoice_prefix: "OS/26-27/",
      next_sales_invoice_no: "101",
      invoice_prefix: "INV/26-27/",
      next_invoice_no: "101",
      challan_prefix: "DC/26-27/",
      next_challan_no: "101",
      hsn_sac_code: "998822 (Textile Jobwork)",
      gst_rate: "0% (Exempted)",
      payment_terms: "Due on Receipt",
      signatory_label: `For ${fName} (Authorized Signatory)`,
      eway_threshold: "50000",
      print_qr: true,
      terms_conditions:
        "1. Goods once delivered will not be taken back without inspection.\n2. Payment strictly due as per credit terms.\n3. Subject to Surat Jurisdiction only.",
      custom_labels: {
        party_name: "Party Name",
        supplier_name: "Supplier / Mill",
        item_name: "Particulars",
        item_unit: "Item",
        quantity: "Qty",
        weight: "Weight",
        cartoon: "Cartoon",
        rate: "Rate (₹)",
        total_amount: "Amount (₹)",
        challan_no: "Challan No",
        bill_no: "Bill / Invoice No",
        hsn_code: "HSN Code",
        design_no: "Particulars",
        sales_party: "Party Name",
        purchase_supplier: "Supplier / Mill",
        sales_item: "Particulars",
        purchase_item: "Particulars",
        sales_qty: "Qty",
        purchase_qty: "Qty",
        sales_rate: "Rate (₹)",
        purchase_rate: "Rate (₹)",
        sales_total: "Amount (₹)",
        purchase_total: "Amount (₹)",
        sales_bill_no: "Bill / Invoice No",
        purchase_bill_no: "Challan No"
      }
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
    bill_format: "Standard Textile GST Format (A4)",
    sales_invoice_title: "TAX INVOICE / JOBWORK BILL",
    invoice_title: "TAX INVOICE / JOBWORK BILL",
    challan_title: "DELIVERY CHALLAN / TAKKA DISPATCH SLIP",
    sales_invoice_prefix: `${prefix}/26-27/`,
    next_sales_invoice_no: "101",
    invoice_prefix: "INV/26-27/",
    next_invoice_no: "101",
    challan_prefix: "DC/26-27/",
    next_challan_no: "101",
    hsn_sac_code: "998822 (Textile Jobwork)",
    gst_rate: "0% (Exempted)",
    payment_terms: "Due on Receipt",
    signatory_label: `For ${fName} (Authorized Signatory)`,
    eway_threshold: "50000",
    print_qr: true,
    terms_conditions:
      "1. Goods once delivered will not be taken back without inspection.\n2. Payment strictly due as per credit terms.\n3. Subject to Surat Jurisdiction only.",
    custom_labels: {
      party_name: "Party Name",
      supplier_name: "Supplier / Mill",
      item_name: "Particulars",
      item_unit: "Item",
      quantity: "Qty",
      weight: "Weight",
      cartoon: "Cartoon",
      rate: "Rate (₹)",
      total_amount: "Amount (₹)",
      challan_no: "Challan No",
      bill_no: "Bill / Invoice No",
      hsn_code: "HSN Code",
      design_no: "Particulars",
      sales_party: "Party Name",
      purchase_supplier: "Supplier / Mill",
      sales_item: "Particulars",
      purchase_item: "Particulars",
      sales_qty: "Qty",
      purchase_qty: "Qty",
      sales_rate: "Rate (₹)",
      purchase_rate: "Rate (₹)",
      sales_total: "Amount (₹)",
      purchase_total: "Amount (₹)",
      sales_bill_no: "Bill / Invoice No",
      purchase_bill_no: "Challan No"
    }
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

  // Active Subtab (Company, Invoice, Bill Fields, Shortcuts, Security, Data & Storage)
  const [activeTab, setActiveTab] = useState<
    "Company" | "Invoice & Bill" | "Custom Fields" | "Shortcuts" | "Login & Password" | "Data & Storage"
  >("Company");

  // Keyboard Shortcuts states
  const [shortcutsList, setShortcutsList] = useState<ShortcutBinding[]>([]);
  const [isMacDevice, setIsMacDevice] = useState(false);
  const [recordingShortcutId, setRecordingShortcutId] = useState<string | null>(null);
  const [shortcutFeedbackMsg, setShortcutFeedbackMsg] = useState<string | null>(null);

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
  const [isExportingJson, setIsExportingJson] = useState(false);

  // Custom Dropdowns
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isGstOpen, setIsGstOpen] = useState(false);
  const [isAccTypeOpen, setIsAccTypeOpen] = useState(false);
  const [isFormatOpen, setIsFormatOpen] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);
  const gstRef = useRef<HTMLDivElement>(null);
  const accTypeRef = useRef<HTMLDivElement>(null);
  const formatRef = useRef<HTMLDivElement>(null);

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
          if (!isPoisoned) {
            const defs = getDefaultSettings(cid);
            return {
              ...defs,
              ...parsed,
              custom_labels: {
                ...(defs.custom_labels || {}),
                ...(parsed.custom_labels || {})
              },
              sales_invoice_prefix: parsed.sales_invoice_prefix !== undefined ? parsed.sales_invoice_prefix : (parsed.invoice_prefix || defs.sales_invoice_prefix),
              next_sales_invoice_no: parsed.next_sales_invoice_no !== undefined ? parsed.next_sales_invoice_no : (parsed.next_invoice_no || defs.next_sales_invoice_no),
              sales_invoice_title: parsed.sales_invoice_title || parsed.invoice_title || defs.sales_invoice_title
            };
          }
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
      if (formatRef.current && !formatRef.current.contains(event.target as Node)) {
        setIsFormatOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load shortcuts on mount & listen for storage updates
  useEffect(() => {
    setIsMacDevice(isMacUser());
    setShortcutsList(getSavedShortcuts());

    const handleShortcutsUpdate = () => {
      setShortcutsList(getSavedShortcuts());
    };

    window.addEventListener("om_sai_shortcuts_updated", handleShortcutsUpdate);
    return () => {
      window.removeEventListener("om_sai_shortcuts_updated", handleShortcutsUpdate);
    };
  }, []);

  // Listen for key press when user is recording/customizing a shortcut
  useEffect(() => {
    if (!recordingShortcutId) return;

    const handleRecordKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setRecordingShortcutId(null);
        return;
      }

      if (["Alt", "Control", "Meta", "Shift"].includes(e.key)) {
        return;
      }

      const cleanKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const cleanCode = e.code;

      const updated = shortcutsList.map((sc) => {
        if (sc.id === recordingShortcutId) {
          return {
            ...sc,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
            shiftKey: e.shiftKey,
            key: cleanKey,
            code: cleanCode
          };
        }
        return sc;
      });

      setShortcutsList(updated);
      saveShortcuts(updated);
      setRecordingShortcutId(null);
      setShortcutFeedbackMsg("Shortcut key updated successfully!");
      setTimeout(() => setShortcutFeedbackMsg(null), 2500);
    };

    window.addEventListener("keydown", handleRecordKey, true);
    return () => {
      window.removeEventListener("keydown", handleRecordKey, true);
    };
  }, [recordingShortcutId, shortcutsList]);

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
          const defs = getDefaultSettings(cid, user?.firmName);
          setFormData((prev) => ({
            ...prev,
            ...parsed,
            custom_labels: {
              ...(defs.custom_labels || {}),
              ...(prev.custom_labels || {}),
              ...(parsed.custom_labels || {})
            }
          }));
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
              const serverCustomLabels = data.custom_labels || (data.settings_json && data.settings_json.custom_labels);
              const custom_labels = {
                ...(prev.custom_labels || {}),
                ...(serverCustomLabels || {})
              };
              const updated = {
                ...prev,
                company_name: data.company_name || prev.company_name,
                brand_name: data.brand_name || prev.brand_name,
                tagline: data.tagline !== undefined && data.tagline !== "" ? data.tagline : prev.tagline,
                phone: (data.phone && data.phone.trim()) ? data.phone.trim() : prev.phone,
                alt_phone: data.alt_phone !== undefined && data.alt_phone !== "" ? data.alt_phone : prev.alt_phone,
                email: (data.email && data.email.trim()) ? data.email.trim() : (cid === "comp-001" ? "owner@shivcreation.com" : (cid === "comp-002" ? "owner@om-sai.com" : prev.email)),
                address: (data.address && data.address.trim()) ? data.address.trim() : prev.address,
                city_state: data.city_state !== undefined && data.city_state !== "" ? data.city_state : prev.city_state,
                pincode: data.pincode !== undefined && data.pincode !== "" ? data.pincode : prev.pincode,
                msme_no: data.msme_no !== undefined && data.msme_no !== "" ? data.msme_no : prev.msme_no,
                website: data.website !== undefined && data.website !== "" ? data.website : prev.website,
                gstin: (data.gstin && data.gstin.trim()) ? data.gstin.trim() : prev.gstin,
                pan: data.pan !== undefined && data.pan !== "" ? data.pan : prev.pan,

                // Bank Details
                bank_name: data.bank_name !== undefined && data.bank_name !== "" ? data.bank_name : prev.bank_name,
                account_holder: data.account_holder !== undefined && data.account_holder !== "" ? data.account_holder : prev.account_holder,
                account_no: data.account_no !== undefined && data.account_no !== "" ? data.account_no : prev.account_no,
                account_type: data.account_type !== undefined && data.account_type !== "" ? data.account_type : prev.account_type,
                ifsc: data.ifsc !== undefined && data.ifsc !== "" ? data.ifsc : prev.ifsc,
                branch_name: data.branch_name !== undefined && data.branch_name !== "" ? data.branch_name : prev.branch_name,
                upi_id: data.upi_id !== undefined && data.upi_id !== "" ? data.upi_id : prev.upi_id,
                qr_code_image: data.qr_code_image !== undefined && data.qr_code_image !== "" ? data.qr_code_image : prev.qr_code_image,

                // Invoicing & Printing
                invoice_title: data.invoice_title !== undefined && data.invoice_title !== "" ? data.invoice_title : prev.invoice_title,
                challan_title: data.challan_title !== undefined && data.challan_title !== "" ? data.challan_title : prev.challan_title,
                invoice_prefix: data.invoice_prefix !== undefined && data.invoice_prefix !== "" ? data.invoice_prefix : prev.invoice_prefix,
                next_invoice_no: data.next_invoice_no !== undefined && data.next_invoice_no !== "" ? data.next_invoice_no : prev.next_invoice_no,
                challan_prefix: data.challan_prefix !== undefined && data.challan_prefix !== "" ? data.challan_prefix : prev.challan_prefix,
                next_challan_no: data.next_challan_no !== undefined && data.next_challan_no !== "" ? data.next_challan_no : prev.next_challan_no,
                hsn_sac_code: data.hsn_sac_code !== undefined && data.hsn_sac_code !== "" ? data.hsn_sac_code : prev.hsn_sac_code,
                gst_rate: data.gst_rate !== undefined && data.gst_rate !== "" ? data.gst_rate : prev.gst_rate,
                payment_terms: data.payment_terms !== undefined && data.payment_terms !== "" ? data.payment_terms : prev.payment_terms,
                signatory_label: data.signatory_label !== undefined && data.signatory_label !== "" ? data.signatory_label : prev.signatory_label,
                eway_threshold: data.eway_threshold !== undefined && data.eway_threshold !== "" ? data.eway_threshold : prev.eway_threshold,
                print_qr: data.print_qr !== undefined ? data.print_qr : prev.print_qr,
                terms_conditions: data.terms_conditions !== undefined && data.terms_conditions !== "" ? data.terms_conditions : prev.terms_conditions,
                custom_labels
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
    const upi = (formData.upi_id || "").trim();
    if (!upi) {
      alert("Please enter a valid UPI ID first to generate QR code.");
      return;
    }
    const upiPayload = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(
      (formData.company_name || "").trim()
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

      // 3. PURCHASES & RAW MATERIAL (Active Module: /purchases)
      let purchasesData: any[] = [];
      try {
        const live = await fetchApi<any[]>("/purchases");
        if (Array.isArray(live) && live.length > 0) purchasesData = live;
      } catch {}

      if (purchasesData.length > 0) {
        const formattedPurchases = purchasesData.map((p, idx) => ({
          "No.": idx + 1,
          "Purchase Bill #": p.purchase_no || p.id || `PB-${idx + 1}`,
          "Bill Date": p.date || "N/A",
          "Supplier / Vendor": p.vendor_name || "N/A",
          "Item / Category": p.category || p.items_description || "Material",
          "Tax Mode": p.tax_mode || "EXEMPT",
          "GST Rate (%)": p.tax_rate ?? 0,
          "Total Amount (₹)": p.amount || 0,
          "Payment Status": p.payment_status || "Pending",
          "Payment Terms": p.payment_terms || "N/A",
          "Due Date": p.due_date || "N/A",
          "Notes": p.notes || ""
        }));
        const wsPur = createAutoWidthSheet(formattedPurchases);
        XLSX.utils.book_append_sheet(wb, wsPur, "Purchases & Inward");
      }

      // 4. SALES CHALLANS (Active Module: /sales)
      let challansData: any[] = [];
      try {
        const live = await fetchApi<any[]>("/sales-challans");
        if (Array.isArray(live) && live.length > 0) challansData = live;
      } catch {}

      if (challansData.length > 0) {
        const formattedChallans = challansData.map((c, idx) => ({
          "No.": idx + 1,
          "Challan #": c.challan_no || c.id || `CH-${idx + 1}`,
          "Challan Date": c.date || "N/A",
          "Party / Customer": c.party_name || "N/A",
          "Total Quantity": c.total_quantity || 0,
          "Total Amount (₹)": c.total_amount || 0,
          "Delivery Status": c.status || "Dispatched",
          "Billed in Invoice": c.is_billed ? `Yes (${c.invoice_no || "Billed"})` : "No (Unbilled)",
          "Transport / Delivery By": c.transport || "Self Delivery",
          "Remarks": c.notes || ""
        }));
        const wsChallans = createAutoWidthSheet(formattedChallans);
        XLSX.utils.book_append_sheet(wb, wsChallans, "Sales Challans");
      }

      // 5. SALES INVOICES (Active Module: /sales-invoices)
      let invoicesData: any[] = [];
      try {
        const live = await fetchApi<any[]>("/sales-invoices");
        if (Array.isArray(live) && live.length > 0) invoicesData = live;
      } catch {}

      if (invoicesData.length > 0) {
        const formattedInvoices = invoicesData.map((inv, idx) => ({
          "No.": idx + 1,
          "Invoice #": inv.invoice_no || inv.id || `INV-${idx + 1}`,
          "Invoice Date": inv.date || "N/A",
          "Customer Name": inv.customer_name || "N/A",
          "Linked Challans": Array.isArray(inv.linked_challan_nos) ? inv.linked_challan_nos.join(", ") : "Direct Invoice",
          "Subtotal (₹)": inv.subtotal_amount || inv.total_amount || 0,
          "GST Rate (%)": inv.tax_rate ?? 5,
          "GST Amount (₹)": inv.tax_amount || 0,
          "Grand Total (₹)": inv.total_amount || 0,
          "Payment Status": inv.payment_status || "Pending",
          "Credit Days": inv.credit_days || 30,
          "Due Date": inv.due_date || "N/A"
        }));
        const wsInvoices = createAutoWidthSheet(formattedInvoices);
        XLSX.utils.book_append_sheet(wb, wsInvoices, "Sales Tax Invoices");
      }

      // 6. PAYMENTS & VOUCHERS (Active Module: /payments)
      let paymentsData: any[] = [];
      try {
        const live = await fetchApi<any[]>("/payments");
        if (Array.isArray(live) && live.length > 0) paymentsData = live;
      } catch {}

      if (paymentsData.length > 0) {
        const formattedPayments = paymentsData.map((p, idx) => ({
          "No.": idx + 1,
          "Voucher #": p.voucher_no || p.id || `VCH-${idx + 1}`,
          "Voucher Date": p.date || "N/A",
          "Party Name": p.party_name || "N/A",
          "Type": p.type || "Payment Out",
          "Linked Source": p.linked_source || "ON-ACCOUNT",
          "Amount (₹)": p.amount || 0,
          "Discount / Kasar (₹)": p.kasar_amount || 0,
          "Payment Mode": p.mode || "Bank Transfer",
          "Ref / UTR #": p.ref_no || "N/A",
          "Notes": p.notes || ""
        }));
        const wsPayments = createAutoWidthSheet(formattedPayments);
        XLSX.utils.book_append_sheet(wb, wsPayments, "Payment Vouchers");
      }

      // 7. FACTORY EXPENSES (Active Module: /expenses)
      let expensesData: any[] = [];
      try {
        const live = await fetchApi<any[]>("/expenses");
        if (Array.isArray(live) && live.length > 0) expensesData = live;
      } catch {}

      if (expensesData.length > 0) {
        const formattedExpenses = expensesData.map((x, idx) => ({
          "No.": idx + 1,
          "Expense #": x.id || `EXP-${idx + 1}`,
          "Expense Date": x.date || "N/A",
          "Category": x.category || "Factory Expense",
          "Amount (₹)": x.amount || 0,
          "Payment Mode": x.payment_mode || "Cash",
          "Paid To / Beneficiary": x.paid_to || "N/A",
          "Bill / Ref #": x.bill_no || "N/A",
          "Remarks": x.notes || ""
        }));
        const wsExpenses = createAutoWidthSheet(formattedExpenses);
        XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");
      }

      // 8. MASTER CATEGORIES (Active Module: /categories)
      let categoriesData: any[] = [];
      try {
        const live = await fetchApi<any[]>("/categories");
        if (Array.isArray(live) && live.length > 0) categoriesData = live;
      } catch {}

      if (categoriesData.length > 0) {
        const formattedCategories = categoriesData.map((cat, idx) => ({
          "No.": idx + 1,
          "Category Name": cat.name || "N/A",
          "Module": cat.module === "material" ? "Material & Purchase" : "Expenses",
          "Status": "Active"
        }));
        const wsCategories = createAutoWidthSheet(formattedCategories);
        XLSX.utils.book_append_sheet(wb, wsCategories, "Categories Master");
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

  // Export Complete Backup to Structured JSON Database File (.json)
  const handleExportJsonBackup = async () => {
    setIsExportingJson(true);
    try {
      const [
        liveVendors,
        livePurchases,
        liveChallans,
        liveInvoices,
        livePayments,
        liveExpenses,
        liveWorkers,
        liveCategories
      ] = await Promise.all([
        fetchApi<any[]>("/vendors").catch(() => []),
        fetchApi<any[]>("/purchases").catch(() => []),
        fetchApi<any[]>("/sales-challans").catch(() => []),
        fetchApi<any[]>("/sales-invoices").catch(() => []),
        fetchApi<any[]>("/payments").catch(() => []),
        fetchApi<any[]>("/expenses").catch(() => []),
        fetchApi<any[]>("/employees").catch(() => []),
        fetchApi<any[]>("/categories").catch(() => []),
      ]);

      const backupBundle = {
        metadata: {
          software: "Om Sai ERP - Textile Manufacturing & Billing",
          export_timestamp: new Date().toISOString(),
          company_id: getStoredCompanyId() || "comp-001",
          company_name: formData.company_name || "Shiv Creation",
          total_modules: 8
        },
        company_profile: formData,
        parties_and_customers: liveVendors,
        purchases_and_materials: livePurchases,
        sales_delivery_challans: liveChallans,
        sales_tax_invoices: liveInvoices,
        payments_and_vouchers: livePayments,
        factory_expenses: liveExpenses,
        workers_and_karigars: liveWorkers,
        categories_master: liveCategories
      };

      const jsonStr = JSON.stringify(backupBundle, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `Om_Sai_ERP_Full_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSaveSuccessMsg("Full JSON database backup downloaded successfully!");
      setTimeout(() => setSaveSuccessMsg(""), 3500);
    } catch (err) {
      console.error("JSON backup error:", err);
      alert("Failed to export JSON backup file.");
    } finally {
      setIsExportingJson(false);
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
              : "Login User ID & Profile updated successfully! You can now log in with this new User ID."
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
            company_name: formData.company_name?.trim() || "",
            brand_name: formData.brand_name?.trim(),
            tagline: formData.tagline?.trim(),
            owner_name: settingsToSave.owner_name,
            phone: formData.phone?.trim(),
            alt_phone: formData.alt_phone?.trim(),
            email: formData.email?.trim(),
            username: newUsername,
            address: formData.address?.trim(),
            city_state: formData.city_state?.trim(),
            pincode: formData.pincode?.trim(),
            msme_no: formData.msme_no?.trim(),
            website: formData.website?.trim(),
            gstin: formData.gstin?.trim(),
            pan: formData.pan?.trim(),

            // Bank Details
            bank_name: formData.bank_name?.trim(),
            account_holder: formData.account_holder?.trim(),
            account_no: formData.account_no?.trim(),
            account_type: formData.account_type?.trim(),
            ifsc: formData.ifsc?.trim(),
            branch_name: formData.branch_name?.trim(),
            upi_id: formData.upi_id?.trim(),
            qr_code_image: formData.qr_code_image,

            // Invoicing & Printing
            invoice_title: formData.invoice_title?.trim(),
            challan_title: formData.challan_title?.trim(),
            invoice_prefix: formData.invoice_prefix?.trim(),
            next_invoice_no: formData.next_invoice_no?.trim(),
            challan_prefix: formData.challan_prefix?.trim(),
            next_challan_no: formData.next_challan_no?.trim(),
            hsn_sac_code: formData.hsn_sac_code?.trim(),
            gst_rate: formData.gst_rate?.trim(),
            payment_terms: formData.payment_terms?.trim(),
            signatory_label: formData.signatory_label?.trim(),
            eway_threshold: formData.eway_threshold?.trim(),
            print_qr: formData.print_qr,
            terms_conditions: formData.terms_conditions?.trim(),
            custom_labels: settingsToSave.custom_labels,
            settings_json: settingsToSave
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
    <div className="w-full font-sans text-slate-800 pb-[84px] space-y-4 px-1 sm:px-0">
      {/* Toast Notification Banner */}
      {saveSuccessMsg && (
        <div className="fixed top-16 right-5 z-50 inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Settings Card: Professional Vertical Sidebar + Content Layout */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col md:flex-row min-h-[640px]">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 lg:w-72 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-200 p-3 sm:p-4 shrink-0 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Mobile Horizontal / Responsive View */}
            <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: "Company", label: "Company", icon: Building2 },
                { id: "Invoice & Bill", label: "Invoice & Bill", icon: Receipt },
                { id: "Custom Fields", label: "Bill Fields", icon: Sparkles },
                { id: "Shortcuts", label: "Shortcuts", icon: Keyboard },
                { id: "Login & Password", label: "Security", icon: KeyRound },
                { id: "Data & Storage", label: "Data", icon: Database },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setAuthErrorMsg("");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop Clean Sidebar */}
            <div className="hidden md:block space-y-1">
              {/* Company */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("Company");
                  setAuthErrorMsg("");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "Company"
                    ? "bg-blue-600 text-white shadow-xs font-black"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Company Profile</span>
                </div>
                {activeTab === "Company" && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
              </button>

              {/* Invoice & Bill */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("Invoice & Bill");
                  setAuthErrorMsg("");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "Invoice & Bill"
                    ? "bg-blue-600 text-white shadow-xs font-black"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 shrink-0" />
                  <span>Invoice & Bill</span>
                </div>
                {activeTab === "Invoice & Bill" && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
              </button>

              {/* Bill Fields */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("Custom Fields");
                  setAuthErrorMsg("");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "Custom Fields"
                    ? "bg-blue-600 text-white shadow-xs font-black"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Bill Fields</span>
                </div>
                {activeTab === "Custom Fields" && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
              </button>

              {/* Shortcuts */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("Shortcuts");
                  setAuthErrorMsg("");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "Shortcuts"
                    ? "bg-blue-600 text-white shadow-xs font-black"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Keyboard className="w-4 h-4 shrink-0" />
                  <span>Shortcuts</span>
                </div>
                {activeTab === "Shortcuts" && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
              </button>

              {/* Login & Password */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("Login & Password");
                  setAuthErrorMsg("");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "Login & Password"
                    ? "bg-blue-600 text-white shadow-xs font-black"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span>Login & Password</span>
                </div>
                {activeTab === "Login & Password" && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
              </button>

              {/* Data & Storage */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("Data & Storage");
                  setAuthErrorMsg("");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "Data & Storage"
                    ? "bg-blue-600 text-white shadow-xs font-black"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 shrink-0" />
                  <span>Data & Storage</span>
                </div>
                {activeTab === "Data & Storage" && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
              </button>
            </div>
          </div>
        </aside>

        {/* Right Main Content Body */}
        <div className="flex-1 p-5 sm:p-7 space-y-4 overflow-y-auto" onKeyDown={handleFormKeyDown}>
          {/* Feedback Error (for Auth Tab) */}
          {authErrorMsg && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>{authErrorMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: COMPANY (SINGLE COLUMN MODERN LAYOUT)                             */}
          {/* ========================================================================= */}
          {activeTab === "Company" && (
            <div className="max-w-3xl space-y-3.5 animate-in fade-in duration-100">
              {/* Company Legal Name */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Company Legal Name *</label>
                <div className="w-full">
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

              {/* GSTIN Number */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">GST Number (GSTIN)</label>
                <div className="w-full">
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

              {/* PAN Number */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">PAN Number</label>
                <div className="w-full">
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

              {/* Phone / Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Primary Mobile *</label>
                <div className="w-full">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Billing / Office Email</label>
                <div className="w-full">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Factory Address *</label>
                <div className="w-full">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">City, State & PIN</label>
                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">MSME Udyam Reg.</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.msme_no}
                    onChange={(e) => setFormData({ ...formData, msme_no: e.target.value.toUpperCase() })}
                    placeholder="UDYAM-GJ-24-0091823"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs uppercase"
                  />
                </div>
              </div>

              {/* Bank Details Section Divider */}
              <div className="pt-3 pb-1 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Bank Details
                </h4>
              </div>

              {/* Bank Name */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Primary Bank Name</label>
                <div className="w-full">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Account Holder Name</label>
                <div className="w-full">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Account Number</label>
                <div className="w-full">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Account Type</label>
                <div className="w-full relative" ref={accTypeRef}>
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">IFSC & Branch</label>
                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">UPI ID (VPA)</label>
                <div className="w-full">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start text-xs pt-1">
                <div className="pt-1">
                  <label className="font-bold text-slate-600 block">UPI Payment QR</label>
                  <span className="text-[10px] text-slate-400">Printed on invoices</span>
                </div>
                <div className="w-full space-y-3">
                  {formData.qr_code_image ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                      <div className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-200 shrink-0 shadow-2xs flex items-center justify-center">
                        <img
                          src={formData.qr_code_image}
                          alt="Bank UPI QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-1.5 text-center sm:text-left flex-1">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Active on Invoices</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Customers can scan this QR code to make immediate UPI payments.
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
                        className="flex-1 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3 flex items-center gap-3 bg-white hover:bg-blue-50/20 cursor-pointer transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-blue-600 shadow-2xs shrink-0">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Upload QR Image</p>
                          <p className="text-[10px] text-slate-400">PNG, JPG or QR screenshot</p>
                        </div>
                      </label>

                      {/* Auto-generate from UPI */}
                      <button
                        type="button"
                        onClick={handleAutoGenerateQr}
                        className="h-14 px-3 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors shrink-0 shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Auto QR</span>
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
          )}

          {/* ========================================================================= */}
          {/* TAB 2: INVOICE & BILL (SINGLE COLUMN MODERN LAYOUT)                       */}
          {/* ========================================================================= */}
          {activeTab === "Invoice & Bill" && (
            <div className="max-w-3xl space-y-3.5 animate-in fade-in duration-100">
              {/* Tax Invoice Title */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Tax Invoice Title</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.invoice_title}
                    onChange={(e) => setFormData({ ...formData, invoice_title: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Delivery Challan Title */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Delivery Challan Title</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.challan_title}
                    onChange={(e) => setFormData({ ...formData, challan_title: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Sales Invoice Series & No. */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Sales Invoice Series & No.</label>
                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={formData.sales_invoice_prefix}
                    onChange={(e) => setFormData({ ...formData, sales_invoice_prefix: e.target.value })}
                    placeholder="SC/26/"
                    className="flex-1 h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                  <input
                    type="number"
                    value={formData.next_sales_invoice_no}
                    onChange={(e) => setFormData({ ...formData, next_sales_invoice_no: e.target.value })}
                    placeholder="Next: 101"
                    className="w-full sm:w-28 h-9 px-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Invoice Series & No. */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Invoice Series & No.</label>
                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={formData.invoice_prefix}
                    onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                    placeholder="INV/26-27/"
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

              {/* Challan Series & No. */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Challan Series & No.</label>
                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">HSN / SAC Code</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.hsn_sac_code}
                    onChange={(e) => setFormData({ ...formData, hsn_sac_code: e.target.value })}
                    placeholder="998822 (Textile Jobwork)"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Default GST Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Default GST Rate (%)</label>
                <div className="w-full relative" ref={gstRef}>
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

              {/* Default Payment Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Default Payment Terms</label>
                <div className="w-full relative" ref={termsRef}>
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

              {/* Authorized Signatory */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Authorized Signatory</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.signatory_label}
                    onChange={(e) => setFormData({ ...formData, signatory_label: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* QR Code on Bills */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">QR Code on Bills</label>
                <div className="w-full flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="print_qr_toggle"
                    checked={formData.print_qr}
                    onChange={(e) => setFormData({ ...formData, print_qr: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="print_qr_toggle" className="text-xs font-medium text-slate-800 cursor-pointer select-none">
                    Automatically print Bank UPI QR code on invoices
                  </label>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start text-xs pt-1">
                <label className="font-bold text-slate-600 pt-1.5">Terms & Conditions</label>
                <div className="w-full">
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
          {/* TAB 3: BILL & CHALLAN FIELDS (UNIFIED SINGLE COLUMN MODERN LAYOUT)        */}
          {/* ========================================================================= */}
          {activeTab === "Custom Fields" && (
            <div className="max-w-3xl space-y-3.5 animate-in fade-in duration-100">
              {/* Header Bar & Reset Button */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Bill & Challan Field Names
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Changes automatically apply across all pages (Sales, Purchases, Invoices, Challans & Ledger)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    isUserEditingRef.current = true;
                    setFormData((prev: any) => ({
                      ...prev,
                      custom_labels: {
                        ...(prev.custom_labels || {}),
                        party_name: "Party Name",
                        supplier_name: "Supplier / Mill",
                        item_name: "Particulars",
                        item_unit: "Item",
                        quantity: "Qty",
                        weight: "Weight",
                        cartoon: "Cartoon",
                        rate: "Rate (₹)",
                        total_amount: "Amount (₹)",
                        challan_no: "Challan No",
                        bill_no: "Bill / Invoice No",
                        hsn_code: "HSN Code",
                        design_no: "Particulars",
                        sales_party: "Party Name",
                        purchase_supplier: "Supplier / Mill",
                        sales_item: "Particulars",
                        purchase_item: "Particulars",
                        sales_qty: "Qty",
                        purchase_qty: "Qty",
                        sales_rate: "Rate (₹)",
                        purchase_rate: "Rate (₹)",
                        sales_total: "Amount (₹)",
                        purchase_total: "Amount (₹)",
                        sales_bill_no: "Bill / Invoice No",
                        purchase_bill_no: "Challan No"
                      }
                    }));
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0"
                >
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              {/* 1. Customer / Party */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Customer / Party</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.custom_labels?.party_name ?? formData.custom_labels?.sales_party ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      isUserEditingRef.current = true;
                      setFormData((prev: any) => ({
                        ...prev,
                        custom_labels: { ...(prev.custom_labels || {}), party_name: v, sales_party: v }
                      }));
                    }}
                    placeholder="e.g. Party Name"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* 2. Supplier / Mill */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Supplier / Mill</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.custom_labels?.supplier_name ?? formData.custom_labels?.purchase_supplier ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      isUserEditingRef.current = true;
                      setFormData((prev: any) => ({
                        ...prev,
                        custom_labels: { ...(prev.custom_labels || {}), supplier_name: v, purchase_supplier: v }
                      }));
                    }}
                    placeholder="e.g. Supplier / Mill"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* 3. Item / Particulars */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Item / Particulars</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.custom_labels?.item_name ?? formData.custom_labels?.design_no ?? formData.custom_labels?.sales_item ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      isUserEditingRef.current = true;
                      setFormData((prev: any) => ({
                        ...prev,
                        custom_labels: {
                          ...(prev.custom_labels || {}),
                          item_name: v,
                          design_no: v,
                          sales_item: v,
                          purchase_item: v
                        }
                      }));
                    }}
                    placeholder="e.g. Particulars / Design No"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* 4. Item / Takka */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Item / Takka</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.custom_labels?.item_unit ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      isUserEditingRef.current = true;
                      setFormData((prev: any) => ({
                        ...prev,
                        custom_labels: { ...(prev.custom_labels || {}), item_unit: v }
                      }));
                    }}
                    placeholder="e.g. Item / Takka"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* 5. Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Quantity</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.custom_labels?.quantity ?? formData.custom_labels?.sales_qty ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      isUserEditingRef.current = true;
                      setFormData((prev: any) => ({
                        ...prev,
                        custom_labels: {
                          ...(prev.custom_labels || {}),
                          quantity: v,
                          sales_qty: v,
                          purchase_qty: v
                        }
                      }));
                    }}
                    placeholder="e.g. Qty / Meters"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* 6. Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Weight</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.custom_labels?.weight ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      isUserEditingRef.current = true;
                      setFormData((prev: any) => ({
                        ...prev,
                        custom_labels: { ...(prev.custom_labels || {}), weight: v }
                      }));
                    }}
                    placeholder="e.g. Weight"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* 7. Cartoon */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Cartoon</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.custom_labels?.cartoon ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      isUserEditingRef.current = true;
                      setFormData((prev: any) => ({
                        ...prev,
                        custom_labels: { ...(prev.custom_labels || {}), cartoon: v }
                      }));
                    }}
                    placeholder="e.g. Cartoon / Box / Roll"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* 8. Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Rate</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.custom_labels?.rate ?? formData.custom_labels?.sales_rate ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      isUserEditingRef.current = true;
                      setFormData((prev: any) => ({
                        ...prev,
                        custom_labels: {
                          ...(prev.custom_labels || {}),
                          rate: v,
                          sales_rate: v,
                          purchase_rate: v
                        }
                      }));
                    }}
                    placeholder="e.g. Rate (₹)"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* 9. Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Amount</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.custom_labels?.total_amount ?? formData.custom_labels?.sales_total ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      isUserEditingRef.current = true;
                      setFormData((prev: any) => ({
                        ...prev,
                        custom_labels: {
                          ...(prev.custom_labels || {}),
                          total_amount: v,
                          sales_total: v,
                          purchase_total: v
                        }
                      }));
                    }}
                    placeholder="e.g. Amount (₹)"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* 10. Challan No */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Challan No</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.custom_labels?.challan_no ?? formData.custom_labels?.purchase_bill_no ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      isUserEditingRef.current = true;
                      setFormData((prev: any) => ({
                        ...prev,
                        custom_labels: {
                          ...(prev.custom_labels || {}),
                          challan_no: v,
                          purchase_bill_no: v
                        }
                      }));
                    }}
                    placeholder="e.g. Challan No"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* 11. Bill / Invoice No */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Bill / Invoice No</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.custom_labels?.bill_no ?? formData.custom_labels?.sales_bill_no ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      isUserEditingRef.current = true;
                      setFormData((prev: any) => ({
                        ...prev,
                        custom_labels: {
                          ...(prev.custom_labels || {}),
                          bill_no: v,
                          sales_bill_no: v
                        }
                      }));
                    }}
                    placeholder="e.g. Bill / Invoice No"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* 12. HSN / SAC Code */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">HSN / SAC Code</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={formData.custom_labels?.hsn_code ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      isUserEditingRef.current = true;
                      setFormData((prev: any) => ({
                        ...prev,
                        custom_labels: { ...(prev.custom_labels || {}), hsn_code: v }
                      }));
                    }}
                    placeholder="e.g. HSN / SAC Code"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: KEYBOARD SHORTCUTS & MAC/WIN HOTKEYS (CLEAN MODERN LAYOUT)        */}
          {/* ========================================================================= */}
          {activeTab === "Shortcuts" && (
            <div className="max-w-3xl space-y-3.5 animate-in fade-in duration-100">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Keyboard Shortcuts
                  </span>
                  {isMacDevice ? (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">
                      Mac (Option ⌥ / ⌘)
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-bold text-blue-700 border border-blue-200">
                      Windows (Alt / Ctrl)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const defs = resetShortcuts();
                    setShortcutsList(defs);
                    setRecordingShortcutId(null);
                    setShortcutFeedbackMsg("All shortcuts reset to defaults successfully!");
                    setTimeout(() => setShortcutFeedbackMsg(null), 2500);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              {/* Feedback Success Notification */}
              {shortcutFeedbackMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{shortcutFeedbackMsg}</span>
                </div>
              )}

              {/* Shortcuts Items */}
              {shortcutsList.map((s) => {
                const isRecording = recordingShortcutId === s.id;
                const keyBadges = formatShortcutDisplay(s, isMacDevice);

                return (
                  <div
                    key={s.id}
                    className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1.5 sm:gap-3 items-center text-xs"
                  >
                    <label className="font-bold text-slate-600">{s.labelEn}</label>
                    <div className="flex items-center gap-2">
                      {isRecording ? (
                        <div className="flex items-center gap-1.5 animate-pulse bg-amber-100 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-300 font-bold text-xs">
                          <span>Press any key...</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRecordingShortcutId(null);
                            }}
                            className="text-amber-700 hover:text-amber-950 ml-1 font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            {keyBadges.map((k, kIdx) => (
                              <kbd
                                key={kIdx}
                                className="min-w-[28px] h-8 px-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 flex items-center justify-center shadow-2xs"
                              >
                                {k}
                              </kbd>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setRecordingShortcutId(s.id)}
                            className="h-8 px-3 bg-white hover:bg-slate-50 text-blue-600 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Set Key</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Global Commands Section Divider */}
              <div className="pt-3 pb-1 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Global Commands
                </h4>
              </div>

              {/* Quick Action Search Menu */}
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1.5 sm:gap-3 items-center text-xs">
                <label className="font-bold text-slate-600">Quick Action Search</label>
                <div className="flex items-center gap-1">
                  <kbd className="min-w-[28px] h-8 px-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 flex items-center justify-center shadow-2xs">
                    {isMacDevice ? "⌘ Cmd" : "Ctrl"}
                  </kbd>
                  <kbd className="min-w-[28px] h-8 px-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 flex items-center justify-center shadow-2xs">
                    K
                  </kbd>
                </div>
              </div>

              {/* Shortcut Guide Popup */}
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1.5 sm:gap-3 items-center text-xs">
                <label className="font-bold text-slate-600">Shortcut Guide Popup</label>
                <div className="flex items-center gap-1">
                  <kbd className="min-w-[28px] h-8 px-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 flex items-center justify-center shadow-2xs">
                    ?
                  </kbd>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* TAB: LOGIN & PASSWORD (Clean Single Column Layout) */}
          {/* ========================================================================= */}
          {activeTab === "Login & Password" && (
            <div className="max-w-3xl space-y-3.5 animate-in fade-in duration-100">
              {/* User ID */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Username / ID *</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={authData.username}
                    onChange={(e) => {
                      isUserEditingRef.current = true;
                      setAuthData({ ...authData, username: e.target.value });
                    }}
                    placeholder="e.g. shivcreation or admin"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    required
                  />
                </div>
              </div>

              {/* Display Name */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Display Name</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={authData.name}
                    onChange={(e) => {
                      isUserEditingRef.current = true;
                      setAuthData({ ...authData, name: e.target.value });
                    }}
                    placeholder="Hiren Sutariya"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Password Section Divider */}
              <div className="pt-3 pb-1 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Change Password
                </h4>
              </div>

              {/* Current Password */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Current Password</label>
                <div className="w-full relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={authData.currentPassword}
                    onChange={(e) => setAuthData({ ...authData, currentPassword: e.target.value })}
                    placeholder="Current password (leave blank to keep current)"
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">New Password</label>
                <div className="w-full relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={authData.newPassword}
                    onChange={(e) => setAuthData({ ...authData, newPassword: e.target.value })}
                    placeholder="New password"
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1.5 sm:gap-3 items-start sm:items-center text-xs">
                <label className="font-bold text-slate-600">Confirm Password</label>
                <div className="w-full relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={authData.confirmPassword}
                    onChange={(e) => setAuthData({ ...authData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
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
          )}

          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* TAB 5: DATA & STORAGE MAINTENANCE (Clean Single Column Layout) */}
          {/* ========================================================================= */}
          {activeTab === "Data & Storage" && (
            <div className="max-w-3xl space-y-3.5 animate-in fade-in duration-100">
              {/* 1. Excel Backup */}
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1.5 sm:gap-3 items-center text-xs">
                <label className="font-bold text-slate-600">Excel Data Backup</label>
                <div>
                  <button
                    type="button"
                    disabled={isExportingExcel}
                    onClick={handleExportExcelBackup}
                    className="h-9 px-3.5 bg-white hover:bg-slate-50 text-emerald-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Download className={`w-3.5 h-3.5 ${isExportingExcel ? "animate-bounce" : ""}`} />
                    <span>{isExportingExcel ? "Exporting Excel..." : "Download Excel Backup (.xlsx)"}</span>
                  </button>
                </div>
              </div>

              {/* 2. Full Cloud Database Backup */}
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1.5 sm:gap-3 items-center text-xs">
                <label className="font-bold text-slate-600">Cloud Database</label>
                <div>
                  <button
                    type="button"
                    disabled={isExportingJson}
                    onClick={handleExportJsonBackup}
                    className="h-9 px-3.5 bg-white hover:bg-slate-50 text-blue-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Download className={`w-3.5 h-3.5 ${isExportingJson ? "animate-bounce" : ""}`} />
                    <span>{isExportingJson ? "Exporting JSON..." : "Download JSON Backup"}</span>
                  </button>
                </div>
              </div>

              {/* 3. Clear Temporary Cache */}
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1.5 sm:gap-3 items-center text-xs">
                <label className="font-bold text-slate-600">System Cache</label>
                <div>
                  <button
                    type="button"
                    disabled={isClearingCache}
                    onClick={handleClearCache}
                    className="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isClearingCache ? "animate-spin" : ""}`} />
                    <span>{isClearingCache ? "Cleaning..." : "Clear Cache Now"}</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone Divider */}
              <div className="pt-3 pb-1 border-t border-slate-200">
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wide">
                  Danger Zone
                </h4>
              </div>

              {/* 4. Factory Reset / Erase All Data */}
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1.5 sm:gap-3 items-center text-xs">
                <label className="font-bold text-slate-600">Factory Reset</label>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setEraseConfirmInput("");
                      setIsEraseModalOpen(true);
                    }}
                    className="h-9 px-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Erase All Data</span>
                  </button>
                </div>
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
          activeTab === "Shortcuts" ? (
            <button
              type="button"
              onClick={() => {
                const defs = resetShortcuts();
                setShortcutsList(defs);
                setRecordingShortcutId(null);
                setShortcutFeedbackMsg("All shortcuts reset to defaults successfully!");
                setTimeout(() => setShortcutFeedbackMsg(null), 2500);
              }}
              className="px-4 py-2 font-extrabold rounded-xl text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2 cursor-pointer transition-all shadow-xs border border-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Defaults</span>
            </button>
          ) : activeTab === "Data & Storage" ? (
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
