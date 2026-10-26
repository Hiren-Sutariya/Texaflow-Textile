"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getTenantItem, setTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { useLanguage } from "@/context/LanguageContext";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import {
  SalesChallan,
  SalesLineItem,
  getStoredSalesChallans,
  saveSalesChallan,
  getNextSalesChallanNo
} from "@/lib/salesStorage";
import { parseAnyDate, calculateDueDate, TEXTILE_CREDIT_TERMS } from "@/lib/creditTerms";
import { getStoredCompanySettings, fetchLiveCompanySettings, CompanySettings, getFieldLabel } from "@/lib/companySettings";
import {
  ArrowLeft,
  Search,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  X,
  Save,
  CheckCircle2,
  Clock
} from "lucide-react";

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

  return (
    <div ref={containerRef} className={`relative inline-block w-full select-none ${className}`}>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 bg-white border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""
        }`}
      >
        <span className={`font-mono text-xs font-bold ${value ? "text-slate-900" : "text-slate-400"}`}>
          {value || placeholder}
        </span>
        <Calendar className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
      </button>

      {isOpen && (
        <div className="absolute z-[100] right-0 sm:left-0 sm:right-auto mt-1 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-xs text-slate-800">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase mb-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <span key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dStr = String(day).padStart(2, "0");
              const mStr = String(viewMonth + 1).padStart(2, "0");
              const currentStr = `${dStr}-${mStr}-${viewYear}`;
              const isSelected = value === currentStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 mx-auto rounded-lg font-mono text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white font-extrabold shadow-sm"
                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-600"
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

function NewSalesChallanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id") || searchParams.get("edit");
  const isEditMode = Boolean(editId);
  const { t } = useLanguage();

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => getStoredCompanySettings());

  useEffect(() => {
    fetchLiveCompanySettings().then((s) => {
      if (s) setCompanySettings(s);
    });
  }, []);

  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState(getTodayStr());
  const [customerName, setCustomerName] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const [customersList, setCustomersList] = useState<string[]>([]);

  const [transport, setTransport] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [creditDays, setCreditDays] = useState<number>(30);
  const [billingStatus, setBillingStatus] = useState<"Unbilled" | "Billed">("Unbilled");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Line items with CATEGORY, HSN CODE, ITEM, QUANTITY matching requirements
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
    const partySet = new Set<string>();

    try {
      const savedVendors = getTenantItem<any[]>("texaflow_vendors");
      if (Array.isArray(savedVendors)) {
        savedVendors.forEach((v) => {
          const name = v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim();
          if (name) partySet.add(name);
        });
      }
    } catch {}

    try {
      const savedChallans = getStoredSalesChallans();
      savedChallans.forEach((c) => {
        if (c.party_name) partySet.add(c.party_name);
      });
    } catch {}

    setCustomersList(Array.from(partySet).sort());
  }, []);

  // Populate on edit mode or assign next challan no
  useEffect(() => {
    if (editId) {
      const list = getStoredSalesChallans();
      const matched = list.find((c) => c.id === editId || c.challan_no === editId);
      if (matched) {
        setChallanNo(matched.challan_no || "");
        setChallanDate(matched.date || getTodayStr());
        setCustomerName(matched.party_name || "");
        setTransport(matched.transport || "");
        setVehicleNo(matched.vehicle_no || "");
        setCreditDays(matched.credit_days || 30);
        setBillingStatus(matched.billing_status || "Unbilled");
        setNotes(matched.notes || "");
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

    // Default next challan no (starting 101, 102...)
    const nextNo = getNextSalesChallanNo();
    setChallanNo(nextNo);
  }, [editId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerName.trim()) return customersList;
    return customersList.filter((c) => c.toLowerCase().includes(customerName.toLowerCase().trim()));
  }, [customersList, customerName]);

  const handleCustomerSelect = (name: string) => {
    setCustomerName(name);
    setIsCustomerDropdownOpen(false);
    setTimeout(() => {
      document.getElementById("challan-no-input")?.focus();
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
    let amount = 0;

    lineItems.forEach((it) => {
      totalItems += parseFloat(String(it.item || it.takka || "")) || 0;
      totalQty += parseFloat(String(it.quantity || it.meters || "")) || 0;
      weight += parseFloat(String(it.weight || "")) || 0;
      kg += parseFloat(String(it.kg || "")) || 0;
      cartoon += parseFloat(String(it.cartoon || "")) || 0;
      amount += parseFloat(String(it.amount || "")) || 0;
    });

    return {
      totalItems: Math.round(totalItems),
      totalQty: Math.round(totalQty * 10) / 10,
      weight: Math.round(weight * 100) / 100,
      kg: Math.round(kg * 100) / 100,
      cartoon: Math.round(cartoon),
      amount: Math.round(amount * 100) / 100
    };
  }, [lineItems]);

  const calculatedDueDate = useMemo(() => {
    return calculateDueDate(challanDate, creditDays);
  }, [challanDate, creditDays]);

  const handleSaveChallan = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (isSaving) return;

    if (!customerName.trim()) {
      alert(t("Please select or enter party name."));
      return;
    }

    if (!challanNo.trim()) {
      alert(t("Please enter Challan No."));
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
      alert(t("Please add at least one line item with Category, Description or Amount."));
      return;
    }

    setIsSaving(true);
    const currentCid = getStoredCompanyId() || "comp-001";
    const recordId = isEditMode && editId ? editId : `sc-${challanNo.trim()}-${Date.now()}`;

    const payload: SalesChallan = {
      id: recordId,
      company_id: currentCid,
      challan_no: challanNo.trim(),
      date: challanDate.trim(),
      party_name: customerName.trim(),
      transport: transport.trim() || undefined,
      vehicle_no: vehicleNo.trim() || undefined,
      credit_days: creditDays,
      due_date: calculatedDueDate,
      billing_status: billingStatus,
      notes: notes.trim() || undefined,
      items: validItems,
      total_item: totals.totalItems,
      total_quantity: totals.totalQty,
      total_takka: totals.totalItems,
      total_meters: totals.totalQty,
      total_weight: totals.weight,
      total_cartoon: totals.cartoon,
      total_amount: totals.amount
    };

    saveSalesChallan(payload);
    router.push("/sales");
  };

  return (
    <div className="w-full space-y-3.5 select-none pb-24 animate-in fade-in duration-150 text-xs font-sans">
      {/* 1. TOP HEADER TOOLBAR - EXACT MATCH TO IMAGE 4 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-3 flex items-center justify-between gap-3 text-xs">
        <h2 className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">
          {isEditMode ? t("EDIT SALES CHALLAN") : t("NEW SALES CHALLAN (નવું જાવક ચલણ)")}
        </h2>
        <Link
          href="/sales"
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("Back to Sales List")}</span>
        </Link>
      </div>

      <form
        onSubmit={handleSaveChallan}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleSaveChallan();
          }
        }}
        className="space-y-3.5 pb-28"
      >
        {/* BOX 1: CUSTOMER & CHALLAN SPECIFICATIONS (Broker removed) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* LEFT COLUMN: CUSTOMER / PARTY */}
            <div className="p-4 sm:p-5 md:pr-8 space-y-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                {getFieldLabel(companySettings, "party_name", t("Customer / Party*"))}
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
                            (v) => v.toLowerCase() === customerName.toLowerCase().trim()
                          );
                          if (exact) {
                            handleCustomerSelect(exact);
                          } else if (customerName.trim().length > 0) {
                            handleCustomerSelect(filteredCustomers[0]);
                          }
                        }
                        setIsCustomerDropdownOpen(false);
                        setTimeout(() => {
                          document.getElementById("challan-no-input")?.focus();
                        }, 50);
                      }
                    }}
                    placeholder={t("Search or enter party name...")}
                    className="w-full h-9 pl-9 pr-14 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-bold text-slate-900 text-xs shadow-2xs focus:outline-none transition-all"
                    required
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {customerName && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerName("");
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
                        const isSelected = customerName.toLowerCase().trim() === v.toLowerCase().trim();
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => handleCustomerSelect(v)}
                            className={`w-full text-left px-3 py-2 hover:bg-blue-50/70 rounded-xl font-bold text-slate-800 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50 text-blue-900 font-extrabold" : ""
                            }`}
                          >
                            <span className="truncate">{v}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: CHALLAN SPECIFICATIONS */}
            <div className="p-4 sm:p-5 md:pl-8 space-y-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                {t("Challan Specifications*")}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* CHALLAN NO */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    {getFieldLabel(companySettings, "challan_no", t("Challan No*"))}
                  </span>
                  <input
                    id="challan-no-input"
                    type="text"
                    value={challanNo}
                    onChange={(e) => setChallanNo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        document.getElementById("challan-date-btn")?.focus();
                      }
                    }}
                    placeholder="e.g. 101"
                    className="w-full h-9 px-3 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono font-bold text-slate-900 text-xs shadow-2xs focus:outline-none transition-all"
                    required
                  />
                </div>

                {/* CHALLAN DATE */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    {t("Challan / Outward Date*")}
                  </span>
                  <CustomDatePicker
                    id="challan-date-btn"
                    value={challanDate}
                    onChange={(newDate) => setChallanDate(newDate)}
                    onEnterNext={() => {
                      document.getElementById("transport-input")?.focus();
                    }}
                    placeholder="DD-MM-YYYY"
                  />
                </div>
              </div>

              {/* TRANSPORT & VEHICLE NO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    {t("Transport Name")}
                  </span>
                  <input
                    id="transport-input"
                    type="text"
                    value={transport}
                    onChange={(e) => setTransport(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        document.getElementById("vehicle-input")?.focus();
                      }
                    }}
                    placeholder="e.g. Surat City Goods"
                    className="w-full h-9 px-3 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-medium text-slate-900 text-xs shadow-2xs focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    {t("Vehicle No")}
                  </span>
                  <input
                    id="vehicle-input"
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        document.getElementById("sales-cat-0")?.focus();
                      }
                    }}
                    placeholder="e.g. GJ-05-BX-4120"
                    className="w-full h-9 px-3 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono font-bold uppercase text-slate-900 text-xs shadow-2xs focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOX 2: SALES ITEMS / MATERIALS BREAKDOWN (CATEGORY, HSN, ITEM, QUANTITY) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative z-10">
          {/* HEADER TOOLBAR */}
          <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2.5">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
              {t("Sales Items / Materials Breakdown")}
            </h3>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="h-8.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t("Add Item Row")}</span>
            </button>
          </div>

          {/* TABLE - SEAMLESS FULL-WIDTH GRID (MATCHING LISTING TABLE STYLE & HEIGHT) */}
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

                    {/* PERTICULARS (Multiple items: Design, Fabric, Quality, Saree, etc.) */}
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

                    {/* HSN CODE (NOT PRE-FILLED, BLANK BY DEFAULT) */}
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

                    {/* QUANTITY (Renamed from Meters) */}
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
                        <span>{lineItems.length === 1 ? t("Item") : t("Items")}</span>
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                        {t("Total")}:
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
                    <span className="font-mono font-black text-slate-900 text-xs">
                      ₹{totals.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="bg-slate-50/90"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* BOX 3: SETTLEMENT & CHALLAN ACCOUNTING SUMMARY */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs relative z-0">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* LEFT COLUMN: BILLING STATUS & REMARKS (Broker removed) */}
            <div className="p-4 sm:p-5 md:pr-8 space-y-3.5">
              {/* BILLING STATUS TOGGLE */}
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-3 items-center text-xs">
                <label className="font-bold text-slate-800 uppercase tracking-wide block">
                  {t("Payment Status*")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillingStatus("Unbilled")}
                    className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      billingStatus === "Unbilled"
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t("Pending / Credit")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingStatus("Billed")}
                    className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      billingStatus === "Billed"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t("Paid / Settled")}</span>
                  </button>
                </div>
              </div>

              {/* CREDIT TERMS / DAYS */}
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-3 items-center text-xs">
                <label className="font-bold text-slate-800 uppercase tracking-wide block">
                  {t("Credit Terms")}
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
                  {t("Remarks / Notes:")}
                </label>
                <div className="space-y-1">
                  <textarea
                    id="notes-input"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add optional notes (Press Enter to Save Bill)..."
                    className="w-full p-2.5 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-medium text-slate-900 text-xs shadow-2xs focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: BILL ACCOUNTING SUMMARY */}
            <div className="p-4 sm:p-5 md:pl-8 space-y-3.5">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-100 pb-2">
                {t("Bill Accounting Summary")}
              </h4>

              {/* Items Gross Total */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold uppercase tracking-wider text-[11px]">{t("Items Gross Total:")}</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{totals.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Total Item & Quantity */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold uppercase tracking-wider text-[11px]">{t("Total Item & Quantity:")}</span>
                <span className="font-mono font-bold text-blue-700">
                  {totals.totalItems} Items • {totals.totalQty} Qty
                </span>
              </div>

              {/* Due Date Display */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span className="font-bold uppercase tracking-wider text-[11px]">{t("Settlement Due Date:")}</span>
                <span className="font-mono font-bold text-slate-800">
                  {billingStatus === "Billed" ? t("Immediate (Paid)") : `${calculatedDueDate} (${creditDays}d)`}
                </span>
              </div>

              {/* Final Total Amount */}
              <div className="flex items-center justify-between gap-4 text-xs pt-2 border-t border-slate-200">
                <div className="shrink-0">
                  <label className="font-bold text-slate-800 uppercase tracking-wide whitespace-nowrap block">
                    {t("Total Bill Amount (₹)*")}
                  </label>
                </div>
                <div className="w-52 sm:w-60 shrink-0 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={totals.amount}
                    readOnly
                    className="w-full h-9 pl-7 pr-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-slate-900 text-sm shadow-2xs focus:outline-none transition-all text-right"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* UNIFIED STATIC / FIXED ACTIONS FOOTER BAR */}
      <BottomActionBar
        showSynced={true}
        rightContent={
          <>
            <Link
              href="/sales"
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs transition-colors cursor-pointer shadow-2xs"
            >
              {t("Cancel")}
            </Link>
            <button
              id="save-challan-btn"
              type="button"
              disabled={isSaving}
              onClick={handleSaveChallan}
              className={`px-5 py-2 font-extrabold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all ${
                isSaving
                  ? "bg-blue-400 text-white cursor-not-allowed pointer-events-none opacity-80"
                  : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t("Saving Challan...")}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditMode ? t("Update Sales Challan") : t("Save Sales Challan")}</span>
                </>
              )}
            </button>
          </>
        }
      />
    </div>
  );
}

export default function NewSalesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
      <NewSalesChallanContent />
    </Suspense>
  );
}
