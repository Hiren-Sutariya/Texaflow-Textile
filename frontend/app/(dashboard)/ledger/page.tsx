"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchApi, getCachedApi } from "@/lib/api";
import { getTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { useLanguage } from "@/context/LanguageContext";
import { getDueStatus, calculateDueDate } from "@/lib/creditTerms";
import {
  BookOpen,
  Search,
  Download,
  Printer,
  Calendar,
  CreditCard,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  MessageCircle,
  FileSpreadsheet,
  Building2,
  ChevronDown,
  X,
  Eye,
  SlidersHorizontal,
  Check,
  FileText,
  Truck,
  Users,
  Pencil,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react";
import {
  getStoredSalesChallans,
  getStoredSalesInvoices,
  SalesChallan,
  SalesInvoice
} from "@/lib/salesStorage";
import {
  CompanySettings,
  getStoredCompanySettings,
  fetchLiveCompanySettings,
  getFieldLabel
} from "@/lib/companySettings";

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
  items?: any;
  quantity?: number | string;
  rate?: number | string;
  design_no?: string;
}

export interface PaymentVoucherItem {
  id: string;
  voucher_no: string;
  date: string;
  party_name: string;
  payer_person?: string;
  designNo?: string;
  linked_challan?: string;
  kasar_amount?: number;
  type: "Payment Out" | "Receipt In";
  linked_source?: string;
  amount: number;
  mode: string;
  ref_no: string;
  notes: string;
  company_id?: string;
}

export interface VendorMaster {
  id: string;
  company_name: string;
  display_name: string;
  account_type?: string;
  work_phone?: string;
  mobile?: string;
  gstin?: string;
  payment_terms?: string;
  opening_balance?: number;
}

export interface LedgerEntry {
  id: string;
  date: string;
  rawDate: number;
  type: "BILL" | "PAYMENT" | "SALES_CHALLAN" | "SALES_INVOICE";
  refNo: string;
  partyName: string;
  payerPerson?: string;
  designNo?: string;
  quantity?: number | string;
  rate?: number | string;
  totalCp?: number;
  paidAmount?: number;
  kasarAmount?: number;
  description: string;
  modeOrTerms?: string;
  openingBalance?: number;
  debit: number;   // Customer: Goods Sold (Receivable) | Supplier: Payment Made
  credit: number;  // Customer: Payment Received | Supplier: Goods Purchased (Payable)
  runningBalance?: number;
  balanceType?: "Dr" | "Cr";
  status?: string;
  dueDate?: string;
  isOverdue?: boolean;
  notes?: string;
  isCustomer?: boolean;
}

export function formatShortRefNo(ref: string) {
  if (!ref) return "-";
  return ref.replace(/-(?:20\d{2})-/, "-");
}

export interface PartySummaryItem {
  partyName: string;
  category: "Customer" | "Supplier";
  accountType: string;
  openingBalance: number;
  totalBilled: number;
  totalPaid: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  balanceType: "Dr" | "Cr";
  status: "Due" | "Settled" | "Advance";
  transactionCount: number;
  lastDate?: string;
}

const SEED_PURCHASES: PurchaseItem[] = [];
const SEED_VOUCHERS: PaymentVoucherItem[] = [];



interface TxnTypeSelectDropdownProps {
  value: "All" | "BILL" | "PAYMENT" | "OVERDUE";
  onChange: (val: "All" | "BILL" | "PAYMENT" | "OVERDUE") => void;
  count: number;
  isGujarati: boolean;
}

function TxnTypeSelectDropdown({
  value,
  onChange,
  count,
  isGujarati
}: TxnTypeSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: Array<{ value: "All" | "BILL" | "PAYMENT" | "OVERDUE"; label: string; badge?: string }> = [
    { value: "All", label: "All Transactions", badge: String(count) },
    { value: "BILL", label: "Invoices & Bills (+)" },
    { value: "PAYMENT", label: "Payments & Receipts (-)" },
    { value: "OVERDUE", label: "Overdue Dues" }
  ];

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={containerRef} className="relative inline-block w-full sm:w-48 text-xs select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 bg-white border rounded-xl flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors focus:outline-none cursor-pointer ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200"
        }`}
      >
        <span className="font-bold text-slate-700 truncate mr-1">{selectedOption.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 left-0 min-w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 top-full mt-[18px]"
        >
          <div className="p-1.5 max-h-56 overflow-y-auto no-scrollbar space-y-1 pb-2">
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-blue-50 text-blue-950 font-extrabold border-blue-500 shadow-2xs"
                      : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface DateRangeSelectDropdownProps {
  value: "ALL" | "THIS_MONTH" | "LAST_30" | "FY_26_27" | "CUSTOM";
  onChange: (val: "ALL" | "THIS_MONTH" | "LAST_30" | "FY_26_27" | "CUSTOM") => void;
  isGujarati: boolean;
}

function DateRangeSelectDropdown({
  value,
  onChange,
  isGujarati
}: DateRangeSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: Array<{ value: "ALL" | "THIS_MONTH" | "LAST_30" | "FY_26_27" | "CUSTOM"; label: string }> = [
    { value: "ALL", label: "All Time" },
    { value: "THIS_MONTH", label: "This Month" },
    { value: "LAST_30", label: "Last 30 Days" },
    { value: "FY_26_27", label: "FY 2026-27" },
    { value: "CUSTOM", label: "Custom Range..." }
  ];

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={containerRef} className="relative inline-block w-full sm:w-40 text-xs select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 bg-white border rounded-xl flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors focus:outline-none cursor-pointer ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200"
        }`}
      >
        <div className="flex items-center gap-1.5 truncate mr-1">
          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-bold text-slate-700 truncate">{selectedOption.label}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 left-0 min-w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 top-full mt-[18px]"
        >
          <div className="p-1.5 max-h-56 overflow-y-auto no-scrollbar space-y-1 pb-2">
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-blue-50 text-blue-950 font-extrabold border-blue-500 shadow-2xs"
                      : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LedgerPage() {
  const searchParams = useSearchParams();
  const initialPartyQuery = searchParams.get("party") || "";

  const { language, t } = useLanguage();
  const isGujarati = language === "gu";

  // Data states
  const [purchases, setPurchases] = useState<PurchaseItem[]>(SEED_PURCHASES);
  const [salesChallans, setSalesChallans] = useState<SalesChallan[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [vouchers, setVouchers] = useState<PaymentVoucherItem[]>(SEED_VOUCHERS);
  const [vendors, setVendors] = useState<VendorMaster[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState(initialPartyQuery);
  const [partyFilter, setPartyFilter] = useState(initialPartyQuery || "All");
  const [partyCategoryFilter, setPartyCategoryFilter] = useState<"ALL" | "CUSTOMERS" | "SUPPLIERS">("ALL");
  const [dueFilter, setDueFilter] = useState<"ALL" | "DUE_ONLY" | "SETTLED_ONLY">("ALL");
  const [isPartySearchOpen, setIsPartySearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close party search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsPartySearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [txnTypeFilter, setTxnTypeFilter] = useState<"All" | "BILL" | "PAYMENT" | "OVERDUE">("All");
  const [dateFilter, setDateFilter] = useState<"ALL" | "THIS_MONTH" | "LAST_30" | "FY_26_27" | "CUSTOM">("ALL");
  const [partySortOrder, setPartySortOrder] = useState<"CHRONOLOGICAL" | "LATEST_FIRST">("CHRONOLOGICAL");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");
  const [previewEntry, setPreviewEntry] = useState<LedgerEntry | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => getStoredCompanySettings());

  useEffect(() => {
    fetchLiveCompanySettings().then((s) => {
      if (s) setCompanySettings(s);
    });
  }, []);

  // Custom Opening Balances per party (persisted to localStorage)
  const [customOpeningBalances, setCustomOpeningBalances] = useState<Record<string, number>>({});

  // Load saved custom opening balances
  useEffect(() => {
    try {
      const saved = localStorage.getItem("texaflow_ledger_opening_balances");
      if (saved) {
        setCustomOpeningBalances(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const getPartyOpeningBal = (partyName: string): number => {
    if (!partyName || partyName === "All") return 0;
    const norm = partyName.toLowerCase().trim();
    if (customOpeningBalances[norm] !== undefined) {
      return customOpeningBalances[norm];
    }
    const match = vendors.find((v) => {
      const vName = (v.company_name || v.display_name || "").toLowerCase().trim();
      return vName === norm || norm.includes(vName) || vName.includes(norm);
    });
    return Number(match?.opening_balance) || 0;
  };

  const handleSendDueReminderWhatsApp = (e: React.MouseEvent, p: PartySummaryItem) => {
    e.stopPropagation();
    const firmName = companySettings?.company_name || "Om Sai / Shiv Creation";
    const matchedVendor = vendors.find(
      (v) => (v.company_name || v.display_name)?.toLowerCase().trim() === p.partyName.toLowerCase().trim()
    );
    const phone = (matchedVendor?.mobile || matchedVendor?.work_phone || "").replace(/[^0-9]/g, "");

    const balText = `₹${p.closingBalance.toLocaleString("en-IN")}`;
    const isCust = p.category === "Customer" || p.balanceType === "Dr";

    const message = isCust
      ? `*PAYMENT REMINDER - ${firmName.toUpperCase()}*\n\n` +
        `નમસ્તે *${p.partyName}*,\n` +
        `આપના ખાતામાં *${balText}* (બાકી રકમ) બોલે છે.\n\n` +
        `કૃપા કરી વહેલી તકે ચુકવણી કરવા વિનંતી.\n` +
        `બેંક વિગત અથવા UPI માટે સંપર્ક કરવો.\n\n` +
        `આભાર! 🙏\n_${firmName}_`
      : `*ACCOUNT STATEMENT - ${firmName.toUpperCase()}*\n\n` +
        `નમસ્તે *${p.partyName}*,\n` +
        `આપના ખાતા મુજબ *${balText}* ચૂકવવાના બાકી બોલે છે.\n\n` +
        `ખાતાવહી મેળવવા વિનંતી.\n` +
        `આભાર! 🙏\n_${firmName}_`;

    const waUrl = phone.length >= 10
      ? `https://wa.me/91${phone.slice(-10)}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank");
  };

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

  // Load records on mount
  useEffect(() => {
    const currentCid = getStoredCompanyId() || "comp-001";

    // 1. Purchases
    try {
      const cachedPur = getCachedApi<PurchaseItem[]>("/purchases") || 
        getTenantItem<PurchaseItem[]>("texaflow_purchases", currentCid === "comp-001" ? "om_sai_purchases" : undefined);
      if (Array.isArray(cachedPur) && cachedPur.length > 0) {
        setPurchases(cachedPur);
      }
    } catch {}

    // 2. Sales Challans & Invoices
    try {
      setSalesChallans(getStoredSalesChallans());
      setSalesInvoices(getStoredSalesInvoices());
    } catch {}

    // 3. Vouchers
    try {
      const cachedVou = getCachedApi<PaymentVoucherItem[]>("/payments") || 
        getTenantItem<PaymentVoucherItem[]>("texaflow_vouchers", "om_sai_vouchers");
      if (Array.isArray(cachedVou) && cachedVou.length > 0) {
        setVouchers(cachedVou);
      }
    } catch {}

    // 4. Vendors Master
    try {
      const cachedVen = getCachedApi<VendorMaster[]>("/vendors") || 
        getTenantItem<VendorMaster[]>("app_vendors_master", "om_sai_vendors");
      if (Array.isArray(cachedVen) && cachedVen.length > 0) {
        setVendors(cachedVen);
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

        if (livePur.status === "fulfilled" && Array.isArray(livePur.value)) {
          setPurchases(livePur.value);
        }
        if (liveVou.status === "fulfilled" && Array.isArray(liveVou.value)) {
          setVouchers(liveVou.value);
        }
        if (liveVen.status === "fulfilled" && Array.isArray(liveVen.value)) {
          setVendors(liveVen.value);
        }
      } catch (e) {
        console.warn("Ledger load notice:", e);
      }
    }

    fetchLiveData();

    const handleSalesSync = () => {
      try {
        setSalesChallans(getStoredSalesChallans());
        setSalesInvoices(getStoredSalesInvoices());
      } catch {}
    };

    const handleSettingsSync = () => {
      try {
        setCompanySettings(getStoredCompanySettings());
      } catch {}
    };

    window.addEventListener("texaflow_sales_updated", handleSalesSync);
    window.addEventListener("texaflow_sales_invoices_updated", handleSalesSync);
    window.addEventListener("app_settings_update", handleSettingsSync);
    window.addEventListener("app_settings_updated", handleSettingsSync);

    return () => {
      window.removeEventListener("texaflow_sales_updated", handleSalesSync);
      window.removeEventListener("texaflow_sales_invoices_updated", handleSalesSync);
      window.removeEventListener("app_settings_update", handleSettingsSync);
      window.removeEventListener("app_settings_updated", handleSettingsSync);
    };
  }, []);

  // Compile full unique list of all party names for dropdown
  const allPartyNames = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => { if (p.vendor_name) set.add(p.vendor_name.trim()); });
    salesChallans.forEach((c) => { if (c.party_name) set.add(c.party_name.trim()); });
    salesInvoices.forEach((i) => { if (i.customer_name) set.add(i.customer_name.trim()); });
    vouchers.forEach((v) => { if (v.party_name) set.add(v.party_name.trim()); });
    vendors.forEach((v) => {
      const name = v.company_name || v.display_name;
      if (name) set.add(name.trim());
    });
    return Array.from(set).filter(Boolean).sort();
  }, [purchases, salesChallans, salesInvoices, vouchers, vendors]);

  // Lookup map of party account types for distinctive visual badges
  const partyTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    vendors.forEach((v) => {
      const name = (v.company_name || v.display_name)?.trim();
      if (name) {
        map[name] = v.account_type || "Supplier / Vendor";
      }
    });

    // Auto mark customers from sales if not explicitly set
    salesChallans.forEach((c) => {
      const name = c.party_name?.trim();
      if (name && !map[name]) {
        map[name] = "Customer / Client";
      }
    });
    salesInvoices.forEach((i) => {
      const name = i.customer_name?.trim();
      if (name && !map[name]) {
        map[name] = "Customer / Client";
      }
    });

    return map;
  }, [vendors, salesChallans, salesInvoices]);

  const currentPartyAccountType = useMemo(() => {
    if (partyFilter === "All") return null;
    return partyTypeMap[partyFilter.trim()] || null;
  }, [partyTypeMap, partyFilter]);

  // Matching parties for search bar party autocomplete (only when user has typed)
  const matchingParties = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.toLowerCase().trim() === partyFilter.toLowerCase().trim()) {
      return [];
    }
    const q = searchQuery.toLowerCase().trim();
    return allPartyNames.filter((name) => {
      const matchesSearch = name.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (partyCategoryFilter === "CUSTOMERS") {
        return partyTypeMap[name]?.includes("Customer") || salesChallans.some((c) => c.party_name === name) || salesInvoices.some((i) => i.customer_name === name);
      }
      if (partyCategoryFilter === "SUPPLIERS") {
        return !partyTypeMap[name]?.includes("Customer") || purchases.some((p) => p.vendor_name === name);
      }
      return true;
    });
  }, [allPartyNames, searchQuery, partyFilter, partyCategoryFilter, partyTypeMap, salesChallans, salesInvoices, purchases]);

  // Compile Unified Ledger Entries
  const rawLedgerEntries = useMemo(() => {
    const entries: LedgerEntry[] = [];

    // 1. Sales Tax Invoices (Customer Debit - Dr)
    salesInvoices.forEach((inv) => {
      const dueDate = inv.due_date || (inv.credit_days ? calculateDueDate(inv.date, inv.credit_days) : inv.date);
      const isPaid = inv.payment_status === "Paid";
      const dueInfo = dueDate ? getDueStatus(dueDate, isPaid) : null;
      const challanInfo = inv.linked_challan_nos?.length
        ? ` (Challans: ${inv.linked_challan_nos.map((c) => `#${c}`).join(", ")})`
        : "";
      const firstItem = inv.items?.[0];
      const dNo = firstItem?.design_no || (inv as any).design_no || (firstItem?.description?.match(/D\.?\s*No\.?\s*\d+/i)?.[0]) || "D.No. 550";
      const qty = firstItem?.quantity ?? inv.total_quantity ?? 0;
      const rate = firstItem?.rate ?? (Number(qty) > 0 ? Math.round(Number(inv.total_amount) / Number(qty)) : 0);
      const totalCp = Number(inv.total_amount) || 0;

      entries.push({
        id: inv.id || `inv-${inv.invoice_no}`,
        date: inv.date,
        rawDate: parseDateEpoch(inv.date),
        type: "SALES_INVOICE",
        refNo: inv.invoice_no,
        partyName: inv.customer_name || "Unknown Customer",
        designNo: dNo,
        quantity: qty,
        rate: rate,
        totalCp: totalCp,
        description: `${inv.category || inv.items_description || (isGujarati ? "સેલ્સ પાકું બિલ (Tax Invoice)" : "Sales Tax Invoice")}${challanInfo}`,
        modeOrTerms: inv.payment_terms || "30d Credit",
        debit: totalCp, // Goods Sold = Debit to customer
        credit: 0,
        status: inv.payment_status,
        dueDate,
        isOverdue: dueInfo?.status === "Overdue" && !isPaid,
        isCustomer: true,
        notes: inv.notes
      });
    });

    // 2. Delivery Challans are intentionally excluded from Ledger as per accounting rules:
    // Only final sales tax invoices, purchase bills, and payment/receipt vouchers form the legal ledger.

    // 3. Inward Purchase Bills from Suppliers (Supplier Credit - Cr)
    purchases.forEach((p) => {
      let isOverdue = false;
      if (p.due_date && (p.payment_status === "Pending" || p.payment_status === "Unpaid")) {
        const dueInfo = getDueStatus(p.due_date, false);
        if (dueInfo && dueInfo.status === "Overdue") {
          isOverdue = true;
        }
      }
      const firstItem = Array.isArray(p.items) ? p.items[0] : null;
      const dNo = p.category || firstItem?.description || (p.items_description?.split("-")?.[0]?.trim()) || "Raw Material";
      const qty = p.quantity || firstItem?.quantity || (p.items_description?.match(/\d+/)?.[0] || 0);
      const rate = p.rate || firstItem?.rate || (Number(qty) > 0 ? Math.round(Number(p.amount) / Number(qty)) : 0);
      const totalCp = Number(p.amount) || 0;

      entries.push({
        id: p.id || `pur-${p.purchase_no}`,
        date: p.date,
        rawDate: parseDateEpoch(p.date),
        type: "BILL",
        refNo: p.purchase_no,
        partyName: p.vendor_name || "Unknown Supplier",
        designNo: dNo,
        quantity: qty,
        rate: rate,
        totalCp: totalCp,
        description: p.items_description || p.category || (isGujarati ? "કાપડ / મટિરિયલ ખરીદી બિલ" : "Fabric / Material Inward Bill"),
        modeOrTerms: p.payment_terms || p.paid_via || (isGujarati ? "શાખ મુદત" : "Credit Terms"),
        debit: 0,
        credit: totalCp, // Inward Material = Credit to Supplier
        status: p.payment_status,
        dueDate: p.due_date,
        isOverdue,
        isCustomer: false,
        notes: p.notes
      });
    });

    // 4. Payment Vouchers (Receipts In from Customers & Payments Out to Suppliers)
    vouchers.forEach((v) => {
      const kasar = Number(v.kasar_amount || 0);
      const paid = Number(v.amount || 0);
      const total = paid + kasar;
      const payerTag = v.payer_person ? ` [${v.payer_person}]` : "";
      const isReceipt = v.type === "Receipt In";

      const voucherDesc = isReceipt
        ? (v.notes ? `${v.notes}${payerTag}` : `Payment Received${payerTag}`)
        : (v.notes ? `${v.notes}${payerTag}` : (v.ref_no ? `Ref: ${v.ref_no}` : `Payment Out Voucher`));

      entries.push({
        id: v.id || `vou-${v.voucher_no}`,
        date: v.date,
        rawDate: parseDateEpoch(v.date),
        type: "PAYMENT",
        refNo: v.voucher_no,
        partyName: v.party_name || "Unknown Party",
        payerPerson: v.payer_person || v.mode || (isReceipt ? "Receipt" : "Payment"),
        designNo: v.designNo || "—",
        quantity: "—",
        rate: "—",
        totalCp: 0,
        paidAmount: total,
        kasarAmount: kasar,
        description: voucherDesc,
        modeOrTerms: v.mode || "RTGS / NEFT",
        debit: isReceipt ? 0 : total,  // Payment to Supplier = Debit
        credit: isReceipt ? total : 0, // Payment from Customer = Credit
        status: "Paid",
        isCustomer: isReceipt,
        notes: v.notes
      });
    });

    // Sort chronologically (oldest first) to compute running balances per party
    entries.sort((a, b) => a.rawDate - b.rawDate);

    // Compute running balance per party starting with party's opening balance
    const partyBalances: Record<string, number> = {};
    const entriesWithBalance = entries.map((entry) => {
      const partyKey = entry.partyName.toLowerCase().trim();
      const initialOpening = getPartyOpeningBal(entry.partyName);
      const prevBal = partyBalances[partyKey] !== undefined ? partyBalances[partyKey] : initialOpening;

      const isCust = entry.isCustomer || Boolean(partyTypeMap[entry.partyName]?.includes("Customer"));
      let newBal = 0;
      let bType: "Dr" | "Cr" = "Dr";

      if (isCust) {
        // Customer: Sales (+) Debit, Receipts (-) Credit
        newBal = prevBal + entry.debit - entry.credit;
        bType = newBal >= 0 ? "Dr" : "Cr";
      } else {
        // Supplier: Purchases (+) Credit, Payments (-) Debit
        newBal = prevBal + entry.credit - entry.debit;
        bType = newBal >= 0 ? "Cr" : "Dr";
      }

      partyBalances[partyKey] = newBal;
      return {
        ...entry,
        openingBalance: prevBal,
        runningBalance: Math.abs(newBal),
        balanceType: bType
      };
    });

    // Reverse to show latest first on top
    return entriesWithBalance.reverse();
  }, [purchases, salesChallans, salesInvoices, vouchers, vendors, customOpeningBalances, partyTypeMap, isGujarati]);

  const selectedPartyOpeningBal = partyFilter !== "All" ? getPartyOpeningBal(partyFilter) : 0;

  // Overall Top 4 KPI Stats
  const stats = useMemo(() => {
    let totalReceivable = 0; // Customer Dr balances
    let totalPayable = 0;    // Supplier Cr balances
    let totalSales = 0;
    let totalPurchases = 0;

    // Calculate per party balances
    const partyMap: Record<string, { dr: number; cr: number; isCust: boolean }> = {};

    rawLedgerEntries.forEach((entry) => {
      const pKey = entry.partyName.toLowerCase().trim();
      if (!partyMap[pKey]) {
        const isCust = entry.isCustomer || Boolean(partyTypeMap[entry.partyName]?.includes("Customer"));
        partyMap[pKey] = { dr: 0, cr: 0, isCust };
      }
      partyMap[pKey].dr += entry.debit;
      partyMap[pKey].cr += entry.credit;

      if (entry.isCustomer || entry.type === "SALES_CHALLAN" || entry.type === "SALES_INVOICE") {
        totalSales += entry.debit;
      } else if (entry.type === "BILL") {
        totalPurchases += entry.credit;
      }
    });

    Object.entries(partyMap).forEach(([pKey, val]) => {
      const op = customOpeningBalances[pKey] || 0;
      if (val.isCust) {
        const net = op + val.dr - val.cr;
        if (net > 0) totalReceivable += net;
      } else {
        const net = op + val.cr - val.dr;
        if (net > 0) totalPayable += net;
      }
    });

    return {
      totalReceivable,
      totalPayable,
      totalSales,
      totalPurchases,
      count: rawLedgerEntries.length
    };
  }, [rawLedgerEntries, customOpeningBalances, partyTypeMap]);

  // Date Range Epoch Computation
  const dateRangeEpoch = useMemo(() => {
    const now = new Date(2026, 9, 17); // October 17, 2026
    if (dateFilter === "ALL") return null;
    if (dateFilter === "THIS_MONTH") {
      const from = new Date(2026, 9, 1).getTime();
      const to = new Date(2026, 9, 31, 23, 59, 59).getTime();
      return { from, to };
    }
    if (dateFilter === "LAST_30") {
      const to = now.getTime();
      const from = to - 30 * 24 * 60 * 60 * 1000;
      return { from, to };
    }
    if (dateFilter === "FY_26_27") {
      const from = new Date(2026, 3, 1).getTime(); // 1st April 2026
      const to = new Date(2027, 2, 31, 23, 59, 59).getTime(); // 31st March 2027
      return { from, to };
    }
    if (dateFilter === "CUSTOM") {
      const from = customFromDate ? parseDateEpoch(customFromDate) : undefined;
      const to = customToDate ? parseDateEpoch(customToDate) + (24 * 60 * 60 * 1000 - 1) : undefined;
      return { from, to };
    }
    return null;
  }, [dateFilter, customFromDate, customToDate]);

  // Party Summaries for Directory View (Excel Grid)
  const partySummaries = useMemo<PartySummaryItem[]>(() => {
    const map: Record<string, {
      entries: LedgerEntry[];
      isCust: boolean;
      accountType: string;
    }> = {};

    allPartyNames.forEach((name) => {
      const pKey = name.toLowerCase().trim();
      const isCust = Boolean(partyTypeMap[name]?.includes("Customer"));
      map[pKey] = {
        entries: [],
        isCust,
        accountType: partyTypeMap[name] || (isCust ? "Customer / Client" : "Supplier / Vendor")
      };
    });

    rawLedgerEntries.forEach((entry) => {
      const pKey = entry.partyName.toLowerCase().trim();
      if (!map[pKey]) {
        const isCust = entry.isCustomer || Boolean(partyTypeMap[entry.partyName]?.includes("Customer"));
        map[pKey] = {
          entries: [],
          isCust,
          accountType: partyTypeMap[entry.partyName] || (isCust ? "Customer / Client" : "Supplier / Vendor")
        };
      }
      map[pKey].entries.push(entry);
      if (entry.isCustomer) {
        map[pKey].isCust = true;
      }
    });

    const list: PartySummaryItem[] = [];

    Object.entries(map).forEach(([pKey, data]) => {
      const origName = allPartyNames.find((n) => n.toLowerCase().trim() === pKey) || data.entries[0]?.partyName || pKey;
      const opBal = getPartyOpeningBal(origName);
      const isCust = data.isCust;

      let totalBilled = 0;
      let totalPaid = 0;
      let totalDebit = 0;
      let totalCredit = 0;

      data.entries.forEach((e) => {
        totalDebit += (e.debit || 0);
        totalCredit += (e.credit || 0);
        if (isCust) {
          totalBilled += (e.debit || 0);
          totalPaid += (e.credit || 0);
        } else {
          totalBilled += (e.credit || 0);
          totalPaid += (e.debit || 0);
        }
      });

      const net = isCust ? (opBal + totalBilled - totalPaid) : (opBal + totalBilled - totalPaid);
      const balanceType: "Dr" | "Cr" = isCust ? (net >= 0 ? "Dr" : "Cr") : (net >= 0 ? "Cr" : "Dr");
      let status: "Due" | "Settled" | "Advance" = "Settled";

      if (net === 0) {
        status = "Settled";
      } else if (net > 0) {
        status = "Due";
      } else {
        status = "Advance";
      }

      list.push({
        partyName: origName,
        category: isCust ? "Customer" : "Supplier",
        accountType: data.accountType,
        openingBalance: opBal,
        totalBilled,
        totalPaid,
        totalDebit,
        totalCredit,
        closingBalance: Math.abs(net),
        balanceType,
        status,
        transactionCount: data.entries.length,
        lastDate: data.entries[0]?.date
      });
    });

    // Default sort: highest closing balance first
    list.sort((a, b) => b.closingBalance - a.closingBalance);
    return list;
  }, [allPartyNames, rawLedgerEntries, partyTypeMap, customOpeningBalances]);

  const filteredPartySummaries = useMemo(() => {
    return partySummaries.filter((p) => {
      if (partyCategoryFilter === "CUSTOMERS" && p.category !== "Customer") return false;
      if (partyCategoryFilter === "SUPPLIERS" && p.category !== "Supplier") return false;
      if (dueFilter === "DUE_ONLY" && (p.closingBalance <= 0 || p.status !== "Due")) return false;
      if (dueFilter === "SETTLED_ONLY" && p.status !== "Settled") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.partyName.toLowerCase().includes(q);
        const matchesType = p.accountType.toLowerCase().includes(q);
        if (!matchesName && !matchesType) return false;
      }
      return true;
    });
  }, [partySummaries, partyCategoryFilter, searchQuery, dueFilter]);

  const totalMarketDue = useMemo(() => {
    return partySummaries
      .filter((p) => p.category === "Customer" && p.balanceType === "Dr")
      .reduce((acc, p) => acc + p.closingBalance, 0);
  }, [partySummaries]);

  const totalPayableDue = useMemo(() => {
    return partySummaries
      .filter((p) => p.category === "Supplier" && p.balanceType === "Cr")
      .reduce((acc, p) => acc + p.closingBalance, 0);
  }, [partySummaries]);

  // Filtered Ledger Entries based on Search Query, Party Dropdown, Type, Category, and Date Range
  const filteredEntries = useMemo(() => {
    const list = rawLedgerEntries.filter((item) => {
      // 1. Party Category Filter (Customers vs Suppliers vs All)
      if (partyFilter === "All") {
        if (partyCategoryFilter === "CUSTOMERS" && !item.isCustomer) return false;
        if (partyCategoryFilter === "SUPPLIERS" && item.isCustomer) return false;
      } else {
        if (item.partyName.toLowerCase().trim() !== partyFilter.toLowerCase().trim()) {
          return false;
        }
      }

      // 2. Type Filter
      const isBillType = item.type === "BILL" || item.type === "SALES_CHALLAN" || item.type === "SALES_INVOICE";
      if (txnTypeFilter === "BILL" && !isBillType) return false;
      if (txnTypeFilter === "PAYMENT" && item.type !== "PAYMENT") return false;
      if (txnTypeFilter === "OVERDUE" && (!item.isOverdue || !isBillType)) return false;

      // 3. Search Query (Matches Party Name, Bill/Voucher No, Description, Terms, or Date)
      if (searchQuery.trim() && searchQuery.trim().toLowerCase() !== partyFilter.toLowerCase().trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesParty = item.partyName.toLowerCase().includes(q);
        const matchesRef = item.refNo.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesTerms = (item.modeOrTerms || "").toLowerCase().includes(q);
        const matchesDate = item.date.toLowerCase().includes(q);

        if (!matchesParty && !matchesRef && !matchesDesc && !matchesTerms && !matchesDate) {
          return false;
        }
      }

      // 4. Date Range Filter
      if (dateRangeEpoch) {
        if (dateRangeEpoch.from && item.rawDate < dateRangeEpoch.from) return false;
        if (dateRangeEpoch.to && item.rawDate > dateRangeEpoch.to) return false;
      }

      return true;
    });

    if (partyFilter !== "All" && partySortOrder === "CHRONOLOGICAL") {
      // rawLedgerEntries is in reverse-chronological order, so reversing gives standard chronological statement order
      return [...list].reverse();
    }

    return list;
  }, [rawLedgerEntries, partyFilter, partyCategoryFilter, txnTypeFilter, searchQuery, dateRangeEpoch, partySortOrder]);

  // Selected Party KPI Stats (When inside a specific party's statement)
  const selectedPartyStats = useMemo(() => {
    if (partyFilter === "All") return null;
    const isCust = currentPartyAccountType === "Customer / Client" || rawLedgerEntries.find(e => e.partyName.toLowerCase() === partyFilter.toLowerCase())?.isCustomer;
    const partyDr = filteredEntries.reduce((s, e) => s + (e.debit || 0), 0);
    const partyCr = filteredEntries.reduce((s, e) => s + (e.credit || 0), 0);
    const op = selectedPartyOpeningBal || 0;
    const net = isCust ? (op + partyDr - partyCr) : (op + partyCr - partyDr);
    return {
      isCust,
      op,
      billedOrPurchases: isCust ? partyDr : partyCr,
      paidOrReceived: isCust ? partyCr : partyDr,
      net,
      statusText: net === 0 ? "Settled" : isCust ? (net > 0 ? "Receivable" : "Advance") : (net > 0 ? "To Pay" : "Advance")
    };
  }, [partyFilter, currentPartyAccountType, rawLedgerEntries, filteredEntries, selectedPartyOpeningBal]);

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (partyFilter === "All") {
      if (!filteredPartySummaries.length) return;
      const headers = [
        "Sr",
        "Party / Account Name",
        "Category",
        "Account Type",
        "Opening Balance (Rs)",
        "Total Billed / Purchases (Rs)",
        "Total Paid / Received (Rs)",
        "Closing Balance (Rs)",
        "Balance Type (Dr/Cr)",
        "Status"
      ];
      const rows = filteredPartySummaries.map((p, idx) => [
        idx + 1,
        `"${p.partyName.replace(/"/g, '""')}"`,
        p.category,
        `"${p.accountType.replace(/"/g, '""')}"`,
        p.openingBalance,
        p.totalBilled,
        p.totalPaid,
        p.closingBalance,
        p.balanceType,
        p.status
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Party_Accounts_Summary_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (!filteredEntries.length) return;
    const headers = [
      "Date",
      "Bill No",
      "Party Name",
      "Qty",
      "Rate (Rs)",
      "Total Capital (Rs)",
      "Opening Bal (Rs)",
      "Debit Dr (Rs)",
      "Credit Cr (Rs)",
      "Net Balance (Rs)"
    ];

    const rows = filteredEntries.map((e) => [
      e.date,
      formatShortRefNo(e.refNo),
      `"${e.partyName.replace(/"/g, '""')}"`,
      e.quantity && e.quantity !== "—" ? e.quantity : "",
      e.rate && e.rate !== "—" ? e.rate : "",
      (e.totalCp && e.totalCp > 0) ? e.totalCp : (e.debit || e.credit || 0),
      e.openingBalance ?? 0,
      e.debit || 0,
      e.credit || 0,
      e.runningBalance ?? 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filenameParty = partyFilter.replace(/\s+/g, "_");
    link.setAttribute("download", `Ledger_${filenameParty}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp Share for single entry
  const handleShareWhatsApp = (entry: LedgerEntry) => {
    const isSale = entry.type === "SALES_INVOICE" || entry.type === "SALES_CHALLAN";
    const isBill = entry.type === "BILL";
    const amt = entry.debit > 0 ? entry.debit : entry.credit;
    const firmName = getStoredCompanyId() === "comp-002"
      ? (isGujarati ? "ઓમ સાઈ એન્ટરપ્રાઈઝ" : "Om Sai Enterprise")
      : (isGujarati ? "શિવ ક્રિએશન" : "Shiv Creation");

    const typeLabel = entry.type === "SALES_INVOICE"
      ? (isGujarati ? "વેચાણ પાકું બિલ (Tax Invoice)" : "Sales Tax Invoice")
      : entry.type === "SALES_CHALLAN"
      ? (isGujarati ? "ડિલિવરી ચલણ (Sales Challan)" : "Sales Delivery Challan")
      : isBill
      ? (isGujarati ? "ખરીદી બિલ (Inward Purchase)" : "Inward Purchase Bill")
      : entry.isCustomer
      ? (isGujarati ? "ગ્રાહક જમા રસીદ (Receipt In)" : "Payment Receipt In")
      : (isGujarati ? "સપ્લાયર પેમેન્ટ ચૂકવણી (Payment Out)" : "Payment Voucher Out");

    const lines = isGujarati ? [
      `*🏛️ ${firmName} - ખાતાવહી નોંધ*`,
      `-----------------------------------------`,
      `📅 તારીખ: ${entry.date}`,
      `🏢 પાર્ટી / ગ્રાહક: *${entry.partyName}*`,
      `📄 સંદર્ભ / નં: *${formatShortRefNo(entry.refNo)}* (${typeLabel})`,
      entry.payerPerson ? `👤 આપનાર ભાઈ: *${entry.payerPerson}*` : "",
      entry.designNo ? `🎨 ડિઝાઇન નં (DN): *${entry.designNo}*` : "",
      `📦 વિગત: ${entry.description}`,
      entry.debit > 0
        ? `🔴 ઉધાર રકમ (Dr): *₹${entry.debit.toLocaleString("en-IN")}*`
        : Boolean(entry.kasarAmount && entry.kasarAmount > 0)
        ? `💰 ચૂકવેલ રકમ: *₹${(entry.paidAmount || 0).toLocaleString("en-IN")}*\n🏷️ કસર / ડિસ્કાઉન્ટ: *₹${(entry.kasarAmount || 0).toLocaleString("en-IN")}*\n🟢 કુલ જમા રકમ (Cr): *₹${entry.credit.toLocaleString("en-IN")}*`
        : `🟢 જમા રકમ (Cr): *₹${entry.credit.toLocaleString("en-IN")}*`,
      entry.runningBalance !== undefined ? `⚖️ ખાતાની રનિંગ બાકી: *₹${Math.abs(entry.runningBalance).toLocaleString("en-IN")} ${entry.balanceType || (entry.runningBalance > 0 ? "Dr" : "Cr")}*` : "",
      entry.dueDate ? `⏳ મુદત તારીખ: ${entry.dueDate}` : "",
      ``,
      `_વિગતવાર હિસાબ માટે સંપર્ક કરો: ${firmName}, સુરત._`
    ].filter(Boolean) : [
      `*🏛️ ${firmName} - Ledger Record*`,
      `-----------------------------------------`,
      `📅 Date: ${entry.date}`,
      `🏢 Party / Customer: *${entry.partyName}*`,
      `📄 Ref / No: *${formatShortRefNo(entry.refNo)}* (${typeLabel})`,
      entry.payerPerson ? `👤 Payer: *${entry.payerPerson}*` : "",
      entry.designNo ? `🎨 Design No (DN): *${entry.designNo}*` : "",
      `📦 Description: ${entry.description}`,
      entry.debit > 0
        ? `🔴 Debit Amount (Dr): *₹${entry.debit.toLocaleString("en-IN")}*`
        : Boolean(entry.kasarAmount && entry.kasarAmount > 0)
        ? `💰 Paid Amount: *₹${(entry.paidAmount || 0).toLocaleString("en-IN")}*\n🏷️ Kasar / Discount: *₹${(entry.kasarAmount || 0).toLocaleString("en-IN")}*\n🟢 Total Credit (Cr): *₹${entry.credit.toLocaleString("en-IN")}*`
        : `🟢 Credit Amount (Cr): *₹${entry.credit.toLocaleString("en-IN")}*`,
      entry.runningBalance !== undefined ? `⚖️ Net Running Balance: *₹${Math.abs(entry.runningBalance).toLocaleString("en-IN")} ${entry.balanceType || (entry.runningBalance > 0 ? "Dr" : "Cr")}*` : "",
      entry.dueDate ? `⏳ Due Date: ${entry.dueDate}` : "",
      ``,
      `_For questions regarding this record, contact: ${firmName}, Surat._`
    ].filter(Boolean);

    const message = lines.join("\n");
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  // WhatsApp Share for full party statement
  const handleSharePartyStatementWhatsApp = () => {
    if (partyFilter === "All" && !searchQuery.trim()) {
      alert(isGujarati ? "કૃપા કરીને પહેલા કોઈ એક પાર્ટી સિલેક્ટ કરો જેથી તેનું સ્ટેટમેન્ટ મોકલી શકાય." : "Please select a specific party first.");
      return;
    }
    const targetParty = partyFilter !== "All" ? partyFilter : searchQuery.trim();
    const firmName = getStoredCompanyId() === "comp-002"
      ? (isGujarati ? "ઓમ સાઈ એન્ટરપ્રાઈઝ" : "Om Sai Enterprise")
      : (isGujarati ? "શિવ ક્રિએશન" : "Shiv Creation");
    const totalDr = filteredEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCr = filteredEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const opBal = selectedPartyOpeningBal || 0;
    const isCustomerParty = currentPartyAccountType === "Customer / Client";
    const netClosing = isCustomerParty ? (opBal + totalDr - totalCr) : (opBal + totalCr - totalDr);
    const closingTag = isCustomerParty
      ? (netClosing >= 0 ? "(લેવાના બાકી - Dr)" : "(જમા રકમ - Cr)")
      : (netClosing >= 0 ? "(ચૂકવવાના બાકી - Cr)" : "(એડવાન્સ ચૂકવેલ - Dr)");

    const lines = isGujarati ? [
      `*🏛️ ${firmName} - ખાતાવહી હિસાબ સ્ટેટમેન્ટ*`,
      `-----------------------------------------`,
      `🏢 પાર્ટી / ગ્રાહક: *${targetParty}*`,
      `📅 તારીખ: ${new Date().toLocaleDateString("en-IN")}`,
      `-----------------------------------------`,
      `🔹 શરૂઆતની બાકી (Op Bal): *₹${opBal.toLocaleString("en-IN")}*`,
      `🔴 કુલ ઉધાર (Dr): *₹${totalDr.toLocaleString("en-IN")}*`,
      `🟢 કુલ જમા (Cr): *₹${totalCr.toLocaleString("en-IN")}*`,
      `-----------------------------------------`,
      `⚖️ *આખર બાકી હિસાબ (Net Outstanding):*`,
      `👉 *₹${Math.abs(netClosing).toLocaleString("en-IN")} ${closingTag}*`,
      `-----------------------------------------`,
      `_વિગતવાર હિસાબ માટે સંપર્ક કરો: ${firmName}, સુરત._`
    ] : [
      `*🏛️ ${firmName} - Statement of Account*`,
      `-----------------------------------------`,
      `🏢 Party / Customer: *${targetParty}*`,
      `📅 Date: ${new Date().toLocaleDateString("en-IN")}`,
      `-----------------------------------------`,
      `🔹 Opening Balance: *₹${opBal.toLocaleString("en-IN")}*`,
      `🔴 Total Debit (Dr): *₹${totalDr.toLocaleString("en-IN")}*`,
      `🟢 Total Credit (Cr): *₹${totalCr.toLocaleString("en-IN")}*`,
      `-----------------------------------------`,
      `⚖️ *Net Outstanding Balance:*`,
      `👉 *₹${Math.abs(netClosing).toLocaleString("en-IN")} ${isCustomerParty ? (netClosing >= 0 ? "Dr (Receivable)" : "Cr (Advance)") : (netClosing >= 0 ? "Cr (Payable)" : "Dr (Advance)")}*`,
      `-----------------------------------------`,
      `_For detailed statement, contact: ${firmName}, Surat._`
    ];

    const message = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto select-none pb-12 font-sans">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP 4 SUMMARY KPI CARDS (EXACT SAME SIZE & STYLE AS SALES) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {selectedPartyStats ? (
          <>
            {/* CARD 1: OPENING BALANCE */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  OPENING BALANCE (B/F)
                </p>
                <p className="text-xl font-black text-slate-900 mt-0.5 font-mono">
                  ₹{selectedPartyStats.op.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <Clock className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* CARD 2: TOTAL BILLED / PURCHASES */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {selectedPartyStats.isCust ? "TOTAL BILLED (+)" : "TOTAL PURCHASES (+)"}
                </p>
                <p className="text-xl font-black text-slate-900 mt-0.5 font-mono">
                  ₹{selectedPartyStats.billedOrPurchases.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>

            {/* CARD 3: TOTAL PAID / RECEIVED */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {selectedPartyStats.isCust ? "TOTAL RECEIVED (-)" : "TOTAL PAID (-)"}
                </p>
                <p className="text-xl font-black text-slate-900 mt-0.5 font-mono">
                  ₹{selectedPartyStats.paidOrReceived.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
            </div>

            {/* CARD 4: NET CLOSING DUE */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                    NET CLOSING BALANCE
                  </p>
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                    selectedPartyStats.net === 0
                      ? "bg-slate-100 text-slate-600"
                      : selectedPartyStats.isCust
                      ? (selectedPartyStats.net > 0 ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700")
                      : (selectedPartyStats.net > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")
                  }`}>
                    {selectedPartyStats.statusText}
                  </span>
                </div>
                <p className={`text-xl font-black mt-0.5 font-mono ${
                  selectedPartyStats.net === 0
                    ? "text-slate-900"
                    : selectedPartyStats.isCust
                    ? (selectedPartyStats.net > 0 ? "text-blue-600" : "text-emerald-600")
                    : (selectedPartyStats.net > 0 ? "text-rose-600" : "text-emerald-600")
                }`}>
                  ₹{Math.abs(selectedPartyStats.net).toLocaleString("en-IN")}
                </p>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                selectedPartyStats.net === 0
                  ? "bg-slate-100 text-slate-600"
                  : selectedPartyStats.isCust
                  ? (selectedPartyStats.net > 0 ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600")
                  : (selectedPartyStats.net > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")
              }`}>
                {selectedPartyStats.net > 0 ? (
                  selectedPartyStats.isCust ? (
                    <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  )
                ) : (
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* CARD 1: TOTAL RECEIVABLE */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider truncate">
                  TOTAL RECEIVABLE
                </p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  ₹{stats.totalReceivable.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* CARD 2: TOTAL PAYABLE */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider truncate">
                  TOTAL PAYABLE
                </p>
                <p className="text-xl font-black text-rose-600 mt-0.5">
                  ₹{stats.totalPayable.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* CARD 3: TOTAL BILLED (SALES) */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  TOTAL BILLED (SALES)
                </p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  ₹{stats.totalSales.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>

            {/* CARD 4: TOTAL PURCHASES */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  TOTAL PURCHASES
                </p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  ₹{stats.totalPurchases.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. VIEW A: PARTY DIRECTORY (WHEN NO PARTY IS SELECTED)        */}
      {/* ------------------------------------------------------------- */}
      {partyFilter === "All" && (
        <div className="space-y-4">
          {/* ACTION & FILTER BAR FOR DIRECTORY */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Search Input on the left */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search party, mill, bill no, voucher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown & Actions on the right */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
              {/* Category Dropdown */}
              <div className="relative w-40 sm:w-44">
                <select
                  value={partyCategoryFilter}
                  onChange={(e) => setPartyCategoryFilter(e.target.value as any)}
                  className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-slate-300 focus:outline-none appearance-none shadow-2xs cursor-pointer"
                >
                  <option value="ALL">All Parties ({partySummaries.length})</option>
                  <option value="CUSTOMERS">Customers ({partySummaries.filter(p => p.category === "Customer").length})</option>
                  <option value="SUPPLIERS">Suppliers ({partySummaries.filter(p => p.category === "Supplier").length})</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Excel (Emerald Green) */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              {/* Print PDF (Blue) */}
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>

              {/* WhatsApp (Deep Green) */}
              <button
                type="button"
                onClick={handleSharePartyStatementWhatsApp}
                style={{ backgroundColor: "#0e7a53" }}
                className="h-9 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5 text-white" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {/* QUICK DUE STATUS PILL BUTTONS */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setDueFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                dueFilter === "ALL"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              બધા ખાતા ({partySummaries.length})
            </button>
            <button
              type="button"
              onClick={() => setDueFilter("DUE_ONLY")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                dueFilter === "DUE_ONLY"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>ઉઘરાણી / બાકી ({partySummaries.filter((p) => p.status === "Due").length})</span>
              <span className="font-mono font-extrabold ml-1">₹{totalMarketDue.toLocaleString("en-IN")}</span>
            </button>
            <button
              type="button"
              onClick={() => setDueFilter("SETTLED_ONLY")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                dueFilter === "SETTLED_ONLY"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ચુકતે / ક્લીયર ({partySummaries.filter((p) => p.status === "Settled").length})</span>
            </button>
          </div>

          {/* PARTY ACCOUNTS DIRECTORY TABLE (DIRECT START - NO BANNER) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 text-slate-600 font-extrabold border-b border-slate-200 uppercase text-[10px] tracking-wider whitespace-nowrap">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-200/80 text-center w-12">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-200/80">
                      {getFieldLabel(companySettings, "party_name", "Party / Account Name")}
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200/80">Account Type</th>
                    <th className="py-2.5 px-3 border-r border-slate-200/80 text-right">Opening Bal (₹)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200/80 text-right">Debit (Dr)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200/80 text-right">Credit (Cr)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200/80 text-right">Net Balance</th>
                    <th className="py-2.5 px-3 border-r border-slate-200/80 text-center">Status</th>
                    <th className="py-2.5 px-3 border-r border-slate-200/80 text-center">Last Transaction</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 bg-white">
                  {filteredPartySummaries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400 font-medium">
                        No party accounts found matching &quot;{searchQuery}&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredPartySummaries.map((p, idx) => (
                      <tr
                        key={p.partyName}
                        onClick={() => {
                          setPartyFilter(p.partyName);
                          setSearchQuery("");
                        }}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                      >
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 border-r border-slate-200/70 align-middle">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200/70 align-middle whitespace-nowrap group-hover:text-blue-600 transition-colors">
                          {p.partyName}
                        </td>
                        {/* Account Type without box, simple clean text like purchase page */}
                        <td className="py-2.5 px-3 border-r border-slate-200/70 align-middle whitespace-nowrap text-slate-600 font-medium">
                          {p.accountType}
                        </td>
                        {/* OPENING BAL */}
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 border-r border-slate-200/70 align-middle whitespace-nowrap">
                          ₹{p.openingBalance.toLocaleString("en-IN")}
                        </td>
                        {/* DEBIT (DR) (Clean neutral style like purchase page) */}
                        <td className="py-2.5 px-3 text-right font-mono align-middle border-r border-slate-200/70 whitespace-nowrap">
                          {p.totalDebit > 0 ? (
                            <span className="font-bold text-slate-900">₹{p.totalDebit.toLocaleString("en-IN")}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>
                        {/* CREDIT (CR) (Clean neutral style like purchase page) */}
                        <td className="py-2.5 px-3 text-right font-mono align-middle border-r border-slate-200/70 whitespace-nowrap">
                          {p.totalCredit > 0 ? (
                            <span className="font-bold text-slate-900">₹{p.totalCredit.toLocaleString("en-IN")}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>
                        {/* NET BALANCE (Clean neutral style like purchase page) */}
                        <td className="py-2.5 px-3 text-right font-mono align-middle border-r border-slate-200/70 whitespace-nowrap">
                          {p.closingBalance === 0 ? (
                            <span className="font-bold text-slate-500">₹0</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <span className="font-bold text-slate-900">
                                ₹{p.closingBalance.toLocaleString("en-IN")}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500">
                                {p.balanceType.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </td>
                        {/* STATUS (Clean subtle badge like purchase page) */}
                        <td className="py-2.5 px-3 text-center align-middle border-r border-slate-200/70 whitespace-nowrap">
                          {p.status === "Settled" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              Settled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                              Due
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono align-middle text-slate-600 border-r border-slate-200/70 whitespace-nowrap">
                          {p.lastDate ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="font-semibold text-slate-800">{p.lastDate}</span>
                              <span className="text-[10px] text-slate-400 font-sans">({p.transactionCount} txns)</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>
                        {/* ACTION (WHATSAPP REMINDER) */}
                        <td className="py-2.5 px-3 text-center align-middle whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleSendDueReminderWhatsApp(e, p)}
                            className="h-7 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer mx-auto shadow-2xs"
                            title={isGujarati ? "WhatsApp પર પેમેન્ટ રિમાઇન્ડર મોકલો" : "Send WhatsApp Reminder"}
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Reminder</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. VIEW B: SELECTED PARTY DETAILED LEDGER (IMAGE 2 BLUEPRINT)  */}
      {/* ------------------------------------------------------------- */}
      {partyFilter !== "All" && (
        <div className="space-y-4">
          {/* EXACT SEARCH & ACTION BAR (REPLICATED FROM 2ND IMAGE) */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Search Input on the Left */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search party, mill, bill no, voucher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
              />
              {(searchQuery || partyFilter !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setPartyFilter("All");
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear / All Parties"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdowns & Action Buttons on the Right */}
            <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
              {/* All Transactions Dropdown */}
              <TxnTypeSelectDropdown
                value={txnTypeFilter}
                onChange={setTxnTypeFilter}
                count={filteredEntries.length}
                isGujarati={isGujarati}
              />

              {/* Date Range Dropdown (📅 All Time) */}
              <DateRangeSelectDropdown
                value={dateFilter}
                onChange={(val) => setDateFilter(val)}
                isGujarati={isGujarati}
              />

              {/* Excel Button (Emerald Green) */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              {/* Print PDF Button (Blue) */}
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>

              {/* WhatsApp Button (Deep Green - Guaranteed Color) */}
              <button
                type="button"
                onClick={handleSharePartyStatementWhatsApp}
                style={{ backgroundColor: "#0e7a53" }}
                className="h-9 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5 text-white" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

            {/* CUSTOM DATE RANGE PICKER (IF CUSTOM IS SELECTED) */}
            {dateFilter === "CUSTOM" && (
              <div className="bg-slate-50 p-2.5 px-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                    Select Date Range:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customFromDate}
                      onChange={(e) => setCustomFromDate(e.target.value)}
                      className="h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                    />
                    <span className="text-slate-400 font-bold">to</span>
                    <input
                      type="date"
                      value={customToDate}
                      onChange={(e) => setCustomToDate(e.target.value)}
                      className="h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                </div>
                {(customFromDate || customToDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomFromDate("");
                      setCustomToDate("");
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                  >
                    Reset Dates
                  </button>
                )}
              </div>
            )}

          {/* DETAILED TEXTILE LEDGER TABLE (USER REQUESTED COLUMN LAYOUT) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/80 text-slate-600 font-extrabold border-b border-slate-200 uppercase text-[10px] tracking-wider whitespace-nowrap">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-200/80">Date</th>
                      <th className="py-2.5 px-3 border-r border-slate-200/80">
                        {getFieldLabel(companySettings, "bill_no", "Bill No")}
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200/80">
                        {getFieldLabel(companySettings, "party_name", "Party Name")}
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200/80 text-center">
                        {getFieldLabel(companySettings, "quantity", "Qty")}
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200/80 text-right">
                        {getFieldLabel(companySettings, "rate", "Rate (₹)")}
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200/80 text-right">
                        {getFieldLabel(companySettings, "total_amount", "Total Capital (₹)")}
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200/80 text-right">Opening Bal (₹)</th>
                      <th className="py-2.5 px-3 border-r border-slate-200/80 text-right">Debit (Dr)</th>
                      <th className="py-2.5 px-3 border-r border-slate-200/80 text-right">Credit (Cr)</th>
                      <th className="py-2.5 px-3 border-r border-slate-200/80 text-right">Net Balance (₹)</th>
                      <th className="py-2.5 px-2 text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 bg-white">
                    {/* ROW 1: OPENING BALANCE BROUGHT FORWARD */}
                    <tr className="bg-slate-50/80 font-semibold border-b border-slate-200">
                      <td className="py-2.5 px-3 font-mono text-slate-500 border-r border-slate-200/70 whitespace-nowrap align-middle">
                        01-04-2026
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 border-r border-slate-200/70 whitespace-nowrap align-middle">
                        OP-BAL
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200/70 whitespace-nowrap align-middle">
                        {partyFilter}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 border-r border-slate-200/70 whitespace-nowrap align-middle">
                        —
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400 border-r border-slate-200/70 whitespace-nowrap align-middle">
                        —
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200/70 whitespace-nowrap align-middle">
                        ₹{selectedPartyOpeningBal.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 border-r border-slate-200/70 whitespace-nowrap align-middle">
                        ₹{selectedPartyOpeningBal.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400 border-r border-slate-200/70 whitespace-nowrap align-middle">
                        —
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400 border-r border-slate-200/70 whitespace-nowrap align-middle">
                        —
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 border-r border-slate-200/70 whitespace-nowrap align-middle">
                        ₹{selectedPartyOpeningBal.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-2 text-center whitespace-nowrap align-middle">
                        <span className="text-slate-400 font-normal">—</span>
                      </td>
                    </tr>

                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-slate-400 font-medium">
                        No transactions recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((e) => {
                      return (
                        <tr key={e.id} className="hover:bg-blue-50/50 transition-colors">
                          {/* 1. DATE */}
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700 border-r border-slate-200/70 whitespace-nowrap align-middle">
                            {e.date}
                          </td>

                          {/* 2. BILL NO */}
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 border-r border-slate-200/70 whitespace-nowrap align-middle">
                            {formatShortRefNo(e.refNo)}
                          </td>

                          {/* 3. PARTY NAME */}
                          <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200/70 whitespace-nowrap align-middle">
                            {e.partyName}
                          </td>

                          {/* 4. QTY */}
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 border-r border-slate-200/70 whitespace-nowrap align-middle">
                            {e.quantity && e.quantity !== "—" ? (
                              e.quantity
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>

                          {/* 5. RATE (₹) */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 border-r border-slate-200/70 whitespace-nowrap align-middle">
                            {e.rate && e.rate !== "—" ? (
                              `₹${e.rate}`
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>

                          {/* 6. TOTAL CAPITAL (₹) */}
                          <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900 border-r border-slate-200/70 whitespace-nowrap align-middle">
                            {(e.totalCp && e.totalCp > 0) || e.debit > 0 || e.credit > 0 ? (
                              <span>₹{(e.totalCp || (e.isCustomer ? (e.debit || e.credit) : (e.credit || e.debit))).toLocaleString("en-IN")}</span>
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>

                          {/* 7. OPENING BAL (₹) */}
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 border-r border-slate-200/70 whitespace-nowrap align-middle">
                            ₹{(e.openingBalance ?? 0).toLocaleString("en-IN")}
                          </td>

                          {/* 8. DEBIT (DR) */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200/70 whitespace-nowrap align-middle">
                            {e.debit > 0 ? (
                              `₹${e.debit.toLocaleString("en-IN")}`
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>

                          {/* 9. CREDIT (CR) */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200/70 whitespace-nowrap align-middle">
                            {e.credit > 0 ? (
                              `₹${e.credit.toLocaleString("en-IN")}`
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>

                          {/* 10. NET BALANCE (₹) */}
                          <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900 border-r border-slate-200/70 whitespace-nowrap align-middle">
                            {e.runningBalance !== undefined ? (
                              <div className="flex items-center justify-end gap-1">
                                <span>₹{Math.abs(e.runningBalance).toLocaleString("en-IN")}</span>
                                <span className="text-[10px] text-slate-500 font-semibold">{e.balanceType || ""}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>

                          {/* 11. ACTION */}
                          <td className="py-2.5 px-2 text-center whitespace-nowrap align-middle">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleShareWhatsApp(e)}
                                className="p-1 text-slate-400 hover:text-emerald-600 transition cursor-pointer"
                                title="Share WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreviewEntry(e)}
                                className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                title="View Slip"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* TABLE SUMMARY TOTALS ROW */}
                <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-200 text-xs">
                  <tr>
                    <td colSpan={5} className="py-2.5 px-3 uppercase text-slate-600 text-[11px] font-extrabold border-r border-slate-200/80">
                      Total Statement Summary
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono border-r border-slate-200/80">
                      ₹{filteredEntries.reduce((s, e) => s + ((e.totalCp && e.totalCp > 0) ? e.totalCp : (e.type !== "PAYMENT" ? (e.isCustomer ? e.debit : e.credit) : 0)), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 border-r border-slate-200/80">—</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 border-r border-slate-200/80">
                      ₹{filteredEntries.reduce((s, e) => s + (e.debit || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 border-r border-slate-200/80">
                      ₹{filteredEntries.reduce((s, e) => s + (e.credit || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 border-r border-slate-200/80">
                      Net: ₹{(() => {
                        const isCust = currentPartyAccountType === "Customer / Client" || rawLedgerEntries.find(e => e.partyName.toLowerCase() === partyFilter.toLowerCase())?.isCustomer;
                        const partyDr = filteredEntries.reduce((s, e) => s + (e.debit || 0), 0);
                        const partyCr = filteredEntries.reduce((s, e) => s + (e.credit || 0), 0);
                        const op = selectedPartyOpeningBal || 0;
                        const net = isCust ? (op + partyDr - partyCr) : (op + partyCr - partyDr);
                        return Math.abs(net).toLocaleString("en-IN");
                      })()}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-400">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}



      {/* ------------------------------------------------------------- */}
      {/* 5. SLIP PREVIEW MODAL                                         */}
      {/* ------------------------------------------------------------- */}
      {previewEntry && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-extrabold text-slate-900">
                  {previewEntry.type === "BILL" ? (isGujarati ? "ખરીદી બિલ સ્લિપ" : "Purchase Bill Slip") : (isGujarati ? "પેમેન્ટ વાઉચર સ્લિપ" : "Payment Voucher Slip")}
                </h2>
              </div>
              <button
                onClick={() => setPreviewEntry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="font-black text-slate-900 text-sm tracking-wide uppercase">
                    {getStoredCompanyId() === "comp-002" ? "OM SAI ENTERPRISE" : "SHIV CREATION"}
                  </div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {previewEntry.type === "BILL" ? "Material Inward Bill" : "Payment Voucher"}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${
                  previewEntry.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {previewEntry.status === "Paid" ? t("Paid") : (isGujarati ? "પેન્ડિંગ / શાખ" : "Pending / Credit")}
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs shadow-2xs overflow-hidden">
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{isGujarati ? "સંદર્ભ નં" : "Ref No"}</span>
                  <span className="font-extrabold font-mono text-slate-900">{formatShortRefNo(previewEntry.refNo)}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{isGujarati ? "તારીખ" : "Date"}</span>
                  <span className="font-extrabold text-slate-800">{previewEntry.date}</span>
                </div>
                <div className="p-3 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">{isGujarati ? "પાર્ટી / સપ્લાયર" : "Party / Mill"}</span>
                  <span className="font-extrabold text-slate-900 text-right">{previewEntry.partyName}</span>
                </div>
                {previewEntry.payerPerson && (
                  <div className="p-3 flex items-center justify-between gap-4 bg-blue-50/40">
                    <span className="text-[10px] font-bold text-blue-700 uppercase shrink-0">{isGujarati ? "આપનાર ભાઈ" : "Payer"}</span>
                    <span className="font-bold text-blue-900 text-right">{previewEntry.payerPerson}</span>
                  </div>
                )}
                {previewEntry.designNo && (
                  <div className="p-3 flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">{isGujarati ? "ડિઝાઇન નં" : "Design No"}</span>
                    <span className="font-mono font-bold text-indigo-700 text-right">{previewEntry.designNo}</span>
                  </div>
                )}
                <div className="p-3 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{isGujarati ? "વિગત / મટિરિયલ" : "Particulars"}</span>
                  <span className="font-medium text-slate-800">{previewEntry.description}</span>
                </div>
                {previewEntry.modeOrTerms && (
                  <div className="p-3 flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">{isGujarati ? "મુદત / મોડ" : "Terms / Mode"}</span>
                    <span className="font-bold text-slate-800 font-mono">{previewEntry.modeOrTerms}</span>
                  </div>
                )}
                {Boolean(previewEntry.kasarAmount && previewEntry.kasarAmount > 0) && (
                  <div className="p-3 flex items-center justify-between gap-4 bg-amber-50/60">
                    <span className="text-[10px] font-bold text-amber-800 uppercase shrink-0">{isGujarati ? "કસર / વળતર" : "Kasar / Discount"}</span>
                    <span className="font-mono font-bold text-amber-900 text-right">₹{previewEntry.kasarAmount?.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {previewEntry.runningBalance !== undefined && (
                  <div className="p-3 flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">{isGujarati ? "રનિંગ બેલેન્સ" : "Running Balance"}</span>
                    <span className="font-bold font-mono text-slate-800">₹{previewEntry.runningBalance.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="p-3.5 flex items-center justify-between bg-slate-50/50">
                  <span className="text-xs font-black text-slate-700 uppercase">
                    {previewEntry.type === "BILL" ? (isGujarati ? "બિલ રકમ (₹)" : "Bill Amount (₹)") : (isGujarati ? "ચૂકવેલ રકમ (₹)" : "Amount Paid (₹)")}
                  </span>
                  <span className="text-base font-black font-mono text-slate-900">
                    ₹{(previewEntry.type === "BILL" ? previewEntry.debit : (previewEntry.paidAmount || previewEntry.credit)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPreviewEntry(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {isGujarati ? "બંધ કરો" : "Close"}
              </button>
              <button
                type="button"
                onClick={() => handleShareWhatsApp(previewEntry)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. OFFICIAL PRINT / PDF STATEMENT MODAL                        */}
      {/* ------------------------------------------------------------- */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] overflow-y-auto">
            
            {/* MODAL ACTION HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Official Statement Print Preview
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Print on A4 or save as PDF
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PRINTABLE STATEMENT CONTAINER (STYLED AS OFFICIAL STATEMENT) */}
            <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl space-y-6">
              
              {/* BRAND HEADER */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {companySettings.brand_name || companySettings.company_name}
                  </h1>
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mt-0.5">
                    {companySettings.tagline || "Wholesale Fabric Manufacturers & Embroidery Job Work"}
                  </p>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {companySettings.address}, {companySettings.city_state} - {companySettings.pincode}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    GSTIN: <b className="text-slate-900">{companySettings.gstin || "—"}</b> | Phone: +91 {companySettings.phone}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase rounded-lg tracking-wider">
                    STATEMENT OF ACCOUNT
                  </span>
                  <p className="text-xs font-bold text-slate-700 mt-2">
                    Date: <span className="font-mono">{new Date().toLocaleDateString("en-IN")}</span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    Financial Year: 2026-2027
                  </p>
                </div>
              </div>

              {/* PARTY & PERIOD DETAILS */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Statement For Party</span>
                  <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {partyFilter === "All" ? "All Parties / Combined Statement" : partyFilter}
                  </h4>
                  <p className="text-slate-500 mt-0.5">Surat, Gujarat, India</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Net Closing Balance</span>
                  {(() => {
                    const stmtDr = filteredEntries.reduce((s, e) => s + (e.debit || 0), 0);
                    const stmtCr = filteredEntries.reduce((s, e) => s + (e.credit || 0), 0);
                    const isCust = currentPartyAccountType === "Customer / Client";
                    const net = (partyFilter !== "All" ? selectedPartyOpeningBal : 0) + (isCust ? (stmtDr - stmtCr) : (stmtCr - stmtDr));
                    const badgeText = net === 0
                      ? "Settled (Nil)"
                      : isCust
                      ? (net > 0 ? "To Receive (Dr)" : "Advance Recd (Cr)")
                      : (net > 0 ? "To Pay (Cr)" : "Advance Paid (Dr)");
                    return (
                      <div className="text-base font-black font-mono text-slate-900 mt-0.5">
                        ₹{Math.abs(net).toLocaleString("en-IN")}{" "}
                        <span className="text-xs font-bold text-blue-700">({badgeText})</span>
                      </div>
                    );
                  })()}
                  <span className="text-[11px] text-slate-500 font-bold">Total Transactions: {filteredEntries.length}</span>
                </div>
              </div>

              {/* STATEMENT TABLE */}
              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Ref / No</th>
                      <th className="py-2.5 px-3">Particulars</th>
                      <th className="py-2.5 px-3 text-right">Debit Dr (+) (₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit Cr (-) (₹)</th>
                      <th className="py-2.5 px-3 text-right">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {/* OPENING BALANCE ROW */}
                    {partyFilter !== "All" && (
                      <tr className="bg-slate-50 font-bold">
                        <td className="py-2 px-3 font-mono text-slate-500">01-04-2026</td>
                        <td className="py-2 px-3 font-mono">OP-BAL</td>
                        <td className="py-2 px-3">Opening Balance Brought Forward</td>
                        <td className="py-2 px-3 text-right font-mono">—</td>
                        <td className="py-2 px-3 text-right font-mono">—</td>
                        <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                          ₹{selectedPartyOpeningBal.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    )}
                    {filteredEntries.map((e) => (
                      <tr key={e.id}>
                        <td className="py-2 px-3 font-mono">{e.date}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{formatShortRefNo(e.refNo)}</td>
                        <td className="py-2 px-3">{e.description}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-700">
                          {e.debit > 0 ? `+₹${e.debit.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                          {e.credit > 0 ? `-₹${e.credit.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                          ₹{(e.runningBalance ?? 0).toLocaleString("en-IN")} {e.balanceType || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {(() => {
                    const stmtDr = filteredEntries.reduce((s, e) => s + (e.debit || 0), 0);
                    const stmtCr = filteredEntries.reduce((s, e) => s + (e.credit || 0), 0);
                    return (
                      <tfoot className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={3} className="py-2.5 px-3 uppercase">Total Statement Amounts</td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-700">₹{stmtDr.toLocaleString("en-IN")}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700">₹{stmtCr.toLocaleString("en-IN")}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                            Dr ₹{stmtDr.toLocaleString("en-IN")} / Cr ₹{stmtCr.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      </tfoot>
                    );
                  })()}
                </table>
              </div>

              {/* BANK DETAILS & SIGNATURE BLOCK */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                <div>
                  <span className="font-extrabold text-slate-800 block mb-1">Bank Payment Details:</span>
                  <p className="text-slate-600">Bank: <b className="text-slate-900">{companySettings.bank_name || "State Bank of India"}</b></p>
                  <p className="text-slate-600">Account: <b className="text-slate-900 font-mono">{companySettings.account_holder || companySettings.company_name} ({companySettings.account_no || "—"})</b></p>
                  <p className="text-slate-600">IFSC Code: <b className="text-slate-900 font-mono">{companySettings.ifsc || "—"}</b></p>
                  {companySettings.branch_name && (
                    <p className="text-slate-600">Branch: <b className="text-slate-900">{companySettings.branch_name}</b></p>
                  )}
                </div>
                <div className="flex flex-col items-end justify-end">
                  <div className="w-56 border-t border-dashed border-slate-400 pt-1 text-center">
                    <p className="font-bold text-slate-800">{companySettings.signatory_label || `For, ${companySettings.company_name}`}</p>
                    <p className="text-[10px] text-slate-400 mt-3">Authorized Signatory</p>
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
