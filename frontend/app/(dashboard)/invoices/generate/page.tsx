"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { getTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { TEXTILE_CREDIT_TERMS, parseCreditDays, calculateDueDate, parseAnyDate } from "@/lib/creditTerms";
import { useLanguage } from "@/context/LanguageContext";
import {
  getStoredSalesChallans,
  getStoredSalesInvoices,
  saveSalesInvoice,
  getNextInvoiceNo,
  SalesChallan,
  SalesInvoice
} from "@/lib/salesStorage";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  Building2,
  Search,
  X,
  FileText,
  Hash,
  AlertCircle,
  Receipt,
  Layers,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  Info,
  Truck,
  Plus,
  Save,
  Users,
  CreditCard,
} from "lucide-react";

// Reusable styled CustomDatePicker matching software aesthetic
interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

function CustomDatePicker({
  value,
  onChange,
  placeholder = "DD-MM-YYYY",
  className = ""
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = useMemo(() => {
    return parseAnyDate(value) || new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState(() => initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => initialDate.getMonth());

  useEffect(() => {
    const parsed = parseAnyDate(value);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formattedDisplay = useMemo(() => {
    const parsed = parseAnyDate(value);
    if (!parsed) return "";
    const d = String(parsed.getDate()).padStart(2, "0");
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const y = parsed.getFullYear();
    return `${d}-${m}-${y}`;
  }, [value]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-xs select-none ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 bg-white border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""
        }`}
      >
        <span className={`font-mono font-bold text-xs ${formattedDisplay ? "text-slate-900" : "text-slate-400"}`}>
          {formattedDisplay || placeholder}
        </span>
        <Calendar className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
      </button>

      {isOpen && (
        <div className="absolute z-[100] right-0 sm:right-auto sm:left-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 w-64 space-y-2 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 pb-1.5 border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) {
                  setViewMonth(11);
                  setViewYear(viewYear - 1);
                } else {
                  setViewMonth(viewMonth - 1);
                }
              }}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="tracking-wide font-extrabold">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) {
                  setViewMonth(0);
                  setViewYear(viewYear + 1);
                } else {
                  setViewMonth(viewMonth + 1);
                }
              }}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-bold text-slate-400 pt-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs">
            {Array.from({ length: new Date(viewYear, viewMonth, 1).getDay() }).map((_, i) => (
              <span key={`empty-${i}`} className="h-7" />
            ))}
            {Array.from({ length: new Date(viewYear, viewMonth + 1, 0).getDate() }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${String(day).padStart(2, "0")}-${String(viewMonth + 1).padStart(2, "0")}-${viewYear}`;
              const isSelected = formattedDisplay === dateStr;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    onChange(dateStr);
                    setIsOpen(false);
                  }}
                  className={`h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer mx-auto ${
                    isSelected
                      ? "bg-blue-600 text-white font-black shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function GenerateInvoiceContent() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isGujarati = language === "gu";

  const [loading, setLoading] = useState(true);
  const [salesChallans, setSalesChallans] = useState<SalesChallan[]>([]);
  const [partiesList, setPartiesList] = useState<any[]>([]);
  const [customerNames, setCustomerNames] = useState<string[]>([]);

  // Selection states
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Period / Month filter
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const periodDropdownRef = useRef<HTMLDivElement>(null);

  const periodOptions = useMemo(() => [
    { value: "ALL", label: isGujarati ? "બધા ચલણો (All Challans)" : "All Challans" },
    { value: "THIS_MONTH", label: isGujarati ? "આ મહિનો (This Month)" : "This Month" },
    { value: "LAST_MONTH", label: isGujarati ? "ગયેલ મહિનો (Last Month)" : "Last Month" },
    { value: "CUSTOM", label: isGujarati ? "તારીખ થી તારીખ (Date to Date)" : "Date to Date / Custom Range" },
  ], [isGujarati]);

  const handleSelectPeriod = (val: string) => {
    setSelectedPeriod(val);
    setIsPeriodDropdownOpen(false);
    if (val === "CUSTOM") {
      const now = new Date();
      const dStr = String(now.getDate()).padStart(2, "0");
      const mStr = String(now.getMonth() + 1).padStart(2, "0");
      const yStr = String(now.getFullYear());
      if (!customFrom) setCustomFrom(`01-${mStr}-${yStr}`);
      if (!customTo) setCustomTo(`${dStr}-${mStr}-${yStr}`);
    }
  };

  // Challans selection
  const [selectedChallanIds, setSelectedChallanIds] = useState<string[]>([]);

  // Final Invoice details
  const [invoiceNo, setInvoiceNo] = useState("INV-0001");
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const today = new Date();
    const dStr = String(today.getDate()).padStart(2, "0");
    const mStr = String(today.getMonth() + 1).padStart(2, "0");
    return `${dStr}-${mStr}-${today.getFullYear()}`;
  });
  const [creditDays, setCreditDays] = useState<string>("30");
  const [isCreditTermsOpen, setIsCreditTermsOpen] = useState(false);
  const creditTermsRef = useRef<HTMLDivElement>(null);

  const creditTermsOptions = useMemo(() => [
    { value: "0", label: isGujarati ? "Cash (રોકડા)" : "Cash" },
    { value: "15", label: "15 Days" },
    { value: "30", label: "30 Days" },
    { value: "45", label: "45 Days" },
    { value: "60", label: "60 Days" },
    { value: "90", label: "90 Days" },
    { value: "120", label: "120 Days" },
  ], [isGujarati]);

  // GST Dropdown Options matching software pattern
  const gstOptions = useMemo(() => [
    { value: "none", label: "None (0%)", mode: "none" as const, rate: 0 },
    { value: "cgst_sgst_5", label: "CGST + SGST @ 5%", mode: "cgst_sgst" as const, rate: 5 },
    { value: "cgst_sgst_12", label: "CGST + SGST @ 12%", mode: "cgst_sgst" as const, rate: 12 },
    { value: "cgst_sgst_18", label: "CGST + SGST @ 18%", mode: "cgst_sgst" as const, rate: 18 },
    { value: "cgst_sgst_28", label: "CGST + SGST @ 28%", mode: "cgst_sgst" as const, rate: 28 },
    { value: "igst_5", label: "Only GST @ 5%", mode: "igst" as const, rate: 5 },
    { value: "igst_12", label: "Only GST @ 12%", mode: "igst" as const, rate: 12 },
    { value: "igst_18", label: "Only GST @ 18%", mode: "igst" as const, rate: 18 },
    { value: "igst_28", label: "Only GST @ 28%", mode: "igst" as const, rate: 28 },
  ], []);

  const [selectedGstOption, setSelectedGstOption] = useState<string>("cgst_sgst_5");
  const [isGstDropdownOpen, setIsGstDropdownOpen] = useState(false);
  const gstDropdownRef = useRef<HTMLDivElement>(null);

  const [taxMode, setTaxMode] = useState<"none" | "cgst_sgst" | "igst">("cgst_sgst");
  const [taxRate, setTaxRate] = useState<number>(5);
  const [paymentStatus, setPaymentStatus] = useState<"Pending" | "Paid">("Pending");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
      if (gstDropdownRef.current && !gstDropdownRef.current.contains(event.target as Node)) {
        setIsGstDropdownOpen(false);
      }
      if (creditTermsRef.current && !creditTermsRef.current.contains(event.target as Node)) {
        setIsCreditTermsOpen(false);
      }
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target as Node)) {
        setIsPeriodDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectGstOption = (opt: typeof gstOptions[0]) => {
    setSelectedGstOption(opt.value);
    setTaxMode(opt.mode);
    setTaxRate(opt.rate);
    setIsGstDropdownOpen(false);
  };

  // Load Sales Challans & Customer Parties
  const loadData = async () => {
    setLoading(true);
    const currentCid = getStoredCompanyId() || "comp-001";

    try {
      // 1. Load Parties
      try {
        const vLive = await fetchApi<any[]>("/vendors");
        if (Array.isArray(vLive)) {
          const scoped = vLive.filter((v: any) => (v.company_id || currentCid) === currentCid);
          setPartiesList(scoped);
          const names = scoped
            .map((v: any) => v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim())
            .filter(Boolean);
          setCustomerNames(Array.from(new Set(names)));
        }
      } catch {
        const saved = getTenantItem<any[]>("texaflow_vendors") || [];
        const scoped = saved.filter((v: any) => (v.company_id || currentCid) === currentCid);
        setPartiesList(scoped);
        const names = scoped
          .map((v: any) => v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim())
          .filter(Boolean);
        setCustomerNames(Array.from(new Set(names)));
      }

      // 2. Load Sales Challans
      const challans = getStoredSalesChallans();
      setSalesChallans(challans);

      // Auto-extract any party names from challans too
      const challanParties = challans.map((c) => c.party_name?.trim()).filter(Boolean);
      setCustomerNames((prev) => Array.from(new Set([...prev, ...challanParties])).sort());

      // Next invoice number
      setInvoiceNo(getNextInvoiceNo());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Find selected party info
  const selectedPartyInfo = useMemo(() => {
    if (!selectedCustomer) return null;
    const norm = selectedCustomer.toLowerCase().trim();
    return partiesList.find((p) => {
      const pName = (p.company_name || p.display_name || "").toLowerCase().trim();
      return pName === norm || pName.includes(norm) || norm.includes(pName);
    });
  }, [selectedCustomer, partiesList]);

  // Set default credit days from party if available
  useEffect(() => {
    if (selectedPartyInfo?.payment_terms) {
      const parsedDays = parseCreditDays(selectedPartyInfo.payment_terms);
      if (parsedDays > 0) {
        setCreditDays(String(parsedDays));
      }
    }
  }, [selectedPartyInfo]);

  // Filter challans for this customer (Shows ALL challans - Billed and Unbilled!)
  const customerChallans = useMemo(() => {
    if (!selectedCustomer) return [];
    const normCust = selectedCustomer.toLowerCase().trim();

    return salesChallans.filter((c) => {
      const cParty = (c.party_name || "").toLowerCase().trim();
      const partyMatch = cParty === normCust || cParty.includes(normCust) || normCust.includes(cParty);
      if (!partyMatch) return false;

      // Note: We DO NOT exclude billed challans! All challans for this customer are visible.

      // Date filtering
      if (selectedPeriod === "THIS_MONTH") {
        const d = parseAnyDate(c.date);
        if (!d) return true;
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (selectedPeriod === "LAST_MONTH") {
        const d = parseAnyDate(c.date);
        if (!d) return true;
        const now = new Date();
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      }
      if (selectedPeriod === "CUSTOM" && customFrom && customTo) {
        const d = parseAnyDate(c.date);
        const fromD = parseAnyDate(customFrom);
        const toD = parseAnyDate(customTo);
        if (!d || !fromD || !toD) return true;
        fromD.setHours(0, 0, 0, 0);
        toD.setHours(23, 59, 59, 999);
        return d >= fromD && d <= toD;
      }

      return true;
    });
  }, [selectedCustomer, salesChallans, selectedPeriod, customFrom, customTo]);

  // Auto-select only UNBILLED challans when customer changes or period filters update
  useEffect(() => {
    if (customerChallans.length > 0) {
      const unbilledOnly = customerChallans.filter(
        (c) => c.billing_status !== "Billed" && !c.linked_invoice_no
      );
      setSelectedChallanIds(unbilledOnly.map((c) => c.id));
    } else {
      setSelectedChallanIds([]);
    }
  }, [customerChallans]);

  // Toggle single challan selection
  const toggleChallan = (id: string) => {
    setSelectedChallanIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedChallanIds.length === customerChallans.length) {
      setSelectedChallanIds([]);
    } else {
      setSelectedChallanIds(customerChallans.map((c) => c.id));
    }
  };

  // Calculations
  const chosenChallans = useMemo(() => {
    return customerChallans.filter((c) => selectedChallanIds.includes(c.id));
  }, [customerChallans, selectedChallanIds]);

  const challanSubtotal = useMemo(() => {
    return chosenChallans.reduce((acc, c) => acc + (Number(c.total_amount) || 0), 0);
  }, [chosenChallans]);

  const challanItemQty = useMemo(() => {
    return chosenChallans.reduce((acc, c) => acc + (Number(c.total_item || c.total_takka) || 0), 0);
  }, [chosenChallans]);

  const challanMetersQty = useMemo(() => {
    return chosenChallans.reduce((acc, c) => acc + (Number(c.total_quantity || c.total_meters) || 0), 0);
  }, [chosenChallans]);

  const subtotal = challanSubtotal;
  const totalItemQty = challanItemQty;
  const totalMetersQty = challanMetersQty;

  const taxDetails = useMemo(() => {
    if (taxMode === "none" || taxRate === 0) {
      return { cgst: 0, sgst: 0, igst: 0, totalTax: 0, grandTotal: subtotal };
    }
    if (taxMode === "cgst_sgst") {
      const halfRate = taxRate / 2;
      const cgst = (subtotal * halfRate) / 100;
      const sgst = (subtotal * halfRate) / 100;
      return { cgst, sgst, igst: 0, totalTax: cgst + sgst, grandTotal: subtotal + cgst + sgst };
    }
    if (taxMode === "igst") {
      const igst = (subtotal * taxRate) / 100;
      return { cgst: 0, sgst: 0, igst, totalTax: igst, grandTotal: subtotal + igst };
    }
    return { cgst: 0, sgst: 0, igst: 0, totalTax: 0, grandTotal: subtotal };
  }, [subtotal, taxMode, taxRate]);

  // Calculate Due Date
  const calculatedDueDate = useMemo(() => {
    const days = parseInt(creditDays, 10);
    if (!days || days <= 0) return invoiceDate;
    return calculateDueDate(invoiceDate, days);
  }, [invoiceDate, creditDays]);

  // Handle Submit
  const handleGenerateInvoice = async () => {
    if (!selectedCustomer) {
      alert(isGujarati ? "કૃપા કરીને ગ્રાહક (Customer) પસંદ કરો." : "Please select a Customer.");
      return;
    }

    if (selectedChallanIds.length === 0) {
      alert(isGujarati ? "કૃપા કરીને ઓછામાં ઓછું ૧ ચલણ પસંદ કરો." : "Please select at least 1 sales challan to invoice.");
      return;
    }

    setIsSubmitting(true);
    const currentCid = getStoredCompanyId() || "comp-001";

    const linkedChallanNos = chosenChallans.map((c) => c.challan_no);
    const categorySummary =
      Array.from(
        new Set(
          chosenChallans
            .flatMap((c) => (c.items || []).map((it) => it.category || it.design_no || it.description))
            .filter(Boolean)
        )
      ).join(", ") || "Textile Goods";

    const itemsSummary = `Challans: ${linkedChallanNos.map((no) => `#${no}`).join(", ")} (${categorySummary})`;

    const invoiceItems = chosenChallans.flatMap((c) =>
      c.items && c.items.length > 0
        ? c.items.map((it, idx) => ({
            ...it,
            id: it.id || `it-${c.id}-${idx}`,
            challan_no: c.challan_no,
            challan_date: c.date,
          }))
        : [
            {
              id: `it-${c.id}`,
              challan_no: c.challan_no,
              challan_date: c.date,
              description: "Fabric Goods",
              hsn_code: "5407",
              takka: c.total_item || c.total_takka || "-",
              quantity: c.total_quantity || c.total_meters || "-",
              rate: c.total_amount && c.total_quantity ? (c.total_amount / c.total_quantity).toFixed(2) : "-",
              amount: c.total_amount,
            },
          ]
    );

    // Format address
    let fullAddress = "";
    if (selectedPartyInfo?.billing_address) {
      if (typeof selectedPartyInfo.billing_address === "object") {
        const b = selectedPartyInfo.billing_address;
        fullAddress = [b.street1, b.street2, b.city, b.state, b.pincode].filter(Boolean).join(", ");
      } else {
        fullAddress = String(selectedPartyInfo.billing_address);
      }
    } else if (selectedPartyInfo?.city) {
      fullAddress = selectedPartyInfo.city;
    }

    const newInvoice: SalesInvoice = {
      id: `inv-${Date.now()}`,
      company_id: currentCid,
      invoice_no: invoiceNo.trim(),
      date: invoiceDate,
      customer_name: selectedCustomer.trim(),
      customer_gstin: selectedPartyInfo?.gstin || "",
      customer_address: fullAddress,
      category: categorySummary,
      items_description: itemsSummary,
      linked_challan_ids: selectedChallanIds,
      linked_challan_nos: linkedChallanNos,
      items: invoiceItems,
      total_item: totalItemQty,
      total_quantity: totalMetersQty,
      total_takka: totalItemQty,
      total_meters: totalMetersQty,
      subtotal,
      taxable_amount: subtotal,
      gst_rate: taxMode === "none" ? 0 : taxRate,
      cgst_amount: taxDetails.cgst,
      sgst_amount: taxDetails.sgst,
      igst_amount: taxDetails.igst,
      total_amount: Math.round(taxDetails.grandTotal * 100) / 100,
      payment_terms: `${creditDays} Days Credit`,
      credit_days: parseInt(creditDays, 10) || 0,
      due_date: calculatedDueDate,
      payment_status: paymentStatus,
      notes:
        notes.trim() ||
        `Consolidated Tax Invoice against Sales Challans: ${linkedChallanNos.join(", ")}`,
    };

    try {
      saveSalesInvoice(newInvoice);
      router.push("/invoices");
    } catch (err) {
      console.error("Error saving sales invoice:", err);
      alert(isGujarati ? "બિલ બનાવવામાં ત્રુટિ આવી." : "Error saving sales invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-3.5 select-none pb-10 animate-in fade-in duration-150 text-xs font-sans max-w-[1600px] mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER TOOLBAR - CLEAN MATCH TO OUR SOFTWARE FORMS     */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <h2 className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">
            {isGujarati ? "સેલ્સ પાકું બિલ બનાવો (GENERATE SALES TAX INVOICE)" : "GENERATE SALES TAX INVOICE"}
          </h2>
        </div>
        <Link
          href="/invoices"
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isGujarati ? "પાછા જાઓ (Back to Invoices)" : "Back to Invoices"}</span>
        </Link>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. ERP 2-COLUMN SPLIT WORKFLOW GRID                           */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: CUSTOMER + CHALLANS TABLE + REMARKS (Col 8)     */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 space-y-3.5">
          

          {/* CARD 1: CUSTOMER / BUYER SELECTION */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3 relative z-30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>{isGujarati ? "ગ્રાહક વિગતો (CUSTOMER / BUYER DETAILS)*" : "CUSTOMER / BUYER DETAILS*"}</span>
              </label>
              {selectedPartyInfo?.gstin && (
                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  GSTIN: {selectedPartyInfo.gstin}
                </span>
              )}
            </div>

            {/* Customer Dropdown */}
            <div ref={customerDropdownRef} className="relative">
              <div
                onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                className={`w-full h-10 px-3 bg-white border rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors cursor-pointer ${
                  isCustomerDropdownOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className={`text-xs font-bold truncate ${selectedCustomer ? "text-slate-900" : "text-slate-400"}`}>
                    {selectedCustomer || (isGujarati ? "ગ્રાહકનું નામ પસંદ કરો..." : "Select Customer...")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer("");
                        setSelectedChallanIds([]);
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title="Clear"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isCustomerDropdownOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </div>
              </div>

              {isCustomerDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                  <div className="px-2 pb-1.5 border-b border-slate-100 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder={isGujarati ? "ગ્રાહક શોધો..." : "Search customer..."}
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  {customerNames
                    .filter((name) => name.toLowerCase().includes(customerSearch.toLowerCase()))
                    .map((name) => {
                      const isSelected = selectedCustomer === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(name);
                            setIsCustomerDropdownOpen(false);
                            setCustomerSearch("");
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-blue-50 text-blue-900 font-extrabold"
                              : "text-slate-700 hover:bg-slate-50 font-bold"
                          }`}
                        >
                          <span className="truncate">{name}</span>
                          {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Period Dropdown & Date to Date Filter */}
            {selectedCustomer && (
              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isGujarati ? "સમયગાળો (Period):" : "Period:"}</span>
                  </span>

                  <div ref={periodDropdownRef} className="relative min-w-[200px]">
                    <button
                      type="button"
                      onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                      className={`w-full h-8.5 px-3 bg-white border rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
                        isPeriodDropdownOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-300"
                      }`}
                    >
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {periodOptions.find((p) => p.value === selectedPeriod)?.label || "All Challans"}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                          isPeriodDropdownOpen ? "rotate-180 text-blue-600" : ""
                        }`}
                      />
                    </button>

                    {isPeriodDropdownOpen && (
                      <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full min-w-[240px] bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                        {periodOptions.map((opt) => {
                          const isSelected = selectedPeriod === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleSelectPeriod(opt.value)}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-blue-50 text-blue-900 font-black"
                                  : "text-slate-800 hover:bg-slate-50 font-bold"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* If CUSTOM selected: Date to Date Pickers */}
                {selectedPeriod === "CUSTOM" && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-150">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{isGujarati ? "તારીખ થી:" : "From:"}</span>
                      <div className="w-32">
                        <CustomDatePicker value={customFrom} onChange={setCustomFrom} placeholder="From Date" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{isGujarati ? "તારીખ સુધી:" : "To:"}</span>
                      <div className="w-32">
                        <CustomDatePicker value={customTo} onChange={setCustomTo} placeholder="To Date" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CARD 2: SALES CHALLANS SELECTION TABLE (Excel Grid) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative z-20">
            {/* HEADER TOOLBAR */}
            <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                  {isGujarati ? "ગ્રાહકના ડિલિવરી ચલણો પસંદ કરો" : "Select Sales Challans"}
                </h3>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                  {chosenChallans.length} / {customerChallans.length} {isGujarati ? "પસંદ કરેલ" : "selected"}
                </span>
              </div>

              {customerChallans.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="h-8.5 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5] text-blue-600" />
                  <span>
                    {selectedChallanIds.length === customerChallans.length
                      ? (isGujarati ? "બધા અનચેક કરો" : "Deselect All")
                      : (isGujarati ? "બધા પસંદ કરો" : "Select All")}
                  </span>
                </button>
              )}
            </div>

            {/* EMPTY STATE OR TABLE */}
            {!selectedCustomer ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Building2 className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-bold text-slate-700">{isGujarati ? "પહેલા ગ્રાહક પસંદ કરો" : "Please select a customer first"}</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {isGujarati
                    ? "ઉપરથી ગ્રાહકનું નામ પસંદ કરો જેથી તેના તમામ ડિલિવરી ચલણો અહીં ટેબલમાં દેખાશે."
                    : "Select a customer from the dropdown above to view delivery challans."}
                </p>
              </div>
            ) : customerChallans.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-bold text-slate-800">{isGujarati ? "કોઈ ચલણ મળેલ નથી" : "No Challans Found"}</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {isGujarati
                    ? "આ સમયગાળામાં અથવા આ ગ્રાહક માટે કોઈ સેલ્સ ચલણ નોંધાયેલ નથી."
                    : "No delivery challans found for this customer in the selected period."}
                </p>
                <div className="pt-2">
                  <Link
                    href="/sales/new"
                    className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-blue-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isGujarati ? "નવું સેલ્સ ચલણ ઉમેરો" : "Create New Challan"}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold tracking-wider text-slate-600 uppercase select-none whitespace-nowrap">
                      <th className="py-3 px-2 w-10 text-center border-r border-slate-200/80">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedChallanIds.length === customerChallans.length && customerChallans.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      </th>
                      <th className="py-3 px-2 w-12 text-center border-r border-slate-200/80">{t("SR")}</th>
                      <th className="py-3 px-2.5 w-24 text-center border-r border-slate-200/80">{isGujarati ? "સ્થિતિ" : "STATUS"}</th>
                      <th className="py-3 px-3 w-28 text-center border-r border-slate-200/80">{t("DATE")}</th>
                      <th className="py-3 px-3 w-28 text-center border-r border-slate-200/80">{t("CHALLAN NO")}</th>
                      <th className="py-3 px-4 min-w-[200px] border-r border-slate-200/80">{isGujarati ? "વિગત / ડિસ્ક્રિપ્શન" : "PARTICULARS / DESCRIPTION"}</th>
                      <th className="py-3 px-3 w-24 text-center border-r border-slate-200/80">{isGujarati ? "આઇટમ / તાકા" : "ITEM / TAKKA"}</th>
                      <th className="py-3 px-3 w-28 text-right border-r border-slate-200/80">{isGujarati ? "જથ્થો (મીટર)" : "QUANTITY"}</th>
                      <th className="py-3 px-4 w-32 text-right">{isGujarati ? "રકમ (₹)" : "AMOUNT (₹)"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {customerChallans.map((challan, index) => {
                      const isSelected = selectedChallanIds.includes(challan.id);
                      const isBilled = challan.billing_status === "Billed" || Boolean(challan.linked_invoice_no);
                      const firstItem = challan.items?.[0];
                      const extraCount = (challan.items?.length || 0) - 1;
                      const catName = firstItem?.category || firstItem?.design_no || firstItem?.description || "Textile Fabric";
                      const itemVal = challan.total_item || challan.total_takka || "-";
                      const qtyVal = challan.total_quantity || challan.total_meters || "-";

                      return (
                        <tr
                          key={challan.id}
                          onClick={() => toggleChallan(challan.id)}
                          className={`h-11 transition-colors cursor-pointer select-none ${
                            isSelected ? "bg-blue-50/25 hover:bg-blue-50/45" : "hover:bg-slate-50/80"
                          }`}
                        >
                          {/* CHECKBOX */}
                          <td className="p-0 text-center border-r border-slate-200/80 align-middle w-10 h-11" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center w-full h-11">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleChallan(challan.id)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </div>
                          </td>

                          {/* SR (INDEX) */}
                          <td className="p-0 text-center font-mono font-bold text-slate-500 bg-slate-50/60 text-xs border-r border-slate-200/80 select-none align-middle w-12 h-11">
                            {String(index + 1).padStart(2, "0")}
                          </td>

                          {/* STATUS BADGE */}
                          <td className="px-2 text-center border-r border-slate-200/80 align-middle h-11 whitespace-nowrap">
                            {isBilled ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title={challan.linked_invoice_no ? `Billed in Invoice ${challan.linked_invoice_no}` : "Already Billed"}>
                                <CheckCircle2 className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{challan.linked_invoice_no ? challan.linked_invoice_no : (isGujarati ? "બિલ થયેલ" : "Billed")}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 inline-block" />
                                <span>{isGujarati ? "અન-બિલ" : "Unbilled"}</span>
                              </span>
                            )}
                          </td>

                          {/* DATE */}
                          <td className="px-3 font-mono font-bold text-slate-700 whitespace-nowrap border-r border-slate-200/80 text-center align-middle h-11 text-xs">
                            {challan.date}
                          </td>

                          {/* CHALLAN NO */}
                          <td className="px-3 font-mono font-black text-blue-600 whitespace-nowrap border-r border-slate-200/80 text-center align-middle h-11 text-xs">
                            #{challan.challan_no}
                          </td>

                          {/* PARTICULARS / DESCRIPTION */}
                          <td className="px-4 border-r border-slate-200/80 align-middle h-11">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 truncate">
                                {catName}
                              </span>
                              {extraCount > 0 && (
                                <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                  +{extraCount} more
                                </span>
                              )}
                            </div>
                          </td>

                          {/* ITEM / TAKKA */}
                          <td className="px-3 text-center font-mono font-bold text-slate-800 border-r border-slate-200/80 align-middle h-11 text-xs">
                            {itemVal}
                          </td>

                          {/* QUANTITY */}
                          <td className="px-3 text-right font-mono font-bold text-slate-800 border-r border-slate-200/80 align-middle h-11 text-xs">
                            {typeof qtyVal === "number" ? `${Number(qtyVal).toFixed(1)}m` : qtyVal}
                          </td>

                          {/* AMOUNT (₹) */}
                          <td className="px-4 text-right font-mono font-black text-slate-900 align-middle h-11 text-xs">
                            ₹{Number(challan.total_amount || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {chosenChallans.length > 0 && (
                    <tfoot className="bg-slate-50/90 font-extrabold text-slate-800 border-t-2 border-slate-200 select-none">
                      <tr className="h-11">
                        <td colSpan={6} className="py-2.5 px-3 border-r border-slate-200/80 bg-slate-50/90">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-500 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                              <span>{chosenChallans.length}</span>
                              <span>{chosenChallans.length === 1 ? (isGujarati ? "ચલણ પસંદ કરેલ" : "Challan Selected") : (isGujarati ? "ચલણો પસંદ કરેલ" : "Challans Selected")}</span>
                            </span>
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                              {isGujarati ? "પસંદ કરેલ ચલણોનો સરવાળો" : "Selected Challans Subtotal"}:
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 border-r border-slate-200/80">
                          {totalItemQty}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 border-r border-slate-200/80">
                          {totalMetersQty.toFixed(1)}m
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="font-mono font-black text-blue-600 text-xs">
                            ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>

          {/* CARD 3: INVOICE REMARKS & PRINT NOTES */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-2 relative z-10">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
              {isGujarati ? "બિલ પર છાપવા માટે નોંધ અને શરતો" : "Invoice Remarks & Terms to Print"}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isGujarati ? "બિલ માટે વધારાની નોંધ, શરતો અથવા ટ્રાન્સપોર્ટ વિગત..." : "Add optional notes, delivery terms or transport details to print on invoice..."}
              className="w-full p-3 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-medium text-slate-900 text-xs shadow-2xs focus:outline-none transition-all resize-none"
            />
          </div>

        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: STICKY INVOICE SPECS & BILL SUMMARY (Col 4)   */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 space-y-3.5 lg:sticky lg:top-20 z-20">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* CARD HEADER */}
            <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                  {isGujarati ? "ઇન્વોઇસ & હિસાબ સમરી" : "Invoice & Accounting"}
                </h3>
              </div>
              <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {invoiceNo}
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              
              {/* SECTION 1: INVOICE META FIELDS */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* INVOICE NO */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {isGujarati ? "ઇન્વોઇસ નં.*" : "Invoice No.*"}
                    </span>
                    <input
                      type="text"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      placeholder="INV-0001"
                      className="w-full h-8.5 px-2.5 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono font-black text-slate-900 text-xs shadow-2xs focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* INVOICE DATE */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {isGujarati ? "તારીખ*" : "Invoice Date*"}
                    </span>
                    <CustomDatePicker value={invoiceDate} onChange={setInvoiceDate} />
                  </div>
                </div>

                {/* CREDIT TERMS & DUE DATE */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div ref={creditTermsRef} className="relative">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {isGujarati ? "શાખ મુદત" : "Credit Terms"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreditTermsOpen(!isCreditTermsOpen)}
                      className={`w-full h-8.5 px-2.5 bg-white border rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
                        isCreditTermsOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-300"
                      }`}
                    >
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {creditTermsOptions.find((c) => c.value === creditDays)?.label || `${creditDays} Days`}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                          isCreditTermsOpen ? "rotate-180 text-blue-600" : ""
                        }`}
                      />
                    </button>

                    {isCreditTermsOpen && (
                      <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full min-w-[140px] bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                        {creditTermsOptions.map((opt) => {
                          const isSelected = creditDays === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setCreditDays(opt.value);
                                setIsCreditTermsOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-blue-50 text-blue-900 font-black"
                                  : "text-slate-800 hover:bg-slate-50 font-bold"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {isGujarati ? "મુદત તારીખ" : "Due Date"}
                    </span>
                    <div className="h-8.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs text-slate-700 flex items-center justify-between shadow-2xs">
                      <span>{calculatedDueDate}</span>
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* PAYMENT STATUS TOGGLE */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    {isGujarati ? "ચુકવણી સ્થિતિ (Payment Status):" : "Payment Status:"}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus("Pending")}
                      className={`h-8 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        paymentStatus === "Pending"
                          ? "bg-amber-500 text-white border-amber-500 shadow-2xs font-extrabold"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span>{isGujarati ? "બાકી (Pending)" : "Pending"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus("Paid")}
                      className={`h-8 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        paymentStatus === "Paid"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-extrabold"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isGujarati ? "ચૂકવેલ (Paid)" : "Paid"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="pt-2 border-t border-slate-200" />

              {/* SECTION 2: GST / TAX DROPDOWN */}
              <div className="space-y-1.5" ref={gstDropdownRef}>
                <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                  {isGujarati ? "GST / ટેક્સ પ્રકાર:" : "GST / Tax Rate:"}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsGstDropdownOpen(!isGstDropdownOpen)}
                    className={`w-full h-9 px-3 bg-white border rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
                      isGstDropdownOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-300"
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {gstOptions.find((o) => o.value === selectedGstOption)?.label || "None (0%)"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isGstDropdownOpen ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>

                  {isGstDropdownOpen && (
                    <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 max-h-60 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                      {gstOptions.map((opt) => {
                        const isSelected = selectedGstOption === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelectGstOption(opt)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 text-blue-900 font-black"
                                : "text-slate-800 hover:bg-slate-50 font-bold"
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: LIVE FINANCIAL BREAKDOWN */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
                
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>{isGujarati ? "કરપાત્ર રકમ (Subtotal):" : "Taxable Subtotal:"}</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {taxMode === "cgst_sgst" && (
                  <>
                    <div className="flex justify-between items-center text-slate-600 font-medium pl-1 border-l-2 border-blue-200">
                      <span>CGST ({(taxRate / 2).toFixed(1)}%):</span>
                      <span className="font-mono font-bold text-slate-800">
                        + ₹{taxDetails.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 font-medium pl-1 border-l-2 border-blue-200">
                      <span>SGST ({(taxRate / 2).toFixed(1)}%):</span>
                      <span className="font-mono font-bold text-slate-800">
                        + ₹{taxDetails.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                )}

                {taxMode === "igst" && (
                  <div className="flex justify-between items-center text-slate-600 font-medium pl-1 border-l-2 border-blue-200">
                    <span>IGST ({taxRate}%):</span>
                    <span className="font-mono font-bold text-slate-800">
                      + ₹{taxDetails.igst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {taxMode === "none" && (
                  <div className="flex justify-between items-center text-slate-400 font-medium">
                    <span>{isGujarati ? "લાગુ પડતો ટેક્સ (0%):" : "Applied GST (0%):"}</span>
                    <span className="font-mono font-bold text-slate-400">₹0.00</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase text-slate-900 block">
                      {isGujarati ? "કુલ રકમ (Grand Total):" : "Grand Total:"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {`(${chosenChallans.length} ${chosenChallans.length === 1 ? "challan" : "challans"})`}
                    </span>
                  </div>
                  <span className="font-mono text-xl font-black text-blue-600 tracking-tight">
                    ₹{Math.round(taxDetails.grandTotal).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTON (INSIDE STICKY SIDEBAR) */}
              <button
                type="button"
                onClick={handleGenerateInvoice}
                disabled={isSubmitting || chosenChallans.length === 0}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-98"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isSubmitting
                    ? (isGujarati ? "ઇન્વોઇસ બની રહ્યું છે..." : "Generating Invoice...")
                    : (isGujarati
                        ? `પાકું બિલ બનાવો (₹${Math.round(taxDetails.grandTotal).toLocaleString("en-IN")})`
                        : `Generate Tax Invoice (₹${Math.round(taxDetails.grandTotal).toLocaleString("en-IN")})`)}
                </span>
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function GenerateSalesInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-96 flex items-center justify-center text-slate-400 font-bold">
          Loading Invoice Generator...
        </div>
      }
    >
      <GenerateInvoiceContent />
    </Suspense>
  );
}
