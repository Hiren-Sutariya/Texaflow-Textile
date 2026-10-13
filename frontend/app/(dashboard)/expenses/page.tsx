"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
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
  Edit3
} from "lucide-react";

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
}

const sampleBillSvg =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='550' viewBox='0 0 400 550' fill='none'><rect width='400' height='550' rx='16' fill='%23FFFFFF'/><rect x='20' y='20' width='360' height='510' rx='12' fill='%23F8FAFC' stroke='%23E2E8F0' stroke-width='2'/><text x='40' y='60' fill='%231E293B' font-family='sans-serif' font-size='18' font-weight='bold'>SURAT INDUSTRIAL TAX &amp; POWER INVOICE</text><text x='40' y='85' fill='%2364748B' font-family='sans-serif' font-size='12'>GSTIN: 24AAACD9912E1Z8 | DATE: 24-SEP-2026</text><line x1='40' y1='100' x2='360' y2='100' stroke='%23CBD5E1' stroke-width='1.5'/><text x='40' y='130' fill='%23334155' font-family='sans-serif' font-size='13' font-weight='bold'>PARTICULARS / DESCRIPTION</text><text x='300' y='130' fill='%23334155' font-family='sans-serif' font-size='13' font-weight='bold'>AMOUNT</text><text x='40' y='165' fill='%23475569' font-family='sans-serif' font-size='13'>1. Industrial Power Tariff (4200 units)</text><text x='300' y='165' fill='%230F172A' font-family='sans-serif' font-size='13' font-weight='bold'>Rs. 38,000</text><text x='40' y='195' fill='%23475569' font-family='sans-serif' font-size='13'>2. Fixed Line Charges</text><text x='300' y='195' fill='%230F172A' font-family='sans-serif' font-size='13' font-weight='bold'>Rs. 4,500</text><line x1='40' y1='230' x2='360' y2='230' stroke='%23CBD5E1' stroke-dasharray='4 4'/><text x='40' y='265' fill='%231E293B' font-family='sans-serif' font-size='15' font-weight='bold'>TOTAL BILL AMOUNT</text><text x='290' y='265' fill='%231D4ED8' font-family='sans-serif' font-size='16' font-weight='black'>Rs. 42,500</text><rect x='40' y='300' width='320' height='120' rx='8' fill='%23EFF6FF' stroke='%23BFDBFE'/><text x='60' y='330' fill='%231E40AF' font-family='sans-serif' font-size='12' font-weight='bold'>PAYMENT STATUS: PAID (HDFC BANK)</text><text x='60' y='355' fill='%231E40AF' font-family='sans-serif' font-size='12'>Txn Ref: HDFC-991204812903</text><text x='60' y='380' fill='%231E40AF' font-family='sans-serif' font-size='12'>Verified stamp: DIGISCALE ERP OFFICIAL</text><text x='40' y='470' fill='%2394A3B8' font-family='sans-serif' font-size='11'>Physical Paper Bill scanned &amp; archived digitally.</text><rect x='280' y='440' width='80' height='60' rx='6' fill='%23E2E8F0'/><text x='295' y='475' fill='%2364748B' font-family='sans-serif' font-size='10'>STAMP</text></svg>";

const getTodayStr = () => new Date().toISOString().split("T")[0];
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

