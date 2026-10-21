"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { fetchApi, getCachedApi, setCachedApi, invalidateApiCache } from "@/lib/api";
import { getTenantItem, setTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
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
        className={`w-full h-9 px-3.5 bg-white border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""
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
        <div className="absolute z-50 left-0 min-w-full sm:min-w-[210px] mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
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

    // Check quantities - ONLY use if user explicitly entered a quantity
    const hasAnyExplicitQty = validLineItems.some(
      (it: any) => it.quantity && it.quantity.toString().trim()
    );

    if (hasAnyExplicitQty) {
      let totalNumeric = 0;
      let hasNumeric = false;
      let detectedUnit = "";
      let mixedUnits = false;
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
          } else if (detectedUnit && unit && detectedUnit.toLowerCase() !== unit.toLowerCase()) {
            mixedUnits = true;
          }
        }
      }

      if (hasNumeric && !mixedUnits && detectedUnit && totalNumeric > 0) {
        quantityDisplay = `${totalNumeric} ${detectedUnit}`;
      } else if (hasNumeric && detectedUnit && mixedUnits) {
        quantityDisplay = rawQtyList.slice(0, 2).join(", ");
      } else if (rawQtyList.length > 0) {
        quantityDisplay = rawQtyList.slice(0, 2).join(", ");
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
          // Only treat as quantity if it has an explicit unit
          if (q && /^[\d.]+\s*[a-zA-Z]+$/.test(q)) {
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
        let canSum = true;
        let unit = "";
        for (const q of extractedQtys) {
          const m = q.match(/^([\d.]+)\s*(.+)$/);
          if (m && m[2].trim()) {
            sumNum += parseFloat(m[1]);
            if (!unit) unit = m[2].trim();
            else if (unit.toLowerCase() !== m[2].trim().toLowerCase()) canSum = false;
          } else {
            canSum = false;
          }
        }
        if (canSum && sumNum > 0 && unit) {
          quantityDisplay = `${sumNum} ${unit}`;
        } else {
          quantityDisplay = extractedQtys.join(", ");
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

  if (itemNames.length === 0) {
    return <span className="text-slate-400 font-bold text-xs select-none">-</span>;
  }

  const count = itemCount || itemNames.length;

  return (
    <div className="py-0.5 max-w-[170px]">
      <span
        className="font-extrabold text-slate-900 text-xs truncate block tracking-tight"
        title={itemNames.join(", ")}
      >
        {itemNames.slice(0, 2).join(", ")}
        {itemNames.length > 2 && (
          <span className="text-slate-500 font-semibold text-[11px] ml-1">
            (+{itemNames.length - 2})
          </span>
        )}
      </span>
      {count > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mt-1 whitespace-nowrap">
          {count} {count === 1 ? "item" : "items"}
        </span>
      )}
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

export function getPurchaseDueInfo(item: PurchaseItem) {
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
  purchase_no: string;
  date: string;
  category: string;
  vendor_name: string;
  items_description?: string;
  items?: any[];
  amount: number;
  payment_status: "Paid" | "Pending" | "Unpaid";
  paid_via?: string;
  payment_terms?: string;
  credit_days?: number;
  due_date?: string;
  notes?: string;
}

const defaultSeedPurchases: PurchaseItem[] = [];

export default function PurchasesPage() {
  const { t, language } = useLanguage();
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Overdue" | "Paid">("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBillImage, setSelectedBillImage] = useState<{ image: string; purchase_no: string; notes?: string } | null>(null);
  const [previewBill, setPreviewBill] = useState<PurchaseItem | null>(null);
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
    purchases.forEach((p) => {
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
          const scoped = stored.filter((p: any) => !p.company_id || p.company_id === currentCid);
          setPurchases(scoped);
          return scoped;
        }

        const cached = getCachedApi<PurchaseItem[]>("/purchases");
        if (cached && Array.isArray(cached)) {
          const scoped = cached.filter((p: any) => !p.company_id || p.company_id === currentCid);
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
          // Strictly scope records to this active tenant
          const scoped = live.filter((p: any) => !p.company_id || p.company_id === currentCid);

          // Preserve local payment_status overrides so a paid bill is never reset to pending by stale backend
          const currentLocal = getTenantItem<PurchaseItem[]>("texaflow_purchases") || [];
          const localStatusMap = new Map(currentLocal.map((p) => [p.purchase_no || p.id, p.payment_status]));

          const merged = scoped.map((p) => ({
            ...p,
            payment_status: localStatusMap.get(p.purchase_no || p.id) || p.payment_status
          }));

          setPurchases(merged);
          try {
            setTenantItem("texaflow_purchases", merged);
            setCachedApi("/purchases", merged);
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

  const handleDeletePurchase = async (id: string) => {
    if (!confirm(t("Are you sure you want to delete this purchase bill?"))) return;

    const updated = purchases.filter((p) => p.id !== id);
    setPurchases(updated);
    try {
      setTenantItem("texaflow_purchases", updated);
      setCachedApi("/purchases", updated);
      invalidateApiCache("/purchases");
      window.dispatchEvent(new CustomEvent("texaflow_purchases_updated"));
      window.dispatchEvent(new Event("app_data_update"));
    } catch { }

    try {
      await fetchApi(`/purchases/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("API delete notice:", err);
    }
  };

  const handlePrintBill = (item: any) => {
    setPreviewBill(item);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Filter purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (item.purchase_no && item.purchase_no.toLowerCase().includes(q)) ||
        (item.vendor_name && item.vendor_name.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.items_description && item.items_description.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      const isUnpaid = item.payment_status === "Pending" || item.payment_status === "Unpaid";
      const dueInfo = item.due_date ? getDueStatus(item.due_date, !isUnpaid) : null;

      const matchesStatus =
        statusFilter === "All"
          ? true
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
  }, [purchases, search, statusFilter, selectedCategory]);

  // Aggregate Stats
  const totalPurchasesAmount = purchases.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingCreditPurchases = purchases.filter((p) => p.payment_status === "Pending" || p.payment_status === "Unpaid");
  const pendingCreditAmount = pendingCreditPurchases.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const overdueCount = pendingCreditPurchases.filter((p) => {
    if (!p.due_date) return false;
    return getDueStatus(p.due_date, false).status === "Overdue";
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
          <div className="w-48 shrink-0">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as any)}
              options={[
                { value: "All", label: t("All Status") },
                { value: "Pending", label: t("Pending / Credit") },
                { value: "Overdue", label: t("Overdue") },
                { value: "Paid", label: t("Paid") },
              ]}
            />
          </div>

          {/* Category Dropdown (Matching Image 3) */}
          <div className="w-52 shrink-0">
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
                <div key={item.id} className={`p-3.5 bg-white rounded-2xl border space-y-2.5 shadow-2xs ${dueInfo.isOverdue ? "border-rose-300 bg-rose-50/15" : "border-slate-200"}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-500">{item.date}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      dueInfo.isPaid
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : dueInfo.isOverdue
                        ? "bg-rose-50 text-rose-700 border-rose-300"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {dueInfo.isPaid ? t("Paid") : dueInfo.isOverdue ? t("Overdue") : t("Pending / Credit")}
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

                  {/* Category & Quantity Row */}
                  <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                    <CategoryDisplayCell item={item} t={t} />
                    <div className="text-right shrink-0">
                      <QuantityDisplayCell item={item} />
                    </div>
                  </div>

                  {/* Items / Description Row */}
                  <div className="px-1 text-xs">
                    <ItemDescriptionDisplayCell item={item} />
                  </div>

                  {/* Due Date Info */}
                  <div className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                    dueInfo.isOverdue ? "bg-rose-50 border-rose-200" : "bg-blue-50/50 border-blue-100"
                  }`}>
                    <span className="text-slate-600 flex items-center gap-1 font-mono">
                      <Calendar className={`w-3.5 h-3.5 ${dueInfo.isOverdue ? "text-rose-600" : "text-blue-600"}`} />
                      {t("Due")}: {item.due_date || (item.credit_days ? calculateDueDate(item.date, item.credit_days) : item.date)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${dueInfo.badgeClass}`}>
                      {dueInfo.text}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-start gap-1.5">
                    <span className="font-bold text-slate-400 uppercase text-[10px] shrink-0">{t("Remarks")}:</span>
                    {item.notes ? (
                      <span className="font-medium text-slate-800">{item.notes}</span>
                    ) : (
                      <span className="text-slate-900 font-black text-xs">-</span>
                    )}
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
                      <button
                        type="button"
                        onClick={() => handlePrintBill(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title={t("Print Bill Slip")}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <Link href={`/purchases/new?edit=${item.id}`} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title={t("Edit")}>
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button type="button" onClick={() => handleDeletePurchase(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title={t("Delete")}>
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
          <table className="w-full text-left border-collapse text-xs min-w-[1280px]">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                {/* 1. DATE */}
                <th className="py-2.5 px-3.5 w-[100px] min-w-[100px] border-r border-slate-200/80">{t("DATE")}</th>
                {/* 2. BILL NO */}
                <th className="py-2.5 px-3.5 w-[105px] min-w-[105px] border-r border-slate-200/80">{t("BILL NO")}</th>
                {/* 3. SUPPLIER / MILL */}
                <th className="py-2.5 px-3.5 w-[170px] min-w-[170px] max-w-[170px] border-r border-slate-200/80">{t("SUPPLIER / MILL")}</th>
                {/* 4. CATEGORY */}
                <th className="py-2.5 px-3.5 w-[140px] min-w-[140px] max-w-[140px] border-r border-slate-200/80">{t("CATEGORY")}</th>
                {/* 5. ITEM */}
                <th className="py-2.5 px-3.5 w-[170px] min-w-[170px] max-w-[170px] border-r border-slate-200/80">{t("ITEM")}</th>
                {/* 6. QUANTITY */}
                <th className="py-2.5 px-3.5 text-center w-[110px] min-w-[110px] border-r border-slate-200/80">{t("QUANTITY")}</th>
                {/* 7. AMOUNT (₹) */}
                <th className="py-2.5 px-3.5 text-right w-[115px] min-w-[115px] border-r border-slate-200/80">{t("AMOUNT (₹)")}</th>
                {/* 8. REMARKS */}
                <th className="py-2.5 px-3.5 w-[170px] min-w-[170px] max-w-[170px] border-r border-slate-200/80">{t("REMARKS")}</th>
                {/* 9. DUE (DAYS) */}
                <th className="py-2.5 px-3.5 text-center w-[105px] min-w-[105px] border-r border-slate-200/80">{t("DUE (DAYS)")}</th>
                {/* 10. STATUS */}
                <th className="py-2.5 px-3.5 text-center w-[95px] min-w-[95px] border-r border-slate-200/80">{t("STATUS")}</th>
                {/* 11. ACTION */}
                <th className="py-2.5 px-3.5 text-center w-[105px] min-w-[105px]">{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                    {t("No purchase bills found matching your filters. Click \"+ New Purchase Bill\" to add.")}
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((item) => {
                  const dueInfo = getPurchaseDueInfo(item);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setPreviewBill(item)}
                      className={`transition-colors cursor-pointer group ${
                        dueInfo.isOverdue ? "bg-rose-50/25 hover:bg-rose-50/55" : "hover:bg-blue-50/40"
                      }`}
                    >
                      {/* 1. DATE */}
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-700 whitespace-nowrap align-middle w-[100px] min-w-[100px] border-r border-slate-200/70">
                        {item.date}
                      </td>

                      {/* 2. BILL NO */}
                      <td className="py-3 px-3.5 whitespace-nowrap align-middle w-[105px] min-w-[105px] border-r border-slate-200/70">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {item.purchase_no}
                        </span>
                      </td>

                      {/* 3. SUPPLIER / MILL */}
                      <td className="py-3 px-3.5 align-middle w-[170px] min-w-[170px] max-w-[170px] border-r border-slate-200/70">
                        <span className="font-bold text-slate-900 text-xs block truncate tracking-tight" title={item.vendor_name}>
                          {item.vendor_name}
                        </span>
                      </td>

                      {/* 4. CATEGORY */}
                      <td className="py-3 px-3.5 align-middle w-[140px] min-w-[140px] max-w-[140px] border-r border-slate-200/70">
                        <CategoryDisplayCell item={item} t={t} />
                      </td>

                      {/* 5. ITEM */}
                      <td className="py-3 px-3.5 align-middle w-[170px] min-w-[170px] max-w-[170px] border-r border-slate-200/70">
                        <ItemDescriptionDisplayCell item={item} />
                      </td>

                      {/* 6. QUANTITY */}
                      <td className="py-3 px-3.5 text-center align-middle whitespace-nowrap w-[110px] min-w-[110px] border-r border-slate-200/70">
                        <QuantityDisplayCell item={item} />
                      </td>

                      {/* 7. AMOUNT (₹) */}
                      <td className="py-3 px-3.5 text-right align-middle whitespace-nowrap font-mono font-black text-slate-950 text-xs tracking-tight w-[115px] min-w-[115px] border-r border-slate-200/70">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </td>

                      {/* 8. REMARKS */}
                      <td className="py-3 px-3.5 text-xs align-middle w-[170px] min-w-[170px] max-w-[170px] whitespace-normal border-r border-slate-200/70">
                        {item.notes ? (
                          <p className="font-medium text-slate-700 text-xs truncate max-w-[160px]" title={item.notes}>
                            {item.notes}
                          </p>
                        ) : (
                          <span className="text-slate-800 font-black text-sm select-none">-</span>
                        )}
                      </td>

                      {/* 9. DUE (DAYS) */}
                      <td className="py-3 px-3.5 text-center align-middle whitespace-nowrap w-[105px] min-w-[105px] border-r border-slate-200/70">
                        {dueInfo.isPaid ? (
                          <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1.5 justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t("Settled")}</span>
                          </span>
                        ) : dueInfo.isOverdue ? (
                          <span className="font-mono text-xs font-black text-rose-600 inline-flex items-center gap-1.5 justify-center bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 shadow-2xs">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{dueInfo.text}</span>
                          </span>
                        ) : dueInfo.isDueToday ? (
                          <span className="font-mono text-xs font-black text-amber-800 inline-flex items-center gap-1.5 justify-center bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>{t("Due Today")}</span>
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-bold text-amber-700 inline-flex items-center gap-1.5 justify-center">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>{dueInfo.text}</span>
                          </span>
                        )}
                      </td>

                      {/* 10. STATUS */}
                      <td className="py-3 px-3.5 text-center align-middle whitespace-nowrap w-[95px] min-w-[95px] border-r border-slate-200/70">
                        {dueInfo.isPaid ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{t("Paid")}</span>
                          </span>
                        ) : dueInfo.isOverdue ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                            <span>{t("Overdue")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>{t("Pending")}</span>
                          </span>
                        )}
                      </td>

                      {/* 11. ACTION */}
                      <td className="py-3 px-3.5 text-center align-middle whitespace-nowrap w-[105px] min-w-[105px]">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handlePrintBill(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={t("Print Bill Slip")}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/purchases/new?edit=${item.id}`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={t("Edit")}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeletePurchase(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

      {/* 4. PURCHASE BILL SLIP PREVIEW MODAL */}
      {previewBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-bill-slip, #printable-bill-slip * {
                visibility: visible;
              }
              #printable-bill-slip {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                border: none !important;
                box-shadow: none !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div id="printable-bill-slip" className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-extrabold text-slate-900">{t("Purchase Bill Slip")}</h2>
              </div>
              <button
                onClick={() => setPreviewBill(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer no-print"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Authentic Bill Card */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="font-black text-slate-900 text-sm tracking-wide uppercase">OM SAI TEXTILES</div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t("Raw Material Purchase Inward")}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${previewBill.payment_status === "Paid"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                  {previewBill.payment_status === "Paid" ? t("Paid") : t("Pending / Credit")}
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs shadow-2xs overflow-hidden">
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{t("Bill No")}</span>
                  <span className="font-extrabold font-mono text-blue-700">{previewBill.purchase_no}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{t("Date")}</span>
                  <span className="font-extrabold text-slate-800">{previewBill.date}</span>
                </div>
                <div className="p-3 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">{t("Supplier / Mill")}</span>
                  <span className="font-extrabold text-slate-900 text-right">{previewBill.vendor_name}</span>
                </div>
                <div className="p-3 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">{t("Category")}</span>
                  <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">{t(previewBill.category)}</span>
                </div>
                {previewBill.items && Array.isArray(previewBill.items) && previewBill.items.length > 0 ? (
                  <div className="p-3 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{t("Items / Material Details")}</span>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                      {previewBill.items.map((it: any, idx: number) => (
                        <div key={idx} className="p-2 flex items-center justify-between bg-slate-50/50">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900">{it.description || it.category}</span>
                            {it.quantity && (
                              <span className="text-blue-700 font-mono font-bold text-[10px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                {it.quantity}
                              </span>
                            )}
                          </div>
                          {it.amount && (
                            <span className="font-mono font-bold text-slate-800">
                              ₹{parseFloat(String(it.amount)).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : previewBill.items_description ? (
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{t("Items / Material Details")}</span>
                    <span className="font-medium text-slate-800">{previewBill.items_description}</span>
                  </div>
                ) : null}
                <div className="p-3 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">{t("Due Date / Mudat")}</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {previewBill.due_date ? `${previewBill.due_date} (${previewBill.credit_days || 0}d)` : "-"}
                  </span>
                </div>
                <div className="p-3.5 flex items-center justify-between bg-slate-50/50">
                  <span className="text-xs font-black text-slate-700 uppercase">{t("Total Bill Amount")}</span>
                  <span className="text-base font-black font-mono text-slate-900">₹{previewBill.amount.toLocaleString("en-IN")}</span>
                </div>
                {previewBill.notes && (
                  <div className="p-3 flex flex-col gap-1 bg-white border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{t("Remarks / Notes")}</span>
                    <span className="font-medium text-slate-700 text-xs">{previewBill.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 no-print">
              <button
                type="button"
                onClick={() => setPreviewBill(null)}
                className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
              >
                {t("Close")}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t("Print")}</span>
              </button>
              {(previewBill.payment_status === "Pending" || previewBill.payment_status === "Unpaid") ? (
                <Link
                  href={`/payments/new?vendor=${encodeURIComponent(previewBill.vendor_name)}&amount=${previewBill.amount}&source=Purchase+Bill&ref=${previewBill.purchase_no}`}
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{t("Pay Voucher")}</span>
                </Link>
              ) : (
                <div className="flex-1 py-2.5 px-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t("Paid & Settled")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
