"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
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
  type: "Payment Out" | "Receipt In";
  linked_source: "Job Process Challan" | "Material Inward Bill" | "On-Account / General Payment" | "Job Work / Purchase" | string;
  amount: number;
  mode: string;
  ref_no: string;
  notes: string;
}

const SEED_VOUCHERS: PaymentVoucherItem[] = [
  {
    id: "pay-3",
    voucher_no: "VOU-2026-103",
    date: "08-10-2026",
    party_name: "Vardhman Textile Machinery & Spares",
    type: "Payment Out",
    linked_source: "Job Work / Purchase",
    amount: 12000,
    mode: "Cheque",
    ref_no: "CHQ-449012",
    notes: "Laser machine spare parts maintenance"
  },
  {
    id: "pay-2",
    voucher_no: "VOU-2026-102",
    date: "05-10-2026",
    party_name: "Ambica Embroidery & Cutting Works",
    type: "Payment Out",
    linked_source: "Job Work / Purchase",
    amount: 18500,
    mode: "UPI / Immediate",
    ref_no: "UPI772183",
    notes: "Job work cutting payment settlement"
  },
  {
    id: "pay-1",
    voucher_no: "VOU-2026-101",
    date: "02-10-2026",
    party_name: "Shree Ram Yarns & Zari Mills",
    type: "Payment Out",
    linked_source: "Job Work / Purchase",
    amount: 45000,
    mode: "RTGS / NEFT",
    ref_no: "HDFC982310",
    notes: "Advance payment for metallic zari purchase"
  }
];

