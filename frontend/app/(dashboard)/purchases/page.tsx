"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { fetchApi, getCachedApi, setCachedApi, invalidateApiCache, API_BASE_URL } from "@/lib/api";
import { getTenantItem, setTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { getStoredCompanySettings, fetchLiveCompanySettings, CompanySettings, getFieldLabel } from "@/lib/companySettings";
import { useLanguage } from "@/context/LanguageContext";
import { getDueStatus, calculateDueDate, parseAnyDate } from "@/lib/creditTerms";
import {
  Plus,
  Search,
  ShoppingCart,
  Calendar,
  Trash2,
  X,
  ChevronDown,
  Check,
  FileText,
  Clock,
  Tag,
  Package,
  Layers,
  Sparkles,
  CreditCard,
  Edit3,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  Printer
} from "lucide-react";

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
        <div className="absolute z-50 left-0 min-w-full w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1">
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
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${isSelected
                      ? "bg-blue-50 text-blue-950 font-extrabold border-blue-500 shadow-2xs"
                      : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                    }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export interface ParsedPurchaseData {
  categories: string[];
  itemNames: string[];
  quantityDisplay: string;
  weightDisplay: string;
  kgDisplay?: string;
  cartoonDisplay: string;
  rateDisplay?: string;
  itemCount: number;
}

export function parsePurchaseRecord(item: PurchaseItem): ParsedPurchaseData {
  let lineItems: any = item.items;
  if (typeof lineItems === "string") {
    try {
      lineItems = JSON.parse(lineItems);
    } catch {
      lineItems = undefined;
    }
  }

  // 1. Categories Extraction
  const categorySet = new Set<string>();

  if (Array.isArray(lineItems) && lineItems.length > 0) {
    lineItems.forEach((it: any) => {
      const c = (it.category || "").trim();
      if (c && c !== "Select Category...") categorySet.add(c);
    });
  }

  if (item.category) {
    item.category
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c && c !== "Select Category...")
      .forEach((c) => categorySet.add(c));
  }

  const categories = Array.from(categorySet);
  if (categories.length === 0) {
    categories.push("Raw Material");
  }

  // 2. Item Names / Shades & Quantity Extraction
  const itemNames: string[] = [];
  let quantityDisplay = "";
  let itemCount = 0;

  if (Array.isArray(lineItems) && lineItems.length > 0) {
    const validLineItems = lineItems.filter(
      (it: any) =>
        (it.description && it.description.trim()) ||
        (it.quantity && it.quantity.toString().trim()) ||
        (it.amount && it.amount.toString().trim())
    );

    itemCount = validLineItems.length;

    validLineItems.forEach((it: any) => {
      const desc = (it.description || "").trim();
      if (desc) itemNames.push(desc);
    });

    // Check quantities - Sum total quantity across all items
    const hasAnyExplicitQty = validLineItems.some(
      (it: any) => it.quantity && it.quantity.toString().trim()
    );

    if (hasAnyExplicitQty) {
      let totalNumeric = 0;
      let hasNumeric = false;
      let detectedUnit = "";
      const rawQtyList: string[] = [];

      for (const it of validLineItems) {
        const rawQty = (it.quantity || "").toString().trim();
        if (!rawQty) continue;
        rawQtyList.push(rawQty);

        const match = rawQty.match(/^([\d.]+)\s*(.*)$/);
        if (match) {
          hasNumeric = true;
          totalNumeric += parseFloat(match[1]);
          const unit = match[2]?.trim() || "";
          if (!detectedUnit && unit) {
            detectedUnit = unit;
          }
        }
      }

      if (hasNumeric && totalNumeric > 0) {
        quantityDisplay = detectedUnit ? `${totalNumeric} ${detectedUnit}` : `${totalNumeric}`;
      } else if (rawQtyList.length > 0) {
        quantityDisplay = rawQtyList.join(", ");
      }
    }
  }

  // 3. Fallback to items_description if no items array or quantity is still blank
  if (!quantityDisplay || itemNames.length === 0) {
    const rawDesc = (item.items_description || "").trim();
    if (rawDesc) {
      let desc = rawDesc;
      if (desc.startsWith("(") && desc.endsWith(")")) {
        desc = desc.slice(1, -1).trim();
      }

      // Check if string ends with "= total" (e.g. "= 40 box")
      let explicitTotal = "";
      const endEqualMatch = desc.match(/\s*=\s*([^,=]+)$/);
      if (endEqualMatch && endEqualMatch.index !== undefined && endEqualMatch.index > 0) {
        const candidateTotal = endEqualMatch[1].trim();
        if (/\d/.test(candidateTotal)) {
          explicitTotal = candidateTotal;
          desc = desc.slice(0, endEqualMatch.index).trim();
        }
      }

      const subItems = desc.split(",").map((s) => s.trim()).filter(Boolean);
      const extractedQtys: string[] = [];

      subItems.forEach((sub) => {
        const cleanSub = sub.replace(/\(₹[^)]*\)/g, "").trim();

        if (cleanSub.includes(":")) {
          const lastColon = cleanSub.lastIndexOf(":");
          const name = cleanSub.slice(0, lastColon).trim();
          const q = cleanSub.slice(lastColon + 1).trim();
          if (name) itemNames.push(name);
          if (q && /[a-zA-Z]/.test(q)) extractedQtys.push(q);
        } else if (cleanSub.includes("-")) {
          const lastDash = cleanSub.lastIndexOf("-");
          const name = cleanSub.slice(0, lastDash).trim();
          const q = cleanSub.slice(lastDash + 1).trim();
          if (name) itemNames.push(name);
          // Only treat as quantity if it has numbers
          if (q && /^[\d.]+\s*[a-zA-Z]*$/.test(q)) {
            extractedQtys.push(q);
          }
        } else {
          if (cleanSub) itemNames.push(cleanSub);
        }
      });

      if (explicitTotal && !quantityDisplay) {
        quantityDisplay = explicitTotal;
      } else if (!quantityDisplay && extractedQtys.length > 0) {
        let sumNum = 0;
        let canSum = false;
        let unit = "";
        for (const q of extractedQtys) {
          const m = q.match(/^([\d.]+)\s*(.*)$/);
          if (m) {
            canSum = true;
            sumNum += parseFloat(m[1]);
            if (!unit && m[2]) unit = m[2].trim();
          }
        }
        if (canSum && sumNum > 0) {
          quantityDisplay = unit ? `${sumNum} ${unit}` : `${sumNum}`;
        } else {
          quantityDisplay = extractedQtys.join(", ");
        }
      }
    }
  }

  // 4. Weight & Cartoon extraction
  let weightDisplay = "";
  if (item.total_weight !== undefined && item.total_weight !== null && Number(item.total_weight) > 0) {
    weightDisplay = Number(item.total_weight).toFixed(2);
  } else if (item.weight !== undefined && item.weight !== null && Number(item.weight) > 0) {
    weightDisplay = Number(item.weight).toFixed(2);
  } else if (Array.isArray(lineItems) && lineItems.length > 0) {
    const wSum = lineItems.reduce((acc: number, it: any) => acc + (parseFloat(it.weight || "0") || 0), 0);
    if (wSum > 0) {
      weightDisplay = wSum.toFixed(2);
    }
  }

  let cartoonDisplay = "";
  if (item.total_cartoon !== undefined && item.total_cartoon !== null && Number(item.total_cartoon) > 0) {
    cartoonDisplay = String(item.total_cartoon);
  } else if (item.cartoon !== undefined && item.cartoon !== null && Number(item.cartoon) > 0) {
    cartoonDisplay = String(item.cartoon);
  } else if (Array.isArray(lineItems) && lineItems.length > 0) {
    const cSum = lineItems.reduce((acc: number, it: any) => acc + (parseInt(it.cartoon || "0") || 0), 0);
    if (cSum > 0) {
      cartoonDisplay = String(cSum);
    }
  }

  let kgDisplay = "";
  if ((item as any).total_kg !== undefined && (item as any).total_kg !== null && Number((item as any).total_kg) > 0) {
    kgDisplay = Number((item as any).total_kg).toFixed(2);
  } else if ((item as any).kg !== undefined && (item as any).kg !== null && Number((item as any).kg) > 0) {
    kgDisplay = Number((item as any).kg).toFixed(2);
  } else if (Array.isArray(lineItems) && lineItems.length > 0) {
    const kSum = lineItems.reduce((acc: number, it: any) => acc + (parseFloat(it.kg || "0") || 0), 0);
    if (kSum > 0) {
      kgDisplay = kSum.toFixed(2);
    }
  }

  // 5. Rate extraction
  let rateDisplay = "";
  if (Array.isArray(lineItems) && lineItems.length > 0) {
    const firstWithRate = lineItems.find((it: any) => it.rate && parseFloat(String(it.rate)) > 0);
    if (firstWithRate?.rate) {
      const r = parseFloat(String(firstWithRate.rate));
      rateDisplay = `₹${r.toFixed(2)}`;
    }
  }

  if (!rateDisplay && Number(item.amount) > 0) {
    const amt = Number(item.amount);
    const w = parseFloat(weightDisplay);
    if (!isNaN(w) && w > 0) {
      rateDisplay = `₹${(amt / w).toFixed(2)}`;
    } else {
      const matchQ = (quantityDisplay || "").match(/^([\d.]+)/);
      if (matchQ) {
        const q = parseFloat(matchQ[1]);
        if (!isNaN(q) && q > 0) {
          rateDisplay = `₹${(amt / q).toFixed(2)}`;
        }
      }
    }
  }

  const uniqueItemNames = Array.from(new Set(itemNames)).filter(Boolean);
  if (itemCount === 0) {
    itemCount = uniqueItemNames.length > 0 ? uniqueItemNames.length : 1;
  }

  return {
    categories,
    itemNames: uniqueItemNames,
    quantityDisplay: quantityDisplay || "-",
    weightDisplay: weightDisplay || "-",
    kgDisplay: kgDisplay || "-",
    cartoonDisplay: cartoonDisplay || "-",
    rateDisplay: rateDisplay || "-",
    itemCount
  };
}

