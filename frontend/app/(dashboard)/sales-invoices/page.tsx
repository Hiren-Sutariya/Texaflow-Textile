"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { getTenantItem, setTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { calculateDueDate, getDueStatus, parseAnyDate } from "@/lib/creditTerms";
import { getStoredCompanySettings, fetchLiveCompanySettings, CompanySettings, getFieldLabel, getDefaultBillFormat } from "@/lib/companySettings";
import InvoiceTemplateRenderer, { InvoiceRenderData } from "@/components/invoice/InvoiceTemplateRenderer";
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
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isGujarati ? "ઇન્વોઇસ નં, ગ્રાહક, જીએસટી નં શોધો..." : "Search by invoice no, customer, GSTIN..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filters and CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
          {/* Status Segment Filter */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200 overflow-x-auto no-scrollbar shrink-0">
            {(["All", "Pending", "Paid", "Overdue"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
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

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            {/* Customer filter dropdown */}
            {customerOptions.length > 0 && (
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full sm:w-auto h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">{isGujarati ? "બધા ગ્રાહક" : "All Customers"}</option>
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
              className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-xs shrink-0"
              title={isGujarati ? "ચલણ વગર સીધું પાકું જીએસટી બિલ બનાવો" : "Create direct sales tax invoice"}
            >
              <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span className="truncate">{isGujarati ? "નવું બિલ" : "New Invoice"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. DESKTOP SALES INVOICE DATA TABLE (Visible on md screens and up) */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
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

      {/* MOBILE CARD VIEW (Visible below md screens) */}
      <div className="block md:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400 font-medium shadow-2xs">
            {isGujarati ? "કોઈ સેલ્સ ઇન્વોઇસ મળ્યા નથી." : "No sales invoices found."}
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const firstItem = inv.items?.[0];
            const extraItemsCount = (inv.items?.length || 0) - 1;
            const categoryName = firstItem?.description || inv.category || "-";
            const qtyVal = inv.total_meters || inv.total_quantity || firstItem?.quantity || "-";
            const isPaid = inv.payment_status === "Paid";
            const dueInfo = getInvoiceDueInfo(inv);

            return (
              <div
                key={inv.id}
                onClick={() => setPreviewInvoice(inv)}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5 cursor-pointer hover:border-blue-300 transition-all active:scale-[0.99]"
              >
                {/* Header: Invoice No, Date & Status */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {inv.invoice_no}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">{inv.date}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePayment(inv);
                    }}
                    className="cursor-pointer"
                  >
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isPaid
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span>{isPaid ? t("Paid") : t("Pending")}</span>
                    </span>
                  </button>
                </div>

                {/* Party Name & Description */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/ledger?party=${encodeURIComponent(inv.customer_name)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-black text-slate-900 text-sm hover:text-blue-600 truncate block"
                    >
                      {inv.customer_name}
                    </Link>
                    <div className="text-xs text-slate-600 font-medium mt-0.5 truncate flex items-center gap-1">
                      <span>{categoryName}</span>
                      {extraItemsCount > 0 && (
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1 rounded">+{extraItemsCount}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-slate-900 text-base">
                      ₹{Number(inv.total_amount || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                </div>

                {/* Metric Summary */}
                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">{t("QTY")}</span>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {qtyVal !== "-" && Number(qtyVal) > 0 ? `${Number(qtyVal).toFixed(1)}m` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">{isGujarati ? "કરપાત્ર" : "TAXABLE"}</span>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      ₹{Number(inv.taxable_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">{isGujarati ? "જીએસટી" : "GST"}</span>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      ₹{(Number(inv.cgst_amount || 0) + Number(inv.sgst_amount || 0) + Number(inv.igst_amount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Due Date & Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="text-[11px] font-mono font-bold">
                    {dueInfo.isPaid ? (
                      <span className="text-emerald-700 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{t("Settled")}</span>
                      </span>
                    ) : dueInfo.isOverdue ? (
                      <span className="text-rose-600 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>{dueInfo.text}</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{dueInfo.text}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewInvoice(inv)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      title={isGujarati ? "બિલ જુઓ અને પ્રિન્ટ કરો" : "View & Print Invoice"}
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(inv)}
                      className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      href={`/sales-invoices/new?id=${inv.id}`}
                      className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      title={t("Edit")}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteInvoice(inv.id, inv.invoice_no)}
                      className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                      title={t("Delete")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. A4 FULL-FIDELITY PRINT & PREVIEW MODAL */}
      {previewInvoice && (() => {
        const salesInvoiceRenderData: InvoiceRenderData = {
          invoice_no: previewInvoice.invoice_no,
          date: previewInvoice.date,
          invoice_type: "TAX INVOICE",
          copy_type: "ORIGINAL",
          customer_name: previewInvoice.customer_name,
          customer_address: previewInvoice.customer_address,
          customer_phone: (previewInvoice as any).customer_phone,
          customer_gstin: previewInvoice.customer_gstin,
          customer_state: (previewInvoice as any).customer_state || "Gujarat",
          customer_state_code: (previewInvoice as any).customer_state_code || "24",
          credit_days: previewInvoice.credit_days,
          due_date: previewInvoice.due_date,
          items: (previewInvoice.items && previewInvoice.items.length > 0 ? previewInvoice.items : [
            {
              description: previewInvoice.category || "Textile Fabric",
              hsn_code: "5407",
              quantity: previewInvoice.total_meters || previewInvoice.total_quantity || "-",
              weight: previewInvoice.total_weight || "-",
              kg: (previewInvoice as any).total_kg || "-",
              rate: (previewInvoice as any).rate || "-",
              amount: previewInvoice.total_amount
            }
          ]).map((it: any, idx: number) => ({
            sr: idx + 1,
            description: it.description || it.item_name || "Textile Fabric",
            design_no: it.design_no,
            hsn: it.hsn_code || "5407",
            taka: it.takka || it.taka,
            meters: it.meters || it.quantity,
            weight: it.weight,
            kg: it.kg,
            cartoon: it.cartoon,
            rate: it.rate || "-",
            amount: Number(it.amount || 0)
          })),
          taxable_amount: previewInvoice.taxable_amount || previewInvoice.subtotal || previewInvoice.total_amount,
          cgst_amount: previewInvoice.cgst_amount,
          sgst_amount: previewInvoice.sgst_amount,
          igst_amount: previewInvoice.igst_amount,
          total_gst_amount: (previewInvoice as any).total_gst_amount,
          round_off: previewInvoice.round_off,
          total_amount: previewInvoice.total_amount,
          notes: previewInvoice.notes
        };

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static"
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.82)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)"
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewInvoice(null);
            }}
          >
            <style>{`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 6mm;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                  width: 100% !important;
                }
                body * {
                  visibility: hidden !important;
                }
                #printable-sales-invoice, #printable-sales-invoice * {
                  visibility: visible !important;
                }
                #printable-sales-invoice {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  border: none !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: white !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>

            {/* FLOATING ACTION BUTTONS */}
            <div className="fixed top-4 right-4 flex items-center gap-2 z-50 no-print flex-wrap justify-end">
              <button
                type="button"
                onClick={() => previewInvoice && handleShareWhatsApp(previewInvoice)}
                className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full shadow-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs"
                title="WhatsApp પર શેર કરો"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Share</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs"
                title={isGujarati ? "પ્રિન્ટ કરો (A4)" : "Print (A4)"}
              >
                <Printer className="w-4 h-4" />
                <span>{isGujarati ? "પ્રિન્ટ કરો (A4)" : "Print (A4)"}</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewInvoice(null)}
                className="p-2 bg-slate-800/90 hover:bg-slate-900 text-white rounded-full shadow-xl transition-all cursor-pointer active:scale-95"
                title={t("Close")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center max-w-[840px] w-full my-auto space-y-3">
              {/* THE WHITE INVOICE SHEET (MATCHING SALES CHALLAN MODAL 100%) */}
              <div
                id="printable-sales-invoice"
                className="w-full bg-white p-2 sm:p-6 rounded-sm shadow-2xl text-black font-sans select-text text-left"
              >
                <InvoiceTemplateRenderer
                  templateId={companySettings.bill_format || getDefaultBillFormat() || "standard"}
                  data={salesInvoiceRenderData}
                  settings={companySettings}
                  showQr={companySettings.print_qr}
                />
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
