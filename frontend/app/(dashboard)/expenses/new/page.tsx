"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
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
  Tag,
  Package,
  Layers,
  Wrench,
  Zap,
  Coffee,
  Truck,
  Building2,
  FileText,
  HelpCircle,
  LucideIcon,
  X
} from "lucide-react";

interface CategoryCardItem {
  id: string;
  name: string;
  icon: LucideIcon;
}

const defaultCategories: CategoryCardItem[] = [
  { id: "cat-1", name: "Packaging Materials", icon: Package },
  { id: "cat-2", name: "Dhaga & Consumables", icon: Layers },
  { id: "cat-3", name: "Machine Maintenance & Repairs", icon: Wrench },
  { id: "cat-4", name: "Electricity & Power", icon: Zap },
  { id: "cat-5", name: "Tea & Refreshments", icon: Coffee },
  { id: "cat-6", name: "Logistics & Courier", icon: Truck },
  { id: "cat-7", name: "Factory / Office Rent", icon: Building2 },
  { id: "cat-8", name: "Stationery & Printing", icon: FileText },
  { id: "cat-9", name: "Miscellaneous / Other", icon: HelpCircle },
];

const paymentModeOptions = [
  "BANK TRANSFER (NEFT/RTGS/IMPS)",
  "UPI (GPay / PhonePe / Paytm)",
  "Cash",
  "Cheque",
  "Credit (15 days)"
];

const defaultRegisteredVendors = [
  "Shree Ram Yarns & Zari Mills",
  "Master Karigar Union",
  "DGVCL Power Corp",
  "Surat Needle Mart",
  "Ganesh Embroidery Services",
  "Maruti Jobwork Works Surat",
  "Nayara Energy & Local Freight",
  "Gujarat Gas Limited",
  "Krishna Packaging & Boxes",
  "Surat Bobbin & Consumables"
];

const getTodayStr = () => new Date().toISOString().split("T")[0];
const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