function CategoryDisplayCell({
  item,
  t
}: {
  item: PurchaseItem;
  t: (key: string) => string;
}) {
  const { categories } = parsePurchaseRecord(item);

  if (categories.length === 0) {
    return <span className="text-slate-800 font-black text-sm select-none">-</span>;
  }

  return (
    <div className="py-0.5 max-w-[140px]">
      <span
        className="font-bold text-slate-900 text-xs truncate block tracking-tight"
        title={categories.map((c) => t(c)).join(", ")}
      >
        {categories.map((c) => t(c)).join(", ")}
      </span>
    </div>
  );
}

function ItemDescriptionDisplayCell({
  item
}: {
  item: PurchaseItem;
}) {
  const { itemNames, itemCount } = parsePurchaseRecord(item);
  const count = itemCount || itemNames.length || 0;

  return (
    <div className="text-center py-0.5">
      <span className="font-mono text-xs font-black text-slate-900 whitespace-nowrap">
        {count > 0 ? count : "-"}
      </span>
    </div>
  );
}

function QuantityDisplayCell({ item }: { item: PurchaseItem }) {
  const { quantityDisplay } = parsePurchaseRecord(item);

  if (!quantityDisplay || quantityDisplay === "-" || quantityDisplay === "0") {
    return <span className="text-slate-400 font-bold text-xs select-none">-</span>;
  }

  return (
    <div className="text-center">
      <span className="font-mono text-xs font-black text-slate-900 whitespace-nowrap">
        {quantityDisplay}
      </span>
    </div>
  );
}

