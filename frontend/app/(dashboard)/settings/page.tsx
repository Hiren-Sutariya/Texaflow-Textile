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
  ShieldAlert
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

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

export default function SettingsPage() {
  const { user, updateUserSession } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);

  // Active Subtab
  const [activeTab, setActiveTab] = useState<
    "Company & Address" | "Bank & GST" | "Invoice & Bill" | "Login & Password" | "Data & Storage"
  >("Company & Address");

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
  const [storageInfo, setStorageInfo] = useState({ totalKb: "0.0", itemsCount: 0 });

  // Custom Dropdowns
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isGstOpen, setIsGstOpen] = useState(false);
  const [isAccTypeOpen, setIsAccTypeOpen] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);
  const gstRef = useRef<HTMLDivElement>(null);
  const accTypeRef = useRef<HTMLDivElement>(null);

  // Form State: Company, Bank & Invoice Details
  const [formData, setFormData] = useState({
    // 1. Company & Address
    company_name: "Om Sai Enterprise",
    brand_name: "OM SAI",
    tagline: "High Precision Multi-Head Embroidery Job Work",
    phone: "9978987181",
    alt_phone: "",
    email: "contact@omsaienterprise.com",
    address: "Plot No. 104-106, GIDC Khatodara Industrial Estate",
    city_state: "Surat, Gujarat",
    pincode: "395002",
    msme_no: "UDYAM-GJ-24-0091823",
    website: "",

    // 2. Bank & GST
    gstin: "24AAAFA1234A1Z5",
    pan: "AAAFA1234A",
    bank_name: "HDFC Bank Ltd",
    account_holder: "Om Sai Enterprise",
    account_no: "50200012345678",
    account_type: "Current Account",
    ifsc: "HDFC0000123",
    branch_name: "Ring Road Branch, Surat",
    upi_id: "omsaienterprise@hdfcbank",
    qr_code_image: "",

    // 3. Invoice & Bill
    invoice_title: "TAX INVOICE / JOBWORK BILL",
    challan_title: "DELIVERY CHALLAN / TAKKA DISPATCH SLIP",
    invoice_prefix: "OMS/26-27/",
    next_invoice_no: "101",
    challan_prefix: "DC/26-27/",
    next_challan_no: "101",
    hsn_sac_code: "998822 (Textile Jobwork)",
    gst_rate: "5% (Textile Embroidery Jobwork)",
    payment_terms: "Due on Receipt",
    signatory_label: "For Om Sai Enterprise (Authorized Signatory)",
    eway_threshold: "50000",
    print_qr: true,
    terms_conditions:
      "1. Goods once delivered will not be taken back without inspection.\n2. Payment strictly due as per credit terms.\n3. Subject to Surat Jurisdiction only."
  });

  // 4. Form State: Login & Password
  const [authData, setAuthData] = useState({
    username: "owner@om-sai.com",
    name: "Hiren Sutariya",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
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

  // Load saved settings & credentials on mount
  useEffect(() => {
    setHasMounted(true);

    try {
      const saved = localStorage.getItem("app_settings_om_sai");
      if (saved) {
        setFormData((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {}

    const fetchCredentials = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/credentials`);
        if (res.ok) {
          const data = await res.json();
          if (data.username) {
            setAuthData((prev) => ({
              ...prev,
              username: data.username,
              name: data.name || prev.name
            }));
          }
        }
      } catch (e) {
        if (user) {
          setAuthData((prev) => ({
            ...prev,
            username: user.email || prev.username,
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

  // Storage Info Calculator
  const updateStorageInfo = () => {
    if (typeof window === "undefined") return;
    try {
      let totalBytes = 0;
      const count = localStorage.length;
      for (let i = 0; i < count; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || "";
          totalBytes += (key.length + val.length) * 2;
        }
      }
      setStorageInfo({
        totalKb: (totalBytes / 1024).toFixed(1),
        itemsCount: count
      });
    } catch (e) {
      console.error("Storage calculation error:", e);
    }
  };

  useEffect(() => {
    if (hasMounted) {
      updateStorageInfo();
    }
  }, [hasMounted, activeTab]);

  // Handle Clear Cache
  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      if (typeof window !== "undefined" && "caches" in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.clear();
      }

      const tempKeys = ["next_cache", "temp_query_cache", "cached_filters"];
      tempKeys.forEach((k) => localStorage.removeItem(k));

      updateStorageInfo();
      setSaveSuccessMsg("Cache cleared successfully! Software is optimized.");
      setTimeout(() => setSaveSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Cache clear failed:", err);
      alert("Failed to clear some cache entries.");
    } finally {
      setIsClearingCache(false);
    }
  };

  // Handle Erase All Software Data (Factory Reset)
  const handleEraseAllData = async () => {
    if (eraseConfirmInput.trim().toUpperCase() !== "DELETE") {
      alert("Please type DELETE to confirm data erasure.");
      return;
    }

    setIsErasing(true);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.clear();
        window.sessionStorage.clear();
        if ("caches" in window) {
          const cacheKeys = await window.caches.keys();
          await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
        }
      }

      setSaveSuccessMsg("All software data has been erased. Redirecting...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      console.error("Data erase failed:", err);
      alert("Failed to erase all data. Please check browser permissions.");
      setIsErasing(false);
    }
  };

  // Main Save Handler (Triggered from Static Bottom Bar)
  const handleSaveAll = async () => {
    if (isSavingRef.current) return;
    setAuthErrorMsg("");
    setSaveSuccessMsg("");

    // If on Login & Password tab, save credentials to backend DB
    if (activeTab === "Login & Password") {
      if (!authData.currentPassword) {
        setAuthErrorMsg("Please enter your current password to authorize changes.");
        return;
      }

      if (!authData.newPassword || !authData.confirmPassword) {
        setAuthErrorMsg("Please enter new password in both fields to confirm.");
        return;
      }

      if (authData.newPassword.length < 4) {
        setAuthErrorMsg("New password must be at least 4 characters long.");
        return;
      }

      if (authData.newPassword !== authData.confirmPassword) {
        setAuthErrorMsg("New Password and Confirm Password do not match. Please re-enter.");
        return;
      }

      isSavingRef.current = true;
      setIsSaving(true);

      try {
        const res = await fetch(`${API_BASE_URL}/auth/change-credentials`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_password: authData.currentPassword,
            new_username: authData.username.trim(),
            name: authData.name.trim(),
            new_password: authData.newPassword.trim()
          })
        });

        const data = await res.json();

        if (res.ok) {
          setSaveSuccessMsg("Login ID & Password updated successfully in database!");
          setAuthData((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          }));

          updateUserSession({
            email: data.user?.username || authData.username,
            name: data.user?.name || authData.name
          });

          setTimeout(() => setSaveSuccessMsg(""), 3500);
        } else {
          setAuthErrorMsg(data.detail || "Failed to update login credentials.");
        }
      } catch (err) {
        setAuthErrorMsg("Cannot connect to backend server on port 8000.");
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
      return;
    }

    // Otherwise save Settings (Company, Bank, Invoice) to LocalStorage
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      localStorage.setItem("app_settings_om_sai", JSON.stringify(formData));
      setSaveSuccessMsg("Settings saved successfully!");
      setTimeout(() => setSaveSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  if (!hasMounted) return null;

  return (
    <div className="w-full max-w-4xl font-sans text-slate-800 pb-24 space-y-4">
      {/* Toast Notification Banner */}
      {saveSuccessMsg && (
        <div className="fixed top-16 right-5 z-50 inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Settings Card: Seamless Tab Header (Zero Duplicate Heading!) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Seamless Navigation Tab Header (Directly at top of card, no redundant stacked header!) */}
        <div className="flex items-center gap-1 sm:gap-2 px-5 pt-3.5 border-b border-slate-200 bg-slate-50/60 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setActiveTab("Company & Address");
              setAuthErrorMsg("");
            }}
            className={`pb-3 px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "Company & Address"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Company & Address</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("Bank & GST");
              setAuthErrorMsg("");
            }}
            className={`pb-3 px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "Bank & GST"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Bank & GST</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("Invoice & Bill");
              setAuthErrorMsg("");
            }}
            className={`pb-3 px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "Invoice & Bill"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Invoice & Bill</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("Login & Password");
              setAuthErrorMsg("");
            }}
            className={`pb-3 px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "Login & Password"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Login & Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("Data & Storage");
              setAuthErrorMsg("");
            }}
            className={`pb-3 px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "Data & Storage"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data & Storage</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Feedback Error (for Auth Tab) */}
          {authErrorMsg && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>{authErrorMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: COMPANY & ADDRESS */}
          {/* ========================================================================= */}
          {activeTab === "Company & Address" && (
            <div className="space-y-3.5 animate-in fade-in duration-100">
              {/* Company Legal Name */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Company Legal Name *</label>
                <div className="max-w-md">
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="e.g. Om Sai Enterprise"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    required
                  />
                </div>
              </div>

              {/* Brand Name / Short Code */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Brand / Short Name</label>
                <div className="max-w-md">
                  <input
                    type="text"
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value.toUpperCase() })}
                    placeholder="e.g. OM SAI"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs uppercase"
                  />
                </div>
              </div>

              {/* Tagline / Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Tagline / Subtitle</label>
                <div className="max-w-md">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Primary Mobile *</label>
                <div className="max-w-md">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Billing / Office Email</label>
                <div className="max-w-md">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@omsaienterprise.com"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Factory Address */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Factory Address *</label>
                <div className="max-w-md">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">City, State & PIN</label>
                <div className="max-w-md flex items-center gap-2">
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
                    className="w-28 h-9 px-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* MSME Udyam Registration */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">MSME Udyam Reg. No.</label>
                <div className="max-w-md">
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
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BANK & GST (WITH QR CODE UPLOAD & GENERATE) */}
          {/* ========================================================================= */}
          {activeTab === "Bank & GST" && (
            <div className="space-y-3.5 animate-in fade-in duration-100">
              {/* GSTIN */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">GSTIN Number (15 Digits)</label>
                <div className="max-w-md">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">PAN Number</label>
                <div className="max-w-md">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Primary Bank Name</label>
                <div className="max-w-md">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Account Holder Name</label>
                <div className="max-w-md">
                  <input
                    type="text"
                    value={formData.account_holder}
                    onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                    placeholder="Om Sai Enterprise"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Account Number */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Current Account Number</label>
                <div className="max-w-md">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Account Type</label>
                <div className="max-w-md relative" ref={accTypeRef}>
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">IFSC & Branch Name</label>
                <div className="max-w-md flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.ifsc}
                    onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                    placeholder="HDFC0000123"
                    className="w-36 h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs uppercase"
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">UPI ID (VPA)</label>
                <div className="max-w-md">
                  <input
                    type="text"
                    value={formData.upi_id}
                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                    placeholder="omsaienterprise@hdfcbank"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* QR Code Option for Bank Payments (Requested by user!) */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-start text-xs pt-2 border-t border-slate-100">
                <div className="pt-1">
                  <label className="font-bold text-slate-700 block">Bank Payment QR Code</label>
                  <span className="text-[10px] text-slate-400">Prints on bill bottom</span>
                </div>
                <div className="max-w-md space-y-3">
                  {formData.qr_code_image ? (
                    <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="w-24 h-24 bg-white p-1.5 rounded-lg border border-slate-200 shrink-0 shadow-2xs flex items-center justify-center">
                        <img
                          src={formData.qr_code_image}
                          alt="Bank UPI QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Active on Invoices</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Customers can scan this QR code on physical bill to pay directly.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
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
          )}

          {/* ========================================================================= */}
          {/* TAB 3: INVOICE & BILL */}
          {/* ========================================================================= */}
          {activeTab === "Invoice & Bill" && (
            <div className="space-y-3.5 animate-in fade-in duration-100">
              {/* Invoice Title */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Tax Invoice Title</label>
                <div className="max-w-md">
                  <input
                    type="text"
                    value={formData.invoice_title}
                    onChange={(e) => setFormData({ ...formData, invoice_title: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Delivery Challan Title */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Delivery Challan Title</label>
                <div className="max-w-md">
                  <input
                    type="text"
                    value={formData.challan_title}
                    onChange={(e) => setFormData({ ...formData, challan_title: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Numbering Prefix Series */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Invoice Series & No.</label>
                <div className="max-w-md flex items-center gap-2">
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
                    className="w-28 h-9 px-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Challan Prefix Series */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Challan Series & No.</label>
                <div className="max-w-md flex items-center gap-2">
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
                    className="w-28 h-9 px-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* HSN / SAC Code */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">HSN / SAC Code</label>
                <div className="max-w-md">
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Default GST Rate (%)</label>
                <div className="max-w-md relative" ref={gstRef}>
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Default Payment Terms</label>
                <div className="max-w-md relative" ref={termsRef}>
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Authorized Signatory</label>
                <div className="max-w-md">
                  <input
                    type="text"
                    value={formData.signatory_label}
                    onChange={(e) => setFormData({ ...formData, signatory_label: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Print QR Code Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">QR Code on Invoices</label>
                <div className="max-w-md flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="print_qr_toggle"
                    checked={formData.print_qr}
                    onChange={(e) => setFormData({ ...formData, print_qr: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="print_qr_toggle" className="text-xs font-medium text-slate-800 cursor-pointer select-none">
                    Print Bank UPI QR Code automatically on bottom of invoices
                  </label>
                </div>
              </div>

              {/* Terms and Conditions Textarea */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-start text-xs pt-1">
                <label className="font-bold text-slate-600 pt-1.5">Terms & Conditions</label>
                <div className="max-w-md">
                  <textarea
                    rows={3}
                    value={formData.terms_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs resize-y"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: LOGIN & PASSWORD */}
          {/* ========================================================================= */}
          {activeTab === "Login & Password" && (
            <div className="space-y-3.5 animate-in fade-in duration-100">
              {/* User ID */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Login User ID / Email *</label>
                <div className="max-w-md">
                  <input
                    type="text"
                    value={authData.username}
                    onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                    placeholder="owner@om-sai.com"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    required
                  />
                </div>
              </div>

              {/* Display Name */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Display Name</label>
                <div className="max-w-md">
                  <input
                    type="text"
                    value={authData.name}
                    onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                    placeholder="Hiren Sutariya"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                  />
                </div>
              </div>

              {/* Current Password */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs pt-1 border-t border-slate-100">
                <label className="font-bold text-slate-600">Current Password *</label>
                <div className="max-w-md relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={authData.currentPassword}
                    onChange={(e) => setAuthData({ ...authData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full h-9 pl-3 pr-9 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    required
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
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">New Password *</label>
                <div className="max-w-md relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={authData.newPassword}
                    onChange={(e) => setAuthData({ ...authData, newPassword: e.target.value })}
                    placeholder="Minimum 4 characters"
                    className="w-full h-9 pl-3 pr-9 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    required
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

              {/* Confirm New Password (2-times entry) */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2.5 items-center text-xs">
                <label className="font-bold text-slate-600">Confirm Password *</label>
                <div className="max-w-md relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={authData.confirmPassword}
                    onChange={(e) => setAuthData({ ...authData, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full h-9 pl-3 pr-9 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                    required
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
          {/* TAB 5: DATA & STORAGE MAINTENANCE */}
          {/* ========================================================================= */}
          {activeTab === "Data & Storage" && (
            <div className="space-y-6 animate-in fade-in duration-100">
              {/* Storage Overview Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">Local Browser Storage</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Estimated storage consumed by cached offline records & application assets
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right">
                    <span className="text-xs font-black text-blue-600">{storageInfo.totalKb} KB</span>
                    <span className="text-[10px] text-slate-400 block font-bold">{storageInfo.itemsCount} Key Records</span>
                  </div>
                  <button
                    type="button"
                    onClick={updateStorageInfo}
                    title="Refresh Storage Info"
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 1. Clear Application Cache Card */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-bold text-slate-900">Clear Application Cache & Temp Storage</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                      ક્યારેક કેશ વધી જાય અથવા સોફ્ટવેર સ્લો ચાલવા લાગે તો અહીંથી અસ્થાયી (Temporary) કેશ અને સેશન મેમરી સાફ કરી શકાય છે. આનાથી તમારા જોબ ઓર્ડર, કારીગર હિસાબ કે વાઉચર્સનો કોઈ પણ બિઝનેસ ડેટા ડિલીટ થશે નહીં.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isClearingCache}
                    onClick={handleClearCache}
                    className="shrink-0 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isClearingCache ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Cleaning...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Clear Cache Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 2. Danger Zone - Erase All Software Data Card */}
              <div className="border border-red-200 bg-red-50/30 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-red-700 flex items-center gap-2">
                        <span>Danger Zone: Erase All Software Data (Factory Reset)</span>
                      </h4>
                      <p className="text-xs text-red-600/90 leading-relaxed max-w-xl">
                        સોફ્ટવેરનો તમામ ડેટા (જોબ ઓર્ડર્સ, કારીગરો, વેપારીઓ, ડિઝાઇન લાઇબ્રેરી, વાઉચર્સ, ખર્ચ અને સેટિંગ્સ) કાયમ માટે સાફ કરવા માટે આ ઓપ્શન છે. એકવાર ડેટા ભૂંસી નાખ્યા પછી પાછો મેળવી શકાશે નહીં.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEraseConfirmInput("");
                      setIsEraseModalOpen(true);
                    }}
                    className="shrink-0 px-4 py-2 bg-red-600 text-white hover:bg-red-700 font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
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

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1 font-medium">
              <p>⚠️ તમારા તમામ ઓર્ડર્સ, વાઉચર્સ, કારીગર હિસાબ, ખર્ચ અને સેટિંગ્સ હંમેશ માટે ડિલીટ થઈ જશે.</p>
              <p>ખાતરી કરવા માટે નીચે આપેલા બોક્સમાં મોટા અક્ષરોમાં <strong className="font-black text-red-800">DELETE</strong> લખો:</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Confirmation Word *</label>
              <input
                type="text"
                value={eraseConfirmInput}
                onChange={(e) => setEraseConfirmInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-red-500 shadow-2xs text-xs tracking-wider"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isErasing}
                onClick={() => {
                  setIsEraseModalOpen(false);
                  setEraseConfirmInput("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
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
      {/* STATIC / FIXED BOTTOM ACTIONS BAR (Identical to Image 1 & Vendors Form) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 lg:left-[250px] right-0 z-40 h-[57px] bg-white border-t border-slate-200 px-6 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
          <span>Synced</span>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === "Data & Storage" ? (
            <button
              type="button"
              onClick={updateStorageInfo}
              className="px-4 py-2 font-bold rounded-xl text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Storage Status</span>
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
          )}
        </div>
      </div>
    </div>
  );
}
