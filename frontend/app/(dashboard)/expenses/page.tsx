"use client";

import { useState, useRef, useEffect } from "react";
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
  Tag
} from "lucide-react";

interface ExpenseItem {
  id: string;
  expense_no: string;
  date: string;
  category: string;
  title: string;
  vendor_name: string;
  amount: number;
  payment_status: "Paid" | "Pending" | "Unpaid";
  paid_via: string;
  invoice_no?: string;
  notes?: string;
  bill_image?: string;
}

const sampleBillSvg =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='550' viewBox='0 0 400 550' fill='none'><rect width='400' height='550' rx='16' fill='%23FFFFFF'/><rect x='20' y='20' width='360' height='510' rx='12' fill='%23F8FAFC' stroke='%23E2E8F0' stroke-width='2'/><text x='40' y='60' fill='%231E293B' font-family='sans-serif' font-size='18' font-weight='bold'>SURAT INDUSTRIAL TAX &amp; POWER INVOICE</text><text x='40' y='85' fill='%2364748B' font-family='sans-serif' font-size='12'>GSTIN: 24AAACD9912E1Z8 | DATE: 24-SEP-2026</text><line x1='40' y1='100' x2='360' y2='100' stroke='%23CBD5E1' stroke-width='1.5'/><text x='40' y='130' fill='%23334155' font-family='sans-serif' font-size='13' font-weight='bold'>PARTICULARS / DESCRIPTION</text><text x='300' y='130' fill='%23334155' font-family='sans-serif' font-size='13' font-weight='bold'>AMOUNT</text><text x='40' y='165' fill='%23475569' font-family='sans-serif' font-size='13'>1. Industrial Power Tariff (4200 units)</text><text x='300' y='165' fill='%230F172A' font-family='sans-serif' font-size='13' font-weight='bold'>Rs. 38,000</text><text x='40' y='195' fill='%23475569' font-family='sans-serif' font-size='13'>2. Fixed Line Charges</text><text x='300' y='195' fill='%230F172A' font-family='sans-serif' font-size='13' font-weight='bold'>Rs. 4,500</text><line x1='40' y1='230' x2='360' y2='230' stroke='%23CBD5E1' stroke-dasharray='4 4'/><text x='40' y='265' fill='%231E293B' font-family='sans-serif' font-size='15' font-weight='bold'>TOTAL BILL AMOUNT</text><text x='290' y='265' fill='%231D4ED8' font-family='sans-serif' font-size='16' font-weight='black'>Rs. 42,500</text><rect x='40' y='300' width='320' height='120' rx='8' fill='%23EFF6FF' stroke='%23BFDBFE'/><text x='60' y='330' fill='%231E40AF' font-family='sans-serif' font-size='12' font-weight='bold'>PAYMENT STATUS: PAID (HDFC BANK)</text><text x='60' y='355' fill='%231E40AF' font-family='sans-serif' font-size='12'>Txn Ref: HDFC-991204812903</text><text x='60' y='380' fill='%231E40AF' font-family='sans-serif' font-size='12'>Verified stamp: DIGISCALE ERP OFFICIAL</text><text x='40' y='470' fill='%2394A3B8' font-family='sans-serif' font-size='11'>Physical Paper Bill scanned &amp; archived digitally.</text><rect x='280' y='440' width='80' height='60' rx='6' fill='%23E2E8F0'/><text x='295' y='475' fill='%2364748B' font-family='sans-serif' font-size='10'>STAMP</text></svg>";

const categoryOptions = [
  "Karigar Salary",
  "Worker Advance / Upad",
  "Machine Repair & Maintenance",
  "Outsourced Machine Work / Jobwork",
  "Electricity & Power Bill",
  "Thread & Yarn Purchase",
  "Needles & Spare Parts",
  "Diesel & Freight Transport",
  "Factory Rent & Misc"
];

