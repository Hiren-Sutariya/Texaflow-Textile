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

      {/* 3. SALES INVOICE DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
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

        return (
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
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
              {/* WHITE A4 INVOICE SHEET (A4 PROPORTION 210mm x 297mm) */}
              <div
                id="printable-tax-invoice"
                className="w-full max-w-[794px] min-h-[1050px] bg-white p-4 sm:p-7 rounded-sm shadow-2xl text-black font-sans select-text text-left"
              >
                {/* INNER BORDERED TAX INVOICE BOX */}
                {/* INNER BORDERED TAX INVOICE BOX */}
                <div className="w-full border-2 border-black bg-white">
                  {/* 1. TOP HEADER GREY BOX (COMPANY NAME - SERIF FONT MATCHING IMAGE 1) */}
                  <div className="bg-[#d9d9d9] border-b border-black py-2.5 text-center">
                    <h1 className="font-serif font-black text-2xl sm:text-3xl tracking-wide text-black uppercase">
                      {companySettings.brand_name || companySettings.company_name || "OM SAI ENTERPRISE"}
                    </h1>
                  </div>

                  {/* 2. COMPANY ADDRESS, PHONE & GST */}
                  <div className="py-1 px-3 text-center border-b border-black text-[11px] font-semibold text-black uppercase tracking-wider">
                    {companyAddressDisplay}
                    {companySettings.phone ? ` | MO: ${companySettings.phone}` : ""}
                  </div>

                  {/* 3. SUBHEADER STRIP (DEBIT MEMO | TAX INVOICE | ORIGINAL MATCHING IMAGE 1) */}
                  <div className="grid grid-cols-3 items-center py-1.5 px-3 border-b border-black text-xs font-bold text-black bg-white">
                    <div>Debit Memo</div>
                    <div className="text-center font-black text-sm uppercase tracking-wider">TAX INVOICE</div>
                    <div className="text-right">Original</div>
                  </div>

                  {/* 4. BUYER DETAILS (LEFT) & INVOICE DETAILS (RIGHT) - 300px RIGHT BOX CONNECTS DIRECTLY WITH QTY COLUMN */}
                  <div className="flex border-b border-black text-black">
                    {/* Left: Buyer Details (Compact fit, aligned with SrNo, Product Name, and HSN/SAC columns) */}
                    <div className="flex-1 p-2 px-3 border-r border-black flex flex-col justify-between text-xs">
                      <div>
                        <div className="flex items-start text-xs font-bold text-black">
                          <span className="w-14 shrink-0 font-bold">M/s. :</span>
                          <div className="flex-1">
                            <div className="font-black text-sm uppercase tracking-wide">
                              {previewInvoice.customer_name}
                            </div>
                            {previewInvoice.customer_address ? (
                              <div className="text-[11px] font-semibold text-black leading-tight mt-0.5 whitespace-pre-line">
                                {previewInvoice.customer_address}
                              </div>
                            ) : (
                              <div className="text-[11px] font-semibold text-black leading-tight mt-0.5">
                                SURAT, GUJARAT
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-xs space-y-0.5 pt-1.5">
                          <div className="flex items-center">
                            <span className="font-bold text-black text-[11px] w-28">Place of Supply</span>
                            <span className="w-3 font-bold text-[11px]">:</span>
                            <span className="font-bold text-black text-[11px]">{previewInvoice.place_of_supply || "24-Gujarat"}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-bold text-black text-[11px] w-28">GSTIN No.</span>
                            <span className="w-3 font-bold text-[11px]">:</span>
                            <span className="font-mono font-black text-black text-[11px]">{previewInvoice.customer_gstin || "URP (Unregistered)"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Invoice Details Box (Exact 320px to match Qty(75px) + Rate(100px) + GST %(58px) + Amount(87px)) */}
                    <div className="w-[320px] flex flex-col text-xs font-bold bg-white">
                      {/* Box 1 (Top): Light Grey Box for Invoice No. & Date */}
                      <div className="bg-[#e5e7eb] border-b border-black py-1.5 px-3 space-y-1">
                        <div className="flex items-center text-xs">
                          <span className="w-24 text-black font-bold">Invoice No.</span>
                          <span className="w-3 font-bold">:</span>
                          <span className="font-mono font-black text-sm">{previewInvoice.invoice_no}</span>
                        </div>
                        <div className="flex items-center text-xs">
                          <span className="w-24 text-black font-bold">Date</span>
                          <span className="w-3 font-bold">:</span>
                          <span className="font-mono font-bold text-xs">{previewInvoice.date}</span>
                        </div>
                      </div>

                      {/* Box 2 (Bottom): White Box for Period / Extra Info */}
                      <div className="bg-white py-1.5 px-3 flex-1 flex flex-col justify-center min-h-[28px]">
                        {(periodFrom || periodTo) ? (
                          <div className="flex items-center text-xs">
                            <span className="w-24 text-black font-bold">Period</span>
                            <span className="w-3 font-bold">:</span>
                            <span className="font-mono font-medium text-xs">
                              {periodFrom} to {periodTo}
                            </span>
                          </div>
                        ) : (
                          <div className="h-3.5"></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 5. UNIFIED ITEMS & FINANCIAL TABLE (MATCHING REFERENCE IMAGE 1 EXACTLY) */}
                  <div className="w-full">
                    <table className="w-full text-left text-xs border-collapse text-black table-fixed">
                      <thead>
                        {/* COLUMN HEADERS: SrNo, Product Name, HSN | Qty, Rate, GST %, Amount */}
                        <tr className="border-b border-black text-xs font-bold text-black bg-white">
                          <th className="py-1 px-1 text-center w-[40px] border-r border-black">SrNo</th>
                          <th className="py-1 px-3 border-r border-black">
                            {getFieldLabel(companySettings, "sales_item", "Product Name")}
                          </th>
                          <th className="py-1 px-1 text-center w-[54px] border-r border-black">HSN</th>
                          <th className="py-1 px-1 text-right w-[75px] border-r border-black pr-3">
                            {getFieldLabel(companySettings, "sales_qty", "Qty")}
                          </th>
                          <th className="py-1 px-1 text-right w-[100px] border-r border-black pr-3">
                            {getFieldLabel(companySettings, "sales_rate", "Rate")}
                          </th>
                          <th className="py-1 px-1 text-center w-[58px] border-r border-black whitespace-nowrap">GST %</th>
                          <th className="py-1 px-2 text-right w-[87px] pr-3">
                            {getFieldLabel(companySettings, "sales_total", "Amount")}
                          </th>
                        </tr>
                      </thead>

                      <tbody className="text-xs font-medium text-black">
                        {statementRows.map((row, idx) => {
                          const displayProductName = row.design_no
                            ? (row.description && !row.description.includes(row.design_no)
                                ? `${row.description} [DESIGN NO-${row.design_no}]`
                                : row.description || `DESIGN NO-${row.design_no}`)
                            : (row.description || "Textile Goods");

                          const qtyFormatted = typeof row.quantity === "number"
                            ? row.quantity.toFixed(3)
                            : (!isNaN(Number(row.quantity)) && row.quantity !== "-"
                                ? Number(row.quantity).toFixed(3)
                                : row.quantity);

                          return (
                            <tr key={idx} className="h-6">
                              <td className="py-1 px-1 text-center border-r border-black font-mono">
                                {idx + 1}
                              </td>
                              <td className="py-1 px-3 border-r border-black font-bold uppercase">
                                {displayProductName}
                              </td>
                              <td className="py-1 px-1 text-center font-mono border-r border-black">
                                {row.hsn_code || companySettings.hsn_sac_code || "5407"}
                              </td>
                              <td className="py-1 px-1 text-right font-mono border-r border-black pr-3">
                                {qtyFormatted}
                              </td>
                              <td className="py-1 px-1 text-right font-mono border-r border-black pr-3">
                                {row.rate}
                              </td>
                              <td className="py-1 px-1 text-center font-mono border-r border-black">
                                {gstRate.toFixed(2)}
                              </td>
                              <td className="py-1 px-2 text-right font-mono font-bold pr-3">
                                {row.amount > 0 ? (row.amount >= 1000000 ? row.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : row.amount.toFixed(2)) : "-"}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Tall Spacer row with vertical column lines connecting seamlessly to the bottom */}
                        <tr className="h-80 sm:h-96">
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td></td>
                        </tr>
                      </tbody>

                      {/* 6. BOTTOM FINANCIAL, BANK & TERMS GRID - EXACT MATCH TO IMAGE 2 & 4 */}
                      <tfoot>
                        {/* ROW 1: Grey Header Strip (GSTIN No. & Bank on Left, Sub Total on Right) */}
                        <tr className="border-t border-black bg-[#e5e7eb] text-black">
                          <td colSpan={4} className="py-1 px-3 border-r border-black font-bold text-xs">
                            <div className="flex items-center justify-between">
                              <div>
                                <span>GSTIN No.: </span>
                                <span className="font-mono font-extrabold">{companySettings.gstin || "24BTYPS5349N1ZI"}</span>
                              </div>
                              {companySettings.bank_name && (
                                <div className="text-[11px] font-semibold text-gray-700">
                                  <span>Bank: {companySettings.bank_name}</span>
                                  {companySettings.account_no && <span className="ml-2 font-mono">A/c: {companySettings.account_no}</span>}
                                  {companySettings.ifsc && <span className="ml-2 font-mono">IFSC: {companySettings.ifsc}</span>}
                                </div>
                              )}
                            </div>
                          </td>
                          <td colSpan={3} className="py-1 px-3 text-xs font-bold">
                            <div className="flex justify-between items-center pr-1">
                              <span>Sub Total</span>
                              <span className="font-mono font-extrabold text-sm">
                                {subTotal.toFixed(2)}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* ROW 2: Words on Left | Taxable Amount & GST Calculations on Right (Matching Image 2) */}
                        <tr className="border-t border-black bg-white text-black">
                          {/* Left: Total GST & Bill Amount in words (Directly opposite to Calculations) */}
                          <td colSpan={4} className="p-2.5 px-3 border-r border-black align-top bg-white">
                            <div className="text-xs space-y-2 pt-1">
                              <div className="flex items-start gap-1">
                                <span className="font-bold whitespace-nowrap w-24 text-black text-xs">Total GST :</span>
                                <span className="italic font-medium leading-tight text-[11px] text-black">
                                  {totalGstInWords}
                                </span>
                              </div>
                              <div className="flex items-start gap-1">
                                <span className="font-bold whitespace-nowrap w-24 text-black text-xs">Bill Amount :</span>
                                <span className="italic font-medium leading-tight text-[11px] text-black">
                                  {finalTotalInWords}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Right: Calculations (Taxable Amount, CGST, SGST, Round Off matching Image 2 perfectly) */}
                          <td colSpan={3} className="p-2.5 px-3 align-top bg-white">
                            <div className="flex flex-col justify-between text-xs min-h-[115px]">
                              {/* Top Part: Discount (with gap below, exactly as in Image 2) */}
                              <div>
                                {discountAmount > 0 ? (
                                  <div className="flex items-center justify-between text-black font-medium">
                                    <span className="w-24 shrink-0 font-medium">Discount</span>
                                    <span className="font-mono text-center flex-1">{discountRate.toFixed(2)}%</span>
                                    <span className="font-mono text-right w-24 shrink-0 pr-1">{discountAmount.toFixed(2)}</span>
                                  </div>
                                ) : (
                                  <div className="h-3.5"></div>
                                )}
                              </div>

                              {/* Bottom Part: Taxable Amount, CGST, SGST, Round Off */}
                              <div className="space-y-1.5 pt-2">
                                {/* Taxable Amount Row */}
                                <div className="flex items-center justify-between text-black font-bold">
                                  <span className="w-28 shrink-0 font-bold">Taxable Amount</span>
                                  <span className="flex-1"></span>
                                  <span className="font-mono font-bold text-right w-24 shrink-0 pr-1">{taxableAmount.toFixed(2)}</span>
                                </div>

                                {/* CGST / SGST or IGST Rows */}
                                {igstAmount > 0 ? (
                                  <div className="flex items-center justify-between text-black font-medium">
                                    <span className="w-24 shrink-0">IGST</span>
                                    <span className="font-mono text-center flex-1">{gstRate.toFixed(2)}%</span>
                                    <span className="font-mono text-right w-24 shrink-0 pr-1">{igstAmount.toFixed(2)}</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between text-black font-medium">
                                      <span className="w-24 shrink-0">CGST</span>
                                      <span className="font-mono text-center flex-1">{cgstRate.toFixed(2)}%</span>
                                      <span className="font-mono text-right w-24 shrink-0 pr-1">{cgstAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-black font-medium">
                                      <span className="w-24 shrink-0">SGST</span>
                                      <span className="font-mono text-center flex-1">{sgstRate.toFixed(2)}%</span>
                                      <span className="font-mono text-right w-24 shrink-0 pr-1">{sgstAmount.toFixed(2)}</span>
                                    </div>
                                  </>
                                )}

                                {/* Round Off Row */}
                                <div className="flex items-center justify-between text-black font-medium">
                                  <span className="w-24 shrink-0">Round Off</span>
                                  <span className="flex-1"></span>
                                  <span className="font-mono text-right w-24 shrink-0 pr-1">{roundOff >= 0 ? roundOff.toFixed(2) : roundOff.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* ROW 3: Note on Left | Grand Total on Right (Matching Image 2) */}
                        <tr className="border-t border-black text-black">
                          {/* Left: Note Row directly opposite to Grand Total */}
                          <td colSpan={4} className="py-2 px-3 border-r border-black align-middle bg-white text-xs">
                            <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                              <span className="font-bold shrink-0 text-black">Note :</span>
                              <span className="font-medium text-black truncate">
                                {previewInvoice.notes || (linkedNos.length > 0 ? `Consolidated Tax Invoice against Sales Challans: ${linkedNos.join(", ")}` : "")}
                              </span>
                            </div>
                          </td>

                          {/* Right: Grand Total (Grey background) */}
                          <td colSpan={3} className="p-2.5 px-3 align-middle bg-[#e5e7eb] font-black">
                            <div className="flex justify-between items-center text-black pr-1">
                              <span className="text-sm font-black">Grand Total</span>
                              <span className="font-mono text-base font-black">
                                {finalTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* ROW 4: Terms & Conditions (Left) | Authorized Signatory (Right) */}
                        <tr className="border-t border-black bg-white text-black">
                          {/* Left: Terms & Condition */}
                          <td colSpan={4} className="p-2.5 px-3 border-r border-black align-top">
                            <div className="text-xs space-y-0.5">
                              <div className="font-bold text-black pb-0.5">Terms & Condition :</div>
                              <div className="text-[10px] italic text-black leading-snug">
                                <div>1. Goods once sold will not be taken back.</div>
                                <div>2. Interest @18% p.a. will be charged if payment is not made within due date.</div>
                                <div>3. Our risk and responsibility ceases as soon as the goods leave our premises.</div>
                                <div>4. "Subject to 'SURAT' Jurisdiction only. E.&.O.E"</div>
                              </div>
                            </div>
                          </td>

                          {/* Right: Authorised Signatory */}
                          <td colSpan={3} className="p-2.5 px-3 text-right align-top">
                            <div className="flex flex-col justify-between items-end h-full min-h-[90px]">
                              <div className="font-medium text-xs text-black">
                                For, {companySettings.brand_name || companySettings.company_name || "OM SAI ENTERPRISE"}
                              </div>
                              <div className="font-medium text-[11px] text-black italic">
                                (Authorised Signatory)
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
