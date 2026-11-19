"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Building2,
  Calendar,
  DollarSign,
  Download,
  Search,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface TransactionItem {
  id: string;
  company_id: string;
  company_name: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  receipt_no: string;
  created_at?: string;
}

export default function PlatformBillingPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi("/saas-admin/transactions");
      if (res && Array.isArray(res)) {
        setTransactions(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = transactions.filter((t) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      t.company_name?.toLowerCase().includes(term) ||
      t.receipt_no?.toLowerCase().includes(term) ||
      t.id?.toLowerCase().includes(term)
    );
  });

  const totalCollected = transactions
    .filter((t) => t.status === "success")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <span>Billing & Transactions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Platform-wide revenue ledger, payment transactions, and subscription receipts.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview Cards - Clean White & Blue */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-500">Total Collected</span>
          <p className="text-2xl font-black text-emerald-600">₹{totalCollected.toLocaleString("en-IN")}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-500">Total Transactions</span>
          <p className="text-2xl font-black text-slate-900">{transactions.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-500">Gateway Status</span>
          <p className="text-2xl font-black text-blue-600">Live / Idempotent</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter transactions by receipt #, company name..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      {/* Transactions Table - Clean White & Blue */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Receipt / Date</th>
                <th className="py-3.5 px-4">Tenant Enterprise</th>
                <th className="py-3.5 px-4">Subscription Plan</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 text-xs">{t.receipt_no || t.id}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {t.created_at ? new Date(t.created_at).toLocaleString() : "—"}
                    </p>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-bold text-slate-900">{t.company_name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{t.company_id}</span>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {t.plan_name}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {t.payment_method}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-emerald-600 text-xs">
                      ₹{t.amount.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">{t.currency}</span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      t.status === "success"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
