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
  CheckCircle2,
  TrendingUp
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
    <div className="space-y-4 w-full">
      {/* Overview Cards - Matching Attendance Overview Boxes Design */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider truncate">TOTAL COLLECTED</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">₹{totalCollected.toLocaleString("en-IN")}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 font-black">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">TOTAL TRANSACTIONS</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{transactions.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-black">
            <Receipt className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider truncate">GATEWAY STATUS</p>
            <p className="text-xl font-black text-blue-700 mt-0.5">Live / Idempotent</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-black">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
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

      {/* Transactions Table - Excel-like Grid Design */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2.5 px-4 border-r border-slate-200/80">Receipt / Date</th>
                <th className="py-2.5 px-4 border-r border-slate-200/80">Tenant Enterprise</th>
                <th className="py-2.5 px-4 border-r border-slate-200/80">Subscription Plan</th>
                <th className="py-2.5 px-4 border-r border-slate-200/80">Payment Method</th>
                <th className="py-2.5 px-4 border-r border-slate-200/80">Amount</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap">
                    <p className="font-extrabold text-slate-900 text-xs">{t.receipt_no || t.id}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {t.created_at ? new Date(t.created_at).toLocaleString() : "—"}
                    </p>
                  </td>

                  <td className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-bold text-slate-900">{t.company_name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{t.company_id}</span>
                  </td>

                  <td className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap font-medium text-slate-700">
                    {t.plan_name}
                  </td>

                  <td className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap text-slate-500 text-[11px]">
                    {t.payment_method}
                  </td>

                  <td className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap">
                    <span className="font-bold text-emerald-600 text-xs">
                      ₹{t.amount.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">{t.currency}</span>
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
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
