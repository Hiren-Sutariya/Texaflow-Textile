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
import { getTenantItem, setTenantItem } from "@/lib/tenantStorage";
import { fetchApi, getCachedApi, setCachedApi, invalidateApiCache } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const DEFAULT_EXPENSE_CATEGORIES = [
  "Karigar Salary",
  "Electricity & Power",
  "Worker Advance / Upad",
  "Machine Maintenance & Repairs",
  "Packaging Materials",
  "Dhaga & Consumables",
  "Logistics & Courier"
];

type ModuleType = "all" | "material" | "expense" | "design";

interface CategoryRecord {
  id: string;
  name: string;
  module: "material" | "expense" | "design";
  moduleLabel: string;
  status: "Active";
  srNo: number;
}

interface CustomSelectOption {
  value: string;
  label: string;
}

const getModuleLabel = (mod: string) => {
  if (mod === "material") return "Material & Purchase";
  if (mod === "expense") return "Expenses";
  if (mod === "design") return "Design Library";
  return mod;
};

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
        <div className="absolute z-50 left-0 top-full mt-1 w-full min-w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1.5 space-y-1">
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

  // Helper to sync cross-page tenant storage for purchases and expenses
  const syncToTenantStorage = (items: CategoryRecord[]) => {
    setTenantItem("texaflow_all_categories_unified", items);
    setTenantItem(
      "texaflow_material_categories",
      items.filter((c) => c.module === "material").map((c) => c.name)
    );
    setTenantItem(
      "texaflow_expense_categories_order",
      items.filter((c) => c.module === "expense").map((c) => c.name)
    );
    setTenantItem(
      "texaflow_design_categories",
      items.filter((c) => c.module === "design").map((c) => c.name)
    );
    window.dispatchEvent(new CustomEvent("texaflow_material_categories_changed"));
  };

  // Synchronously load initial cached categories for 0ms transition
  const getInitialCategories = (): { items: CategoryRecord[]; hasCache: boolean } => {
    if (typeof window === "undefined") {
      return { items: [], hasCache: false };
    }
    try {
      const liveCached = getCachedApi<Array<{ id: string; name: string; module: string; is_system?: boolean }>>("/categories");
      if (Array.isArray(liveCached) && liveCached.length > 0) {
        const seen = new Set<string>();
        const items: CategoryRecord[] = [];
        const modCounters: { [key: string]: number } = { expense: 1, material: 1, design: 1 };
        for (const c of liveCached) {
          const trimmed = c.name?.trim();
          if (!trimmed) continue;
          const mod = (c.module as "material" | "expense" | "design") || "material";
          const key = `${mod}_${trimmed.toLowerCase()}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const sr = modCounters[mod] || 1;
          modCounters[mod] = sr + 1;

          items.push({
            id: c.id || `cat-${mod.slice(0, 3)}-${trimmed}`,
            name: trimmed,
            module: mod,
            moduleLabel: getModuleLabel(mod),
            status: "Active",
            srNo: sr,
          });
        }
        return { items, hasCache: true };
      }

      const stored = getTenantItem<CategoryRecord[]>("texaflow_all_categories_unified");
      if (Array.isArray(stored) && stored.length > 0) {
        return { items: stored, hasCache: true };
      }
    } catch {}
    return { items: [], hasCache: false };
  };

  const initialData = useRef(getInitialCategories());
  const [isLoading, setIsLoading] = useState<boolean>(() => !initialData.current.hasCache);
  const [categories, setCategories] = useState<CategoryRecord[]>(() => initialData.current.items);

  // Multi-select state for bulk deletion
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Add category modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addModule, setAddModule] = useState<"material" | "expense" | "design">("material");

  // Edit category state
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; module: "material" | "expense" | "design" } | null>(null);
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

  // Load strictly from backend Supabase Database in chronological creation order
  const loadCategories = async () => {
    try {
      const live = await fetchApi<Array<{ id: string; name: string; module: string; is_system?: boolean }>>("/categories").catch(() => null);
      if (Array.isArray(live)) {
        setCachedApi("/categories", live);
        
        // Supabase returns items ordered strictly by created_at.asc(), id.asc()
        // Each module starts counting from 1 (e.g. Expenses: 01 to 07, Material: 01...)
        const seen = new Set<string>();
        const unified: CategoryRecord[] = [];
        const modCounters: { [key: string]: number } = { expense: 1, material: 1, design: 1 };

        for (const c of live) {
          const trimmed = c.name?.trim();
          if (!trimmed) continue;
          const mod = (c.module as "material" | "expense" | "design") || "material";
          const key = `${mod}_${trimmed.toLowerCase()}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const sr = modCounters[mod] || 1;
          modCounters[mod] = sr + 1;

          unified.push({
            id: c.id || `cat-${mod.slice(0, 3)}-${trimmed}`,
            name: trimmed,
            module: mod,
            moduleLabel: getModuleLabel(mod),
            status: "Active",
            srNo: sr,
          });
        }

        setCategories(unified);
        syncToTenantStorage(unified);
        return;
      }

      // Offline / network fallback
      const stored = getTenantItem<CategoryRecord[]>("texaflow_all_categories_unified");
      if (Array.isArray(stored) && stored.length > 0) {
        setCategories(stored);
        return;
      }

      // Fallback defaults if table is empty
      const defaults: CategoryRecord[] = DEFAULT_EXPENSE_CATEGORIES.map((name, idx) => ({
        id: `cat-exp-${idx + 1}`,
        name,
        module: "expense" as const,
        moduleLabel: "Expenses",
        status: "Active" as const,
        srNo: idx + 1,
      }));
      setCategories(defaults);
      syncToTenantStorage(defaults);
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

  // Filtered by search and module (preserves module-specific assigned srNo)
  const filteredRecords = useMemo(() => {
    const list = categories.filter((rec) => {
      const matchSearch = !search || rec.name.toLowerCase().includes(search.toLowerCase().trim());
      const matchModule = moduleFilter === "all" || rec.module === moduleFilter;
      return matchSearch && matchModule;
    });

    const moduleOrder: { [key: string]: number } = { expense: 1, material: 2, design: 3 };
    return [...list].sort((a, b) => {
      if (moduleFilter === "all") {
        const orderA = moduleOrder[a.module] || 99;
        const orderB = moduleOrder[b.module] || 99;
        if (orderA !== orderB) return orderA - orderB;
      }
      return a.srNo - b.srNo;
    });
  }, [categories, search, moduleFilter]);

  const materialCount = useMemo(() => categories.filter((c) => c.module === "material").length, [categories]);
  const expenseCount = useMemo(() => categories.filter((c) => c.module === "expense").length, [categories]);
  const designCount = useMemo(() => categories.filter((c) => c.module === "design").length, [categories]);

  // Add handler - Appends new category with next sequential SR NO in its module (e.g. #08 in Expenses, #02 in Material)
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = addName.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.module === addModule && c.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Category "${trimmed}" already exists in this module!`);
      return;
    }

    // Next sequential SR NO for THIS module (e.g. if 7 expenses exist, next expense is 8; if 1 material exists, next is 2)
    const sameModuleItems = categories.filter((c) => c.module === addModule);
    const nextSrNo = sameModuleItems.length > 0 ? Math.max(...sameModuleItems.map((c) => c.srNo)) + 1 : 1;
    const tempId = `cat-${addModule.slice(0, 3)}-${Date.now()}`;
    
    const newRecord: CategoryRecord = {
      id: tempId,
      name: trimmed,
      module: addModule,
      moduleLabel: getModuleLabel(addModule),
      status: "Active",
      srNo: nextSrNo,
    };

    const updated = [...categories, newRecord];
    setCategories(updated);
    syncToTenantStorage(updated);
    setAddName("");
    setIsAddModalOpen(false);
    showToast(`Category "${trimmed}" added as #${String(nextSrNo).padStart(2, "0")} in ${getModuleLabel(addModule)}!`);

    try {
      const res = await fetchApi<{ id: string; name: string; module: string }>("/categories", {
        method: "POST",
        body: JSON.stringify({ name: trimmed, module: addModule })
      });
      if (res && res.id) {
        setCategories((prev) =>
          prev.map((c) => (c.id === tempId ? { ...c, id: res.id } : c))
        );
      }
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

    const toDeleteSet = new Set(selectedCategoryIds);
    const updated = categories.filter((c) => !toDeleteSet.has(c.id));
    setCategories(updated);
    syncToTenantStorage(updated);

    selectedCategoryIds.forEach((id) => {
      fetchApi(`/categories/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    });

    setSelectedCategoryIds([]);
    showToast(`Deleted ${count} ${count === 1 ? "category" : "categories"} successfully!`);
  };

  // Delete handler
  const handleDelete = (rec: CategoryRecord) => {
    if (!window.confirm(`Are you sure you want to remove "${rec.name}"?`)) {
      return;
    }
    const updated = categories.filter((c) => c.id !== rec.id);
    setCategories(updated);
    syncToTenantStorage(updated);
    fetchApi(`/categories/${encodeURIComponent(rec.id)}`, { method: "DELETE" }).catch(() => {});
    setSelectedCategoryIds((prev) => prev.filter((id) => id !== rec.id));
    showToast(`Removed "${rec.name}".`);
  };

  // Edit handler - In-place rename preserving exact SR NO, position, and ID
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === editingItem.name) {
      setEditingItem(null);
      return;
    }

    if (categories.some((c) => c.module === editingItem.module && c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== editingItem.id)) {
      showToast(`Category "${trimmed}" already exists in this module!`);
      return;
    }

    const oldId = editingItem.id;
    const oldName = editingItem.name;
    const mod = editingItem.module;

    // 1. Instant in-place UI update (exact position and SR NO remain completely untouched)
    const updated = categories.map((c) => {
      if (c.id === oldId || (c.name === oldName && c.module === mod)) {
        return { ...c, name: trimmed };
      }
      return c;
    });
    setCategories(updated);
    syncToTenantStorage(updated);

    // 2. Synchronously update live API cache
    const currentCached = getCachedApi<Array<{ id: string; name: string; module: string; is_system?: boolean }>>("/categories");
    if (Array.isArray(currentCached)) {
      const updatedCache = currentCached.map((item) => {
        if (item.id === oldId || (item.name === oldName && item.module === mod)) {
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
    const defaults: CategoryRecord[] = DEFAULT_EXPENSE_CATEGORIES.map((name, idx) => ({
      id: `cat-exp-${idx + 1}`,
      name,
      module: "expense" as const,
      moduleLabel: "Expenses",
      status: "Active" as const,
      srNo: idx + 1,
    }));
    setCategories(defaults);
    syncToTenantStorage(defaults);
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

      {/* SEARCH & ACTIONS TOOLBAR CARD */}
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
                { value: "all", label: isLoading ? "All Categories" : `All Categories (${categories.length})` },
                { value: "material", label: isLoading ? "Material & Purchase" : `Material & Purchase (${materialCount})` },
                { value: "expense", label: isLoading ? "Expenses" : `Expenses (${expenseCount})` },
                { value: "design", label: isLoading ? "Design Library" : `Design Library (${designCount})` }
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

      {/* TABLE CARD CONTAINER - EXCEL-STYLE BOX GRID */}
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
                filteredRecords.map((rec) => {
                  const isEditing = editingItem?.id === rec.id || (editingItem?.name === rec.name && editingItem?.module === rec.module);
                  const isRowSelected = selectedCategoryIds.includes(rec.id);

                  return (
                    <tr
                      key={rec.id}
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

                      {/* SR NO. - Permanent assigned sequence number */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400 text-xs border-r border-slate-200/70">
                        {String(rec.srNo).padStart(2, "0")}
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
