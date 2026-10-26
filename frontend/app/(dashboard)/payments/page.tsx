"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { fetchApi, getCachedApi } from "@/lib/api";
import { getTenantItem, setTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { useLanguage } from "@/context/LanguageContext";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  FileText,
  Search,
  Plus,
  ChevronDown,
  Check,
  X,
  SlidersHorizontal,
  Printer,
  Trash2,
  Eye,
  Receipt
} from "lucide-react";

export interface PaymentVoucherItem {
  id: string;
  voucher_no: string;
  date: string;
  party_name: string;
  payer_person?: string;
  design_no?: string;
  linked_challan?: string;
  kasar_amount?: number;
  paying_company?: string;
  type: "Payment Out" | "Receipt In";
  linked_source?: "Job Process Challan" | "Material Inward Bill" | "On-Account / General Payment" | "Job Work / Purchase" | string;
  amount: number;
  mode: string;
  ref_no: string;
  bank_details?: string;
  notes: string;
  company_id?: string;
}

export const SEED_VOUCHERS: PaymentVoucherItem[] = [];

export function formatShortVoucherNo(vNo: string) {
  if (!vNo) return "-";
  // Convert REC-2026-084 -> REC-084, PAY-2026-102 -> PAY-102, VOU-2026-877 -> VOU-877
  return vNo.replace(/-(?:20\d{2})-/, "-");
}

function renderPaymentModeSimple(mode: string, refNo?: string) {
  const m = (mode || "").toLowerCase();
  let label = "Cash";
  let textColor = "text-slate-800";

  if (m.includes("angadia")) {
    label = "Angadia";
    textColor = "text-purple-700";
  } else if (m.includes("bank") || m.includes("neft") || m.includes("rtgs") || m.includes("imps") || m.includes("transfer")) {
    label = "Bank / RTGS";
    textColor = "text-blue-700";
  } else if (m.includes("cheque")) {
    label = "Cheque";
    textColor = "text-amber-700";
  } else if (m.includes("upi")) {
    label = "UPI";
    textColor = "text-teal-700";
  }

  const cleanRef = refNo && refNo !== "-" && refNo !== "N/A" && !refNo.toLowerCase().startsWith("cash") ? refNo : null;

  return (
    <div className="flex flex-col items-start leading-tight">
      <span className={`text-xs font-semibold ${textColor} whitespace-nowrap`}>
        {label}
      </span>
      {cleanRef && (
        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]" title={cleanRef}>
          {cleanRef}
        </span>
      )}
    </div>
  );
}