const initialExpenses: ExpenseItem[] = [
  {
    id: "exp-001",
    expense_no: "EB-001",
    date: "26-09-2026",
    category: "Karigar Salary",
    vendor_name: "Master Karigar Union",
    amount: 55000,
    payment_status: "Paid",
    paid_via: "Current Account HDFC",
    notes: "Head Karigar & Night Shift Operators Monthly Salary Settlement"
  },
  {
    id: "exp-002",
    expense_no: "EB-002",
    date: "24-09-2026",
    category: "Electricity & Power",
    vendor_name: "DGVCL Power Corp",
    amount: 42500,
    payment_status: "Paid",
    paid_via: "Current Account HDFC",
    notes: "Surat DGVCL Industrial Electricity Bill (4200 Units)",
    bill_image: sampleBillSvg
  },
  {
    id: "exp-003",
    expense_no: "EB-003",
    date: "23-09-2026",
    category: "Worker Advance / Upad",
    vendor_name: "Karigar Ramesh (Shift B)",
    amount: 15000,
    payment_status: "Paid",
    paid_via: "Petty Cash",
    notes: "Karigar Ramesh & Suresh Festival Advance"
  },
  {
    id: "exp-004",
    expense_no: "EB-004",
    date: "22-09-2026",
    category: "Machine Maintenance & Repairs",
    vendor_name: "Ganesh Embroidery Services",
    amount: 8500,
    payment_status: "Paid",
    paid_via: "UPI Cash",
    notes: "Machine 3 Laser & Bearing Service",
    bill_image: sampleBillSvg
  },
  {
    id: "exp-005",
    expense_no: "EB-005",
    date: "21-09-2026",
    category: "Packaging Materials",
    vendor_name: "Maruti Jobwork Works Surat",
    amount: 24000,
    payment_status: "Pending",
    paid_via: "Credit (15 days)",
    notes: "Outsourced Machine Work / Jobwork Production Charges"
  },
  {
    id: "exp-006",
    expense_no: "EB-006",
    date: "20-09-2026",
    category: "Dhaga & Consumables",
    vendor_name: "Surat Needle Mart",
    amount: 14200,
    payment_status: "Pending",
    paid_via: "Credit (15 days)",
    notes: "Groz-Beckert Needles (DBxK5) 10 boxes & Shuttle Hooks",
    bill_image: sampleBillSvg
  },
  {
    id: "exp-007",
    expense_no: "EB-007",
    date: "18-09-2026",
    category: "Dhaga & Consumables",
    vendor_name: "Shree Ram Threads Surat",
    amount: 28400,
    payment_status: "Paid",
    paid_via: "HDFC Cheque",
    notes: "Viscose Embroidery Threads (Rani & Rama Shade)"
  },
  {
    id: "exp-008",
    expense_no: "EB-008",
    date: "10-09-2026",
    category: "Logistics & Courier",
    vendor_name: "Nayara Energy & Local Freight",
    amount: 19000,
    payment_status: "Paid",
    paid_via: "UPI Cash",
    notes: "Generator Diesel Tank Refill (200L) & Goods Tempo Freight"
  },
  {
    id: "exp-009",
    expense_no: "EB-009",
    date: "12-10-2026",
    category: "Machine Maintenance & Repairs",
    vendor_name: "Ganesh Laser Tech Surat",
    amount: 3500,
    payment_status: "Paid",
    paid_via: "UPI Cash",
    notes: "Emergency Needle Holder Replacement"
  }
];

