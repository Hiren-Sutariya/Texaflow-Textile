"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { fetchApi, getCachedApi, setCachedApi, invalidateApiCache } from "@/lib/api";
import { getTenantItem, setTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import {
  Plus,
  Search,
  Receipt,
  Calendar,
  Trash2,
  X,
  ChevronDown,
  Check,
  Upload,
  FileText,
  FileSpreadsheet,
  Clock,
  Tag,
  Package,
  Layers,
  Wrench,
  Zap,
  Coffee,
  Truck,
  Building2,
  HelpCircle,
  CreditCard,
  Edit3,
  AlertTriangle,
  Clock3
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getDueStatus } from "@/lib/creditTerms";
import { CourtFlowKpiCard, CourtFlowBadge, CourtFlowActionMenu } from "@/components/courtflow";

interface ExpenseItem {
  id: string;
  expense_no: string;
  date: string;
  category: string;
  vendor_name: string;
  amount: number;
  payment_status: "Paid" | "Pending" | "Unpaid";
  paid_via: string;
  notes?: string;
  bill_image?: string;
  payment_terms?: string;
  credit_days?: number;
  due_date?: string;
  linked_order?: string;
  paid_amount?: number;
  balance_amount?: number;
}

const sampleBillSvg =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='550' viewBox='0 0 400 550' fill='none'><rect width='400' height='550' rx='16' fill='%23FFFFFF'/><rect x='20' y='20' width='360' height='510' rx='12' fill='%23F8FAFC' stroke='%23E2E8F0' stroke-width='2'/><text x='40' y='60' fill='%231E293B' font-family='sans-serif' font-size='18' font-weight='bold'>SURAT INDUSTRIAL TAX &amp; POWER INVOICE</text><text x='40' y='85' fill='%2364748B' font-family='sans-serif' font-size='12'>GSTIN: 24AAACD9912E1Z8 | DATE: 24-SEP-2026</text><line x1='40' y1='100' x2='360' y2='100' stroke='%23CBD5E1' stroke-width='1.5'/><text x='40' y='130' fill='%23334155' font-family='sans-serif' font-size='13' font-weight='bold'>PARTICULARS / DESCRIPTION</text><text x='300' y='130' fill='%23334155' font-family='sans-serif' font-size='13' font-weight='bold'>AMOUNT</text><text x='40' y='165' fill='%23475569' font-family='sans-serif' font-size='13'>1. Industrial Power Tariff (4200 units)</text><text x='300' y='165' fill='%230F172A' font-family='sans-serif' font-size='13' font-weight='bold'>Rs. 38,000</text><text x='40' y='195' fill='%23475569' font-family='sans-serif' font-size='13'>2. Fixed Line Charges</text><text x='300' y='195' fill='%230F172A' font-family='sans-serif' font-size='13' font-weight='bold'>Rs. 4,500</text><line x1='40' y1='230' x2='360' y2='230' stroke='%23CBD5E1' stroke-dasharray='4 4'/><text x='40' y='265' fill='%231E293B' font-family='sans-serif' font-size='15' font-weight='bold'>TOTAL BILL AMOUNT</text><text x='290' y='265' fill='%231D4ED8' font-family='sans-serif' font-size='16' font-weight='black'>Rs. 42,500</text><rect x='40' y='300' width='320' height='120' rx='8' fill='%23EFF6FF' stroke='%23BFDBFE'/><text x='60' y='330' fill='%231E40AF' font-family='sans-serif' font-size='12' font-weight='bold'>PAYMENT STATUS: PAID (HDFC BANK)</text><text x='60' y='355' fill='%231E40AF' font-family='sans-serif' font-size='12'>Txn Ref: HDFC-991204812903</text><text x='60' y='380' fill='%231E40AF' font-family='sans-serif' font-size='12'>Verified stamp: DIGISCALE ERP OFFICIAL</text><text x='40' y='470' fill='%2394A3B8' font-family='sans-serif' font-size='11'>Physical Paper Bill scanned &amp; archived digitally.</text><rect x='280' y='440' width='80' height='60' rx='6' fill='%23E2E8F0'/><text x='295' y='475' fill='%2364748B' font-family='sans-serif' font-size='10'>STAMP</text></svg>";

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

const expenseCategories = [
  { name: "Packaging Materials", icon: Package },
  { name: "Dhaga & Consumables", icon: Layers },
  { name: "Machine Maintenance & Repairs", icon: Wrench },
  { name: "Electricity & Power", icon: Zap },
  { name: "Tea & Refreshments", icon: Coffee },
  { name: "Logistics & Courier", icon: Truck },
  { name: "Factory / Office Rent", icon: Building2 },
  { name: "Stationery & Printing", icon: FileText },
  { name: "Miscellaneous / Other", icon: HelpCircle },
];

const categoryOptions = [
  "Worker Expenses",
  "Packaging Materials",
  "Dhaga & Consumables",
  "Machine Maintenance & Repairs",
  "Electricity & Power",
  "Tea & Refreshments",
  "Logistics & Courier",
  "Factory / Office Rent",
  "Stationery & Printing",
  "Miscellaneous / Other",
  "Karigar Salary",
  "Worker Advance / Upad"
];

const paymentModeOptions = [
  "BANK TRANSFER (NEFT/RTGS/IMPS)",
  "UPI (GPay / PhonePe / Paytm)",
  "Cash",
  "Cheque",
  "Credit (15 days)",
  "Current Account HDFC"
];

const initialExpenses: ExpenseItem[] = [];


const formatDateDDMMYYYY = (dateStr: string) => {
  if (!dateStr || typeof dateStr !== "string") return "";
  const parts = dateStr.trim().split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }
  return dateStr;
};

