"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  Users,
  ShoppingCart,
  Receipt,
  Tags,
  Briefcase
} from "lucide-react";

interface TrashItem {
  id: string;
  module: "parties" | "purchases" | "expenses" | "categories" | "workers" | "designs" | string;
  module_label: string;
  title: string;
  subtitle: string;
  deleted_at: string;
  deleted_by: string;
  days_remaining: number;
  amount?: number | null;
}

export default function RecycleBinPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const loadTrash = async () => {
    try {
      setRefreshing(true);
      const data = await fetchApi<TrashItem[]>("/recycle-bin");
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to load recycle bin:", err);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const handleRestore = async (item: TrashItem) => {
    if (!window.confirm(`Are you sure you want to restore "${item.title}" back to active records?`)) {
      return;
    }
    setActionLoadingId(item.id);
    try {
      await fetchApi(`/recycle-bin/${item.module}/${encodeURIComponent(item.id)}/restore`, {
        method: "POST"
      });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast(`Successfully restored "${item.title}"!`);
      // Broadcast change so pages update
      window.dispatchEvent(new Event("app_data_update"));
      window.dispatchEvent(new CustomEvent("texaflow_material_categories_changed"));
    } catch (err: any) {
      alert(`Error restoring record: ${err.message || "Unknown error"}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    if (
      !window.confirm(
        `⚠️ WARNING: Permanently delete "${item.title}"?\n\nThis will remove it completely from the database and CANNOT be undone!`
      )
    ) {
      return;
    }
    setActionLoadingId(item.id);
    try {
      await fetchApi(`/recycle-bin/${item.module}/${encodeURIComponent(item.id)}/permanent`, {
        method: "DELETE"
      });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast(`Permanently deleted "${item.title}".`);
    } catch (err: any) {
      alert(`Error deleting record: ${err.message || "Unknown error"}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestoreAll = async () => {
    if (items.length === 0) return;
    if (!window.confirm(`Are you sure you want to restore all ${items.length} items from the Recycle Bin?`)) {
      return;
    }
    try {
      setRefreshing(true);
      await fetchApi("/recycle-bin/restore-all", { method: "POST" });
      setItems([]);
      showToast("All items successfully restored!");
      window.dispatchEvent(new Event("app_data_update"));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEmptyBin = async () => {
    if (items.length === 0) return;
    if (
      !window.confirm(
        `🚨 CRITICAL WARNING: You are about to permanently delete all ${items.length} items in the Recycle Bin!\n\nThis cannot be undone. Do you wish to proceed?`
      )
    ) {
      return;
    }
    try {
      setRefreshing(true);
      await fetchApi("/recycle-bin/empty", { method: "DELETE" });
      setItems([]);
      showToast("Recycle Bin permanently emptied.");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchModule = moduleFilter === "all" || item.module === moduleFilter;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      return matchModule && matchSearch;
    });
  }, [items, moduleFilter, search]);

  const counts = useMemo(() => {
    return {
      total: items.length,
      parties: items.filter((i) => i.module === "parties").length,
      purchases: items.filter((i) => i.module === "purchases").length,
      expenses: items.filter((i) => i.module === "expenses").length,
      categories: items.filter((i) => i.module === "categories").length
    };
  }, [items]);

  const getModuleBadge = (module: string) => {
    switch (module) {
      case "parties":
        return {
          label: "Party",
          icon: Users,
          bg: "bg-blue-50 text-blue-700 border-blue-200"
        };
      case "purchases":
        return {
          label: "Purchase",
          icon: ShoppingCart,
          bg: "bg-purple-50 text-purple-700 border-purple-200"
        };
      case "expenses":
        return {
          label: "Expense",
          icon: Receipt,
          bg: "bg-amber-50 text-amber-700 border-amber-200"
        };
      case "categories":
        return {
          label: "Category",
          icon: Tags,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200"
        };
      default:
        return {
          label: typeof module === "string" && module.length > 0 ? module.charAt(0).toUpperCase() + module.slice(1) : "Record",
          icon: Briefcase,
          bg: "bg-slate-50 text-slate-700 border-slate-200"
        };
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4 pb-16 text-slate-900 font-sans">
      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* STAT SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total in Trash</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{counts.total}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Trash2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Deleted Parties</p>
            <p className="text-xl font-black text-blue-700 mt-0.5">{counts.parties}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Deleted Purchases</p>
            <p className="text-xl font-black text-purple-700 mt-0.5">{counts.purchases}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expenses & Others</p>
            <p className="text-xl font-black text-amber-700 mt-0.5">{counts.expenses + counts.categories}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* TOOLBAR: SEARCH & MODULE FILTERS & BULK ACTIONS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Left: Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search deleted records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium shadow-2xs hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
        </div>

        {/* Center: Module filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: `All (${counts.total})` },
            { id: "parties", label: `Parties (${counts.parties})` },
            { id: "purchases", label: `Purchases (${counts.purchases})` },
            { id: "expenses", label: `Expenses (${counts.expenses})` },
            { id: "categories", label: `Categories (${counts.categories})` }
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModuleFilter(m.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                moduleFilter === m.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={loadTrash}
            disabled={refreshing}
            className="h-8 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          {items.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleRestoreAll}
                className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore All</span>
              </button>
              <button
                type="button"
                onClick={handleEmptyBin}
                className="h-8 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Bin</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* DATA TABLE / LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500">Checking data vault...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
              <ShieldAlert className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">Recycle Bin is Empty</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                No deleted records found. If any party, purchase bill, or expense is deleted, it will be safely kept here for 30 days.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 font-extrabold border-b border-slate-200 tracking-wider uppercase text-[10px]">
                  <th className="py-3 px-4 w-12 text-center">SR.</th>
                  <th className="py-3 px-4">RECORD TITLE & DETAILS</th>
                  <th className="py-3 px-4">MODULE</th>
                  <th className="py-3 px-4">DELETED DATE & BY</th>
                  <th className="py-3 px-4">RETENTION REMAINING</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, index) => {
                  const badge = getModuleBadge(item.module);
                  const Icon = badge.icon;
                  const isLoading = actionLoadingId === item.id;
                  const isUrgent = item.days_remaining <= 5;

                  return (
                    <tr
                      key={`${item.module}-${item.id}`}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                          <span>{item.subtitle}</span>
                          {item.amount !== null && item.amount !== undefined && (
                            <span className="font-extrabold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                              ₹{Number(item.amount).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${badge.bg}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-[11px]">
                          {formatDate(item.deleted_at)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          by {item.deleted_by || "Admin"}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${
                            isUrgent
                              ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                              : item.days_remaining <= 10
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{item.days_remaining} Days Left</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRestore(item)}
                            disabled={isLoading}
                            title="Restore this record back to active records"
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs border border-blue-200 active:scale-95"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                            <span>Restore</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(item)}
                            disabled={isLoading}
                            title="Permanently Delete (Cannot be undone)"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
