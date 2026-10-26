"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { useLanguage } from "@/context/LanguageContext";
import {
  SalesInvoice,
  SalesLineItem,
  getStoredSalesInvoices,
  saveSalesInvoice,
  getNextSalesInvoiceNo
} from "@/lib/salesStorage";
import { getStoredCompanySettings, fetchLiveCompanySettings, CompanySettings, getFieldLabel } from "@/lib/companySettings";
import { parseAnyDate, calculateDueDate, TEXTILE_CREDIT_TERMS } from "@/lib/creditTerms";
import {
  ArrowLeft,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  X,
  Save,
  CheckCircle2,
  Clock,
  Percent,
  Receipt
} from "lucide-react";

export const GST_RATE_OPTIONS = [
  { id: "none", label: "None (0%)", rate: 0, mode: "none" },
  { id: "cgst_sgst_5", label: "CGST + SGST @ 5%", rate: 5, mode: "cgst_sgst" },
  { id: "cgst_sgst_12", label: "CGST + SGST @ 12%", rate: 12, mode: "cgst_sgst" },
  { id: "cgst_sgst_18", label: "CGST + SGST @ 18%", rate: 18, mode: "cgst_sgst" },
  { id: "cgst_sgst_28", label: "CGST + SGST @ 28%", rate: 28, mode: "cgst_sgst" },
  { id: "igst_5", label: "Only GST @ 5%", rate: 5, mode: "igst" },
  { id: "igst_12", label: "Only GST @ 12%", rate: 12, mode: "igst" },
  { id: "igst_18", label: "Only GST @ 18%", rate: 18, mode: "igst" },
  { id: "igst_28", label: "Only GST @ 28%", rate: 28, mode: "igst" },
];

function getTodayStr(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  onEnterNext?: () => void;
}