const parseDate = (dateStr: string): Date => {
  if (!dateStr || typeof dateStr !== "string") return new Date(0);
  const parts = dateStr.trim().split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  return new Date(dateStr);
};

const normalizeAndRenumberExpenses = (list: ExpenseItem[]): ExpenseItem[] => {
  if (!Array.isArray(list) || list.length === 0) return list;

  // Professional ERP: Never purge actual records or mutate permanent expense numbers.
  const cleanSource = list.filter((item) => Boolean(item && (item.id || item.expense_no)));

  return cleanSource.map((item, idx) => {
    const cleanVendor = item.vendor_name === "General Vendor" ? "" : item.vendor_name || "";
    const cleanNo = item.expense_no || `EB-${String(idx + 1).padStart(3, "0")}`;
    return {
      ...item,
      id: item.id || `exp-${String(idx + 1).padStart(3, "0")}`,
      expense_no: cleanNo,
      vendor_name: cleanVendor
    };
  });
};

const toInputDate = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.trim().split("-");
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      // DD-MM-YYYY -> YYYY-MM-DD
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    if (parts[0].length === 4) {
      return dateStr;
    }
  }
  return dateStr;
};

export default function ExpensesPage() {
  const { t } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const currentCid = getStoredCompanyId() || "comp-001";
        // Check API memory/localStorage cache first (0 ms)
        const apiCached = getCachedApi<ExpenseItem[]>("/expenses");
        if (Array.isArray(apiCached) && apiCached.length > 0) {
          const scoped = apiCached.filter((item: any) => (item.company_id || currentCid) === currentCid);
          if (scoped.length > 0) return normalizeAndRenumberExpenses(scoped);
        }
        // Check tenant storage (0 ms)
        const saved = getTenantItem<ExpenseItem[]>("texaflow_expenses");
        if (Array.isArray(saved) && saved.length > 0) {
          const scoped = saved.filter((item: any) => (item.company_id || currentCid) === currentCid);
          if (scoped.length > 0) return normalizeAndRenumberExpenses(scoped);
        }
      } catch { }
    }
    return [];
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Pending">("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [periodFilter, setPeriodFilter] = useState<"all" | "this_week" | "this_month" | "this_year" | "custom_date">("all");
  const [startDate, setStartDate] = useState("2026-09-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [showModal, setShowModal] = useState(false);

  // Custom Dropdown Open States
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

  // Form Custom Dropdown States
  const [isFormCategoryOpen, setIsFormCategoryOpen] = useState(false);
  const [isFormPaidViaOpen, setIsFormPaidViaOpen] = useState(false);
  const [isFormStatusOpen, setIsFormStatusOpen] = useState(false);

  const [formCategories, setFormCategories] = useState<string[]>(categoryOptions);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddCatInputVisible, setIsAddCatInputVisible] = useState(false);
  const [selectedBillImage, setSelectedBillImage] = useState<{ notes?: string; expense_no: string; image: string } | null>(null);

  // New Expense Form State
  const [formData, setFormData] = useState({
    date: getTodayStr(),
    category: "Packaging Materials",
    vendor_name: "",
    amount: "" as string | number,
    payment_status: "Pending" as "Paid" | "Pending",
    paid_via: "Current Account HDFC",
    notes: "",
    bill_image: ""
  });
  const [showPayeeField, setShowPayeeField] = useState(false);

  // Input Refs for Enter Key Navigation
  const refDate = useRef<HTMLInputElement>(null);
  const refAmount = useRef<HTMLInputElement>(null);
  const refVendor = useRef<HTMLInputElement>(null);
  const refPaidVia = useRef<HTMLButtonElement>(null);
  const refStatus = useRef<HTMLButtonElement>(null);
  const refSubmit = useRef<HTMLButtonElement>(null);

  // Load expenses from Supabase Cloud Backend (with local fallback) on mount
  useEffect(() => {
    setHasMounted(true);
    let isMounted = true;
    const currentCid = getStoredCompanyId() || "comp-001";

    // Instant 0ms Sync Check on mount
    try {
      const immediate = getCachedApi<ExpenseItem[]>("/expenses") ||
        getTenantItem<ExpenseItem[]>("texaflow_expenses");
      if (immediate && Array.isArray(immediate)) {
        const scoped = immediate.filter((item: any) => (item.company_id || currentCid) === currentCid);
        setExpenses(normalizeAndRenumberExpenses(scoped));
      }
    } catch { }

    async function loadLiveExpenses() {
      try {
        const live = await fetchApi<ExpenseItem[]>("/expenses");
        if (isMounted && Array.isArray(live)) {
          const scoped = live.filter((item: any) => {
            const itemCid = item.company_id || currentCid;
            return itemCid === currentCid;
          });
          const cleanList = normalizeAndRenumberExpenses(scoped);
          setExpenses(cleanList);
          try {
            setTenantItem("texaflow_expenses", cleanList);
            setCachedApi("/expenses", cleanList);
          } catch { }
        }
      } catch (err) {
        console.warn("Backend load notice (using instant cached data):", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadLiveExpenses();

    // Load custom categories from storage and API
    const loadCategoriesList = () => {
      try {
        const order = getTenantItem<string[]>("texaflow_expense_categories_order") || [];
        const custom = getTenantItem<string[]>("texaflow_custom_expense_categories") || [];
        const unified = getTenantItem<any[]>("texaflow_all_categories_unified") || [];
        const unifiedExp = unified
          .filter((c) => c && (c.module === "expense" || c.module === "expenses"))
          .map((c) => c.name);

        const allCandidates = [...categoryOptions, ...order, ...custom, ...unifiedExp];
        const unique = Array.from(new Set(allCandidates.map((c) => (typeof c === "string" ? c.trim() : "")).filter(Boolean)));
        if (unique.length > 0) {
          setFormCategories(unique);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadCategoriesList();

    fetchApi<any[]>("/categories").then((live) => {
      if (isMounted && Array.isArray(live)) {
        const expCats = live
          .filter((c) => (c.module || "expense") === "expense")
          .map((c) => c.name?.trim())
          .filter(Boolean);
        if (expCats.length > 0) {
          setFormCategories((prev) => Array.from(new Set([...prev, ...expCats])));
        }
      }
    }).catch(() => { });

    const handleDataRefresh = () => {
      loadLiveExpenses();
      loadCategoriesList();
    };
    window.addEventListener("app_data_update", handleDataRefresh);
    window.addEventListener("app_refresh_content", handleDataRefresh);
    window.addEventListener("texaflow_expense_categories_changed", handleDataRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener("app_data_update", handleDataRefresh);
      window.removeEventListener("app_refresh_content", handleDataRefresh);
      window.removeEventListener("texaflow_expense_categories_changed", handleDataRefresh);
    };
  }, []);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const trimmed = newCategoryName.trim();
    if (!formCategories.includes(trimmed)) {
      setFormCategories([...formCategories, trimmed]);
    }
    setFormData((prev) => ({ ...prev, category: trimmed }));
    setNewCategoryName("");
    setIsAddCatInputVisible(false);
  };

  // Filter Expenses by Period Date
  const matchesPeriod = (dateStr: string) => {
    if (periodFilter === "all") return true;
    const d = parseDate(dateStr);
    const today = new Date();

    if (periodFilter === "this_week") {
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      return d >= oneWeekAgo && d <= today;
    }
    if (periodFilter === "this_month") {
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }
    if (periodFilter === "this_year") {
      return d.getFullYear() === today.getFullYear();
    }
    if (periodFilter === "custom_date") {
      const startD = startDate ? parseDate(startDate) : null;
      const endD = endDate ? parseDate(endDate) : null;
      if (startD && d < startD) return false;
      if (endD && d > endD) return false;
      return true;
    }
    return true;
  };

  // Filter Expenses List
  const filteredExpenses = expenses
    .filter((item) => {
      if (!item) return false;
      const q = (search || "").trim().toLowerCase();
      const matchesSearch =
        !q ||
        Boolean(item.expense_no && String(item.expense_no).toLowerCase().includes(q)) ||
        Boolean(item.vendor_name && String(item.vendor_name).toLowerCase().includes(q)) ||
        Boolean(item.category && String(item.category).toLowerCase().includes(q)) ||
        Boolean(item.notes && String(item.notes).toLowerCase().includes(q)) ||
        Boolean(item.paid_via && String(item.paid_via).toLowerCase().includes(q)) ||
        Boolean(item.amount !== undefined && item.amount !== null && String(item.amount).includes(q)) ||
        Boolean(item.date && String(item.date).toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Paid"
            ? item.payment_status === "Paid"
            : item.payment_status === "Pending" || item.payment_status === "Unpaid";

      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesTime = matchesPeriod(item.date);
      return matchesSearch && matchesStatus && matchesCategory && matchesTime;
    })
    .sort((a, b) => {
      // Latest at top: newest date first, then highest expense_no
      const timeA = parseDate(a.date).getTime();
      const timeB = parseDate(b.date).getTime();
      if (timeB !== timeA) return timeB - timeA;
      const numA = parseInt((a.expense_no || "").replace(/\D/g, ""), 10) || 0;
      const numB = parseInt((b.expense_no || "").replace(/\D/g, ""), 10) || 0;
      return numB - numA;
    });

  // Analytics Calculations based on Period
  const periodExpenses = expenses.filter((e) => matchesPeriod(e.date));
  const totalExpenseAmount = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalPaidAmount = periodExpenses.filter((e) => e.payment_status === "Paid").reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const unpaidExpensesAmount = periodExpenses
    .filter((e) => e.payment_status === "Pending" || e.payment_status === "Unpaid")
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Compute Top Category
  const categoryTotals: Record<string, number> = {};
  periodExpenses.forEach((e) => {
    if (e.category) {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (Number(e.amount) || 0);
    }
  });

  let topCategory = "N/A";
  let topCategoryAmount = 0;
  Object.entries(categoryTotals).forEach(([cat, amt]) => {
    if (amt > topCategoryAmount) {
      topCategoryAmount = amt;
      topCategory = cat;
    }
  });

  // REAL CSV / EXCEL EXPORT FUNCTION
  const handleExportExcel = () => {
    const recordsToExport = filteredExpenses;
    if (recordsToExport.length === 0) {
      alert("No expense records found to export!");
      return;
    }

    const periodLabel =
      periodFilter === "all"
        ? "All_Time"
        : periodFilter === "this_week"
          ? "This_Week"
          : periodFilter === "this_month"
            ? "This_Month"
            : periodFilter === "this_year"
              ? "Year_2026"
              : "Custom_Period";

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Expense / Bill,Category,Party / Payee,Payment Mode,Status,Remarks / Notes,Amount (INR)\n";

    recordsToExport.forEach((item) => {
      const catClean = `"${(item.category || "").replace(/"/g, '""')}"`;
      const vendorClean = `"${(item.vendor_name || "").replace(/"/g, '""')}"`;
      const notesClean = `"${(item.notes || "").replace(/"/g, '""')}"`;
      const modeClean = `"${(item.paid_via || "").replace(/"/g, '""')}"`;
      const row = `${item.date},${item.expense_no},${catClean},${vendorClean},${modeClean},${item.payment_status},${notesClean},${item.amount}`;
      csvContent += row + "\n";
    });

    const exportTotal = recordsToExport.reduce((sum, item) => sum + item.amount, 0);
    csvContent += `,,TOTAL EXPENDITURE,,,,,,${exportTotal}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Company_Expenses_${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create New Expense
  const submitExpense = async (closeModal: boolean) => {
    const numericAmount = Number(formData.amount);
    if (!numericAmount || numericAmount <= 0) {
      alert("Please enter a valid expense amount!");
      return;
    }

    const formattedDate = formatDateDDMMYYYY(formData.date || getTodayStr());

    let maxSeq = 0;
    expenses.forEach((item) => {
      if (item.expense_no) {
        const m = item.expense_no.match(/EXP-(?:\d{4}-)?(\d+)/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (!isNaN(num) && num < 500 && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    });
    if (maxSeq === 0 && expenses.length > 0) {
      maxSeq = expenses.length;
    }
    const nextSeqNo = `EB-${String(maxSeq + 1).padStart(3, "0")}`;

    const newEntry: ExpenseItem = {
      id: `exp-${Date.now()}`,
      expense_no: nextSeqNo,
      date: formattedDate,
      category: formData.category,
      vendor_name: formData.vendor_name.trim() || "",
      amount: numericAmount,
      payment_status: formData.payment_status,
      paid_via: formData.paid_via || "Current Account HDFC",
      notes: formData.notes.trim(),
      bill_image: formData.bill_image
    };

    setExpenses([newEntry, ...expenses]);

    try {
      const savedRes = await fetchApi<ExpenseItem>("/expenses", {
        method: "POST",
        body: JSON.stringify({
          expense_no: newEntry.expense_no,
          date: formattedDate,
          category: newEntry.category,
          vendor_name: newEntry.vendor_name,
          amount: newEntry.amount,
          payment_status: newEntry.payment_status,
          paid_via: newEntry.paid_via,
          notes: newEntry.notes,
          bill_image: newEntry.bill_image || undefined
        })
      });

      if (savedRes && savedRes.id) {
        newEntry.id = savedRes.id;
        setExpenses((prev) => prev.map((item) => (item.expense_no === newEntry.expense_no ? { ...item, id: savedRes.id } : item)));
      }

      const existing = getTenantItem<ExpenseItem[]>("texaflow_expenses") || [];
      const list = [...existing];
      list.unshift(newEntry);
      setTenantItem("texaflow_expenses", list);
      invalidateApiCache("/expenses");
    } catch (err) {
      console.warn("Backend sync notice:", err);
    }

    if (closeModal) {
      setShowModal(false);
    }

    setFormData({
      date: getTodayStr(),
      category: "Packaging Materials",
      vendor_name: "",
      amount: "",
      payment_status: "Pending",
      paid_via: "Current Account HDFC",
      notes: "",
      bill_image: ""
    });
    setShowPayeeField(false);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    submitExpense(true);
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      const updated = expenses.filter((e) => e.id !== id);
      setExpenses(updated);
      try {
        const saved = getTenantItem<ExpenseItem[]>("texaflow_expenses");
        if (saved && Array.isArray(saved)) {
          const parsed = saved.filter((e: any) => e.id !== id);
          setTenantItem("texaflow_expenses", parsed);
        }
        invalidateApiCache("/expenses");
        await fetchApi(`/expenses/${id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Delete sync notice:", err);
      }
    }
  };



  if (!hasMounted) return null;

  return (
    <div suppressHydrationWarning className="space-y-4 font-sans text-slate-800 pb-12">
      {/* 1. TOP 4 ERP METRIC SUMMARY CARDS matching Image 7 */}
      <div suppressHydrationWarning className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CourtFlowKpiCard
          label={
            periodFilter === "all"
              ? "Total Expenses (All Time)"
              : periodFilter === "this_week"
                ? "Total Expenses (This Week)"
                : periodFilter === "this_month"
                  ? "Total Expenses (This Month)"
                  : "Total Expenses"
          }
          value={`₹${totalExpenseAmount.toLocaleString("en-IN")}`}
          iconBgColor="bg-[#fff4ed] text-[#fb6514]"
          trend={`₹${totalExpenseAmount.toLocaleString("en-IN")} recorded`}
          trendPositive={true}
          icon={<Receipt className="w-5 h-5 text-amber-600" />}
        />
        <CourtFlowKpiCard
          label="Total Paid"
          value={`₹${totalPaidAmount.toLocaleString("en-IN")}`}
          iconBgColor="bg-[#edfcf2] text-[#12b76a]"
          trend="Cleared vouchers"
          trendPositive={true}
          icon={<Check className="w-5 h-5 text-emerald-600" />}
        />
        <CourtFlowKpiCard
          label="Pending / Due"
          value={`₹${unpaidExpensesAmount.toLocaleString("en-IN")}`}
          iconBgColor="bg-[#fef3f2] text-[#f04438]"
          trend={unpaidExpensesAmount > 0 ? "Payment due" : "All cleared"}
          trendPositive={unpaidExpensesAmount === 0}
          icon={<Clock className="w-5 h-5 text-rose-600" />}
        />
        <CourtFlowKpiCard
          label="Top Category"
          value={topCategory || "None"}
          iconBgColor="bg-[#f4f3ff] text-[#7f56d9]"
          trend="Leading expense"
          trendPositive={true}
          icon={<Tag className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* 2. FILTER BAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3 font-sans">
        {/* Search Bar */}
        <div className="relative flex-1 w-full lg:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t("Search by party, category, invoice #, remarks...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-8 h-10 bg-white border border-[#d0d5dd] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#12b76a] focus:ring-4 focus:ring-[#12b76a]/15 font-medium shadow-xs transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Controls: Status Pill, Categories, Period, Export Excel, Add Expense */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start sm:justify-end text-xs">
          {/* Status Toggle Pill Group: All | Paid | Pending */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/90 text-xs shrink-0 w-full sm:w-auto justify-center">
            {(["All", "Paid", "Pending"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer flex-1 sm:flex-none text-center ${statusFilter === st
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                {t(st)}
              </button>
            ))}
          </div>

          {/* Categories Dropdown */}
          <div className="relative flex-1 sm:flex-none w-full sm:w-44">
            <button
              type="button"
              onClick={() => {
                setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                setIsPeriodDropdownOpen(false);
              }}
              className={`w-full h-10 px-3.5 bg-white border text-xs font-medium rounded-xl flex items-center justify-between gap-1.5 transition-all shadow-xs cursor-pointer focus:outline-none ${isCategoryDropdownOpen
                ? "border-[#12b76a] ring-4 ring-[#12b76a]/15 text-slate-900"
                : "border-[#d0d5dd] hover:border-slate-400 text-slate-800"
                }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">
                  {selectedCategory === "All" ? t("All Categories") : t(selectedCategory)}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-1 ${isCategoryDropdownOpen ? "rotate-180 text-[#12b76a]" : ""}`} />
            </button>

            {isCategoryDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsCategoryDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-1.5 z-50 w-full min-w-full bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-900/10 p-1.5 space-y-0.5 max-h-80 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-100 font-sans">
                  {/* Option: All Categories */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("All");
                      setIsCategoryDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${selectedCategory === "All"
                      ? "text-[#12b76a] font-semibold bg-emerald-50/60"
                      : "text-slate-700 hover:bg-slate-50 font-medium"
                      }`}
                  >
                    <span className="truncate">{t("All Categories")}</span>
                    {selectedCategory === "All" && <Check className="w-4 h-4 text-[#12b76a] shrink-0 stroke-[2.5]" />}
                  </button>

                  {/* List of categories */}
                  {formCategories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${isSelected
                          ? "text-[#12b76a] font-semibold bg-emerald-50/60"
                          : "text-slate-700 hover:bg-slate-50 font-medium"
                          }`}
                      >
                        <span className="truncate">{t(cat)}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#12b76a] shrink-0 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Period Filter Dropdown */}
          <div className="relative flex-1 sm:flex-none w-full sm:w-44">
            <button
              type="button"
              onClick={() => {
                setIsPeriodDropdownOpen(!isPeriodDropdownOpen);
                setIsCategoryDropdownOpen(false);
              }}
              className={`w-full h-10 px-3.5 bg-white border text-xs font-medium rounded-xl flex items-center justify-between gap-1.5 transition-all shadow-xs cursor-pointer focus:outline-none ${isPeriodDropdownOpen
                ? "border-[#12b76a] ring-4 ring-[#12b76a]/15 text-slate-900"
                : "border-[#d0d5dd] hover:border-slate-400 text-slate-800"
                }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">
                  {periodFilter === "all"
                    ? t("All Time")
                    : periodFilter === "this_week"
                      ? t("This Week")
                      : periodFilter === "this_month"
                        ? t("This Month")
                        : periodFilter === "this_year"
                          ? t("This Year")
                          : t("Custom Dates")}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-1 ${isPeriodDropdownOpen ? "rotate-180 text-[#12b76a]" : ""}`} />
            </button>

            {isPeriodDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsPeriodDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-1.5 z-50 w-full min-w-full bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-900/10 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 font-sans">
                  {[
                    { id: "all", label: t("All Time") },
                    { id: "this_month", label: t("This Month") },
                    { id: "this_week", label: t("This Week") },
                    { id: "this_year", label: t("This Year") },
                    { id: "custom_date", label: t("Custom Date Range") }
                  ].map((p) => {
                    const isSelected = periodFilter === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPeriodFilter(p.id as any);
                          if (p.id !== "custom_date") {
                            setIsPeriodDropdownOpen(false);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${isSelected
                          ? "text-[#12b76a] font-semibold bg-emerald-50/60"
                          : "text-slate-700 hover:bg-slate-50 font-medium"
                          }`}
                      >
                        <span className="truncate">{p.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#12b76a] shrink-0 stroke-[2.5]" />}
                      </button>
                    );
                  })}

                  {/* EMBEDDED CUSTOM DATE PICKER SECTION */}
                  {periodFilter === "custom_date" && (
                    <div className="mt-1 pt-1.5 border-t border-slate-100 space-y-2 p-2 bg-slate-50/70 rounded-xl">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-slate-600">{t("From")}:</span>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-white border border-[#d0d5dd] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#12b76a] focus:ring-2 focus:ring-[#12b76a]/15 shadow-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-slate-600">{t("To")}:</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-white border border-[#d0d5dd] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#12b76a] focus:ring-2 focus:ring-[#12b76a]/15 shadow-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPeriodDropdownOpen(false)}
                        className="w-full mt-1 py-2 text-xs font-semibold bg-[#12b76a] hover:bg-[#0e9f5d] text-white rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        {t("Apply Date Range")}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* EXCEL EXPORT BUTTON (Matching CourtFlow Secondary Outline) */}
          <button
            onClick={handleExportExcel}
            className="h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-[#d0d5dd] rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer flex-1 sm:flex-none"
            title="Download Excel CSV File"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{t("Export Excel")}</span>
          </button>

          {/* ADD EXPENSE BUTTON (Matching CourtFlow Primary Green) */}
          <Link
            href="/expenses/new"
            className="h-10 px-4 bg-[#12b76a] hover:bg-[#0e9f5d] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t("Add Expense")}</span>
          </Link>
        </div>
      </div>

      {/* 4. EXPENSE REGISTER TABLE & MOBILE CARD VIEW */}
      <div suppressHydrationWarning className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden font-sans">
        {/* MOBILE CARD VIEW (< md) - No horizontal scroll */}
        <div suppressHydrationWarning className="block md:hidden p-3 sm:p-4 space-y-3 bg-slate-50/50">
          {filteredExpenses.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-medium">
              No expense records found matching your filters. Click &quot;+ Add Expense&quot; to add a record.
            </div>
          ) : (
            filteredExpenses.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3"
              >
                {/* Top Row: Date, Status, Delete */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {formatDateDDMMYYYY(item.date)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${item.payment_status === "Paid"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                    >
                      {item.payment_status === "Paid" ? t("Paid") : t("Pending")}
                    </span>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/expenses/new?edit=${encodeURIComponent(item.id)}&no=${encodeURIComponent(item.expense_no || "")}`}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Expense"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vendor, Bill/Invoice & Amount */}
                <div className="flex items-start justify-between gap-3 pt-1 border-t border-slate-100">
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                      {t(item.vendor_name || "-")}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {item.expense_no || "-"}
                      </span>
                      {item.bill_image && (
                        <button
                          type="button"
                          onClick={() => setSelectedBillImage({ notes: item.notes, expense_no: item.expense_no, image: item.bill_image! })}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] rounded-md border border-blue-200 transition-colors cursor-pointer"
                          title="View Bill Photo"
                        >
                          <FileText className="w-3 h-3 text-blue-600" />
                          <span>Bill</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-slate-900 text-base">
                      ₹{(Number(item.amount) || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Category & Payment Mode */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t("Category")}</span>
                    <span className="font-bold text-blue-900 inline-block mt-0.5 truncate">
                      {t(item.category)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t("Payment Mode")}</span>
                    <span className="font-bold text-slate-800 inline-block mt-0.5 truncate">
                      {t(item.paid_via)}
                    </span>
                  </div>
                </div>

                {/* Remarks / Notes */}
                {item.notes && (
                  <div className="pt-1 border-t border-slate-100">
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {t(item.notes)}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md) - Clean CourtFlow Table matching Image 2 */}
        <div suppressHydrationWarning className="hidden md:block overflow-x-auto">
          <table suppressHydrationWarning className="w-full text-left border-collapse text-xs min-w-[950px]">
            <thead>
              <tr className="bg-white border-b border-[#eaecf0] text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3.5 px-4">{t("DATE")}</th>
                <th className="py-3.5 px-4">{t("EXPENSE / BILL")}</th>
                <th className="py-3.5 px-4">{t("CATEGORY")}</th>
                <th className="py-3.5 px-4">{t("VENDOR / PAYEE")}</th>
                <th className="py-3.5 px-4">{t("PAYMENT MODE")}</th>
                <th className="py-3.5 px-4">{t("STATUS")}</th>
                <th className="py-3.5 px-4">{t("REMARKS / NOTES")}</th>
                <th className="py-3.5 px-4 text-right">{t("AMOUNT (₹)")}</th>
                <th className="py-3.5 px-4 text-center w-20">{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody suppressHydrationWarning className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No expense records found matching your filters. Click &quot;+ Add Expense&quot; to add a record.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors animate-in fade-in duration-150">
                    {/* 1. DATE */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {formatDateDDMMYYYY(item.date)}
                    </td>

                    {/* 2. EXPENSE / BILL */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {item.expense_no || "-"}
                        </span>
                        {item.bill_image && (
                          <button
                            type="button"
                            onClick={() => setSelectedBillImage({ notes: item.notes, expense_no: item.expense_no, image: item.bill_image! })}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] rounded-md border border-blue-200 transition-colors cursor-pointer"
                            title="View Bill Photo"
                          >
                            <FileText className="w-3 h-3 text-blue-600" />
                            <span>Bill</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 3. CATEGORY */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-800">
                        {t(item.category)}
                      </span>
                    </td>

                    {/* 4. VENDOR / PAYEE */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">{t(item.vendor_name || "-")}</span>
                    </td>

                    {/* 5. PAYMENT MODE */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-semibold text-xs">
                      {t(item.paid_via)}
                    </td>

                    {/* 6. STATUS */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <CourtFlowBadge
                        status={item.payment_status === "Paid" ? "active" : "pending"}
                        label={item.payment_status === "Paid" ? t("Paid") : t("Pending")}
                      />
                    </td>

                    {/* 7. REMARKS / NOTES */}
                    <td className="py-3.5 px-4 min-w-[200px] max-w-sm">
                      <p className="text-slate-700 text-xs font-medium leading-relaxed break-words">
                        {t(item.notes || "-")}
                      </p>
                    </td>

                    {/* 8. AMOUNT (₹) */}
                    <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-slate-900 whitespace-nowrap">
                      ₹{(Number(item.amount) || 0).toLocaleString("en-IN")}
                    </td>

                    {/* 9. ACTION */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <CourtFlowActionMenu
                        onEdit={() => window.location.href = `/expenses/new?edit=${encodeURIComponent(item.id)}&no=${encodeURIComponent(item.expense_no || "")}`}
                        onDelete={() => handleDeleteExpense(item.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIMPLE PHYSICAL BILL PREVIEW MODAL */}
      {selectedBillImage && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-4 space-y-3 animate-in zoom-in-95 duration-100 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{selectedBillImage.notes || selectedBillImage.expense_no}</h3>
                <p className="text-[10px] text-slate-400 font-mono font-bold">{selectedBillImage.expense_no}</p>
              </div>
              <button
                onClick={() => setSelectedBillImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center max-h-[70vh]">
              <img src={selectedBillImage.image} alt="Bill attachment" className="object-contain max-h-[68vh]" />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedBillImage(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