function WeightDisplayCell({ item }: { item: PurchaseItem }) {
  const { weightDisplay } = parsePurchaseRecord(item);

  if (!weightDisplay || weightDisplay === "-") {
    return <span className="text-slate-400 font-bold text-xs select-none">-</span>;
  }

  return (
    <div className="text-center">
      <span className="font-mono text-xs font-black text-slate-900 whitespace-nowrap">
        {weightDisplay}
      </span>
    </div>
  );
}

function KgDisplayCell({ item }: { item: PurchaseItem }) {
  const { kgDisplay } = parsePurchaseRecord(item);

  if (!kgDisplay || kgDisplay === "-") {
    return <span className="text-slate-400 font-bold text-xs select-none">-</span>;
  }

  return (
    <div className="text-center">
      <span className="font-mono text-xs font-black text-slate-900 whitespace-nowrap">
        {kgDisplay}
      </span>
    </div>
  );
}

function CartoonDisplayCell({ item }: { item: PurchaseItem }) {
  const { cartoonDisplay } = parsePurchaseRecord(item);

  if (!cartoonDisplay || cartoonDisplay === "-") {
    return <span className="text-slate-400 font-bold text-xs select-none">-</span>;
  }

  return (
    <div className="text-center">
      <span className="font-mono text-xs font-black text-slate-900 whitespace-nowrap">
        {cartoonDisplay}
      </span>
    </div>
  );
}

function RateDisplayCell({ item }: { item: PurchaseItem }) {
  const { rateDisplay } = parsePurchaseRecord(item);

  if (!rateDisplay || rateDisplay === "-") {
    return <span className="text-slate-400 font-bold text-xs select-none">-</span>;
  }

  return (
    <div className="text-right">
      <span className="font-mono text-xs font-bold text-slate-800 whitespace-nowrap">
        {rateDisplay}
      </span>
    </div>
  );
}

