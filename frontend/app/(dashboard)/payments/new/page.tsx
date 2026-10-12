"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  Plus,
  Settings,
  Users,
  Search,
  Eye,
  X,
  Calendar,
  FileText
} from "lucide-react";

// Paying Companies / Internal Firms List
const payingCompanyOptions = [
  "Om Sai Fabrics (Main Account)",
  "Sai Creation Firm",
  "Shreeji Textiles",
  "Global Exports"
];

export interface VendorItemState {
  id: string;
  name: string;
  type: "SUPPLIER" | "PARTY";
  visible: boolean;
}

// Default Vendors & Parties List
const initialVendorsList: VendorItemState[] = [
  { id: "v1", name: "DIGISCALE", type: "SUPPLIER", visible: true },
  { id: "v2", name: "Expense: Tea & Refreshments", type: "PARTY", visible: true },
  { id: "v3", name: "Swami", type: "PARTY", visible: true },
  { id: "v4", name: "ABC Tex Fabrics", type: "SUPPLIER", visible: true },
  { id: "v5", name: "Hariom Yarns & Thread Vendor", type: "SUPPLIER", visible: true },
  { id: "v6", name: "Radha Dress Creation", type: "PARTY", visible: true },
  { id: "v7", name: "Surat Silk House", type: "PARTY", visible: true },
  { id: "v8", name: "Shree Ram Synthetics", type: "SUPPLIER", visible: true }
];

const linkedSourceOptions = [
  "ON-ACCOUNT / GENERAL PAYMENT",
  "Job Process Challan"
];

const paymentModeOptions = [
  "BANK TRANSFER (NEFT/RTGS/IMPS)",
  "UPI (GPay / PhonePe / Paytm)",
  "Cash",
  "Cheque"
];