const formatDateDDMMYYYY = (dateStr: string) => {
  if (!dateStr) return "";
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
  if (!dateStr) return new Date();
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

export const normalizeAndRenumberExpenses = (list: ExpenseItem[]): ExpenseItem[] => {
  if (!Array.isArray(list) || list.length === 0) return list;

  const needsRenumber = list.some((item) => {
    if (!item.expense_no) return true;
    const match = item.expense_no.match(/^EB-(\d{3})$/);
    if (!match) return true;
    const num = parseInt(match[1], 10);
    if (num > list.length + 10 || num > 500) return true;
    if (item.vendor_name === "General Vendor") return true;
    return false;
  });

  if (!needsRenumber) return list;

  const sorted = [...list].sort((a, b) => {
    const timeA = parseDate(a.date).getTime();
    const timeB = parseDate(b.date).getTime();
    if (timeA !== timeB) return timeA - timeB;
    const numA = parseInt((a.id || "").replace(/\D/g, ""), 10) || 0;
    const numB = parseInt((b.id || "").replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });

  const idToNewNo: Record<string, string> = {};
  const idToNewId: Record<string, string> = {};
  sorted.forEach((item, idx) => {
    const pad = String(idx + 1).padStart(3, "0");
    idToNewNo[item.id] = `EB-${pad}`;
    idToNewId[item.id] = `exp-${pad}`;
  });

  const updated = list.map((item) => {
    const cleanVendor = item.vendor_name === "General Vendor" ? "" : item.vendor_name || "";
    return {
      ...item,
      id: idToNewId[item.id] || item.id,
      expense_no: idToNewNo[item.id] || item.expense_no,
      vendor_name: cleanVendor
    };
  });

  try {
    const currentCid = getStoredCompanyId();
    setTenantItem("texaflow_expenses", updated, currentCid === "comp-001" ? "om_sai_expenses" : undefined);
  } catch {}

  return updated;
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
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const currentCid = getStoredCompanyId();
        const saved = getTenantItem<ExpenseItem[]>(
          "texaflow_expenses",
          currentCid === "comp-001" ? "om_sai_expenses" : undefined
        );
        if (Array.isArray(saved) && saved.length > 0) {
          const scoped = saved.filter((item: any) => (item.company_id || "comp-001") === currentCid);
          return normalizeAndRenumberExpenses(scoped);
        }
      } catch {}
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

    async function loadLiveExpenses() {
      const currentCid = getStoredCompanyId();
      try {
        const live = await fetchApi<ExpenseItem[]>("/expenses");
        if (isMounted && Array.isArray(live)) {
          // Strict multi-tenant guard: only show expenses belonging to this company!
          const scoped = live.filter((item: any) => {
            const itemCid = item.company_id || "comp-001";
            return itemCid === currentCid;
          });
          const cleanList = normalizeAndRenumberExpenses(scoped);
          setExpenses(cleanList);
          try {
            setTenantItem("texaflow_expenses", cleanList, currentCid === "comp-001" ? "om_sai_expenses" : undefined);
          } catch {}
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Backend not running or offline, loading local cache:", err);
      }

      // Fallback to local storage if API unreachable or empty
      try {
        const saved = getTenantItem<ExpenseItem[]>(
          "texaflow_expenses",
          currentCid === "comp-001" ? "om_sai_expenses" : undefined
        );
        if (saved && isMounted && Array.isArray(saved) && saved.length > 0) {
          const scoped = saved.filter((item: any) => (item.company_id || "comp-001") === currentCid);
          const cleanList = normalizeAndRenumberExpenses(scoped);
          setExpenses(cleanList);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error("Local storage fallback error:", err);
      }

      if (isMounted) {
        setExpenses([]);
        setIsLoading(false);
      }
    }

    loadLiveExpenses();

    // Load custom categories
    try {
      const savedCats = getTenantItem<string[]>("texaflow_custom_expense_categories", "om_sai_custom_expense_categories");
      if (savedCats && Array.isArray(savedCats) && savedCats.length > 0) {
        setFormCategories((prev) => {
          const combined = [...prev];
          savedCats.forEach((c: string) => {
            if (!combined.includes(c)) combined.push(c);
          });
          return combined;
        });
      }
    } catch (err) {
      console.error(err);
    }

    return () => {
      isMounted = false;
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
      const q = search.toLowerCase();
      const matchesSearch =
        item.expense_no.toLowerCase().includes(q) ||
        item.vendor_name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.paid_via && item.paid_via.toLowerCase().includes(q));

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
  const totalExpenseAmount = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPaidAmount = periodExpenses.filter((e) => e.payment_status === "Paid").reduce((sum, e) => sum + e.amount, 0);
  const unpaidExpensesAmount = periodExpenses
    .filter((e) => e.payment_status === "Pending" || e.payment_status === "Unpaid")
    .reduce((sum, e) => sum + e.amount, 0);

  // Compute Top Category
  const categoryTotals: Record<string, number> = {};
  periodExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
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
    csvContent += "Date,Expense / Bill,Category,Vendor / Payee,Payment Mode,Status,Remarks / Notes,Amount (INR)\n";

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

    let newEntry: ExpenseItem = {
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

      const currentCid = getStoredCompanyId();
      const existing = getTenantItem<ExpenseItem[]>(
        "texaflow_expenses",
        currentCid === "comp-001" ? "om_sai_expenses" : undefined
      ) || [];
      const list = [...existing];
      list.unshift(newEntry);
      setTenantItem(
        "texaflow_expenses",
        list,
        currentCid === "comp-001" ? "om_sai_expenses" : undefined
      );
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
        const currentCid = getStoredCompanyId();
        const saved = getTenantItem<ExpenseItem[]>(
          "texaflow_expenses",
          currentCid === "comp-001" ? "om_sai_expenses" : undefined
        );
        if (saved && Array.isArray(saved)) {
          const parsed = saved.filter((e: any) => e.id !== id);
          setTenantItem(
            "texaflow_expenses",
            parsed,
            currentCid === "comp-001" ? "om_sai_expenses" : undefined
          );
        }
        await fetchApi(`/expenses/${id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Delete sync notice:", err);
      }
    }
  };



  if (!hasMounted) return null;

  return (
    <div suppressHydrationWarning className="space-y-4 font-sans text-slate-800 pb-12">
      {/* 1. TOP 4 ERP METRIC SUMMARY CARDS */}
      <div suppressHydrationWarning className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* CARD 1: TOTAL EXPENSES */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mr-1">
              {periodFilter === "all"
                ? "TOTAL (ALL TIME)"
                : periodFilter === "this_week"
                ? "TOTAL (THIS WEEK)"
                : periodFilter === "this_month"
                ? "TOTAL (THIS MONTH)"
                : periodFilter === "this_year"
                ? "TOTAL (2026)"
                : "TOTAL EXPENSES"}
            </p>
            <p suppressHydrationWarning className="text-base sm:text-xl font-black text-slate-900 mt-0.5">₹{totalExpenseAmount.toLocaleString("en-IN")}</p>
            <span suppressHydrationWarning className="text-[10px] sm:text-[11px] font-semibold text-slate-500 mt-0.5 block truncate">{periodExpenses.length} Records</span>
          </div>
          <div className="p-2 sm:p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shrink-0">
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* CARD 2: TOTAL PAID */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mr-1">TOTAL PAID</p>
            <p suppressHydrationWarning className="text-base sm:text-xl font-black text-blue-700 mt-0.5">₹{totalPaidAmount.toLocaleString("en-IN")}</p>
            <span className="text-[10px] sm:text-[11px] font-semibold text-blue-600 mt-0.5 block truncate">Bank & Cash</span>
          </div>
          <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* CARD 3: PENDING / UNPAID */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-amber-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[9px] sm:text-[10px] font-bold text-amber-600 uppercase tracking-wider truncate mr-1">PENDING / DUE</p>
            <p suppressHydrationWarning className="text-base sm:text-xl font-black text-amber-700 mt-0.5">₹{unpaidExpensesAmount.toLocaleString("en-IN")}</p>
            <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 mt-0.5 block truncate">Vendor Due</span>
          </div>
          <div className="p-2 sm:p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* CARD 4: TOP CATEGORY */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-purple-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[9px] sm:text-[10px] font-bold text-purple-700 uppercase tracking-wider truncate mr-1">TOP CATEGORY</p>
            <p suppressHydrationWarning className="text-sm sm:text-lg font-black text-purple-900 mt-0.5 truncate max-w-[170px]" title={topCategory}>
              {topCategory}
            </p>
            <span suppressHydrationWarning className="text-[10px] sm:text-[11px] font-bold text-purple-700 mt-0.5 block truncate">
              ₹{topCategoryAmount.toLocaleString("en-IN")} Spent
            </span>
          </div>
          <div className="p-2 sm:p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 shrink-0">
            <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* 2. FILTER BAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3 font-sans">
        {/* Search Bar */}
        <div className="relative flex-1 w-full lg:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by vendor, category, invoice #, remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 h-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        {/* Action Controls: Status Pill, Categories, Period, Export Excel, Add Expense */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start sm:justify-end text-xs">
          {/* Status Toggle Pill Group: All | Paid | Pending */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/90 text-xs shrink-0">
            {(["All", "Paid", "Pending"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Categories Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                setIsPeriodDropdownOpen(false);
              }}
              className={`h-9 px-3.5 bg-white border text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                isCategoryDropdownOpen
                  ? "border-2 border-blue-500 ring-2 ring-blue-500/20 text-slate-900"
                  : "border-slate-300 hover:border-slate-400 text-slate-800"
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span className="uppercase tracking-wider">
                {selectedCategory === "All" ? "ALL CATEGORIES" : selectedCategory}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCategoryDropdownOpen ? "rotate-180 text-blue-600" : ""}`} />
            </button>

            {isCategoryDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsCategoryDropdownOpen(false)} />
                <div className="absolute right-0 sm:left-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 space-y-1 max-h-80 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-100 font-sans">
                  {/* Option: All Categories */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("All");
                      setIsCategoryDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 transition-all cursor-pointer border ${
                      selectedCategory === "All"
                        ? "bg-blue-50 text-blue-950 font-extrabold border-blue-500 shadow-2xs"
                        : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                    }`}
                  >
                    <span>All Categories</span>
                    {selectedCategory === "All" && <Check className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.5]" />}
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
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-blue-50 text-blue-950 font-extrabold border-blue-500 shadow-2xs"
                            : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Period Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsPeriodDropdownOpen(!isPeriodDropdownOpen);
                setIsCategoryDropdownOpen(false);
              }}
              className={`h-9 px-3.5 bg-white border text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                isPeriodDropdownOpen
                  ? "border-2 border-blue-500 ring-2 ring-blue-500/20 text-slate-900"
                  : "border-slate-300 hover:border-slate-400 text-slate-800"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="uppercase tracking-wider">
                {periodFilter === "all"
                  ? "ALL TIME"
                  : periodFilter === "this_week"
                  ? "THIS WEEK"
                  : periodFilter === "this_month"
                  ? "THIS MONTH"
                  : periodFilter === "this_year"
                  ? "THIS YEAR"
                  : "CUSTOM DATES"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isPeriodDropdownOpen ? "rotate-180 text-blue-600" : ""}`} />
            </button>

            {isPeriodDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsPeriodDropdownOpen(false)} />
                <div className="absolute right-0 sm:left-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100 font-sans">
                  {[
                    { id: "all", label: "All Time (Badha)" },
                    { id: "this_month", label: "This Month" },
                    { id: "this_week", label: "This Week" },
                    { id: "this_year", label: "This Year" },
                    { id: "custom_date", label: "Custom Date Range" }
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
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-blue-50 text-blue-950 font-extrabold border-blue-500 shadow-2xs"
                            : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                        }`}
                      >
                        <span className="whitespace-nowrap">{p.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.5]" />}
                      </button>
                    );
                  })}

                  {/* EMBEDDED CUSTOM DATE PICKER SECTION */}
                  {periodFilter === "custom_date" && (
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-2 p-2.5 bg-slate-50 rounded-2xl">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">From:</span>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 w-36"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">To:</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 w-36"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPeriodDropdownOpen(false)}
                        className="w-full mt-1 py-2 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-2xs cursor-pointer"
                      >
                        Apply Date Range
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* EXCEL EXPORT BUTTON */}
          <button
            onClick={handleExportExcel}
            className="h-9 px-3.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Download Excel CSV File"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Export Excel</span>
          </button>

          {/* ADD EXPENSE BUTTON -> NAVIGATES TO /expenses/new */}
          <Link
            href="/expenses/new"
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </Link>
        </div>
      </div>

      {/* 4. EXPENSE REGISTER TABLE & MOBILE CARD VIEW */}
      <div suppressHydrationWarning className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden font-sans">
        {/* MOBILE CARD VIEW (< md) - No horizontal scroll */}
        <div suppressHydrationWarning className="block md:hidden p-3 sm:p-4 space-y-3 bg-slate-50/50">
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <div
                key={`exp-m-skel-${n}`}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200/80 rounded w-28" />
                  <div className="h-4 bg-slate-200/80 rounded-lg w-16" />
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <div className="h-4 bg-slate-200/80 rounded w-44" />
                  <div className="h-5 bg-slate-200/80 rounded w-20" />
                </div>
                <div className="h-8 bg-slate-100 rounded-xl" />
              </div>
            ))
          ) : filteredExpenses.length === 0 ? (
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
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                        item.payment_status === "Paid"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.payment_status}
                    </span>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/expenses/new?edit=${item.id}`}
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
                      {item.vendor_name || "-"}
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
                      ₹{item.amount.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Category & Payment Mode */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                    <span className="font-bold text-blue-900 inline-block mt-0.5 truncate">
                      {item.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Mode</span>
                    <span className="font-bold text-slate-800 inline-block mt-0.5 truncate">
                      {item.paid_via}
                    </span>
                  </div>
                </div>

                {/* Remarks / Notes */}
                {item.notes && (
                  <div className="pt-1 border-t border-slate-100">
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {item.notes}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md) */}
        <div suppressHydrationWarning className="hidden md:block overflow-x-auto">
          <table suppressHydrationWarning className="w-full text-left border-collapse text-xs min-w-[950px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3.5 px-4">DATE</th>
                <th className="py-3.5 px-4">EXPENSE / BILL</th>
                <th className="py-3.5 px-4">CATEGORY</th>
                <th className="py-3.5 px-4">VENDOR / PAYEE</th>
                <th className="py-3.5 px-4">PAYMENT MODE</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4">REMARKS / NOTES</th>
                <th className="py-3.5 px-4 text-right">AMOUNT (₹)</th>
                <th className="py-3.5 px-4 text-center w-20">ACTION</th>
              </tr>
            </thead>
            <tbody suppressHydrationWarning className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                [1, 2, 3, 4].map((n) => (
                  <tr key={`exp-skel-${n}`} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200/80 rounded w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-200/80 rounded-lg w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-200/80 rounded-lg w-28" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200/80 rounded w-40" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200/80 rounded w-24" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-200/80 rounded-lg w-16" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200/80 rounded w-48" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 bg-slate-200/80 rounded w-16 ml-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><div className="h-6 bg-slate-200/80 rounded w-8 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    No expense records found matching your filters. Click &quot;+ Add Expense&quot; to add a record.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors animate-in fade-in duration-150">
                  {/* 1. DATE */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                    {formatDateDDMMYYYY(item.date)}
                  </td>

                  {/* 2. EXPENSE / BILL */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
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
                    <span className="px-2.5 py-1 bg-blue-50/70 text-blue-900 border border-blue-200/80 rounded-lg text-[11px] font-bold inline-block">
                      {item.category}
                    </span>
                  </td>

                  {/* 4. VENDOR / PAYEE */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900">{item.vendor_name || "-"}</span>
                  </td>

                  {/* 5. PAYMENT MODE */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-semibold text-xs">
                    {item.paid_via}
                  </td>

                  {/* 6. STATUS */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${
                        item.payment_status === "Paid"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.payment_status}
                    </span>
                  </td>

                  {/* 7. REMARKS / NOTES */}
                  <td className="py-3.5 px-4 min-w-[200px] max-w-sm">
                    <p className="text-slate-700 text-xs font-medium leading-relaxed break-words">
                      {item.notes || "-"}
                    </p>
                  </td>

                  {/* 8. AMOUNT (₹) */}
                  <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-slate-900 whitespace-nowrap">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </td>

                  {/* 9. ACTION */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/expenses/new?edit=${item.id}`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Expense"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
