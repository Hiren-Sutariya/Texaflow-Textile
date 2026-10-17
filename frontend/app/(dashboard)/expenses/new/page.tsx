"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { getTenantItem, setTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import { VoiceTextarea } from "@/components/ui/VoiceTextarea";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  Plus,
  Calendar,
  Upload,
  CreditCard,
  Clock,
  Tag,
  Package,
  Layers,
  Wrench,
  Zap,
  Coffee,
  Truck,
  Building2,
  FileText,
  HelpCircle,
  LucideIcon,
  X,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  GripVertical,
  RotateCcw,
  Sparkles,
  Search,
  Star,
  Trash2,
  CheckCircle2
} from "lucide-react";

interface CategoryCardItem {
  id: string;
  name: string;
  icon: LucideIcon;
}

const defaultCategories: CategoryCardItem[] = [
  { id: "cat-1", name: "Packaging Materials", icon: Package },
  { id: "cat-2", name: "Dhaga & Consumables", icon: Layers },
  { id: "cat-3", name: "Machine Maintenance & Repairs", icon: Wrench },
  { id: "cat-4", name: "Electricity & Power", icon: Zap },
  { id: "cat-5", name: "Tea & Refreshments", icon: Coffee },
  { id: "cat-6", name: "Logistics & Courier", icon: Truck },
  { id: "cat-7", name: "Factory / Office Rent", icon: Building2 },
  { id: "cat-8", name: "Stationery & Printing", icon: FileText },
  { id: "cat-9", name: "Miscellaneous / Other", icon: HelpCircle },
];

const getCategoryIcon = (name: string): LucideIcon => {
  const found = defaultCategories.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
  return found ? found.icon : Tag;
};