const initialExpenses: ExpenseItem[] = [
  {
    id: "exp-101",
    expense_no: "EXP-2026-081",
    date: "2026-09-26",
    category: "Karigar Salary",
    title: "Head Karigar & Night Shift Operators Monthly Salary Settlement",
    vendor_name: "Master Karigar Union",
    amount: 55000,
    payment_status: "Paid",
    paid_via: "Current Account HDFC",
    invoice_no: "PAY-2026-09"
  },
  {
    id: "exp-102",
    expense_no: "EXP-2026-082",
    date: "2026-09-24",
    category: "Electricity & Power Bill",
    title: "Surat DGVCL Industrial Electricity Bill",
    vendor_name: "DGVCL Power Corp",
    amount: 42500,
    payment_status: "Paid",
    paid_via: "Current Account HDFC",
    invoice_no: "DGVCL-992184",
    bill_image: sampleBillSvg
  },
  {
    id: "exp-103",
    expense_no: "EXP-2026-083",
    date: "2026-09-23",
    category: "Worker Advance / Upad",
    title: "Karigar Ramesh & Suresh Festival Advance",
    vendor_name: "Karigar Ramesh (Shift B)",
    amount: 15000,
    payment_status: "Paid",
    paid_via: "Petty Cash",
    invoice_no: "UPD-0923"
  },
  {
    id: "exp-104",
    expense_no: "EXP-2026-084",
    date: "2026-09-22",
    category: "Machine Repair & Maintenance",
    title: "Machine 3 Laser & Bearing Service",
    vendor_name: "Ganesh Embroidery Services",
    amount: 8500,
    payment_status: "Paid",
    paid_via: "UPI Cash",
    invoice_no: "GES-412",
    bill_image: sampleBillSvg
  },
  {
    id: "exp-105",
    expense_no: "EXP-2026-085",
    date: "2026-09-21",
    category: "Outsourced Machine Work / Jobwork",
    title: "External Multi-Head Embroidery Jobwork Production Charges",
    vendor_name: "Maruti Jobwork Works Surat",
    amount: 24000,
    payment_status: "Pending",
    paid_via: "Credit (15 days)",
    invoice_no: "MJW-8812"
  },
  {
    id: "exp-106",
    expense_no: "EXP-2026-086",
    date: "2026-09-20",
    category: "Needles & Spare Parts",
    title: "Groz-Beckert Needles (DBxK5) 10 boxes & Shuttle Hooks",
    vendor_name: "Surat Needle Mart",
    amount: 14200,
    payment_status: "Pending",
    paid_via: "Credit (15 days)",
    invoice_no: "SNM-889",
    bill_image: sampleBillSvg
  },
  {
    id: "exp-107",
    expense_no: "EXP-2026-087",
    date: "2026-09-18",
    category: "Thread & Yarn Purchase",
    title: "Viscose Embroidery Threads (Rani & Rama Shade)",
    vendor_name: "Shree Ram Threads Surat",
    amount: 28400,
    payment_status: "Paid",
    paid_via: "HDFC Cheque",
    invoice_no: "SRT-5510"
  },
  {
    id: "exp-108",
    expense_no: "EXP-2026-088",
    date: "2026-09-10",
    category: "Diesel & Freight Transport",
    title: "Generator Diesel Tank Refill (200L) & Goods Tempo Freight",
    vendor_name: "Nayara Energy & Local Freight",
    amount: 19000,
    payment_status: "Paid",
    paid_via: "UPI Cash",
    invoice_no: "PET-9912"
  }
];