export default function PaymentsAndVouchersPage() {
  const { language, t } = useLanguage();
  const isGujarati = language === "gu";
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vouchers, setVouchers] = useState<PaymentVoucherItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const currentCid = getStoredCompanyId() || "comp-001";
        const seedForTenant = SEED_VOUCHERS.map((s) => ({ ...s, company_id: currentCid }));
        const apiCached = getCachedApi<PaymentVoucherItem[]>("/payments");
        if (Array.isArray(apiCached) && apiCached.length > 0) {
          const scoped = apiCached.filter((p: any) => (p.company_id || currentCid) === currentCid);
          const hasDummy = scoped.some((p: any) => p.voucher_no === "REC-2026-084" || p.voucher_no === "REC-084");
          if (!hasDummy) {
            return [...seedForTenant, ...scoped];
          }
          if (scoped.length > 0) return scoped;
        }
        const saved = getTenantItem<PaymentVoucherItem[]>("texaflow_vouchers", "om_sai_vouchers");
        if (Array.isArray(saved) && saved.length > 0) {
          const scoped = saved.filter((p: any) => (p.company_id || currentCid) === currentCid);
          const hasDummy = scoped.some((p: any) => p.voucher_no === "REC-2026-084" || p.voucher_no === "REC-084");
          if (!hasDummy && seedForTenant.length > 0) {
            const merged = [...seedForTenant, ...saved];
            setTenantItem("texaflow_vouchers", merged, "om_sai_vouchers");
            return [...seedForTenant, ...scoped];
          }
          if (scoped.length > 0) return scoped;
        } else if (seedForTenant.length > 0) {
          setTenantItem("texaflow_vouchers", seedForTenant, "om_sai_vouchers");
          return seedForTenant;
        }
      } catch {}
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Filters State
  const [isAdvanceFiltersOpen, setIsAdvanceFiltersOpen] = useState(false);
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<"All" | "Payment Out" | "Receipt In">("All");
  const [selectedPartyFilter, setSelectedPartyFilter] = useState("All");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState("All");

  // Dropdown states inside Advance Filters
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);

  // Preview Modal State
  const [previewVoucher, setPreviewVoucher] = useState<PaymentVoucherItem | null>(null);

  const advanceFiltersRef = useRef<HTMLDivElement>(null);

  // Load vouchers from Supabase & localStorage on mount
  useEffect(() => {
    setHasMounted(true);
    let isMounted = true;
    const currentCid = getStoredCompanyId() || "comp-001";
    const seedForTenant = SEED_VOUCHERS.map((s) => ({ ...s, company_id: currentCid }));

    // Instant 0ms Sync Check on mount
    try {
      const saved = getTenantItem<PaymentVoucherItem[]>("texaflow_vouchers");
      if (saved && Array.isArray(saved)) {
        const scoped = saved.filter((p: any) => (p.company_id || currentCid) === currentCid);
        setVouchers(scoped);
      }
    } catch {}

    const loadVouchers = async () => {
      try {
        const live = await fetchApi<any[]>("/payments");
        if (!isMounted) return;
        if (Array.isArray(live)) {
          const scoped = live.filter((p: any) => (p.company_id || currentCid) === currentCid);
          const mapped: PaymentVoucherItem[] = scoped.map((p: any) => ({
            id: p.id,
            voucher_no: p.voucher_no || "-",
            date: p.date || "",
            party_name: p.party_name || "-",
            payer_person: p.payer_person || undefined,
            design_no: p.design_no || p.linked_challan || undefined,
            linked_challan: p.linked_challan || p.design_no || undefined,
            kasar_amount: Number(p.kasar_amount) || 0,
            paying_company: currentCid === "comp-001" ? "Shiv Creation" : "Om Sai Enterprise",
            type: (p.voucher_type as any) || p.type || "Payment Out",
            linked_source: p.linked_source || ("Job Work / Purchase" as any),
            amount: Number(p.amount) || 0,
            mode: p.mode || p.payment_mode || "Cash",
            ref_no: p.ref_no || p.reference_no || "-",
            bank_details: p.bank_details || p.bank_account || "Main Bank A/c",
            notes: p.notes || p.remarks || "",
            company_id: p.company_id || currentCid
          }));
          setVouchers(mapped);
          try {
            setTenantItem("texaflow_vouchers", mapped);
          } catch {}
        }
      } catch (err) {
        console.warn("Backend payments load notice (using instant cached data):", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadVouchers();
    const handleRefresh = () => {
      loadVouchers();
    };
    window.addEventListener("app_data_update", handleRefresh);
    window.addEventListener("app_refresh_content", handleRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener("app_data_update", handleRefresh);
      window.removeEventListener("app_refresh_content", handleRefresh);
    };
  }, []);


  // Close Advance Filters on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (advanceFiltersRef.current && !advanceFiltersRef.current.contains(e.target as Node)) {
        setIsAdvanceFiltersOpen(false);
        setIsPartyDropdownOpen(false);
        setIsSourceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Unique list of parties from actual vouchers
  const partiesList = useMemo(() => {
    const set = new Set<string>();
    vouchers.forEach((v) => set.add(v.party_name));
    return Array.from(set);
  }, [vouchers]);

  // Filtered vouchers list
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (voucherTypeFilter !== "All" && v.type !== voucherTypeFilter) return false;
      if (selectedPartyFilter !== "All" && v.party_name !== selectedPartyFilter) return false;
      if (selectedSourceFilter !== "All" && v.linked_source !== selectedSourceFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (v.party_name || "").toLowerCase().includes(q) ||
          (v.payer_person || "").toLowerCase().includes(q) ||
          (v.design_no || "").toLowerCase().includes(q) ||
          (v.voucher_no || "").toLowerCase().includes(q) ||
          (v.ref_no || "").toLowerCase().includes(q) ||
          (v.notes || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [vouchers, voucherTypeFilter, selectedPartyFilter, selectedSourceFilter, searchQuery]);

  // KPI Calculations
  const stats = useMemo(() => {
    let paymentOut = 0;
    let paymentIn = 0;
    const partiesSet = new Set<string>();

    vouchers.forEach((v) => {
      partiesSet.add(v.party_name);
      if (v.type === "Payment Out") {
        paymentOut += v.amount;
      } else {
        paymentIn += v.amount;
      }
    });

    return {
      totalOut: paymentOut,
      totalIn: paymentIn,
      activeParties: partiesSet.size,
      totalVouchers: vouchers.length
    };
  }, [vouchers]);

  const handleDeleteVoucher = async (id: string) => {
    if (confirm("Are you sure you want to delete this payment voucher?")) {
      try {
        await fetchApi(`/payments/${id}`, { method: "DELETE" });
      } catch (err) {
        console.warn("Backend payment voucher delete fallback", err);
      }
      const updated = vouchers.filter((v) => v.id !== id);
      setVouchers(updated);
      try {
        const currentCid = getStoredCompanyId();
        setTenantItem(
          "texaflow_vouchers",
          updated,
          currentCid === "comp-001" ? "om_sai_vouchers" : undefined
        );
      } catch (err) {
        console.error(err);
      }
      if (previewVoucher?.id === id) setPreviewVoucher(null);
    }
  };

  if (!hasMounted) return null;

  return (
    <div suppressHydrationWarning className="space-y-4 max-w-[1600px] mx-auto select-none pb-12">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP 4 SUMMARY BOXES (KPI CARDS)                           */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* BOX 1: TOTAL PAYMENT OUT */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              TOTAL PAYMENT OUT
            </p>
            <p suppressHydrationWarning className="text-xl font-black text-rose-600 mt-0.5">
              ₹{stats.totalOut.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* BOX 2: TOTAL PAYMENT IN */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              TOTAL PAYMENT IN
            </p>
            <p suppressHydrationWarning className="text-xl font-black text-blue-600 mt-0.5">
              ₹{stats.totalIn.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

        {/* BOX 3: ACTIVE PARTIES */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              ACTIVE PARTIES
            </p>
            <p suppressHydrationWarning className="text-xl font-black text-slate-900 mt-0.5">
              {stats.activeParties}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* BOX 4: TOTAL VOUCHERS */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              TOTAL VOUCHERS
            </p>
            <p suppressHydrationWarning className="text-xl font-black text-slate-900 mt-0.5">
              {stats.totalVouchers}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. UNIFIED BAR WITH SEARCH BAR ON LEFT & ADVANCE FILTERS + CREATE VOUCHER ON RIGHT */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2.5 relative">
        {/* LEFT CONTROL: SEARCH INPUT BOX */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search vouchers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8.5 pr-8 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* RIGHT CONTROLS: ADVANCE FILTERS + CREATE VOUCHER BUTTON */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          
          {/* ADVANCE FILTERS BUTTON & DROPDOWN POPUP */}
          <div ref={advanceFiltersRef} className="relative flex-1 sm:flex-none">
            <button
              type="button"
              onClick={() => setIsAdvanceFiltersOpen(!isAdvanceFiltersOpen)}
              className={`w-full sm:w-auto justify-center h-9 px-3.5 bg-white border rounded-xl text-xs font-bold text-slate-900 flex items-center gap-2 transition-all cursor-pointer shadow-2xs focus:outline-none ${
                isAdvanceFiltersOpen
                  ? "border-blue-500 ring-2 ring-blue-500/20"
                  : "border-slate-200 hover:border-blue-500"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Advance Filters</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                  isAdvanceFiltersOpen ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>

            {/* POPUP PANEL FOR FILTERS */}
            {isAdvanceFiltersOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-50 w-[280px] sm:w-72 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-100">
                {/* SECTION 1: VOUCHER TYPE SWITCHER */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Voucher Type
                  </label>
                  <div className="bg-slate-100/90 p-1 rounded-xl grid grid-cols-3 gap-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setVoucherTypeFilter("All")}
                      className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                        voucherTypeFilter === "All"
                          ? "bg-white text-slate-900 font-extrabold shadow-2xs border border-slate-200/60"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoucherTypeFilter("Payment Out")}
                      className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        voucherTypeFilter === "Payment Out"
                          ? "bg-white text-slate-900 font-extrabold shadow-2xs border border-slate-200/60"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>Paid</span>
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoucherTypeFilter("Receipt In")}
                      className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        voucherTypeFilter === "Receipt In"
                          ? "bg-white text-slate-900 font-extrabold shadow-2xs border border-slate-200/60"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>Received</span>
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* SECTION 2: FILTER BY PARTY / VENDOR DROPDOWN */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Filter by Party / Vendor
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPartyDropdownOpen((prev) => {
                          if (!prev) setIsSourceDropdownOpen(false);
                          return !prev;
                        });
                      }}
                      className={`w-full h-9 px-3 bg-white border rounded-xl text-xs font-bold text-slate-900 flex items-center justify-between transition-all cursor-pointer ${
                        isPartyDropdownOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 hover:border-blue-500"
                      }`}
                    >
                      <span className="truncate">
                        {selectedPartyFilter === "All"
                          ? `ALL PARTIES (${partiesList.length})`
                          : selectedPartyFilter.toUpperCase()}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isPartyDropdownOpen ? "rotate-180 text-blue-600" : ""}`} />
                    </button>

                    {isPartyDropdownOpen && (
                      <div className="absolute left-0 top-10 z-50 min-w-full w-full bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-0.5 max-h-48 overflow-y-auto no-scrollbar">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPartyFilter("All");
                            setIsPartyDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            selectedPartyFilter === "All"
                              ? "bg-blue-50 text-blue-900 font-extrabold"
                              : "text-slate-800 hover:bg-slate-50 font-semibold"
                          }`}
                        >
                          <span>ALL PARTIES ({partiesList.length})</span>
                          {selectedPartyFilter === "All" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                        {partiesList.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setSelectedPartyFilter(p);
                              setIsPartyDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              selectedPartyFilter === p
                                ? "bg-blue-50 text-blue-900 font-extrabold"
                                : "text-slate-800 hover:bg-slate-50 font-semibold"
                            }`}
                          >
                            <span className="truncate">{p}</span>
                            {selectedPartyFilter === p && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 3: LINKED SOURCE DROPDOWN */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Linked Source
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSourceDropdownOpen((prev) => {
                          if (!prev) setIsPartyDropdownOpen(false);
                          return !prev;
                        });
                      }}
                      className={`w-full h-9 px-3 bg-white border rounded-xl text-xs font-bold text-slate-900 flex items-center justify-between transition-all cursor-pointer ${
                        isSourceDropdownOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 hover:border-blue-500"
                      }`}
                    >
                      <span className="truncate">
                        {selectedSourceFilter === "All" ? "ALL SOURCES" : selectedSourceFilter.toUpperCase()}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSourceDropdownOpen ? "rotate-180 text-blue-600" : ""}`} />
                    </button>

                    {isSourceDropdownOpen && (
                      <div className="absolute left-0 top-10 z-50 min-w-full w-full bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-0.5">
                        {[
                          { label: "All Sources", value: "All" },
                          { label: "Job Process Challan", value: "Job Process Challan" },
                          { label: "Material Inward Bill", value: "Material Inward Bill" },
                          { label: "On-Account / General Payment", value: "On-Account / General Payment" }
                        ].map((src) => {
                          const isSelected = selectedSourceFilter === src.value;
                          return (
                            <button
                              key={src.value}
                              type="button"
                              onClick={() => {
                                setSelectedSourceFilter(src.value);
                                setIsSourceDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-blue-50 text-blue-900 font-extrabold"
                                  : "text-slate-800 hover:bg-slate-50 font-semibold"
                              }`}
                            >
                              <span>{src.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM APPLY FILTERS BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsAdvanceFiltersOpen(false)}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-98"
                >
                  Apply Filters
                </button>
              </div>
            )}
          </div>

          {/* + CREATE VOUCHER BUTTON -> NAVIGATES TO /payments/new PAGE */}
          <Link
            href="/payments/new"
            className="flex-1 sm:flex-none h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Voucher</span>
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. VOUCHERS TABLE LIST & MOBILE CARD VIEW */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* MOBILE CARD VIEW (< md) - No horizontal scroll */}
        <div className="block md:hidden p-3 sm:p-4 space-y-3 bg-slate-50/50">
          {filteredVouchers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-medium">
              No payment vouchers found matching your filter criteria.
            </div>
          ) : (
            filteredVouchers.map((v) => {
              const totalSettled = (v.amount || 0) + (v.kasar_amount || 0);
              return (
                <div
                  key={v.id}
                  onClick={() => setPreviewVoucher(v)}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2.5 active:scale-[0.99] transition-all cursor-pointer hover:border-blue-300"
                >
                  {/* Top Row: Date, Voucher No (Short, Clean), Type */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {formatShortVoucherNo(v.voucher_no)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {v.date}
                      </span>
                    </div>
                    {v.type === "Receipt In" ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Payment In
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Payment Out
                      </span>
                    )}
                  </div>

                  {/* Party & Payer Person Display (Simple Clean Text) */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-xs truncate">
                        {v.party_name}
                      </div>
                      {v.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                          {v.notes}
                        </div>
                      )}
                    </div>
                    {v.payer_person && (
                      <span className="text-xs text-slate-700 shrink-0 font-medium">
                        Payer: <strong className="text-slate-900 font-semibold">{v.payer_person}</strong>
                      </span>
                    )}
                  </div>

                  {/* Details Grid: Design No (DN) & Mode (Simple Clean Text) */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Ref / Bill No</span>
                      <span className="font-mono font-medium text-slate-800 text-xs inline-block mt-0.5">
                        {v.design_no || v.linked_challan || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Mode</span>
                      <div className="mt-0.5">
                        {renderPaymentModeSimple(v.mode, v.ref_no)}
                      </div>
                    </div>
                  </div>

                  {/* Amount, Discount & Total Settled Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Amount (₹)</span>
                      <span className={`font-bold text-xs ${v.type === "Receipt In" ? "text-emerald-700" : "text-rose-700"}`}>
                        {v.type === "Receipt In" ? "+" : "-"}₹{v.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Discount (₹)</span>
                      {Boolean(v.kasar_amount && v.kasar_amount > 0) ? (
                        <span className="text-xs font-semibold text-amber-600">
                          ₹{Number(v.kasar_amount).toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-medium">-</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Settled</span>
                      <span className="text-xs font-bold text-slate-900">
                        ₹{totalSettled.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setPreviewVoucher(v)}
                      className="flex-1 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Slip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVoucher(v.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Delete Voucher"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md) - Clean Simple Text, Excel-Style Box Grid */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1020px]">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-2.5 px-3.5 border-r border-slate-200/80">{t("Date")}</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200/80">{t("Voucher No")}</th>
                <th className="py-2.5 px-3 border-r border-slate-200/80">{t("Type")}</th>
                <th className="py-2.5 px-4 border-r border-slate-200/80">{t("Party Name")}</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200/80">{t("Person / Payer")}</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200/80">{isGujarati ? "રેફરન્સ / બિલ નં." : "Ref / Bill No"}</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200/80">{t("Mode")}</th>
                <th className="py-2.5 px-3.5 text-right border-r border-slate-200/80">{t("Amount (₹)")}</th>
                <th className="py-2.5 px-3.5 text-right border-r border-slate-200/80">{t("Discount (₹)")}</th>
                <th className="py-2.5 px-3.5 text-right border-r border-slate-200/80">{t("Total Settled (₹)")}</th>
                <th className="py-2.5 px-3 text-center">{t("Action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 font-medium">
                    No payment vouchers found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => {
                  const totalSettled = (v.amount || 0) + (v.kasar_amount || 0);
                  return (
                    <tr key={v.id} className="hover:bg-blue-50/40 transition-colors animate-in fade-in duration-150">
                      {/* 1. DATE (SIMPLE TEXT) */}
                      <td className="py-3 px-3.5 text-slate-600 font-medium text-xs whitespace-nowrap border-r border-slate-200/70">
                        {v.date}
                      </td>

                      {/* 2. VOUCHER NO (SHORT, SIMPLE MONOSPACE TEXT - NO BOX) */}
                      <td className="py-3 px-3.5 whitespace-nowrap border-r border-slate-200/70">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {formatShortVoucherNo(v.voucher_no)}
                        </span>
                      </td>

                      {/* 3. TYPE (CLEAN TEXT + DOT - NO BOX) */}
                      <td className="py-3 px-3 whitespace-nowrap border-r border-slate-200/70">
                        {v.type === "Receipt In" ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Payment In
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Payment Out
                          </span>
                        )}
                      </td>

                      {/* 4. PARTY NAME (REGISTERED PARTY) */}
                      <td className="py-3 px-4 border-r border-slate-200/70">
                        <div className="font-bold text-slate-900 text-xs truncate max-w-[170px]" title={v.party_name}>
                          {v.party_name}
                        </div>
                        {v.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[170px] font-normal" title={v.notes}>
                            {v.notes}
                          </div>
                        )}
                      </td>

                      {/* 5. PERSON / PAYER (SIMPLE CLEAN TEXT - NO BOX) */}
                      <td className="py-3 px-3.5 whitespace-nowrap border-r border-slate-200/70">
                        <span className="text-xs font-medium text-slate-800">
                          {v.payer_person || "-"}
                        </span>
                      </td>

                      {/* 6. DESIGN NO (DN) (SIMPLE CLEAN TEXT - NO BOX) */}
                      <td className="py-3 px-3.5 whitespace-nowrap border-r border-slate-200/70">
                        <span className="font-mono text-xs font-medium text-slate-700">
                          {v.design_no || v.linked_challan || "-"}
                        </span>
                      </td>

                      {/* 7. PAYMENT MODE (SIMPLE CLEAN TEXT - NO BOX) */}
                      <td className="py-3 px-3.5 whitespace-nowrap border-r border-slate-200/70">
                        {renderPaymentModeSimple(v.mode, v.ref_no)}
                      </td>

                      {/* 8. AMOUNT (₹) */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap border-r border-slate-200/70">
                        <span className={`font-bold text-xs ${v.type === "Receipt In" ? "text-emerald-700" : "text-rose-700"}`}>
                          {v.type === "Receipt In" ? "+" : "-"}₹{v.amount.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* 9. DISCOUNT / KASAR (₹) (SIMPLE CLEAN TEXT - NO BOX) */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap border-r border-slate-200/70">
                        {Boolean(v.kasar_amount && v.kasar_amount > 0) ? (
                          <span className="text-xs font-semibold text-amber-600">
                            ₹{Number(v.kasar_amount).toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-medium">-</span>
                        )}
                      </td>

                      {/* 10. TOTAL SETTLED (₹) (NEW DEDICATED COLUMN) */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap border-r border-slate-200/70">
                        <span className="text-xs font-bold text-slate-900">
                          ₹{totalSettled.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* 11. ACTION */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewVoucher(v)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Voucher Slip"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVoucher(v.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Voucher"
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

      {/* ------------------------------------------------------------- */}
      {/* 4. SLIP PREVIEW MODAL                                         */}
      {/* ------------------------------------------------------------- */}
      {previewVoucher && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-extrabold text-slate-900">Voucher Slip Preview</h2>
              </div>
              <button
                onClick={() => setPreviewVoucher(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AUTHENTIC VOUCHER SLIP CARD */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-4 shadow-2xs">
              {/* Slip Header Banner */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="font-black text-slate-900 text-sm tracking-wide uppercase">OM SAI TEXTILES</div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Payment Voucher Slip</div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${
                  previewVoucher.type === "Receipt In"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {previewVoucher.type === "Receipt In" ? "Receipt In" : "Payment Out"}
                </span>
              </div>

              {/* Single Column Details Stack */}
              <div className="bg-white rounded-xl border border-slate-200/90 divide-y divide-slate-100 text-xs shadow-2xs overflow-hidden">
                {/* VOUCHER NO */}
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Voucher No</span>
                  <span className="font-extrabold font-mono text-slate-900">{formatShortVoucherNo(previewVoucher.voucher_no)}</span>
                </div>

                {/* DATE */}
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Date</span>
                  <span className="font-extrabold text-slate-800">{previewVoucher.date}</span>
                </div>

                {/* PARTY / VENDOR */}
                <div className="p-3 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                    {previewVoucher.type === "Receipt In" ? t("Party Name") : t("Supplier / Party")}
                  </span>
                  <span className="font-extrabold text-slate-900 text-right">{previewVoucher.party_name}</span>
                </div>

                {/* PAYER / PERSON */}
                {previewVoucher.payer_person && (
                  <div className="p-3 flex items-center justify-between gap-4 bg-blue-50/50">
                    <span className="text-[10px] font-bold text-blue-700 uppercase shrink-0">Payer / Person</span>
                    <span className="font-extrabold text-blue-950 text-right">{previewVoucher.payer_person}</span>
                  </div>
                )}

                {/* DESIGN NO (DN) */}
                {(previewVoucher.design_no || previewVoucher.linked_challan) && (
                  <div className="p-3 flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Ref / Bill No</span>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg text-[11px] border border-indigo-200">
                      {previewVoucher.design_no || previewVoucher.linked_challan}
                    </span>
                  </div>
                )}

                {/* PAYMENT MODE */}
                <div className="p-3 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Payment Mode</span>
                  <span className="font-extrabold text-slate-900 text-right">{previewVoucher.mode || "Cash"}</span>
                </div>

                {/* REF / UTR NO (Shown only if not Cash and present) */}
                {(previewVoucher.mode || "").toLowerCase() !== "cash" &&
                 previewVoucher.ref_no &&
                 previewVoucher.ref_no !== "-" &&
                 previewVoucher.ref_no !== "N/A" &&
                 !(previewVoucher.ref_no || "").toLowerCase().startsWith("cash") && (
                  <div className="p-3 flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Ref / Txn No</span>
                    <span className="font-mono font-bold text-slate-700 text-right">{previewVoucher.ref_no}</span>
                  </div>
                )}

                {/* KASAR / DISCOUNT (IF ANY) */}
                {Boolean(previewVoucher.kasar_amount && previewVoucher.kasar_amount > 0) && (
                  <div className="p-3 flex items-center justify-between gap-4 bg-amber-50/60">
                    <span className="text-[10px] font-bold text-amber-800 uppercase shrink-0">Kasar / Discount</span>
                    <span className="font-mono font-extrabold text-amber-900 text-right">₹{previewVoucher.kasar_amount?.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {/* REMARKS / NOTES */}
                {previewVoucher.notes && (
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Remarks / Notes</span>
                    <span className="font-medium text-slate-700 italic text-[11px]">{previewVoucher.notes}</span>
                  </div>
                )}
              </div>

              {/* Total Amount Box - Simple & Clean */}
              <div className="p-3.5 bg-slate-100/80 border border-slate-200/90 rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block">
                    {previewVoucher.type === "Receipt In" ? "Total Amount Received" : "Total Amount Paid"}
                  </span>
                  {Boolean(previewVoucher.kasar_amount && previewVoucher.kasar_amount > 0) && (
                    <span className="text-[10px] text-emerald-700 font-bold">
                      Settled: ₹{(previewVoucher.amount + (previewVoucher.kasar_amount || 0)).toLocaleString("en-IN")} (With Kasar)
                    </span>
                  )}
                </div>
                <span className={`text-xl font-black tracking-tight ${
                  previewVoucher.type === "Receipt In" ? "text-blue-700" : "text-slate-900"
                }`}>
                  ₹{previewVoucher.amount.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Authorised Signatory Footer Line with Generous Signature Space */}
              <div className="pt-14 pb-2 flex items-center justify-end">
                <div className="text-center border-t border-dashed border-slate-300 pt-1.5 w-44">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Authorised Signatory
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setPreviewVoucher(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