export function getPurchaseDueInfo(item: PurchaseItem) {
  if (item.payment_status === "Bill Pending" || item.amount === 0) {
    return {
      isBillPending: true,
      isPaid: false,
      isOverdue: false,
      isDueToday: false,
      text: "Bill Pending",
      daysLeft: 0,
      badgeClass: "text-amber-800 bg-amber-50 border-amber-300 font-bold",
      statusClass: "text-amber-700 font-bold"
    };
  }

  if (item.payment_status === "Paid") {
    return {
      isPaid: true,
      isOverdue: false,
      isDueToday: false,
      text: "Settled",
      daysLeft: 0,
      badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
      statusClass: "text-emerald-600 font-bold"
    };
  }

  // Parse bill date
  const billD = parseAnyDate(item.date);
  const creditDays = typeof item.credit_days === "number" ? item.credit_days : parseInt(String(item.credit_days || "0"), 10) || 0;

  let dueD: Date | null = null;
  if (item.due_date) {
    dueD = parseAnyDate(item.due_date);
  }
  if (!dueD && billD) {
    dueD = new Date(billD.getTime());
    if (creditDays > 0) {
      dueD.setDate(dueD.getDate() + creditDays);
    }
  }

  if (!dueD) {
    return {
      isPaid: false,
      isOverdue: false,
      isDueToday: false,
      text: creditDays ? `${creditDays}d` : "Immediate",
      daysLeft: creditDays,
      badgeClass: "text-slate-700 bg-slate-100 border-slate-200 font-bold",
      statusClass: "text-amber-600 font-bold"
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueD.setHours(0, 0, 0, 0);

  const diffTime = dueD.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      isPaid: false,
      isOverdue: true,
      isDueToday: false,
      text: `${overdueDays}d Overdue`,
      daysLeft: diffDays,
      badgeClass: "text-rose-700 bg-rose-50 border-rose-300 font-black",
      statusClass: "text-rose-600 font-black"
    };
  } else if (diffDays === 0) {
    return {
      isPaid: false,
      isOverdue: false,
      isDueToday: true,
      text: "Due Today",
      daysLeft: 0,
      badgeClass: "text-amber-900 bg-amber-100 border-amber-300 font-black animate-pulse",
      statusClass: "text-amber-700 font-bold"
    };
  } else {
    return {
      isPaid: false,
      isOverdue: false,
      isDueToday: false,
      text: `${diffDays}d left`,
      daysLeft: diffDays,
      badgeClass: diffDays <= 7 ? "text-amber-800 bg-amber-50 border-amber-200 font-bold" : "text-slate-700 bg-slate-100 border-slate-200 font-medium",
      statusClass: "text-amber-600 font-bold"
    };
  }
}

export interface PurchaseItem {
  id: string;
  company_id?: string;
  record_type?: "challan" | "monthly_bill";
  purchase_no: string;
  date: string;
  category: string;
  vendor_name: string;
  items_description?: string;
  items?: any[];
  amount: number;
  tax_mode?: "none" | "cgst_sgst" | "igst";
  tax_rate?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  weight?: number;
  cartoon?: number;
  total_weight?: number;
  total_cartoon?: number;
  payment_status: "Paid" | "Pending" | "Unpaid" | "Bill Pending" | "Billed";
  paid_via?: string;
  payment_terms?: string;
  credit_days?: number;
  due_date?: string;
  notes?: string;
}


export const isMonthlyBillRecord = (item: PurchaseItem) => {
  if (item.record_type === "monthly_bill") return true;
  const no = (item.purchase_no || "").trim().toUpperCase();
  if (no.startsWith("INV-") || no.startsWith("PB-")) return true;
  return false;
};

const sanitizeChallanNotes = (rawNotes?: string) => {
  if (!rawNotes) return "";
  return rawNotes
    .replace(/\s*\|\s*Billed in\s+[^\s|]+/gi, "")
    .replace(/^Billed in\s+[^\s|]+/gi, "")
    .trim();
};

const sanitizePaymentStatus = (status: string, amount: number) => {
  if (status === "Billed") {
    return amount === 0 ? "Bill Pending" : "Pending";
  }
  return status as any;
};

const defaultSeedPurchases: PurchaseItem[] = [];

