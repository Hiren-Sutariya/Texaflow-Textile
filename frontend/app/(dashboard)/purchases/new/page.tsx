"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { getTenantItem, setTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import { VoiceTextarea } from "@/components/ui/VoiceTextarea";
import { TEXTILE_CREDIT_TERMS, parseCreditDays, calculateDueDate, getDueStatus, parseAnyDate } from "@/lib/creditTerms";
import { useLanguage } from "@/context/LanguageContext";
import {
  ArrowLeft,
  ChevronDown,
  Check,
  Save,
  Plus,
  Calendar,
  Upload,
  CreditCard,
  Clock,
  Layers,
  Sparkles,
  Package,
  Tag,
  Building2,
  FileText,
  Search,
  X,
  ShoppingCart
} from "lucide-react";

const getTodayStr = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

function NewPurchaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);
  const { t } = useLanguage();

  const [isSaving, setIsSaving] = useState(false);
  const [billDate, setBillDate] = useState(() => getTodayStr());
  const [purchaseNo, setPurchaseNo] = useState("PB-001");
  const [vendorName, setVendorName] = useState("");
  const [category, setCategory] = useState("Raw Material & Fabric");
  const [itemsDescription, setItemsDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Pending">("Pending");
  const [paymentTerms, setPaymentTerms] = useState("Net 45");
  const [creditDays, setCreditDays] = useState(45);
  const [dueDate, setDueDate] = useState("");
  const [linkedOrder, setLinkedOrder] = useState("");
  const [billImage, setBillImage] = useState("");
  const [notes, setNotes] = useState("");

  // Vendor selection states
  const [vendorsList, setVendorsList] = useState<string[]>([]);
  const [rawVendors, setRawVendors] = useState<any[]>([]);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
        setIsVendorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter vendors based on typed vendor name
  const filteredVendors = useMemo(() => {
    const q = (vendorName || "").toLowerCase().trim();
    if (!q) return vendorsList;
    const matches = vendorsList.filter((v) => v.toLowerCase().includes(q));
    if (matches.length === 1 && matches[0].toLowerCase() === q && vendorsList.length > 1) {
      return vendorsList;
    }
    return matches;
  }, [vendorsList, vendorName]);

  // Recalculate Due Date automatically
  useEffect(() => {
    if (creditDays > 0) {
      setDueDate(calculateDueDate(billDate, creditDays));
    } else {
      setDueDate(billDate);
    }
  }, [billDate, creditDays]);

  // Load vendors list
  useEffect(() => {
    const currentCid = getStoredCompanyId() || "comp-001";
    async function loadVendors() {
      try {
        const live = await fetchApi<any[]>("/vendors");
        if (Array.isArray(live) && live.length > 0) {
          const scoped = live.filter((v: any) => (v.company_id || "comp-001") === currentCid);
          setRawVendors(scoped);
          const names = scoped
            .map((v: any) => v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim())
            .filter(Boolean);
          setVendorsList(Array.from(new Set(names)));
          return;
        }
      } catch {}

      try {
        const localMaster = localStorage.getItem("app_vendors_master");
        const saved = localMaster 
          ? JSON.parse(localMaster) 
          : getTenantItem<any[]>("texaflow_vendors", currentCid === "comp-001" ? "om_sai_vendors" : undefined);
        if (Array.isArray(saved) && saved.length > 0) {
          setRawVendors(saved);
          const names = saved
            .map((v: any) => v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim())
            .filter(Boolean);
          setVendorsList(Array.from(new Set(names)));
        }
      } catch {}
    }
    loadVendors();
  }, []);

  // Compute next sequential bill number
  useEffect(() => {
    if (!isEditMode) {
      const currentCid = getStoredCompanyId() || "comp-001";
      try {
        const saved = getTenantItem<any[]>("texaflow_purchases", currentCid === "comp-001" ? "om_sai_purchases" : undefined) || [];
        let maxSeq = 0;
        saved.forEach((item: any) => {
          if (item.purchase_no) {
            const m = item.purchase_no.match(/PB-(\d+)/i);
            if (m) {
              const num = parseInt(m[1], 10);
              if (num > maxSeq) maxSeq = num;
            }
          }
        });
        setPurchaseNo(`PB-${String(maxSeq + 1).padStart(3, "0")}`);
      } catch {}
    }
  }, [isEditMode]);

  // Load record for edit mode
  useEffect(() => {
    if (editId) {
      const currentCid = getStoredCompanyId() || "comp-001";
      const list = getTenantItem<any[]>("texaflow_purchases", currentCid === "comp-001" ? "om_sai_purchases" : undefined) || [];
      const matched = list.find((item: any) => item.id === editId || item.purchase_no === editId);
      if (matched) {
        setPurchaseNo(matched.purchase_no || "");
        setBillDate(matched.date || getTodayStr());
        setVendorName(matched.vendor_name || "");
        setCategory(matched.category || "Raw Material & Fabric");
        setItemsDescription(matched.items_description || "");
        setAmount(String(matched.amount || ""));
        setPaymentStatus(matched.payment_status === "Paid" ? "Paid" : "Pending");
        setPaymentTerms(matched.payment_terms || "Net 45");
        setCreditDays(matched.credit_days !== undefined ? matched.credit_days : 45);
        setDueDate(matched.due_date || "");
        setLinkedOrder(matched.linked_order || "");
        setBillImage(matched.bill_image || "");
        setNotes(matched.notes || "");
      }
    }
  }, [editId]);

  const handleVendorSelect = (name: string) => {
    setVendorName(name);
    setIsVendorDropdownOpen(false);

    // Auto-fetch vendor's default credit terms
    const matched = rawVendors.find((v: any) => {
      const vName = v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim();
      return vName.toLowerCase() === name.toLowerCase();
    });

    if (matched && matched.payment_terms) {
      const days = parseCreditDays(matched.payment_terms);
      setCreditDays(days);
      setPaymentTerms(matched.payment_terms);
      if (days === 0) {
        setPaymentStatus("Paid");
      } else {
        setPaymentStatus("Pending");
      }
    }
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!vendorName.trim()) {
      alert(t("Please select or enter supplier/vendor name."));
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert(t("Please enter a valid bill amount."));
      return;
    }

    setIsSaving(true);
    const currentCid = getStoredCompanyId() || "comp-001";
    const recordId = isEditMode && editId ? editId : `pur-${Date.now()}`;

    const purchasePayload = {
      id: recordId,
      company_id: currentCid,
      purchase_no: purchaseNo,
      date: billDate,
      vendor_name: vendorName.trim(),
      category,
      items_description: itemsDescription.trim(),
      amount: numAmount,
      payment_status: paymentStatus,
      paid_via: paymentStatus === "Paid" ? "Cash / Immediate" : `Credit (${creditDays} days)`,
      payment_terms: paymentTerms,
      credit_days: creditDays,
      due_date: dueDate || calculateDueDate(billDate, creditDays),
      linked_order: linkedOrder.trim(),
      bill_image: billImage,
      notes: notes.trim()
    };

    try {
      if (isEditMode) {
        await fetchApi(`/purchases/${recordId}`, {
          method: "PUT",
          body: JSON.stringify(purchasePayload)
        });
      } else {
        await fetchApi("/purchases", {
          method: "POST",
          body: JSON.stringify(purchasePayload)
        });
      }
    } catch (err) {
      console.warn("Backend save notice:", err);
    }

    try {
      const saved = getTenantItem<any[]>("texaflow_purchases", currentCid === "comp-001" ? "om_sai_purchases" : undefined) || [];
      const updatedList = isEditMode
        ? saved.map((p: any) => (p.id === recordId || p.purchase_no === recordId ? purchasePayload : p))
        : [purchasePayload, ...saved];
      setTenantItem("texaflow_purchases", updatedList, currentCid === "comp-001" ? "om_sai_purchases" : undefined);
      window.dispatchEvent(new Event("app_data_update"));
    } catch {}

    router.push("/purchases");
  };

  const categories = [
    "Raw Material & Fabric",
    "Yarn & Threads",
    "Zari & Metallic Trims",
    "Lace, Borders & Latkan",
    "Choli & Garment Trims",
    "Packaging Materials"
  ];

  return (
    <div className="w-full space-y-3.5 select-none pb-20 animate-in fade-in duration-150 text-xs font-sans">
      {/* 1. TOP HEADER TOOLBAR - MATCHING PAYMENTS & VENDORS PAGE BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
        <h2 className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">
          {isEditMode ? t("EDIT RAW MATERIAL PURCHASE") : t("NEW RAW MATERIAL PURCHASE REGISTRATION")}
        </h2>
        <Link
          href="/purchases"
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("Back to Purchase List")}</span>
        </Link>
      </div>

      {/* 2. FORM CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
        <form onSubmit={handleSavePurchase} className="space-y-4">
          
          {/* ROW 1: PURCHASE BILL NO * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">{t("Purchase Bill No / ચલણ નં.*")}</label>
            <div className="max-w-xl w-full">
              <input
                type="text"
                value={purchaseNo}
                onChange={(e) => setPurchaseNo(e.target.value)}
                placeholder="e.g. PB-001 or Mill Invoice #"
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          {/* ROW 2: BILL / INWARD DATE * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">{t("Bill / Inward Date*")}</label>
            <div className="max-w-xl w-full">
              <input
                type="text"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                placeholder="DD-MM-YYYY"
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          {/* ROW 3: SUPPLIER / VENDOR * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">{t("Supplier / Vendor*")}</label>
            <div className="max-w-xl w-full">
              <div className="relative" ref={vendorDropdownRef}>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => {
                      setVendorName(e.target.value);
                      setIsVendorDropdownOpen(true);
                    }}
                    onFocus={() => setIsVendorDropdownOpen(true)}
                    placeholder={t("Type to search or enter vendor name...")}
                    className="w-full h-9 pl-9 pr-14 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs text-xs"
                    required
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {vendorName && (
                      <button
                        type="button"
                        onClick={() => {
                          setVendorName("");
                          setIsVendorDropdownOpen(true);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isVendorDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {isVendorDropdownOpen && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-1.5 max-h-60 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                    {filteredVendors.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs font-medium">
                        {vendorName ? `No registered vendor matching "${vendorName}". Keep typing to use custom name.` : t("No vendors found.")}
                      </div>
                    ) : (
                      filteredVendors.map((v) => {
                        const isSelected = vendorName.toLowerCase().trim() === v.toLowerCase().trim();

                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => handleVendorSelect(v)}
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
          </div>

          {/* ROW 4: MATERIAL CATEGORY * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-bold text-slate-700">{t("Material Category (પ્રકાર)*")}</label>
            <div className="max-w-xl w-full">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{t(c)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ROW 5: ITEMS DESCRIPTION / QUANTITY */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-bold text-slate-700">{t("Items / Description (વિગત)")}</label>
            <div className="max-w-xl w-full">
              <input
                type="text"
                placeholder={t("e.g. 500 Meters Satin Grey, 20 Boxes Dhaga, Zari Reals")}
                value={itemsDescription}
                onChange={(e) => setItemsDescription(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* ROW 6: BILL AMOUNT (₹) * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">{t("Bill Amount (₹)*")}</label>
            <div className="relative max-w-xl w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500 text-sm">₹</span>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-9 pl-7 pr-3 bg-white border border-slate-300 rounded-xl font-mono font-black text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          {/* ROW 7: PAYMENT STATUS * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-bold text-slate-700">{t("Payment Status (સ્થિતિ)*")}</label>
            <div className="flex items-center gap-2 max-w-xl w-full">
              <button
                type="button"
                onClick={() => {
                  setPaymentStatus("Pending");
                  if (creditDays === 0) setCreditDays(45);
                }}
                className={`flex-1 h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                  paymentStatus === "Pending"
                    ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{t("Pending / શાખ (ઉધાર)")}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentStatus("Paid");
                  setCreditDays(0);
                  setPaymentTerms("Cash / Immediate");
                }}
                className={`flex-1 h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                  paymentStatus === "Paid"
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t("Paid (રોકડા / ચૂકતે)")}</span>
              </button>
            </div>
          </div>

          {/* ROW 8: CREDIT TERMS (NET DAYS) */}
          {paymentStatus === "Pending" && (
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
              <div className="flex flex-col">
                <label className="font-bold text-slate-700">{t("Credit Terms (મુદત)*")}</label>
                <span className="text-[10px] text-blue-600 font-extrabold">{creditDays} {t("Days Credit")}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap max-w-xl w-full">
                {[30, 45, 60, 90, 100, 120].map((days) => {
                  const isSelected = creditDays === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setCreditDays(days);
                        setPaymentTerms(`Net ${days}`);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {days} {t("દિવસ")}
                    </button>
                  );
                })}
                <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] text-slate-400 font-medium">{t("Custom")}:</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={creditDays || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setCreditDays(val);
                      setPaymentTerms(`Net ${val}`);
                    }}
                    className="w-12 h-5 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400">{t("દિ")}</span>
                </div>
              </div>
            </div>
          )}

          {/* ROW 9: DUE DATE */}
          {paymentStatus === "Pending" && (
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
              <label className="font-bold text-slate-700">{t("Due Date (છેલ્લી તારીખ)")}</label>
              <div className="flex items-center gap-3 max-w-xl w-full">
                <input
                  type="date"
                  value={(() => {
                    const d = parseAnyDate(dueDate || calculateDueDate(billDate, creditDays));
                    return d ? d.toISOString().split("T")[0] : "";
                  })()}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [y, m, d] = e.target.value.split("-");
                    const formatted = `${d}-${m}-${y}`;
                    setDueDate(formatted);
                    const billD = parseAnyDate(billDate);
                    const dueD = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
                    if (billD && dueD) {
                      const diff = Math.round((dueD.getTime() - billD.getTime()) / (1000 * 60 * 60 * 24));
                      if (diff > 0) {
                        setCreditDays(diff);
                        setPaymentTerms(`Net ${diff}`);
                      }
                    }
                  }}
                  className="h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs cursor-pointer flex-1"
                />
                {(() => {
                  const info = getDueStatus(dueDate || calculateDueDate(billDate, creditDays), false);
                  return (
                    <span className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black border shrink-0 ${info.badgeClass}`}>
                      {info.labelGu}
                    </span>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ROW 10: LINKED ORDER / CHOLI JOB WORK */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <div className="flex flex-col">
              <label className="font-bold text-slate-700">{t("Linked Order")}</label>
              <span className="text-[10px] text-slate-400 font-normal">Choli / Merchant (ઓપ્શનલ)</span>
            </div>
            <div className="max-w-xl w-full">
              <input
                type="text"
                placeholder={t("e.g. Choli Order #2486 - Hari Har Vepari")}
                value={linkedOrder}
                onChange={(e) => setLinkedOrder(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* ROW 11: REMARKS / NOTES */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-start text-xs pt-1">
            <label className="font-bold text-slate-700 pt-2">{t("Remarks / Notes")}</label>
            <div className="max-w-xl w-full">
              <VoiceTextarea
                rows={3}
                placeholder={t("Add optional purchase description, lot number or mill notes...")}
                value={notes}
                onChangeValue={(val) => setNotes(val)}
              />
            </div>
          </div>

        </form>
      </div>

      {/* 3. UNIFIED STATIC / FIXED ACTIONS FOOTER BAR */}
      <BottomActionBar
        showSynced={true}
        rightContent={
          <>
            <Link
              href="/purchases"
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs transition-colors cursor-pointer shadow-2xs"
            >
              {t("Cancel")}
            </Link>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSavePurchase}
              className={`px-5 py-2 font-extrabold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all ${
                isSaving
                  ? "bg-blue-400 text-white cursor-not-allowed pointer-events-none opacity-80"
                  : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t("Saving Purchase...")}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditMode ? t("Update Purchase Bill") : t("Save Purchase Bill")}</span>
                </>
              )}
            </button>
          </>
        }
      />
    </div>
  );
}

export default function NewPurchasePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
      <NewPurchaseContent />
    </Suspense>
  );
}
