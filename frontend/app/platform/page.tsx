"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  Activity,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Boxes
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface PlatformData {
  metrics: {
    total_companies: number;
    active_companies: number;
    trial_companies: number;
    suspended_companies: number;
    total_users: number;
    active_subscriptions: number;
    expired_subscriptions: number;
    mrr_inr: number;
    arr_inr: number;
  };
  recent_registrations: Array<{
    id: string;
    name: string;
    owner_name: string;
    email: string;
    phone: string;
    status: string;
    created_at?: string;
  }>;
  recent_payments: Array<{
    id: string;
    company_id: string;
    company_name: string;
    amount: number;
    status: string;
    created_at?: string;
  }>;
  upcoming_renewals: Array<{
    company_id: string;
    company_name: string;
    plan_name: string;
    expires_at: string;
    days_remaining: number;
  }>;
}

export default function PlatformDashboardPage() {
  const [data, setData] = useState<PlatformData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi("/platform/overview");
      if (res && res.success) {
        setData(res);
      }
    } catch (e) {
      console.error("Failed to load platform overview", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">SaaS Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-tenant telemetry, subscription health, and revenue monitoring.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Companies</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {data?.metrics.total_companies ?? "—"}
            </span>
            <span className="text-[11px] font-bold text-emerald-400">
              {data?.metrics.active_companies} active
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>{data?.metrics.trial_companies ?? 0} in trial</span>
            <span>•</span>
            <span className="text-rose-400">{data?.metrics.suspended_companies ?? 0} suspended</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {data?.metrics.total_users ?? "—"}
            </span>
            <span className="text-[11px] font-bold text-slate-400">Across all tenants</span>
          </div>
          <p className="text-[10px] text-slate-400">5 Predefined Fixed Roles</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly MRR</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              ₹{(data?.metrics.mrr_inr ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            ARR: ₹{(data?.metrics.arr_inr ?? 0).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Subs</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {data?.metrics.active_subscriptions ?? "—"}
            </span>
            <span className="text-[11px] font-bold text-emerald-400">Verified</span>
          </div>
          <p className="text-[10px] text-rose-400">
            {data?.metrics.expired_subscriptions ?? 0} expired accounts
          </p>
        </div>
      </div>

      {/* Two-Column Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Tenants */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Recent Tenant Registrations</h2>
            </div>
            <Link
              href="/platform/companies"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {data?.recent_registrations?.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{c.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {c.owner_name} • {c.phone || c.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    c.status === "active"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {c.status}
                  </span>
                  <Link
                    href={`/platform/companies`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
            {(!data?.recent_registrations || data.recent_registrations.length === 0) && (
              <div className="py-8 text-center text-xs text-slate-400">No recent registrations</div>
            )}
          </div>
        </div>

        {/* Upcoming Renewals & Health */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Upcoming Renewals (30 Days)</h2>
            </div>
            <Link
              href="/platform/subscriptions"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>Manage Subscriptions</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {data?.upcoming_renewals?.map((r) => (
              <div key={r.company_id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{r.company_name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Plan: {r.plan_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-400">
                    {r.days_remaining} days left
                  </span>
                  <p className="text-[10px] text-slate-400">Due {new Date(r.expires_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {(!data?.upcoming_renewals || data.upcoming_renewals.length === 0) && (
              <div className="py-8 text-center text-xs text-slate-400">
                All subscriptions are healthy and renewed.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Link
          href="/platform/permissions"
          className="p-4 rounded-xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 hover:border-purple-500/60 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                Permission Management Matrix
              </p>
              <p className="text-[11px] text-slate-400">Configure role actions & field visibility</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/platform/modules"
          className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-300 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                Module Management
              </p>
              <p className="text-[11px] text-slate-400">Enable/disable modules per enterprise</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/platform/users"
          className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                User Management
              </p>
              <p className="text-[11px] text-slate-400">Provision & manage cross-tenant users</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
