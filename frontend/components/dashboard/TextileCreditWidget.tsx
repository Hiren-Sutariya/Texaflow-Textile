"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Receipt, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  Layers,
  ChevronRight
} from "lucide-react";
import { fetchApi, getCachedApi } from "@/lib/api";
import { getTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { useLanguage } from "@/context/LanguageContext";
import { getDueStatus } from "@/lib/creditTerms";

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
  payment_terms?: string;
  credit_days?: number;
  due_date?: string;
  linked_order?: string;
  paid_amount?: number;
  balance_amount?: number;
}

export default function TextileCreditWidget() {
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const currentCid = getStoredCompanyId() || "comp-001";

    try {
      const cached = getCachedApi<ExpenseItem[]>("/expenses") || 
        getTenantItem<ExpenseItem[]>("texaflow_expenses", "om_sai_expenses");
      if (cached && Array.isArray(cached) && cached.length > 0) {
        const scoped = cached.filter((item: any) => (item.company_id || currentCid) === currentCid);
        if (scoped.length > 0) {
          setExpenses(scoped);
        }
      }
    } catch {}

    async function loadData() {
      try {
        const live = await fetchApi<ExpenseItem[]>("/expenses");
        if (isMounted && Array.isArray(live) && live.length > 0) {
          const scoped = live.filter((item: any) => (item.company_id || currentCid) === currentCid);
          setExpenses(scoped);
        }
      } catch (err) {
        console.warn("Could not fetch live expenses for widget:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    const refresh = () => loadData();
    window.addEventListener("app_data_update", refresh);
    window.addEventListener("app_refresh_content", refresh);

    return () => {
      isMounted = false;
      window.removeEventListener("app_data_update", refresh);
      window.removeEventListener("app_refresh_content", refresh);
    };
  }, []);

  // Filter pending / credit expenses
  const pendingBills = expenses.filter(
    (exp) => exp.payment_status === "Pending" || exp.payment_status === "Unpaid"
  );

  const totalPendingAmount = pendingBills.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Analyze due statuses
  let overdueCount = 0;
  let overdueAmount = 0;
  let dueWithin7DaysCount = 0;

  const enrichedPending = pendingBills.map((bill) => {
    const dueInfo = bill.due_date ? getDueStatus(bill.due_date, false) : null;
    if (dueInfo) {
      if (dueInfo.status === "Overdue") {
        overdueCount += 1;
        overdueAmount += bill.amount || 0;
      } else if (dueInfo.daysDiff >= 0 && dueInfo.daysDiff <= 7) {
        dueWithin7DaysCount += 1;
      }
    }
    return { ...bill, dueInfo };
  });

  // Sort urgent first: Overdue first, then closest due date
  enrichedPending.sort((a, b) => {
    if (a.dueInfo?.status === "Overdue" && b.dueInfo?.status !== "Overdue") return -1;
    if (b.dueInfo?.status === "Overdue" && a.dueInfo?.status !== "Overdue") return 1;
    const aDays = a.dueInfo ? a.dueInfo.daysDiff : 999;
    const bDays = b.dueInfo ? b.dueInfo.daysDiff : 999;
    return aDays - bDays;
  });

  const previewList = enrichedPending.slice(0, 3);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                {t("Textile Material Credit Due Alerts")}
              </h3>
              {pendingBills.length > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {pendingBills.length} {t("Records")}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t("Auto-calculates Due Date based on Surat textile trade standards (Rokda, 45, 60, 90, 100 days).")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/expenses/new"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 shadow-2xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("Add Expense")}</span>
          </Link>
          <Link
            href="/expenses?status=Pending"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all"
          >
            <span>{t("View All Credit Bills")}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/40">
        <div className="p-3.5 sm:p-4">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            {t("Material Credit Pending")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
              ₹{totalPendingAmount.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              ({pendingBills.length} {t("bills") || "bills"})
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            {t("Overdue Material Bills")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-xl sm:text-2xl font-black font-mono ${overdueCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
              {overdueCount}
            </span>
            {overdueAmount > 0 && (
              <span className="text-[11px] font-mono font-bold text-rose-600">
                (₹{overdueAmount.toLocaleString("en-IN")})
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            {t("Due Within 7 Days")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-xl sm:text-2xl font-black font-mono ${dueWithin7DaysCount > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {dueWithin7DaysCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {t("Due soon")}
            </span>
          </div>
        </div>
      </div>

      {/* Urgent Material Credit Bills List */}
      <div className="p-3.5 sm:p-4">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400 animate-pulse font-medium">
            {t("Loading credit records...")}
          </div>
        ) : previewList.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">
              {t("All textile material bills are settled!")}
            </h4>
            <p className="text-[11px] text-slate-500">
              {t("No pending credit or overdue raw material bills found.")}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              <span>{t("Upcoming & Overdue Supplier Credit")}</span>
              <span className="text-[10px] text-blue-600">Surat Textile Mudat</span>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 overflow-hidden bg-white">
              {previewList.map((bill) => {
                const dueInfo = bill.dueInfo;
                return (
                  <div
                    key={bill.id}
                    className="p-3 hover:bg-blue-50/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-extrabold text-slate-900 text-xs truncate">
                            {bill.vendor_name || "Unknown Supplier"}
                          </h5>
                          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            {bill.expense_no}
                          </span>
                          {bill.linked_order && (
                            <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {bill.linked_order}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                          <span className="font-medium">{t(bill.category)}</span>
                          {bill.due_date && (
                            <span className="flex items-center gap-1 font-mono text-slate-600">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {t("Due")}: {bill.due_date}
                            </span>
                          )}
                          {bill.credit_days ? (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50/80 px-1.5 py-0.2 rounded">
                              {bill.credit_days} {t("Days Credit")}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {dueInfo ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black border ${dueInfo.badgeClass}`}>
                          {dueInfo.status === "Overdue" ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {t(dueInfo.label)}
                        </span>
                      ) : null}

                      <div className="text-right">
                        <div className="font-mono font-black text-slate-900 text-sm">
                          ₹{bill.amount.toLocaleString("en-IN")}
                        </div>
                        <Link
                          href={`/expenses/new?edit=${bill.id}`}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline inline-block"
                        >
                          {t("Settle / Edit")} →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
