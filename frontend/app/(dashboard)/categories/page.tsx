"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ChevronDown, 
  MoreHorizontal, 
  RefreshCw, 
  RotateCcw,
  CheckCircle2
} from "lucide-react";
import { getTenantItem, setTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { fetchApi, getCachedApi, setCachedApi, invalidateApiCache } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const DEFAULT_MATERIAL_CATEGORIES: string[] = [];

const DEFAULT_EXPENSE_CATEGORIES = [
  "Karigar Salary",
  "Electricity & Power",
  "Worker Advance / Upad",
  "Machine Maintenance & Repairs",
  "Packaging Materials",
  "Dhaga & Consumables",
  "Logistics & Courier"
];

const DEFAULT_DESIGN_CATEGORIES: string[] = [];

type ModuleType = "all" | "material" | "expense" | "design";

interface CategoryRecord {
  id: string;
  name: string;
  module: "material" | "expense" | "design";
  moduleLabel: string;
  status: "Active";
}

interface CustomSelectOption {
  value: string;
  label: string;
}

function CustomSelect({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
}) {
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

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative inline-block w-full text-xs select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3.5 bg-white border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""
        }`}
      >
        <span
          suppressHydrationWarning
          className={`truncate ${selectedOption ? "font-bold text-slate-900" : "font-medium text-slate-400"}`}
        >
          {selectedOption ? selectedOption.label : "Select module"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-2 w-full min-w-[200px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1.5 space-y-1">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-50 text-blue-950 font-extrabold border border-blue-500/30"
                    : "text-slate-800 hover:bg-slate-50 font-medium"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-700 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<ModuleType>("all");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Load initial cached categories synchronously if available for 0ms transition
  const getInitialCategories = () => {
    if (typeof window === "undefined") {
      return { mat: [], exp: [], des: [], hasCache: false };
    }
    try {
      const liveCached = getCachedApi<Array<{ name: string; module: string }>>("/categories");
      if (Array.isArray(liveCached) && liveCached.length > 0) {
        return {
          mat: Array.from(new Set(liveCached.filter((c) => c.module === "material").map((c) => c.name.trim()).filter(Boolean))),
          exp: Array.from(new Set(liveCached.filter((c) => c.module === "expense").map((c) => c.name.trim()).filter(Boolean))),
          des: Array.from(new Set(liveCached.filter((c) => c.module === "design").map((c) => c.name.trim()).filter(Boolean))),
          hasCache: true
        };
      }
    } catch {}
    return { mat: [], exp: [], des: [], hasCache: false };
  };

  const initialData = useRef(getInitialCategories());
  const [isLoading, setIsLoading] = useState<boolean>(() => !initialData.current.hasCache);
  const [materialCategories, setMaterialCategories] = useState<string[]>(() => initialData.current.mat);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => initialData.current.exp);
  const [designCategories, setDesignCategories] = useState<string[]>(() => initialData.current.des);

  // Multi-select state for bulk deletion
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Add category modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addModule, setAddModule] = useState<"material" | "expense" | "design">("material");

  // Edit category state
  const [editingItem, setEditingItem] = useState<{ id?: string; name: string; module: "material" | "expense" | "design" } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Three dots action menu
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load strictly from backend Supabase Database with fallback to tenantStorage
  const loadCategories = async () => {
    try {
      const live = await fetchApi<Array<{ id: string; name: string; module: string; is_system?: boolean }>>("/categories").catch(() => null);
      if (Array.isArray(live)) {
        setCachedApi("/categories", live);
        const mat = Array.from(new Set(live.filter((c) => c.module === "material").map((c) => c.name.trim()).filter(Boolean)));
        const exp = Array.from(new Set(live.filter((c) => c.module === "expense").map((c) => c.name.trim()).filter(Boolean)));
        const des = Array.from(new Set(live.filter((c) => c.module === "design").map((c) => c.name.trim()).filter(Boolean)));

        const finalMat = mat;
        const finalExp = exp.length > 0 ? exp : DEFAULT_EXPENSE_CATEGORIES;
        const finalDes = des;

        setMaterialCategories(finalMat);
        setExpenseCategories(finalExp);
        setDesignCategories(finalDes);

        setTenantItem("texaflow_material_categories", finalMat);
        setTenantItem("texaflow_expense_categories_order", finalExp);
        setTenantItem("texaflow_design_categories", finalDes);
        return;
      }

      // Offline / network fallback
      const mat = getTenantItem<string[]>("texaflow_material_categories");
      if (Array.isArray(mat)) setMaterialCategories(Array.from(new Set(mat.map((s) => typeof s === "string" ? s.trim() : "").filter(Boolean))));
      else setMaterialCategories(DEFAULT_MATERIAL_CATEGORIES);

      const exp = getTenantItem<string[]>("texaflow_expense_categories_order");
      if (Array.isArray(exp)) setExpenseCategories(Array.from(new Set(exp.map((s) => typeof s === "string" ? s.trim() : "").filter(Boolean))));
      else setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);

      const des = getTenantItem<string[]>("texaflow_design_categories");
      if (Array.isArray(des)) setDesignCategories(Array.from(new Set(des.map((s) => typeof s === "string" ? s.trim() : "").filter(Boolean))));
      else setDesignCategories(DEFAULT_DESIGN_CATEGORIES);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    const handleStorage = () => loadCategories();
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Combine into unified table records with guaranteed uniqueness
  const allRecords: CategoryRecord[] = useMemo(() => {
    const records: CategoryRecord[] = [];
    const seen = new Set<string>();

    const addRecord = (cat: string, mod: "material" | "expense" | "design", modLabel: string, prefix: string) => {
      const trimmed = typeof cat === "string" ? cat.trim() : "";
      if (!trimmed) return;
      const key = `${mod}_${trimmed.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);

      records.push({
        id: `${prefix}-${trimmed}`,
        name: trimmed,
        module: mod,
        moduleLabel: modLabel,
        status: "Active"
      });
    };

    materialCategories.forEach((cat) => addRecord(cat, "material", "Material & Purchase", "mat"));
    expenseCategories.forEach((cat) => addRecord(cat, "expense", "Expenses", "exp"));
    designCategories.forEach((cat) => addRecord(cat, "design", "Design Library", "des"));

    return records;
  }, [materialCategories, expenseCategories, designCategories]);

  // Filtered by search and module
  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      const matchSearch = !search || rec.name.toLowerCase().includes(search.toLowerCase().trim());
      const matchModule = moduleFilter === "all" || rec.module === moduleFilter;
      return matchSearch && matchModule;
    });
  }, [allRecords, search, moduleFilter]);

  // Save to storage
  const saveCategoryList = (module: "material" | "expense" | "design", updated: string[]) => {
    invalidateApiCache("/categories");
    if (module === "material") {
      setMaterialCategories(updated);
      setTenantItem("texaflow_material_categories", updated);
    } else if (module === "expense") {
      setExpenseCategories(updated);
      setTenantItem("texaflow_expense_categories_order", updated);
    } else {
      setDesignCategories(updated);
      setTenantItem("texaflow_design_categories", updated);
    }
    window.dispatchEvent(new CustomEvent("texaflow_material_categories_changed"));
  };

  // Add handler
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = addName.trim();
    if (!trimmed) return;

    let targetList: string[] = [];
    if (addModule === "material") targetList = materialCategories;
    else if (addModule === "expense") targetList = expenseCategories;
    else targetList = designCategories;

    if (targetList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Category "${trimmed}" already exists in this module!`);
      return;
    }

    // Append to end so it appears sequentially at the next serial number (e.g., #07)
    const updated = [...targetList, trimmed];
    saveCategoryList(addModule, updated);
    setAddName("");
    setIsAddModalOpen(false);
    showToast(`Category "${trimmed}" added successfully!`);

    try {
      await fetchApi("/categories", {
        method: "POST",
        body: JSON.stringify({ name: trimmed, module: addModule })
      });
      invalidateApiCache("/categories");
    } catch (err) {
      console.error("Category create sync error:", err);
    }
  };

  // Multi-select handlers
  const handleToggleRow = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const allFilteredIds = filteredRecords.map((r) => r.id);
    const isAllSelected =
      allFilteredIds.length > 0 &&
      allFilteredIds.every((id) => selectedCategoryIds.includes(id));

    if (isAllSelected) {
      setSelectedCategoryIds((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id))
      );
    } else {
      setSelectedCategoryIds((prev) =>
        Array.from(new Set([...prev, ...allFilteredIds]))
      );
    }
  };

  const handleBulkDelete = () => {
    if (selectedCategoryIds.length === 0) return;
    const count = selectedCategoryIds.length;
    if (
      !window.confirm(
        `Are you sure you want to delete ${count} selected ${count === 1 ? "category" : "categories"}?`
      )
    ) {
      return;
    }

    const selectedRecords = allRecords.filter((r) => selectedCategoryIds.includes(r.id));
    const matToDelete = new Set(selectedRecords.filter((r) => r.module === "material").map((r) => r.name));
    const expToDelete = new Set(selectedRecords.filter((r) => r.module === "expense").map((r) => r.name));
    const desToDelete = new Set(selectedRecords.filter((r) => r.module === "design").map((r) => r.name));

    if (matToDelete.size > 0) {
      const updatedMat = materialCategories.filter((c) => !matToDelete.has(c));
      saveCategoryList("material", updatedMat);
    }
    if (expToDelete.size > 0) {
      const updatedExp = expenseCategories.filter((c) => !expToDelete.has(c));
      saveCategoryList("expense", updatedExp);
    }
    if (desToDelete.size > 0) {
      const updatedDes = designCategories.filter((c) => !desToDelete.has(c));
      saveCategoryList("design", updatedDes);
    }

    selectedRecords.forEach((r) => {
      fetchApi(`/categories/${encodeURIComponent(r.name)}`, { method: "DELETE" }).catch(() => {});
    });

    setSelectedCategoryIds([]);
    showToast(`Deleted ${count} ${count === 1 ? "category" : "categories"} successfully!`);
  };

  // Delete handler
  const handleDelete = (rec: CategoryRecord) => {
    if (!window.confirm(`Are you sure you want to remove "${rec.name}"?`)) {
      return;
    }
    let targetList: string[] = [];
    if (rec.module === "material") targetList = materialCategories;
    else if (rec.module === "expense") targetList = expenseCategories;
    else targetList = designCategories;

    const updated = targetList.filter((c) => c !== rec.name);
    saveCategoryList(rec.module, updated);
    fetchApi(`/categories/${encodeURIComponent(rec.name)}`, { method: "DELETE" }).catch(() => {});
    setSelectedCategoryIds((prev) => prev.filter((id) => id !== rec.id));
    showToast(`Removed "${rec.name}".`);
  };

  // Edit handler
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === editingItem.name) {
      setEditingItem(null);
      return;
    }

    let targetList: string[] = [];
    if (editingItem.module === "material") targetList = materialCategories;
    else if (editingItem.module === "expense") targetList = expenseCategories;
    else targetList = designCategories;

    if (targetList.some((c) => c.toLowerCase() === trimmed.toLowerCase() && c !== editingItem.name)) {
      showToast(`Category "${trimmed}" already exists!`);
      return;
    }

    const oldName = editingItem.name;
    const oldId = editingItem.id;
    const mod = editingItem.module;

    // 1. Instant in-place UI update (exact same index, position and serial number remain unchanged)
    const updated = targetList.map((c) => (c === oldName ? trimmed : c));
    saveCategoryList(mod, updated);

    // 2. Synchronously update live API cache so table never flips or reverts on reload
    const currentCached = getCachedApi<Array<{ id: string; name: string; module: string; is_system?: boolean }>>("/categories");
    if (Array.isArray(currentCached)) {
      const updatedCache = currentCached.map((item) => {
        if ((oldId && item.id === oldId) || (item.name === oldName && item.module === mod)) {
          return { ...item, name: trimmed };
        }
        return item;
      });
      setCachedApi("/categories", updatedCache);
    }

    setEditingItem(null);
    showToast(`Renamed to "${trimmed}"`);

    // 3. Persist update in-place in Supabase via PUT (position, ID and created_at stay untouched)
    try {
      const targetParam = oldId || encodeURIComponent(oldName);
      await fetchApi(`/categories/${targetParam}`, {
        method: "PUT",
        body: JSON.stringify({ name: trimmed, module: mod })
      });
    } catch (err) {
      console.error("Category update sync error:", err);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCategories();
    setTimeout(() => {
      setIsRefreshing(false);
      setIsActionMenuOpen(false);
      showToast("List refreshed.");
    }, 500);
  };

  const handleResetDefaults = () => {
    if (!window.confirm("Reset all categories to system defaults?")) return;
    setMaterialCategories(DEFAULT_MATERIAL_CATEGORIES);
    setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
    setDesignCategories(DEFAULT_DESIGN_CATEGORIES);
    setTenantItem("texaflow_material_categories", DEFAULT_MATERIAL_CATEGORIES);
    setTenantItem("texaflow_expense_categories_order", DEFAULT_EXPENSE_CATEGORIES);
    setTenantItem("texaflow_design_categories", DEFAULT_DESIGN_CATEGORIES);
    window.dispatchEvent(new CustomEvent("texaflow_material_categories_changed"));
    setSelectedCategoryIds([]);
    setIsActionMenuOpen(false);
    showToast("Reset to default categories.");
  };

  const isAllFilteredSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedCategoryIds.includes(r.id));

  if (!hasMounted) return null;

  return (
    <div className="space-y-4 pb-12">
      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BULK ACTION SELECTION BANNER */}
      {selectedCategoryIds.length > 0 && (
        <div className="bg-blue-50/90 border border-blue-200 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1 duration-150 shadow-2xs">
          <div className="flex items-center gap-2 text-blue-900 font-extrabold">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>
              {selectedCategoryIds.length} {selectedCategoryIds.length === 1 ? "category" : "categories"} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategoryIds([])}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Deselect All
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedCategoryIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* SEARCH & ACTIONS TOOLBAR CARD (MATCHING OTHER MODULES) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Left Side: Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Category Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium shadow-2xs hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
        </div>

        {/* Right Side: Module Filter, Add Category & Action Menu */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Module Filter Select */}
          <div className="w-full sm:w-52">
            <CustomSelect
              value={moduleFilter}
              onChange={(val) => setModuleFilter(val as ModuleType)}
              options={[
                { value: "all", label: isLoading ? "All Categories" : `All Categories (${allRecords.length})` },
                { value: "material", label: isLoading ? "Material & Purchase" : `Material & Purchase (${materialCategories.length})` },
                { value: "expense", label: isLoading ? "Expenses" : `Expenses (${expenseCategories.length})` },
                { value: "design", label: isLoading ? "Design Library" : `Design Library (${designCategories.length})` }
              ]}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Bulk Delete Button in Toolbar when rows selected */}
            {selectedCategoryIds.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="h-9 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
                title="Delete Selected Categories"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete ({selectedCategoryIds.length})</span>
              </button>
            )}

            {/* Add Category Button */}
            <button
              type="button"
              onClick={() => {
                setAddName("");
                setAddModule(moduleFilter === "all" ? "material" : moduleFilter);
                setIsAddModalOpen(true);
              }}
              className="flex-1 sm:flex-none h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Category</span>
            </button>

            {/* Action Menu (Three Dots Button) */}
            <div ref={actionMenuRef} className="relative inline-block shrink-0">
              <button
                type="button"
                onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                  isActionMenuOpen
                    ? "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20"
                    : "bg-white hover:bg-slate-100 border-slate-300 text-slate-600"
                }`}
                title="More Actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isActionMenuOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 w-48 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span>Refresh List</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Defaults</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TABLE CARD CONTAINER (MATCHING OTHER MODULES) - EXCEL-STYLE BOX GRID */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-[10px] font-extrabold tracking-wider text-slate-600 uppercase whitespace-nowrap">
                {/* SELECT ALL CHECKBOX */}
                <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200/80">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Select All"
                  />
                </th>
                <th className="py-2.5 px-4 w-16 text-center border-r border-slate-200/80">SR NO.</th>
                <th className="py-2.5 px-4 border-r border-slate-200/80">CATEGORY NAME</th>
                <th className="py-2.5 px-4 border-r border-slate-200/80">MODULE TYPE</th>
                <th className="py-2.5 px-4 text-center border-r border-slate-200/80">STATUS</th>
                <th className="py-2.5 px-4 text-center w-28">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800 text-xs bg-white">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-3 px-3 text-center border-r border-slate-200/70">
                      <div className="w-4 h-4 bg-slate-200/70 rounded mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center border-r border-slate-200/70">
                      <div className="w-5 h-3 bg-slate-200/70 rounded mx-auto" />
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200/70">
                      <div
                        className="h-3.5 bg-slate-200/70 rounded"
                        style={{ width: `${50 + (i % 4) * 15}%`, maxWidth: "200px" }}
                      />
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200/70">
                      <div className="w-24 h-3 bg-slate-200/70 rounded" />
                    </td>
                    <td className="py-3 px-4 text-center border-r border-slate-200/70">
                      <div className="w-14 h-3 bg-slate-200/70 rounded mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="w-12 h-3 bg-slate-200/70 rounded mx-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium text-xs">
                    No category records found matching your filters. Click &quot;+ Add Category&quot; to add a record.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, index) => {
                  const isEditing = editingItem?.name === rec.name && editingItem?.module === rec.module;
                  const isRowSelected = selectedCategoryIds.includes(rec.id);

                  return (
                    <tr
                      key={`${rec.id}_${index}`}
                      className={`transition-colors ${
                        isRowSelected ? "bg-blue-50/60" : "hover:bg-blue-50/40"
                      }`}
                    >
                      {/* ROW CHECKBOX */}
                      <td className="py-3 px-3 text-center border-r border-slate-200/70" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => handleToggleRow(rec.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* SR NO. */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400 text-xs border-r border-slate-200/70">
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      {/* CATEGORY NAME */}
                      <td className="py-3 px-4 border-r border-slate-200/70">
                        {isEditing ? (
                          <div className="flex items-center gap-2 max-w-sm">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") setEditingItem(null);
                              }}
                              autoFocus
                              className="w-full h-8 px-2.5 bg-white border border-blue-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none ring-2 ring-blue-500/20"
                            />
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="h-8 px-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingItem(null)}
                              className="h-8 px-2 text-slate-500 hover:text-slate-700 rounded-lg text-xs font-bold cursor-pointer shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {rec.name}
                          </span>
                        )}
                      </td>

                      {/* MODULE TYPE */}
                      <td className="py-3 px-4 whitespace-nowrap border-r border-slate-200/70">
                        <span className={`text-xs font-bold flex items-center gap-1.5 ${
                          rec.module === "material"
                            ? "text-blue-700"
                            : rec.module === "expense"
                            ? "text-amber-700"
                            : "text-purple-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            rec.module === "material"
                              ? "bg-blue-500"
                              : rec.module === "expense"
                              ? "bg-amber-500"
                              : "bg-purple-500"
                          }`} />
                          <span>{rec.moduleLabel}</span>
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="py-3 px-4 text-center whitespace-nowrap border-r border-slate-200/70">
                        <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{rec.status}</span>
                        </span>
                      </td>

                      {/* ACTION */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem({ id: rec.id, name: rec.name, module: rec.module });
                              setEditValue(rec.name);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Category Name"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(rec)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* ADD CATEGORY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">{t("Add New Category")}</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">{t("Module")}</label>
                <CustomSelect
                  value={addModule}
                  onChange={(val) => setAddModule(val as any)}
                  options={[
                    { value: "material", label: t("Material & Purchase") },
                    { value: "expense", label: t("Company Expenses") },
                    { value: "design", label: t("Design Library") }
                  ]}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">{t("Category Name")}*</label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Cotton Laces, Zari 120D, Machine Oil..."
                  autoFocus
                  required
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!addName.trim()}
                  className="h-9 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
