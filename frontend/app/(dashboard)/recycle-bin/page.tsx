"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  Trash2,
  RotateCcw,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  RefreshCw,
  Users,
  ShoppingCart,
  Receipt,
  Tags,
  Briefcase,
  FileText
} from "lucide-react";

interface TrashItem {
  id: string;
  module: "parties" | "purchases" | "expenses" | "categories" | "workers" | "designs" | string;
  module_label: string;
  title: string;
  subtitle: string;
  record_no?: string | null;
  party_name?: string | null;
  category?: string | null;
  record_date?: string | null;
  deleted_at: string;
  deleted_by: string;
  days_remaining: number;
  amount?: number | null;
}

export default function RecycleBinPage() {
  const { language, t } = useLanguage();
  const isGujarati = language === "gu";
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
    if (!window.confirm(t(`Are you sure you want to restore "${item.title}" back to active records?`))) {
      return;
    }
    setActionLoadingId(item.id);
    try {
      await fetchApi(`/recycle-bin/${item.module}/${encodeURIComponent(item.id)}/restore`, {
        method: "POST"
      });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast(t(`Successfully restored "${item.title}"!`));
      // Broadcast change so pages update immediately
      window.dispatchEvent(new Event("app_data_update"));
      window.dispatchEvent(new CustomEvent("texaflow_purchases_updated"));
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
        t(`⚠️ WARNING: Permanently delete "${item.title}"?\n\nThis will remove it completely from the database and CANNOT be undone!`)
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
      showToast(t(`Permanently deleted "${item.title}".`));
      window.dispatchEvent(new Event("app_data_update"));
    } catch (err: any) {
      alert(`Error deleting record: ${err.message || "Unknown error"}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestoreAll = async () => {
    if (items.length === 0) return;
    if (!window.confirm(t(`Are you sure you want to restore all ${items.length} items from the Recycle Bin?`))) {
      return;
    }
    try {
      setRefreshing(true);
      await fetchApi("/recycle-bin/restore-all", { method: "POST" });
      setItems([]);
      showToast(t("All items successfully restored!"));
      window.dispatchEvent(new Event("app_data_update"));
      window.dispatchEvent(new CustomEvent("texaflow_purchases_updated"));
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
        t(`🚨 CRITICAL WARNING: You are about to permanently delete all ${items.length} items in the Recycle Bin!\n\nThis cannot be undone. Do you wish to proceed?`)
      )
    ) {
      return;
    }
    try {
      setRefreshing(true);
      await fetchApi("/recycle-bin/empty", { method: "DELETE" });
      setItems([]);
      showToast(t("Recycle Bin permanently emptied."));
      window.dispatchEvent(new Event("app_data_update"));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Helper to extract clean structured fields from any record
  const getRecordDetails = (item: TrashItem) => {
    let recordNo = item.record_no || "";
    let partyName = item.party_name || "";
    let category = item.category || "";
    let recordDate = item.record_date || "";

    if (!recordNo && item.title) {
      const m = item.title.match(/(?:Bill|Voucher)\s*#?([^\s-]+)/i);
      if (m) recordNo = m[1];
    }
    if (!partyName && item.title) {
      const parts = item.title.split(" - ");
      partyName = parts.length > 1 ? parts[1].trim() : item.title;
    }
    if (!recordDate && item.subtitle) {
      const m = item.subtitle.match(/Date:\s*([^\s|]+)/i);
      if (m) recordDate = m[1];
    }
    if (!category && item.subtitle) {
      const m = item.subtitle.match(/Category:\s*([^|]+)/i);
      if (m) category = m[1].trim();
    }

    return {
      recordNo: recordNo || "—",
      partyName: partyName || item.title || "—",
      category: category || item.module_label || "—",
      recordDate: recordDate || "—"
    };
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
        (item.record_no && item.record_no.toLowerCase().includes(q)) ||
        (item.party_name && item.party_name.toLowerCase().includes(q)) ||
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
      challans: items.filter((i) => i.module === "sales-challans").length,
      invoices: items.filter((i) => i.module === "sales-invoices").length,
      categories: items.filter((i) => i.module === "categories").length
    };
  }, [items]);

  const getModuleBadge = (module: string) => {
    switch (module) {
      case "parties":
        return {
          label: t("Party"),
          icon: Users,
          bg: "bg-blue-50 text-blue-700 border-blue-200"
        };
      case "purchases":
        return {
          label: t("Purchase"),
          icon: ShoppingCart,
          bg: "bg-purple-50 text-purple-700 border-purple-200"
        };
      case "expenses":
        return {
          label: t("Expense"),
          icon: Receipt,
          bg: "bg-amber-50 text-amber-700 border-amber-200"
        };
      case "sales-challans":
      case "sales_challans":
        return {
          label: isGujarati ? "સેલ્સ ચલણ" : "Sales Challan",
          icon: FileText,
          bg: "bg-cyan-50 text-cyan-700 border-cyan-200"
        };
      case "sales-invoices":
      case "sales_invoices":
        return {
          label: isGujarati ? "સેલ્સ બિલ" : "Sales Invoice",
          icon: Receipt,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200"
        };
      case "categories":
        return {
          label: t("Category"),
          icon: Tags,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200"
        };
      default:
        return {
          label: typeof module === "string" && module.length > 0 ? module.charAt(0).toUpperCase() + module.slice(1) : t("Record"),
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

  const filterTabs = [
    { id: "all", label: `${t("All")} (${counts.total})` },
    { id: "parties", label: `${t("Parties")} (${counts.parties})` },
    { id: "purchases", label: `${t("Purchases")} (${counts.purchases})` },
    { id: "expenses", label: `${t("Expenses")} (${counts.expenses})` },
    { id: "sales-challans", label: `${isGujarati ? "સેલ્સ ચલણ" : "Sales Challans"} (${counts.challans})` },
    { id: "sales-invoices", label: `${isGujarati ? "સેલ્સ બિલ" : "Sales Invoices"} (${counts.invoices})` },
    { id: "categories", label: `${t("Categories")} (${counts.categories})` }
  ];

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
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("Total in Trash")}</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{counts.total}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Trash2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("Deleted Parties")}</p>
            <p className="text-xl font-black text-blue-700 mt-0.5">{counts.parties}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("Deleted Purchases")}</p>
            <p className="text-xl font-black text-purple-700 mt-0.5">{counts.purchases}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("Expenses & Others")}</p>
            <p className="text-xl font-black text-amber-700 mt-0.5">{counts.expenses + counts.categories}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* TOOLBAR: SEARCH & MODULE FILTERS & BULK ACTIONS (NO UNWANTED GAP) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs px-4 py-3 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 text-xs">
        {/* Left: Search input */}
        <div className="relative w-full xl:w-72 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t("Search deleted records...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium shadow-2xs hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
        </div>

        {/* Right: Filters and Action Buttons tightly paired with NO awkward gap */}
        <div className="flex flex-wrap items-center gap-2 justify-start xl:justify-end">
          {/* Module filter pills */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto">
            {filterTabs.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModuleFilter(m.id)}
                className={`px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                  moduleFilter === m.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          {/* Actions */}
          <button
            type="button"
            onClick={loadTrash}
            disabled={refreshing}
            className="h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
            title={t("Refresh list")}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span>{t("Refresh")}</span>
          </button>

          {items.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleRestoreAll}
                className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t("Restore All")}</span>
              </button>
              <button
                type="button"
                onClick={handleEmptyBin}
                className="h-8 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t("Empty Bin")}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* DATA TABLE / LIST (CLEAN, STRUCTURED SAME-TO-SAME AS ORIGINAL RECORDS) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500">{t("Checking recycle bin vault...")}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
              <ShieldAlert className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">{t("Recycle Bin is Empty")}</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                {t("No deleted records found. If any party, purchase bill, or expense is deleted, it will be safely kept here for 30 days.")}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-600 font-extrabold border-b border-slate-200 tracking-wider uppercase text-[10px]">
                    <th className="py-3 px-3.5 w-12 text-center">{t("SR.")}</th>
                    <th className="py-3 px-3.5">{t("DATE")}</th>
                    <th className="py-3 px-3.5">{t("BILL NO / REF")}</th>
                    <th className="py-3 px-3.5">{t("SUPPLIER / PARTY")}</th>
                    <th className="py-3 px-3.5">{t("CATEGORY")}</th>
                    <th className="py-3 px-3.5">{t("MODULE")}</th>
                    <th className="py-3 px-3.5 text-right">{t("AMOUNT (₹)")}</th>
                    <th className="py-3 px-3.5">{t("DELETED AT")}</th>
                    <th className="py-3 px-3.5">{t("RETENTION")}</th>
                    <th className="py-3 px-3.5 text-right">{t("ACTION")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item, index) => {
                    const badge = getModuleBadge(item.module);
                    const Icon = badge.icon;
                    const isLoading = actionLoadingId === item.id;
                    const details = getRecordDetails(item);
                    const isUrgent = item.days_remaining <= 5;

                    return (
                      <tr
                        key={`${item.module}-${item.id}`}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* SR */}
                        <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                          {String(index + 1).padStart(2, "0")}
                        </td>

                        {/* DATE */}
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-500 whitespace-nowrap">
                          {details.recordDate}
                        </td>

                        {/* BILL NO / REF */}
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {details.recordNo}
                        </td>

                        {/* SUPPLIER / PARTY */}
                        <td className="py-3 px-3.5 font-bold text-slate-800">
                          <span className="group-hover:text-blue-600 transition-colors">
                            {details.partyName}
                          </span>
                        </td>

                        {/* CATEGORY */}
                        <td className="py-3 px-3.5 text-slate-600 font-medium">
                          {details.category}
                        </td>

                        {/* MODULE BADGE */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${badge.bg}`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* AMOUNT */}
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {item.amount !== null && item.amount !== undefined ? (
                            `₹${Number(item.amount).toLocaleString("en-IN")}`
                          ) : (
                            <span className="text-slate-300 font-normal">—</span>
                          )}
                        </td>

                        {/* DELETED AT */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-800 text-[11px]">
                            {formatDate(item.deleted_at)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {t("by")} {item.deleted_by || "Admin"}
                          </div>
                        </td>

                        {/* RETENTION (Clean typography matching DUE DAYS style) */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold ${
                              isUrgent
                                ? "text-rose-600 animate-pulse"
                                : item.days_remaining <= 10
                                ? "text-amber-600"
                                : "text-amber-600"
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
                            <span>{item.days_remaining}d left</span>
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRestore(item)}
                              disabled={isLoading}
                              title={t("Restore record")}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs border border-blue-200 active:scale-95"
                            >
                              <RotateCcw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                              <span>{t("Restore")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePermanentDelete(item)}
                              disabled={isLoading}
                              title={t("Permanently delete")}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredItems.map((item) => {
                const badge = getModuleBadge(item.module);
                const Icon = badge.icon;
                const isLoading = actionLoadingId === item.id;
                const details = getRecordDetails(item);
                const isUrgent = item.days_remaining <= 5;

                return (
                  <div
                    key={`${item.module}-${item.id}`}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-500">{details.recordDate}</span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          isUrgent ? "text-rose-600" : "text-amber-600"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.days_remaining}d left</span>
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">{details.partyName}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {t("No")}: <span className="font-mono font-bold text-slate-800">{details.recordNo}</span>
                          {" • "}
                          <span>{details.category}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${badge.bg}`}>
                        <Icon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    {item.amount !== null && item.amount !== undefined && (
                      <div className="text-right font-mono font-extrabold text-sm text-slate-900">
                        ₹{Number(item.amount).toLocaleString("en-IN")}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <div>
                        {t("Deleted")} {formatDate(item.deleted_at)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRestore(item)}
                          disabled={isLoading}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold text-xs flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{t("Restore")}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePermanentDelete(item)}
                          disabled={isLoading}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