export default function NewExpenseVoucherPage() {
  const router = useRouter();

  // 1. Amount
  const [amount, setAmount] = useState("");

  // 2. Date
  const [voucherDate, setVoucherDate] = useState(getTodayStr());

  // 3. Category
  const [category, setCategory] = useState("Packaging Materials");
  const [categoryPage, setCategoryPage] = useState(0); // 0 = standard 9, 1 = custom categories
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("om_sai_custom_expense_categories");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [newCatName, setNewCatName] = useState("");
  const [isAddInputOpen, setIsAddInputOpen] = useState(false);

  // 4. Vendor / Payee & Bill / Invoice (Optional Toggleable Fields - Images 1, 2, 3, 4)
  const [showVendorField, setShowVendorField] = useState(false);
  const [showBillField, setShowBillField] = useState(false);
  const [isRegisteredVendorMode, setIsRegisteredVendorMode] = useState(false);
  const [isVendorSelectOpen, setIsVendorSelectOpen] = useState(false);
  const [registeredVendorsList, setRegisteredVendorsList] = useState<string[]>(defaultRegisteredVendors);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  const [vendorName, setVendorName] = useState("");
  const [billNo, setBillNo] = useState("");
  const [paymentMode, setPaymentMode] = useState("BANK TRANSFER (NEFT/RTGS/IMPS)");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Pending">("Paid");
  const [remarks, setRemarks] = useState("");
  const [billImage, setBillImage] = useState("");

  // Dropdown states
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // DatePicker Navigation State
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const modeRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Load registered vendors from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("om_sai_vendors");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const names = parsed
            .map((v: any) => v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim())
            .filter(Boolean);
          if (names.length > 0) {
            setRegisteredVendorsList(Array.from(new Set([...names, ...defaultRegisteredVendors])));
          }
        }
      }
    } catch {}
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) {
        setIsModeDropdownOpen(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target as Node)) {
        setIsVendorSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (!customCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem("om_sai_custom_expense_categories", JSON.stringify(updated));
      } catch {}
    }
    setCategory(trimmed);
    setNewCatName("");
    setIsAddInputOpen(false);
    setCategoryPage(1); // switch to slide 2 to view custom category
  };

  const handleDeleteCustomCategory = (nameToRemove: string) => {
    const updated = customCategories.filter((c) => c !== nameToRemove);
    setCustomCategories(updated);
    try {
      localStorage.setItem("om_sai_custom_expense_categories", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    if (category === nameToRemove) {
      setCategory("Packaging Materials");
    }
    if (updated.length === 0) {
      setCategoryPage(0);
      setIsAddInputOpen(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      alert("Please enter a valid expense amount!");
      return;
    }

    const newExpense = {
      id: `exp-${Date.now()}`,
      expense_no: `EXP-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: voucherDate || getTodayStr(),
      category: category,
      title: remarks.trim() || `${category} Expense Voucher`,
      vendor_name: vendorName.trim() || "General Vendor",
      amount: numericAmount,
      payment_status: paymentStatus,
      paid_via: paymentMode,
      invoice_no: billNo.trim() || `EXP-${Date.now().toString().slice(-4)}`,
      notes: remarks.trim(),
      bill_image: billImage
    };

    // 1. Save directly to Supabase via FastAPI Backend
    try {
      await fetchApi("/expenses", {
        method: "POST",
        body: JSON.stringify({
          expense_no: newExpense.expense_no,
          date: newExpense.date,
          category: newExpense.category,
          title: newExpense.title,
          vendor_name: newExpense.vendor_name,
          amount: newExpense.amount,
          payment_status: newExpense.payment_status,
          paid_via: newExpense.paid_via,
          invoice_no: newExpense.invoice_no,
          notes: newExpense.notes,
          bill_image: newExpense.bill_image || undefined
        })
      });
    } catch (apiErr) {
      console.warn("Backend API not reachable, saving to local backup:", apiErr);
    }

    // 2. Keep local cache updated
    try {
      const existing = localStorage.getItem("om_sai_expenses");
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(newExpense);
      localStorage.setItem("om_sai_expenses", JSON.stringify(list));
    } catch (err) {
      console.error(err);
    }

    router.push("/expenses");
  };

  return (
    <div className="w-full space-y-3.5 pb-24 animate-in fade-in duration-150 text-xs font-sans">
      {/* 1. TOP HEADER TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
        <h2 className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">
          NEW EXPENSE VOUCHER REGISTRATION
        </h2>
        <Link
          href="/expenses"
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Voucher List</span>
        </Link>
      </div>

      {/* 2. FORM CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4.5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* FIELD 1: AMOUNT (₹) * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">Amount (₹)*</label>
            <div className="relative max-w-xl w-full">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm select-none">
                ₹
              </span>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 pl-8 pr-3 w-full bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs font-mono"
                autoFocus
              />
            </div>
          </div>

          {/* FIELD 2: VOUCHER DATE * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">Voucher Date*</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl w-full">
              <div ref={datePickerRef} className="relative flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDatePickerOpen((prev) => !prev);
                    setIsModeDropdownOpen(false);
                  }}
                  className={`w-full h-9 px-3 bg-white border rounded-xl text-xs font-mono font-bold text-slate-900 flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                    isDatePickerOpen
                      ? "border-blue-500 ring-2 ring-blue-500/20"
                      : "border-slate-300 hover:border-blue-400"
                  }`}
                >
                  <span>
                    {voucherDate
                      ? `${voucherDate.split("-")[2]} / ${voucherDate.split("-")[1]} / ${voucherDate.split("-")[0]}`
                      : "DD / MM / YYYY"}
                  </span>
                  <Calendar className="w-4 h-4 text-blue-600" />
                </button>

                {/* DATE PICKER POPUP */}
                {isDatePickerOpen && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs font-bold text-slate-900">
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
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][viewMonth]} {viewYear}
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

                        for (let day = 1; day <= daysInMonth; day++) {
                          const mStr = String(viewMonth + 1).padStart(2, "0");
                          const dStr = String(day).padStart(2, "0");
                          const dateStr = `${viewYear}-${mStr}-${dStr}`;
                          const isSelected = voucherDate === dateStr;
                          const isToday = getTodayStr() === dateStr;

                          items.push(
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                setVoucherDate(dateStr);
                                setIsDatePickerOpen(false);
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
                          setVoucherDate(getTodayStr());
                          setViewYear(new Date().getFullYear());
                          setViewMonth(new Date().getMonth());
                          setIsDatePickerOpen(false);
                        }}
                        className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        Select Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDatePickerOpen(false)}
                        className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* QUICK PILLS: TODAY / YESTERDAY (BLUE THEME) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setVoucherDate(getTodayStr())}
                  className={`px-3 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    voucherDate === getTodayStr()
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherDate(getYesterdayStr())}
                  className={`px-3 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    voucherDate === getYesterdayStr()
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Yesterday
                </button>
              </div>
            </div>
          </div>

          {/* FIELD 3: CATEGORY (COMPACT BLUE & WHITE SLIDER / CARDS - MATCHING IMAGE 2 & 3) */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-start text-xs pt-1">
            <div className="pt-1.5">
              <label className="font-extrabold text-rose-600 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span>Category*</span>
              </label>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {customCategories.length > 0 && categoryPage === 1 ? "Custom Categories" : "Standard Categories"}
              </span>
            </div>

            <div className="space-y-2.5 w-full max-w-4xl">
              {/* TOP SLIDER CONTROLS (ONLY SHOWN IF CUSTOM CATEGORIES EXIST) */}
              {customCategories.length > 0 && (
                <div className="flex items-center justify-between pb-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600">
                      {categoryPage === 0 ? "Standard Categories" : `Custom Categories (${customCategories.length})`}
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                      {categoryPage === 0 ? "1 / 2" : "2 / 2"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCategoryPage(0)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        categoryPage === 0
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Standard (9)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryPage(1)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        categoryPage === 1
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Custom ({customCategories.length})
                    </button>
                    <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1 ml-0.5">
                      <button
                        type="button"
                        onClick={() => setCategoryPage(0)}
                        disabled={categoryPage === 0}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="Standard Categories"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryPage(1)}
                        disabled={categoryPage === 1}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="Custom Categories"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORIES GRID: STARTS FLUSH AT THE LEFT WITH NO MARGIN / PUSH */}
              <div className="w-full">
                {categoryPage === 0 ? (
                  /* SLIDE 1: 9 COMPACT STANDARD CATEGORIES */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {defaultCategories.map((cat) => {
                      const IconComp = cat.icon;
                      const isSelected = category === cat.name;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategory(cat.name);
                            if (cat.name === "Miscellaneous / Other") {
                              setIsAddInputOpen(true);
                            } else {
                              setIsAddInputOpen(false);
                            }
                          }}
                          className={`h-10 px-3 rounded-xl text-left border flex items-center gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? "border-2 border-blue-600 bg-blue-50/70 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-500/20"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-700 font-semibold"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs truncate">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* SLIDE 2: CUSTOM ADDED CATEGORIES (WITH REMOVE BUTTON) + ADD CATEGORY CARD */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {customCategories.map((customName) => {
                      const isSelected = category === customName;
                      return (
                        <div
                          key={customName}
                          className={`h-10 px-3 rounded-xl border flex items-center justify-between gap-2 transition-all group ${
                            isSelected
                              ? "border-2 border-blue-600 bg-blue-50/70 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-500/20"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-700 font-semibold"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setCategory(customName);
                              setIsAddInputOpen(false);
                            }}
                            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer h-full"
                          >
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs truncate">{customName}</span>
                          </button>

                          {/* DELETE / REMOVE BUTTON */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomCategory(customName);
                            }}
                            className="w-5 h-5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0 opacity-70 group-hover:opacity-100"
                            title={`Remove "${customName}"`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    {/* + ADD CATEGORY CARD */}
                    <button
                      type="button"
                      onClick={() => setIsAddInputOpen(true)}
                      className={`h-10 px-3.5 rounded-xl border border-dashed transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                        isAddInputOpen
                          ? "border-blue-500 bg-blue-50/60 text-blue-700"
                          : "border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/40 text-slate-600 hover:text-blue-600"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Category</span>
                    </button>
                  </div>
                )}
              </div>

              {/* CONDITIONAL INPUT BAR: ONLY SHOWN FOR "Miscellaneous / Other" OR WHEN CLICKING "+ Add Category" */}
              {(category === "Miscellaneous / Other" || isAddInputOpen) && (
                <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type custom category name..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      className="w-full pl-9 pr-3 h-9 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* FIELD 4: DYNAMIC CUSTOM PAYEE / SHOP & BILL / INVOICE OPTIONS (IMAGES 1, 2, 3, 4) */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-start text-xs pt-1">
            <div className="hidden sm:block pt-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Payee & Bill</span>
              </label>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Optional details
              </span>
            </div>

            <div className="max-w-xl w-full space-y-3.5">
              {/* STATE 1: NEITHER IS OPEN -> SHOW BOTH BUTTONS SIDE BY SIDE (IMAGE 1) */}
              {!showVendorField && !showBillField && (
                <div className="flex flex-wrap items-center gap-6 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowVendorField(true)}
                    className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enter Custom Payee / Shop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBillField(true)}
                    className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enter Bill / Invoice / Challan</span>
                  </button>
                </div>
              )}

              {/* VENDOR / PAYEE EXPANDED OR TOGGLE BUTTON (IMAGE 2, 3, 4) */}
              {(showVendorField || showBillField) && (
                <>
                  {/* IF VENDOR IS OPEN -> SHOW VENDOR / SUPPLIER FIELD (IMAGE 2 & 4) */}
                  {showVendorField ? (
                    <div className="space-y-1.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Vendor / Supplier</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsRegisteredVendorMode((prev) => !prev)}
                          className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{isRegisteredVendorMode ? "Enter Custom Payee / Shop" : "Select Registered Vendor"}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {isRegisteredVendorMode ? (
                          /* REGISTERED VENDOR DROPDOWN (ROUNDED-XL MATCHING OTHER FIELDS) */
                          <div ref={vendorDropdownRef} className="relative flex-1">
                            <button
                              type="button"
                              onClick={() => setIsVendorSelectOpen((prev) => !prev)}
                              className={`w-full h-9 px-3 bg-white border rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                                isVendorSelectOpen
                                  ? "border-blue-500 ring-2 ring-blue-500/20"
                                  : "border-slate-300 hover:border-blue-400"
                              }`}
                            >
                              <span className={vendorName ? "font-bold text-slate-900 truncate" : "text-slate-400 font-normal truncate"}>
                                {vendorName || "Select registered vendor from list..."}
                              </span>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                            </button>

                            {isVendorSelectOpen && (
                              <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full w-full bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-0.5 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                {registeredVendorsList.map((v) => (
                                  <button
                                    key={v}
                                    type="button"
                                    onClick={() => {
                                      setVendorName(v);
                                      setIsVendorSelectOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 text-slate-800 flex items-center justify-between cursor-pointer"
                                  >
                                    <span className="truncate">{v}</span>
                                    {vendorName === v && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2 stroke-[2.5]" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* CUSTOM PAYEE / SHOP TEXT INPUT (ROUNDED-XL MATCHING OTHER FIELDS) */
                          <div className="relative flex-1">
                            <input
                              type="text"
                              placeholder="Shop or payee name..."
                              value={vendorName}
                              onChange={(e) => setVendorName(e.target.value)}
                              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                              autoFocus
                            />
                          </div>
                        )}

                        {/* RED ✕ REMOVE BUTTON */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowVendorField(false);
                            setVendorName("");
                            setIsRegisteredVendorMode(false);
                            setIsVendorSelectOpen(false);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Remove Vendor Field"
                        >
                          <X className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* IF VENDOR NOT OPEN, BUT BILL IS OPEN -> SHOW VENDOR BUTTON (IMAGE 3) */
                    <button
                      type="button"
                      onClick={() => setShowVendorField(true)}
                      className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Enter Custom Payee / Shop</span>
                    </button>
                  )}

                  {/* IF BILL IS OPEN -> SHOW BILL / INVOICE / CHALLAN FIELD (IMAGE 3 & 4) */}
                  {showBillField ? (
                    <div className="space-y-1.5 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Bill / Invoice / Challan</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Bill or invoice number..."
                            value={billNo}
                            onChange={(e) => setBillNo(e.target.value)}
                            className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                            autoFocus
                          />
                        </div>

                        {/* RED ✕ REMOVE BUTTON */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowBillField(false);
                            setBillNo("");
                          }}
                          className="w-7 h-7 flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Remove Bill Field"
                        >
                          <X className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* IF BILL NOT OPEN, BUT VENDOR IS OPEN -> SHOW BILL BUTTON (IMAGE 2) */
                    <button
                      type="button"
                      onClick={() => setShowBillField(true)}
                      className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Enter Bill / Invoice / Challan</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* FIELD 7: PAYMENT MODE */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-bold text-slate-700">Payment Mode</label>
            <div ref={modeRef} className="relative max-w-xl w-full">
              <button
                type="button"
                onClick={() => {
                  setIsModeDropdownOpen((prev) => !prev);
                  setIsDatePickerOpen(false);
                }}
                className={`w-full h-9 px-3 bg-white border rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                  isModeDropdownOpen
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-slate-300 hover:border-blue-400"
                }`}
              >
                <span className="truncate">{paymentMode}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                    isModeDropdownOpen ? "rotate-180 text-blue-600" : ""
                  }`}
                />
              </button>

              {isModeDropdownOpen && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full w-full bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {paymentModeOptions.map((opt) => {
                    const isSelected = paymentMode === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setPaymentMode(opt);
                          setIsModeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50 text-blue-900 font-extrabold"
                            : "text-slate-700 hover:bg-slate-50 font-semibold"
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2 stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* FIELD 8: PAYMENT STATUS * (BLUE & WHITE THEME) */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>Payment Status*</span>
            </label>
            <div className="flex items-center gap-2 max-w-xl w-full">
              <button
                type="button"
                onClick={() => setPaymentStatus("Paid")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  paymentStatus === "Paid"
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Paid</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus("Pending")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  paymentStatus === "Pending"
                    ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Pending</span>
              </button>
            </div>
          </div>

          {/* FIELD 7: REMARKS / DESCRIPTION */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-start text-xs pt-1">
            <label className="font-bold text-slate-700 pt-2">Remarks / Notes</label>
            <textarea
              rows={3}
              placeholder="Add optional expense description, items purchased or notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="p-3 max-w-xl w-full bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all shadow-2xs"
            />
          </div>

          {/* FIELD 11: ATTACH PHYSICAL BILL DOCUMENT */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs pt-1">
            <label className="font-bold text-slate-700">Attach Bill Receipt</label>
            <div className="max-w-xl w-full flex items-center gap-3">
              <label
                htmlFor="bill-upload-page"
                className="px-3.5 h-9 bg-slate-50 hover:bg-slate-100 border border-slate-300 border-dashed rounded-xl font-bold text-slate-700 text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>{billImage ? "Change Bill File" : "Upload Bill (PDF, PNG, JPG)"}</span>
                <input
                  id="bill-upload-page"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (uploadEvent) => {
                        setBillImage(uploadEvent.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              {billImage && (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                  Bill Attached
                </span>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* 3. STATIC / FIXED ACTIONS FOOTER BAR */}
      <div className="fixed bottom-0 left-0 lg:left-[250px] right-0 z-40 h-[57px] bg-white border-t border-slate-200 px-6 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span>Synced</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/expenses"
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Expense Voucher</span>
          </button>
        </div>
      </div>
    </div>
  );
}
