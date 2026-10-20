"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { getTenantItem, setTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import { VoiceTextarea } from "@/components/ui/VoiceTextarea";
import { TEXTILE_CREDIT_TERMS, parseCreditDays, calculateDueDate, getDueStatus, parseAnyDate } from "@/lib/creditTerms";
import { useLanguage } from "@/context/LanguageContext";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  Plus,
  Calendar,
  Upload,
  CreditCard,
  Clock,
  Sparkles,
  Package,
  Tag,
  Building2,
  Search,
  X,
  ShoppingCart,
  Trash2,
  Settings
} from "lucide-react";

const getTodayStr = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};



interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

function CustomDatePicker({
  value,
  onChange,
  placeholder = "DD-MM-YYYY",
  className = ""
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = useMemo(() => {
    return parseAnyDate(value) || new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState(() => initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => initialDate.getMonth());

  useEffect(() => {
    const parsed = parseAnyDate(value);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formattedDisplay = useMemo(() => {
    const parsed = parseAnyDate(value);
    if (!parsed) return "";
    const d = String(parsed.getDate()).padStart(2, "0");
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const y = parsed.getFullYear();
    return `${d}-${m}-${y}`;
  }, [value]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-xs select-none ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3.5 bg-white border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""
        }`}
      >
        <span className={`font-mono font-bold text-xs ${formattedDisplay ? "text-slate-900" : "text-slate-400"}`}>
          {formattedDisplay || placeholder}
        </span>
        <Calendar className="w-4 h-4 text-blue-600 shrink-0 ml-1.5" />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 w-64 space-y-2 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 pb-1.5 border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) {
                  setViewMonth(11);
                  setViewYear(viewYear - 1);
                } else {
                  setViewMonth(viewMonth - 1);
                }
              }}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="tracking-wide font-extrabold">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) {
                  setViewMonth(0);
                  setViewYear(viewYear + 1);
                } else {
                  setViewMonth(viewMonth + 1);
                }
              }}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {(() => {
              const firstDay = new Date(viewYear, viewMonth, 1).getDay();
              const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
              const items = [];

              for (let i = 0; i < firstDay; i++) {
                items.push(<div key={`empty-${i}`} className="h-7" />);
              }

              const parsedVal = parseAnyDate(value);
              const today = new Date();
              const todayStr = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}`;

              for (let day = 1; day <= daysInMonth; day++) {
                const dStr = String(day).padStart(2, "0");
                const mStr = String(viewMonth + 1).padStart(2, "0");
                const cellDateStr = `${dStr}-${mStr}-${viewYear}`;

                const isSelected = parsedVal
                  ? parsedVal.getDate() === day &&
                    parsedVal.getMonth() === viewMonth &&
                    parsedVal.getFullYear() === viewYear
                  : false;

                const isToday = cellDateStr === todayStr;

                items.push(
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      onChange(cellDateStr);
                      setIsOpen(false);
                    }}
                    className={`h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-2xs font-extrabold ring-2 ring-blue-500/20"
                        : isToday
                        ? "bg-blue-50 text-blue-700 font-extrabold border border-blue-200"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {day}
                  </button>
                );
              }
              return items;
            })()}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const d = String(now.getDate()).padStart(2, "0");
                const m = String(now.getMonth() + 1).padStart(2, "0");
                const y = now.getFullYear();
                onChange(`${d}-${m}-${y}`);
                setViewYear(y);
                setViewMonth(now.getMonth());
                setIsOpen(false);
              }}
              className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              Select Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function NewPurchaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);
  const { t } = useLanguage();

  const [isSaving, setIsSaving] = useState(false);
  const [billDate, setBillDate] = useState(() => getTodayStr());
  const [purchaseNo, setPurchaseNo] = useState("");
  const [vendorName, setVendorName] = useState("");
  const DEFAULT_CATEGORIES = [
    "Raw Material & Fabric",
    "Yarn & Threads",
    "Zari & Metallic Trims",
    "Lace, Borders & Latkan",
    "Choli & Garment Trims",
    "Packaging Materials"
  ];

  const [category, setCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const [itemsDescription, setItemsDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Pending">("Paid");
  const [paymentTerms, setPaymentTerms] = useState("Cash / Immediate");
  const [creditDays, setCreditDays] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [linkedOrder, setLinkedOrder] = useState("");
  const [billImage, setBillImage] = useState("");
  const [notes, setNotes] = useState("");

  // Vendor selection states
  const [vendorsList, setVendorsList] = useState<string[]>([]);
  const [rawVendors, setRawVendors] = useState<any[]>([]);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
        setIsVendorDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Function to refresh categories from tenant storage
  const loadStoredCategories = () => {
    const currentCid = getStoredCompanyId() || "comp-001";
    try {
      const stored = getTenantItem<string[]>("texaflow_material_categories", currentCid === "comp-001" ? "om_sai_material_categories" : undefined);
      if (Array.isArray(stored) && stored.length > 0) {
        setCategoriesList(Array.from(new Set([...DEFAULT_CATEGORIES, ...stored])));
      } else {
        setCategoriesList(DEFAULT_CATEGORIES);
      }
    } catch {}
  };

  // Load custom categories from tenant storage on mount and when event fires
  useEffect(() => {
    loadStoredCategories();
    const handleCategoryUpdate = () => loadStoredCategories();
    window.addEventListener("texaflow_material_categories_changed", handleCategoryUpdate);
    window.addEventListener("storage", handleCategoryUpdate);
    return () => {
      window.removeEventListener("texaflow_material_categories_changed", handleCategoryUpdate);
      window.removeEventListener("storage", handleCategoryUpdate);
    };
  }, []);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    const q = (categorySearch || "").toLowerCase().trim();
    if (!q) return categoriesList;
    const matches = categoriesList.filter((c) => c.toLowerCase().includes(q));
    if (matches.length === 1 && matches[0].toLowerCase() === q && categoriesList.length > 1) {
      return categoriesList;
    }
    return matches;
  }, [categoriesList, categorySearch]);

  const handleCategorySelect = (cName: string) => {
    setCategory(cName);
    setCategorySearch(cName);
    setIsCategoryDropdownOpen(false);
  };

  const handleAddNewCategory = (newCatName: string) => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const currentCid = getStoredCompanyId() || "comp-001";
    const updated = Array.from(new Set([trimmed, ...categoriesList]));
    setCategoriesList(updated);
    setTenantItem("texaflow_material_categories", updated, currentCid === "comp-001" ? "om_sai_material_categories" : undefined);
    window.dispatchEvent(new CustomEvent("texaflow_material_categories_changed"));
    setCategory(trimmed);
    setCategorySearch(trimmed);
    setIsCategoryDropdownOpen(false);
  };

  const handleDeleteCategory = (catToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove "${catToDelete}"?`)) return;
    const currentCid = getStoredCompanyId() || "comp-001";
    const updated = categoriesList.filter((c) => c !== catToDelete);
    setCategoriesList(updated);
    setTenantItem("texaflow_material_categories", updated, currentCid === "comp-001" ? "om_sai_material_categories" : undefined);
    window.dispatchEvent(new CustomEvent("texaflow_material_categories_changed"));
    if (category === catToDelete) {
      setCategory("");
      setCategorySearch("");
    }
  };

  // Filter vendors based on typed vendor name
  const filteredVendors = useMemo(() => {
    const q = (vendorName || "").toLowerCase().trim();
    if (!q) return vendorsList;
    const matches = vendorsList.filter((v) => v.toLowerCase().includes(q));
    if (matches.length === 1 && matches[0].toLowerCase() === q && vendorsList.length > 1) {
      return vendorsList;
    }
    return matches;
  }, [vendorsList, vendorName]);

  // Recalculate Due Date automatically
  useEffect(() => {
    if (creditDays > 0) {
      setDueDate(calculateDueDate(billDate, creditDays));
    } else {
      setDueDate(billDate);
    }
  }, [billDate, creditDays]);

  // Load vendors list
  useEffect(() => {
    const currentCid = getStoredCompanyId() || "comp-001";
    async function loadVendors() {
      try {
        const live = await fetchApi<any[]>("/vendors");
        if (Array.isArray(live) && live.length > 0) {
          const scoped = live.filter((v: any) => (v.company_id || "comp-001") === currentCid);
          setRawVendors(scoped);
          const names = scoped
            .map((v: any) => v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim())
            .filter(Boolean);
          setVendorsList(Array.from(new Set(names)));
          return;
        }
      } catch {}

      try {
        const localMaster = localStorage.getItem("app_vendors_master");
        const saved = localMaster 
          ? JSON.parse(localMaster) 
          : getTenantItem<any[]>("texaflow_vendors", currentCid === "comp-001" ? "om_sai_vendors" : undefined);
        if (Array.isArray(saved) && saved.length > 0) {
          setRawVendors(saved);
          const names = saved
            .map((v: any) => v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim())
            .filter(Boolean);
          setVendorsList(Array.from(new Set(names)));
        }
      } catch {}
    }
    loadVendors();
  }, []);



  // Load record for edit mode
  useEffect(() => {
    if (editId) {
      const currentCid = getStoredCompanyId() || "comp-001";
      const list = getTenantItem<any[]>("texaflow_purchases", currentCid === "comp-001" ? "om_sai_purchases" : undefined) || [];
      const matched = list.find((item: any) => item.id === editId || item.purchase_no === editId);
      if (matched) {
        setPurchaseNo(matched.purchase_no || "");
        setBillDate(matched.date || getTodayStr());
        setVendorName(matched.vendor_name || "");
        setCategory(matched.category || "Raw Material & Fabric");
        setCategorySearch(matched.category || "Raw Material & Fabric");
        setItemsDescription(matched.items_description || "");
        setAmount(String(matched.amount || ""));
        setPaymentStatus(matched.payment_status === "Pending" ? "Pending" : "Paid");
        setPaymentTerms(matched.payment_terms || (matched.payment_status === "Pending" ? "Net 45" : "Cash / Immediate"));
        setCreditDays(matched.credit_days !== undefined ? matched.credit_days : (matched.payment_status === "Pending" ? 45 : 0));
        setDueDate(matched.due_date || "");
        setLinkedOrder(matched.linked_order || "");
        setBillImage(matched.bill_image || "");
        setNotes(matched.notes || "");
      }
    }
  }, [editId]);

  const handleVendorSelect = (name: string) => {
    setVendorName(name);
    setIsVendorDropdownOpen(false);

    // Auto-fetch vendor's default credit terms
    const matched = rawVendors.find((v: any) => {
      const vName = v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim();
      return vName.toLowerCase() === name.toLowerCase();
    });

    if (matched && matched.payment_terms) {
      const days = parseCreditDays(matched.payment_terms);
      setCreditDays(days);
      setPaymentTerms(matched.payment_terms);
      if (days === 0) {
        setPaymentStatus("Paid");
      } else {
        setPaymentStatus("Pending");
      }
    }
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!purchaseNo.trim()) {
      alert(t("Please enter Purchase Bill No."));
      return;
    }

    if (!vendorName.trim()) {
      alert(t("Please select or enter supplier/vendor name."));
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert(t("Please enter a valid bill amount."));
      return;
    }

    setIsSaving(true);
    const currentCid = getStoredCompanyId() || "comp-001";
    const recordId = isEditMode && editId ? editId : `pur-${Date.now()}`;

    const purchasePayload = {
      id: recordId,
      company_id: currentCid,
      purchase_no: purchaseNo.trim(),
      date: billDate,
      vendor_name: vendorName.trim(),
      category,
      items_description: itemsDescription.trim(),
      amount: numAmount,
      payment_status: paymentStatus,
      paid_via: paymentStatus === "Paid" ? "Cash / Immediate" : `Credit (${creditDays} days)`,
      payment_terms: paymentStatus === "Paid" ? "Cash / Immediate" : paymentTerms,
      credit_days: paymentStatus === "Paid" ? 0 : creditDays,
      due_date: paymentStatus === "Paid" ? billDate : calculateDueDate(billDate, creditDays),
      linked_order: linkedOrder.trim(),
      bill_image: billImage,
      notes: notes.trim()
    };

    try {
      if (isEditMode) {
        await fetchApi(`/purchases/${recordId}`, {
          method: "PUT",
          body: JSON.stringify(purchasePayload)
        });
      } else {
        await fetchApi("/purchases", {
          method: "POST",
          body: JSON.stringify(purchasePayload)
        });
      }
    } catch (err) {
      console.warn("Backend save notice:", err);
    }

    try {
      const saved = getTenantItem<any[]>("texaflow_purchases", currentCid === "comp-001" ? "om_sai_purchases" : undefined) || [];
      const updatedList = isEditMode
        ? saved.map((p: any) => (p.id === recordId || p.purchase_no === recordId ? purchasePayload : p))
        : [purchasePayload, ...saved];
      setTenantItem("texaflow_purchases", updatedList, currentCid === "comp-001" ? "om_sai_purchases" : undefined);
      window.dispatchEvent(new Event("app_data_update"));
    } catch {}

    router.push("/purchases");
  };



  return (
    <div className="w-full space-y-3.5 select-none pb-20 animate-in fade-in duration-150 text-xs font-sans">
      {/* 1. TOP HEADER TOOLBAR - MATCHING PAYMENTS & VENDORS PAGE BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
        <h2 className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">
          {isEditMode ? t("EDIT RAW MATERIAL PURCHASE") : t("NEW RAW MATERIAL PURCHASE REGISTRATION")}
        </h2>
        <Link
          href="/purchases"
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("Back to Purchase List")}</span>
        </Link>
      </div>

      {/* 2. FORM CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
        <form onSubmit={handleSavePurchase} className="space-y-4">
          
          {/* ROW 1: PURCHASE BILL NO * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">{t("Purchase Bill No*")}</label>
            <div className="max-w-xl w-full">
              <input
                type="text"
                value={purchaseNo}
                onChange={(e) => setPurchaseNo(e.target.value)}
                placeholder="e.g. PB-001 or Mill Challan No"
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          {/* ROW 2: BILL / INWARD DATE * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">{t("Bill / Inward Date*")}</label>
            <div className="max-w-xl w-full">
              <CustomDatePicker
                value={billDate}
                onChange={(newDate) => setBillDate(newDate)}
                placeholder="DD-MM-YYYY"
              />
            </div>
          </div>

          {/* ROW 3: SUPPLIER / VENDOR * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">{t("Supplier / Vendor*")}</label>
            <div className="max-w-xl w-full">
              <div className="relative" ref={vendorDropdownRef}>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => {
                      setVendorName(e.target.value);
                      setIsVendorDropdownOpen(true);
                    }}
                    onFocus={() => setIsVendorDropdownOpen(true)}
                    placeholder={t("Type to search or enter vendor name...")}
                    className="w-full h-9 pl-9 pr-14 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs text-xs"
                    required
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {vendorName && (
                      <button
                        type="button"
                        onClick={() => {
                          setVendorName("");
                          setIsVendorDropdownOpen(true);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isVendorDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {isVendorDropdownOpen && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-1.5 max-h-60 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                    {filteredVendors.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs font-medium">
                        {vendorName ? `No registered vendor matching "${vendorName}". Keep typing to use custom name.` : t("No vendors found.")}
                      </div>
                    ) : (
                      filteredVendors.map((v) => {
                        const isSelected = vendorName.toLowerCase().trim() === v.toLowerCase().trim();

                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => handleVendorSelect(v)}
                            className={`w-full text-left px-3 py-2 hover:bg-blue-50/70 rounded-xl font-bold text-slate-800 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50 text-blue-900 font-extrabold" : ""
                            }`}
                          >
                            <span className="truncate">{v}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ROW 4: MATERIAL CATEGORY (SEARCHABLE + ADD NEW) */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-bold text-slate-700">{t("Material Category*")}</label>
            <div className="max-w-xl w-full">
              <div className="relative" ref={categoryDropdownRef}>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setCategory(e.target.value);
                      setIsCategoryDropdownOpen(true);
                    }}
                    onFocus={() => setIsCategoryDropdownOpen(true)}
                    placeholder={t("Type to search or enter new category...")}
                    className="w-full h-9 pl-9 pr-14 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs text-xs"
                    required
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {categorySearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setCategorySearch("");
                          setCategory("");
                          setIsCategoryDropdownOpen(true);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isCategoryDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {isCategoryDropdownOpen && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-1.5 max-h-60 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                    {filteredCategories.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs font-medium">
                        {t("No categories found.")}
                      </div>
                    ) : (
                      filteredCategories.map((c) => {
                        const isSelected = category.toLowerCase().trim() === c.toLowerCase().trim();

                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleCategorySelect(c)}
                            className={`w-full text-left px-3 py-2 hover:bg-blue-50/70 rounded-xl font-bold text-slate-800 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50 text-blue-900 font-extrabold" : ""
                            }`}
                          >
                            <span className="truncate">{c}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ROW 5: ITEMS / DESCRIPTION */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-bold text-slate-700">{t("Items / Description")}</label>
            <div className="max-w-xl w-full">
              <input
                type="text"
                value={itemsDescription}
                onChange={(e) => setItemsDescription(e.target.value)}
                placeholder="e.g. 370 - 14 box, 351 - 17 box = 40 box"
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* ROW 6: BILL AMOUNT (₹) * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">{t("Bill Amount (₹)*")}</label>
            <div className="relative max-w-xl w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500 text-sm">₹</span>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-9 pl-7 pr-3 bg-white border border-slate-300 rounded-xl font-mono font-black text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          {/* ROW 7: PAYMENT STATUS * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-bold text-slate-700">{t("Payment Status*")}</label>
            <div className="flex items-center gap-2 max-w-xl w-full">
              {/* 1. PAID FIRST */}
              <button
                type="button"
                onClick={() => {
                  setPaymentStatus("Paid");
                  setCreditDays(0);
                  setPaymentTerms("Cash / Immediate");
                }}
                className={`flex-1 h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                  paymentStatus === "Paid"
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t("Paid")}</span>
              </button>

              {/* 2. PENDING / CREDIT SECOND */}
              <button
                type="button"
                onClick={() => {
                  setPaymentStatus("Pending");
                  if (creditDays === 0) setCreditDays(45);
                  setPaymentTerms("Net 45");
                }}
                className={`flex-1 h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                  paymentStatus === "Pending"
                    ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{t("Pending / Credit")}</span>
              </button>
            </div>
          </div>

          {/* ROW 8: CREDIT TERMS (NET DAYS) - SHOWN ONLY FOR UDHAR */}
          {paymentStatus === "Pending" && (
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
              <div className="flex flex-col">
                <label className="font-bold text-slate-700">{t("Credit Terms*")}</label>
                <span className="text-[10px] text-blue-600 font-extrabold">{creditDays} {t("Days Credit")}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap max-w-xl w-full">
                {[30, 45, 60, 90, 100, 120].map((days) => {
                  const isSelected = creditDays === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setCreditDays(days);
                        setPaymentTerms(`Net ${days}`);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {days} {t("Days")}
                    </button>
                  );
                })}
                <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] text-slate-400 font-medium">{t("Custom")}:</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={creditDays || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setCreditDays(val);
                      setPaymentTerms(`Net ${val}`);
                    }}
                    className="w-12 h-5 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400">{t("Days")}</span>
                </div>
              </div>
            </div>
          )}

          {/* ROW 11: REMARKS / NOTES */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-start text-xs pt-1">
            <label className="font-bold text-slate-700 pt-2">{t("Remarks / Notes")}</label>
            <div className="max-w-xl w-full">
              <VoiceTextarea
                rows={3}
                placeholder={t("Add optional purchase description, lot number or mill notes...")}
                value={notes}
                onChangeValue={(val) => setNotes(val)}
              />
            </div>
          </div>

        </form>
      </div>

      {/* 3. UNIFIED STATIC / FIXED ACTIONS FOOTER BAR */}
      <BottomActionBar
        showSynced={true}
        rightContent={
          <>
            <Link
              href="/purchases"
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs transition-colors cursor-pointer shadow-2xs"
            >
              {t("Cancel")}
            </Link>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSavePurchase}
              className={`px-5 py-2 font-extrabold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all ${
                isSaving
                  ? "bg-blue-400 text-white cursor-not-allowed pointer-events-none opacity-80"
                  : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t("Saving Purchase...")}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditMode ? t("Update Purchase Bill") : t("Save Purchase Bill")}</span>
                </>
              )}
            </button>
          </>
        }
      />
    </div>
  );
}

export default function NewPurchasePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
      <NewPurchaseContent />
    </Suspense>
  );
}
