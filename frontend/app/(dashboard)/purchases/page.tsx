"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { fetchApi, getCachedApi } from "@/lib/api";
import { getTenantItem, setTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { useLanguage } from "@/context/LanguageContext";
import { getDueStatus } from "@/lib/creditTerms";
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
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  Eye,
  Building2
} from "lucide-react";
import { SupplierLedgerModal } from "@/components/purchases/SupplierLedgerModal";

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
        className={`w-full h-9 px-3.5 bg-white border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""
        }`}
      >
        <span className={`truncate font-bold ${selectedOption ? "text-slate-900" : "text-slate-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1.5 ${
            isOpen ? "rotate-180 text-blue-600" : ""
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
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                    isSelected
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

export interface PurchaseItem {
  id: string;
  purchase_no: string;
  date: string;
  category: string;
  vendor_name: string;
  items_description?: string;
  amount: number;
  payment_status: "Paid" | "Pending" | "Unpaid";
  paid_via?: string;
  payment_terms?: string;
  credit_days?: number;
  due_date?: string;
  linked_order?: string;
  bill_image?: string;
  notes?: string;
}

const defaultSeedPurchases: PurchaseItem[] = [];

export default function PurchasesPage() {
  const { t } = useLanguage();
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Overdue" | "Paid">("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBillImage, setSelectedBillImage] = useState<{ image: string; purchase_no: string; notes?: string } | null>(null);
  const [previewBill, setPreviewBill] = useState<PurchaseItem | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [ledgerVendor, setLedgerVendor] = useState("");

  const handleOpenLedger = (vendorName?: string) => {
    setLedgerVendor(vendorName || "");
    setIsLedgerOpen(true);
  };

  const purchaseCategories = [
    "All",
    "Raw Material & Fabric",
    "Yarn & Threads",
    "Zari & Metallic Trims",
    "Lace, Borders & Latkan",
    "Choli & Garment Trims",
    "Packaging Materials"
  ];

  useEffect(() => {
    let isMounted = true;
    const currentCid = getStoredCompanyId() || "comp-001";

    try {
      const cached = getCachedApi<PurchaseItem[]>("/purchases") ||
        getTenantItem<PurchaseItem[]>("texaflow_purchases", currentCid === "comp-001" ? "om_sai_purchases" : undefined);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setPurchases(cached);
      } else {
        setPurchases(defaultSeedPurchases);
      }
    } catch {
      setPurchases(defaultSeedPurchases);
    }

    async function loadLive() {
      try {
        const live = await fetchApi<PurchaseItem[]>("/purchases");
        if (isMounted && Array.isArray(live) && live.length > 0) {
          setPurchases(live);
          try {
            setTenantItem("texaflow_purchases", live, currentCid === "comp-001" ? "om_sai_purchases" : undefined);
          } catch {}
        }
      } catch (err) {
        console.warn("Backend purchase load notice:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadLive();

    const refresh = () => loadLive();
    window.addEventListener("app_data_update", refresh);
    window.addEventListener("app_refresh_content", refresh);

    return () => {
      isMounted = false;
      window.removeEventListener("app_data_update", refresh);
      window.removeEventListener("app_refresh_content", refresh);
    };
  }, []);

  const handleDeletePurchase = async (id: string) => {
    if (!confirm(t("Are you sure you want to delete this purchase bill?"))) return;

    const currentCid = getStoredCompanyId() || "comp-001";
    const updated = purchases.filter((p) => p.id !== id);
    setPurchases(updated);
    try {
      setTenantItem("texaflow_purchases", updated, currentCid === "comp-001" ? "om_sai_purchases" : undefined);
    } catch {}

    try {
      await fetchApi(`/purchases/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("API delete notice:", err);
    }
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
        (item.linked_order && item.linked_order.toLowerCase().includes(q));

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

      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            {t("TOTAL PURCHASES")}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
              ₹{totalPurchasesAmount.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-slate-500">({purchases.length})</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">
            {t("PENDING CREDIT (શાખ)")}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-600">
              ₹{pendingCreditAmount.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-amber-700 font-bold">({pendingCreditPurchases.length})</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block">
            {t("OVERDUE BILLS (ઓવરડ્યુ)")}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-xl sm:text-2xl font-black font-mono ${overdueCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
              {overdueCount}
            </span>
            <span className="text-[11px] text-slate-500">{t("Require Settlement")}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">
            {t("PAID / SETTLED")}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
              {purchases.length - pendingCreditPurchases.length}
            </span>
            <span className="text-[11px] text-emerald-700">{t("Bills Cleared")}</span>
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
                { value: "Pending", label: t("Pending / Credit (શાખ)") },
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Mobile View (< md) */}
        <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
          {filteredPurchases.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              {t("No purchase records found.")}
            </div>
          ) : (
            filteredPurchases.map((item) => {
              const isUnpaid = item.payment_status === "Pending" || item.payment_status === "Unpaid";
              const dueInfo = item.due_date ? getDueStatus(item.due_date, !isUnpaid) : null;

              return (
                <div key={item.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-500">{item.date}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      item.payment_status === "Paid"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {item.payment_status === "Paid" ? t("Paid") : t("Pending / શાખ")}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => handleOpenLedger(item.vendor_name)}
                        className="font-extrabold text-slate-900 text-sm hover:text-blue-600 transition-colors text-left flex items-center gap-1 cursor-pointer"
                        title={t("View Supplier Ledger")}
                      >
                        <span>{item.vendor_name}</span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          ખાતાવહી
                        </span>
                      </button>
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

                  {item.items_description && (
                    <p className="text-xs text-slate-600 italic">{item.items_description}</p>
                  )}

                  {/* Due Date Info */}
                  {item.due_date && (
                    <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {t("Due")}: {item.due_date}
                      </span>
                      {dueInfo && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${dueInfo.badgeClass}`}>
                          {dueInfo.labelGu}
                        </span>
                      )}
                    </div>
                  )}

                  {item.linked_order && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-700">{t("Linked Order")}:</span>
                      <span
                        className="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 inline-flex items-center gap-1"
                      >
                        <span>📦 {item.linked_order}</span>
                      </span>
                    </div>
                  )}

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

                    <div className="flex items-center gap-2">
                      <Link href={`/purchases/new?edit=${item.id}`} className="p-1 text-slate-400 hover:text-blue-600">
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button type="button" onClick={() => handleDeletePurchase(item.id)} className="p-1 text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (>= md) - Balanced, Harmonious Spacing */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-4">{t("DATE")}</th>
                <th className="py-3 px-4">{t("BILL NO")}</th>
                <th className="py-3 px-4">{t("SUPPLIER / MILL")}</th>
                <th className="py-3 px-4">{t("DUE DATE / મુદત")}</th>
                <th className="py-3 px-4">{t("MATERIAL & ITEMS")}</th>
                <th className="py-3 px-4 text-right">{t("AMOUNT (₹)")}</th>
                <th className="py-3 px-4 text-center">{t("STATUS")}</th>
                <th className="py-3 px-4 text-center w-24">{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    {t("No purchase bills found matching your filters. Click \"+ New Purchase Bill\" to add.")}
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((item) => {
                  const isUnpaid = item.payment_status === "Pending" || item.payment_status === "Unpaid";
                  const dueInfo = item.due_date ? getDueStatus(item.due_date, !isUnpaid) : null;

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* 1. DATE */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap align-middle">
                        {item.date}
                      </td>

                      {/* 2. BILL NO */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50/90 px-2.5 py-1 rounded-lg border border-blue-200">
                          {item.purchase_no}
                        </span>
                      </td>

                      {/* 3. SUPPLIER / MILL */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                        <button
                          type="button"
                          onClick={() => handleOpenLedger(item.vendor_name)}
                          className="group inline-flex items-center gap-1.5 text-left font-extrabold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                          title={t("View Supplier Ledger & Statement")}
                        >
                          <span className="text-xs group-hover:underline underline-offset-2">
                            {item.vendor_name}
                          </span>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-blue-200">
                            ખાતાવહી ↗
                          </span>
                        </button>
                      </td>

                      {/* 4. DUE DATE / મુદત */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle font-mono text-xs">
                        {item.payment_status === "Paid" ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{t("Settled")}</span>
                          </span>
                        ) : item.due_date ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-bold text-slate-900">{item.due_date}</span>
                            {item.credit_days ? (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                {item.credit_days}d
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* 5. MATERIAL & ITEMS - NATURAL FULL TEXT */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-slate-800">{t(item.category)}</span>
                          {item.items_description && (
                            <span className="text-slate-500 font-medium">
                              ({item.items_description})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. AMOUNT (₹) */}
                      <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap font-mono font-black text-slate-900 text-sm">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </td>

                      {/* 7. STATUS - MATCHING BILL NO BOX */}
                      <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                        {item.payment_status === "Paid" ? (
                          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50/90 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                            {t("Paid")}
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50/90 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                            {t("Pending")}
                          </span>
                        )}
                      </td>

                      {/* 8. ACTION */}
                      <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenLedger(item.vendor_name)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={t("Supplier Ledger (ખાતાવહી)")}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewBill(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={t("View Bill Slip")}
                          >
                            <Eye className="w-3.5 h-3.5" />
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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-extrabold text-slate-900">{t("Purchase Bill Slip")}</h2>
              </div>
              <button
                onClick={() => setPreviewBill(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${
                  previewBill.payment_status === "Paid"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {previewBill.payment_status === "Paid" ? t("Paid") : t("Pending / શાખ")}
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
                {previewBill.items_description && (
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{t("Items / Material Details")}</span>
                    <span className="font-medium text-slate-800">{previewBill.items_description}</span>
                  </div>
                )}
                {previewBill.linked_order && (
                  <div className="p-3 flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">{t("Linked Order")}</span>
                    <span className="font-bold text-blue-700">📦 {previewBill.linked_order}</span>
                  </div>
                )}
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
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPreviewBill(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {t("Close")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const vName = previewBill.vendor_name;
                  setPreviewBill(null);
                  handleOpenLedger(vName);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title={t("View Supplier Ledger")}
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>{t("ખાતાવહી (Ledger)")}</span>
              </button>
              {(previewBill.payment_status === "Pending" || previewBill.payment_status === "Unpaid") && (
                <Link
                  href={`/payments/new?vendor=${encodeURIComponent(previewBill.vendor_name)}&amount=${previewBill.amount}&source=Material+Inward+Bill&ref=${previewBill.purchase_no}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{t("Create Payment Voucher")}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. REUSABLE SUPPLIER / MILL LEDGER MODAL */}
      <SupplierLedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        initialVendorName={ledgerVendor}
        initialPurchases={purchases}
      />
    </div>
  );
}
