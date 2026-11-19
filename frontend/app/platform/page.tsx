"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Activity,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Boxes,
  CheckCircle2
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
    <div className="space-y-6 w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">SaaS Command Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-tenant telemetry, subscription health, and revenue monitoring.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-colors self-start sm:self-auto shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Grid - Clean White & Blue */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Companies</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {data?.metrics.total_companies ?? "—"}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {data?.metrics.active_companies} active
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
            <span>{data?.metrics.trial_companies ?? 0} in trial</span>
            <span>•</span>
            <span className="text-rose-600 font-bold">{data?.metrics.suspended_companies ?? 0} suspended</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {data?.metrics.total_users ?? "—"}
            </span>
            <span className="text-[11px] font-bold text-slate-400">All tenants</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">5 Predefined Fixed Roles</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly MRR</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600">
              ₹{(data?.metrics.mrr_inr ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            ARR: ₹{(data?.metrics.arr_inr ?? 0).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Subs</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {data?.metrics.active_subscriptions ?? "—"}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Verified</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            {data?.metrics.expired_subscriptions ?? 0} expired accounts
          </p>
        </div>
      </div>

      {/* Two-Column Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Tenants */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Tenant Registrations</h2>
            </div>
            <Link
              href="/platform/companies"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recent_registrations?.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{c.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {c.owner_name} • {c.phone || c.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    c.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {c.status}
                  </span>
                  <Link
                    href={`/platform/companies`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Upcoming Renewals (30 Days)</h2>
            </div>
            <Link
              href="/platform/subscriptions"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Manage Subscriptions</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.upcoming_renewals?.map((r) => (
              <div key={r.company_id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{r.company_name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Plan: {r.plan_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {r.days_remaining} days left
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Due {new Date(r.expires_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {(!data?.upcoming_renewals || data.upcoming_renewals.length === 0) && (
              <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
                <span>All subscriptions are healthy and renewed.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Link
          href="/platform/permissions"
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between group shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Permission Management Matrix
              </p>
              <p className="text-[11px] text-slate-500">Configure role actions & field visibility</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/platform/modules"
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between group shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Module Management
              </p>
              <p className="text-[11px] text-slate-500">Enable/disable modules per enterprise</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/platform/users"
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between group shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                User Management
              </p>
              <p className="text-[11px] text-slate-500">Provision & manage cross-tenant users</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
