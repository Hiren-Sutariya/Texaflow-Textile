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
  AlertCircle
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

export default function InvoicesPage() {
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
        const q = search.toLowerCase();
        const matchesSearch =
          (inv.invoice_no && inv.invoice_no.toLowerCase().includes(q)) ||
          (inv.customer_name && inv.customer_name.toLowerCase().includes(q)) ||
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
    let taxable = 0;
    let totalAmount = 0;

    filteredInvoices.forEach((inv) => {
      const t = inv.total_takka ?? inv.total_item ?? (
        Array.isArray(inv.items) && inv.items.length > 0
          ? inv.items.reduce((acc, it) => acc + (Number(it.takka ?? it.item_qty ?? it.total_takka) || 0), 0)
          : 0
      );
      const m = inv.total_meters ?? inv.total_quantity ?? (
        Array.isArray(inv.items) && inv.items.length > 0
          ? inv.items.reduce((acc, it) => acc + (Number(it.quantity ?? it.meters ?? it.total_meters) || 0), 0)
          : 0
      );
      takka += Number(t) || 0;
      meters += Number(m) || 0;
      taxable += Number(inv.taxable_amount || inv.subtotal) || 0;
      totalAmount += Number(inv.total_amount) || 0;
    });

    return { takka, meters, taxable, totalAmount };
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
    if (confirm(isGujarati ? `શું તમે ઇન્વોઇસ ${invNo} ડિલીટ કરવા માંગો છો? આનાથી જોડાયેલા સેલ્સ ચલણ ફરીથી અન-બિલ થઈ જશે.` : `Delete Invoice ${invNo}? Linked delivery challans will revert to Unbilled.`)) {
      deleteSalesInvoice(id);
      loadData();
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* 1. TOP HEADER & KPI CARDS (EXACT SAME SIZE & STYLE AS SALES PAGE) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* CARD 1: TOTAL INVOICED */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {isGujarati ? "કુલ વેચાણ બિલ" : "TOTAL INVOICED"}
            </p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              ₹{Math.round(metrics.totalInvoiced).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 2: PENDING CREDIT */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider truncate">
              {isGujarati ? "બાકી રકમ" : "PENDING CREDIT"}
            </p>
            <p className="text-xl font-black text-amber-600 mt-0.5">
              ₹{Math.round(metrics.pendingAmount).toLocaleString("en-IN")}
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
              {isGujarati ? "મુદત વીતી ગયેલ" : "OVERDUE BILLS"}
            </p>
            <p className={`text-xl font-black ${metrics.overdueCount > 0 ? "text-rose-600" : "text-slate-900"} mt-0.5`}>
              {metrics.overdueCount}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 4: PAID / SETTLED */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider truncate">
              {isGujarati ? "ચુકતે બિલ" : "PAID / SETTLED"}
            </p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">
              {salesInvoices.filter((i) => i.payment_status === "Paid").length}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isGujarati ? "ઇન્વોઇસ નં, ગ્રાહક કે ચલણ શોધો..." : "Search invoice no, customer, challan..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status Filters & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
            {(["All", "Pending", "Paid", "Overdue"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st === "All" && (isGujarati ? "બધા" : "All")}
                {st === "Pending" && (isGujarati ? "બાકી" : "Pending")}
                {st === "Paid" && (isGujarati ? "ચુકતે" : "Paid")}
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

          {/* Action: Generate Sales Invoice from Challans */}
          <Link
            href="/invoices/generate"
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 text-xs shrink-0"
            title={isGujarati ? "મોકલેલા ચલણોમાંથી ભેગું પાકું બિલ બનાવો" : "Generate invoice from sales challans"}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>From Challans</span>
          </Link>
        </div>
      </div>

      {/* 3. DESKTOP SALES INVOICE DATA TABLE (Visible on md: and up) */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[1180px]">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-200/80 w-[90px]">{t("DATE")}</th>
                <th className="py-2.5 px-3 border-r border-slate-200/80 w-[110px]">{t("INVOICE NO")}</th>
                <th className="py-2.5 px-3 border-r border-slate-200/80 min-w-[170px]">{t("PARTY NAME")}</th>
                <th className="py-2.5 px-2 border-r border-slate-200/80 text-center w-[75px]">{t("ITEM")}</th>
                <th className="py-2.5 px-3 border-r border-slate-200/80 text-right w-[95px]">{t("QTY")}</th>
                <th className="py-2.5 px-3 border-r border-slate-200/80 text-right w-[115px]">{t("TAXABLE (₹)")}</th>
                <th className="py-2.5 px-3 border-r border-slate-200/80 text-right w-[110px]">{t("GST (₹)")}</th>
                <th className="py-2.5 px-3 border-r border-slate-200/80 text-right w-[120px]">{t("AMOUNT (₹)")}</th>
                <th className="py-2.5 px-3 border-r border-slate-200/80 text-center w-[110px]">{t("DUE (DAYS)")}</th>
                <th className="py-2.5 px-3 border-r border-slate-200/80 text-center w-[90px]">{t("STATUS")}</th>
                <th className="py-2.5 px-2 text-center w-[75px]">{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                    <p className="text-sm font-bold text-slate-600">{isGujarati ? "કોઈ સેલ્સ પાકા બિલ મળ્યા નથી" : "No Sales Invoices Found"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isGujarati
                        ? "ગ્રાહકના સેલ્સ ચલણમાંથી માસિક પાકું બિલ બનાવવા '+ નવું સેલ્સ પાકું બિલ' ક્લિક કરો"
                        : "Click '+ Generate Sales Invoice' to create monthly GST bills from delivery challans"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.payment_status === "Paid";
                  const dueDate = inv.due_date || (inv.credit_days ? calculateDueDate(inv.date, inv.credit_days) : inv.date);
                  const dueInfo = dueDate ? getDueStatus(dueDate, isPaid) : null;

                  const takkaVal = inv.total_takka ?? inv.total_item ?? (
                    Array.isArray(inv.items) && inv.items.length > 0
                      ? inv.items.reduce((acc, it) => acc + (Number(it.takka ?? it.item_qty ?? it.total_takka) || 0), 0)
                      : 0
                  );
                  const metersVal = inv.total_meters ?? inv.total_quantity ?? (
                    Array.isArray(inv.items) && inv.items.length > 0
                      ? inv.items.reduce((acc, it) => acc + (Number(it.quantity ?? it.meters ?? it.total_meters) || 0), 0)
                      : 0
                  );

                  const taxableVal = Number(inv.taxable_amount || inv.subtotal || 0);
                  const storedTax = (Number(inv.cgst_amount) || 0) + (Number(inv.sgst_amount) || 0) + (Number(inv.igst_amount) || 0);
                  const gstRateVal = Number(inv.gst_rate || 0);
                  const gstAmountVal = storedTax > 0 ? storedTax : Number((taxableVal * gstRateVal) / 100);

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setPreviewInvoice(inv)}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    >
                      {/* DATE */}
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap border-r border-slate-200/70">
                        {inv.date}
                      </td>

                      {/* INVOICE NO */}
                      <td className="py-2.5 px-3 font-mono font-black text-blue-700 whitespace-nowrap border-r border-slate-200/70">
                        {inv.invoice_no}
                      </td>

                      {/* CUSTOMER */}
                      <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200/70">
                        <Link
                          href={`/ledger?party=${encodeURIComponent(inv.customer_name)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="truncate max-w-[200px] block hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                          title={`View Ledger for ${inv.customer_name}`}
                        >
                          {inv.customer_name}
                        </Link>
                        {inv.customer_gstin && (
                          <div className="text-[10px] font-mono text-slate-400 font-semibold truncate">
                            {inv.customer_gstin}
                          </div>
                        )}
                      </td>

                      {/* ITEM / TAKKA */}
                      <td className="py-2 px-1 text-center font-mono font-bold text-slate-800 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {takkaVal > 0 ? takkaVal : <span className="text-slate-400">-</span>}
                      </td>

                      {/* QUANTITY (METERS) */}
                      <td className="py-2 px-2 text-right font-mono font-bold text-slate-800 border-r border-slate-200/70 whitespace-nowrap text-xs">
                        {metersVal > 0 ? `${Number(metersVal).toFixed(1)}m` : <span className="text-slate-400">-</span>}
                      </td>

                      {/* TAXABLE (SEPARATE FIELD) */}
                      <td className="py-2 px-2 border-r border-slate-200/70 text-right font-mono font-bold text-slate-800 whitespace-nowrap text-xs">
                        ₹{taxableVal.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </td>

                      {/* GST (SEPARATE FIELD) */}
                      <td className="py-2 px-2 border-r border-slate-200/70 text-right font-mono whitespace-nowrap text-xs">
                        {gstAmountVal > 0 ? (
                          <div>
                            <span className="font-bold text-slate-800">
                              ₹{gstAmountVal.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold ml-1">
                              ({gstRateVal}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-semibold">0% (₹0)</span>
                        )}
                      </td>

                      {/* TOTAL AMOUNT */}
                      <td className="py-2 px-2 border-r border-slate-200/70 text-right font-mono font-black text-slate-950 whitespace-nowrap text-xs">
                        ₹{Number(inv.total_amount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2
                        })}
                      </td>

                      {/* DUE ALERTS (NO RAW DATE) */}
                      <td className="py-2 px-1 text-center align-middle whitespace-nowrap border-r border-slate-200/70">
                        {dueInfo ? (
                          isPaid ? (
                            <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1 justify-center">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{isGujarati ? "ચૂકતે" : "Settled"}</span>
                            </span>
                          ) : dueInfo.status === "Overdue" ? (
                            <span className="font-mono text-xs font-bold text-rose-600 inline-flex items-center gap-1 justify-center">
                              <Clock className="w-3 h-3 text-rose-600" />
                              <span>{isGujarati ? dueInfo.labelGu : dueInfo.label}</span>
                            </span>
                          ) : (
                            <span className="font-mono text-xs font-bold text-amber-700 inline-flex items-center gap-1 justify-center">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{isGujarati ? dueInfo.labelGu : dueInfo.label}</span>
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="py-2 px-1 text-center align-middle whitespace-nowrap border-r border-slate-200/70" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleTogglePayment(inv)}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>{t("Paid")}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>{t("Pending")}</span>
                            </span>
                          )}
                        </button>
                      </td>

                      {/* ACTION */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewInvoice(inv)}
                            title={isGujarati ? "માસિક બિલ જુઓ અને પ્રિન્ટ કરો" : "View & Print Monthly Invoice"}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInvoice(inv.id, inv.invoice_no)}
                            title={isGujarati ? "બિલ ડિલીટ કરો" : "Delete Invoice"}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
                <tr className="h-11">
                  <td colSpan={7} className="py-2.5 px-3 border-r border-slate-200/80 bg-slate-50/90 text-right">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                        <span>{filteredInvoices.length}</span>
                        <span>{isGujarati ? "કુલ પાકા બિલ (Invoices)" : "Total Invoices"}</span>
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                        {isGujarati ? "કુલ રકમ (TOTAL AMOUNT)" : "TOTAL AMOUNT"}:
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-blue-700 border-r border-slate-200/80">
                    ₹{Math.round(tableTotals.totalAmount).toLocaleString("en-IN")}
                  </td>
                  <td colSpan={3} className="py-2.5 px-3 bg-slate-50/90"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MOBILE INVOICE CARDS (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400 font-medium shadow-2xs">
            {isGujarati ? "કોઈ સેલ્સ પાકા બિલ મળ્યા નથી." : "No sales invoices found."}
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const isPaid = inv.payment_status === "Paid";
            const dueDate = inv.due_date || (inv.credit_days ? calculateDueDate(inv.date, inv.credit_days) : inv.date);
            const dueInfo = dueDate ? getDueStatus(dueDate, isPaid) : null;

            const takkaVal = inv.total_takka ?? inv.total_item ?? (
              Array.isArray(inv.items) && inv.items.length > 0
                ? inv.items.reduce((acc, it) => acc + (Number(it.takka ?? it.item_qty ?? it.total_takka) || 0), 0)
                : 0
            );
            const metersVal = inv.total_meters ?? inv.total_quantity ?? (
              Array.isArray(inv.items) && inv.items.length > 0
                ? inv.items.reduce((acc, it) => acc + (Number(it.quantity ?? it.meters ?? it.total_meters) || 0), 0)
                : 0
            );

            const taxableVal = Number(inv.taxable_amount || inv.subtotal || 0);
            const storedTax = (Number(inv.cgst_amount) || 0) + (Number(inv.sgst_amount) || 0) + (Number(inv.igst_amount) || 0);
            const gstRateVal = Number(inv.gst_rate || 0);
            const gstAmountVal = storedTax > 0 ? storedTax : Number((taxableVal * gstRateVal) / 100);

            return (
              <div
                key={inv.id}
                onClick={() => setPreviewInvoice(inv)}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5 cursor-pointer hover:border-blue-300 transition-all active:scale-[0.99]"
              >
                {/* Header: Invoice No + Date + Status */}
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
                      <span>{isPaid ? (isGujarati ? "ચૂકતે" : "Paid") : (isGujarati ? "બાકી" : "Pending")}</span>
                    </span>
                  </button>
                </div>

                {/* Party Name */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/ledger?party=${encodeURIComponent(inv.customer_name)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-black text-slate-900 text-sm hover:text-blue-600 truncate block"
                    >
                      {inv.customer_name}
                    </Link>
                    <div className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                      {metersVal > 0 ? `${metersVal} Qty` : ""} {takkaVal > 0 ? `• ${takkaVal} Takka` : ""}
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

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">{t("TAXABLE")}</span>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      ₹{taxableVal.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">{t("GST")}</span>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      ₹{gstAmountVal.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">{isGujarati ? "કુલ રકમ" : "TOTAL"}</span>
                    <span className="font-mono text-xs font-black text-slate-900">
                      ₹{Number(inv.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Due Date & Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="text-[11px] font-mono font-bold">
                    {dueInfo ? (
                      isPaid ? (
                        <span className="text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{isGujarati ? "ચૂકતે" : "Settled"}</span>
                        </span>
                      ) : dueInfo.status === "Overdue" ? (
                        <span className="text-rose-600 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-rose-600" />
                          <span>{isGujarati ? dueInfo.labelGu : dueInfo.label}</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{isGujarati ? dueInfo.labelGu : dueInfo.label}</span>
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400">-</span>
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

      {/* 4. MONTHLY CONSOLIDATED TAX INVOICE STATEMENT (A4 REPORT STYLE) */}
      {previewInvoice && (() => {
        const termsList = (companySettings.terms_conditions && companySettings.terms_conditions.trim())
          ? companySettings.terms_conditions.split("\n").map((t: string) => t.trim()).filter(Boolean)
          : [
              "1. Goods once sold will not be taken back.",
              "2. Interest @18% p.a. will be charged if payment is not made within due date.",
              "3. Our risk and responsibility ceases as soon as the goods leave our premises.",
              "4. \"Subject to 'SURAT' Jurisdiction only. E.&O.E\""
            ];

        const companyAddressDisplay = [
          companySettings.address,
          companySettings.city_state,
          companySettings.pincode ? `PIN: ${companySettings.pincode}` : ""
        ]
          .filter(Boolean)
          .join(", ")
          .toUpperCase() || "SURAT TEXTILE MARKET, RING ROAD, SURAT, GUJARAT";

        const allSalesChallans = getStoredSalesChallans();
        const linkedNos = previewInvoice.linked_challan_nos || [];

        // Match challans from storage to extract dates & details
        const matchedChallans = linkedNos.map((no) => {
          return allSalesChallans.find((c) => String(c.challan_no).trim() === String(no).trim() || c.id === no);
        }).filter(Boolean);

        // Detect Date-to-Date Billing Period
        const allDates: string[] = [
          ...matchedChallans.map((c: any) => c.date),
          previewInvoice.date
        ].filter(Boolean);

        let periodFrom = previewInvoice.date;
        let periodTo = previewInvoice.date;

        if (allDates.length > 0) {
          const sortedDates = [...allDates].sort((a, b) => {
            const pA = a.split("-").reverse().join("-");
            const pB = b.split("-").reverse().join("-");
            return pA.localeCompare(pB);
          });
          periodFrom = sortedDates[0];
          periodTo = sortedDates[sortedDates.length - 1];
          if (periodFrom === periodTo && previewInvoice.date) {
            const parts = previewInvoice.date.split("-");
            if (parts.length === 3) {
              periodFrom = `01-${parts[1]}-${parts[2]}`;
              periodTo = previewInvoice.date;
            }
          }
        }

        // Build consolidated rows from challans or invoice items with Date and Challan No
        let statementRows: Array<{
          challan_date: string;
          challan_no: string;
          description: string;
          design_no?: string;
          hsn_code: string;
          takka: string | number;
          quantity: string | number;
          rate: string | number;
          amount: number;
        }> = [];

        if (matchedChallans.length > 0) {
          matchedChallans.forEach((ch: any) => {
            if (Array.isArray(ch.items) && ch.items.length > 0) {
              ch.items.forEach((it: any) => {
                statementRows.push({
                  challan_date: ch.date || previewInvoice.date,
                  challan_no: `#${ch.challan_no}`,
                  description: it.description || it.category || it.design_no || "Textile Fabric",
                  design_no: it.design_no,
                  hsn_code: it.hsn_code || "5407",
                  takka: it.takka ?? it.item ?? "-",
                  quantity: it.quantity ?? it.meters ?? "-",
                  rate: it.rate ? Number(it.rate).toFixed(2) : "-",
                  amount: Number(it.amount || 0)
                });
              });
            } else {
              statementRows.push({
                challan_date: ch.date || previewInvoice.date,
                challan_no: `#${ch.challan_no}`,
                description: ch.notes || "Textile Dispatches",
                hsn_code: "5407",
                takka: ch.total_item ?? ch.total_takka ?? "-",
                quantity: ch.total_quantity ?? ch.total_meters ?? "-",
                rate: ch.total_amount && ch.total_quantity ? (ch.total_amount / ch.total_quantity).toFixed(2) : "-",
                amount: Number(ch.total_amount || 0)
              });
            }
          });
        } else if (Array.isArray(previewInvoice.items) && previewInvoice.items.length > 0) {
          statementRows = previewInvoice.items.map((it: any) => ({
            challan_date: it.challan_date || previewInvoice.date,
            challan_no: it.challan_no ? (String(it.challan_no).startsWith("#") ? it.challan_no : `#${it.challan_no}`) : (linkedNos[0] ? `#${linkedNos[0]}` : "-"),
            description: it.description || it.category || it.design_no || previewInvoice.category || "Textile Goods",
            design_no: it.design_no,
            hsn_code: it.hsn_code || "5407",
            takka: it.takka ?? it.item ?? it.item_qty ?? "-",
            quantity: it.quantity ?? it.meters ?? it.total_meters ?? "-",
            rate: it.rate ? Number(it.rate).toFixed(2) : "-",
            amount: Number(it.amount || previewInvoice.subtotal)
          }));
        } else {
          statementRows = [
            {
              challan_date: previewInvoice.date,
              challan_no: linkedNos.length > 0 ? `#${linkedNos.join(", #")}` : "-",
              description: previewInvoice.items_description || previewInvoice.category || "Textile Goods",
              hsn_code: "5407",
              takka: previewInvoice.total_takka || previewInvoice.total_item || "-",
              quantity: previewInvoice.total_meters || previewInvoice.total_quantity || "-",
              rate: "-",
              amount: previewInvoice.subtotal || previewInvoice.total_amount
            }
          ];
        }

        const totalTakkaSum = statementRows.reduce((acc, r) => {
          const val = Number(r.takka);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);

        const totalMetersSum = statementRows.reduce((acc, r) => {
          const val = Number(r.quantity);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);

        const subTotal = Number(previewInvoice.subtotal || 0) || Number(previewInvoice.taxable_amount || 0) || Number(previewInvoice.total_amount || 0);
        const discountRate = Number(previewInvoice.discount_rate || 0);
        const discountAmount = Number(previewInvoice.discount_amount || (discountRate > 0 ? (subTotal * discountRate) / 100 : 0));
        const taxableAmount = Number(previewInvoice.taxable_amount || (subTotal - discountAmount) || subTotal || 0);
        const gstRate = Number(previewInvoice.gst_rate || 5);
        const cgstRate = gstRate / 2;
        const sgstRate = gstRate / 2;
        const cgstAmount = Number(previewInvoice.cgst_amount) || Number(((taxableAmount * cgstRate) / 100).toFixed(2));
        const sgstAmount = Number(previewInvoice.sgst_amount) || Number(((taxableAmount * sgstRate) / 100).toFixed(2));
        const igstAmount = Number(previewInvoice.igst_amount) || 0;
        const totalGst = igstAmount > 0 ? igstAmount : (cgstAmount + sgstAmount);
        const rawTotal = taxableAmount + totalGst;
        const roundOff = typeof previewInvoice.round_off === "number" ? Number(previewInvoice.round_off) : Number((Math.round(rawTotal) - rawTotal).toFixed(2));
        const finalTotal = Math.round(Number(previewInvoice.total_amount || (taxableAmount + totalGst + roundOff)));
        const totalGstInWords = numberToIndianWords(Math.round(totalGst));
        const finalTotalInWords = numberToIndianWords(finalTotal);

        const invoiceRenderData: InvoiceRenderData = {
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
          items: statementRows.map((r: any, idx: number) => ({
            sr: idx + 1,
            description: r.description,
            design_no: r.design_no,
            hsn: r.hsn_code || "5407",
            taka: r.takka,
            meters: r.quantity,
            rate: r.rate,
            amount: Number(r.amount || 0)
          })),
          taxable_amount: taxableAmount,
          cgst_amount: cgstAmount,
          sgst_amount: sgstAmount,
          igst_amount: igstAmount,
          total_gst_amount: totalGst,
          round_off: roundOff,
          total_amount: finalTotal,
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
                  margin: 6mm 8mm;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                  width: 100% !important;
                  height: 100% !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body * {
                  visibility: hidden !important;
                }
                #printable-tax-invoice, #printable-tax-invoice * {
                  visibility: visible !important;
                }
                #printable-tax-invoice {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  min-height: 284mm !important;
                  height: auto !important;
                  border: none !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: white !important;
                  box-sizing: border-box !important;
                  page-break-after: avoid !important;
                  page-break-inside: avoid !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>

            {/* FLOATING ACTION BUTTONS */}
            <div className="fixed top-4 right-4 flex items-center gap-2 z-50 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs"
                title={t("Print") + " / PDF"}
              >
                <Printer className="w-4 h-4" />
                <span>{t("Print")} / PDF</span>
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

            <div className="flex flex-col items-center max-w-[840px] w-full my-auto py-4 space-y-3">
              {/* WHITE INVOICE SHEET */}
              <div
                id="printable-tax-invoice"
                className="w-full max-w-[820px] bg-white p-2 sm:p-6 rounded-sm shadow-2xl text-black font-sans select-text text-left"
              >
                <InvoiceTemplateRenderer
                  templateId={companySettings.bill_format || getDefaultBillFormat() || "standard"}
                  data={invoiceRenderData}
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