export default function PurchasesPage() {
  const { t, language } = useLanguage();
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Bill Pending" | "Pending" | "Overdue" | "Paid">("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBillImage, setSelectedBillImage] = useState<{ image: string; purchase_no: string; notes?: string } | null>(null);

  const [companySettings, setCompanySettings] = useState<CompanySettings>(getStoredCompanySettings);
  const deletedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const syncSettings = () => {
      setCompanySettings(getStoredCompanySettings());
    };
    syncSettings();

    fetchLiveCompanySettings().then((live) => {
      if (live) setCompanySettings(live);
    });

    const handleSettingsUpdate = (e: any) => {
      if (e?.detail) {
        setCompanySettings((prev) => ({ ...prev, ...e.detail }));
      } else {
        syncSettings();
      }
    };

    window.addEventListener("app_settings_update", handleSettingsUpdate);
    window.addEventListener("storage", syncSettings);
    window.addEventListener("focus", syncSettings);
    return () => {
      window.removeEventListener("app_settings_update", handleSettingsUpdate);
      window.removeEventListener("storage", syncSettings);
      window.removeEventListener("focus", syncSettings);
    };
  }, []);
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

  const [materialCategoriesList, setMaterialCategoriesList] = useState<string[]>(getInitialMaterialCategories);

  useEffect(() => {
    const loadCats = async () => {
      try {
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
          setMaterialCategoriesList(mat);
          setTenantItem("texaflow_material_categories", mat);
          if (typeof window !== "undefined") {
            localStorage.removeItem("om_sai_material_categories");
          }
          return;
        }

        const stored = getTenantItem<string[]>("texaflow_material_categories");
        if (Array.isArray(stored)) {
          setMaterialCategoriesList(Array.from(new Set(stored.map((s) => typeof s === "string" ? s.trim() : "").filter(Boolean))));
        } else {
          setMaterialCategoriesList([]);
        }
      } catch {}
    };
    loadCats();
    window.addEventListener("texaflow_material_categories_changed", loadCats);
    window.addEventListener("storage", loadCats);
    return () => {
      window.removeEventListener("texaflow_material_categories_changed", loadCats);
      window.removeEventListener("storage", loadCats);
    };
  }, []);

  const purchaseCategories = useMemo(() => {
    const catSet = new Set<string>();
    materialCategoriesList.forEach((c) => catSet.add(c));
    purchases.filter((p) => !isMonthlyBillRecord(p)).forEach((p) => {
      if (p.category) {
        p.category.split(",").map((c) => c.trim()).filter(Boolean).forEach((c) => catSet.add(c));
      }
      if (Array.isArray(p.items)) {
        p.items.forEach((it: any) => {
          if (it?.category && typeof it.category === "string" && it.category.trim()) {
            catSet.add(it.category.trim());
          }
        });
      }
    });
    return ["All", ...Array.from(catSet)];
  }, [materialCategoriesList, purchases]);

  useEffect(() => {
    let isMounted = true;
    const currentCid = getStoredCompanyId() || "comp-001";

    const loadLocal = () => {
      try {
        const stored = getTenantItem<PurchaseItem[]>("texaflow_purchases");
        if (stored && Array.isArray(stored)) {
          const scoped = stored
            .filter(
              (p: any) =>
                (!p.company_id || p.company_id === currentCid) &&
                !deletedIdsRef.current.has(p.id) &&
                (!p.purchase_no || !deletedIdsRef.current.has(p.purchase_no))
            )
            .map((p) => ({
              ...p,
              notes: sanitizeChallanNotes(p.notes),
              payment_status: sanitizePaymentStatus(p.payment_status, p.amount)
            }));
          setPurchases(scoped);
          return scoped;
        }

        const cached = getCachedApi<PurchaseItem[]>("/purchases");
        if (cached && Array.isArray(cached)) {
          const scoped = cached
            .filter(
              (p: any) =>
                (!p.company_id || p.company_id === currentCid) &&
                !deletedIdsRef.current.has(p.id) &&
                (!p.purchase_no || !deletedIdsRef.current.has(p.purchase_no))
            )
            .map((p) => ({
              ...p,
              notes: sanitizeChallanNotes(p.notes),
              payment_status: sanitizePaymentStatus(p.payment_status, p.amount)
            }));
          setPurchases(scoped);
          return scoped;
        }

        setPurchases([]);
        return [];
      } catch {
        setPurchases([]);
        return [];
      }
    };

    loadLocal();

    async function loadLive() {
      try {
        const live = await fetchApi<PurchaseItem[]>("/purchases");
        if (isMounted && Array.isArray(live)) {
          // Strictly scope records to this active tenant, excluding deleted
          const scoped = live.filter(
            (p: any) =>
              (!p.company_id || p.company_id === currentCid) &&
              !deletedIdsRef.current.has(p.id) &&
              (!p.purchase_no || !deletedIdsRef.current.has(p.purchase_no))
          );

          // Preserve local payment_status overrides so a paid bill is never reset to pending by stale backend
          const currentLocal = (getTenantItem<PurchaseItem[]>("texaflow_purchases") || []).filter(
            (p) => !deletedIdsRef.current.has(p.id) && (!p.purchase_no || !deletedIdsRef.current.has(p.purchase_no))
          );
          const localStatusMap = new Map(currentLocal.map((p) => [p.purchase_no || p.id, p.payment_status]));

          const merged = scoped.map((p) => ({
            ...p,
            notes: sanitizeChallanNotes(p.notes),
            payment_status: sanitizePaymentStatus(localStatusMap.get(p.purchase_no || p.id) || p.payment_status, p.amount)
          }));

          const finalPurchases = merged;

          setPurchases(finalPurchases);
          try {
            setTenantItem("texaflow_purchases", finalPurchases);
            setCachedApi("/purchases", finalPurchases);
          } catch { }
        }
      } catch (err) {
        console.warn("Backend purchase load notice:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadLive();

    const handleRefresh = () => {
      loadLocal();
      loadLive();
    };

    window.addEventListener("app_data_update", handleRefresh);
    window.addEventListener("texaflow_purchases_updated", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    window.addEventListener("app_refresh_content", handleRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener("app_data_update", handleRefresh);
      window.removeEventListener("texaflow_purchases_updated", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
      window.removeEventListener("app_refresh_content", handleRefresh);
    };
  }, []);

  const handleDeletePurchase = async (id: string, purchaseNo?: string) => {
    if (!confirm(t("Are you sure you want to delete this purchase bill?"))) return;

    // 1. Immediately track deleted ID & bill no so concurrent loads ignore it
    deletedIdsRef.current.add(id);
    if (purchaseNo) deletedIdsRef.current.add(purchaseNo);

    // 2. Immediately update state for instant smooth 0ms feedback without blink
    setPurchases((prev) => {
      const updated = prev.filter((p) => p.id !== id && (!purchaseNo || p.purchase_no !== purchaseNo));
      try {
        setTenantItem("texaflow_purchases", updated);
        setCachedApi("/purchases", updated);
      } catch { }
      return updated;
    });

    invalidateApiCache("/purchases");

    // 3. Perform backend DELETE
    try {
      await fetchApi(`/purchases/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("API delete notice:", err);
    }

    // 4. Invalidate cache and broadcast update to recycle bin & other components
    invalidateApiCache("/purchases");
    window.dispatchEvent(new Event("recycle_bin_updated"));
    window.dispatchEvent(new Event("app_refresh_content"));
  };



  // Delivery Challans only on this page (Monthly Bills are in dedicated sidebar page /purchases/bills)
  const allChallans = useMemo(() => purchases.filter((p) => !isMonthlyBillRecord(p)), [purchases]);
  const currentTabItems = allChallans;

  // Filter purchases
  const filteredPurchases = useMemo(() => {
    return currentTabItems.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (item.purchase_no && item.purchase_no.toLowerCase().includes(q)) ||
        (item.vendor_name && item.vendor_name.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.items_description && item.items_description.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      const isBillPending = item.payment_status === "Bill Pending" || item.amount === 0;
      const isUnpaid = (item.payment_status === "Pending" || item.payment_status === "Unpaid") && !isBillPending;
      const itemDueDate = item.due_date || (item.credit_days ? calculateDueDate(item.date, item.credit_days) : item.date);
      const dueInfo = itemDueDate ? getDueStatus(itemDueDate, !isUnpaid) : null;

      const matchesStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Bill Pending"
            ? isBillPending
            : statusFilter === "Paid"
              ? item.payment_status === "Paid"
              : statusFilter === "Overdue"
                ? isUnpaid && dueInfo?.status === "Overdue"
                : isUnpaid;

      const { categories } = parsePurchaseRecord(item);
      const matchesCategory =
        selectedCategory === "All" ||
        item.category === selectedCategory ||
        categories.includes(selectedCategory);

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [currentTabItems, search, statusFilter, selectedCategory]);

  // Aggregate Stats
  const totalPurchasesAmount = currentTabItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingCreditPurchases = currentTabItems.filter((p) => p.payment_status === "Pending" || p.payment_status === "Unpaid");
  const pendingCreditAmount = pendingCreditPurchases.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const overdueCount = pendingCreditPurchases.filter((p) => {
    const pDueDate = p.due_date || (p.credit_days ? calculateDueDate(p.date, p.credit_days) : p.date);
    if (!pDueDate) return false;
    return getDueStatus(pDueDate, false).status === "Overdue";
  }).length;

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto select-none pb-12">
      {/* 4 Stat KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* CARD 1: TOTAL PURCHASES */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {t("TOTAL PURCHASES")}
            </p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              ₹{totalPurchasesAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 2: PENDING CREDIT */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider truncate">
              {t("PENDING CREDIT")}
            </p>
            <p className="text-xl font-black text-amber-600 mt-0.5">
              ₹{pendingCreditAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 3: OVERDUE BILLS */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider truncate">
              {t("OVERDUE BILLS")}
            </p>
            <p className={`text-xl font-black ${overdueCount > 0 ? "text-rose-600" : "text-slate-900"} mt-0.5`}>
              {overdueCount}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 4: PAID / SETTLED */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider truncate">
              {t("PAID / SETTLED")}
            </p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">
              {purchases.length - pendingCreditPurchases.length}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>



      {/* Filters & Actions Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t("Search by supplier, bill no, material, choli order...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Dropdown (Matching Image 3) */}
          <div className="w-40 shrink-0">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as any)}
              options={[
                { value: "All", label: t("All Status") },
                { value: "Bill Pending", label: t("Bill Pending") },
                { value: "Pending", label: t("Pending / Credit") },
                { value: "Overdue", label: t("Overdue") },
                { value: "Paid", label: t("Paid") },
              ]}
            />
          </div>

          {/* Category Dropdown (Matching Image 3) */}
          <div className="w-40 shrink-0">
            <CustomSelect
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              options={purchaseCategories.map((cat) => ({
                value: cat,
                label: cat === "All" ? t("All Categories") : t(cat),
              }))}
            />
          </div>

          {/* New Purchase Bill Button (Single + Icon) */}
          <Link
            href="/purchases/new"
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t("New Purchase Bill")}</span>
          </Link>
        </div>
      </div>

      {/* Main Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Mobile View (< md) */}
        <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
          {filteredPurchases.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              {t("No purchase records found.")}
            </div>
          ) : (
            filteredPurchases.map((item) => {
              const isUnpaid = item.payment_status === "Pending" || item.payment_status === "Unpaid";
              const dueInfo = getPurchaseDueInfo(item);

              return (
                <div key={item.id} className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-500">{item.date}</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                      dueInfo.isBillPending
                        ? "text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"
                        : dueInfo.isPaid
                        ? "text-emerald-600"
                        : dueInfo.isOverdue
                        ? "text-rose-600"
                        : "text-amber-600"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dueInfo.isBillPending ? "bg-amber-500 animate-pulse" : dueInfo.isPaid ? "bg-emerald-500" : dueInfo.isOverdue ? "bg-rose-600" : "bg-amber-500"}`}></span>
                      <span>{dueInfo.isBillPending ? t("Bill Pending") : dueInfo.isPaid ? t("Paid") : dueInfo.isOverdue ? t("Overdue") : t("Pending / Credit")}</span>
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {item.vendor_name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {item.purchase_no}
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium">{item.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-slate-900 text-base">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  {/* Category, Items, Qty, Weight & Cartoon Row */}
                  <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                    <CategoryDisplayCell item={item} t={t} />
                    <div className="flex items-center gap-3 text-right flex-wrap justify-end">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">{t("ITEM")}</span>
                        <ItemDescriptionDisplayCell item={item} />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">{t("QTY")}</span>
                        <QuantityDisplayCell item={item} />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">{t("WEIGHT")}</span>
                        <WeightDisplayCell item={item} />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">{t("CARTOON")}</span>
                        <CartoonDisplayCell item={item} />
                      </div>
                    </div>
                  </div>

                  {/* Due Date Info */}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {t("Due")}: {item.due_date || (item.credit_days ? calculateDueDate(item.date, item.credit_days) : item.date)}
                    </span>
                    <span className={`font-mono text-xs font-bold inline-flex items-center gap-1 ${
                      dueInfo.isPaid ? "text-emerald-600" : dueInfo.isOverdue ? "text-rose-600" : "text-amber-700"
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{dueInfo.text}</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center justify-between">
                    <span className="font-bold text-slate-400 uppercase text-[10px] shrink-0">{t("Rate")}:</span>
                    <RateDisplayCell item={item} />
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    {isUnpaid ? (
                      <Link
                        href={`/payments/new?vendor=${encodeURIComponent(item.vendor_name)}&amount=${item.amount}&source=Material+Inward+Bill&ref=${item.purchase_no}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{t("Pay via Voucher")}</span>
                      </Link>
                    ) : <span />}

                    <div className="flex items-center gap-1.5">
                      <Link href={`/purchases/new?edit=${item.id}`} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title={t("Edit")}>
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button type="button" onClick={() => handleDeletePurchase(item.id, item.purchase_no)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title={t("Delete")}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (>= md) - Clean, Modern Space Allocation */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs table-fixed min-w-[1250px]">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                {/* 1. DATE */}
                <th className="py-2.5 px-2.5 w-[7%] border-r border-slate-200/80">{t("DATE")}</th>
                {/* 2. BILL / CHALLAN NO */}
                <th className="py-2.5 px-2 w-[7.5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "purchase_bill_no", t("CHALLAN NO"))}
                </th>
                {/* 3. SUPPLIER / MILL */}
                <th className="py-2.5 px-2.5 w-[14.5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "purchase_supplier", t("SUPPLIER / MILL"))}
                </th>
                {/* 4. CATEGORY */}
                <th className="py-2.5 px-2 w-[10.5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "item_name", t("CATEGORY"))}
                </th>
                {/* 5. ITEM */}
                <th className="py-2.5 px-1.5 text-center w-[4.5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "item_unit", t("ITEM"))}
                </th>
                {/* 6. QUANTITY */}
                <th className="py-2.5 px-1.5 text-center w-[6.5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "purchase_qty", t("QUANTITY"))}
                </th>
                {/* 7. WEIGHT */}
                <th className="py-2.5 px-1.5 text-center w-[5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "weight", t("WEIGHT"))}
                </th>
                {/* KG */}
                <th className="py-2.5 px-1.5 text-center w-[5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "kg", t("KG"))}
                </th>
                {/* 8. CARTOON */}
                <th className="py-2.5 px-1.5 text-center w-[4.5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "cartoon", t("CARTOON"))}
                </th>
                {/* 9. RATE (₹) */}
                <th className="py-2.5 px-2 text-right w-[7%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "purchase_rate", t("RATE (₹)"))}
                </th>
                {/* 10. GST (%) */}
                <th className="py-2.5 px-1.5 text-center w-[5.5%] border-r border-slate-200/80">
                  {t("GST (%)")}
                </th>
                {/* 11. AMOUNT (₹) */}
                <th className="py-2.5 px-2 text-right w-[8.5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "purchase_total", t("AMOUNT (₹)"))}
                </th>
                {/* 12. DUE (DAYS) */}
                <th className="py-2.5 px-1.5 text-center w-[7.5%] border-r border-slate-200/80">{t("DUE (DAYS)")}</th>
                {/* 13. STATUS */}
                <th className="py-2.5 px-2 text-center w-[8%] border-r border-slate-200/80">{t("STATUS")}</th>
                {/* 14. ACTION */}
                <th className="py-2.5 px-2 text-center w-[6.5%]">{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400 font-medium">

                    {t('No delivery challans found matching your filters. Click "+ New Purchase Bill" to add.')}
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((item) => {
                  const dueInfo = getPurchaseDueInfo(item);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors group ${
                        dueInfo.isOverdue ? "hover:bg-red-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      {/* 1. DATE */}
                      <td className="py-2.5 px-2.5 font-mono font-bold text-slate-700 whitespace-nowrap align-middle border-r border-slate-200/70">
                        {item.date}
                      </td>

                      {/* 2. BILL NO */}
                      <td className="py-2.5 px-2 whitespace-nowrap align-middle border-r border-slate-200/70">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {item.purchase_no}
                        </span>
                      </td>

                      {/* 3. SUPPLIER / MILL */}
                      <td className="py-2.5 px-2.5 align-middle border-r border-slate-200/70">
                        <Link
                          href={`/ledger?party=${encodeURIComponent(item.vendor_name)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-slate-900 hover:text-blue-600 hover:underline text-xs block truncate tracking-tight transition-colors cursor-pointer"
                          title={`View Ledger for ${item.vendor_name}`}
                        >
                          {item.vendor_name}
                        </Link>
                      </td>

                      {/* 4. CATEGORY */}
                      <td className="py-2.5 px-2 align-middle border-r border-slate-200/70">
                        <CategoryDisplayCell item={item} t={t} />
                      </td>

                      {/* 5. ITEM */}
                      <td className="py-2.5 px-1.5 text-center align-middle whitespace-nowrap border-r border-slate-200/70">
                        <ItemDescriptionDisplayCell item={item} />
                      </td>

                      {/* 6. QUANTITY */}
                      <td className="py-2.5 px-1.5 text-center align-middle whitespace-nowrap border-r border-slate-200/70">
                        <QuantityDisplayCell item={item} />
                      </td>

                      {/* 7. WEIGHT */}
                      <td className="py-2.5 px-1.5 text-center align-middle whitespace-nowrap border-r border-slate-200/70">
                        <WeightDisplayCell item={item} />
                      </td>

                      {/* KG */}
                      <td className="py-2.5 px-1.5 text-center align-middle whitespace-nowrap border-r border-slate-200/70">
                        <KgDisplayCell item={item} />
                      </td>

                      {/* 8. CARTOON */}
                      <td className="py-2.5 px-1.5 text-center align-middle whitespace-nowrap border-r border-slate-200/70">
                        <CartoonDisplayCell item={item} />
                      </td>

                      {/* 9. RATE (₹) */}
                      <td className="py-2.5 px-2 text-right align-middle whitespace-nowrap font-mono font-bold text-slate-800 text-xs tracking-tight border-r border-slate-200/70">
                        <RateDisplayCell item={item} />
                      </td>

                      {/* 10. GST (%) */}
                      <td className="py-2.5 px-1.5 text-center align-middle whitespace-nowrap border-r border-slate-200/70">
                        {item.tax_mode && item.tax_mode !== "none" && Number(item.tax_rate || 0) > 0 ? (
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            {item.tax_rate}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs select-none">-</span>
                        )}
                      </td>

                      {/* 11. AMOUNT (₹) */}
                      <td className="py-2.5 px-2 text-right align-middle whitespace-nowrap font-mono font-black text-slate-950 text-xs tracking-tight border-r border-slate-200/70">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </td>


                      {/* 11. DUE (DAYS) */}
                      <td className="py-2.5 px-1.5 text-center align-middle whitespace-nowrap border-r border-slate-200/70">
                        {dueInfo.isBillPending ? (
                          <span className="text-xs font-bold text-amber-700 inline-flex items-center gap-1 justify-center">
                            <span>-</span>
                          </span>
                        ) : dueInfo.isPaid ? (
                          <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1 justify-center">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{t("Settled")}</span>
                          </span>
                        ) : dueInfo.isOverdue ? (
                          <span className="font-mono text-xs font-bold text-rose-600 inline-flex items-center gap-1 justify-center">
                            <Clock className="w-3 h-3 text-rose-600" />
                            <span>{dueInfo.text}</span>
                          </span>
                        ) : dueInfo.isDueToday ? (
                          <span className="font-mono text-xs font-bold text-amber-700 inline-flex items-center gap-1 justify-center">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{t("Due Today")}</span>
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-bold text-amber-700 inline-flex items-center gap-1 justify-center">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{dueInfo.text}</span>
                          </span>
                        )}
                      </td>

                      {/* 12. STATUS */}
                      <td className="py-2.5 px-2 text-center align-middle whitespace-nowrap border-r border-slate-200/70">
                        {dueInfo.isBillPending ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>{t("Bill Pending")}</span>
                          </span>
                        ) : dueInfo.isPaid ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{t("Paid")}</span>
                          </span>
                        ) : dueInfo.isOverdue ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            <span>{t("Overdue")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>{t("Pending")}</span>
                          </span>
                        )}
                      </td>

                      {/* 13. ACTION */}
                      <td className="py-2.5 px-2 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/purchases/new?edit=${item.id}`}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={t("Edit")}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeletePurchase(item.id, item.purchase_no)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={t("Delete")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

    </div>
  );
}
