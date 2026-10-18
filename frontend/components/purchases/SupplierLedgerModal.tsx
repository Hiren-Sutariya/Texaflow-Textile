"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi, getCachedApi } from "@/lib/api";
import { getTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { useLanguage } from "@/context/LanguageContext";
import { getDueStatus } from "@/lib/creditTerms";
import {
  X,
  Printer,
  Plus,
  CreditCard,
  FileText,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Building2,
  ChevronDown,
  Phone,
  MessageCircle,
  Receipt,
  Download,
  Share2,
  SlidersHorizontal,
  ExternalLink
} from "lucide-react";

export interface PurchaseItem {
  id: string;
  purchase_no: string;
  date: string;
  category: string;
  vendor_name: string;
  items_description?: string;
  amount: number;
  payment_status: "Paid" | "Pending" | "Unpaid";
  paid_via?: string;
  payment_terms?: string;
  credit_days?: number;
  due_date?: string;
  notes?: string;
}

export interface PaymentVoucherItem {
  id: string;
  voucher_no: string;
  date: string;
  party_name: string;
  type: "Payment Out" | "Receipt In";
  linked_source?: string;
  amount: number;
  mode: string;
  ref_no: string;
  notes: string;
}

export interface VendorMaster {
  id: string;
  company_name: string;
  display_name: string;
  work_phone?: string;
  mobile?: string;
  gstin?: string;
  payment_terms?: string;
  opening_balance?: number;
  billing_address?: {
    city?: string;
    state?: string;
  };
}

export interface LedgerTransaction {
  id: string;
  date: string;
  rawDate: number;
  type: "BILL" | "PAYMENT";
  refNo: string;
  description: string;
  modeOrTerms?: string;
  debit: number;   // Inward Bill / Purchase (Increases payable)
  credit: number;  // Payment Voucher (Decreases payable)
  runningBalance: number;
  status?: string;
  dueDate?: string;
  isOverdue?: boolean;
  daysRemainingOrOverdue?: number;
  originalItem: any;
}

interface SupplierLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVendorName?: string;
  initialPurchases?: PurchaseItem[];
  initialVouchers?: PaymentVoucherItem[];
}

const DEFAULT_SEED_PURCHASES: PurchaseItem[] = [];
const DEFAULT_SEED_VOUCHERS: PaymentVoucherItem[] = [];