export default function PaymentsAndVouchersPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vouchers, setVouchers] = useState<PaymentVoucherItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("om_sai_vouchers");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch {}
    }
    return SEED_VOUCHERS;
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
    const loadVouchers = async () => {
      try {
        const live = await fetchApi<any[]>("/payments");
        if (!isMounted) return;
        if (Array.isArray(live)) {
          const mapped: PaymentVoucherItem[] = live.map((p) => ({
            id: p.id,
            voucher_no: p.voucher_no,
            date: p.date,
            party_name: p.party_name,
            paying_company: "Om Sai Fabrics (Main Account)",
            type: (p.voucher_type as any) || "Payment Out",
            linked_source: "Job Work / Purchase" as any,
            amount: Number(p.amount) || 0,
            mode: p.payment_mode || "Bank Transfer",
            ref_no: p.reference_no || "-",
            bank_details: p.bank_account || "HDFC Bank Main A/c",
            notes: p.remarks || ""
          }));
          setVouchers(mapped);
          try {
            localStorage.setItem("om_sai_vouchers", JSON.stringify(mapped));
          } catch {}
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Backend payments load fallback to localStorage", err);
      }

      if (!isMounted) return;
      try {
        const saved = localStorage.getItem("om_sai_vouchers");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setVouchers(parsed);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }
      setVouchers(SEED_VOUCHERS);
      setIsLoading(false);
    };
    loadVouchers();
    return () => {
      isMounted = false;
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
          v.party_name.toLowerCase().includes(q) ||
          v.voucher_no.toLowerCase().includes(q) ||
          v.ref_no.toLowerCase().includes(q) ||
          v.notes.toLowerCase().includes(q)
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
        localStorage.setItem("om_sai_vouchers", JSON.stringify(updated));
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
      {/* 1. TOP 4 SUMMARY BOXES (KPI CARDS - EXACT MATCHING KARIGAR)    */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* BOX 1: TOTAL PAYMENT OUT */}
        <div className="p-3 sm:p-3.5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate mr-1">
              TOTAL PAYMENT OUT
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span suppressHydrationWarning className="text-base sm:text-xl font-black text-rose-600 tracking-tight">
              ₹{stats.totalOut.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* BOX 2: TOTAL PAYMENT IN */}
        <div className="p-3 sm:p-3.5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate mr-1">
              TOTAL PAYMENT IN
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span suppressHydrationWarning className="text-base sm:text-xl font-black text-blue-600 tracking-tight">
              ₹{stats.totalIn.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* BOX 3: ACTIVE PARTIES */}
        <div className="p-3 sm:p-3.5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate mr-1">
              ACTIVE PARTIES
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span suppressHydrationWarning className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
              {stats.activeParties}
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-400">Parties</span>
          </div>
        </div>

        {/* BOX 4: TOTAL VOUCHERS */}
        <div className="p-3 sm:p-3.5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate mr-1">
              TOTAL VOUCHERS
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span suppressHydrationWarning className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
              {stats.totalVouchers}
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-400">Vouchers</span>
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
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <div
                key={`m-skel-${n}`}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200/80 rounded w-36" />
                  <div className="h-4 bg-slate-200/80 rounded-full w-16" />
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <div className="h-4 bg-slate-200/80 rounded w-44" />
                  <div className="h-5 bg-slate-200/80 rounded w-20" />
                </div>
                <div className="h-10 bg-slate-100 rounded-xl" />
              </div>
            ))
          ) : filteredVouchers.length === 0 ? (
            <div className="py-10 text-center text-slate-400 font-medium bg-white rounded-xl border border-slate-200">
              No payment vouchers found matching your filter criteria.
            </div>
          ) : (
            filteredVouchers.map((v) => (
              <div
                key={v.id}
                onClick={() => setPreviewVoucher(v)}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3 active:scale-[0.99] transition-all cursor-pointer hover:border-blue-300"
              >
                {/* Top Row: Date, Voucher No, Type */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {v.date}
                    </span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">
                      {v.voucher_no}
                    </span>
                  </div>
                  {v.type === "Receipt In" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      Received In
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                      Paid Out
                    </span>
                  )}
                </div>

                {/* Party & Amount Display */}
                <div className="flex items-start justify-between gap-3 pt-1 border-t border-slate-100">
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 text-sm truncate">
                      {v.party_name}
                    </div>
                    {v.notes && (
                      <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                        {v.notes}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-base font-black ${v.type === "Receipt In" ? "text-blue-600" : "text-rose-700"}`}>
                      {v.type === "Receipt In" ? "+" : "-"}₹{v.amount.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Details Grid: Source & Mode */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Linked Source</span>
                    <span className="font-bold text-slate-700 inline-block mt-0.5">
                      {v.linked_source}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Mode</span>
                    <span className="font-bold text-slate-800 inline-block mt-0.5">
                      {v.mode}
                    </span>
                    {v.mode.toLowerCase() !== "cash" &&
                      v.ref_no &&
                      v.ref_no !== "-" &&
                      v.ref_no !== "N/A" &&
                      !v.ref_no.toLowerCase().startsWith("cash") && (
                        <div className="text-[10px] font-mono text-slate-400 truncate">{v.ref_no}</div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-1 gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setPreviewVoucher(v)}
                    className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Slip</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVoucher(v.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors cursor-pointer"
                    title="Delete Voucher"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Voucher No</th>
                <th className="py-3.5 px-5">Type</th>
                <th className="py-3.5 px-5">Party / Vendor</th>
                <th className="py-3.5 px-5">Linked Source</th>
                <th className="py-3.5 px-5">Payment Mode</th>
                <th className="py-3.5 px-5 text-right">Amount (₹)</th>
                <th className="py-3.5 px-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {isLoading ? (
                [1, 2, 3].map((n) => (
                  <tr key={`skel-row-${n}`} className="animate-pulse">
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200/80 rounded w-20" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200/80 rounded w-28" /></td>
                    <td className="py-4 px-5"><div className="h-5 bg-slate-200/80 rounded-lg w-16" /></td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200/80 rounded w-48 mb-1.5" />
                      <div className="h-3 bg-slate-100 rounded w-28" />
                    </td>
                    <td className="py-4 px-5"><div className="h-5 bg-slate-200/80 rounded-lg w-28" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200/80 rounded w-24" /></td>
                    <td className="py-4 px-5 text-right"><div className="h-4 bg-slate-200/80 rounded w-16 ml-auto" /></td>
                    <td className="py-4 px-5 text-center"><div className="h-6 bg-slate-200/80 rounded-md w-14 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                    No payment vouchers found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-blue-50/50 transition-colors animate-in fade-in duration-150">
                    <td className="py-4 px-5 text-slate-600 font-bold whitespace-nowrap">
                      {v.date}
                    </td>
                    <td className="py-4 px-5 font-extrabold text-slate-900 whitespace-nowrap">
                      {v.voucher_no}
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap">
                      {v.type === "Receipt In" ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                          Received In
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 inline-block">
                          Paid Out
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-extrabold text-slate-900">{v.party_name}</div>
                      {v.notes && <div className="text-[10px] text-slate-400 truncate max-w-xs font-medium">{v.notes}</div>}
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {v.linked_source}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-slate-800 font-bold">{v.mode}</div>
                      {v.mode.toLowerCase() !== "cash" &&
                       v.ref_no &&
                       v.ref_no !== "-" &&
                       v.ref_no !== "N/A" &&
                       !v.ref_no.toLowerCase().startsWith("cash") && (
                        <div className="text-[10px] font-mono text-slate-400">{v.ref_no}</div>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right font-black text-sm whitespace-nowrap">
                      <span className={v.type === "Receipt In" ? "text-blue-600" : "text-rose-700"}>
                        {v.type === "Receipt In" ? "+" : "-"}₹{v.amount.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewVoucher(v)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View Voucher Slip"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVoucher(v.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Voucher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
                  <span className="font-extrabold font-mono text-slate-900">{previewVoucher.voucher_no}</span>
                </div>

                {/* DATE */}
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Date</span>
                  <span className="font-extrabold text-slate-800">{previewVoucher.date}</span>
                </div>

                {/* PARTY / VENDOR */}
                <div className="p-3 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Party Name</span>
                  <span className="font-extrabold text-slate-900 text-right">{previewVoucher.party_name}</span>
                </div>

                {/* LINKED SOURCE */}
                <div className="p-3 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Linked Source</span>
                  <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg text-[11px] border border-slate-200">
                    {previewVoucher.linked_source}
                  </span>
                </div>

                {/* PAYMENT MODE */}
                <div className="p-3 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Payment Mode</span>
                  <span className="font-extrabold text-slate-900 text-right">{previewVoucher.mode}</span>
                </div>

                {/* REF / UTR NO (Shown only if not Cash and present) */}
                {previewVoucher.mode.toLowerCase() !== "cash" &&
                 previewVoucher.ref_no &&
                 previewVoucher.ref_no !== "-" &&
                 previewVoucher.ref_no !== "N/A" &&
                 !previewVoucher.ref_no.toLowerCase().startsWith("cash") && (
                  <div className="p-3 flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Ref / Txn No</span>
                    <span className="font-mono font-bold text-slate-700 text-right">{previewVoucher.ref_no}</span>
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
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  {previewVoucher.type === "Receipt In" ? "Total Amount Received" : "Total Amount Paid"}
                </span>
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