export default function NewPaymentVoucherPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  // Form State (NO PREFILLED DEFAULTS - STARTS EMPTY AS REQUESTED)
  const [formType, setFormType] = useState<"Payment Out" | "Receipt In">("Payment Out");
  const [payingCompany, setPayingCompany] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [formVoucherDate, setFormVoucherDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formLinkedSource, setFormLinkedSource] = useState(
    "ON-ACCOUNT / GENERAL PAYMENT"
  );
  const [formAmount, setFormAmount] = useState("");
  const [formMode, setFormMode] = useState("BANK TRANSFER (NEFT/RTGS/IMPS)");
  const [formRefNo, setFormRefNo] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Vendor List Visibility State
  const [vendorsList, setVendorsList] = useState<VendorItemState[]>(initialVendorsList);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageSearchQuery, setManageSearchQuery] = useState("");

  // Custom Dropdown Open States
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isChallanDropdownOpen, setIsChallanDropdownOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState("");

  // DatePicker Calendar View Navigation State
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const companyRef = useRef<HTMLDivElement>(null);
  const supplierRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const challanRef = useRef<HTMLDivElement>(null);

  // Filter visible vendors for dropdown menu
  const visibleVendors = vendorsList.filter((v) => v.visible);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
      if (supplierRef.current && !supplierRef.current.contains(e.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
      if (sourceRef.current && !sourceRef.current.contains(e.target as Node)) {
        setIsSourceDropdownOpen(false);
      }
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) {
        setIsModeDropdownOpen(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
      if (challanRef.current && !challanRef.current.contains(e.target as Node)) {
        setIsChallanDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleVendorVisibility = (id: string) => {
    setVendorsList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    );
  };

  const toggleGroupVisibility = (type: "SUPPLIER" | "PARTY") => {
    const groupItems = vendorsList.filter((v) => v.type === type);
    const allVisible = groupItems.every((v) => v.visible);

    setVendorsList((prev) =>
      prev.map((item) =>
        item.type === type ? { ...item, visible: !allVisible } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingRef.current) return;

    if (!payingCompany || !supplierName || !formAmount) {
      alert("Please select Paying Company, Supplier/Vendor Name, and enter Amount.");
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      let assignedId = `pay-${Date.now()}`;
      let finalVoucherNo = `VOU-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`;

      try {
        const backendRes = await fetchApi<any>("/payments", {
          method: "POST",
          body: JSON.stringify({
            voucher_no: finalVoucherNo,
            voucher_type: formType,
            date: formVoucherDate,
            party_name: supplierName,
            amount: parseFloat(formAmount) || 0,
            payment_mode: formMode,
            bank_account: bankDetails || "HDFC Bank Main A/c",
            reference_no: formRefNo || `REF-${Math.floor(Math.random() * 89999 + 10000)}`,
            status: "Paid",
            remarks: formNotes || "Payment voucher transaction entry"
          })
        });
        if (backendRes?.id) {
          assignedId = backendRes.id;
          if (backendRes.voucher_no) finalVoucherNo = backendRes.voucher_no;
        }
      } catch (err) {
        console.warn("Backend payment voucher sync fallback", err);
      }

      const newVoucher = {
        id: assignedId,
        voucher_no: finalVoucherNo,
        date: formVoucherDate,
        party_name: supplierName,
        paying_company: payingCompany,
        type: formType,
        linked_source: formLinkedSource as any,
        amount: parseFloat(formAmount) || 0,
        mode: formMode,
        ref_no: formRefNo || `REF-${Math.floor(Math.random() * 89999 + 10000)}`,
        bank_details: bankDetails || "HDFC Bank Main A/c",
        notes: formNotes || "Payment voucher transaction entry"
      };

      // Save to localStorage
      try {
        const existing = localStorage.getItem("om_sai_vouchers");
        const list = existing ? JSON.parse(existing) : [];
        list.unshift(newVoucher);
        localStorage.setItem("om_sai_vouchers", JSON.stringify(list));
      } catch (err) {
        console.error(err);
      }

      alert(`Payment Voucher (${newVoucher.voucher_no}) created successfully!`);
      router.push("/payments");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };


  return (
    <div className="w-full space-y-3.5 select-none pb-20 animate-in fade-in duration-150 text-xs font-sans">
      
      {/* 1. TOP HEADER TOOLBAR - MATCHING VENDORS PAGE BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
        <h2 className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">
          NEW PAYMENT VOUCHER REGISTRATION
        </h2>
        <Link
          href="/payments"
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Voucher List</span>
        </Link>
      </div>

      {/* 2. FORM CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ROW 1: VOUCHER TYPE */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">Voucher Type*</label>
            <div className="flex items-center gap-2 sm:gap-3 max-w-xl w-full">
              <button
                type="button"
                onClick={() => setFormType("Payment Out")}
                className={`flex-1 sm:flex-initial justify-center px-3 sm:px-4 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                  formType === "Payment Out"
                    ? "bg-rose-50 text-rose-600 border-rose-400 ring-2 ring-rose-500/20 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                <span>Payment Out</span>
                {formType === "Payment Out" && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 ml-1" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setFormType("Receipt In")}
                className={`flex-1 sm:flex-initial justify-center px-3 sm:px-4 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                  formType === "Receipt In"
                    ? "bg-blue-50 text-blue-700 border-blue-400 ring-2 ring-blue-500/20 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Payment In</span>
                {formType === "Receipt In" && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 ml-1" />
                )}
              </button>
            </div>
          </div>

          {/* ROW 2: PAYING COMPANY / INTERNAL FIRM * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-bold text-slate-700">Paying Company*</label>
            <div ref={companyRef} className="relative max-w-xl w-full">
              <button
                type="button"
                onClick={() => {
                  setIsCompanyDropdownOpen((prev) => {
                    if (!prev) {
                      setIsSupplierDropdownOpen(false);
                      setIsSourceDropdownOpen(false);
                      setIsModeDropdownOpen(false);
                      setIsDatePickerOpen(false);
                    }
                    return !prev;
                  });
                }}
                className={`w-full h-9 px-3 bg-white border rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                  isCompanyDropdownOpen
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-slate-300 hover:border-blue-400"
                }`}
              >
                <span className={`truncate ${!payingCompany ? "text-slate-400 font-normal" : "font-semibold"}`}>
                  {payingCompany || "Select Paying Company"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isCompanyDropdownOpen ? "rotate-180 text-blue-600" : ""}`} />
              </button>

              {isCompanyDropdownOpen && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full w-full bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-0.5 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                  {payingCompanyOptions.map((comp) => {
                    const isSelected = payingCompany === comp;
                    return (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => {
                          setPayingCompany(comp);
                          setIsCompanyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50 text-blue-900 font-extrabold"
                            : "text-slate-700 hover:bg-slate-50 font-semibold"
                        }`}
                      >
                        <span className="truncate">{comp}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ROW 3: SUPPLIER / VENDOR NAME * (DIRECT VENDOR REDIRECT & MANAGE MODAL) */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">Supplier / Vendor*</label>
            <div ref={supplierRef} className="relative max-w-xl w-full">
              <button
                type="button"
                onClick={() => {
                  setIsSupplierDropdownOpen((prev) => {
                    if (!prev) {
                      setIsCompanyDropdownOpen(false);
                      setIsSourceDropdownOpen(false);
                      setIsModeDropdownOpen(false);
                      setIsDatePickerOpen(false);
                    }
                    return !prev;
                  });
                }}
                className={`w-full h-9 px-3 bg-white border rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                  isSupplierDropdownOpen
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-slate-300 hover:border-blue-400"
                }`}
              >
                <span className={`truncate ${!supplierName ? "text-slate-400 font-normal" : "font-semibold"}`}>
                  {supplierName || "Select Supplier / Vendor"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isSupplierDropdownOpen ? "rotate-180 text-blue-600" : ""}`} />
              </button>

              {/* SUPPLIER DROPDOWN WITH DIRECT + ADD & SETTINGS MANAGE BUTTON */}
              {isSupplierDropdownOpen && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full w-full bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="max-h-48 overflow-y-auto space-y-0.5 no-scrollbar">
                    {visibleVendors.length === 0 ? (
                      <div className="py-4 text-center text-slate-400 font-medium">
                        No visible vendors found.
                      </div>
                    ) : (
                      visibleVendors.map((opt) => {
                        const isSelected = supplierName === opt.name;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSupplierName(opt.name);
                              setIsSupplierDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-blue-50 text-blue-900 font-extrabold"
                                : "text-slate-700 hover:bg-slate-50 font-semibold"
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900">{opt.name}</span>
                              <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">
                                {opt.type}
                              </span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2 stroke-[2.5]" />}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* BOTTOM ACTION BUTTONS: + ADD REDIRECTS DIRECTLY TO VENDORS FORM, MANAGE OPENS MODAL */}
                  <div className="pt-1.5 border-t border-slate-100 grid grid-cols-2 gap-2 mt-0.5">
                    <Link
                      href="/vendors?action=new"
                      onClick={() => setIsSupplierDropdownOpen(false)}
                      className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-200/60"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSupplierDropdownOpen(false);
                        setIsManageModalOpen(true);
                      }}
                      className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200/60"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Manage</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ROW 4: VOUCHER DATE * (CUSTOM BEAUTIFUL DATE PICKER) */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">Voucher Date*</label>
            <div ref={datePickerRef} className="relative max-w-xl w-full">
              <button
                type="button"
                onClick={() => {
                  setIsDatePickerOpen((prev) => {
                    if (!prev) {
                      setIsCompanyDropdownOpen(false);
                      setIsSupplierDropdownOpen(false);
                      setIsSourceDropdownOpen(false);
                      setIsModeDropdownOpen(false);
                    }
                    return !prev;
                  });
                }}
                className={`w-full h-9 px-3 bg-white border rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                  isDatePickerOpen
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-slate-300 hover:border-blue-400"
                }`}
              >
                <span>
                  {(() => {
                    if (!formVoucherDate) return "Select Voucher Date";
                    const [y, m, d] = formVoucherDate.split("-");
                    return `${d} / ${m} / ${y}`;
                  })()}
                </span>
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              </button>

              {isDatePickerOpen && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 w-64 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                  {/* CALENDAR MONTH/YEAR NAV */}
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
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][viewMonth]} {viewYear}
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

                  {/* DAY NAMES */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>

                  {/* DAYS GRID */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const firstDay = new Date(viewYear, viewMonth, 1).getDay();
                      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
                      const items = [];

                      for (let i = 0; i < firstDay; i++) {
                        items.push(<div key={`empty-${i}`} className="h-7" />);
                      }

                      for (let day = 1; day <= daysInMonth; day++) {
                        const mStr = String(viewMonth + 1).padStart(2, "0");
                        const dStr = String(day).padStart(2, "0");
                        const dateStr = `${viewYear}-${mStr}-${dStr}`;
                        const isSelected = formVoucherDate === dateStr;
                        const isToday = new Date().toISOString().split("T")[0] === dateStr;

                        items.push(
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              setFormVoucherDate(dateStr);
                              setIsDatePickerOpen(false);
                            }}
                            className={`h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 text-white shadow-2xs font-extrabold ring-2 ring-blue-500/20"
                                : isToday
                                ? "bg-blue-50 text-blue-700 font-extrabold border border-blue-200"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      }
                      return items;
                    })()}
                  </div>

                  {/* FOOTER QUICK ACTIONS */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        const todayStr = new Date().toISOString().split("T")[0];
                        setFormVoucherDate(todayStr);
                        setViewYear(new Date().getFullYear());
                        setViewMonth(new Date().getMonth());
                        setIsDatePickerOpen(false);
                      }}
                      className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                    >
                      Select Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDatePickerOpen(false)}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ROW 5: LINKED SOURCE */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-bold text-slate-700">Linked Source</label>
            <div ref={sourceRef} className="relative max-w-xl w-full">
              <button
                type="button"
                onClick={() => {
                  setIsSourceDropdownOpen((prev) => {
                    if (!prev) {
                      setIsCompanyDropdownOpen(false);
                      setIsSupplierDropdownOpen(false);
                      setIsModeDropdownOpen(false);
                      setIsDatePickerOpen(false);
                    }
                    return !prev;
                  });
                }}
                className={`w-full h-9 px-3 bg-white border rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                  isSourceDropdownOpen
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-slate-300 hover:border-blue-400"
                }`}
              >
                <span className="truncate">{formLinkedSource}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isSourceDropdownOpen ? "rotate-180 text-blue-600" : ""}`} />
              </button>

              {isSourceDropdownOpen && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full w-full bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {linkedSourceOptions.map((opt) => {
                    const isSelected = formLinkedSource === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setFormLinkedSource(opt);
                          setIsSourceDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50 text-blue-900 font-extrabold"
                            : "text-slate-700 hover:bg-slate-50 font-semibold"
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CONDITIONAL SUB-BOX: SELECT PENDING JOB PROCESS CHALLAN (EXACT MATCHING USER'S IMAGE 4 & 5) */}
          {(formLinkedSource === "Job Process Challan" || formLinkedSource.includes("Job Process")) && (
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-start text-xs">
              <div />
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/90 space-y-2 max-w-xl w-full animate-in fade-in duration-150 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>SELECT PENDING JOB PROCESS CHALLAN</span>
                </div>
                
                {/* SELECT CHALLAN DROPDOWN */}
                <div ref={challanRef} className="relative w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChallanDropdownOpen((prev) => {
                        if (!prev) {
                          setIsCompanyDropdownOpen(false);
                          setIsSupplierDropdownOpen(false);
                          setIsSourceDropdownOpen(false);
                          setIsModeDropdownOpen(false);
                          setIsDatePickerOpen(false);
                        }
                        return !prev;
                      });
                    }}
                    className={`w-full h-9 px-3 bg-white border rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                      isChallanDropdownOpen
                        ? "border-amber-500 ring-2 ring-amber-500/20 text-slate-900"
                        : selectedChallan
                        ? "border-slate-300 text-slate-900 font-bold"
                        : "border-slate-300 text-slate-400 font-semibold hover:border-amber-400"
                    }`}
                  >
                    <span className="truncate">
                      {selectedChallan || "-- SELECT CHALLAN --"}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isChallanDropdownOpen ? "rotate-180 text-amber-600" : ""}`} />
                  </button>

                  {isChallanDropdownOpen && (
                    <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full w-full bg-white border border-slate-200 rounded-xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-100">
                      <div className="py-2 text-center text-slate-400 text-xs font-semibold">
                        No options available
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ROW 6: AMOUNT (₹) * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">Amount (₹)*</label>
            <input
              type="number"
              required
              step="0.01"
              placeholder="0.00"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              className="h-9 px-3 max-w-xl w-full bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
            />
          </div>

          {/* ROW 7: PAYMENT MODE */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-bold text-slate-700">Payment Mode</label>
            <div ref={modeRef} className="relative max-w-xl w-full">
              <button
                type="button"
                onClick={() => {
                  setIsModeDropdownOpen((prev) => {
                    if (!prev) {
                      setIsCompanyDropdownOpen(false);
                      setIsSupplierDropdownOpen(false);
                      setIsSourceDropdownOpen(false);
                      setIsDatePickerOpen(false);
                    }
                    return !prev;
                  });
                }}
                className={`w-full h-9 px-3 bg-white border rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                  isModeDropdownOpen
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-slate-300 hover:border-blue-400"
                }`}
              >
                <span className="truncate">{formMode}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isModeDropdownOpen ? "rotate-180 text-blue-600" : ""}`} />
              </button>

              {isModeDropdownOpen && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full w-full bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {paymentModeOptions.map((opt) => {
                    const isSelected = formMode === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setFormMode(opt);
                          setIsModeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50 text-blue-900 font-extrabold"
                            : "text-slate-700 hover:bg-slate-50 font-semibold"
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ROW 8: REF / UTR NO */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-bold text-slate-700">Ref / UTR No</label>
            <input
              type="text"
              placeholder="e.g. UTR12345678"
              value={formRefNo}
              onChange={(e) => setFormRefNo(e.target.value)}
              className="h-9 px-3 max-w-xl w-full bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
            />
          </div>

          {/* ROW 9: BANK DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-bold text-slate-700">Bank Details</label>
            <input
              type="text"
              placeholder="e.g. HDFC Bank Main A/c"
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              className="h-9 px-3 max-w-xl w-full bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
            />
          </div>

          {/* ROW 10: REMARKS / NOTES */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-start text-xs pt-1">
            <label className="font-bold text-slate-700 pt-2">Remarks / Notes</label>
            <textarea
              rows={3}
              placeholder="Add optional payment notes..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="p-3 max-w-xl w-full bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all shadow-2xs"
            />
          </div>

        </form>
      </div>

      {/* 3. STATIC / FIXED ACTIONS FOOTER BAR */}
      <div className="fixed bottom-0 left-0 lg:left-[250px] right-0 z-40 h-[57px] bg-white border-t border-slate-200 px-6 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span>Synced</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/payments"
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSubmit}
            className={`px-5 py-2 font-extrabold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all ${
              isSaving
                ? "bg-blue-400 text-white cursor-not-allowed pointer-events-none opacity-80"
                : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95"
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Voucher...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Payment Voucher</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. MANAGE VENDOR VISIBILITY MODAL (EXACT MATCHING USER'S IMAGE 3) */}
      {isManageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Manage Vendor Visibility
                  </h2>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    Control which vendors appear in your vendor dropdown
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search vendors by name or type..."
                value={manageSearchQuery}
                onChange={(e) => setManageSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
              />
            </div>

            {/* VENDOR LIST GROUPED BY TYPE */}
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1 no-scrollbar pt-1">
              
              {/* SUPPLIERS GROUP */}
              {["SUPPLIER", "PARTY"].map((groupType) => {
                const groupItems = vendorsList.filter(
                  (v) =>
                    v.type === groupType &&
                    v.name.toLowerCase().includes(manageSearchQuery.toLowerCase())
                );

                if (groupItems.length === 0) return null;

                const allGroupVisible = groupItems.every((v) => v.visible);

                return (
                  <div key={groupType} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-black text-slate-700 tracking-wider">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        <span>{groupType}</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                          {groupItems.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleGroupVisibility(groupType as any)}
                        className="text-[11px] font-extrabold text-rose-500 hover:text-rose-700 px-2 py-0.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        {allGroupVisible ? "Unselect All" : "Select All"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {groupItems.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => toggleVendorVisibility(v.id)}
                          className={`p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                            v.visible
                              ? "bg-blue-50/60 border-blue-400 ring-1 ring-blue-400/30 text-blue-950 shadow-2xs"
                              : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`p-1.5 rounded-xl border shrink-0 ${
                                v.visible
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-slate-100 text-slate-400 border-slate-200"
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate">
                              <div className="font-extrabold text-xs truncate">
                                {v.name}
                              </div>
                              <div className="text-[9px] uppercase font-bold tracking-wider opacity-70">
                                {v.type}
                              </div>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ml-2 ${
                              v.visible
                                ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                                : "bg-white border-slate-300"
                            }`}
                          >
                            {v.visible && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* MODAL FOOTER */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