export function SupplierLedgerModal({
  isOpen,
  onClose,
  initialVendorName = "",
  initialPurchases,
  initialVouchers
}: SupplierLedgerModalProps) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const isGujarati = language === "gu";

  // Data states
  const [purchases, setPurchases] = useState<PurchaseItem[]>(initialPurchases && initialPurchases.length > 0 ? initialPurchases : DEFAULT_SEED_PURCHASES);
  const [vouchers, setVouchers] = useState<PaymentVoucherItem[]>(initialVouchers && initialVouchers.length > 0 ? initialVouchers : DEFAULT_SEED_VOUCHERS);
  const [vendors, setVendors] = useState<VendorMaster[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>(initialVendorName || "Shivam Textiles & Fabrics");
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "BILLS" | "PAYMENTS" | "OVERDUE">("ALL");
  const [tableSearch, setTableSearch] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Synchronize when initialVendorName or initialPurchases changes
  useEffect(() => {
    if (initialVendorName) {
      setSelectedVendor(initialVendorName);
    }
  }, [initialVendorName]);

  useEffect(() => {
    if (initialPurchases && initialPurchases.length > 0) {
      setPurchases(initialPurchases);
    }
  }, [initialPurchases]);

  useEffect(() => {
    if (initialVouchers && initialVouchers.length > 0) {
      setVouchers(initialVouchers);
    }
  }, [initialVouchers]);

  // Load records from storage / API on open
  useEffect(() => {
    if (!isOpen) return;

    const currentCid = getStoredCompanyId() || "comp-001";

    // 1. Load purchases
    try {
      const cachedPurchases = getCachedApi<PurchaseItem[]>("/purchases") || 
        getTenantItem<PurchaseItem[]>("texaflow_purchases", currentCid === "comp-001" ? "om_sai_purchases" : undefined);
      if (Array.isArray(cachedPurchases) && cachedPurchases.length > 0) {
        setPurchases(cachedPurchases);
      } else if (!initialPurchases || initialPurchases.length === 0) {
        setPurchases(DEFAULT_SEED_PURCHASES);
      }
    } catch {}

    // 2. Load vouchers
    try {
      const cachedVouchers = getCachedApi<PaymentVoucherItem[]>("/payments") || 
        getTenantItem<PaymentVoucherItem[]>("texaflow_vouchers", "om_sai_vouchers");
      if (Array.isArray(cachedVouchers) && cachedVouchers.length > 0) {
        setVouchers(cachedVouchers);
      } else if (!initialVouchers || initialVouchers.length === 0) {
        setVouchers(DEFAULT_SEED_VOUCHERS);
      }
    } catch {}

    // 3. Load vendors master
    try {
      const cachedVendors = getCachedApi<VendorMaster[]>("/vendors") || 
        getTenantItem<VendorMaster[]>("app_vendors_master", "om_sai_vendors");
      if (Array.isArray(cachedVendors) && cachedVendors.length > 0) {
        setVendors(cachedVendors);
      }
    } catch {}

    // Async live fetch
    async function fetchLiveData() {
      try {
        const [livePur, liveVou, liveVen] = await Promise.allSettled([
          fetchApi<PurchaseItem[]>("/purchases"),
          fetchApi<PaymentVoucherItem[]>("/payments"),
          fetchApi<VendorMaster[]>("/vendors")
        ]);

        if (livePur.status === "fulfilled" && Array.isArray(livePur.value) && livePur.value.length > 0) {
          setPurchases(livePur.value);
        }
        if (liveVou.status === "fulfilled" && Array.isArray(liveVou.value) && liveVou.value.length > 0) {
          setVouchers(liveVou.value);
        }
        if (liveVen.status === "fulfilled" && Array.isArray(liveVen.value) && liveVen.value.length > 0) {
          setVendors(liveVen.value);
        }
      } catch (err) {
        console.warn("Ledger live data notice:", err);
      }
    }

    fetchLiveData();
  }, [isOpen, initialPurchases, initialVouchers]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsVendorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute full unique list of all suppliers / mills across purchases, vouchers & master
  const allSuppliersList = useMemo(() => {
    const set = new Set<string>();

    purchases.forEach((p) => {
      if (p.vendor_name) set.add(p.vendor_name.trim());
    });

    vouchers.forEach((v) => {
      if (v.party_name) set.add(v.party_name.trim());
    });

    vendors.forEach((v) => {
      const name = v.company_name || v.display_name;
      if (name) set.add(name.trim());
    });

    const list = Array.from(set).filter(Boolean).sort();
    return list.length > 0 ? list : ["Shivam Textiles & Fabrics", "Jay Ambe Zari & Thread Mills", "Vardhman Yarns Surat"];
  }, [vendors, purchases, vouchers]);

  // Default selected vendor if empty
  useEffect(() => {
    if (!selectedVendor && allSuppliersList.length > 0) {
      setSelectedVendor(allSuppliersList[0]);
    }
  }, [selectedVendor, allSuppliersList]);

  // Find current vendor metadata
  const currentVendorData = useMemo(() => {
    if (!selectedVendor) return null;
    return vendors.find(
      (v) =>
        (v.company_name && v.company_name.toLowerCase().trim() === selectedVendor.toLowerCase().trim()) ||
        (v.display_name && v.display_name.toLowerCase().trim() === selectedVendor.toLowerCase().trim())
    );
  }, [selectedVendor, vendors]);

  // Filtered vendor list for dropdown search
  const filteredDropdownVendors = useMemo(() => {
    if (!vendorSearchQuery.trim()) return allSuppliersList;
    const q = vendorSearchQuery.toLowerCase();
    return allSuppliersList.filter((s) => s.toLowerCase().includes(q));
  }, [allSuppliersList, vendorSearchQuery]);

  // Parse Indian date string 'DD-MM-YYYY' or ISO into epoch
  const parseDateEpoch = (dStr: string) => {
    if (!dStr) return 0;
    if (dStr.includes("-")) {
      const parts = dStr.split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return new Date(`${parts[0]}-${parts[1]}-${parts[2]}`).getTime();
        } else {
          return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
        }
      }
    }
    const t = new Date(dStr).getTime();
    return isNaN(t) ? 0 : t;
  };

  // Compile Ledger Transactions for Selected Vendor
  const { transactions, kpiSummary } = useMemo(() => {
    if (!selectedVendor) {
      return {
        transactions: [],
        kpiSummary: {
          totalBillsAmount: 0,
          totalPaidAmount: 0,
          netBalance: 0,
          overdueAmount: 0,
          totalBillsCount: 0,
          totalPaymentsCount: 0
        }
      };
    }

    const normVendor = selectedVendor.toLowerCase().trim();

    // 1. Get all Inward Purchase Bills for this vendor
    const vendorPurchases = purchases.filter((p) => {
      const pName = (p.vendor_name || "").toLowerCase().trim();
      return pName === normVendor || normVendor.includes(pName) || pName.includes(normVendor);
    });

    // 2. Get all Payment Vouchers paid out to this vendor
    const vendorVouchers = vouchers.filter((v) => {
      const vName = (v.party_name || "").toLowerCase().trim();
      return (vName === normVendor || normVendor.includes(vName) || vName.includes(normVendor)) && (v.type === "Payment Out" || !v.type);
    });

    // Opening balance from vendor master
    const openingBal = currentVendorData?.opening_balance || 0;

    // Build raw transaction list
    const rawTxns: Array<{
      id: string;
      date: string;
      rawDate: number;
      type: "BILL" | "PAYMENT";
      refNo: string;
      description: string;
      modeOrTerms?: string;
      debit: number;
      credit: number;
      status?: string;
      dueDate?: string;
      isOverdue?: boolean;
      daysRemainingOrOverdue?: number;
      originalItem: any;
    }> = [];

    // Add Inward Bills
    vendorPurchases.forEach((p) => {
      let isOverdue = false;
      let daysDiff = 0;
      if (p.due_date && (p.payment_status === "Pending" || p.payment_status === "Unpaid")) {
        const dueInfo = getDueStatus(p.due_date, false);
        if (dueInfo) {
          isOverdue = dueInfo.status === "Overdue";
          daysDiff = dueInfo.daysDiff;
        }
      }

      rawTxns.push({
        id: p.id || `pur-${p.purchase_no}`,
        date: p.date,
        rawDate: parseDateEpoch(p.date),
        type: "BILL",
        refNo: p.purchase_no,
        description: p.items_description || p.category || "કાપડ / મટિરિયલ ખરીદી બિલ",
        modeOrTerms: p.payment_terms || p.paid_via || "શાખ મુદત",
        debit: Number(p.amount) || 0,
        credit: 0,
        status: p.payment_status,
        dueDate: p.due_date,
        isOverdue,
        daysRemainingOrOverdue: daysDiff,
        originalItem: p
      });
    });

    // Add Payment Vouchers
    vendorVouchers.forEach((v) => {
      rawTxns.push({
        id: v.id || `vou-${v.voucher_no}`,
        date: v.date,
        rawDate: parseDateEpoch(v.date),
        type: "PAYMENT",
        refNo: v.voucher_no,
        description: v.notes || (v.ref_no ? `Ref: ${v.ref_no}` : "પેમેન્ટ ચૂકવણી વાઉચર"),
        modeOrTerms: v.mode || "RTGS / NEFT",
        debit: 0,
        credit: Number(v.amount) || 0,
        status: "Paid",
        originalItem: v
      });
    });

    // Sort chronologically (oldest first) to compute running balance correctly
    rawTxns.sort((a, b) => a.rawDate - b.rawDate);

    let running = openingBal;
    const computedTxns: LedgerTransaction[] = rawTxns.map((tx) => {
      // Inward Bill increases what we owe (+ Debit)
      // Payment Voucher decreases what we owe (- Credit)
      running = running + tx.debit - tx.credit;
      return {
        ...tx,
        runningBalance: running
      };
    });

    // Reverse to show latest on top for UI convenience
    const reversedTxns = [...computedTxns].reverse();

    // Summary calculations
    const totalBillsAmount = rawTxns.reduce((sum, tx) => sum + tx.debit, 0);
    const totalPaidAmount = rawTxns.reduce((sum, tx) => sum + tx.credit, 0);
    const netBalance = openingBal + totalBillsAmount - totalPaidAmount;

    // Overdue amount
    const overdueAmount = rawTxns
      .filter((tx) => tx.type === "BILL" && tx.isOverdue && (tx.status === "Pending" || tx.status === "Unpaid"))
      .reduce((sum, tx) => sum + tx.debit, 0);

    return {
      transactions: reversedTxns,
      kpiSummary: {
        totalBillsAmount,
        totalPaidAmount,
        netBalance,
        overdueAmount,
        totalBillsCount: vendorPurchases.length,
        totalPaymentsCount: vendorVouchers.length
      }
    };
  }, [selectedVendor, purchases, vouchers, currentVendorData]);

  // Filtered transactions for display
  const displayedTransactions = useMemo(() => {
    let list = transactions;

    if (filterType === "BILLS") {
      list = list.filter((t) => t.type === "BILL");
    } else if (filterType === "PAYMENTS") {
      list = list.filter((t) => t.type === "PAYMENT");
    } else if (filterType === "OVERDUE") {
      list = list.filter((t) => t.type === "BILL" && t.isOverdue);
    }

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(
        (t) =>
          t.refNo.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.modeOrTerms && t.modeOrTerms.toLowerCase().includes(q)) ||
          t.date.toLowerCase().includes(q)
      );
    }

    return list;
  }, [transactions, filterType, tableSearch]);

  // Action: Print Statement
  const handlePrint = () => {
    window.print();
  };

  // Action: Share Statement via WhatsApp
  const handleShareWhatsApp = () => {
    if (!selectedVendor) return;

    const phone = currentVendorData?.mobile || currentVendorData?.work_phone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");

    const todayStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    const lines = [
      `*🏛️ ઓમ સાઈ ટેક્સટાઇલ - સપ્લાયર ખાતાવહી સ્ટેટમેન્ટ*`,
      `-----------------------------------------`,
      `📅 તારીખ: ${todayStr}`,
      `🏢 સપ્લાયર / મિલ: *${selectedVendor}*`,
      currentVendorData?.gstin ? `📄 GSTIN: ${currentVendorData.gstin}` : "",
      ``,
      `📊 *ખાતાવહી સારાંશ (Statement Summary):*`,
      `• કુલ ખરીદી બિલ (${kpiSummary.totalBillsCount}): ₹${kpiSummary.totalBillsAmount.toLocaleString("en-IN")}`,
      `• કુલ ચૂકવેલ પેમેન્ટ (${kpiSummary.totalPaymentsCount}): ₹${kpiSummary.totalPaidAmount.toLocaleString("en-IN")}`,
      `• *ચોખ્ખી બાકી રકમ (Net Outstanding): ₹${kpiSummary.netBalance.toLocaleString("en-IN")}*`,
      kpiSummary.overdueAmount > 0
        ? `⚠️ *મુદત વીતી ગયેલ રકમ (Overdue Mudat): ₹${kpiSummary.overdueAmount.toLocaleString("en-IN")}*`
        : `✅ મુદત બાકી: તમામ બિલ સમયસર છે`,
      ``,
      `📑 *છેલ્લા વ્યવહારો (Recent Ledger Entries):*`
    ].filter(Boolean);

    transactions.slice(0, 5).forEach((tx, idx) => {
      const sign = tx.type === "BILL" ? "🔴 બિલ (Dr)" : "🟢 પેમેન્ટ (Cr)";
      const amt = tx.type === "BILL" ? tx.debit : tx.credit;
      lines.push(
        `${idx + 1}. ${tx.date} | ${tx.refNo} | ${sign}: ₹${amt.toLocaleString("en-IN")} | બાકી: ₹${tx.runningBalance.toLocaleString("en-IN")}`
      );
    });

    lines.push(
      ``,
      `_વિગતવાર હિસાબ અથવા ચકાસણી માટે સંપર્ક કરો: ઓમ સાઈ ટેક્સટાઇલ, સુરત._`
    );

    const message = lines.join("\n");
    const encoded = encodeURIComponent(message);
    const targetUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(targetUrl, "_blank");
  };

  // Action: Pay Now / Record Payment Voucher
  const handleRecordPayment = () => {
    if (!selectedVendor) return;
    const payAmt = kpiSummary.netBalance > 0 ? kpiSummary.netBalance : "";
    router.push(
      `/payments/new?party=${encodeURIComponent(selectedVendor)}&amount=${payAmt}&type=Payment+Out&source=${encodeURIComponent("Material Inward Bill")}`
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER - MATCHING APP DESIGN SYSTEM */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 via-blue-50/40 to-white border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                  {isGujarati ? "સપ્લાયર / મિલ ખાતાવહી સ્ટેટમેન્ટ" : "Supplier / Mill Ledger & Statement"}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wide">
                  {isGujarati ? "રનિંગ લેજર" : "Running Ledger"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                {isGujarati
                  ? "ઓમ સાઈ ટેક્સટાઇલ • ખરીદી બિલ (Dr) અને પેમેન્ટ વાઉચર્સ (Cr) નો સમયાનુસાર હિસાબ"
                  : "Om Sai Textiles • Chronological reconciliation of inward bills (Dr) and payments (Cr)"}
              </p>
            </div>
          </div>

          {/* HEADER ACTION BUTTONS */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              type="button"
              className="h-9 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
              title={isGujarati ? "સ્ટેટમેન્ટ પ્રિન્ટ કરો" : "Print Statement"}
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>{isGujarati ? "પ્રિન્ટ" : "Print"}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
              title={isGujarati ? "WhatsApp પર સ્ટેટમેન્ટ મોકલો" : "Share on WhatsApp"}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleRecordPayment}
              type="button"
              className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isGujarati ? "+ પેમેન્ટ ચૂકવો" : "+ Pay Now"}</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SUPPLIER SELECTOR & CONTACT DETAILS BAR */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          
          {/* Supplier Selector Dropdown */}
          <div className="relative min-w-[300px] max-w-md flex-1" ref={dropdownRef}>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>{isGujarati ? "સપ્લાયર / મિલ પસંદ કરો:" : "Select Supplier / Mill:"}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
              className="w-full h-10 flex items-center justify-between px-3.5 bg-white border border-slate-200 hover:border-blue-500 rounded-xl text-left text-xs font-extrabold text-slate-900 shadow-2xs transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">{selectedVendor}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            </button>

            {/* Dropdown Menu */}
            {isVendorDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 max-h-72 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={vendorSearchQuery}
                    onChange={(e) => setVendorSearchQuery(e.target.value)}
                    placeholder={isGujarati ? "સપ્લાયરનું નામ શોધો..." : "Search supplier..."}
                    className="w-full h-8 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto space-y-0.5 flex-1 pr-1">
                  {filteredDropdownVendors.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      {isGujarati ? "કોઈ સપ્લાયર મળ્યા નથી" : "No suppliers found"}
                    </div>
                  ) : (
                    filteredDropdownVendors.map((vendorName) => (
                      <button
                        key={vendorName}
                        type="button"
                        onClick={() => {
                          setSelectedVendor(vendorName);
                          setIsVendorDropdownOpen(false);
                          setVendorSearchQuery("");
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          selectedVendor === vendorName
                            ? "bg-blue-50 text-blue-700 font-black"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{vendorName}</span>
                        {selectedVendor === vendorName && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 ml-2 shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Supplier Info Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {currentVendorData?.mobile && (
              <a
                href={`tel:${currentVendorData.mobile}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs hover:border-blue-400 transition"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentVendorData.mobile}</span>
              </a>
            )}
            {currentVendorData?.gstin && (
              <div className="inline-flex items-center gap-1.5 text-xs font-mono bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                <span className="font-extrabold text-slate-400 text-[10px]">GSTIN:</span>
                <span className="font-bold text-slate-800">{currentVendorData.gstin}</span>
              </div>
            )}
            {currentVendorData?.payment_terms && (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
                <Clock className="w-3 h-3 text-blue-600" />
                <span>{currentVendorData.payment_terms}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 text-[10px] font-extrabold">{isGujarati ? "ઓપનિંગ:" : "OPENING:"}</span>
              <span className="font-mono font-black text-slate-800">
                ₹{(currentVendorData?.opening_balance || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* 4 STAT KPI CARDS - MATCHING PURCHASES KPI DESIGN */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-5 bg-white border-b border-slate-200">
          
          {/* Card 1: Total Purchases / Inward Bills */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                {isGujarati ? "કુલ ખરીદી બિલ (DR)" : "TOTAL PURCHASES (DR)"}
              </span>
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                ₹{kpiSummary.totalBillsAmount.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                ({kpiSummary.totalBillsCount} {isGujarati ? "બિલ" : "bills"})
              </span>
            </div>
          </div>

          {/* Card 2: Total Paid Out */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">
                {isGujarati ? "કુલ ચૂકવેલ પેમેન્ટ (CR)" : "TOTAL PAID OUT (CR)"}
              </span>
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
                ₹{kpiSummary.totalPaidAmount.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-emerald-700 font-bold">
                ({kpiSummary.totalPaymentsCount} {isGujarati ? "ચૂકવેલ" : "cleared"})
              </span>
            </div>
          </div>

          {/* Card 3: Net Payable Balance */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                kpiSummary.netBalance > 0 ? "text-rose-600" : "text-emerald-600"
              }`}>
                {isGujarati ? "ચોખ્ખી બાકી રકમ (શાખ)" : "NET PAYABLE BALANCE"}
              </span>
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                kpiSummary.netBalance > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
              }`}>
                <CreditCard className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-xl sm:text-2xl font-black font-mono ${
                kpiSummary.netBalance > 0 ? "text-rose-600" : "text-emerald-600"
              }`}>
                ₹{kpiSummary.netBalance.toLocaleString("en-IN")}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                kpiSummary.netBalance > 0
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                {kpiSummary.netBalance > 0 ? (isGujarati ? "બાકી શાખ" : "Payable") : (isGujarati ? "ક્લીયર" : "Settled")}
              </span>
            </div>
          </div>

          {/* Card 4: Overdue Mudat Amount */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">
                {isGujarati ? "મુદત વીતી ગયેલ (OVERDUE)" : "OVERDUE MUDAT"}
              </span>
              <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-600">
                ₹{kpiSummary.overdueAmount.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-amber-700 font-bold">
                {kpiSummary.overdueAmount > 0 ? (isGujarati ? "મુદત સમાપ્ત" : "Overdue") : (isGujarati ? "સમયસર" : "On track")}
              </span>
            </div>
          </div>

        </div>

        {/* FILTERS & SEARCH BAR - MATCHING PURCHASES TOOLBAR */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          
          {/* Status Pills */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/90 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                filterType === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {isGujarati ? "બધા વ્યવહારો" : "All Transactions"} ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("BILLS")}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                filterType === "BILLS"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {isGujarati ? "માત્ર ખરીદી બિલ (Dr)" : "Inward Bills (Dr)"} ({kpiSummary.totalBillsCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("PAYMENTS")}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                filterType === "PAYMENTS"
                  ? "bg-white text-emerald-700 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {isGujarati ? "માત્ર પેમેન્ટ (Cr)" : "Payments (Cr)"} ({kpiSummary.totalPaymentsCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("OVERDUE")}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                filterType === "OVERDUE"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {isGujarati ? "મુદત બાકી (Overdue)" : "Overdue Bills"}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isGujarati ? "બિલ નં, વિગત, રેફરન્સ શોધો..." : "Search ref no, description..."}
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>

        </div>

        {/* LEDGER RUNNING TABLE - MATCHING PURCHASES DESKTOP TABLE */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap sticky top-0 z-10 backdrop-blur-xs">
                <th className="py-3 px-4 text-center w-12">#</th>
                <th className="py-3 px-4">{isGujarati ? "તારીખ" : "DATE"}</th>
                <th className="py-3 px-4">{isGujarati ? "પ્રકાર / રેફરન્સ" : "TYPE & REF"}</th>
                <th className="py-3 px-4">{isGujarati ? "વિગત / મટિરિયલ" : "MATERIAL & PARTICULARS"}</th>
                <th className="py-3 px-4">{isGujarati ? "મુદત / મોડ" : "MUDAT / TERMS"}</th>
                <th className="py-3 px-4 text-right text-rose-700">{isGujarati ? "ઉધાર / બિલ (DR)" : "DEBIT (DR)"}</th>
                <th className="py-3 px-4 text-right text-emerald-700">{isGujarati ? "જમા / પેમેન્ટ (CR)" : "CREDIT (CR)"}</th>
                <th className="py-3 px-4 text-right font-black text-slate-900">{isGujarati ? "રનિંગ બાકી (₹)" : "NET BALANCE"}</th>
                <th className="py-3 px-4 text-center">{isGujarati ? "સ્ટેટસ" : "STATUS"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {displayedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-bold text-slate-700 text-xs">
                      {isGujarati ? "આ સપ્લાયર માટે કોઈ વ્યવહાર મળ્યો નથી" : "No transactions found for this supplier"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isGujarati ? "નવું ખરીદી બિલ અથવા પેમેન્ટ વાઉચર ઉમેરો" : "Add a purchase bill or payment voucher"}
                    </p>
                  </td>
                </tr>
              ) : (
                displayedTransactions.map((tx, idx) => {
                  const isBill = tx.type === "BILL";
                  return (
                    <tr
                      key={tx.id || idx}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      {/* Index */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px] align-middle">
                        {displayedTransactions.length - idx}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap align-middle">
                        {tx.date}
                      </td>

                      {/* Type & Ref */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                              isBill
                                ? "text-blue-700 bg-blue-50/90 border-blue-200"
                                : "text-emerald-700 bg-emerald-50/90 border-emerald-200"
                            }`}
                          >
                            {tx.refNo}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isBill ? "text-blue-700 bg-blue-50" : "text-emerald-700 bg-emerald-50"
                          }`}>
                            {isBill ? (isGujarati ? "બિલ" : "Bill") : (isGujarati ? "ચૂકવણી" : "Paid")}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="text-xs font-bold text-slate-800 leading-snug">
                          {tx.description}
                        </div>
                      </td>

                      {/* Terms / Mode */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle font-mono text-xs">
                        {isBill ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-800 font-bold text-xs">
                              {tx.modeOrTerms || "શાખ મુદત"}
                            </span>
                            {tx.dueDate && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Calendar className="w-3 h-3 text-blue-600" />
                                <span>{tx.dueDate}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {tx.modeOrTerms || "RTGS"}
                          </span>
                        )}
                      </td>

                      {/* Debit (Inward Bill) */}
                      <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap font-mono font-black text-rose-700 text-sm">
                        {tx.debit > 0 ? `₹${tx.debit.toLocaleString("en-IN")}` : "—"}
                      </td>

                      {/* Credit (Payment Out) */}
                      <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap font-mono font-black text-emerald-700 text-sm">
                        {tx.credit > 0 ? `₹${tx.credit.toLocaleString("en-IN")}` : "—"}
                      </td>

                      {/* Running Balance */}
                      <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                        <span
                          className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border inline-block ${
                            tx.runningBalance > 0
                              ? "bg-rose-50/90 text-rose-700 border-rose-200"
                              : tx.runningBalance < 0
                              ? "bg-blue-50/90 text-blue-700 border-blue-200"
                              : "bg-emerald-50/90 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          ₹{tx.runningBalance.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                        {isBill ? (
                          tx.status === "Paid" ? (
                            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50/90 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                              {t("Paid")}
                            </span>
                          ) : tx.isOverdue ? (
                            <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50/90 px-2.5 py-1 rounded-lg border border-rose-200 inline-block">
                              {t("Overdue")}
                            </span>
                          ) : (
                            <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50/90 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                              {t("Pending")}
                            </span>
                          )
                        ) : (
                          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50/90 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                            {t("Paid")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span>
              {isGujarati ? "કુલ વ્યવહારો:" : "Total Records:"} <b className="text-slate-800">{displayedTransactions.length}</b>
            </span>
            <span>•</span>
            <span>
              {isGujarati ? "ચોખ્ખી બાકી શાખ:" : "Net Outstanding:"}{" "}
              <b className={kpiSummary.netBalance > 0 ? "text-rose-600 font-black" : "text-emerald-600 font-black"}>
                ₹{kpiSummary.netBalance.toLocaleString("en-IN")}
              </b>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold transition shadow-2xs cursor-pointer"
            >
              {isGujarati ? "બંધ કરો (Close)" : "Close"}
            </button>
            <button
              onClick={handleRecordPayment}
              type="button"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isGujarati ? "આ સપ્લાયરને પેમેન્ટ ચૂકવો" : "Pay This Supplier"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