const formatDateDDMMYYYY = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Pending">("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [periodFilter, setPeriodFilter] = useState<"this_week" | "this_month" | "this_year" | "custom_date">("this_month");
  const [startDate, setStartDate] = useState("2026-09-01");
  const [endDate, setEndDate] = useState("2026-09-30");
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
  const [selectedBillImage, setSelectedBillImage] = useState<{ title: string; expense_no: string; image: string } | null>(null);

  // New Expense Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Karigar Salary",
    title: "",
    vendor_name: "",
    amount: 5000,
    payment_status: "Paid" as "Paid" | "Pending",
    paid_via: "Current Account HDFC",
    invoice_no: "",
    notes: "",
    bill_image: ""
  });

  // Input Refs for Enter Key Navigation
  const refDate = useRef<HTMLInputElement>(null);
  const refTitle = useRef<HTMLInputElement>(null);
  const refAmount = useRef<HTMLInputElement>(null);
  const refVendor = useRef<HTMLInputElement>(null);
  const refPaidVia = useRef<HTMLButtonElement>(null);
  const refStatus = useRef<HTMLButtonElement>(null);
  const refSubmit = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => {
        refDate.current?.focus();
      }, 50);
    }
  }, [showModal]);

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
    const d = new Date(dateStr);
    const refDate = new Date("2026-09-26");

    if (periodFilter === "this_week") {
      const oneWeekAgo = new Date(refDate);
      oneWeekAgo.setDate(refDate.getDate() - 7);
      return d >= oneWeekAgo && d <= refDate;
    }
    if (periodFilter === "this_month") {
      return d.getMonth() === refDate.getMonth() && d.getFullYear() === refDate.getFullYear();
    }
    if (periodFilter === "this_year") {
      return d.getFullYear() === refDate.getFullYear();
    }
    if (periodFilter === "custom_date") {
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      return true;
    }
    return true;
  };

  // Filter Expenses List
  const filteredExpenses = expenses.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.expense_no.toLowerCase().includes(search.toLowerCase()) ||
      item.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All"
        ? true
        : statusFilter === "Paid"
        ? item.payment_status === "Paid"
        : item.payment_status === "Pending" || item.payment_status === "Unpaid";

    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesTime = matchesPeriod(item.date);
    return matchesSearch && matchesStatus && matchesCategory && matchesTime;
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
      periodFilter === "this_week"
        ? "This_Week"
        : periodFilter === "this_month"
        ? "This_Month"
        : periodFilter === "this_year"
        ? "Year_2026"
        : "Custom_Period";

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Expense Ref,Date,Description / Title,Category,Vendor,Payment Method,Status,Amount (INR)\n";

    recordsToExport.forEach((item) => {
      const titleClean = `"${item.title.replace(/"/g, '""')}"`;
      const catClean = `"${item.category.replace(/"/g, '""')}"`;
      const vendorClean = `"${item.vendor_name.replace(/"/g, '""')}"`;
      const row = `${item.expense_no},${item.date},${titleClean},${catClean},${vendorClean},${item.paid_via},${item.payment_status},${item.amount}`;
      csvContent += row + "\n";
    });

    const exportTotal = recordsToExport.reduce((sum, item) => sum + item.amount, 0);
    csvContent += `,,TOTAL EXPENDITURE,,,,${exportTotal}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Company_Expenses_${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create New Expense
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.amount <= 0) {
      alert("Please fill in Expense Title and Amount!");
      return;
    }

    const newEntry: ExpenseItem = {
      id: `exp-${Date.now()}`,
      expense_no: `EXP-2026-0${expenses.length + 87}`,
      date: formData.date || new Date().toISOString().split("T")[0],
      category: formData.category,
      title: formData.title.trim(),
      vendor_name: formData.vendor_name.trim() || "General Vendor",
      amount: Number(formData.amount),
      payment_status: formData.payment_status,
      paid_via: formData.paid_via,
      invoice_no: formData.invoice_no.trim() || `INV-${Date.now().toString().slice(-4)}`,
      notes: formData.notes.trim(),
      bill_image: formData.bill_image
    };

    setExpenses([newEntry, ...expenses]);
    setShowModal(false);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      category: "Karigar Salary",
      title: "",
      vendor_name: "",
      amount: 5000,
      payment_status: "Paid",
      paid_via: "Current Account HDFC",
      invoice_no: "",
      notes: "",
      bill_image: ""
    });
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      setExpenses(expenses.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-12">
      {/* 1. TOP 4 ERP METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* CARD 1: TOTAL EXPENSES */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {periodFilter === "this_week"
                ? "TOTAL EXPENSES (THIS WEEK)"
                : periodFilter === "this_month"
                ? "TOTAL EXPENSES (THIS MONTH)"
                : periodFilter === "this_year"
                ? "TOTAL EXPENSES (2026)"
                : "TOTAL EXPENSES"}
            </p>
            <p className="text-xl font-black text-slate-900 mt-0.5">₹{totalExpenseAmount.toLocaleString("en-IN")}</p>
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">{periodExpenses.length} Expense Records</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* CARD 2: TOTAL PAID */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL PAID</p>
            <p className="text-xl font-black text-blue-700 mt-0.5">₹{totalPaidAmount.toLocaleString("en-IN")}</p>
            <span className="text-[11px] font-semibold text-blue-600 mt-0.5 block">Bank Account & Cash</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
            <Check className="w-5 h-5" />
          </div>
        </div>

        {/* CARD 3: PENDING / UNPAID */}
        <div className="bg-white p-4 rounded-xl border border-amber-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">PENDING / UNPAID</p>
            <p className="text-xl font-black text-amber-700 mt-0.5">₹{unpaidExpensesAmount.toLocaleString("en-IN")}</p>
            <span className="text-[11px] font-semibold text-amber-600 mt-0.5 block">Vendor Due Settlement</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* CARD 4: TOP CATEGORY */}
        <div className="bg-white p-4 rounded-xl border border-purple-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">TOP CATEGORY</p>
            <p className="text-lg font-black text-purple-900 mt-0.5 truncate max-w-[170px]" title={topCategory}>
              {topCategory}
            </p>
            <span className="text-[11px] font-bold text-purple-700 mt-0.5 block">
              ₹{topCategoryAmount.toLocaleString("en-IN")} Spent
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 shrink-0">
            <Tag className="w-5 h-5" />
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
            placeholder="Search by expense #, vendor, category, items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 h-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        {/* Action Controls: Status Pill, Categories, Period, Export Excel, Add Expense */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end text-xs">
          {/* Status Toggle Pill Group: All | Paid | Pending */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/90 text-xs">
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

          {/* Categories Dropdown (Styled with standalone pill-card options matching Image 2) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                setIsPeriodDropdownOpen(false);
              }}
              className={`h-9 px-3.5 bg-white border text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                isCategoryDropdownOpen
                  ? "border-2 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900"
                  : "border-slate-300 hover:border-slate-400 text-slate-800"
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span className="uppercase tracking-wider">
                {selectedCategory === "All" ? "ALL CATEGORIES" : selectedCategory}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCategoryDropdownOpen ? "rotate-180 text-emerald-600" : ""}`} />
            </button>

            {isCategoryDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsCategoryDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-[18px] z-50 min-w-full w-max max-w-xs bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 space-y-1 max-h-80 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-100 font-sans">
                  {/* Option: All Categories */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("All");
                      setIsCategoryDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 transition-all cursor-pointer border ${
                      selectedCategory === "All"
                        ? "bg-emerald-50 text-emerald-950 font-extrabold border-emerald-500 shadow-2xs"
                        : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                    }`}
                  >
                    <span>All Categories</span>
                    {selectedCategory === "All" && <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />}
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
                            ? "bg-emerald-50 text-emerald-950 font-extrabold border-emerald-500 shadow-2xs"
                            : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Period Filter Dropdown (Styled matching Vendors page CustomSelect) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsPeriodDropdownOpen(!isPeriodDropdownOpen);
                setIsCategoryDropdownOpen(false);
              }}
              className={`h-9 px-3.5 bg-white border text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                isPeriodDropdownOpen
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900"
                  : "border-slate-300 hover:border-slate-400 text-slate-800"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="uppercase tracking-wider">
                {periodFilter === "this_week"
                  ? "THIS WEEK"
                  : periodFilter === "this_month"
                  ? "THIS MONTH"
                  : periodFilter === "this_year"
                  ? "THIS YEAR"
                  : "CUSTOM DATES"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isPeriodDropdownOpen ? "rotate-180 text-emerald-600" : ""}`} />
            </button>

            {isPeriodDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsPeriodDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-[18px] z-50 min-w-full w-max max-w-xs bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100 font-sans">
                  {[
                    { id: "this_week", label: "This Week" },
                    { id: "this_month", label: "This Month" },
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
                            ? "bg-emerald-50 text-emerald-950 font-extrabold border-emerald-500 shadow-2xs"
                            : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                        }`}
                      >
                        <span className="whitespace-nowrap">{p.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />}
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
                          className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500 w-36"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">To:</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500 w-36"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPeriodDropdownOpen(false)}
                        className="w-full mt-1 py-2 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-2xs cursor-pointer"
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
            className="h-9 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Download Excel CSV File"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {/* ADD EXPENSE BUTTON */}
          <button
            onClick={() => setShowModal(true)}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 3. INLINE ADD EXPENSE FORM CARD */}
      {showModal && (
        <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-2xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 font-sans">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                Add New Expense Voucher (નવો ખર્ચ ઉમેરો)
              </h3>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
            {/* ROW 1: DATE, TITLE & AMOUNT */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date *</label>
                <input
                  ref={refDate}
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      refTitle.current?.focus();
                    }
                  }}
                  className="w-full px-3 h-9 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Expense Title / Description *</label>
                <input
                  ref={refTitle}
                  type="text"
                  placeholder="e.g. Embroidery Machine Oil & Laser Servicing, Karigar Salary..."
                  required
                  value={formData.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    let detectedCat = formData.category;
                    const valLower = val.toLowerCase();
                    if (valLower.includes("salary") || valLower.includes("upad") || valLower.includes("karigar")) {
                      detectedCat = "Karigar Salary";
                    } else if (valLower.includes("light") || valLower.includes("power") || valLower.includes("dgvcl")) {
                      detectedCat = "Electricity & Power Bill";
                    } else if (valLower.includes("diesel") || valLower.includes("freight") || valLower.includes("transport")) {
                      detectedCat = "Diesel & Freight Transport";
                    } else if (valLower.includes("oil") || valLower.includes("repair") || valLower.includes("service")) {
                      detectedCat = "Machine Repair & Maintenance";
                    } else if (valLower.includes("tea") || valLower.includes("rent")) {
                      detectedCat = "Factory Rent & Misc";
                    }
                    setFormData({ ...formData, title: val, category: detectedCat });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      refAmount.current?.focus();
                    }
                  }}
                  className="w-full px-3 h-9 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  ref={refAmount}
                  type="number"
                  required
                  min={1}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      refVendor.current?.focus();
                    }
                  }}
                  className="w-full px-3 h-9 border border-slate-200 rounded-xl font-mono font-black text-slate-900 focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                />
              </div>
            </div>

            {/* ROW 2: VENDOR NAME, CATEGORY, PAYMENT METHOD, STATUS */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vendor / Payee Name</label>
                <input
                  ref={refVendor}
                  type="text"
                  placeholder="e.g. Master Karigar Union, DGVCL"
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setIsFormCategoryOpen(true);
                    }
                  }}
                  className="w-full px-3 h-9 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                />
              </div>

              {/* CUSTOM CATEGORY DROPDOWN FOR FORM */}
              <div className="relative">
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormCategoryOpen(!isFormCategoryOpen);
                    setIsFormPaidViaOpen(false);
                    setIsFormStatusOpen(false);
                  }}
                  className={`w-full px-3 h-9 bg-white border rounded-xl font-extrabold text-slate-900 text-xs flex items-center justify-between transition-all shadow-2xs outline-none cursor-pointer ${
                    isFormCategoryOpen ? "border-2 border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="truncate">{formData.category}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isFormCategoryOpen ? "rotate-180 text-emerald-600" : ""}`} />
                </button>

                {isFormCategoryOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsFormCategoryOpen(false)} />
                    <div className="absolute left-0 top-16 z-30 w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-2.5 space-y-1.5 max-h-60 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-100 font-sans">
                      {formCategories.map((cat) => {
                        const isSelected = formData.category === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, category: cat });
                              setIsFormCategoryOpen(false);
                              setTimeout(() => refPaidVia.current?.focus(), 50);
                            }}
                            className={`w-full text-left px-3.5 py-2 rounded-2xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-emerald-50/90 text-emerald-950 font-extrabold border-2 border-emerald-500 shadow-2xs"
                                : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-extrabold border-slate-200 bg-white"
                            }`}
                          >
                            <span className="truncate">{cat}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />}
                          </button>
                        );
                      })}

                      {/* ADD CUSTOM CATEGORY INLINE IN FORM */}
                      <div className="pt-1.5 border-t border-slate-100">
                        {!isAddCatInputVisible ? (
                          <button
                            type="button"
                            onClick={() => setIsAddCatInputVisible(true)}
                            className="w-full px-3 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-600" />
                            <span>+ Add New Category</span>
                          </button>
                        ) : (
                          <div className="p-1.5 space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
                            <input
                              type="text"
                              placeholder="New Category Name..."
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 bg-white"
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setIsAddCatInputVisible(false)}
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleAddCategory}
                                className="px-3 py-1 text-[11px] font-extrabold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer shadow-2xs"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* CUSTOM PAID VIA DROPDOWN FOR FORM */}
              <div className="relative">
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <button
                  ref={refPaidVia}
                  type="button"
                  onClick={() => {
                    setIsFormPaidViaOpen(!isFormPaidViaOpen);
                    setIsFormCategoryOpen(false);
                    setIsFormStatusOpen(false);
                  }}
                  className={`w-full px-3 h-9 bg-white border rounded-xl font-extrabold text-slate-900 text-xs flex items-center justify-between transition-all shadow-2xs outline-none cursor-pointer ${
                    isFormPaidViaOpen ? "border-2 border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="truncate">{formData.paid_via}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isFormPaidViaOpen ? "rotate-180 text-emerald-600" : ""}`} />
                </button>

                {isFormPaidViaOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsFormPaidViaOpen(false)} />
                    <div className="absolute left-0 top-16 z-30 w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-2.5 space-y-1.5 animate-in fade-in zoom-in-95 duration-100 font-sans">
                      {["Current Account HDFC", "UPI Cash", "Petty Cash", "Cheque Payment", "Credit / Due"].map((pv) => {
                        const isSelected = formData.paid_via === pv;
                        return (
                          <button
                            key={pv}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, paid_via: pv });
                              setIsFormPaidViaOpen(false);
                              setTimeout(() => refStatus.current?.focus(), 50);
                            }}
                            className={`w-full text-left px-3.5 py-2 rounded-2xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-emerald-50/90 text-emerald-950 font-extrabold border-2 border-emerald-500 shadow-2xs"
                                : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-extrabold border-slate-200 bg-white"
                            }`}
                          >
                            <span className="truncate">{pv}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* CUSTOM STATUS DROPDOWN FOR FORM */}
              <div className="relative">
                <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                <button
                  ref={refStatus}
                  type="button"
                  onClick={() => {
                    setIsFormStatusOpen(!isFormStatusOpen);
                    setIsFormCategoryOpen(false);
                    setIsFormPaidViaOpen(false);
                  }}
                  className={`w-full px-3 h-9 bg-white border rounded-xl font-extrabold text-slate-900 text-xs flex items-center justify-between transition-all shadow-2xs outline-none cursor-pointer ${
                    isFormStatusOpen ? "border-2 border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span>{formData.payment_status}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isFormStatusOpen ? "rotate-180 text-emerald-600" : ""}`} />
                </button>

                {isFormStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsFormStatusOpen(false)} />
                    <div className="absolute left-0 top-16 z-30 w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-2.5 space-y-1.5 animate-in fade-in zoom-in-95 duration-100 font-sans">
                      {["Paid", "Pending"].map((st) => {
                        const isSelected = formData.payment_status === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, payment_status: st as any });
                              setIsFormStatusOpen(false);
                              setTimeout(() => refSubmit.current?.focus(), 50);
                            }}
                            className={`w-full text-left px-3.5 py-2 rounded-2xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-emerald-50/90 text-emerald-950 font-extrabold border-2 border-emerald-500 shadow-2xs"
                                : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-extrabold border-slate-200 bg-white"
                            }`}
                          >
                            <span>{st}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* PHYSICAL BILL PHOTO ATTACHMENT FIELD */}
            <div className="pt-1">
              <label className="block font-bold text-slate-700 mb-1">
                Attach Physical Bill Document / Receipt
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="h-9 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-xl font-bold text-slate-700 text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>{formData.bill_image ? "Change Bill File" : "Upload Bill (PDF, PNG, JPG)"}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml, .pdf, application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, bill_image: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {formData.bill_image && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Bill Attached
                  </span>
                )}
              </div>
            </div>

            {/* FORM FOOTER ACTIONS */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 h-9 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                ref={refSubmit}
                type="submit"
                className="px-5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-2xs transition-all active:scale-98 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. EXPENSE REGISTER TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden font-sans">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3.5 px-5">DATE</th>
                <th className="py-3.5 px-5">TITLE & DETAILS</th>
                <th className="py-3.5 px-5">VENDOR NAME</th>
                <th className="py-3.5 px-5">CATEGORY</th>
                <th className="py-3.5 px-5">PAYMENT METHOD</th>
                <th className="py-3.5 px-5">STATUS</th>
                <th className="py-3.5 px-5 text-right">AMOUNT (₹)</th>
                <th className="py-3.5 px-5 text-center w-12">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredExpenses.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-mono font-bold text-slate-700 whitespace-nowrap">
                    {formatDateDDMMYYYY(item.date)}
                  </td>
                  <td className="py-4 px-5 min-w-[220px] max-w-md">
                    <div className="font-extrabold text-slate-900 leading-snug break-words">
                      {item.title}
                    </div>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span className="font-bold text-slate-800">{item.vendor_name}</span>
                    {item.bill_image && (
                      <button
                        onClick={() => setSelectedBillImage({ title: item.title, expense_no: item.expense_no, image: item.bill_image! })}
                        className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] rounded-md border border-blue-200 transition-colors cursor-pointer"
                        title="View Bill Photo"
                      >
                        <FileText className="w-3 h-3 text-blue-600" />
                        <span>Bill</span>
                      </button>
                    )}
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-[11px] font-bold border border-slate-200 inline-block">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-700 font-bold whitespace-nowrap">{item.paid_via}</td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${
                        item.payment_status === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.payment_status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right font-mono font-black text-sm text-slate-900 whitespace-nowrap">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-4 px-5 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleDeleteExpense(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-xs">No expense records found matching filters.</p>
                  </td>
                </tr>
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
                <h3 className="font-extrabold text-slate-900 text-sm">{selectedBillImage.title}</h3>
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
