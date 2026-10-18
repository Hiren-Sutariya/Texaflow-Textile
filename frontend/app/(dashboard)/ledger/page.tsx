"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchApi, getCachedApi } from "@/lib/api";
import { getTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { useLanguage } from "@/context/LanguageContext";
import { getDueStatus } from "@/lib/creditTerms";
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
  FileText
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
  type: "BILL" | "PAYMENT";
  refNo: string;
  partyName: string;
  description: string;
  modeOrTerms?: string;
  openingBalance?: number;
  debit: number;   // Inward Bill / Purchase (Increases payable)
  credit: number;  // Payment Voucher (Decreases payable)
  runningBalance?: number;
  status?: string;
  dueDate?: string;
  isOverdue?: boolean;
  notes?: string;
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
    { value: "All", label: isGujarati ? "બધા વ્યવહારો" : "All Transactions", badge: String(count) },
    { value: "BILL", label: isGujarati ? "ખરીદી બિલ (Dr)" : "Inward Bills (Dr)" },
    { value: "PAYMENT", label: isGujarati ? "પેમેન્ટ ચૂકવણી (Cr)" : "Payments (Cr)" },
    { value: "OVERDUE", label: isGujarati ? "મુદત બાકી બિલ" : "Overdue Mudat" }
  ];

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={containerRef} className="relative inline-block w-full sm:w-44 text-xs select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 bg-white border rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-300"
        }`}
      >
        <span className="font-bold text-slate-900 truncate mr-1">{selectedOption.label}</span>
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
    { value: "ALL", label: isGujarati ? "બધો સમય (All Time)" : "All Time" },
    { value: "THIS_MONTH", label: isGujarati ? "આ મહિનો (This Month)" : "This Month" },
    { value: "LAST_30", label: isGujarati ? "છેલ્લા ૩૦ દિવસ" : "Last 30 Days" },
    { value: "FY_26_27", label: isGujarati ? "નાણાકીય વર્ષ ૨૬-૨૭" : "FY 2026-27" },
    { value: "CUSTOM", label: isGujarati ? "કસ્ટમ તારીખ..." : "Custom Range..." }
  ];

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={containerRef} className="relative inline-block w-full sm:w-40 text-xs select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 bg-white border rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-300"
        }`}
      >
        <div className="flex items-center gap-1.5 truncate mr-1">
          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-bold text-slate-900 truncate">{selectedOption.label}</span>
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
  const [vouchers, setVouchers] = useState<PaymentVoucherItem[]>(SEED_VOUCHERS);
  const [vendors, setVendors] = useState<VendorMaster[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState(initialPartyQuery);
  const [partyFilter, setPartyFilter] = useState(initialPartyQuery || "All");
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
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");
  const [previewEntry, setPreviewEntry] = useState<LedgerEntry | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Custom Opening Balances per party (persisted to localStorage)
  const [customOpeningBalances, setCustomOpeningBalances] = useState<Record<string, number>>({});
  const [isEditingOpeningBal, setIsEditingOpeningBal] = useState(false);
  const [tempOpeningBal, setTempOpeningBal] = useState("");

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

  const handleSaveOpeningBalance = (partyName: string, newAmt: number) => {
    const norm = partyName.toLowerCase().trim();
    const updated = { ...customOpeningBalances, [norm]: newAmt };
    setCustomOpeningBalances(updated);
    try {
      localStorage.setItem("texaflow_ledger_opening_balances", JSON.stringify(updated));
    } catch {}
    setIsEditingOpeningBal(false);
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

    // 2. Vouchers
    try {
      const cachedVou = getCachedApi<PaymentVoucherItem[]>("/payments") || 
        getTenantItem<PaymentVoucherItem[]>("texaflow_vouchers", "om_sai_vouchers");
      if (Array.isArray(cachedVou) && cachedVou.length > 0) {
        setVouchers(cachedVou);
      }
    } catch {}

    // 3. Vendors Master
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

        if (livePur.status === "fulfilled" && Array.isArray(livePur.value) && livePur.value.length > 0) {
          setPurchases(livePur.value);
        }
        if (liveVou.status === "fulfilled" && Array.isArray(liveVou.value) && liveVou.value.length > 0) {
          setVouchers(liveVou.value);
        }
        if (liveVen.status === "fulfilled" && Array.isArray(liveVen.value) && liveVen.value.length > 0) {
          setVendors(liveVen.value);
        }
      } catch (e) {
        console.warn("Ledger load notice:", e);
      }
    }

    fetchLiveData();
  }, []);

  // Compile full unique list of all party names for dropdown
  const allPartyNames = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => { if (p.vendor_name) set.add(p.vendor_name.trim()); });
    vouchers.forEach((v) => { if (v.party_name) set.add(v.party_name.trim()); });
    vendors.forEach((v) => {
      const name = v.company_name || v.display_name;
      if (name) set.add(name.trim());
    });
    return Array.from(set).filter(Boolean).sort();
  }, [purchases, vouchers, vendors]);

  // Lookup map of party account types for distinctive visual badges
  const partyTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    vendors.forEach((v) => {
      const name = (v.company_name || v.display_name)?.trim();
      if (name) {
        map[name] = v.account_type || "Supplier / Vendor";
      }
    });
    return map;
  }, [vendors]);

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
    return allPartyNames.filter((name) => name.toLowerCase().includes(q));
  }, [allPartyNames, searchQuery, partyFilter]);

  // Compile Unified Ledger Entries
  const rawLedgerEntries = useMemo(() => {
    const entries: LedgerEntry[] = [];

    // 1. Inward Purchase Bills (Debit - Dr)
    purchases.forEach((p) => {
      let isOverdue = false;
      if (p.due_date && (p.payment_status === "Pending" || p.payment_status === "Unpaid")) {
        const dueInfo = getDueStatus(p.due_date, false);
        if (dueInfo && dueInfo.status === "Overdue") {
          isOverdue = true;
        }
      }

      entries.push({
        id: p.id || `pur-${p.purchase_no}`,
        date: p.date,
        rawDate: parseDateEpoch(p.date),
        type: "BILL",
        refNo: p.purchase_no,
        partyName: p.vendor_name || "Unknown Supplier",
        description: p.items_description || p.category || "કાપડ / મટિરિયલ ખરીદી બિલ",
        modeOrTerms: p.payment_terms || p.paid_via || "શાખ મુદત",
        debit: Number(p.amount) || 0,
        credit: 0,
        status: p.payment_status,
        dueDate: p.due_date,
        isOverdue,
        notes: p.notes
      });
    });

    // 2. Payment Vouchers (Credit - Cr)
    vouchers.forEach((v) => {
      entries.push({
        id: v.id || `vou-${v.voucher_no}`,
        date: v.date,
        rawDate: parseDateEpoch(v.date),
        type: "PAYMENT",
        refNo: v.voucher_no,
        partyName: v.party_name || "Unknown Party",
        description: v.notes || (v.ref_no ? `Ref: ${v.ref_no}` : "પેમેન્ટ ચૂકવણી વાઉચર"),
        modeOrTerms: v.mode || "RTGS / NEFT",
        debit: 0,
        credit: Number(v.amount) || 0,
        status: "Paid",
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
      const newBal = prevBal + entry.debit - entry.credit;
      partyBalances[partyKey] = newBal;
      return {
        ...entry,
        openingBalance: prevBal,
        runningBalance: newBal
      };
    });

    // Reverse to show latest first on top
    return entriesWithBalance.reverse();
  }, [purchases, vouchers, vendors, customOpeningBalances]);

  const selectedPartyOpeningBal = partyFilter !== "All" ? getPartyOpeningBal(partyFilter) : 0;

  // Overall Top 4 KPI Stats
  const stats = useMemo(() => {
    let totalBills = 0;
    let totalPaid = 0;
    let overdueAmt = 0;
    let totalOpening = 0;

    if (partyFilter !== "All") {
      totalOpening = selectedPartyOpeningBal;
    } else {
      allPartyNames.forEach((name) => {
        totalOpening += getPartyOpeningBal(name);
      });
    }

    const currentEntries = partyFilter === "All"
      ? rawLedgerEntries
      : rawLedgerEntries.filter((e) => e.partyName.toLowerCase().trim() === partyFilter.toLowerCase().trim());

    currentEntries.forEach((entry) => {
      totalBills += entry.debit;
      totalPaid += entry.credit;
      if (entry.type === "BILL" && entry.isOverdue && (entry.status === "Pending" || entry.status === "Unpaid")) {
        overdueAmt += entry.debit;
      }
    });

    const netOutstanding = totalOpening + totalBills - totalPaid;

    return {
      totalOpening,
      totalBills,
      totalPaid,
      netOutstanding,
      overdueAmt
    };
  }, [rawLedgerEntries, partyFilter, selectedPartyOpeningBal, allPartyNames, customOpeningBalances]);

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

  // Filtered Ledger Entries based on Search Query, Party Dropdown, Type, and Date Range
  const filteredEntries = useMemo(() => {
    return rawLedgerEntries.filter((item) => {
      // 1. Party Filter Dropdown
      if (partyFilter !== "All") {
        if (item.partyName.toLowerCase().trim() !== partyFilter.toLowerCase().trim()) {
          return false;
        }
      }

      // 2. Type Filter
      if (txnTypeFilter === "BILL" && item.type !== "BILL") return false;
      if (txnTypeFilter === "PAYMENT" && item.type !== "PAYMENT") return false;
      if (txnTypeFilter === "OVERDUE" && (!item.isOverdue || item.type !== "BILL")) return false;

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
  }, [rawLedgerEntries, partyFilter, txnTypeFilter, searchQuery, dateRangeEpoch]);

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (!filteredEntries.length) return;
    const headers = [
      "Date",
      "Ref / Bill No",
      "Party / Mill Name",
      "Particulars / Description",
      "Terms / Payment Mode",
      "Opening Balance (Rs)",
      "Debit Dr (Rs)",
      "Credit Cr (Rs)",
      "Net Closing Balance (Rs)",
      "Status"
    ];

    const rows = filteredEntries.map((e) => [
      e.date,
      e.refNo,
      `"${e.partyName.replace(/"/g, '""')}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${(e.modeOrTerms || "").replace(/"/g, '""')}"`,
      e.openingBalance ?? 0,
      e.debit,
      e.credit,
      e.runningBalance ?? 0,
      e.status || "Cleared"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filenameParty = partyFilter !== "All" ? partyFilter.replace(/\s+/g, "_") : searchQuery ? searchQuery.replace(/\s+/g, "_") : "All_Parties";
    link.setAttribute("download", `Ledger_${filenameParty}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp Share for single entry or filtered statement
  const handleShareWhatsApp = (entry: LedgerEntry) => {
    const todayStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    const isBill = entry.type === "BILL";
    const amt = isBill ? entry.debit : entry.credit;

    const lines = [
      `*🏛️ ઓમ સાઈ ટેક્સટાઇલ - ખાતાવહી નોંધ*`,
      `-----------------------------------------`,
      `📅 તારીખ: ${entry.date}`,
      `🏢 પાર્ટી / મિલ: *${entry.partyName}*`,
      `📄 સંદર્ભ / નં: *${entry.refNo}* (${isBill ? "ખરીદી બિલ" : "પેમેન્ટ વાઉચર"})`,
      `📦 વિગત: ${entry.description}`,
      `${isBill ? "🔴 ઉધાર રકમ (Dr)" : "🟢 ચૂકવેલ રકમ (Cr)"}: *₹${amt.toLocaleString("en-IN")}*`,
      entry.runningBalance !== undefined ? `⚖️ ખાતાની રનિંગ બાકી: *₹${entry.runningBalance.toLocaleString("en-IN")}*` : "",
      entry.dueDate ? `⏳ મુદત તારીખ: ${entry.dueDate}` : "",
      ``,
      `_વિગતવાર હિસાબ માટે સંપર્ક કરો: ઓમ સાઈ ટેક્સટાઇલ, સુરત._`
    ].filter(Boolean);

    const message = lines.join("\n");
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto select-none pb-12">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP 4 SUMMARY KPI CARDS (MATCHING PAYMENTS PAGE)           */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        
        {/* BOX 1: TOTAL INWARD BILLS (DR) */}
        <div className="p-3 sm:p-3.5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate mr-1">
              {isGujarati ? "કુલ ખરીદી બિલ (DR)" : "TOTAL INWARD BILLS (DR)"}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-xl font-black text-slate-900 tracking-tight font-mono">
              ₹{stats.totalBills.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* BOX 2: TOTAL PAID OUT (CR) */}
        <div className="p-3 sm:p-3.5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate mr-1">
              {isGujarati ? "કુલ ચૂકવેલ પેમેન્ટ (CR)" : "TOTAL PAID OUT (CR)"}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-xl font-black text-emerald-600 tracking-tight font-mono">
              ₹{stats.totalPaid.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* BOX 3: NET PAYABLE BALANCE */}
        <div className="p-3 sm:p-3.5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 uppercase tracking-wider truncate mr-1">
              {isGujarati ? "ચોખ્ખી બાકી શાખ (NET)" : "NET PAYABLE BALANCE"}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-xl font-black text-rose-600 tracking-tight font-mono">
              ₹{stats.netOutstanding.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
              {isGujarati ? "બાકી" : "Payable"}
            </span>
          </div>
        </div>

        {/* BOX 4: OVERDUE MUDAT AMOUNT */}
        <div className="p-3 sm:p-3.5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 uppercase tracking-wider truncate mr-1">
              {isGujarati ? "મુદત વીતી ગયેલ રકમ" : "OVERDUE MUDAT"}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-xl font-black text-amber-600 tracking-tight font-mono">
              ₹{stats.overdueAmt.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] font-bold text-amber-700">
              {stats.overdueAmt > 0 ? (isGujarati ? "ઓવરડ્યૂ" : "Overdue") : (isGujarati ? "સમયસર" : "On track")}
            </span>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. UNIFIED BAR WITH SEARCH BAR & PARTY + STATUS FILTERS       */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2.5 relative">
        
        {/* LEFT SEARCH INPUT: SEARCH PARTY, MILL, BILL NO, REF NO WITH INTEGRATED PARTY AUTOCOMPLETE */}
        <div ref={searchContainerRef} className="relative w-full sm:w-80 md:w-96">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={isGujarati ? "પાર્ટી શોધો, બિલ નં, વાઉચર નં..." : "Search party, mill, bill no, voucher..."}
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              if (val.trim().length > 0) {
                setIsPartySearchOpen(true);
                const exactMatch = allPartyNames.find((p) => p.toLowerCase().trim() === val.toLowerCase().trim());
                if (exactMatch) {
                  setPartyFilter(exactMatch);
                }
              } else {
                setIsPartySearchOpen(false);
                setPartyFilter("All");
              }
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0 && searchQuery.toLowerCase().trim() !== partyFilter.toLowerCase().trim()) {
                setIsPartySearchOpen(true);
              }
            }}
            className="w-full h-9 pl-8.5 pr-8 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition-all shadow-2xs"
          />
          {(searchQuery || partyFilter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setPartyFilter("All");
                setIsPartySearchOpen(false);
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-200/60 transition"
              title={isGujarati ? "ફિલ્ટર સાફ કરો" : "Clear filter"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* AUTOCOMPLETE / PARTY SUGGESTION DROPDOWN: ONLY AFTER TYPING & STARTS BELOW THE BAR */}
          {isPartySearchOpen && searchQuery.trim().length > 0 && matchingParties.length > 0 && (
            <div className="absolute z-50 left-0 min-w-full w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 top-full mt-[18px]">
              <div className="p-1.5 max-h-60 overflow-y-auto no-scrollbar space-y-1 pb-2">
                {matchingParties.map((pName) => {
                  const isSelected = partyFilter.toLowerCase().trim() === pName.toLowerCase().trim();
                  return (
                    <button
                      key={pName}
                      type="button"
                      onClick={() => {
                        setPartyFilter(pName);
                        setSearchQuery(pName);
                        setIsPartySearchOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-blue-50 text-blue-950 font-extrabold border-blue-500 shadow-2xs"
                          : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                        <span className="truncate font-bold">{pName}</span>
                        {partyTypeMap[pName] && (
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                            partyTypeMap[pName] === "Customer / Client"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : partyTypeMap[pName] === "Trading Partner"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : partyTypeMap[pName] === "Internal Firm"
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : partyTypeMap[pName] === "Job Work"
                              ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}>
                            {partyTypeMap[pName]}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT CONTROLS: TRANSACTION TYPE + DATE RANGE + EXCEL + PRINT */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">

          {/* 2. TRANSACTION TYPE DROPDOWN (REPLACES PILLS - SAME CARD DESIGN) */}
          <TxnTypeSelectDropdown
            value={txnTypeFilter}
            onChange={(val) => setTxnTypeFilter(val)}
            count={rawLedgerEntries.length}
            isGujarati={isGujarati}
          />

          {/* 3. DATE RANGE DROPDOWN (OPTION 1) */}
          <DateRangeSelectDropdown
            value={dateFilter}
            onChange={(val) => setDateFilter(val)}
            isGujarati={isGujarati}
          />

          {/* 4. DOWNLOAD EXCEL / CSV BUTTON */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title={isGujarati ? "Excel / CSV માં ડાઉનલોડ કરો" : "Download Excel / CSV"}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGujarati ? "Excel" : "Excel"}</span>
          </button>

          {/* 5. PRINT / PDF STATEMENT BUTTON (OPTION 1) */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title={isGujarati ? "ઓફિશિયલ સ્ટેટમેન્ટ પ્રિન્ટ / PDF ડાઉનલોડ" : "Print / PDF Statement"}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isGujarati ? "PDF પ્રિન્ટ" : "Print PDF"}</span>
          </button>

        </div>
      </div>

      {/* CUSTOM DATE RANGE PICKER (IF CUSTOM IS SELECTED) */}
      {dateFilter === "CUSTOM" && (
        <div className="bg-white p-2.5 px-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-100">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              {isGujarati ? "કસ્ટમ તારીખ ગાળો:" : "Select Date Range:"}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
              <span className="text-slate-400 font-bold">{isGujarati ? "થી" : "to"}</span>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
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
              {isGujarati ? "રીસેટ તારીખ" : "Reset Dates"}
            </button>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PARTY LIVE SUMMARY & OPENING BALANCE EDITABLE BAR             */}
      {/* ------------------------------------------------------------- */}
      {partyFilter !== "All" && (
        <div className="bg-white p-3 px-4 rounded-2xl border border-blue-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Building2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-slate-900">{partyFilter}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                  currentPartyAccountType === "Customer / Client"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : currentPartyAccountType === "Trading Partner"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : currentPartyAccountType === "Internal Firm"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : currentPartyAccountType === "Job Work"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                  {currentPartyAccountType || (isGujarati ? "પાર્ટી ખાતાવહી" : "Party Ledger")}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {isGujarati ? "રનિંગ લેજર હિસાબ (Live Statement)" : "Real-time running statement & reconciliation"}
              </p>
            </div>
          </div>

          {/* OPENING BALANCE EDITABLE FIELD */}
          <div className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/70 p-1.5 px-3 rounded-xl border border-slate-200 transition-all">
            <span className="text-xs font-bold text-slate-600">
              {isGujarati ? "શરૂઆતની બાકી (Opening Bal):" : "Opening Balance:"}
            </span>
            {isEditingOpeningBal ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={tempOpeningBal}
                  onChange={(e) => setTempOpeningBal(e.target.value)}
                  className="w-28 h-7 px-2 bg-white border border-blue-500 rounded-lg text-xs font-mono font-bold focus:outline-none shadow-2xs"
                  autoFocus
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleSaveOpeningBalance(partyFilter, Number(tempOpeningBal) || 0);
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                >
                  {isGujarati ? "સાચવો" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingOpeningBal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                  ₹{selectedPartyOpeningBal.toLocaleString("en-IN")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTempOpeningBal(String(selectedPartyOpeningBal || ""));
                    setIsEditingOpeningBal(true);
                  }}
                  className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 transition cursor-pointer flex items-center gap-1"
                  title={isGujarati ? "શરૂઆતની બાકી બદલો" : "Edit Opening Balance"}
                >
                  <span>{isGujarati ? "બાકી બદલો" : "Edit"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. CLEAN UNIFIED LEDGER TABLE & MOBILE CARD VIEW               */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        
        {/* MOBILE CARD VIEW (< md) */}
        <div className="block md:hidden p-3 space-y-3 bg-slate-50/50">
          {filteredEntries.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-medium text-xs">
              {isGujarati ? "કોઈ વ્યવહાર મળેલ નથી" : "No ledger records found matching your filters."}
            </div>
          ) : (
            filteredEntries.map((e) => {
              const isBill = e.type === "BILL";
              return (
                <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-500">{e.date}</span>
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {isGujarati ? "શરૂઆત:" : "Op:"} ₹{(e.openingBalance || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{e.partyName}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{e.description}</p>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-black text-sm ${isBill ? "text-rose-700" : "text-emerald-700"}`}>
                        {isBill ? "+" : "-"}₹{(isBill ? e.debit : e.credit).toLocaleString("en-IN")}
                      </div>
                      {e.runningBalance !== undefined && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 block">
                          આખર બાકી: ₹{e.runningBalance.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {e.refNo}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(e)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewEntry(e)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Slip"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md) - EXACT CLEAN TABLE DESIGN */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-3.5 px-4">{isGujarati ? "તારીખ" : "DATE"}</th>
                <th className="py-3.5 px-4">{isGujarati ? "બિલ / વાઉચર નં" : "REF / NO"}</th>
                <th className="py-3.5 px-4">{isGujarati ? "સપ્લાયર / પાર્ટી" : "PARTY / MILL"}</th>
                <th className="py-3.5 px-4">{isGujarati ? "વિગત / મટિરિયલ" : "PARTICULARS"}</th>
                <th className="py-3.5 px-4">{isGujarati ? "મુદત / મોડ" : "TERMS / MODE"}</th>
                <th className="py-3.5 px-4 text-right text-slate-600 font-bold">{isGujarati ? "શરૂઆતની બાકી (₹)" : "OPENING BAL (₹)"}</th>
                <th className="py-3.5 px-4 text-right text-rose-700">{isGujarati ? "ઉધાર (DR)" : "DEBIT (DR)"}</th>
                <th className="py-3.5 px-4 text-right text-emerald-700">{isGujarati ? "જમા (CR)" : "CREDIT (CR)"}</th>
                <th className="py-3.5 px-4 text-right font-black text-slate-900">{isGujarati ? "આખર બાકી (₹)" : "NET BALANCE"}</th>
                <th className="py-3.5 px-4 text-center">{isGujarati ? "સ્ટેટસ" : "STATUS"}</th>
                <th className="py-3.5 px-4 text-center w-20">{isGujarati ? "એક્શન" : "ACTION"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {partyFilter !== "All" && (
                <tr className="bg-slate-50/70 border-b border-slate-200/90 font-medium">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-400 text-xs">—</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg border bg-slate-100 border-slate-300 text-slate-700">
                      OP-BAL
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-slate-900 text-xs">
                    {partyFilter}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-bold text-slate-700">
                    {isGujarati ? "શરૂઆતની બાકી (Opening Balance B/F)" : "Opening Balance Brought Forward"}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-400 whitespace-nowrap">—</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 text-xs whitespace-nowrap">
                    ₹{selectedPartyOpeningBal.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400 whitespace-nowrap">—</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400 whitespace-nowrap">—</td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-xs whitespace-nowrap">
                    ₹{selectedPartyOpeningBal.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {isGujarati ? "શરૂઆત" : "Opening"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-400">—</td>
                </tr>
              )}

              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                    {isGujarati ? "કોઈ વ્યવહાર મળેલ નથી. ફિલ્ટર અથવા સર્ચ બદલો." : "No ledger records found matching your filters."}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => {
                  const isBill = e.type === "BILL";
                  return (
                    <tr key={e.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* 1. Date */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap align-middle">
                        {e.date}
                      </td>

                      {/* 2. Ref / Bill No */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                        <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          isBill ? "text-blue-700 bg-blue-50/90 border-blue-200" : "text-emerald-700 bg-emerald-50/90 border-emerald-200"
                        }`}>
                          {e.refNo}
                        </span>
                      </td>

                      {/* 3. Party / Mill Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                        <button
                          type="button"
                          onClick={() => setPartyFilter(e.partyName)}
                          className="font-extrabold text-slate-900 text-xs hover:text-blue-600 hover:underline transition-colors cursor-pointer text-left"
                          title={isGujarati ? "આ પાર્ટીના તમામ વ્યવહારો ફિલ્ટર કરો" : "Filter by this party"}
                        >
                          {e.partyName}
                        </button>
                      </td>

                      {/* 5. Particulars */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="text-xs font-bold text-slate-800 leading-snug">
                          {e.description}
                        </span>
                      </td>

                      {/* 6. Terms / Mode */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle font-mono text-xs">
                        {isBill ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-800 font-bold text-xs">{e.modeOrTerms || "શાખ"}</span>
                            {e.dueDate && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Calendar className="w-3 h-3 text-blue-600" />
                                <span>{e.dueDate}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {e.modeOrTerms || "RTGS"}
                          </span>
                        )}
                      </td>

                      {/* Opening Balance for this transaction */}
                      <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap font-mono font-bold text-slate-700 text-xs">
                        ₹{(e.openingBalance || 0).toLocaleString("en-IN")}
                      </td>

                      {/* 7. Debit (Dr) */}
                      <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap font-mono font-black text-rose-700 text-sm">
                        {e.debit > 0 ? `₹${e.debit.toLocaleString("en-IN")}` : "—"}
                      </td>

                      {/* 8. Credit (Cr) */}
                      <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap font-mono font-black text-emerald-700 text-sm">
                        {e.credit > 0 ? `₹${e.credit.toLocaleString("en-IN")}` : "—"}
                      </td>

                      {/* 9. Running Balance */}
                      <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                        {e.runningBalance !== undefined ? (
                          <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border inline-block ${
                            e.runningBalance > 0
                              ? "bg-rose-50/90 text-rose-700 border-rose-200"
                              : e.runningBalance < 0
                              ? "bg-blue-50/90 text-blue-700 border-blue-200"
                              : "bg-emerald-50/90 text-emerald-700 border-emerald-200"
                          }`}>
                            ₹{e.runningBalance.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* 10. Status */}
                      <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                        {isBill ? (
                          e.status === "Paid" ? (
                            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50/90 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                              {t("Paid")}
                            </span>
                          ) : e.isOverdue ? (
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

                      {/* 11. Action */}
                      <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(e)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Share on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewEntry(e)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
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
          </table>
        </div>

        {/* TABLE FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 font-medium gap-2">
          <div>
            {isGujarati ? "કુલ વ્યવહારો:" : "Total Records:"} <b className="text-slate-900 font-bold">{filteredEntries.length}</b>
            {partyFilter !== "All" && (
              <span className="ml-2 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                પાર્ટી: {partyFilter}
              </span>
            )}
          </div>
          <div>
            {isGujarati ? "નેટ બાકી શાખ:" : "Net Balance:"}{" "}
            <b className={stats.netOutstanding > 0 ? "text-rose-600 font-black font-mono text-sm" : "text-emerald-600 font-black font-mono text-sm"}>
              ₹{stats.netOutstanding.toLocaleString("en-IN")}
            </b>
          </div>
        </div>

      </div>

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
                  <div className="font-black text-slate-900 text-sm tracking-wide uppercase">OM SAI TEXTILES</div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {previewEntry.type === "BILL" ? "Material Inward Bill" : "Payment Voucher Out"}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${
                  previewEntry.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {previewEntry.status === "Paid" ? t("Paid") : t("Pending / શાખ")}
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs shadow-2xs overflow-hidden">
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{isGujarati ? "સંદર્ભ નં" : "Ref No"}</span>
                  <span className="font-extrabold font-mono text-blue-700">{previewEntry.refNo}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{isGujarati ? "તારીખ" : "Date"}</span>
                  <span className="font-extrabold text-slate-800">{previewEntry.date}</span>
                </div>
                <div className="p-3 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">{isGujarati ? "પાર્ટી / સપ્લાયર" : "Party / Mill"}</span>
                  <span className="font-extrabold text-slate-900 text-right">{previewEntry.partyName}</span>
                </div>
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
                {previewEntry.runningBalance !== undefined && (
                  <div className="p-3 flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">{isGujarati ? "રનિંગ બેલેન્સ" : "Running Balance"}</span>
                    <span className="font-bold font-mono text-slate-800">₹{previewEntry.runningBalance.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="p-3.5 flex items-center justify-between bg-slate-50/50">
                  <span className="text-xs font-black text-slate-700 uppercase">{isGujarati ? "રકમ (₹)" : "Amount (₹)"}</span>
                  <span className="text-base font-black font-mono text-slate-900">
                    ₹{(previewEntry.type === "BILL" ? previewEntry.debit : previewEntry.credit).toLocaleString("en-IN")}
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
      {/* 6. OFFICIAL PRINT / PDF STATEMENT MODAL (OPTION 1)           */}
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
                    {isGujarati ? "ઓફિશિયલ ખાતાવહી પ્રિન્ટ પ્રિવ્યૂ" : "Official Statement Print Preview"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isGujarati ? "A4 સાઇઝમાં પ્રિન્ટ અથવા PDF સેવ કરો" : "Print on A4 or save as PDF"}
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
                  <span>{isGujarati ? "પ્રિન્ટ કરો (Print)" : "Print Now"}</span>
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
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">OM SAI TEXTILES</h1>
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mt-0.5">Wholesale Fabric Manufacturers & Traders</p>
                  <p className="text-xs text-slate-600 font-medium mt-1">Plot No. 104-106, Surat Textile Market, Ring Road, Surat - 395002</p>
                  <p className="text-xs text-slate-600 font-medium">GSTIN: <b className="text-slate-900">24AAAFO1234F1Z8</b> | Phone: +91 98251 00000</p>
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Statement For (પાર્ટી હિસાબ)</span>
                  <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {partyFilter === "All" ? "All Parties / Combined Statement" : partyFilter}
                  </h4>
                  <p className="text-slate-500 mt-0.5">Surat, Gujarat, India</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Net Closing Balance (આખર બાકી)</span>
                  <div className="text-base font-black font-mono text-rose-600 mt-0.5">
                    ₹{stats.netOutstanding.toLocaleString("en-IN")} {stats.netOutstanding > 0 ? "Dr (બાકી)" : "Cr"}
                  </div>
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
                      <th className="py-2.5 px-3 text-right">Debit Dr (₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit Cr (₹)</th>
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
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{e.refNo}</td>
                        <td className="py-2 px-3">{e.description}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                          {e.debit > 0 ? `₹${e.debit.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                          {e.credit > 0 ? `₹${e.credit.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                          ₹{(e.runningBalance ?? 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 uppercase">Total / Net Balance</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-700">₹{stats.totalBills.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">₹{stats.totalPaid.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">₹{stats.netOutstanding.toLocaleString("en-IN")}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* BANK DETAILS & SIGNATURE BLOCK */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                <div>
                  <span className="font-extrabold text-slate-800 block mb-1">Bank Payment Details:</span>
                  <p className="text-slate-600">Bank: <b className="text-slate-900">ICICI Bank, Ring Road Branch, Surat</b></p>
                  <p className="text-slate-600">Account: <b className="text-slate-900 font-mono">Om Sai Textiles (002405001234)</b></p>
                  <p className="text-slate-600">IFSC Code: <b className="text-slate-900 font-mono">ICIC0000024</b></p>
                </div>
                <div className="flex flex-col items-end justify-end">
                  <div className="w-48 border-t border-dashed border-slate-400 pt-1 text-center">
                    <p className="font-bold text-slate-800">For, Om Sai Textiles</p>
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
