"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  Layers,
  DollarSign,
  UserPlus
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import {
  CourtFlowKpiCard,
  CourtFlowTable,
  CourtFlowBadge,
  CourtFlowActionMenu
} from "@/components/courtflow";

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

  const companiesColumns = [
    {
      key: "name",
      header: "COMPANY / TENANT",
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200">
            {item.name ? item.name[0]?.toUpperCase() : "C"}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{item.name}</p>
            <p className="text-[11px] text-slate-400">{item.owner_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "CONTACT",
      render: (item: any) => (
        <div>
          <p className="text-xs text-slate-700">{item.phone || "—"}</p>
          <p className="text-[11px] text-slate-400">{item.email}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      render: (item: any) => (
        <CourtFlowBadge
          status={item.status === "active" ? "active" : "pending"}
          label={item.status === "active" ? "Active" : "Trial"}
        />
      ),
    },
    {
      key: "actions",
      header: "ACTION",
      className: "text-right",
      render: (item: any) => (
        <CourtFlowActionMenu
          onView={() => (window.location.href = `/platform/companies`)}
          onEdit={() => (window.location.href = `/platform/companies`)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4 w-full pb-8">
      {/* 4 CourtFlow Overview KPI Cards matching Image 1 & 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CourtFlowKpiCard
          label="Total Companies"
          value={data?.metrics.total_companies ?? 2}
          iconBgColor="bg-[#fff4ed] text-[#fb6514]"
          trend="100% active tenants"
          trendPositive={true}
          icon={<Building2 className="w-5 h-5 text-amber-600" />}
        />
        <CourtFlowKpiCard
          label="Total Registered Users"
          value={data?.metrics.total_users ?? 5}
          iconBgColor="bg-blue-50 text-blue-600"
          trend="All 5 Fixed Roles"
          trendPositive={true}
          icon={<Users className="w-5 h-5 text-blue-600" />}
        />
        <CourtFlowKpiCard
          label="Monthly MRR"
          value={`₹${(data?.metrics.mrr_inr ?? 8332).toLocaleString("en-IN")}`}
          iconBgColor="bg-[#f4f3ff] text-[#7f56d9]"
          trend={`ARR ₹${(data?.metrics.arr_inr ?? 99998).toLocaleString("en-IN")}`}
          trendPositive={true}
          icon={<DollarSign className="w-5 h-5 text-purple-600" />}
        />
        <CourtFlowKpiCard
          label="Active Subscriptions"
          value={data?.metrics.active_subscriptions ?? 2}
          iconBgColor="bg-[#eff8ff] text-[#2e90fa]"
          trend="0 expired accounts"
          trendPositive={true}
          icon={<CreditCard className="w-5 h-5 text-blue-600" />}
        />
      </div>

      {/* Middle Row: Revenue Graph Card & Recent Activity matching CourtFlow Image 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Growth Summary (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#eaecf0] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Platform Revenue (This Month)
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">
                  ₹{(data?.metrics.mrr_inr ?? 8332).toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  ↗ 12% vs last month
                </span>
              </div>
            </div>
            <Link
              href="/platform/billing"
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              <span>Open Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* SVG Smooth Curve Area Chart matching Image 1 */}
          <div className="py-6">
            <div className="h-36 w-full relative flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 140" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,110 C80,105 160,100 240,90 C320,80 400,30 480,25 C540,20 580,35 600,40 L600,140 L0,140 Z"
                  fill="url(#revenueGrad)"
                />
                <path
                  d="M0,110 C80,105 160,100 240,90 C320,80 400,30 480,25 C540,20 580,35 600,40"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="480" cy="25" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>
            <div className="flex justify-between text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-100">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Recent Activity List matching CourtFlow Image 1 */}
        <div className="bg-white rounded-2xl border border-[#eaecf0] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
            <Link
              href="/platform/audit-logs"
              className="text-xs font-semibold text-slate-500 hover:text-emerald-600 flex items-center gap-1"
            >
              <span>View Activity</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 space-y-1">
            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">New company added</p>
                  <p className="text-[11px] text-slate-400">Om Sai Enterprise</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">5 min ago</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Subscription renewed</p>
                  <p className="text-[11px] text-slate-400">Shiv Creation • ₹4,999</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">27 min ago</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Permissions updated</p>
                  <p className="text-[11px] text-slate-400">Sales Invoices Field Matrix</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Table: Registered Tenants inside CourtFlow Table matching Image 1 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registered Companies</h2>
            <p className="text-xs text-slate-500">Live multi-tenant accounts with isolated business state</p>
          </div>
          <Link
            href="/platform/companies"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Open All Companies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <CourtFlowTable
          columns={companiesColumns}
          data={data?.recent_registrations || [
            {
              id: "comp-001",
              name: "Shiv Creation",
              owner_name: "Hiren Sutariya",
              phone: "9978987181",
              email: "hiren@shivcreation.com",
              status: "active"
            },
            {
              id: "comp-002",
              name: "Om Sai Enterprise - OSE House",
              owner_name: "Nilesh Sutariya",
              phone: "9825123456",
              email: "nilesh@omsai.com",
              status: "active"
            }
          ]}
          loading={loading}
        />
      </div>
    </div>
  );
}