function CustomDatePicker({
  value,
  onChange,
  placeholder = "DD-MM-YYYY",
  className = "",
  id,
  onEnterNext
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
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const dStr = String(day).padStart(2, "0");
    const mStr = String(viewMonth + 1).padStart(2, "0");
    onChange(`${dStr}-${mStr}-${viewYear}`);
    setIsOpen(false);
    if (onEnterNext) {
      setTimeout(() => onEnterNext(), 50);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(getTodayStr());
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-xs select-none ${className}`}>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 bg-white border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""
        }`}
      >
        <span className={`font-mono font-bold text-xs ${value ? "text-slate-900" : "text-slate-400"}`}>
          {value || placeholder}
        </span>
        <Calendar className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d} className="text-[10px] font-bold text-slate-400 py-0.5">
                {d}
              </span>
            ))}

            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <span key={`empty-${i}`} className="py-1" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dStr = String(day).padStart(2, "0");
              const mStr = String(viewMonth + 1).padStart(2, "0");
              const dateStr = `${dStr}-${mStr}-${viewYear}`;
              const isSelected = value === dateStr;
              const isToday = getTodayStr() === dateStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`py-1 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-2xs font-black"
                      : isToday
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <button
              type="button"
              onClick={() => {
                onChange(getTodayStr());
                setIsOpen(false);
              }}
              className="text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 font-bold transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewSalesInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id") || searchParams.get("edit");
  const isEditMode = Boolean(editId);
  const { t, language } = useLanguage();
  const isGujarati = language === "gu";

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => getStoredCompanySettings());

  useEffect(() => {
    fetchLiveCompanySettings().then((s) => {
      if (s) setCompanySettings(s);
    });
  }, []);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(getTodayStr());
  const [customerName, setCustomerName] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const [customersList, setCustomersList] = useState<any[]>([]);

  // GST Option (Default: 0% / None as requested)
  const [selectedGstOption, setSelectedGstOption] = useState<string>("none");
  const [isGstDropdownOpen, setIsGstDropdownOpen] = useState<boolean>(false);
  const gstDropdownRef = useRef<HTMLDivElement>(null);

  const [creditDays, setCreditDays] = useState<number>(30);
  const [paymentStatus, setPaymentStatus] = useState<"Pending" | "Paid">("Pending");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Line items with exact same 10 data columns as Sales Challan
  const [lineItems, setLineItems] = useState<SalesLineItem[]>([
    {
      id: "item-1",
      category: "",
      hsn_code: "",
      description: "",
      item: "",
      quantity: "",
      weight: "",
      kg: "",
      cartoon: "",
      rate: "",
      amount: 0
    }
  ]);

  // Load registered parties/customers
  useEffect(() => {
    const partyMap = new Map<string, any>();

    try {
      const savedVendors = getTenantItem<any[]>("texaflow_vendors");
      if (Array.isArray(savedVendors)) {
        savedVendors.forEach((v) => {
          const name = v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim();
          if (name) {
            partyMap.set(name.toLowerCase().trim(), {
              name,
              gstin: v.gstin || v.tax_number || "",
              address: v.billing_address
                ? typeof v.billing_address === "object"
                  ? [v.billing_address.street1, v.billing_address.city, v.billing_address.state].filter(Boolean).join(", ")
                  : String(v.billing_address)
                : v.city || ""
            });
          }
        });
      }
    } catch {}

    try {
      const savedInvoices = getStoredSalesInvoices();
      savedInvoices.forEach((inv) => {
        if (inv.customer_name && !partyMap.has(inv.customer_name.toLowerCase().trim())) {
          partyMap.set(inv.customer_name.toLowerCase().trim(), {
            name: inv.customer_name,
            gstin: inv.customer_gstin || "",
            address: inv.customer_address || ""
          });
        }
      });
    } catch {}

    setCustomersList(Array.from(partyMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  // Populate on edit mode or assign next invoice no
  useEffect(() => {
    if (editId) {
      const list = getStoredSalesInvoices();
      const matched = list.find((i) => i.id === editId || i.invoice_no === editId);
      if (matched) {
        setInvoiceNo(matched.invoice_no || "");
        setInvoiceDate(matched.date || getTodayStr());
        setCustomerName(matched.customer_name || "");
        setCustomerGstin(matched.customer_gstin || "");
        setCustomerAddress(matched.customer_address || "");
        setCreditDays(matched.credit_days || 30);
        setPaymentStatus(matched.payment_status === "Paid" ? "Paid" : "Pending");
        setNotes(matched.notes || "");

        // Set GST option
        if (matched.gst_rate === 0 || matched.tax_mode === "none") {
          setSelectedGstOption("none");
        } else if (matched.tax_mode === "igst") {
          setSelectedGstOption(`igst_${matched.gst_rate || 5}`);
        } else {
          setSelectedGstOption(`cgst_sgst_${matched.gst_rate || 5}`);
        }

        if (matched.items && matched.items.length > 0) {
          setLineItems(
            matched.items.map((it, idx) => ({
              ...it,
              id: it.id || `item-${idx + 1}`,
              category: it.category || it.design_no || "",
              item: it.item !== undefined ? it.item : it.takka || "",
              quantity: it.quantity !== undefined ? it.quantity : it.meters || "",
              hsn_code: it.hsn_code || ""
            }))
          );
        }
        return;
      }
    }

    // Default next invoice no based on company settings
    const nextNo = getNextSalesInvoiceNo();
    setInvoiceNo(nextNo);

    // Apply company settings default GST rate
    const settings = getStoredCompanySettings();
    if (settings.gst_rate) {
      if (settings.gst_rate.startsWith("0%") || settings.gst_rate.toLowerCase().includes("exempt")) {
        setSelectedGstOption("none");
      } else if (settings.gst_rate.startsWith("5%")) {
        setSelectedGstOption("cgst_sgst_5");
      } else if (settings.gst_rate.startsWith("12%")) {
        setSelectedGstOption("cgst_sgst_12");
      } else if (settings.gst_rate.startsWith("18%")) {
        setSelectedGstOption("cgst_sgst_18");
      }
    }
  }, [editId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
      if (gstDropdownRef.current && !gstDropdownRef.current.contains(event.target as Node)) {
        setIsGstDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerName.trim()) return customersList;
    return customersList.filter((c) => c.name.toLowerCase().includes(customerName.toLowerCase().trim()));
  }, [customersList, customerName]);

  const handleCustomerSelect = (partyObj: any) => {
    setCustomerName(partyObj.name);
    setCustomerGstin(partyObj.gstin || "");
    setCustomerAddress(partyObj.address || "");
    setIsCustomerDropdownOpen(false);
    setTimeout(() => {
      document.getElementById("invoice-no-input")?.focus();
    }, 50);
  };

  const handleAddLineItem = () => {
    const nextIdx = lineItems.length;
    setLineItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        category: "",
        hsn_code: "",
        description: "",
        item: "",
        quantity: "",
        weight: "",
        kg: "",
        cartoon: "",
        rate: "",
        amount: 0
      }
    ]);
    setTimeout(() => {
      document.getElementById(`sales-cat-${nextIdx}`)?.focus();
    }, 50);
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length <= 1) {
      setLineItems([
        {
          id: "item-1",
          category: "",
          hsn_code: "",
          description: "",
          item: "",
          quantity: "",
          weight: "",
          kg: "",
          cartoon: "",
          rate: "",
          amount: 0
        }
      ]);
      return;
    }
    setLineItems((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateLineItem = (id: string, field: keyof SalesLineItem, val: any) => {
    setLineItems((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: val };

        if (field === "quantity" || field === "rate" || field === "item" || field === "weight" || field === "kg") {
          const q = parseFloat(String(updated.quantity || "")) || 0;
          const itm = parseFloat(String(updated.item || "")) || 0;
          const w = parseFloat(String(updated.weight || "")) || 0;
          const r = parseFloat(String(updated.rate || "")) || 0;

          // Auto-calculate KG if Quantity (PCS) and Weight (CON WT) are entered
          if (field === "quantity" || field === "weight") {
            if (q > 0 && w > 0) {
              updated.kg = String(Math.round(q * w * 1000) / 1000);
            }
          }

          const curKg = parseFloat(String(updated.kg || "")) || 0;

          if (r > 0) {
            // Priority: If KG is present and > 0, multiply KG * Rate
            // Otherwise multiply Quantity * Rate, or Weight * Rate
            if (curKg > 0) {
              updated.amount = Math.round(curKg * r * 100) / 100;
            } else if (q > 0) {
              updated.amount = Math.round(q * r * 100) / 100;
            } else if (w > 0) {
              updated.amount = Math.round(w * r * 100) / 100;
            } else if (itm > 0) {
              updated.amount = Math.round(itm * r * 100) / 100;
            }
          } else if (field === "rate" && (val === "" || val === 0 || val === "0")) {
            updated.amount = 0;
          }
        }

        return updated;
      })
    );
  };

  const totals = useMemo(() => {
    let totalItems = 0;
    let totalQty = 0;
    let weight = 0;
    let kg = 0;
    let cartoon = 0;
    let grossAmount = 0;

    lineItems.forEach((it) => {
      totalItems += parseFloat(String(it.item || it.takka || "")) || 0;
      totalQty += parseFloat(String(it.quantity || it.meters || "")) || 0;
      weight += parseFloat(String(it.weight || "")) || 0;
      kg += parseFloat(String(it.kg || "")) || 0;
      cartoon += parseFloat(String(it.cartoon || "")) || 0;
      grossAmount += parseFloat(String(it.amount || "")) || 0;
    });

    return {
      totalItems: Math.round(totalItems),
      totalQty: Math.round(totalQty * 10) / 10,
      weight: Math.round(weight * 100) / 100,
      kg: Math.round(kg * 100) / 100,
      cartoon: Math.round(cartoon),
      grossAmount: Math.round(grossAmount * 100) / 100
    };
  }, [lineItems]);

  // Tax calculations based on selectedGstOption
  const taxCalculations = useMemo(() => {
    const gross = totals.grossAmount;
    let mode: "none" | "cgst_sgst" | "igst" = "none";
    let rate = 0;

    if (selectedGstOption === "none") {
      mode = "none";
      rate = 0;
    } else if (selectedGstOption.startsWith("cgst_sgst_")) {
      mode = "cgst_sgst";
      rate = parseInt(selectedGstOption.replace("cgst_sgst_", ""), 10) || 5;
    } else if (selectedGstOption.startsWith("igst_")) {
      mode = "igst";
      rate = parseInt(selectedGstOption.replace("igst_", ""), 10) || 5;
    }

    if (mode === "none" || rate === 0) {
      return {
        mode,
        rate,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
        grandTotal: gross
      };
    }

    if (mode === "cgst_sgst") {
      const halfRate = rate / 2;
      const cgst = Math.round(((gross * halfRate) / 100) * 100) / 100;
      const sgst = Math.round(((gross * halfRate) / 100) * 100) / 100;
      const totalTax = cgst + sgst;
      return {
        mode,
        rate,
        cgst,
        sgst,
        igst: 0,
        totalTax,
        grandTotal: gross + totalTax
      };
    }

    if (mode === "igst") {
      const igst = Math.round(((gross * rate) / 100) * 100) / 100;
      return {
        mode,
        rate,
        cgst: 0,
        sgst: 0,
        igst,
        totalTax: igst,
        grandTotal: gross + igst
      };
    }

    return {
      mode,
      rate,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      grandTotal: gross
    };
  }, [totals.grossAmount, selectedGstOption]);

  const calculatedDueDate = useMemo(() => {
    return calculateDueDate(invoiceDate, creditDays);
  }, [invoiceDate, creditDays]);

  const handleSaveInvoice = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (isSaving) return;

    if (!customerName.trim()) {
      alert(isGujarati ? "કૃપા કરીને ગ્રાહક (Customer) પસંદ કરો અથવા દાખલ કરો." : "Please select or enter Customer Name.");
      return;
    }

    if (!invoiceNo.trim()) {
      alert(isGujarati ? "કૃપા કરીને ઇન્વોઇસ નં. દાખલ કરો." : "Please enter Invoice No.");
      return;
    }

    const validItems = lineItems
      .filter((it) => (it.category || "").trim() || (it.description || "").trim() || Number(it.amount) > 0)
      .map((it) => ({
        ...it,
        design_no: it.category || "",
        takka: it.item,
        meters: it.quantity,
        amount: Number(it.amount || 0)
      }));

    if (validItems.length === 0) {
      alert(isGujarati ? "કૃપા કરીને ઓછામાં ઓછી ૧ આઇટમ ઉમેરો." : "Please add at least one line item.");
      return;
    }

    setIsSaving(true);
    const currentCid = getStoredCompanyId() || "comp-001";
    const recordId = isEditMode && editId ? editId : `inv-${invoiceNo.trim()}-${Date.now()}`;

    const categorySummary =
      Array.from(new Set(validItems.map((it) => (it.category || it.design_no || "").trim()).filter(Boolean))).join(", ") ||
      "Textile Goods";

    const payload: SalesInvoice = {
      id: recordId,
      company_id: currentCid,
      invoice_no: invoiceNo.trim(),
      date: invoiceDate.trim(),
      customer_name: customerName.trim(),
      customer_gstin: customerGstin.trim() || undefined,
      customer_address: customerAddress.trim() || undefined,
      category: categorySummary,
      items: validItems,
      total_item: totals.totalItems,
      total_quantity: totals.totalQty,
      total_takka: totals.totalItems,
      total_meters: totals.totalQty,
      total_weight: totals.weight,
      total_cartoon: totals.cartoon,
      subtotal: totals.grossAmount,
      taxable_amount: totals.grossAmount,
      gst_rate: taxCalculations.rate,
      tax_mode: taxCalculations.mode,
      cgst_amount: taxCalculations.cgst,
      sgst_amount: taxCalculations.sgst,
      igst_amount: taxCalculations.igst,
      total_amount: Math.round(taxCalculations.grandTotal * 100) / 100,
      credit_days: creditDays,
      due_date: calculatedDueDate,
      payment_status: paymentStatus,
      payment_terms: `${creditDays} Days Credit`,
      is_direct: true,
      notes: notes.trim() || undefined
    };

    saveSalesInvoice(payload);
    router.push("/sales-invoices");
  };

  return (
    <div className="w-full space-y-3.5 select-none pb-24 animate-in fade-in duration-150 text-xs font-sans">
      {/* 1. TOP HEADER TOOLBAR - EXACT MATCH TO SALES CHALLAN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-3 flex items-center justify-between gap-3 text-xs">
        <h2 className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">
          {isEditMode
            ? (isGujarati ? "સેલ્સ પાકું બિલ એડિટ કરો" : "EDIT SALES INVOICE")
            : (isGujarati ? "નવું સેલ્સ પાકું બિલ (NEW SALES TAX INVOICE)" : "NEW SALES INVOICE (TAX INVOICE)")}
        </h2>
        <Link
          href="/sales-invoices"
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isGujarati ? "પાછા જાઓ (Back to Invoices)" : "Back to Invoices"}</span>
        </Link>
      </div>

      <form
        onSubmit={handleSaveInvoice}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleSaveInvoice();
          }
        }}
        className="space-y-3.5 pb-28"
      >
        {/* BOX 1: CUSTOMER & INVOICE SPECIFICATIONS (WITH GST OPTION REPLACING TRANSPORT) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* LEFT COLUMN: CUSTOMER / PARTY */}
            <div className="p-4 sm:p-5 md:pr-8 space-y-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                {getFieldLabel(companySettings, "party_name", isGujarati ? "ગ્રાહક / પાર્ટી (CUSTOMER / BUYER)*" : "Customer / Party*")}
              </label>

              <div className="relative" ref={customerDropdownRef}>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="customer-party-input"
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (isCustomerDropdownOpen && filteredCustomers.length > 0) {
                          const exact = filteredCustomers.find(
                            (v) => v.name.toLowerCase() === customerName.toLowerCase().trim()
                          );
                          if (exact) {
                            handleCustomerSelect(exact);
                          } else if (customerName.trim().length > 0) {
                            handleCustomerSelect(filteredCustomers[0]);
                          }
                        }
                        setIsCustomerDropdownOpen(false);
                        setTimeout(() => {
                          document.getElementById("invoice-no-input")?.focus();
                        }, 50);
                      }
                    }}
                    placeholder={isGujarati ? "ગ્રાહક શોધો અથવા નવું નામ લખો..." : "Search or enter party name..."}
                    className="w-full h-9 pl-9 pr-14 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-bold text-slate-900 text-xs shadow-2xs focus:outline-none transition-all"
                    required
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {customerName && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerName("");
                          setCustomerGstin("");
                          setCustomerAddress("");
                          setIsCustomerDropdownOpen(true);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isCustomerDropdownOpen ? "rotate-180 text-blue-600" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* PARTY DROPDOWN */}
                {isCustomerDropdownOpen && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 max-h-60 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs font-medium">
                        {customerName
                          ? `No registered party matching "${customerName}". Keep typing to use custom name.`
                          : t("No parties found.")}
                      </div>
                    ) : (
                      filteredCustomers.map((v) => {
                        const isSelected = customerName.toLowerCase().trim() === v.name.toLowerCase().trim();
                        return (
                          <button
                            key={v.name}
                            type="button"
                            onClick={() => handleCustomerSelect(v)}
                            className={`w-full text-left px-3 py-2 hover:bg-blue-50/70 rounded-xl font-bold text-slate-800 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50 text-blue-900 font-extrabold" : ""
                            }`}
                          >
                            <div className="truncate">
                              <span className="block truncate">{v.name}</span>
                              {v.gstin && (
                                <span className="block text-[10px] font-mono text-slate-400 font-normal">
                                  GST: {v.gstin}
                                </span>
                              )}
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* GSTIN / City badge preview */}
              {customerGstin && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    GSTIN: {customerGstin}
                  </span>
                  {customerAddress && (
                    <span className="text-[10px] text-slate-500 font-medium truncate max-w-[220px]">
                      {customerAddress}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: INVOICE SPECIFICATIONS & GST SELECTION */}
            <div className="p-4 sm:p-5 md:pl-8 space-y-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                {isGujarati ? "ઇન્વોઇસ વિગતો (INVOICE SPECIFICATIONS)*" : "Invoice Specifications*"}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* INVOICE NO */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    {getFieldLabel(companySettings, "bill_no", isGujarati ? "ઇન્વોઇસ નં.*" : "Invoice No*")}
                  </span>
                  <input
                    id="invoice-no-input"
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        document.getElementById("invoice-date-btn")?.focus();
                      }
                    }}
                    placeholder="e.g. INV-0001"
                    className="w-full h-9 px-3 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono font-bold text-slate-900 text-xs shadow-2xs focus:outline-none transition-all"
                    required
                  />
                </div>

                {/* INVOICE DATE */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    {isGujarati ? "ઇન્વોઇસ તારીખ*" : "Invoice Date*"}
                  </span>
                  <CustomDatePicker
                    id="invoice-date-btn"
                    value={invoiceDate}
                    onChange={(newDate) => setInvoiceDate(newDate)}
                    placeholder="DD-MM-YYYY"
                  />
                </div>
              </div>

              {/* GST / TAX RATE CUSTOM DROPDOWN (EXACT MATCH TO SPEC & IMAGE) */}
              <div className="relative pt-1" ref={gstDropdownRef}>
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
                  {isGujarati ? "જીએસટી ટેક્સ દર (GST / TAX RATE):" : "GST / TAX RATE:"}
                </label>
                <button
                  type="button"
                  onClick={() => setIsGstDropdownOpen((prev) => !prev)}
                  className={`w-full h-10 px-3.5 bg-white border rounded-xl font-bold text-slate-900 text-xs shadow-xs flex items-center justify-between cursor-pointer transition-all ${
                    isGstDropdownOpen
                      ? "border-blue-500 ring-2 ring-blue-500/20"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <span className="truncate">
                    {GST_RATE_OPTIONS.find((o) => o.id === selectedGstOption)?.label || "None (0%)"}
                  </span>
                  {isGstDropdownOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>

                {isGstDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-1.5 space-y-0.5 max-h-64 overflow-y-auto">
                    {GST_RATE_OPTIONS.map((opt) => {
                      const isSelected = selectedGstOption === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelectedGstOption(opt.id);
                            setIsGstDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-blue-600 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOX 2: SALES ITEMS / MATERIALS BREAKDOWN (EXACT MATCH TO SALES CHALLAN) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative z-10">
          {/* HEADER TOOLBAR */}
          <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2.5">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
              {isGujarati ? "માલ / આઇટમ લિસ્ટ (Sales Items / Materials Breakdown)" : "Sales Items / Materials Breakdown"}
            </h3>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="h-8.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isGujarati ? "+ નવો માલ ઉમેરો" : "Add Item Row"}</span>
            </button>
          </div>

          {/* TABLE - SEAMLESS FULL-WIDTH GRID (EXACT SAME 11 COLUMNS AS SALES CHALLAN) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[950px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold tracking-wider text-slate-600 uppercase select-none">
                  <th className="py-3 px-2 w-10 text-center border-r border-slate-200/80">{t("SR")}</th>
                  <th className="py-3 px-3 w-40 border-r border-slate-200/80">{getFieldLabel(companySettings, "item_name", t("PERTICULARS*"))}</th>
                  <th className="py-3 px-2 w-24 text-center border-r border-slate-200/80">{getFieldLabel(companySettings, "hsn_code", t("HSN CODE"))}</th>
                  <th className="py-3 px-3 min-w-[180px] border-r border-slate-200/80">{getFieldLabel(companySettings, "item_name", t("ITEM / DESCRIPTION"))}</th>
                  <th className="py-3 px-2 w-24 text-right border-r border-slate-200/80">{getFieldLabel(companySettings, "quantity", t("QUANTITY"))}</th>
                  <th className="py-3 px-2 w-20 text-right border-r border-slate-200/80">{getFieldLabel(companySettings, "weight", t("WEIGHT"))}</th>
                  <th className="py-3 px-2 w-20 text-right border-r border-slate-200/80">{getFieldLabel(companySettings, "kg", t("KG"))}</th>
                  <th className="py-3 px-2 w-16 text-center border-r border-slate-200/80">{getFieldLabel(companySettings, "cartoon", t("CARTOON"))}</th>
                  <th className="py-3 px-2.5 w-24 text-right border-r border-slate-200/80">{getFieldLabel(companySettings, "rate", t("RATE (₹)"))}</th>
                  <th className="py-3 px-2.5 w-30 text-right border-r border-slate-200/80">{getFieldLabel(companySettings, "total_amount", t("AMOUNT (₹)*"))}</th>
                  <th className="py-3 px-1 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {lineItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-blue-50/15 transition-colors">
                    {/* INDEX */}
                    <td className="p-0 text-center font-mono font-bold text-slate-500 bg-slate-50/60 text-xs border-r border-slate-200/80 select-none align-middle h-11">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    {/* PARTICULARS */}
                    <td className="p-0 border-r border-slate-200/80 bg-white">
                      <input
                        id={`sales-cat-${index}`}
                        type="text"
                        value={item.category || ""}
                        onChange={(e) => handleUpdateLineItem(item.id, "category", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            document.getElementById(`sales-hsn-${index}`)?.focus();
                          }
                        }}
                        placeholder="e.g. D.No. 405 / Fabric / Saree"
                        className="w-full h-11 px-3 bg-transparent focus:bg-blue-50/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 font-bold text-slate-900 text-xs placeholder:text-slate-300 transition-all border-0 rounded-none"
                        required={index === 0}
                      />
                    </td>

                    {/* HSN CODE */}
                    <td className="p-0 border-r border-slate-200/80 bg-white">
                      <input
                        id={`sales-hsn-${index}`}
                        type="text"
                        value={item.hsn_code || ""}
                        onChange={(e) => handleUpdateLineItem(item.id, "hsn_code", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            document.getElementById(`sales-desc-${index}`)?.focus();
                          }
                        }}
                        placeholder="5407"
                        className="w-full h-11 px-2 bg-transparent focus:bg-blue-50/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 font-mono text-center font-bold text-slate-800 text-xs placeholder:text-slate-300 transition-all border-0 rounded-none"
                      />
                    </td>

                    {/* DESCRIPTION */}
                    <td className="p-0 border-r border-slate-200/80 bg-white">
                      <input
                        id={`sales-desc-${index}`}
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateLineItem(item.id, "description", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            document.getElementById(`sales-qty-${index}`)?.focus();
                          }
                        }}
                        placeholder="e.g. Heavy Embroidery Work"
                        className="w-full h-11 px-3 bg-transparent focus:bg-blue-50/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 font-medium text-slate-900 text-xs placeholder:text-slate-300 transition-all border-0 rounded-none"
                      />
                    </td>

                    {/* QUANTITY (METERS) */}
                    <td className="p-0 border-r border-slate-200/80 bg-white">
                      <input
                        id={`sales-qty-${index}`}
                        type="number"
                        step="any"
                        value={item.quantity || ""}
                        onChange={(e) => handleUpdateLineItem(item.id, "quantity", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            document.getElementById(`sales-weight-${index}`)?.focus();
                          }
                        }}
                        placeholder="420.5"
                        className="w-full h-11 px-2.5 bg-transparent focus:bg-blue-50/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 font-mono font-bold text-right text-slate-800 text-xs placeholder:text-slate-300 transition-all border-0 rounded-none"
                      />
                    </td>

                    {/* WEIGHT */}
                    <td className="p-0 border-r border-slate-200/80 bg-white">
                      <input
                        id={`sales-weight-${index}`}
                        type="number"
                        step="any"
                        value={item.weight || ""}
                        onChange={(e) => handleUpdateLineItem(item.id, "weight", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            document.getElementById(`sales-kg-${index}`)?.focus();
                          }
                        }}
                        placeholder="48.2"
                        className="w-full h-11 px-2.5 bg-transparent focus:bg-blue-50/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 font-mono font-bold text-right text-slate-800 text-xs placeholder:text-slate-300 transition-all border-0 rounded-none"
                      />
                    </td>

                    {/* KG */}
                    <td className="p-0 border-r border-slate-200/80 bg-white">
                      <input
                        id={`sales-kg-${index}`}
                        type="number"
                        step="any"
                        value={item.kg || ""}
                        onChange={(e) => handleUpdateLineItem(item.id, "kg", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            document.getElementById(`sales-cartoon-${index}`)?.focus();
                          }
                        }}
                        placeholder="0.00"
                        className="w-full h-11 px-2.5 bg-transparent focus:bg-blue-50/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 font-mono font-bold text-right text-slate-800 text-xs placeholder:text-slate-300 transition-all border-0 rounded-none"
                      />
                    </td>

                    {/* CARTOON */}
                    <td className="p-0 border-r border-slate-200/80 bg-white">
                      <input
                        id={`sales-cartoon-${index}`}
                        type="number"
                        step="any"
                        value={item.cartoon || ""}
                        onChange={(e) => handleUpdateLineItem(item.id, "cartoon", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            document.getElementById(`sales-rate-${index}`)?.focus();
                          }
                        }}
                        placeholder="2"
                        className="w-full h-11 px-2 bg-transparent focus:bg-blue-50/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 font-mono font-bold text-center text-slate-800 text-xs placeholder:text-slate-300 transition-all border-0 rounded-none"
                      />
                    </td>

                    {/* RATE */}
                    <td className="p-0 border-r border-slate-200/80 bg-white">
                      <div className="relative flex items-center h-full">
                        <span className="absolute left-2.5 font-mono text-xs font-bold text-slate-400 select-none">
                          ₹
                        </span>
                        <input
                          id={`sales-rate-${index}`}
                          type="number"
                          step="any"
                          min="0"
                          value={item.rate || ""}
                          onChange={(e) => handleUpdateLineItem(item.id, "rate", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              document.getElementById(`sales-amount-${index}`)?.focus();
                            }
                          }}
                          placeholder="0.00"
                          className="w-full h-11 pl-6 pr-2.5 bg-transparent focus:bg-blue-50/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 font-mono font-bold text-slate-800 text-xs text-right placeholder:text-slate-300 transition-all border-0 rounded-none"
                        />
                      </div>
                    </td>

                    {/* AMOUNT */}
                    <td className="p-0 border-r border-slate-200/80 bg-white">
                      <div className="relative flex items-center h-full">
                        <span className="absolute left-2.5 font-mono text-xs font-black text-slate-400 select-none">
                          ₹
                        </span>
                        <input
                          id={`sales-amount-${index}`}
                          type="number"
                          step="any"
                          min="0"
                          value={item.amount || ""}
                          onChange={(e) => handleUpdateLineItem(item.id, "amount", parseFloat(e.target.value) || 0)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (index < lineItems.length - 1) {
                                document.getElementById(`sales-cat-${index + 1}`)?.focus();
                              } else {
                                handleAddLineItem();
                                setTimeout(() => {
                                  document.getElementById(`sales-cat-${index + 1}`)?.focus();
                                }, 50);
                              }
                            }
                          }}
                          placeholder="0.00"
                          className="w-full h-11 pl-6 pr-2.5 bg-transparent focus:bg-blue-50/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 font-mono font-black text-slate-900 text-xs text-right placeholder:text-slate-300 transition-all border-0 rounded-none"
                        />
                      </div>
                    </td>

                    {/* REMOVE BUTTON */}
                    <td className="p-0 text-center bg-slate-50/40 align-middle">
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(item.id)}
                        className={`w-full h-11 flex items-center justify-center transition-colors cursor-pointer ${
                          lineItems.length > 1
                            ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
                        }`}
                        title="Remove Row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* TABLE FOOTER */}
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50/90 font-bold text-slate-700 h-11">
                  <td colSpan={4} className="py-2.5 px-3 text-xs text-slate-600 font-mono border-r border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 font-bold">
                        <span>{lineItems.length}</span>
                        <span>{lineItems.length === 1 ? (isGujarati ? "આઇટમ" : "Item") : (isGujarati ? "આઇટમો" : "Items")}</span>
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                        {isGujarati ? "કુલ સરવાળો (TOTAL):" : "TOTAL:"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800 border-r border-slate-200/80">
                    {totals.totalQty ? `${totals.totalQty}` : "-"}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800 border-r border-slate-200/80">
                    {totals.weight ? `${totals.weight}` : "-"}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800 border-r border-slate-200/80">
                    {totals.kg ? `${totals.kg}` : "-"}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800 border-r border-slate-200/80">
                    {totals.cartoon ? `${totals.cartoon}` : "-"}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-400 border-r border-slate-200/80">
                    -
                  </td>
                  <td className="py-2.5 px-2.5 text-right border-r border-slate-200/80">
                    <span className="font-mono font-black text-blue-700 text-xs">
                      ₹{totals.grossAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="bg-slate-50/90"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* BOX 3: SETTLEMENT & INVOICE ACCOUNTING SUMMARY */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs relative z-0">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* LEFT COLUMN: PAYMENT STATUS, CREDIT TERMS & REMARKS */}
            <div className="p-4 sm:p-5 md:pr-8 space-y-3.5">
              {/* PAYMENT STATUS TOGGLE */}
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-3 items-center text-xs">
                <label className="font-bold text-slate-800 uppercase tracking-wide block">
                  {isGujarati ? "પેમેન્ટ સ્થિતિ (STATUS)*" : "Payment Status*"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus("Pending")}
                    className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      paymentStatus === "Pending"
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isGujarati ? "બાકી / શાખ (Pending)" : "Pending / Credit"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStatus("Paid")}
                    className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      paymentStatus === "Paid"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isGujarati ? "ચુકતે (Paid / Settled)" : "Paid / Settled"}</span>
                  </button>
                </div>
              </div>

              {/* CREDIT TERMS / DAYS */}
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-3 items-center text-xs">
                <label className="font-bold text-slate-800 uppercase tracking-wide block">
                  {isGujarati ? "શાખ મુદત (CREDIT TERMS)" : "Credit Terms"}
                </label>
                <select
                  value={creditDays}
                  onChange={(e) => setCreditDays(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-9 px-3 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-bold text-slate-800 text-xs shadow-2xs focus:outline-none transition-all cursor-pointer"
                >
                  {TEXTILE_CREDIT_TERMS.map((term) => (
                    <option key={term.id} value={term.days}>
                      {term.name} ({term.labelGu})
                    </option>
                  ))}
                </select>
              </div>

              {/* REMARKS / NOTES */}
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-3 items-start text-xs pt-1">
                <label className="font-bold text-slate-800 uppercase tracking-wide block pt-2">
                  {isGujarati ? "નોંધ / રીમાર્કસ:" : "Remarks / Notes:"}
                </label>
                <div className="space-y-1">
                  <textarea
                    id="notes-input"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isGujarati ? "બિલ પર છાપવા માટે કોઈ વધારાની નોંધ અથવા શરતો..." : "Add optional notes (Press Enter to Save Bill)..."}
                    className="w-full p-2.5 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-medium text-slate-900 text-xs shadow-2xs focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: BILL ACCOUNTING SUMMARY */}
            <div className="p-4 sm:p-5 md:pl-8 space-y-3.5">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-100 pb-2">
                {isGujarati ? "હિસાબ સારાંશ (BILL ACCOUNTING SUMMARY)" : "Bill Accounting Summary"}
              </h4>

              {/* Items Gross Total */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold uppercase tracking-wider text-[11px]">
                  {isGujarati ? "કરપાત્ર રકમ (Items Gross):" : "Items Gross Total:"}
                </span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{totals.grossAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Applied GST Breakdown */}
              {taxCalculations.mode === "cgst_sgst" && (
                <div className="space-y-1 text-xs text-slate-600 border-l-2 border-blue-500 pl-2 py-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[11px]">CGST ({taxCalculations.rate / 2}%):</span>
                    <span className="font-mono font-bold text-slate-800">
                      + ₹{taxCalculations.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[11px]">SGST ({taxCalculations.rate / 2}%):</span>
                    <span className="font-mono font-bold text-slate-800">
                      + ₹{taxCalculations.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {taxCalculations.mode === "igst" && (
                <div className="flex items-center justify-between text-xs text-slate-600 border-l-2 border-indigo-500 pl-2 py-0.5">
                  <span className="font-medium text-[11px]">IGST ({taxCalculations.rate}%):</span>
                  <span className="font-mono font-bold text-slate-800">
                    + ₹{taxCalculations.igst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {taxCalculations.mode === "none" && (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium text-[11px]">{isGujarati ? "લાગુ પડતો જીએસટી (0%):" : "Applied GST (0%):"}</span>
                  <span className="font-mono font-bold">₹0.00</span>
                </div>
              )}

              {/* Total Item & Quantity */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold uppercase tracking-wider text-[11px]">
                  {isGujarati ? "કુલ તાકા અને મીટર:" : "Total Item & Quantity:"}
                </span>
                <span className="font-mono font-bold text-blue-700">
                  {totals.totalItems} Items • {totals.totalQty} Qty
                </span>
              </div>

              {/* Due Date Display */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span className="font-bold uppercase tracking-wider text-[11px]">
                  {isGujarati ? "ચુકવણી મુદત તારીખ:" : "Settlement Due Date:"}
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {paymentStatus === "Paid" ? (isGujarati ? "રોકડા / ચૂકતે (Paid)" : "Immediate (Paid)") : `${calculatedDueDate} (${creditDays}d)`}
                </span>
              </div>

              {/* Final Total Amount */}
              <div className="flex items-center justify-between gap-4 text-xs pt-2 border-t border-slate-200">
                <div className="shrink-0">
                  <label className="font-bold text-slate-800 uppercase tracking-wide whitespace-nowrap block">
                    {isGujarati ? "કુલ બિલ રકમ (Grand Total)*" : "Total Bill Amount (₹)*"}
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {isGujarati ? "(ટેક્સ સહિત કુલ રકમ)" : "(Net Payable with GST)"}
                  </span>
                </div>
                <div className="relative flex-1 max-w-[200px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-black text-blue-700 select-none">
                    ₹
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={Math.round(taxCalculations.grandTotal).toLocaleString("en-IN")}
                    className="w-full h-10 pl-7 pr-3 bg-blue-50/60 border border-blue-200 rounded-xl font-mono text-base font-black text-blue-700 text-right shadow-2xs cursor-default"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. BOTTOM ACTION BAR (MATCHING SALES CHALLAN) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 py-3 px-4 sm:px-6 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">
              {lineItems.length} {lineItems.length === 1 ? "Item" : "Items"} • ₹{Math.round(taxCalculations.grandTotal).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/sales-invoices"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              {isGujarati ? "રદ કરો (Cancel)" : "Cancel"}
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isSaving
                  ? (isGujarati ? "સાચવી રહ્યું છે..." : "Saving...")
                  : (isGujarati ? "સેલ્સ બિલ સાચવો (Save Sales Invoice)" : "Save Sales Invoice")}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewSalesInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold text-xs">Loading form...</div>}>
      <NewSalesInvoiceContent />
    </Suspense>
  );
}