const isStandardCategory = (name: string): boolean => {
  return defaultCategories.some((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
};

const paymentModeOptions = [
  "BANK TRANSFER (NEFT/RTGS/IMPS)",
  "UPI (GPay / PhonePe / Paytm)",
  "Cash",
  "Cheque",
  "Credit (15 days)"
];

const defaultRegisteredVendors = [
  "Shree Ram Yarns & Zari Mills",
  "Master Karigar Union",
  "DGVCL Power Corp",
  "Surat Needle Mart",
  "Ganesh Embroidery Services",
  "Maruti Jobwork Works Surat",
  "Nayara Energy & Local Freight",
  "Gujarat Gas Limited",
  "Krishna Packaging & Boxes",
  "Surat Bobbin & Consumables"
];

const getTodayStr = () => new Date().toISOString().split("T")[0];
const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

function NewExpenseVoucherForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit") || searchParams.get("id");
  const isEditMode = Boolean(editId);

  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [editingExpenseNo, setEditingExpenseNo] = useState("");
  const [nextVoucherNo, setNextVoucherNo] = useState("");
  const [isLoadingExpense, setIsLoadingExpense] = useState(false);

  // 1. Amount
  const [amount, setAmount] = useState("");

  // 2. Date
  const [voucherDate, setVoucherDate] = useState(getTodayStr());

  // 3. Category & Custom Arrangement
  const [isMounted, setIsMounted] = useState(false);
  const [category, setCategory] = useState("Packaging Materials");
  const [defaultCategory, setDefaultCategory] = useState<string>("Packaging Materials");
  const [categoryPage, setCategoryPage] = useState(0); // 0-indexed page (9 items per page)
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<string[]>(() => defaultCategories.map((c) => c.name));
  const [newCatName, setNewCatName] = useState("");
  const [isAddInputOpen, setIsAddInputOpen] = useState(false);
  const [defaultSavedToast, setDefaultSavedToast] = useState(false);

  const refreshFormState = useCallback(() => {
    let loadedCats: string[] = [];
    try {
      const savedCats = getTenantItem<string[]>("texaflow_custom_expense_categories", "om_sai_custom_expense_categories")
        || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("texaflow_custom_expense_categories") || "[]") : []);
      if (Array.isArray(savedCats) && savedCats.length > 0) {
        loadedCats = savedCats;
        setCustomCategories(savedCats);
      } else {
        setCustomCategories([]);
      }
    } catch {}

    const allAvailable = [
      ...defaultCategories.map((c) => c.name),
      ...loadedCats
    ];

    let finalOrder = allAvailable;
    try {
      const cid = getStoredCompanyId();
      const savedOrder = getTenantItem<string[]>("texaflow_expense_categories_order", "om_sai_expense_categories_order")
        || (cid && typeof window !== "undefined" ? JSON.parse(localStorage.getItem(`texaflow_expense_categories_order_${cid}`) || "null") : null)
        || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("texaflow_expense_categories_order") || "null") : null);

      if (Array.isArray(savedOrder) && savedOrder.length > 0) {
        const valid = savedOrder.filter((name) => allAvailable.includes(name));
        allAvailable.forEach((name) => {
          if (!valid.includes(name)) {
            valid.push(name);
          }
        });
        finalOrder = valid;
      }
    } catch {}

    setCategoryOrder(finalOrder);

    // Load custom default category selection if set
    let initialDefault = "Packaging Materials";
    try {
      const savedDefault = getTenantItem<string>("texaflow_default_expense_category", "om_sai_default_expense_category");
      if (savedDefault && typeof savedDefault === "string" && allAvailable.includes(savedDefault)) {
        initialDefault = savedDefault;
      }
    } catch {}

    setDefaultCategory(initialDefault);

    if (!editId) {
      setCategory(initialDefault);
      const defIdx = finalOrder.indexOf(initialDefault);
      if (defIdx >= 0) {
        setCategoryPage(Math.floor(defIdx / 9));
      }
      setAmount("");
      setRemarks("");
      setBillImage("");
      setVendorName("");
      setShowVendorField(false);
      setPaymentMode("BANK TRANSFER (NEFT/RTGS/IMPS)");
      setPaymentStatus("Paid");
      setVoucherDate(getTodayStr());
    }
  }, [editId]);

  useEffect(() => {
    refreshFormState();
    setIsMounted(true);
  }, [refreshFormState]);

  useEffect(() => {
    const handleDataUpdate = () => {
      refreshFormState();
    };
    window.addEventListener("app_data_update", handleDataUpdate);
    return () => window.removeEventListener("app_data_update", handleDataUpdate);
  }, [refreshFormState]);

  // Reorder modal state
  const [isArrangeModalOpen, setIsArrangeModalOpen] = useState(false);
  const [tempOrder, setTempOrder] = useState<string[]>([]);
  const [arrangeSearch, setArrangeSearch] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [orderSavedToast, setOrderSavedToast] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // 4. Vendor / Payee (Optional Toggleable Field)
  const [showVendorField, setShowVendorField] = useState(false);
  const [isRegisteredVendorMode, setIsRegisteredVendorMode] = useState(false);
  const [isVendorSelectOpen, setIsVendorSelectOpen] = useState(false);
  const [registeredVendorsList, setRegisteredVendorsList] = useState<string[]>([]);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  const [vendorName, setVendorName] = useState("");
  const [paymentMode, setPaymentMode] = useState("BANK TRANSFER (NEFT/RTGS/IMPS)");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Pending">("Paid");
  const [remarks, setRemarks] = useState("");
  const [billImage, setBillImage] = useState("");

  // Dropdown states
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // DatePicker Navigation State
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const modeRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Load registered vendors from API or localStorage
  useEffect(() => {
    let isMounted = true;
    const currentCid = getStoredCompanyId();

    async function loadVendors() {
      try {
        const live = await fetchApi<any[]>("/vendors");
        if (isMounted && Array.isArray(live)) {
          const scoped = live.filter((v: any) => (v.company_id || "comp-001") === currentCid);
          const names = scoped
            .map((v: any) => v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim())
            .filter(Boolean);
          if (names.length > 0) {
            setRegisteredVendorsList(names);
            return;
          }
        }
      } catch {}

      if (!isMounted) return;
      try {
        const saved = getTenantItem<any[]>(
          "texaflow_vendors",
          currentCid === "comp-002" ? "om_sai_vendors" : undefined
        );
        if (saved && Array.isArray(saved) && saved.length > 0) {
          const scoped = saved.filter((v: any) => (v.company_id || (currentCid === "comp-002" ? "comp-002" : "comp-001")) === currentCid);
          const names = scoped
            .map((v: any) => v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`.trim())
            .filter(Boolean);
          if (names.length > 0) {
            setRegisteredVendorsList(names);
            return;
          }
        }
      } catch {}

      if (currentCid === "comp-002") {
        setRegisteredVendorsList(defaultRegisteredVendors);
      } else {
        setRegisteredVendorsList([]);
      }
    }

    loadVendors();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) {
        setIsModeDropdownOpen(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target as Node)) {
        setIsVendorSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load expense details when editing
  useEffect(() => {
    if (!editId) return;

    const populateExpenseData = (exp: any) => {
      if (!exp) return;

      if (exp.expense_no) {
        setEditingExpenseNo(exp.expense_no);
      }
      if (exp.amount !== undefined && exp.amount !== null) {
        setAmount(String(exp.amount));
      }

      if (exp.date) {
        let dStr = String(exp.date).trim();
        if (dStr.includes("-")) {
          const parts = dStr.split("-");
          if (parts[0].length === 4) {
            setVoucherDate(dStr);
          } else if (parts[2] && parts[2].length === 4) {
            setVoucherDate(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`);
          }
        } else if (dStr.includes("/")) {
          const parts = dStr.split("/");
          if (parts[2] && parts[2].length === 4) {
            setVoucherDate(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`);
          }
        }
      }

      if (exp.category) {
        setCategory(exp.category);
        const isStandard = defaultCategories.some(
          (c) => c.name.trim().toLowerCase() === exp.category.trim().toLowerCase()
        );
        if (!isStandard) {
          setCategoryPage(1);
          setCustomCategories((prev) => {
            if (!prev.some((p) => p.trim().toLowerCase() === exp.category.trim().toLowerCase())) {
              const updated = [...prev, exp.category.trim()];
              try {
                setTenantItem("texaflow_custom_expense_categories", updated, "om_sai_custom_expense_categories");
              } catch {}
              return updated;
            }
            return prev;
          });
        } else {
          setCategoryPage(0);
        }
      }

      if (exp.vendor_name) {
        setVendorName(exp.vendor_name);
        setShowVendorField(true);
      }



      if (exp.paid_via) {
        setPaymentMode(exp.paid_via);
      }

      if (exp.payment_status) {
        setPaymentStatus(exp.payment_status === "Pending" || exp.payment_status === "Unpaid" ? "Pending" : "Paid");
      }

      const noteText = exp.notes || exp.title || "";
      if (noteText) {
        setRemarks(noteText);
      }

      if (exp.bill_image) {
        setBillImage(exp.bill_image);
      }
    };

    // 1. Immediate retrieval from localStorage
    const currentCid = getStoredCompanyId();
    try {
      const list = getTenantItem<any[]>(
        "texaflow_expenses",
        currentCid === "comp-002" ? "om_sai_expenses" : undefined
      );
      if (list && Array.isArray(list)) {
        const scoped = list.filter((item: any) => (item.company_id || (currentCid === "comp-002" ? "comp-002" : "comp-001")) === currentCid);
        const found = scoped.find((item: any) => String(item.id) === String(editId) || item.expense_no === editId);
        if (found) {
          populateExpenseData(found);
        }
      }
    } catch (err) {
      console.error("Local storage lookup failed:", err);
    }

    // 2. Fetch from backend API
    setIsLoadingExpense(true);
    fetchApi<any>(`/expenses/${editId}`)
      .then((data) => {
        if (data) {
          populateExpenseData(data);
        }
      })
      .catch((err) => {
        console.warn("Backend API expense fetch error:", err);
      })
      .finally(() => {
        setIsLoadingExpense(false);
      });
  }, [editId]);

  // Compute next sequential voucher number for new expenses
  useEffect(() => {
    if (!isEditMode) {
      try {
        const currentCid = getStoredCompanyId();
        const saved = getTenantItem<any[]>(
          "texaflow_expenses",
          currentCid === "comp-002" ? "om_sai_expenses" : undefined
        );
        const list = Array.isArray(saved)
          ? saved.filter((item: any) => (item.company_id || (currentCid === "comp-002" ? "comp-002" : "comp-001")) === currentCid)
          : [];
        let maxSeq = 0;
        list.forEach((item: any) => {
          if (item.expense_no) {
            const m = item.expense_no.match(/(?:EB|EXP)-(?:\d{4}-)?(\d+)/i);
            if (m) {
              const num = parseInt(m[1], 10);
              if (!isNaN(num) && num < 500 && num > maxSeq) {
                maxSeq = num;
              }
            }
          }
        });
        if (maxSeq === 0 && list.length > 0) {
          maxSeq = list.length;
        }
        setNextVoucherNo(`EB-${String(maxSeq + 1).padStart(3, "0")}`);
      } catch {}
    }
  }, [isEditMode]);



  const handleAddCategory = (toTop: boolean = false) => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (!customCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        setTenantItem("texaflow_custom_expense_categories", updated, "om_sai_custom_expense_categories");
        const cid = getStoredCompanyId();
        if (cid && typeof window !== "undefined") {
          localStorage.setItem(`texaflow_custom_expense_categories_${cid}`, JSON.stringify(updated));
        }
        if (typeof window !== "undefined") {
          localStorage.setItem("texaflow_custom_expense_categories", JSON.stringify(updated));
        }
      } catch (err) {
        console.error(err);
      }
    }
    const updatedOrder = toTop
      ? [trimmed, ...categoryOrder.filter((c) => c !== trimmed)]
      : [...categoryOrder.filter((c) => c !== trimmed), trimmed];
    setCategoryOrder(updatedOrder);
    try {
      setTenantItem("texaflow_expense_categories_order", updatedOrder, "om_sai_expense_categories_order");
      const cid = getStoredCompanyId();
      if (cid && typeof window !== "undefined") {
        localStorage.setItem(`texaflow_expense_categories_order_${cid}`, JSON.stringify(updatedOrder));
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("texaflow_expense_categories_order", JSON.stringify(updatedOrder));
      }
    } catch {}

    setCategory(trimmed);
    setNewCatName("");
    setIsAddInputOpen(false);

    const newIdx = updatedOrder.indexOf(trimmed);
    if (newIdx >= 0) {
      setCategoryPage(Math.floor(newIdx / ITEMS_PER_PAGE));
    }
  };

  const handleDeleteCustomCategory = (nameToRemove: string) => {
    setCategoryToDelete(nameToRemove);
  };

  const confirmDeleteCustomCategory = () => {
    if (!categoryToDelete) return;
    const nameToRemove = categoryToDelete;
    setCategoryToDelete(null);

    const updated = customCategories.filter((c) => c !== nameToRemove);
    setCustomCategories(updated);
    try {
      setTenantItem("texaflow_custom_expense_categories", updated, "om_sai_custom_expense_categories");
      const cid = getStoredCompanyId();
      if (cid && typeof window !== "undefined") {
        localStorage.setItem(`texaflow_custom_expense_categories_${cid}`, JSON.stringify(updated));
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("texaflow_custom_expense_categories", JSON.stringify(updated));
      }
    } catch (err) {
      console.error(err);
    }
    const updatedOrder = categoryOrder.filter((c) => c !== nameToRemove);
    setCategoryOrder(updatedOrder);
    try {
      setTenantItem("texaflow_expense_categories_order", updatedOrder, "om_sai_expense_categories_order");
      const cid = getStoredCompanyId();
      if (cid && typeof window !== "undefined") {
        localStorage.setItem(`texaflow_expense_categories_order_${cid}`, JSON.stringify(updatedOrder));
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("texaflow_expense_categories_order", JSON.stringify(updatedOrder));
      }
    } catch {}
    setTempOrder((prev) => prev.filter((c) => c !== nameToRemove));

    // Clamp page so user immediately returns to page 1 if this was the last item on the page
    const newTotalPages = Math.max(1, Math.ceil(updatedOrder.length / 9));
    setCategoryPage((prev) => Math.min(prev, newTotalPages - 1));

    if (defaultCategory === nameToRemove) {
      const fallbackDef = updatedOrder[0] || "Packaging Materials";
      setDefaultCategory(fallbackDef);
      try {
        setTenantItem("texaflow_default_expense_category", fallbackDef, "om_sai_default_expense_category");
      } catch {}
    }

    if (category === nameToRemove) {
      setCategory(updatedOrder[0] || "Packaging Materials");
    }
  };

  const handleSetDefaultCategory = (catName: string) => {
    setDefaultCategory(catName);
    setCategory(catName);
    try {
      setTenantItem("texaflow_default_expense_category", catName, "om_sai_default_expense_category");
    } catch {}
    setDefaultSavedToast(true);
    setTimeout(() => setDefaultSavedToast(false), 2500);
  };

  const handleOpenArrangeModal = () => {
    setTempOrder([...categoryOrder]);
    setArrangeSearch("");
    setIsArrangeModalOpen(true);
  };

  const moveCategory = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= tempOrder.length) return;
    const copy = [...tempOrder];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    setTempOrder(copy);
  };



  const handleSaveOrder = () => {
    setCategoryOrder(tempOrder);
    try {
      setTenantItem("texaflow_expense_categories_order", tempOrder, "om_sai_expense_categories_order");
      const cid = getStoredCompanyId();
      if (cid && typeof window !== "undefined") {
        localStorage.setItem(`texaflow_expense_categories_order_${cid}`, JSON.stringify(tempOrder));
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("texaflow_expense_categories_order", JSON.stringify(tempOrder));
      }
    } catch {}
    setIsArrangeModalOpen(false);
    setCategoryPage(0);
    setOrderSavedToast(true);
    setTimeout(() => setOrderSavedToast(false), 3000);
  };

  const handleResetOrder = () => {
    const defaultSeq = [
      ...defaultCategories.map((c) => c.name),
      ...customCategories
    ];
    setTempOrder(defaultSeq);
  };

  // Directly follows unified category order (standard + custom arranged)
  const displayedCategoriesList: string[] = categoryOrder;

  const ITEMS_PER_PAGE = 9;
  const totalCategoryPages = Math.max(1, Math.ceil(displayedCategoriesList.length / ITEMS_PER_PAGE));
  const safeCategoryPage = Math.min(categoryPage, totalCategoryPages - 1);

  useEffect(() => {
    if (categoryPage >= totalCategoryPages) {
      setCategoryPage(Math.max(0, totalCategoryPages - 1));
    }
  }, [totalCategoryPages, categoryPage]);

  const activePageCategories = displayedCategoriesList.slice(
    safeCategoryPage * ITEMS_PER_PAGE,
    (safeCategoryPage + 1) * ITEMS_PER_PAGE
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSavingRef.current) return;

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      alert("Please enter a valid expense amount!");
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      const formattedDate = (() => {
        const d = voucherDate || getTodayStr();
        const parts = d.trim().split("-");
        if (parts.length === 3 && parts[0].length === 4) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return d;
      })();

      if (isEditMode && editId) {
        // UPDATE EXISTING EXPENSE
        const updatedExpense = {
          id: editId,
          expense_no: editingExpenseNo || "EB-001",
          date: formattedDate,
          category: category,
          vendor_name: vendorName.trim() || "",
          amount: numericAmount,
          payment_status: paymentStatus,
          paid_via: paymentMode,
          notes: remarks.trim(),
          bill_image: billImage
        };

        // 1. Update Supabase via FastAPI Backend
        try {
          await fetchApi(`/expenses/${editId}`, {
            method: "PUT",
            body: JSON.stringify({
              date: formattedDate,
              category: updatedExpense.category,
              vendor_name: updatedExpense.vendor_name,
              amount: updatedExpense.amount,
              payment_status: updatedExpense.payment_status,
              paid_via: updatedExpense.paid_via,
              notes: updatedExpense.notes,
              bill_image: updatedExpense.bill_image || undefined
            })
          });
        } catch (apiErr) {
          console.warn("Backend API update error:", apiErr);
        }

        // 2. Update localStorage
        try {
          const currentCid = getStoredCompanyId();
          const list = getTenantItem<any[]>(
            "texaflow_expenses",
            currentCid === "comp-002" ? "om_sai_expenses" : undefined
          ) || [];
          const updatedList = list.map((item: any) =>
            String(item.id) === String(editId) || item.expense_no === editId ? updatedExpense : item
          );
          setTenantItem(
            "texaflow_expenses",
            updatedList,
            currentCid === "comp-002" ? "om_sai_expenses" : undefined
          );
          window.dispatchEvent(new Event("app_data_update"));
          window.dispatchEvent(new Event("storage"));
        } catch (err) {
          console.error(err);
        }

        router.push("/expenses");
        return;
      }

      // CREATE NEW EXPENSE WITH CONTINUOUS SEQUENTIAL NUMBERING
      const currentCid = getStoredCompanyId();
      let existingList: any[] = [];
      try {
        const saved = getTenantItem<any[]>(
          "texaflow_expenses",
          currentCid === "comp-002" ? "om_sai_expenses" : undefined
        );
        if (saved && Array.isArray(saved)) {
          existingList = saved.filter((item: any) => (item.company_id || (currentCid === "comp-002" ? "comp-002" : "comp-001")) === currentCid);
        }
      } catch {}

      let maxSeq = 0;
      existingList.forEach((item) => {
        if (item.expense_no) {
          const m = item.expense_no.match(/(?:EB|EXP)-(?:\d{4}-)?(\d+)/i);
          if (m) {
            const num = parseInt(m[1], 10);
            if (!isNaN(num) && num < 500 && num > maxSeq) {
              maxSeq = num;
            }
          }
        }
      });
      if (maxSeq === 0 && existingList.length > 0) {
        maxSeq = existingList.length;
      }
      const nextNum = maxSeq + 1;
      const pad = String(nextNum).padStart(3, "0");
      const nextSeqNo = `EB-${pad}`;

      const newExpense = {
        id: currentCid === "comp-001" ? `exp-${pad}` : `${currentCid}-exp-${pad}`,
        expense_no: nextSeqNo,
        date: formattedDate,
        category: category,
        vendor_name: vendorName.trim() || "",
        amount: numericAmount,
        payment_status: paymentStatus,
        paid_via: paymentMode,
        notes: remarks.trim(),
        bill_image: billImage,
        company_id: currentCid
      };

      // 1. Save directly to Supabase via FastAPI Backend
      let createdItem: any = null;
      try {
        createdItem = await fetchApi("/expenses", {
          method: "POST",
          body: JSON.stringify({
            expense_no: newExpense.expense_no,
            date: formattedDate,
            category: newExpense.category,
            vendor_name: newExpense.vendor_name,
            amount: newExpense.amount,
            payment_status: newExpense.payment_status,
            paid_via: newExpense.paid_via,
            notes: newExpense.notes,
            bill_image: newExpense.bill_image || undefined,
            company_id: currentCid
          })
        });
        if (createdItem && createdItem.id) {
          newExpense.id = createdItem.id;
        }
      } catch (apiErr) {
        console.warn("Backend API not reachable, saving to local backup:", apiErr);
      }

      // 2. Keep local cache updated
      try {
        const existing = getTenantItem<any[]>(
          "texaflow_expenses",
          currentCid === "comp-002" ? "om_sai_expenses" : undefined
        ) || [];
        const scoped = existing.filter((item: any) => (item.company_id || (currentCid === "comp-002" ? "comp-002" : "comp-001")) === currentCid);
        const list = [...scoped];
        list.unshift(newExpense);
        setTenantItem(
          "texaflow_expenses",
          list,
          currentCid === "comp-002" ? "om_sai_expenses" : undefined
        );
        window.dispatchEvent(new Event("app_data_update"));
        window.dispatchEvent(new Event("storage"));
      } catch (err) {
        console.error(err);
      }

      router.push("/expenses");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-3.5 pb-24 animate-in fade-in duration-150 text-xs font-sans">
      {/* 1. TOP HEADER TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
        <h2 className="font-extrabold text-slate-800 text-xs sm:text-sm tracking-wide uppercase truncate mr-1">
          {isEditMode
            ? `EDIT EXPENSE VOUCHER ${editingExpenseNo ? `(${editingExpenseNo})` : ""}`
            : `NEW EXPENSE VOUCHER REGISTRATION ${nextVoucherNo ? `(${nextVoucherNo})` : ""}`}
        </h2>
        <Link
          href="/expenses"
          className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back to Voucher List</span>
          <span className="sm:hidden inline">Back</span>
        </Link>
      </div>

      {/* 2. FORM CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4.5">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* FIELD 1: AMOUNT (₹) * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">Amount (₹)*</label>
            <div className="relative max-w-xl w-full">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm select-none">
                ₹
              </span>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 pl-8 pr-3 w-full bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs font-mono"
                autoFocus
              />
            </div>
          </div>

          {/* FIELD 2: VOUCHER DATE * */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600">Voucher Date*</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl w-full">
              <div ref={datePickerRef} className="relative flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDatePickerOpen((prev) => !prev);
                    setIsModeDropdownOpen(false);
                  }}
                  className={`w-full h-9 px-3 bg-white border rounded-xl text-xs font-mono font-bold text-slate-900 flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                    isDatePickerOpen
                      ? "border-blue-500 ring-2 ring-blue-500/20"
                      : "border-slate-300 hover:border-blue-400"
                  }`}
                >
                  <span>
                    {voucherDate
                      ? `${voucherDate.split("-")[2]} / ${voucherDate.split("-")[1]} / ${voucherDate.split("-")[0]}`
                      : "DD / MM / YYYY"}
                  </span>
                  <Calendar className="w-4 h-4 text-blue-600" />
                </button>

                {/* DATE PICKER POPUP */}
                {isDatePickerOpen && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs font-bold text-slate-900">
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

                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>

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
                          const isSelected = voucherDate === dateStr;
                          const isToday = getTodayStr() === dateStr;

                          items.push(
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                setVoucherDate(dateStr);
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

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setVoucherDate(getTodayStr());
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

              {/* QUICK PILLS: TODAY / YESTERDAY (BLUE THEME) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setVoucherDate(getTodayStr())}
                  className={`px-3 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    voucherDate === getTodayStr()
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherDate(getYesterdayStr())}
                  className={`px-3 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    voucherDate === getYesterdayStr()
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Yesterday
                </button>
              </div>
            </div>
          </div>

          {/* FIELD 3: CATEGORY (COMPACT BLUE & WHITE SLIDER / CARDS WITH CUSTOM ARRANGE) */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-start text-xs pt-1">
            <div className="pt-1.5">
              <label className="font-extrabold text-rose-600 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span>Category*</span>
              </label>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Standard & custom categories
              </span>
            </div>

            <div className="space-y-2.5 w-full max-w-4xl">
              {/* TOP SLIDER CONTROLS & ARRANGE ACTION */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-700">
                    Categories ({categoryOrder.length})
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                    {safeCategoryPage + 1} / {totalCategoryPages}
                  </span>

                  {orderSavedToast && (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      Order Saved!
                    </span>
                  )}
                  {defaultSavedToast && (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      Default Category Saved!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">


                  {/* CUSTOM ARRANGE / REORDER BUTTON */}
                  <button
                    type="button"
                    onClick={handleOpenArrangeModal}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Customize Category Order"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                    <span>Arrange Order</span>
                  </button>

                  {/* PAGINATION CONTROLS */}
                  {totalCategoryPages > 1 && (
                    <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1 ml-0.5">
                      <button
                        type="button"
                        onClick={() => setCategoryPage((p) => Math.max(0, p - 1))}
                        disabled={safeCategoryPage === 0}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryPage((p) => Math.min(totalCategoryPages - 1, p + 1))}
                        disabled={safeCategoryPage >= totalCategoryPages - 1}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="Next Page"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* CATEGORIES GRID: 2 COLUMNS ON MOBILE, 3 COLUMNS ON DESKTOP */}
              <div className="w-full">
                {!isMounted ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 px-2.5 sm:px-3 rounded-xl border border-slate-200 bg-slate-50/70 animate-pulse flex items-center gap-2"
                      >
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-slate-200/80 shrink-0" />
                        <div className="h-3.5 bg-slate-200/80 rounded w-20 sm:w-28" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
                    {activePageCategories.map((catName) => {
                      const IconComp = getCategoryIcon(catName);
                      const isSelected = category === catName;
                      const isCustom = !isStandardCategory(catName);
                      const overallIndex = categoryOrder.indexOf(catName);

                      return (
                        <div
                          key={catName}
                          className={`h-10 px-2 sm:px-3 rounded-xl border flex items-center justify-between gap-1.5 sm:gap-2 transition-all group relative ${
                            isSelected
                              ? "border-2 border-blue-600 bg-blue-50/70 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-500/20"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-700 font-semibold"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setCategory(catName);
                              if (catName === "Miscellaneous / Other") {
                                setIsAddInputOpen(true);
                              } else {
                                setIsAddInputOpen(false);
                              }
                            }}
                            className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 text-left cursor-pointer h-full"
                          >
                            <div
                              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : isCustom
                                  ? "bg-indigo-50 text-indigo-600 border border-indigo-200/50"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <IconComp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </div>
                            <span className="text-[11px] sm:text-xs truncate font-bold">{catName}</span>
                          </button>

                          {/* BADGES & QUICK ACTIONS */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isCustom && (
                              <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                Custom
                              </span>
                            )}

                            {/* Custom Category Delete Button */}
                            {isCustom && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCustomCategory(catName);
                                }}
                                className="w-5 h-5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                                title={`Remove "${catName}"`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CONDITIONAL INPUT BAR: SHOWN ONLY FOR "Miscellaneous / Other" */}
              {(category === "Miscellaneous / Other" || isAddInputOpen) && (
                <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type custom category name..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCategory(false);
                        }
                      }}
                      className="w-full pl-9 pr-3 h-9 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddInputOpen(false);
                      setNewCatName("");
                      if (category === "Miscellaneous / Other") {
                        setCategory(categoryOrder[0] || "Packaging Materials");
                      }
                    }}
                    className="h-9 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 border border-slate-200"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddCategory(false)}
                    disabled={!newCatName.trim()}
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* FIELD 4: DYNAMIC CUSTOM PAYEE / SHOP & BILL / INVOICE OPTIONS (IMAGES 1, 2, 3, 4) */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-start text-xs pt-1">
            <div className="hidden sm:block pt-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Payee & Bill</span>
              </label>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Optional details
              </span>
            </div>

            <div className="max-w-xl w-full space-y-3.5">
              {!showVendorField ? (
                <div className="flex flex-wrap items-center gap-6 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowVendorField(true)}
                    className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enter Custom Payee / Shop</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Vendor / Supplier</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRegisteredVendorMode((prev) => !prev)}
                      className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{isRegisteredVendorMode ? "Enter Custom Payee / Shop" : "Select Registered Vendor"}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {isRegisteredVendorMode ? (
                      /* REGISTERED VENDOR DROPDOWN (ROUNDED-XL MATCHING OTHER FIELDS) */
                      <div ref={vendorDropdownRef} className="relative flex-1">
                        <button
                          type="button"
                          onClick={() => setIsVendorSelectOpen((prev) => !prev)}
                          className={`w-full h-9 px-3 bg-white border rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                            isVendorSelectOpen
                              ? "border-blue-500 ring-2 ring-blue-500/20"
                              : "border-slate-300 hover:border-blue-400"
                          }`}
                        >
                          <span className={vendorName ? "font-bold text-slate-900 truncate" : "text-slate-400 font-normal truncate"}>
                            {vendorName || "Select registered vendor from list..."}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                        </button>

                        {isVendorSelectOpen && (
                          <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full w-full bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-0.5 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                            {registeredVendorsList.map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => {
                                  setVendorName(v);
                                  setIsVendorSelectOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 text-slate-800 flex items-center justify-between cursor-pointer"
                              >
                                <span className="truncate">{v}</span>
                                {vendorName === v && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2 stroke-[2.5]" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* CUSTOM PAYEE / SHOP TEXT INPUT (ROUNDED-XL MATCHING OTHER FIELDS) */
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Shop or payee name..."
                          value={vendorName}
                          onChange={(e) => setVendorName(e.target.value)}
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                          autoFocus
                        />
                      </div>
                    )}

                    {/* RED ✕ REMOVE BUTTON */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowVendorField(false);
                        setVendorName("");
                        setIsRegisteredVendorMode(false);
                        setIsVendorSelectOpen(false);
                      }}
                      className="w-7 h-7 flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Remove Vendor Field"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FIELD 7: PAYMENT MODE */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-bold text-slate-700">Payment Mode</label>
            <div ref={modeRef} className="relative max-w-xl w-full">
              <button
                type="button"
                onClick={() => {
                  setIsModeDropdownOpen((prev) => !prev);
                  setIsDatePickerOpen(false);
                }}
                className={`w-full h-9 px-3 bg-white border rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                  isModeDropdownOpen
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-slate-300 hover:border-blue-400"
                }`}
              >
                <span className="truncate">{paymentMode}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                    isModeDropdownOpen ? "rotate-180 text-blue-600" : ""
                  }`}
                />
              </button>

              {isModeDropdownOpen && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full w-full bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {paymentModeOptions.map((opt) => {
                    const isSelected = paymentMode === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setPaymentMode(opt);
                          setIsModeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50 text-blue-900 font-extrabold"
                            : "text-slate-700 hover:bg-slate-50 font-semibold"
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2 stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* FIELD 8: PAYMENT STATUS * (BLUE & WHITE THEME) */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs">
            <label className="font-extrabold text-rose-600 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>Payment Status*</span>
            </label>
            <div className="flex items-center gap-2 max-w-xl w-full">
              <button
                type="button"
                onClick={() => setPaymentStatus("Paid")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  paymentStatus === "Paid"
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Paid</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus("Pending")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  paymentStatus === "Pending"
                    ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Pending</span>
              </button>
            </div>
          </div>

          {/* FIELD 7: REMARKS / DESCRIPTION */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-start text-xs pt-1">
            <label className="font-bold text-slate-700 pt-2">Remarks / Notes</label>
            <VoiceTextarea
              rows={3}
              placeholder="Add optional expense description, items purchased or notes..."
              value={remarks}
              onChangeValue={(val) => setRemarks(val)}
            />
          </div>

          {/* FIELD 11: ATTACH PHYSICAL BILL DOCUMENT */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center text-xs pt-1">
            <label className="font-bold text-slate-700">Attach Bill Receipt</label>
            <div className="max-w-xl w-full flex items-center gap-3">
              <label
                htmlFor="bill-upload-page"
                className="px-3.5 h-9 bg-slate-50 hover:bg-slate-100 border border-slate-300 border-dashed rounded-xl font-bold text-slate-700 text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>{billImage ? "Change Bill File" : "Upload Bill (PDF, PNG, JPG)"}</span>
                <input
                  id="bill-upload-page"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (uploadEvent) => {
                        setBillImage(uploadEvent.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              {billImage && (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                  Bill Attached
                </span>
              )}
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
              href="/expenses"
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs transition-colors cursor-pointer shadow-2xs shrink-0"
            >
              Cancel
            </Link>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSubmit}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 font-extrabold rounded-xl text-xs shadow-md flex items-center gap-1.5 sm:gap-2 transition-all shrink-0 ${
                isSaving
                  ? "bg-blue-400 text-white cursor-not-allowed pointer-events-none opacity-80"
                  : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  <span className="truncate">{isEditMode ? "Updating..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden sm:inline">{isEditMode ? "Update Expense Voucher" : "Save Expense Voucher"}</span>
                  <span className="sm:hidden inline">{isEditMode ? "Update" : "Save Voucher"}</span>
                </>
              )}
            </button>
          </>
        }
      />

      {/* ================= MODAL: CUSTOMIZE CATEGORY ORDER & PRIORITY ================= */}
      {isArrangeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 shadow-2xs">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Arrange Category Order &amp; Priority
                  </h3>
                  <p className="text-xs text-slate-500">
                    Drag or use Up/Down buttons to organize your categories
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsArrangeModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">

              {/* Search Filter in Modal */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={arrangeSearch}
                  onChange={(e) => setArrangeSearch(e.target.value)}
                  placeholder="Filter categories in list..."
                  className="w-full pl-8.5 pr-3 h-8.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Reorderable List */}
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {tempOrder
                  .map((catName, originalIndex) => ({ catName, originalIndex }))
                  .filter(({ catName }) =>
                    !arrangeSearch.trim() || catName.toLowerCase().includes(arrangeSearch.toLowerCase())
                  )
                  .map(({ catName, originalIndex }) => {
                    const IconComp = getCategoryIcon(catName);
                    const isCustom = !isStandardCategory(catName);
                    const isTopNine = originalIndex < 9;

                    return (
                      <div
                        key={catName}
                        draggable
                        onDragStart={() => setDraggedIndex(originalIndex)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggedIndex === null || draggedIndex === originalIndex) return;
                          moveCategory(draggedIndex, originalIndex);
                          setDraggedIndex(originalIndex);
                        }}
                        onDragEnd={() => setDraggedIndex(null)}
                        className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          draggedIndex === originalIndex
                            ? "bg-blue-100 border-blue-400 shadow-md scale-[1.01]"
                            : isTopNine
                            ? "bg-white border-slate-200 hover:border-blue-300 shadow-2xs"
                            : "bg-slate-50/70 border-slate-200 text-slate-600"
                        }`}
                      >
                        {/* Drag handle & rank */}
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                          <GripVertical className="hidden sm:block w-4 h-4 text-slate-400 cursor-grab active:cursor-grabbing shrink-0" />
                          <span
                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg text-[10px] sm:text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                              isTopNine
                                ? "bg-blue-600 text-white shadow-2xs"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {originalIndex + 1}
                          </span>

                          <div
                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center shrink-0 ${
                              isCustom
                                ? "bg-indigo-50 text-indigo-600 border border-indigo-200/60"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <IconComp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </div>

                          <div className="min-w-0 flex items-center gap-1.5 flex-1">
                            <span className="text-xs font-bold text-slate-800 truncate" title={catName}>
                              {catName}
                            </span>
                            {isCustom ? (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                                Custom
                              </span>
                            ) : (
                              <span className="hidden sm:inline-block text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 shrink-0">
                                Standard
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Position Badge & Controls */}
                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                          {/* Set Default Selection */}
                          <button
                            type="button"
                            onClick={() => handleSetDefaultCategory(catName)}
                            className={`px-1.5 sm:px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                              defaultCategory === catName
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                            title={`Set "${catName}" as default selected category on page open`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span className="hidden sm:inline">{defaultCategory === catName ? "Default" : "Set Default"}</span>
                            <span className="sm:hidden inline">{defaultCategory === catName ? "Def" : "Set"}</span>
                          </button>

                          {/* Up Arrow */}
                          <button
                            type="button"
                            onClick={() => moveCategory(originalIndex, originalIndex - 1)}
                            disabled={originalIndex === 0}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>

                          {/* Down Arrow */}
                          <button
                            type="button"
                            onClick={() => moveCategory(originalIndex, originalIndex + 1)}
                            disabled={originalIndex === tempOrder.length - 1}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>

                          {/* If custom, allow deletion */}
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomCategory(catName)}
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                              title="Delete custom category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleResetOrder}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center sm:justify-start gap-1.5 transition-colors cursor-pointer py-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsArrangeModalOpen(false)}
                  className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer flex-1 sm:flex-none text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrder}
                  className="px-3.5 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-1 sm:flex-none"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">Save &amp; Apply Order</span>
                  <span className="sm:hidden inline">Apply Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM IN-APP DELETE CONFIRMATION MODAL */}
      {categoryToDelete && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setCategoryToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Delete Category?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-slate-800">"{categoryToDelete}"</span>? This category will be permanently removed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCustomCategory}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewExpenseVoucherPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NewExpenseVoucherForm />
    </Suspense>
  );
}
