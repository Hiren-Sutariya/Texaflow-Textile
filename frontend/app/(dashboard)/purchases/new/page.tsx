"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchApi, getCachedApi, setCachedApi, invalidateApiCache } from "@/lib/api";
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
  Settings,
  Receipt,
  FileText,
  Hash,
  CheckCircle2,
  Calculator
} from "lucide-react";

const getTodayStr = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};



export interface PurchaseLineItem {
  id: string;
  category: string;
  description: string;
  quantity: string;
  weight?: string;
  cartoon?: string;
  rate?: string;
  amount: string;
}

function parseMaterialDescription(desc?: string) {
  if (!desc || !desc.trim()) return null;
  let trimmed = desc.trim();
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  // Check if string ends with "= total" (e.g. "= 40 box")
  let total: string | null = null;
  const endEqualMatch = trimmed.match(/\s*=\s*([^,=]+)$/);
  if (endEqualMatch && endEqualMatch.index !== undefined && endEqualMatch.index > 0) {
    const candidateTotal = endEqualMatch[1].trim();
    if (/\d/.test(candidateTotal)) {
      total = candidateTotal;
      trimmed = trimmed.slice(0, endEqualMatch.index).trim();
    }
  }

  // Split comma-separated items
  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length > 0) {
    const items = parts.map((part) => {
      let amount = "";
      let cleaned = part;
      const amtMatch = cleaned.match(/\(₹?\s*([\d.]+)\s*\)/);
      if (amtMatch) {
        amount = amtMatch[1];
        cleaned = cleaned.replace(amtMatch[0], "").trim();
      }

      const lastHyphenIndex = cleaned.lastIndexOf("-");
      if (lastHyphenIndex !== -1) {
        const shade = cleaned.slice(0, lastHyphenIndex).trim();
        const qty = cleaned.slice(lastHyphenIndex + 1).trim();
        return { shade, qty, amount };
      }

      const lastColonIndex = cleaned.lastIndexOf(":");
      if (lastColonIndex !== -1) {
        const shade = cleaned.slice(0, lastColonIndex).trim();
        const qty = cleaned.slice(lastColonIndex + 1).trim();
        return { shade, qty, amount };
      }

      return { shade: cleaned, qty: "", amount };
    });

    const hasAnyQtyOrDesc = items.some((it) => it.shade || it.qty);
    if (hasAnyQtyOrDesc) {
      return { isBreakdown: true, total, items };
    }
  }

  return { isBreakdown: false, raw: trimmed, items: [] };
}

function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const inWords = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return a[n] + " ";
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "") + " ";
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred " + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + "Crore " + inWords(n % 10000000);
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let res = inWords(rupees).trim() + " Rupees";
  if (paise > 0) {
    res += " and " + inWords(paise).trim() + " Paise";
  }
  return res + " Only";
}

