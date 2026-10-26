"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { getTenantItem, setTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { calculateDueDate, getDueStatus, parseAnyDate } from "@/lib/creditTerms";
import { getStoredCompanySettings, fetchLiveCompanySettings, CompanySettings, getFieldLabel } from "@/lib/companySettings";
import { useLanguage } from "@/context/LanguageContext";
import {
  getStoredSalesInvoices,
  saveSalesInvoice,
  deleteSalesInvoice,
  getStoredSalesChallans,
  SalesInvoice
} from "@/lib/salesStorage";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  Printer,
  Calendar,
  Building2,
  Layers,
  ChevronDown,
  X,
  Receipt,
  Truck,
  AlertCircle,
  FileCheck,
  Edit3,
  MessageCircle
} from "lucide-react";

function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero Rupees Only";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatTens = (n: number): string => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
  };

  const formatHundred = (n: number): string => {
    let str = "";
    if (Math.floor(n / 100) > 0) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n = n % 100;
    }
    if (n > 0) {
      str += formatTens(n);
    }
    return str.trim();
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const remainder = integerPart % 1000;

  let result = "";
  if (crore > 0) result += formatHundred(crore) + " Crore ";
  if (lakh > 0) result += formatHundred(lakh) + " Lakh ";
  if (thousand > 0) result += formatHundred(thousand) + " Thousand ";
  if (remainder > 0) result += formatHundred(remainder) + " ";

  result = result.trim() ? result.trim() : "Zero";
  if (decimalPart > 0) {
    result += " And " + formatTens(decimalPart) + " Paise";
  }
  return result + " Only";
}

function getInvoiceDueInfo(inv: SalesInvoice) {
  if (inv.payment_status === "Paid") {
    return {
      isPaid: true,
      isOverdue: false,
      isDueToday: false,
      text: "Settled",
      daysLeft: 0,
    };
  }

  const invoiceD = parseAnyDate(inv.date);
  const creditDays = typeof inv.credit_days === "number" ? inv.credit_days : parseInt(String(inv.credit_days || "30"), 10) || 30;

  let dueD: Date | null = null;
  if (inv.due_date) {
    dueD = parseAnyDate(inv.due_date);
  }
  if (!dueD && invoiceD) {
    dueD = new Date(invoiceD.getTime());
    if (creditDays > 0) {
      dueD.setDate(dueD.getDate() + creditDays);
    }
  }

  if (!dueD) {
    return {
      isPaid: false,
      isOverdue: false,
      isDueToday: false,
      text: "-",
      daysLeft: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueD.setHours(0, 0, 0, 0);

  const diffTime = dueD.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      isPaid: false,
      isOverdue: true,
      isDueToday: false,
      text: `${Math.abs(diffDays)}d Overdue`,
      daysLeft: diffDays,
    };
  }

  if (diffDays === 0) {
    return {
      isPaid: false,
      isOverdue: false,
      isDueToday: true,
      text: "Due Today",
      daysLeft: 0,
    };
  }

  return {
    isPaid: false,
    isOverdue: false,
    isDueToday: false,
    text: `${diffDays}d Left`,
    daysLeft: diffDays,
  };
}

