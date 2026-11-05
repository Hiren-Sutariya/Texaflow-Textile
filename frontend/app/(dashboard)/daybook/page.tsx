"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { fetchApi, getCachedApi } from "@/lib/api";
import { getTenantItem, getStoredCompanyId, getStoredFirmName } from "@/lib/tenantStorage";
import { useLanguage } from "@/context/LanguageContext";
import {
  CalendarDays,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  Share2,
  Receipt,
  CreditCard,
  Building2,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Percent,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { getStoredSalesInvoices, SalesInvoice } from "@/lib/salesStorage";

export interface DayBookEntry {
  id: string;
  time?: string;
  date: string;
  voucherNo: string;
  type: "INFLOW" | "OUTFLOW";
  category: "CUSTOMER_RECEIPT" | "SUPPLIER_PAYMENT" | "FACTORY_EXPENSE" | "WORKER_PAYOUT" | "OTHER";
  partyName: string;
  sourceRef?: string;
  mode: "Cash" | "Bank" | "UPI" | "Cheque" | "Other";
  modeRaw: string;
  amount: number;
  kasarAmount?: number;
  notes?: string;
  status?: string;
}

const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateToDDMMYYYY = (isoDate: string) => {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return isoDate;
};

const parseAnyDateToISO = (dateStr: string): string => {
  if (!dateStr) return "";
  const clean = dateStr.trim();
  if (clean.includes("-")) {
    const parts = clean.split("-");
    if (parts[0].length === 4) return clean; // YYYY-MM-DD
    if (parts[2]?.length === 4) return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`; // DD-MM-YYYY
  }
  if (clean.includes("/")) {
    const parts = clean.split("/");
    if (parts[2]?.length === 4) return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return clean;
};

export default function DayBookPage() {
  const { language, t } = useLanguage();
  const isGujarati = language === "gu";

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [filterMode, setFilterMode] = useState<"ALL" | "CASH_ONLY" | "BANK_ONLY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Raw data from modules
  const [expenses, setExpenses] = useState<any[]>([]);
  const [paymentVouchers, setPaymentVouchers] = useState<any[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [firmName, setFirmName] = useState<string>("");

  // Load firm name and data on mount
  useEffect(() => {
    const fn = getStoredFirmName() || "Texaflow Textile";
    setFirmName(fn);

    const loadAllTransactions = async () => {
      setIsLoading(true);
      const currentCid = getStoredCompanyId() || "comp-001";

      // 1. Load Expenses
      try {
        const cachedExp = getTenantItem<any[]>("texaflow_expenses") || [];
        setExpenses(cachedExp.filter((e) => (e.company_id || currentCid) === currentCid));
        fetchApi<any[]>("/expenses").then((live) => {
          if (Array.isArray(live)) {
            setExpenses(live.filter((e) => (e.company_id || currentCid) === currentCid));
          }
        }).catch(() => {});
      } catch {}

      // 2. Load Payment Vouchers
      try {
        const cachedVch = getTenantItem<any[]>("texaflow_vouchers") || [];
        setPaymentVouchers(cachedVch.filter((v) => (v.company_id || currentCid) === currentCid));
        fetchApi<any[]>("/payments").then((live) => {
          if (Array.isArray(live)) {
            setPaymentVouchers(live.filter((v) => (v.company_id || currentCid) === currentCid));
          }
        }).catch(() => {});
      } catch {}

      // 3. Load Sales Invoices
      try {
        const cachedInv = getStoredSalesInvoices();
        setSalesInvoices(cachedInv.filter((inv) => (inv.company_id || currentCid) === currentCid));
      } catch {}

      setIsLoading(false);
    };

    loadAllTransactions();

    const handleUpdate = () => loadAllTransactions();
    window.addEventListener("app_data_update", handleUpdate);
    return () => window.removeEventListener("app_data_update", handleUpdate);
  }, []);

  // Shift Date by +/- 1 Day
  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${day}`);
  };

  // Compile Unified Day Book Entries for the Selected Date
  const allDayEntries = useMemo(() => {
    const entries: DayBookEntry[] = [];
    const targetISO = selectedDate;
    const targetDDMM = formatDateToDDMMYYYY(selectedDate);

    // 1. Process Payment Vouchers (Receipt In = INFLOW, Payment Out = OUTFLOW)
    paymentVouchers.forEach((vch: any) => {
      const vchDateISO = parseAnyDateToISO(vch.date);
      if (vchDateISO === targetISO || vch.date === targetDDMM || vch.date === targetISO) {
        const isReceipt = vch.type === "Receipt In" || vch.voucher_type === "Receipt";
        const modeStr = String(vch.mode || vch.payment_mode || "Bank Transfer").toLowerCase();
        let normalizedMode: "Cash" | "Bank" | "UPI" | "Cheque" | "Other" = "Bank";
        if (modeStr.includes("cash")) normalizedMode = "Cash";
        else if (modeStr.includes("upi") || modeStr.includes("gpay") || modeStr.includes("phonepe")) normalizedMode = "UPI";
        else if (modeStr.includes("cheque")) normalizedMode = "Cheque";
        else normalizedMode = "Bank";

        entries.push({
          id: vch.id || `vch-${Math.random()}`,
          date: vch.date,
          voucherNo: vch.voucher_no || vch.ref_no || "VCH",
          type: isReceipt ? "INFLOW" : "OUTFLOW",
          category: isReceipt ? "CUSTOMER_RECEIPT" : "SUPPLIER_PAYMENT",
          partyName: vch.party_name || "Party",
          sourceRef: vch.linked_challan || vch.design_no || vch.ref_no,
          mode: normalizedMode,
          modeRaw: vch.mode || vch.payment_mode || "Bank Transfer",
          amount: Number(vch.amount || 0),
          kasarAmount: Number(vch.kasar_amount || 0),
          notes: vch.notes || vch.remarks || ""
        });
      }
    });

    // 2. Process Factory Expenses (Always OUTFLOW)
    expenses.forEach((exp: any) => {
      const expDateISO = parseAnyDateToISO(exp.date);
      if (expDateISO === targetISO || exp.date === targetDDMM || exp.date === targetISO) {
        if (exp.payment_status === "Paid" || !exp.payment_status) {
          const modeStr = String(exp.paid_via || "").toLowerCase();
          let normalizedMode: "Cash" | "Bank" | "UPI" | "Cheque" | "Other" = "Bank";
          if (modeStr.includes("cash")) normalizedMode = "Cash";
          else if (modeStr.includes("upi") || modeStr.includes("gpay") || modeStr.includes("phonepe")) normalizedMode = "UPI";
          else if (modeStr.includes("cheque")) normalizedMode = "Cheque";
          else normalizedMode = "Bank";

          entries.push({
            id: exp.id || `exp-${Math.random()}`,
            date: exp.date,
            voucherNo: exp.expense_no || "EB",
            type: "OUTFLOW",
            category: "FACTORY_EXPENSE",
            partyName: exp.vendor_name || exp.category || "Factory Expense",
            sourceRef: exp.category,
            mode: normalizedMode,
            modeRaw: exp.paid_via || "Cash",
            amount: Number(exp.amount || 0),
            notes: exp.notes || exp.title || ""
          });
        }
      }
    });

    return entries;
  }, [paymentVouchers, expenses, selectedDate]);

  // Filtered by Cash/Bank/Search
  const filteredEntries = useMemo(() => {
    return allDayEntries.filter((item) => {
      if (filterMode === "CASH_ONLY" && item.mode !== "Cash") return false;
      if (filterMode === "BANK_ONLY" && item.mode === "Cash") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mParty = item.partyName.toLowerCase().includes(q);
        const mVch = item.voucherNo.toLowerCase().includes(q);
        const mRef = (item.sourceRef || "").toLowerCase().includes(q);
        const mNote = (item.notes || "").toLowerCase().includes(q);
        if (!mParty && !mVch && !mRef && !mNote) return false;
      }
      return true;
    });
  }, [allDayEntries, filterMode, searchQuery]);

  // Inflows (જમા / આવક) vs Outflows (ઉધાર / જાવક)
  const inflows = useMemo(() => filteredEntries.filter((e) => e.type === "INFLOW"), [filteredEntries]);
  const outflows = useMemo(() => filteredEntries.filter((e) => e.type === "OUTFLOW"), [filteredEntries]);

  // KPI Calculations
  const stats = useMemo(() => {
    let cashIn = 0;
    let cashOut = 0;
    let bankIn = 0;
    let bankOut = 0;
    let totalKasar = 0;

    allDayEntries.forEach((e) => {
      totalKasar += e.kasarAmount || 0;
      if (e.mode === "Cash") {
        if (e.type === "INFLOW") cashIn += e.amount;
        else cashOut += e.amount;
      } else {
        if (e.type === "INFLOW") bankIn += e.amount;
        else bankOut += e.amount;
      }
    });

    const netCash = cashIn - cashOut;
    const netBank = bankIn - bankOut;
    const totalIn = cashIn + bankIn;
    const totalOut = cashOut + bankOut;
    const netDay = totalIn - totalOut;

    return {
      cashIn,
      cashOut,
      netCash,
      bankIn,
      bankOut,
      netBank,
      totalIn,
      totalOut,
      netDay,
      totalKasar
    };
  }, [allDayEntries]);

  // WhatsApp Share Functionality
  const handleShareWhatsApp = () => {
    const formattedDate = formatDateToDDMMYYYY(selectedDate);
    const text = `*📊 ${firmName} - ROJMel (રોજમેળ)*\n*તારીખ:* ${formattedDate}\n---------------------------\n*💰 રોકડ આવક (Cash In):* ₹${stats.cashIn.toLocaleString("en-IN")}\n*💸 રોકડ જાવક (Cash Out):* ₹${stats.cashOut.toLocaleString("en-IN")}\n*💵 હાથ પર ચોખ્ખી રોકડ સિલક:* ₹${stats.netCash.toLocaleString("en-IN")}\n---------------------------\n*🏦 બેંક આવક (Bank In):* ₹${stats.bankIn.toLocaleString("en-IN")}\n*📤 બેંક ચુકવણી (Bank Out):* ₹${stats.bankOut.toLocaleString("en-IN")}\n*🏛️ બેંક નેટ ફ્લો:* ₹${stats.netBank.toLocaleString("en-IN")}\n---------------------------\n*📉 કુલ કસર/વટાવ (Kasar):* ₹${stats.totalKasar.toLocaleString("en-IN")}\n*✅ આજની ચોખ્ખી સિલક (Net Balance):* ₹${stats.netDay.toLocaleString("en-IN")}\n\n_Generated via Texaflow Textile ERP_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Print Day Book
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-12 print:p-0 print:m-0">
      {/* 1. TOP HEADER & DATE CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-tight">
                {isGujarati ? "રોજમેળ (ડે બુક)" : "Day Book (Rojmel)"}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {isGujarati
                  ? "દૈનિક રોકડ સિલક, બેંક ટ્રાન્ઝેક્શન્સ અને ખર્ચ-આવક મેળ"
                  : "Daily Cash in Hand, Bank Transactions & Inflow/Outflow Register"}
              </p>
            </div>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 px-2 py-1 focus:outline-none cursor-pointer"
            />
            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(getTodayDateStr())}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            {isGujarati ? "આજે (Today)" : "Today"}
          </button>

          {/* WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="h-9 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Share Rojmel on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isGujarati ? "વોટ્સએપ શેર" : "WhatsApp"}</span>
          </button>

          {/* Print PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer print:hidden"
            title="Print Day Book"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isGujarati ? "પ્રિન્ટ રોજમેળ" : "Print PDF"}</span>
          </button>
        </div>
      </div>

      {/* 2. TOP 4 FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4">
        {/* CARD 1: CASH IN HAND (હાથ પર રોકડ) */}
        <div className="bg-white rounded-2xl p-3.5 border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">
              {isGujarati ? "રોકડ સિલક (CASH IN HAND)" : "NET CASH IN HAND"}
            </span>
            <span className="p-1 bg-emerald-100 text-emerald-700 rounded-lg">
              <Wallet className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-1 font-mono">
            ₹{stats.netCash.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-semibold">
            <span className="text-emerald-700">In: ₹{stats.cashIn.toLocaleString("en-IN")}</span>
            <span>•</span>
            <span className="text-rose-600">Out: ₹{stats.cashOut.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* CARD 2: BANK NET FLOW (બેંક વ્યવહાર) */}
        <div className="bg-white rounded-2xl p-3.5 border border-blue-200/80 bg-gradient-to-br from-white to-blue-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wider">
              {isGujarati ? "બેંક નેટ ફ્લો (BANK FLOW)" : "NET BANK FLOW"}
            </span>
            <span className="p-1 bg-blue-100 text-blue-700 rounded-lg">
              <Building2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-1 font-mono">
            ₹{stats.netBank.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-semibold">
            <span className="text-blue-700">In: ₹{stats.bankIn.toLocaleString("en-IN")}</span>
            <span>•</span>
            <span className="text-rose-600">Out: ₹{stats.bankOut.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* CARD 3: TOTAL INFLOWS (કુલ આવક - જમા) */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
              {isGujarati ? "કુલ આવક (TOTAL RECEIPTS)" : "TOTAL RECEIPTS (IN)"}
            </span>
            <span className="p-1 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xl font-black text-emerald-700 mt-1 font-mono">
            ₹{stats.totalIn.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-1.5">
            {inflows.length} {isGujarati ? "આવક એન્ટ્રીઓ" : "receipt entries"}
          </p>
        </div>

        {/* CARD 4: TOTAL OUTFLOWS (કુલ જાવક - ઉધાર) */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
              {isGujarati ? "કુલ ખર્ચ / જાવક (PAYMENTS)" : "TOTAL PAYMENTS (OUT)"}
            </span>
            <span className="p-1 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xl font-black text-rose-600 mt-1 font-mono">
            ₹{stats.totalOut.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 font-medium">
            <span>{outflows.length} {isGujarati ? "જાવક એન્ટ્રીઓ" : "payment entries"}</span>
            {stats.totalKasar > 0 && (
              <span className="text-amber-700 font-bold ml-auto">
                (₹{stats.totalKasar.toLocaleString("en-IN")} Kasar)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. FILTER TABS & SEARCH BAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs print:hidden">
        {/* Cash / Bank Segment Filter */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterMode("ALL")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              filterMode === "ALL" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {isGujarati ? "બધું (All Books)" : "All Books"}
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("CASH_ONLY")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              filterMode === "CASH_ONLY" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {isGujarati ? "રોકડ મેળ (Cash Only)" : "Cash Only"}
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("BANK_ONLY")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              filterMode === "BANK_ONLY" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {isGujarati ? "બેંક મેળ (Bank Only)" : "Bank Only"}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isGujarati ? "પાર્ટી, વાઉચર, બિલ કે ખર્ચ શોધો..." : "Search party, voucher, bill ref..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/payments/new"
            className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>+ {isGujarati ? "નવું વાઉચર" : "New Voucher"}</span>
          </Link>
          <Link
            href="/expenses/new"
            className="h-8 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>+ {isGujarati ? "ખર્ચ ઉમેરો" : "Add Expense"}</span>
          </Link>
        </div>
      </div>

      {/* 4. TRADITIONAL DUAL T-ACCOUNT VIEW: જમા (RECEIPTS) vs ઉધાર (PAYMENTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT COLUMN: RECEIPTS / INFLOWS (જમા - આવક) */}
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
                જ
              </span>
              <div>
                <h3 className="font-extrabold text-sm tracking-wide">
                  {isGujarati ? "જમા - આવક (INFLOWS / RECEIPTS)" : "RECEIPTS / INFLOWS (CREDIT)"}
                </h3>
                <p className="text-[10px] text-emerald-100 font-medium">
                  {isGujarati ? "પાર્ટીઓ પાસેથી આવેલ પેમેન્ટ અને કેશ આવક" : "Customer receipts & sales collections"}
                </p>
              </div>
            </div>
            <span className="font-mono font-black text-sm bg-white/20 px-2.5 py-1 rounded-lg">
              ₹{inflows.reduce((s, i) => s + i.amount, 0).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">VOUCHER / PARTY</th>
                  <th className="py-2.5 px-3">BILL / REF</th>
                  <th className="py-2.5 px-3">MODE</th>
                  <th className="py-2.5 px-3 text-right">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {inflows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                      {isGujarati ? "આ તારીખે કોઈ આવક નોંધાયેલ નથી." : "No receipt entries on this date."}
                    </td>
                  </tr>
                ) : (
                  inflows.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-slate-900 truncate max-w-[170px]">
                          {item.partyName}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-blue-700 mt-0.5">
                          {item.voucherNo}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.sourceRef || "-"}
                        </span>
                        {item.kasarAmount ? (
                          <div className="text-[9px] font-bold text-amber-700 mt-0.5">
                            +{item.kasarAmount} Kasar
                          </div>
                        ) : null}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.mode === "Cash"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {item.modeRaw}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 text-sm whitespace-nowrap">
                        +₹{item.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: PAYMENTS / OUTFLOWS (ઉધાર - જાવક) */}
        <div className="bg-white rounded-2xl border border-rose-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
                ઉ
              </span>
              <div>
                <h3 className="font-extrabold text-sm tracking-wide">
                  {isGujarati ? "ઉધાર - જાવક (OUTFLOWS / PAYMENTS)" : "PAYMENTS / OUTFLOWS (DEBIT)"}
                </h3>
                <p className="text-[10px] text-rose-100 font-medium">
                  {isGujarati ? "ફેક્ટરી ખર્ચાઓ, કારીગર ઉપાડ અને વેપારી ચુકવણી" : "Factory expenses, supplier & karigar payouts"}
                </p>
              </div>
            </div>
            <span className="font-mono font-black text-sm bg-white/20 px-2.5 py-1 rounded-lg">
              ₹{outflows.reduce((s, o) => s + o.amount, 0).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">EXPENSE / PAYEE</th>
                  <th className="py-2.5 px-3">CATEGORY / REF</th>
                  <th className="py-2.5 px-3">MODE</th>
                  <th className="py-2.5 px-3 text-right">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {outflows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                      {isGujarati ? "આ તારીખે કોઈ જાવક/ખર્ચ થયેલ નથી." : "No payment entries on this date."}
                    </td>
                  </tr>
                ) : (
                  outflows.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-slate-900 truncate max-w-[170px]">
                          {item.partyName}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-rose-600 mt-0.5">
                          {item.voucherNo}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] font-semibold text-slate-700 truncate block max-w-[150px]">
                          {item.sourceRef || item.notes || "-"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.mode === "Cash"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {item.modeRaw}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-rose-600 text-sm whitespace-nowrap">
                        -₹{item.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM DAY BOOK CLOSING STATEMENT (આખર સરવૈયું) */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div>
          <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-sans font-bold">
            {isGujarati ? "આજની આખર સિલક (CLOSING DAY BALANCE)" : "CLOSING DAY BALANCE"}
          </span>
          <p className="text-xl font-black text-emerald-400 mt-0.5">
            ₹{stats.netDay.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="flex items-center gap-6 text-slate-300">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans font-bold">
              {isGujarati ? "હાથ પર રોકડ (Cash Balance)" : "Cash in Hand"}
            </span>
            <span className="font-black text-white text-sm">
              ₹{stats.netCash.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="border-l border-slate-700 pl-6">
            <span className="text-[10px] text-slate-400 block font-sans font-bold">
              {isGujarati ? "બેંક બેલેન્સ ફ્લો (Bank Movement)" : "Bank Movement"}
            </span>
            <span className="font-black text-white text-sm">
              ₹{stats.netBank.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="border-l border-slate-700 pl-6">
            <span className="text-[10px] text-slate-400 block font-sans font-bold">
              {isGujarati ? "કુલ કસર (Total Kasar)" : "Total Kasar"}
            </span>
            <span className="font-black text-amber-400 text-sm">
              ₹{stats.totalKasar.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