interface CustomSelectOption {
  value: string;
  label: string;
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
  placeholder = "Select...",
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

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-xs select-none ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 bg-white border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""
          }`}
      >
        <span className={`truncate font-bold ${selectedOption ? "text-slate-900" : "text-slate-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1.5 ${isOpen ? "rotate-180 text-blue-600" : ""
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-[100] right-0 min-w-full w-full sm:min-w-[240px] mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 max-h-64 overflow-y-auto">
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
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer ${isSelected
                    ? "bg-blue-50 text-blue-900 font-extrabold"
                    : "text-slate-700 hover:bg-slate-50 font-bold"
                  }`}
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

interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  onEnterNext?: () => void;
}

function CustomDatePicker({
  value,
  onChange,
  placeholder = "DD-MM-YYYY",
  className = "",
  id,
  onEnterNext
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
        id={id || "bill-date-btn"}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setIsOpen(false);
            if (onEnterNext) {
              onEnterNext();
            } else {
              document.getElementById("item-desc-0")?.focus();
            }
          }
        }}
        className={`w-full h-9 px-3.5 bg-white border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs hover:border-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer ${isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""
          }`}
      >
        <span className={`font-mono font-bold text-xs ${formattedDisplay ? "text-slate-900" : "text-slate-400"}`}>
          {formattedDisplay || placeholder}
        </span>
        <Calendar className="w-4 h-4 text-slate-500 shrink-0 ml-1.5" />
      </button>

      {isOpen && (
        <div className="absolute z-[100] right-0 sm:right-auto sm:left-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 w-64 space-y-2 animate-in fade-in zoom-in-95 duration-100">
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
                    className={`h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${isSelected
                        ? "bg-slate-900 text-white shadow-2xs font-extrabold"
                        : isToday
                          ? "bg-slate-100 text-slate-900 font-extrabold border border-slate-300"
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
  const getInitialMaterialCategories = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const liveCached = getCachedApi<Array<{ id: string; name: string; module: string }>>("/categories");
      if (Array.isArray(liveCached)) {
        const mat = liveCached.filter((c) => c.module === "material").map((c) => c.name?.trim()).filter(Boolean);
        if (mat.length > 0) return Array.from(new Set(mat));
      }
      const stored = getTenantItem<string[]>("texaflow_material_categories");
      if (Array.isArray(stored) && stored.length > 0) {
        return Array.from(new Set(stored.map((s) => typeof s === "string" ? s.trim() : "").filter(Boolean)));
      }
    } catch {}
    return [];
  };

  const [category, setCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState<string[]>(getInitialMaterialCategories);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Multi-item / line items state
  const [lineItems, setLineItems] = useState<PurchaseLineItem[]>([
    {
      id: "item-1",
      category: "",
      description: "",
      quantity: "",
      weight: "",
      cartoon: "",
      amount: ""
    }
  ]);

  const [itemsDescription, setItemsDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Pending">("Paid");
  const [paymentTerms, setPaymentTerms] = useState("Cash / Immediate");
  const [creditDays, setCreditDays] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Tax / GST state
  const [taxMode, setTaxMode] = useState<"none" | "cgst_sgst" | "igst">("none");
  const [taxRate, setTaxRate] = useState<number>(5);
  const [isCustomTaxRate, setIsCustomTaxRate] = useState(false);

  // Vendor selection states
  const [vendorsList, setVendorsList] = useState<string[]>([]);
  const [rawVendors, setRawVendors] = useState<any[]>([]);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  // Custom Category Dropdown for line items
  const [openCategoryItemId, setOpenCategoryItemId] = useState<string | null>(null);
  const categoryItemDropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
        setIsVendorDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (openCategoryItemId && categoryItemDropdownRefs.current[openCategoryItemId]) {
        if (!categoryItemDropdownRefs.current[openCategoryItemId]?.contains(event.target as Node)) {
          setOpenCategoryItemId(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openCategoryItemId]);

  const loadStoredCategories = async () => {
    try {
      // 1. Fetch live from backend
      const live = await fetchApi<Array<{ id: string; name: string; module: string }>>("/categories?module=material").catch(() => null);
      if (Array.isArray(live)) {
        const mat = Array.from(
          new Set(
            live
              .filter((c) => c.module === "material")
              .map((c) => c.name?.trim())
              .filter(Boolean)
          )
        );
        setCategoriesList(mat);
        setTenantItem("texaflow_material_categories", mat);
        if (typeof window !== "undefined") {
          localStorage.removeItem("om_sai_material_categories");
        }
        return;
      }

      // 2. Fallback to tenant storage
      const stored = getTenantItem<string[]>("texaflow_material_categories");
      if (Array.isArray(stored)) {
        setCategoriesList(Array.from(new Set(stored.map((s) => typeof s === "string" ? s.trim() : "").filter(Boolean))));
      } else {
        setCategoriesList([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load custom categories from backend / tenant storage on mount and when event fires
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

  const handleAddNewCategory = async (newCatName: string) => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const updated = Array.from(new Set([...categoriesList, trimmed]));
    setCategoriesList(updated);
    setTenantItem("texaflow_material_categories", updated);
    window.dispatchEvent(new CustomEvent("texaflow_material_categories_changed"));
    setCategory(trimmed);
    setCategorySearch(trimmed);
    setIsCategoryDropdownOpen(false);

    try {
      await fetchApi("/categories", {
        method: "POST",
        body: JSON.stringify({ name: trimmed, module: "material" })
      });
      invalidateApiCache("/categories");
    } catch (err) {
      console.error("Failed to sync new category to backend:", err);
    }
  };

  const handleDeleteCategory = async (catToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove "${catToDelete}"?`)) return;
    const updated = categoriesList.filter((c) => c !== catToDelete);
    setCategoriesList(updated);
    setTenantItem("texaflow_material_categories", updated);
    window.dispatchEvent(new CustomEvent("texaflow_material_categories_changed"));
    if (category === catToDelete) {
      setCategory("");
      setCategorySearch("");
    }
    try {
      await fetchApi(`/categories/${encodeURIComponent(catToDelete)}`, { method: "DELETE" });
      invalidateApiCache("/categories");
    } catch {}
  };

  // Line items handlers
  const handleAddLineItem = () => {
    const nextIdx = lineItems.length;
    setLineItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        category: categoriesList[0] || "",
        description: "",
        quantity: "",
        weight: "",
        cartoon: "",
        rate: "",
        amount: ""
      }
    ]);
    setTimeout(() => {
      document.getElementById(`item-desc-${nextIdx}`)?.focus();
    }, 50);
  };

  const calculateTotalWithTax = (sub: number, mode: "none" | "cgst_sgst" | "igst", rate: number) => {
    if (mode === "cgst_sgst") {
      const halfRate = rate / 2;
      const cgst = (sub * (halfRate / 100));
      const sgst = (sub * (halfRate / 100));
      return Math.round(sub + cgst + sgst);
    } else if (mode === "igst") {
      const igst = (sub * (rate / 100));
      return Math.round(sub + igst);
    }
    return Math.round(sub);
  };

  const handleRemoveLineItem = (id: string) => {
    const nextItems = lineItems.length <= 1
      ? [
        {
          id: "item-1",
          category: "",
          description: "",
          quantity: "",
          weight: "",
          cartoon: "",
          rate: "",
          amount: ""
        }
      ]
      : lineItems.filter((item) => item.id !== id);

    setLineItems(nextItems);
    const sum = nextItems.reduce((acc, it) => acc + (parseFloat(it.amount || "0") || 0), 0);
    if (sum > 0) {
      setAmount(String(calculateTotalWithTax(sum, taxMode, taxRate)));
    } else {
      setAmount("");
    }
  };

  const handleUpdateLineItem = (id: string, field: keyof PurchaseLineItem, val: string) => {
    setLineItems((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };

        // If rate, quantity, or weight is modified, auto-calculate amount
        if (field === "rate" || field === "quantity" || field === "weight") {
          const r = parseFloat(field === "rate" ? val : updated.rate || "0");
          // Extract numeric quantity if present (e.g. "14 Box" -> 14, "10" -> 10)
          const matchQty = (field === "quantity" ? val : updated.quantity || "").match(/^[\s]*([0-9]+(?:\.[0-9]+)?)/);
          const q = matchQty ? parseFloat(matchQty[1]) : 0;
          const w = parseFloat(field === "weight" ? val : updated.weight || "0");

          if (r > 0) {
            // Priority: If weight is present and > 0, multiply weight * rate
            // Otherwise, if quantity is present, multiply quantity * rate
            // Round to nearest integer (>= .50 rounds up, < .50 rounds down)
            if (w > 0) {
              updated.amount = String(Math.round(r * w));
            } else if (q > 0) {
              updated.amount = String(Math.round(r * q));
            }
          }
        }
        return updated;
      });

      const sum = next.reduce((acc, it) => acc + (parseFloat(it.amount || "0") || 0), 0);
      if (sum > 0) {
        setAmount(String(calculateTotalWithTax(sum, taxMode, taxRate)));
      }
      return next;
    });
  };

  const calculatedTotal = useMemo(() => {
    return Math.round(lineItems.reduce((acc, it) => acc + (parseFloat(it.amount || "0") || 0), 0));
  }, [lineItems]);

  const { cgstAmount, sgstAmount, igstAmount, totalWithTax } = useMemo(() => {
    if (taxMode === "cgst_sgst") {
      const halfRate = taxRate / 2;
      const cgst = Math.round((calculatedTotal * (halfRate / 100)) * 100) / 100;
      const sgst = Math.round((calculatedTotal * (halfRate / 100)) * 100) / 100;
      return {
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: 0,
        totalWithTax: Math.round(calculatedTotal + cgst + sgst)
      };
    } else if (taxMode === "igst") {
      const igst = Math.round((calculatedTotal * (taxRate / 100)) * 100) / 100;
      return {
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: igst,
        totalWithTax: Math.round(calculatedTotal + igst)
      };
    }
    return {
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalWithTax: Math.round(calculatedTotal)
    };
  }, [calculatedTotal, taxMode, taxRate]);

  const handleTaxModeChange = (mode: "none" | "cgst_sgst" | "igst") => {
    setTaxMode(mode);
    const newTot = calculateTotalWithTax(calculatedTotal, mode, taxRate);
    if (newTot > 0) {
      setAmount(String(newTot));
    }
  };

  const handleTaxRateChange = (rate: number) => {
    setTaxRate(rate);
    const newTot = calculateTotalWithTax(calculatedTotal, taxMode, rate);
    if (newTot > 0) {
      setAmount(String(newTot));
    }
  };

  const gstOptions = [
    { value: "none", label: "None (0%)" },
    { value: "cgst_sgst_5", label: "CGST + SGST @ 5%" },
    { value: "cgst_sgst_12", label: "CGST + SGST @ 12%" },
    { value: "cgst_sgst_18", label: "CGST + SGST @ 18%" },
    { value: "cgst_sgst_28", label: "CGST + SGST @ 28%" },
    { value: "igst_5", label: "Only GST @ 5%" },
    { value: "igst_12", label: "Only GST @ 12%" },
    { value: "igst_18", label: "Only GST @ 18%" },
    { value: "igst_28", label: "Only GST @ 28%" },
    { value: "custom_cgst_sgst", label: "Custom CGST + SGST" },
    { value: "custom_igst", label: "Custom Only GST" }
  ];

  const currentGstDropdownValue = useMemo(() => {
    if (taxMode === "none") return "none";
    if (isCustomTaxRate) {
      return taxMode === "cgst_sgst" ? "custom_cgst_sgst" : "custom_igst";
    }
    if (taxMode === "cgst_sgst") {
      if ([5, 12, 18, 28].includes(taxRate)) return `cgst_sgst_${taxRate}`;
      return "custom_cgst_sgst";
    }
    if (taxMode === "igst") {
      if ([5, 12, 18, 28].includes(taxRate)) return `igst_${taxRate}`;
      return "custom_igst";
    }
    return "none";
  }, [taxMode, taxRate, isCustomTaxRate]);

  const handleGstDropdownChange = (val: string) => {
    if (val === "none") {
      setTaxMode("none");
      setIsCustomTaxRate(false);
      const newTot = calculateTotalWithTax(calculatedTotal, "none", 0);
      if (newTot > 0) setAmount(String(newTot));
    } else if (val.startsWith("cgst_sgst_")) {
      const rate = parseFloat(val.replace("cgst_sgst_", "")) || 5;
      setTaxMode("cgst_sgst");
      setTaxRate(rate);
      setIsCustomTaxRate(false);
      const newTot = calculateTotalWithTax(calculatedTotal, "cgst_sgst", rate);
      if (newTot > 0) setAmount(String(newTot));
    } else if (val.startsWith("igst_")) {
      const rate = parseFloat(val.replace("igst_", "")) || 5;
      setTaxMode("igst");
      setTaxRate(rate);
      setIsCustomTaxRate(false);
      const newTot = calculateTotalWithTax(calculatedTotal, "igst", rate);
      if (newTot > 0) setAmount(String(newTot));
    } else if (val === "custom_cgst_sgst") {
      setTaxMode("cgst_sgst");
      setIsCustomTaxRate(true);
    } else if (val === "custom_igst") {
      setTaxMode("igst");
      setIsCustomTaxRate(true);
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
        if (Array.isArray(live)) {
          const scoped = live.filter((v: any) => (v.company_id || currentCid) === currentCid);
          setRawVendors(scoped);
          const names = scoped
            .map((v: any) => v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim())
            .filter(Boolean);
          setVendorsList(Array.from(new Set(names)));
          return;
        }
      } catch { }

      try {
        const saved = getTenantItem<any[]>("texaflow_vendors");
        if (Array.isArray(saved)) {
          const scoped = saved.filter((v: any) => (v.company_id || currentCid) === currentCid);
          setRawVendors(scoped);
          const names = scoped
            .map((v: any) => v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim())
            .filter(Boolean);
          setVendorsList(Array.from(new Set(names)));
        } else {
          setRawVendors([]);
          setVendorsList([]);
        }
      } catch { }
    }
    loadVendors();
  }, []);



  // Load record for edit mode
  useEffect(() => {
    if (!editId) return;

    const populateFromRecord = (matched: any) => {
      if (!matched) return;
      setPurchaseNo(matched.purchase_no || "");
      setBillDate(matched.date || getTodayStr());
      setVendorName(matched.vendor_name || "");
      setCategory(matched.category || "");
      setCategorySearch(matched.category || "");
      setItemsDescription(matched.items_description || "");
      setAmount(String(matched.amount || ""));
      if (matched.tax_mode) {
        setTaxMode(matched.tax_mode);
      } else if (matched.cgst_amount || matched.sgst_amount) {
        setTaxMode("cgst_sgst");
      } else if (matched.igst_amount) {
        setTaxMode("igst");
      }
      if (matched.tax_rate) {
        setTaxRate(Number(matched.tax_rate));
      }
      setPaymentStatus(matched.payment_status === "Pending" ? "Pending" : "Paid");
      setPaymentTerms(matched.payment_terms || (matched.payment_status === "Pending" ? "Net 45" : "Cash / Immediate"));
      setCreditDays(matched.credit_days !== undefined ? matched.credit_days : (matched.payment_status === "Pending" ? 45 : 0));
      setDueDate(matched.due_date || (matched.credit_days ? calculateDueDate(matched.date, matched.credit_days) : ""));
      setNotes(matched.notes || "");

      // Load line items if present (handling JSON string or array)
      let loadedItems = matched.items;
      if (typeof loadedItems === "string") {
        try {
          loadedItems = JSON.parse(loadedItems);
        } catch {
          loadedItems = null;
        }
      }

      if (Array.isArray(loadedItems) && loadedItems.length > 0) {
        setLineItems(
          loadedItems.map((it: any, idx: number) => {
            const qty = it.quantity !== undefined && it.quantity !== null ? String(it.quantity) : "";
            const amt = it.amount !== undefined && it.amount !== null ? String(it.amount) : "";
            let rate = it.rate !== undefined && it.rate !== null ? String(it.rate) : "";
            if (!rate && amt) {
              const wNum = it.weight ? parseFloat(String(it.weight)) : 0;
              const qNum = parseFloat(qty);
              const aNum = parseFloat(amt);
              if (wNum > 0 && aNum > 0) {
                rate = String(Math.round((aNum / wNum) * 100) / 100);
              } else if (qNum > 0 && aNum > 0) {
                rate = String(Math.round((aNum / qNum) * 100) / 100);
              }
            }
            return {
              id: it.id || `item-${idx + 1}`,
              category: it.category || matched.category || "",
              description: it.description || it.items_description || "",
              quantity: qty,
              weight: it.weight !== undefined && it.weight !== null ? String(it.weight) : "",
              cartoon: it.cartoon !== undefined && it.cartoon !== null ? String(it.cartoon) : "",
              rate: rate,
              amount: amt
            };
          })
        );
      } else if (matched.items_description) {
        const parsedBreakdown = parseMaterialDescription(matched.items_description);
        if (parsedBreakdown && parsedBreakdown.isBreakdown && parsedBreakdown.items && parsedBreakdown.items.length > 0) {
          setLineItems(
            parsedBreakdown.items.map((sub: any, idx: number) => {
              const qty = sub.qty || "";
              const amt = sub.amount || "";
              let rate = sub.rate || "";
              if (!rate && amt) {
                const wNum = sub.weight ? parseFloat(String(sub.weight)) : 0;
                const qNum = parseFloat(qty);
                const aNum = parseFloat(amt);
                if (wNum > 0 && aNum > 0) {
                  rate = String(Math.round((aNum / wNum) * 100) / 100);
                } else if (qNum > 0 && aNum > 0) {
                  rate = String(Math.round((aNum / qNum) * 100) / 100);
                }
              }
              return {
                id: `item-${idx + 1}`,
                category: matched.category || "",
                description: sub.shade || "",
                quantity: qty,
                weight: sub.weight || "",
                cartoon: sub.cartoon || "",
                rate: rate,
                amount: amt
              };
            })
          );
        } else {
          setLineItems([
            {
              id: "item-1",
              category: matched.category || "",
              description: matched.items_description || "",
              quantity: "",
              weight: "",
              cartoon: "",
              rate: "",
              amount: String(matched.amount || "")
            }
          ]);
        }
      } else {
        setLineItems([
          {
            id: "item-1",
            category: matched.category || "",
            description: "",
            quantity: "",
            weight: "",
            cartoon: "",
            rate: "",
            amount: String(matched.amount || "")
          }
        ]);
      }
    };

    const currentCid = getStoredCompanyId() || "comp-001";
    const list = getTenantItem<any[]>("texaflow_purchases") || [];
    const localMatched = list.find((item: any) => item.id === editId || item.purchase_no === editId);
    if (localMatched) {
      populateFromRecord(localMatched);
    }

    async function fetchFromApi() {
      try {
        const record = await fetchApi<any>(`/purchases/${editId}`);
        if (record) {
          populateFromRecord(record);
        }
      } catch {
        try {
          const all = await fetchApi<any[]>("/purchases");
          if (Array.isArray(all)) {
            const m = all.find((p: any) => p.id === editId || p.purchase_no === editId);
            if (m) populateFromRecord(m);
          }
        } catch { }
      }
    }
    fetchFromApi();
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

  const handleSavePurchase = async (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (isSaving) return;

    if (!purchaseNo.trim()) {
      alert(t("Please enter Purchase Bill No."));
      return;
    }

    if (!vendorName.trim()) {
      alert(t("Please select or enter party name."));
      return;
    }
    let numAmount = parseFloat(amount);
    if ((isNaN(numAmount) || numAmount <= 0) && totalWithTax > 0) {
      numAmount = totalWithTax;
      setAmount(String(totalWithTax));
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      alert(t("Please enter a valid bill amount."));
      return;
    }

    setIsSaving(true);
    const currentCid = getStoredCompanyId() || "comp-001";
    const recordId = isEditMode && editId ? editId : `pur-${Date.now()}`;

    // Filter valid line items
    const validItems = lineItems.filter(
      (it) => it.description.trim() || it.category.trim() || it.quantity.trim() || it.amount.trim() || (it.weight && it.weight.trim()) || (it.cartoon && it.cartoon.trim())
    );
    const itemsToSave = validItems.length > 0 ? validItems : lineItems;

    // Derived category string (unique categories joined by comma, or primary category)
    const distinctCategories = Array.from(new Set(itemsToSave.map((it) => it.category.trim()).filter(Boolean)));
    const primaryCategory = distinctCategories.length > 0 ? distinctCategories.join(", ") : (category || "");

    // Derived items_description: e.g. "124-LL - 14 Box, 351 - 17 Box"
    let derivedDescription = itemsToSave
      .filter((it) => it.description.trim() || it.quantity.trim())
      .map((it) => `${it.description.trim()}${it.quantity.trim() ? ` - ${it.quantity.trim()}` : ""}${it.amount.trim() ? ` (₹${it.amount.trim()})` : ""}`)
      .join(", ");

    if (!derivedDescription && itemsDescription) {
      derivedDescription = itemsDescription;
    }

    const totalWeightNum = Math.round(itemsToSave.reduce((acc, it) => acc + (parseFloat(it.weight || "0") || 0), 0) * 1000) / 1000;
    const totalCartoonNum = itemsToSave.reduce((acc, it) => acc + (parseInt(it.cartoon || "0") || 0), 0);

    const purchasePayload = {
      id: recordId,
      company_id: currentCid,
      purchase_no: purchaseNo.trim(),
      date: billDate,
      vendor_name: vendorName.trim(),
      category: primaryCategory,
      items_description: derivedDescription,
      items: itemsToSave,
      amount: Math.round(numAmount),
      payment_status: paymentStatus,
      credit_days: paymentStatus === "Paid" ? 0 : creditDays,
      notes: notes.trim()
    };

    try {
      if (isEditMode) {
        const res = await fetchApi<any>(`/purchases/${recordId}`, {
          method: "PUT",
          body: JSON.stringify(purchasePayload)
        });
        if (res && res.purchase_no) {
          purchasePayload.purchase_no = res.purchase_no;
        }
      } else {
        const res = await fetchApi<any>("/purchases", {
          method: "POST",
          body: JSON.stringify(purchasePayload)
        });
        if (res && res.id) {
          purchasePayload.id = res.id;
          if (res.purchase_no) {
            purchasePayload.purchase_no = res.purchase_no;
          }
        }
      }
    } catch (err: any) {
      console.error("Backend save error:", err);
      setIsSaving(false);
      alert(t("Error saving purchase bill: ") + (err?.message || "Please check connection"));
      return;
    }

    try {
      const saved = getTenantItem<any[]>("texaflow_purchases") || [];
      const updatedList = isEditMode
        ? saved.map((p: any) => (p.id === recordId || p.purchase_no === recordId ? purchasePayload : p))
        : [purchasePayload, ...saved.filter((p: any) => p.id !== purchasePayload.id && p.purchase_no !== purchasePayload.purchase_no)];
      setTenantItem("texaflow_purchases", updatedList);
      invalidateApiCache("/purchases");
      window.dispatchEvent(new CustomEvent("texaflow_purchases_updated"));
      window.dispatchEvent(new Event("app_data_update"));
    } catch { }

    router.push("/purchases");
  };



  return (
    <div className="w-full space-y-3.5 select-none pb-24 animate-in fade-in duration-150 text-xs font-sans">
      {/* 1. TOP HEADER TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-3 flex items-center justify-between gap-3 text-xs">
        <h2 className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">
          {isEditMode ? t("EDIT RAW MATERIAL PURCHASE BILL") : t("NEW RAW MATERIAL PURCHASE BILL")}
        </h2>
        <Link
          href="/purchases"
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("Back to Purchase List")}</span>
        </Link>
      </div>

      <form
        onSubmit={handleSavePurchase}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleSavePurchase();
          }
        }}
        className="space-y-3.5 pb-28"
      >
        {/* BOX 1: SUPPLIER & BILL SPECIFICATIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs relative z-30">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* LEFT COLUMN: SUPPLIER / PARTY */}
            <div className="p-4 sm:p-5 md:pr-8 space-y-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                {t("Supplier / Party*")}
              </label>

              <div className="relative" ref={vendorDropdownRef}>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="supplier-party-input"
                    type="text"
                    value={vendorName}
                    onChange={(e) => {
                      setVendorName(e.target.value);
                      setIsVendorDropdownOpen(true);
                    }}
                    onFocus={() => setIsVendorDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (isVendorDropdownOpen && filteredVendors.length > 0) {
                          const exact = filteredVendors.find(v => v.toLowerCase() === vendorName.toLowerCase().trim());
                          if (exact) {
                            handleVendorSelect(exact);
                          } else if (vendorName.trim().length > 0) {
                            handleVendorSelect(filteredVendors[0]);
                          }
                        }
                        setIsVendorDropdownOpen(false);
                        setTimeout(() => {
                          document.getElementById("bill-no-input")?.focus();
                        }, 50);
                      }
                    }}
                    placeholder={t("Search or enter party name...")}
                    className="w-full h-9 pl-9 pr-14 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-bold text-slate-900 text-xs shadow-2xs focus:outline-none transition-all"
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
                      <ChevronDown className={`w-4 h-4 transition-transform ${isVendorDropdownOpen ? "rotate-180 text-blue-600" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* VENDOR DROPDOWN */}
                {isVendorDropdownOpen && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 max-h-60 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                    {filteredVendors.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs font-medium">
                        {vendorName ? `No registered party matching "${vendorName}". Keep typing to use custom name.` : t("No parties found.")}
                      </div>
                    ) : (
                      filteredVendors.map((v) => {
                        const isSelected = vendorName.toLowerCase().trim() === v.toLowerCase().trim();
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => handleVendorSelect(v)}
                            className={`w-full text-left px-3 py-2 hover:bg-blue-50/70 rounded-xl font-bold text-slate-800 text-xs flex items-center justify-between cursor-pointer transition-colors ${isSelected ? "bg-blue-50 text-blue-900 font-extrabold" : ""
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

            {/* RIGHT COLUMN: INVOICE SPECIFICATIONS */}
            <div className="p-4 sm:p-5 md:pl-8 space-y-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                {t("Invoice Specifications*")}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* BILL NO */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    {t("Bill / Challan No*")}
                  </span>
                  <input
                    id="bill-no-input"
                    type="text"
                    value={purchaseNo}
                    onChange={(e) => setPurchaseNo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        document.getElementById("bill-date-btn")?.focus();
                      }
                    }}
                    placeholder="e.g. PB-001"
                    className="w-full h-9 px-3 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono font-bold text-slate-900 text-xs shadow-2xs focus:outline-none transition-all"
                    required
                  />
                </div>

                {/* BILL DATE */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    {t("Bill / Inward Date*")}
                  </span>
                  <CustomDatePicker
                    id="bill-date-btn"
                    value={billDate}
                    onChange={(newDate) => setBillDate(newDate)}
                    onEnterNext={() => {
                      document.getElementById("item-desc-0")?.focus();
                    }}
                    placeholder="DD-MM-YYYY"
                  />
                </div>
              </div>

              {/* DUE DATE DISPLAY */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs mt-1">
                <span className="text-slate-600 font-medium">
                  {t("Settlement Due Date")}:
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {paymentStatus === "Paid" ? t("Immediate (Paid)") : `${dueDate || billDate} (${creditDays}d)`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOX 2: PURCHASE ITEMS / MATERIALS BREAKDOWN */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs relative z-20">
          {/* HEADER TOOLBAR */}
          <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2.5 rounded-t-2xl">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
              {t("Purchase Items / Materials Breakdown")}
            </h3>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t("Add Item Row")}</span>
            </button>
          </div>

          {/* TABLE */}
          <div className="overflow-visible">
            <table className="w-full text-left border-collapse text-xs min-w-[880px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-extrabold tracking-wider text-slate-600 uppercase">
                  <th className="py-2.5 px-3 w-12 text-center">{t("SR")}</th>
                  <th className="py-2.5 px-3 w-44">{t("CATEGORY*")}</th>
                  <th className="py-2.5 px-3 min-w-[200px]">{t("ITEM*")}</th>
                  <th className="py-2.5 px-3 w-32">{t("QUANTITY / UNIT")}</th>
                  <th className="py-2.5 px-3 w-28">{t("WEIGHT")}</th>
                  <th className="py-2.5 px-3 w-24">{t("CARTOON")}</th>
                  <th className="py-2.5 px-3 w-28 text-right">{t("RATE (₹)")}</th>
                  <th className="py-2.5 px-3 w-32 text-right">{t("AMOUNT (₹)*")}</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {lineItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${openCategoryItemId === item.id ? "relative z-30 bg-blue-50/20" : "hover:bg-slate-50/70"}`}
                  >
                    {/* INDEX */}
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-400 text-xs">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    {/* CATEGORY (CUSTOM MODERN DROPDOWN) */}
                    <td className={`py-2 px-3 ${openCategoryItemId === item.id ? "relative z-40" : ""}`}>
                      <div
                        className="relative w-full"
                        ref={(el) => {
                          categoryItemDropdownRefs.current[item.id] = el;
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenCategoryItemId(openCategoryItemId === item.id ? null : item.id)}
                          className={`w-full h-9 px-3 bg-white hover:bg-slate-50 border rounded-xl font-bold text-slate-800 text-xs flex items-center justify-between shadow-2xs cursor-pointer transition-all ${openCategoryItemId === item.id ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-300"
                            }`}
                        >
                          <span className={`truncate ${item.category ? "text-slate-900" : "text-slate-400 font-normal"}`}>
                            {item.category || t("Select Category...")}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 transition-transform ${openCategoryItemId === item.id ? "rotate-180 text-blue-600" : ""}`} />
                        </button>

                        {openCategoryItemId === item.id && (
                          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[100] w-full bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 max-h-60 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                            {categoriesList.length === 0 ? (
                              <div className="px-3 py-3 text-slate-400 text-xs font-medium text-center">
                                No material categories found.
                              </div>
                            ) : (
                              categoriesList.map((c) => {
                                const isSelected = item.category === c;
                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => {
                                      handleUpdateLineItem(item.id, "category", c);
                                      setOpenCategoryItemId(null);
                                    }}
                                    className={`w-full text-left px-3 py-2 hover:bg-blue-50/70 rounded-xl font-bold text-slate-800 text-xs flex items-center justify-between cursor-pointer transition-colors ${isSelected ? "bg-blue-50 text-blue-900 font-extrabold" : ""
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
                    </td>

                    {/* DESCRIPTION / SHADE */}
                    <td className="py-2 px-3">
                      <input
                        id={`item-desc-${index}`}
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateLineItem(item.id, "description", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            document.getElementById(`item-qty-${index}`)?.focus();
                          }
                        }}
                        placeholder={t("e.g. 124-LL, 370 White")}
                        className="w-full h-9 px-3 bg-white hover:bg-slate-50 border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-bold text-slate-900 text-xs focus:outline-none transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                        required={index === 0}
                      />
                    </td>

                    {/* QUANTITY */}
                    <td className="py-2 px-3">
                      <input
                        id={`item-qty-${index}`}
                        type="text"
                        value={item.quantity}
                        onChange={(e) => handleUpdateLineItem(item.id, "quantity", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            document.getElementById(`item-weight-${index}`)?.focus();
                          }
                        }}
                        placeholder={t("e.g. 10 Box")}
                        className="w-full h-9 px-2.5 bg-white hover:bg-slate-50 border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono font-bold text-slate-800 text-xs focus:outline-none transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                      />
                    </td>

                    {/* WEIGHT */}
                    <td className="py-2 px-3">
                      <input
                        id={`item-weight-${index}`}
                        type="text"
                        value={item.weight || ""}
                        onChange={(e) => handleUpdateLineItem(item.id, "weight", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            document.getElementById(`item-cartoon-${index}`)?.focus();
                          }
                        }}
                        placeholder={t("e.g. 25.50")}
                        className="w-full h-9 px-2.5 bg-white hover:bg-slate-50 border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono font-bold text-slate-800 text-xs focus:outline-none transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                      />
                    </td>

                    {/* CARTOON */}
                    <td className="py-2 px-3">
                      <input
                        id={`item-cartoon-${index}`}
                        type="text"
                        value={item.cartoon || ""}
                        onChange={(e) => handleUpdateLineItem(item.id, "cartoon", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            document.getElementById(`item-rate-${index}`)?.focus();
                          }
                        }}
                        placeholder={t("e.g. 1")}
                        className="w-full h-9 px-2.5 bg-white hover:bg-slate-50 border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono font-bold text-slate-800 text-xs focus:outline-none transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                      />
                    </td>

                    {/* RATE */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-xs">₹</span>
                        <input
                          id={`item-rate-${index}`}
                          type="number"
                          step="any"
                          min="0"
                          value={item.rate || ""}
                          onChange={(e) => handleUpdateLineItem(item.id, "rate", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              document.getElementById(`item-amt-${index}`)?.focus();
                            }
                          }}
                          placeholder="0.00"
                          className="w-full h-9 pl-6 pr-2.5 bg-white hover:bg-slate-50 border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono font-bold text-slate-800 text-xs focus:outline-none transition-all shadow-2xs text-right placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>
                    </td>

                    {/* AMOUNT */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-xs">₹</span>
                        <input
                          id={`item-amt-${index}`}
                          type="number"
                          step="any"
                          min="0"
                          value={item.amount}
                          onChange={(e) => handleUpdateLineItem(item.id, "amount", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (index < lineItems.length - 1) {
                                document.getElementById(`item-desc-${index + 1}`)?.focus();
                              } else {
                                document.getElementById("notes-input")?.focus();
                              }
                            }
                          }}
                          placeholder="0.00"
                          className="w-full h-9 pl-6 pr-2.5 bg-white hover:bg-slate-50 border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono font-black text-slate-900 text-xs focus:outline-none transition-all shadow-2xs text-right placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>
                    </td>

                    {/* REMOVE BUTTON */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(item.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${lineItems.length > 1
                            ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
                          }`}
                        title="Remove Row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* TABLE FOOTER */}
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/90 font-bold text-slate-700">
                  <td colSpan={6} className="py-2.5 px-4 text-xs text-slate-500 font-mono">
                    <span className="inline-flex items-center gap-1.5 font-bold text-slate-600">
                      <span>{lineItems.length}</span>
                      <span>{lineItems.length === 1 ? t("Item") : t("Items")}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                    {t("Items Total:")}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      ₹{calculatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* BOX 3: SETTLEMENT & ACCOUNTING SUMMARY */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* LEFT COLUMN: PAYMENT TERMS & REMARKS */}
            <div className="p-4 sm:p-5 md:pr-8 space-y-3.5">
              {/* PAYMENT STATUS TOGGLE */}
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-3 items-center text-xs">
                <label className="font-bold text-slate-800 uppercase tracking-wide block">
                  {t("Payment Status*")}
                </label>
                <div className="flex items-center gap-2">
                  {/* PAID */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentStatus("Paid");
                      setCreditDays(0);
                      setPaymentTerms("Cash / Immediate");
                    }}
                    className={`flex-1 h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${paymentStatus === "Paid"
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-extrabold"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t("Paid")}</span>
                  </button>

                  {/* PENDING / CREDIT */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentStatus("Pending");
                      if (creditDays === 0) setCreditDays(45);
                      setPaymentTerms("Net 45");
                    }}
                    className={`flex-1 h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${paymentStatus === "Pending"
                        ? "bg-amber-600 text-white border-amber-600 shadow-2xs font-extrabold"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t("Pending / Credit")}</span>
                  </button>
                </div>
              </div>

              {/* CREDIT TERMS SELECTION */}
              {paymentStatus === "Pending" && (
                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-3 items-center text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-900 uppercase tracking-wide block">
                      {t("Credit Term")}:
                    </span>
                    <span className="font-mono text-[11px] text-amber-800 block">
                      {creditDays}d ({dueDate || billDate})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
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
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer border ${isSelected
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-extrabold"
                              : "bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50"
                            }`}
                        >
                          {days}d
                        </button>
                      );
                    })}
                    <div className="inline-flex items-center gap-1 bg-white border border-amber-200 rounded-lg px-2 py-0.5">
                      <span className="text-[10px] text-slate-400 font-medium">{t("Custom")}:</span>
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
                        className="w-10 h-4 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400">{t("Days")}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* REMARKS */}
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-3 items-start text-xs pt-1 border-t border-slate-100">
                <label className="font-bold text-slate-800 uppercase tracking-wide block pt-1.5">
                  {t("Remarks / Notes")}:
                </label>
                <VoiceTextarea
                  id="notes-input"
                  rows={2}
                  placeholder={t("Add optional notes (Press Enter to Save Bill)...")}
                  value={notes}
                  onChangeValue={(val) => setNotes(val)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSavePurchase();
                    }
                  }}
                />
              </div>
            </div>

            {/* RIGHT COLUMN: BILL ACCOUNTING SUMMARY */}
            <div className="p-4 sm:p-5 md:pl-8 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {t("Bill Accounting Summary")}
                </h4>
                {calculatedTotal > 0 && Math.abs(totalWithTax - (parseFloat(amount) || 0)) < 0.01 && (
                  <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Auto-Calculated</span>
                  </span>
                )}
              </div>

              {/* 1. Items Gross Total / Subtotal Row */}
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="font-bold text-slate-700 whitespace-nowrap">
                  {t("Items Gross Total")}:
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm text-right">
                  ₹{calculatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* 2. GST / Tax Dropdown Selection */}
              <div className="flex items-center justify-between gap-4 text-xs pt-1 border-t border-slate-100">
                <span className="font-bold text-slate-700 whitespace-nowrap shrink-0">
                  {t("GST / Tax")}:
                </span>
                <div className="w-52 sm:w-60 shrink-0 flex items-center gap-2 justify-end">
                  <div className="w-full">
                    <CustomSelect
                      value={currentGstDropdownValue}
                      onChange={handleGstDropdownChange}
                      options={gstOptions}
                      placeholder={t("Select GST / Tax...")}
                    />
                  </div>
                  {isCustomTaxRate && (
                    <div className="w-16 shrink-0 relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Rate"
                        value={taxRate || ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          handleTaxRateChange(v);
                        }}
                        className="w-full h-9 pl-2 pr-5 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono font-bold text-slate-900 text-xs shadow-2xs focus:outline-none text-right"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* GST Breakdown details (Right-aligned) */}
              {taxMode === "cgst_sgst" && (
                <div className="space-y-1 pl-2 border-l-2 border-blue-100 text-xs text-slate-500">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium whitespace-nowrap">
                      ↳ CGST ({(taxRate / 2).toFixed(1)}%):
                    </span>
                    <span className="font-mono font-bold text-slate-800 text-right">
                      + ₹{cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium whitespace-nowrap">
                      ↳ SGST ({(taxRate / 2).toFixed(1)}%):
                    </span>
                    <span className="font-mono font-bold text-slate-800 text-right">
                      + ₹{sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
              {taxMode === "igst" && (
                <div className="pl-2 border-l-2 border-blue-100 text-xs text-slate-500">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium whitespace-nowrap">
                      ↳ IGST ({taxRate}%):
                    </span>
                    <span className="font-mono font-bold text-slate-800 text-right">
                      + ₹{igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* 3. Final Total Bill Amount (Label in single line, compact right-aligned input matching GST box) */}
              <div className="flex items-center justify-between gap-4 text-xs pt-1.5 border-t border-slate-200">
                <div className="shrink-0">
                  <label className="font-bold text-slate-800 uppercase tracking-wide whitespace-nowrap block">
                    {t("Total Bill Amount (₹)*")}
                  </label>
                  {calculatedTotal > 0 && Math.abs(totalWithTax - (parseFloat(amount) || 0)) > 0.01 && (
                    <button
                      type="button"
                      onClick={() => setAmount(String(totalWithTax))}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer mt-0.5 block"
                    >
                      {t("Reset to ₹")}{totalWithTax.toFixed(2)}
                    </button>
                  )}
                </div>
                <div className="w-52 sm:w-60 shrink-0 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-xs">₹</span>
                  <input
                    id="total-bill-amount-input"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSavePurchase();
                      }
                    }}
                    className="w-full h-9 pl-7 pr-3 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono font-bold text-slate-900 text-xs shadow-2xs focus:outline-none transition-all text-right"
                    required
                  />
                </div>
              </div>

              {/* 4. Amount In Words */}
              {parseFloat(amount || "0") > 0 && (
                <div className="pt-1 border-t border-slate-100 text-xs space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                    {t("Amount In Words")}:
                  </span>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                    <p className="font-medium text-slate-800 italic text-xs leading-relaxed text-right sm:text-left">
                      {numberToIndianWords(parseFloat(amount || "0"))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

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
              id="save-purchase-btn"
              type="button"
              disabled={isSaving}
              onClick={handleSavePurchase}
              className={`px-5 py-2 font-extrabold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all ${isSaving
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