export default function SalesInvoicesPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isGujarati = language === "gu";

  const [companySettings, setCompanySettings] = useState<CompanySettings>(getStoredCompanySettings);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Paid" | "Overdue">("All");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("All");
  const [previewInvoice, setPreviewInvoice] = useState<SalesInvoice | null>(null);

  useEffect(() => {
    fetchLiveCompanySettings().then((live) => {
      if (live) setCompanySettings(live);
    });
    const handleSettingsUpdate = () => {
      setCompanySettings(getStoredCompanySettings());
    };
    window.addEventListener("texaflow_settings_updated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("texaflow_settings_updated", handleSettingsUpdate);
    };
  }, []);

  // Load Invoices
  const loadData = () => {
    setIsLoading(true);
    try {
      const invList = getStoredSalesInvoices();
      // Show direct invoices or all sales invoices
      setSalesInvoices(invList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleRefresh = () => loadData();
    window.addEventListener("texaflow_sales_invoices_updated", handleRefresh);
    window.addEventListener("app_data_update", handleRefresh);

    return () => {
      window.removeEventListener("texaflow_sales_invoices_updated", handleRefresh);
      window.removeEventListener("app_data_update", handleRefresh);
    };
  }, []);

  // Unique customers for filter
  const customerOptions = useMemo(() => {
    const set = new Set<string>();
    salesInvoices.forEach((inv) => {
      if (inv.customer_name) set.add(inv.customer_name.trim());
    });
    return Array.from(set).sort();
  }, [salesInvoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return salesInvoices
      .filter((inv) => {
        const q = search.toLowerCase().trim();
        const matchesSearch =
          !q ||
          (inv.invoice_no && inv.invoice_no.toLowerCase().includes(q)) ||
          (inv.customer_name && inv.customer_name.toLowerCase().includes(q)) ||
          (inv.customer_gstin && inv.customer_gstin.toLowerCase().includes(q)) ||
          (inv.category && inv.category.toLowerCase().includes(q)) ||
          (inv.items_description && inv.items_description.toLowerCase().includes(q)) ||
          (inv.notes && inv.notes.toLowerCase().includes(q));

        const isPaid = inv.payment_status === "Paid";
        const dueDate = inv.due_date || (inv.credit_days ? calculateDueDate(inv.date, inv.credit_days) : inv.date);
        const dueInfo = dueDate ? getDueStatus(dueDate, isPaid) : null;

        let matchesStatus = true;
        if (statusFilter === "Paid") matchesStatus = isPaid;
        else if (statusFilter === "Pending") matchesStatus = !isPaid;
        else if (statusFilter === "Overdue") matchesStatus = !isPaid && dueInfo?.status === "Overdue";

        const matchesCustomer =
          selectedCustomer === "All" || (inv.customer_name && inv.customer_name.trim() === selectedCustomer.trim());

        return matchesSearch && matchesStatus && matchesCustomer;
      })
      .sort((a, b) => {
        const da = parseAnyDate(a.date)?.getTime() || 0;
        const db = parseAnyDate(b.date)?.getTime() || 0;
        return db - da; // newest first
      });
  }, [salesInvoices, search, statusFilter, selectedCustomer]);

  // KPI Metrics
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueCount = 0;

    salesInvoices.forEach((inv) => {
      const amt = Number(inv.total_amount) || 0;
      totalInvoiced += amt;
      const isPaid = inv.payment_status === "Paid";
      if (isPaid) {
        paidAmount += amt;
      } else {
        pendingAmount += amt;
        const dDate = inv.due_date || (inv.credit_days ? calculateDueDate(inv.date, inv.credit_days) : inv.date);
        const due = dDate ? getDueStatus(dDate, false) : null;
        if (due?.status === "Overdue") overdueCount++;
      }
    });

    return { totalInvoiced, paidAmount, pendingAmount, overdueCount, count: salesInvoices.length };
  }, [salesInvoices]);

  // Totals for table footer across filteredInvoices
  const tableTotals = useMemo(() => {
    let takka = 0;
    let meters = 0;
    let weight = 0;
    let cartoon = 0;
    let taxable = 0;
    let gstAmount = 0;
    let totalAmount = 0;
    let totalRate = 0;

    filteredInvoices.forEach((inv) => {
      const t = inv.total_takka ?? inv.total_item ?? (
        Array.isArray(inv.items) && inv.items.length > 0
          ? inv.items.reduce((acc, it) => acc + (Number(it.item ?? it.takka ?? it.item_qty) || 0), 0)
          : 0
      );
      const m = inv.total_meters ?? inv.total_quantity ?? (
        Array.isArray(inv.items) && inv.items.length > 0
          ? inv.items.reduce((acc, it) => acc + (Number(it.quantity ?? it.meters) || 0), 0)
          : 0
      );
      const w = inv.total_weight ?? (
        Array.isArray(inv.items) && inv.items.length > 0
          ? inv.items.reduce((acc, it) => acc + (Number(it.weight) || 0), 0)
          : 0
      );
      const c = inv.total_cartoon ?? (
        Array.isArray(inv.items) && inv.items.length > 0
          ? inv.items.reduce((acc, it) => acc + (Number(it.cartoon) || 0), 0)
          : 0
      );
      const k = (inv as any).total_kg ?? (
        Array.isArray(inv.items) && inv.items.length > 0
          ? inv.items.reduce((acc, it) => acc + (Number(it.kg) || 0), 0)
          : 0
      );

      const taxVal = Number(inv.taxable_amount || inv.subtotal) || 0;
      const storedTax = (Number(inv.cgst_amount) || 0) + (Number(inv.sgst_amount) || 0) + (Number(inv.igst_amount) || 0);
      const gstVal = storedTax > 0 ? storedTax : Number((taxVal * Number(inv.gst_rate || 0)) / 100);

      // Rate extraction for total
      const firstRate = inv.items?.[0]?.rate ? parseFloat(String(inv.items[0].rate)) : 0;
      if (firstRate > 0) {
        totalRate += firstRate;
      } else {
        const itemWithRate = inv.items?.find((it) => it.rate && parseFloat(String(it.rate)) > 0);
        if (itemWithRate?.rate) {
          totalRate += parseFloat(String(itemWithRate.rate));
        }
      }

      takka += Number(t) || 0;
      meters += Number(m) || 0;
      weight += Number(w) || 0;
      cartoon += Number(c) || 0;
      taxable += taxVal;
      gstAmount += gstVal;
      totalAmount += Number(inv.total_amount) || 0;
    });

    return { takka, meters, weight, cartoon, taxable, gstAmount, totalAmount, totalRate };
  }, [filteredInvoices]);

  // Toggle payment status
  const handleTogglePayment = (inv: SalesInvoice) => {
    const nextStatus = inv.payment_status === "Paid" ? "Pending" : "Paid";
    saveSalesInvoice({
      ...inv,
      payment_status: nextStatus
    });
    loadData();
  };

  // Delete invoice
  const handleDeleteInvoice = (id: string, invNo: string) => {
    if (confirm(isGujarati ? `શું તમે ઇન્વોઇસ ${invNo} ડિલીટ કરવા માંગો છો?` : `Delete Invoice ${invNo}?`)) {
      deleteSalesInvoice(id);
      loadData();
    }
  };

  const handleShareWhatsApp = (inv: SalesInvoice) => {
    const firmName = companySettings?.company_name || "Om Sai / Shiv Creation";
    const partyName = inv.customer_name || "Valued Customer";
    const billNo = inv.invoice_no || "-";
    const billDate = inv.date || "";
    const totalAmount = (inv.total_amount || 0).toLocaleString("en-IN");
    const gstRate = inv.gst_rate || 5;
    const taxAmount = (((inv.cgst_amount || 0) + (inv.sgst_amount || 0) + (inv.igst_amount || 0)) || 0).toLocaleString("en-IN");

    const message = 
      `*TAX INVOICE - ${firmName.toUpperCase()}*\n\n` +
      `નમસ્તે *${partyName}*,\n` +
      `આપનું સેલ્સ ટેક્સ ઇન્વોઇસ બિલ બની ગયેલ છે:\n\n` +
      `📄 *ઇન્વોઇસ નં:* ${billNo}\n` +
      `📅 *તારીખ:* ${billDate}\n` +
      `🏷️ *GST (${gstRate}%):* ₹${taxAmount}\n` +
      `💰 *કુલ બિલ રકમ:* ₹${totalAmount}\n\n` +
      `આપના હિસાબ ખાતામાં નોંધ લેવા વિનંતી.\n` +
      `આભાર! 🙏\n` +
      `_${firmName}_`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <div className="space-y-4 pb-16">
      {/* 1. TOP HEADER & KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* CARD 1: TOTAL INVOICED */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {isGujarati ? "કુલ પાકા બિલ (TOTAL)" : "TOTAL INVOICED"}
            </p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              ₹{metrics.totalInvoiced.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 2: RECEIVED / PAID */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider truncate">
              {isGujarati ? "જમા રકમ (RECEIVED)" : "PAID REVENUE"}
            </p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">
              ₹{metrics.paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 3: PENDING CREDIT */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider truncate">
              {isGujarati ? "બાકી ઉઘરાણી (PENDING)" : "PENDING CREDIT"}
            </p>
            <p className="text-xl font-black text-amber-600 mt-0.5">
              ₹{metrics.pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 4: OVERDUE ALERTS */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider truncate">
              {isGujarati ? "મુદત વીતી ગયેલ (OVERDUE)" : "OVERDUE BILLS"}
            </p>
            <p className={`text-xl font-black ${metrics.overdueCount > 0 ? "text-rose-600" : "text-slate-900"} mt-0.5`}>
              {metrics.overdueCount} {isGujarati ? "બિલ" : "Bills"}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. SEARCH & ACTION TOOLBAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isGujarati ? "ઇન્વોઇસ નં, ગ્રાહક, જીએસટી નં અથવા માલની વિગત શોધો..." : "Search by invoice no, customer, GSTIN, description..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filters and CTA */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Segment Filter */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200">
            {(["All", "Pending", "Paid", "Overdue"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st === "All" && (isGujarati ? "બધા" : "All")}
                {st === "Pending" && (isGujarati ? "બાકી" : "Pending")}
                {st === "Paid" && (isGujarati ? "ચૂકવેલ" : "Paid")}
                {st === "Overdue" && (isGujarati ? "મુદત બાકી" : "Overdue")}
              </button>
            ))}
          </div>

          {/* Customer filter dropdown */}
          {customerOptions.length > 0 && (
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="All">{isGujarati ? "બધા ગ્રાહક (All Customers)" : "All Customers"}</option>
              {customerOptions.map((cust) => (
                <option key={cust} value={cust}>
                  {cust}
                </option>
              ))}
            </select>
          )}

          {/* Action: New Direct Sales Tax Invoice */}
          <Link
            href="/sales-invoices/new"
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 text-xs shrink-0"
            title={isGujarati ? "ચલણ વગર સીધું પાકું જીએસટી બિલ બનાવો" : "Create direct sales tax invoice"}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{isGujarati ? "નવું સેલ્સ બિલ બનાવો" : "New Sales Invoice"}</span>
          </Link>
        </div>
      </div>

      {/* 3. SALES INVOICE DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs table-fixed min-w-[1280px]">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider whitespace-nowrap">
              <tr>
                {/* 1. DATE */}
                <th className="py-2.5 px-2.5 w-[7%] border-r border-slate-200/80">{t("DATE")}</th>

                {/* 2. INVOICE NO */}
                <th className="py-2.5 px-2.5 w-[7.5%] border-r border-slate-200/80 truncate">
                  {getFieldLabel(companySettings, "bill_no", t("INVOICE NO"))}
                </th>

                {/* 3. PARTY NAME */}
                <th className="py-2.5 px-2.5 w-[14.5%] border-r border-slate-200/80 truncate">
                  {getFieldLabel(companySettings, "party_name", t("PARTY NAME"))}
                </th>

                {/* 4. PARTICULARS */}
                <th className="py-2.5 px-2.5 w-[11%] border-r border-slate-200/80 truncate">
                  {getFieldLabel(companySettings, "item_name", t("PARTICULARS"))}
                </th>

                {/* 5. QTY */}
                <th className="py-2.5 px-2 text-right w-[6%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "quantity", t("QTY"))}
                </th>

                {/* 6. WEIGHT */}
                <th className="py-2.5 px-1.5 text-right w-[5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "weight", t("WEIGHT"))}
                </th>

                {/* 7. KG */}
                <th className="py-2.5 px-1.5 text-right w-[4.5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "kg", t("KG"))}
                </th>

                {/* 8. CARTOON */}
                <th className="py-2.5 px-1.5 text-center w-[4.5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "cartoon", t("CARTOON"))}
                </th>

                {/* 9. RATE (₹) */}
                <th className="py-2.5 px-2 text-right w-[6.5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "rate", t("RATE (₹)"))}
                </th>

                {/* 10. GST % */}
                <th className="py-2.5 px-1.5 text-center w-[4.5%] border-r border-slate-200/80">
                  {t("GST %")}
                </th>

                {/* 11. AMOUNT (₹) */}
                <th className="py-2.5 px-2.5 text-right w-[8%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "total_amount", t("AMOUNT (₹)"))}
                </th>

                {/* 12. DUE (DAYS) */}
                <th className="py-2.5 px-2 text-center w-[7%] border-r border-slate-200/80">{t("DUE (DAYS)")}</th>

                {/* 13. STATUS */}
                <th className="py-2.5 px-2 text-center w-[7%] border-r border-slate-200/80">{t("STATUS")}</th>

                {/* 14. ACTION */}
                <th className="py-2.5 px-2 text-center w-[9.5%] min-w-[125px]">{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    <FileCheck className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                    <p className="text-sm font-bold text-slate-600">{isGujarati ? "કોઈ સેલ્સ પાકા બિલ મળ્યા નથી" : "No Sales Invoices Found"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isGujarati
                        ? "સીધું નવું જીએસટી બિલ બનાવવા '+ નવું સેલ્સ બિલ બનાવો' ક્લિક કરો"
                        : "Click '+ New Sales Invoice' to create direct sales tax bills"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.payment_status === "Paid";
                  const dueInfo = getInvoiceDueInfo(inv);

                  const firstItem = inv.items?.[0];
                  const extraItemsCount = (inv.items?.length || 0) - 1;
                  const categoryName =
                    firstItem?.particulars ||
                    firstItem?.design_no ||
                    firstItem?.category ||
                    firstItem?.description ||
                    inv.category ||
                    inv.items_description ||
                    "-";
                  const hsnCode = firstItem?.hsn || firstItem?.hsn_code || "5407";

                  const takkaVal =
                    inv.total_item ??
                    inv.total_takka ??
                    (Array.isArray(inv.items) && inv.items.length > 0
                      ? inv.items.reduce((acc, it) => acc + (Number(it.item ?? it.takka ?? it.item_qty) || 0), 0)
                      : "-");

                  const qtyVal =
                    inv.total_quantity ??
                    inv.total_meters ??
                    (Array.isArray(inv.items) && inv.items.length > 0
                      ? inv.items.reduce((acc, it) => acc + (Number(it.quantity ?? it.meters) || 0), 0)
                      : "-");

                  const weightVal =
                    inv.total_weight ??
                    (Array.isArray(inv.items) && inv.items.length > 0
                      ? inv.items.reduce((acc, it) => acc + (Number(it.weight) || 0), 0)
                      : null);

                  const cartoonVal =
                    inv.total_cartoon ??
                    (Array.isArray(inv.items) && inv.items.length > 0
                      ? inv.items.reduce((acc, it) => acc + (Number(it.cartoon) || 0), 0)
                      : null);

                  const kgVal =
                    (inv as any).total_kg ??
                    (Array.isArray(inv.items) && inv.items.length > 0
                      ? inv.items.reduce((acc, it) => acc + (Number(it.kg) || 0), 0)
                      : null);

                  // Rate extraction
                  let rateDisplay = "-";
                  const firstItemRate = firstItem?.rate ? parseFloat(String(firstItem.rate)) : 0;
                  if (firstItemRate > 0) {
                    rateDisplay = `₹${firstItemRate.toFixed(2)}`;
                  } else {
                    const itemWithRate = inv.items?.find((it) => it.rate && parseFloat(String(it.rate)) > 0);
                    if (itemWithRate?.rate) {
                      rateDisplay = `₹${parseFloat(String(itemWithRate.rate)).toFixed(2)}`;
                    } else {
                      const taxable = Number(inv.taxable_amount || inv.subtotal || 0);
                      const qNum = typeof qtyVal === "number" ? qtyVal : parseFloat(String(qtyVal));
                      if (taxable > 0 && qNum > 0) {
                        rateDisplay = `₹${(taxable / qNum).toFixed(2)}`;
                      }
                    }
                  }

                  // GST extraction
                  const taxableVal = Number(inv.taxable_amount || inv.subtotal || 0);
                  const storedTax = (Number(inv.cgst_amount) || 0) + (Number(inv.sgst_amount) || 0) + (Number(inv.igst_amount) || 0);
                  const gstRateVal = Number(inv.gst_rate || 0);
                  const gstAmountVal = storedTax > 0 ? storedTax : Number((taxableVal * gstRateVal) / 100);

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setPreviewInvoice(inv)}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      {/* 1. DATE */}
                      <td className="py-2 px-2.5 font-mono text-slate-600 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {inv.date}
                      </td>

                      {/* 2. INVOICE NO */}
                      <td className="py-2 px-2.5 font-mono font-bold text-slate-900 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {inv.invoice_no}
                      </td>

                      {/* 3. PARTY NAME */}
                      <td className="py-2 px-2.5 align-middle border-r border-slate-200/70 min-w-0">
                        <Link
                          href={`/ledger?party=${encodeURIComponent(inv.customer_name)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-slate-900 hover:text-blue-600 hover:underline truncate w-full block transition-colors cursor-pointer text-xs"
                          title={`View Ledger for ${inv.customer_name}`}
                        >
                          {inv.customer_name}
                        </Link>
                      </td>

                      {/* 4. PARTICULARS */}
                      <td className="py-2 px-2.5 align-middle border-r border-slate-200/70 min-w-0">
                        <div className="truncate w-full text-xs" title={categoryName}>
                          <span className="font-bold text-slate-800">{categoryName}</span>
                          {extraItemsCount > 0 && (
                            <span className="text-[10px] text-slate-400 ml-1">+{extraItemsCount}</span>
                          )}
                        </div>
                      </td>

                      {/* 5. QTY */}
                      <td className="py-2 px-2 text-right font-mono font-bold text-slate-800 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {qtyVal !== "-" && Number(qtyVal) > 0 ? `${Number(qtyVal).toFixed(1)}m` : <span className="text-slate-400">-</span>}
                      </td>

                      {/* 6. WEIGHT */}
                      <td className="py-2 px-1.5 text-right font-mono text-slate-800 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {weightVal && Number(weightVal) > 0 ? Number(weightVal).toFixed(2) : "-"}
                      </td>

                      {/* 7. KG */}
                      <td className="py-2 px-1.5 text-right font-mono text-slate-800 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {kgVal && Number(kgVal) > 0 ? Number(kgVal).toFixed(2) : "-"}
                      </td>

                      {/* 8. CARTOON */}
                      <td className="py-2 px-1.5 text-center font-mono text-slate-800 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {cartoonVal && Number(cartoonVal) > 0 ? cartoonVal : "-"}
                      </td>

                      {/* 9. RATE (₹) */}
                      <td className="py-2 px-2 text-right font-mono font-bold text-slate-800 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {rateDisplay}
                      </td>

                      {/* 10. GST % */}
                      <td className="py-2 px-1.5 text-center font-mono font-bold text-slate-800 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {gstRateVal > 0 ? `${gstRateVal}%` : "0%"}
                      </td>

                      {/* 11. AMOUNT (₹) */}
                      <td className="py-2 px-2.5 text-right font-mono font-black text-slate-900 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        ₹{Number(inv.total_amount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2
                        })}
                      </td>

                      {/* 12. DUE (DAYS) */}
                      <td className="py-2 px-2 text-center align-middle whitespace-nowrap border-r border-slate-200/70">
                        {dueInfo.isPaid ? (
                          <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1 justify-center">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{t("Settled")}</span>
                          </span>
                        ) : dueInfo.isOverdue ? (
                          <span className="font-mono text-xs font-bold text-rose-600 inline-flex items-center gap-1 justify-center">
                            <Clock className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>{dueInfo.text}</span>
                          </span>
                        ) : dueInfo.isDueToday ? (
                          <span className="font-mono text-xs font-bold text-amber-700 inline-flex items-center gap-1 justify-center">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{t("Due Today")}</span>
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-bold text-amber-700 inline-flex items-center gap-1 justify-center">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{dueInfo.text}</span>
                          </span>
                        )}
                      </td>

                      {/* 13. STATUS */}
                      <td className="py-2 px-2 text-center align-middle whitespace-nowrap border-r border-slate-200/70" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleTogglePayment(inv)}
                          className="cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center justify-center"
                        >
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                              <span>{t("Paid")}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                              <span>{t("Pending")}</span>
                            </span>
                          )}
                        </button>
                      </td>

                      {/* 14. ACTION */}
                      <td className="py-2.5 px-2 text-center align-middle whitespace-nowrap min-w-[125px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewInvoice(inv)}
                            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={isGujarati ? "બિલ જુઓ અને પ્રિન્ટ કરો" : "View & Print Invoice"}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(inv)}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="WhatsApp પર શેર કરો"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/sales-invoices/new?id=${inv.id}`}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={t("Edit")}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteInvoice(inv.id, inv.invoice_no)}
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
            {filteredInvoices.length > 0 && (
              <tfoot className="bg-slate-50/90 font-extrabold text-slate-800 border-t-2 border-slate-200 select-none">
                <tr className="h-10 text-xs">
                  <td colSpan={8} className="py-2 px-3 border-r border-slate-200/80 bg-slate-50/90 text-right">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                        <span>{filteredInvoices.length}</span>
                        <span>{isGujarati ? "કુલ પાકા બિલ (Invoices)" : "Total Invoices"}</span>
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                        {isGujarati ? "કુલ સરવાળો (TOTAL):" : "TOTAL:"}
                      </span>
                    </div>
                  </td>
                  {/* 10. RATE TOTAL */}
                  <td className="py-2 px-1.5 text-right font-mono font-bold text-slate-900 border-r border-slate-200/80 whitespace-nowrap">
                    {tableTotals.totalRate > 0 ? `₹${tableTotals.totalRate.toFixed(2)}` : "-"}
                  </td>
                  {/* 11. GST % TOTAL */}
                  <td className="py-2 px-1 text-center font-mono text-slate-400 border-r border-slate-200/80">
                    -
                  </td>
                  {/* 12. AMOUNT TOTAL */}
                  <td className="py-2 px-2 border-r border-slate-200/80 text-right font-mono font-black text-blue-700 whitespace-nowrap">
                    ₹{tableTotals.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {/* 13, 14, 15: Empty colSpan 3 */}
                  <td colSpan={3} className="py-2 px-2 bg-slate-50/90"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 4. A4 FULL-FIDELITY PRINT & PREVIEW MODAL */}
      {previewInvoice && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={() => setPreviewInvoice(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[850px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">
                  {isGujarati ? "ટેક્સ ઇન્વોઇસ પ્રિવ્યુ & પ્રિન્ટ" : "TAX INVOICE PREVIEW & PRINT"} - {previewInvoice.invoice_no}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => previewInvoice && handleShareWhatsApp(previewInvoice)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="WhatsApp પર શેર કરો"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Share</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isGujarati ? "પ્રિન્ટ કરો (A4)" : "Print (A4)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewInvoice(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100/50">
              <div className="max-w-[760px] mx-auto bg-white border-2 border-slate-900 p-5 rounded shadow-sm text-slate-950 font-sans text-xs space-y-4">
                {/* Firm Header */}
                <div className="text-center border-b-2 border-slate-900 pb-3">
                  <h1 className="font-serif font-black text-2xl uppercase tracking-wider text-slate-950">
                    {companySettings.company_name || companySettings.brand_name || "OM SAI ENTERPRISE"}
                  </h1>
                  <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                    {companySettings.address || "Ring Road Textile Market"}, {companySettings.city_state || "Surat, Gujarat"} {companySettings.pincode ? `- ${companySettings.pincode}` : ""}
                  </p>
                  <div className="flex items-center justify-center gap-4 text-[10px] font-mono font-bold text-slate-800 mt-1">
                    {companySettings.gstin && <span>GSTIN: {companySettings.gstin}</span>}
                    {companySettings.phone && <span>MO: {companySettings.phone}</span>}
                  </div>
                  <div className="inline-block mt-1 px-3 py-0.5 bg-slate-100 border border-slate-900 rounded font-black text-[11px] uppercase tracking-wider">
                    TAX INVOICE
                  </div>
                </div>

                {/* Invoice Meta Grid */}
                <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-3 text-xs">
                  <div>
                    <span className="font-extrabold text-[10px] uppercase text-slate-500 block">Buyer / Customer:</span>
                    <p className="font-black text-sm text-slate-900">{previewInvoice.customer_name}</p>
                    {previewInvoice.customer_address && (
                      <p className="text-[11px] text-slate-600 mt-0.5">{previewInvoice.customer_address}</p>
                    )}
                    {previewInvoice.customer_gstin && (
                      <p className="text-[11px] font-mono font-bold text-blue-700 mt-0.5">
                        GSTIN: {previewInvoice.customer_gstin}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-1 font-mono text-xs">
                    <div>
                      <span className="text-slate-500 font-bold">Invoice No:</span>{" "}
                      <span className="font-black text-slate-900">{previewInvoice.invoice_no}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">Invoice Date:</span>{" "}
                      <span className="font-bold text-slate-900">{previewInvoice.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">Credit Terms:</span>{" "}
                      <span className="font-bold text-slate-900">{previewInvoice.payment_terms || "30 Days"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">Due Date:</span>{" "}
                      <span className="font-bold text-slate-900">{previewInvoice.due_date || previewInvoice.date}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                {(() => {
                  const hasCartoon = Boolean(
                    (previewInvoice.total_cartoon && Number(previewInvoice.total_cartoon) > 0) ||
                    (previewInvoice.items && previewInvoice.items.some((it: any) => it.cartoon && Number(it.cartoon) > 0))
                  );

                  return (
                    <table className="w-full text-left border-collapse text-xs border border-slate-900">
                      <thead className="bg-slate-100 border-b border-slate-900 font-bold text-[10px] uppercase">
                        <tr>
                          <th className="p-1.5 border-r border-slate-900 w-8 text-center">Sr</th>
                          <th className="p-1.5 border-r border-slate-900">{getFieldLabel(companySettings, "item_name", "Description / Quality")}</th>
                          <th className="p-1.5 border-r border-slate-900 w-16 text-center">{getFieldLabel(companySettings, "hsn_code", "HSN")}</th>
                          <th className="p-1.5 border-r border-slate-900 w-20 text-right">{getFieldLabel(companySettings, "quantity", "Meters")}</th>
                          <th className="p-1.5 border-r border-slate-900 w-16 text-right">{getFieldLabel(companySettings, "weight", "Weight")}</th>
                          <th className="p-1.5 border-r border-slate-900 w-16 text-right">{getFieldLabel(companySettings, "kg", "KG")}</th>
                          {hasCartoon && (
                            <th className="p-1.5 border-r border-slate-900 w-14 text-center">{getFieldLabel(companySettings, "cartoon", "Cartoon")}</th>
                          )}
                          <th className="p-1.5 border-r border-slate-900 w-16 text-right">{getFieldLabel(companySettings, "rate", "Rate (₹)")}</th>
                          <th className="p-1.5 w-24 text-right">{getFieldLabel(companySettings, "total_amount", "Amount (₹)")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(previewInvoice.items && previewInvoice.items.length > 0
                          ? previewInvoice.items
                          : [
                              {
                                description: previewInvoice.category || "Textile Fabric",
                                hsn_code: "5407",
                                quantity: previewInvoice.total_meters || previewInvoice.total_quantity || "-",
                                weight: previewInvoice.total_weight || "-",
                                kg: (previewInvoice as any).total_kg || "-",
                                cartoon: previewInvoice.total_cartoon || "-",
                                rate: "-",
                                amount: previewInvoice.subtotal
                              }
                            ]
                        ).map((it: any, idx: number) => (
                          <tr key={idx} className="font-medium text-xs">
                            <td className="p-1.5 text-center font-mono border-r border-slate-900">{idx + 1}</td>
                            <td className="p-1.5 border-r border-slate-900 font-bold">{it.description || it.category || "Fabric"}</td>
                            <td className="p-1.5 text-center font-mono border-r border-slate-900">{it.hsn_code || "5407"}</td>
                            <td className="p-1.5 text-right font-mono border-r border-slate-900">{it.quantity || it.meters || "-"}</td>
                            <td className="p-1.5 text-right font-mono border-r border-slate-900">{it.weight ? Number(it.weight).toFixed(2) : "-"}</td>
                            <td className="p-1.5 text-right font-mono border-r border-slate-900">{it.kg ? Number(it.kg).toFixed(2) : "-"}</td>
                            {hasCartoon && (
                              <td className="p-1.5 text-center font-mono border-r border-slate-900">{it.cartoon || "-"}</td>
                            )}
                            <td className="p-1.5 text-right font-mono border-r border-slate-900">{it.rate || "-"}</td>
                            <td className="p-1.5 text-right font-mono font-bold">
                              ₹{Number(it.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-slate-900 font-bold bg-slate-50">
                        <tr>
                          <td colSpan={3} className="p-1.5 border-r border-slate-900 text-right uppercase text-[10px]">Total:</td>
                          <td className="p-1.5 text-right font-mono border-r border-slate-900">
                            {previewInvoice.total_meters || previewInvoice.total_quantity || "-"}
                          </td>
                          <td className="p-1.5 text-right font-mono border-r border-slate-900">
                            {previewInvoice.total_weight ? Number(previewInvoice.total_weight).toFixed(2) : "-"}
                          </td>
                          <td className="p-1.5 text-right font-mono border-r border-slate-900">
                            {(previewInvoice as any).total_kg ? Number((previewInvoice as any).total_kg).toFixed(2) : "-"}
                          </td>
                          {hasCartoon && (
                            <td className="p-1.5 text-center font-mono border-r border-slate-900">
                              {previewInvoice.total_cartoon || "-"}
                            </td>
                          )}
                          <td className="p-1.5 border-r border-slate-900"></td>
                          <td className="p-1.5 text-right font-mono font-black text-slate-950">
                            ₹{Number(previewInvoice.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  );
                })()}

                {/* Tax Breakdown & Grand Total */}
                <div className="flex justify-between items-start gap-4 pt-1">
                  <div className="flex-1 space-y-1 text-[11px]">
                    <p className="font-bold text-slate-700">Amount in Words:</p>
                    <p className="font-serif italic text-slate-900 font-semibold">{numberToIndianWords(previewInvoice.total_amount)}</p>
                    {previewInvoice.notes && (
                      <p className="text-[10px] text-slate-500 pt-1">
                        <span className="font-bold">Remarks:</span> {previewInvoice.notes}
                      </p>
                    )}
                  </div>
                  <div className="w-56 space-y-1 text-xs border border-slate-300 p-2.5 rounded bg-slate-50/50">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Taxable Amount:</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{Number(previewInvoice.taxable_amount || previewInvoice.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {Number(previewInvoice.cgst_amount) > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>CGST:</span>
                        <span className="font-mono font-bold text-slate-800">
                          + ₹{Number(previewInvoice.cgst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {Number(previewInvoice.sgst_amount) > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>SGST:</span>
                        <span className="font-mono font-bold text-slate-800">
                          + ₹{Number(previewInvoice.sgst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {Number(previewInvoice.igst_amount) > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>IGST:</span>
                        <span className="font-mono font-bold text-slate-800">
                          + ₹{Number(previewInvoice.igst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-slate-300 flex justify-between font-black text-sm text-slate-950">
                      <span>Grand Total:</span>
                      <span className="font-mono text-blue-700">
                        ₹{Number(previewInvoice.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="grid grid-cols-2 gap-4 pt-6 text-[10px] border-t border-slate-300">
                  <div>
                    <p className="font-bold uppercase text-slate-600">Terms & Conditions:</p>
                    <p className="text-slate-500 text-[9px] mt-0.5">
                      1. Goods once sold will not be taken back.<br />
                      2. Interest @ 18% p.a. will be charged if payment is not made on due date.<br />
                      3. Subject to Surat Jurisdiction only.
                    </p>
                  </div>
                  <div className="text-right flex flex-col justify-between">
                    <p className="font-bold uppercase text-slate-800">
                      For, {companySettings.company_name || companySettings.brand_name || "OM SAI ENTERPRISE"}
                    </p>
                    <p className="font-extrabold uppercase text-slate-700 pt-8">Authorised Signatory</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
