"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Building2,
  Users,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingUp,
  Activity,
  ChevronRight,
  ExternalLink,
  Lock,
  ArrowUpRight,
  Check,
  X,
  Plus,
  Edit2,
  FileSpreadsheet
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface PlatformMetrics {
  total_companies: number;
  total_users: number;
  active_subscriptions: number;
  trial_accounts: number;
  suspended_accounts: number;
  expired_accounts: number;
  mrr_inr: number;
  arr_inr: number;
}

interface CompanyItem {
  id: string;
  name: string;
  code: string;
  owner_name: string;
  email: string;
  phone: string;
  city_state?: string;
  status: string;
  company_status: string;
  user_count: number;
  subscription: {
    id?: string;
    plan_id: string;
    plan_name: string;
    status: string;
    billing_cycle: string;
    days_remaining?: number;
    trial_ends_at?: string;
    current_period_end?: string;
  };
}

interface PlanItem {
  id: string;
  name: string;
  code: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  max_users: number;
  max_storage_mb: number;
  monthly_docs_limit: number;
  allow_hrms: boolean;
  allow_custom_print: boolean;
  features_json?: string[];
  is_active: boolean;
}

interface TransactionItem {
  id: string;
  company_id: string;
  company_name: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  receipt_no?: string;
  created_at: string;
}

interface AuditLogItem {
  id: string;
  actor_email: string;
  action: string;
  target_company_id?: string;
  target_company_name?: string;
  details?: any;
  created_at: string;
}

export default function SaaSAdminPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"enterprises" | "plans" | "transactions" | "audit">("enterprises");
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Action Modals State
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [extendDays, setExtendDays] = useState(14);
  const [assignPlanId, setAssignPlanId] = useState("plan-pro");
  const [assignCycle, setAssignCycle] = useState("monthly");
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");
  const [actionErrorMsg, setActionErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = user?.role === "SuperAdmin";

  const loadData = async () => {
    setLoading(true);
    setActionErrorMsg("");
    try {
      // 1. Overview metrics
      const overviewRes = await fetchApi<{ metrics: PlatformMetrics }>("/saas-admin/overview");
      if (overviewRes?.metrics) {
        setMetrics(overviewRes.metrics);
      }

      // 2. Companies list
      const compsRes = await fetchApi<CompanyItem[]>("/saas-admin/companies");
      if (Array.isArray(compsRes)) {
        setCompanies(compsRes);
      }

      // 3. Plans list
      const plansRes = await fetchApi<PlanItem[]>("/saas-admin/plans");
      if (Array.isArray(plansRes)) {
        setPlans(plansRes);
      }

      // 4. Transactions list
      const txnsRes = await fetchApi<TransactionItem[]>("/saas-admin/transactions");
      if (Array.isArray(txnsRes)) {
        setTransactions(txnsRes);
      }

      // 5. Audit logs
      const logsRes = await fetchApi<AuditLogItem[]>("/saas-admin/audit-logs");
      if (Array.isArray(logsRes)) {
        setAuditLogs(logsRes);
      }
    } catch (err: any) {
      console.error("Super Admin data fetch notice:", err);
      setActionErrorMsg(err.message || "Failed to load platform data. Please ensure Super Admin authorization.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleExtendTrial = async (companyId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetchApi<{ message: string }>(`/saas-admin/companies/${companyId}/extend-trial`, {
        method: "POST",
        body: JSON.stringify({ days: extendDays })
      });
      setActionSuccessMsg(res.message || "Trial extended successfully!");
      setSelectedCompany(null);
      loadData();
      setTimeout(() => setActionSuccessMsg(""), 3500);
    } catch (err: any) {
      setActionErrorMsg(err.message || "Failed to extend trial.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignPlan = async (companyId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetchApi<{ message: string }>(`/saas-admin/companies/${companyId}/assign-plan`, {
        method: "POST",
        body: JSON.stringify({ plan_id: assignPlanId, billing_cycle: assignCycle, status: "active", months: 1 })
      });
      setActionSuccessMsg(res.message || "Plan assigned successfully!");
      setSelectedCompany(null);
      loadData();
      setTimeout(() => setActionSuccessMsg(""), 3500);
    } catch (err: any) {
      setActionErrorMsg(err.message || "Failed to assign plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (companyId: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    if (!confirm(`Are you sure you want to change company status to '${newStatus.toUpperCase()}'?`)) return;

    try {
      const res = await fetchApi<{ message: string }>(`/saas-admin/companies/${companyId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      setActionSuccessMsg(res.message || "Status updated!");
      loadData();
      setTimeout(() => setActionSuccessMsg(""), 3500);
    } catch (err: any) {
      setActionErrorMsg(err.message || "Failed to update status.");
    }
  };

  const handleImpersonate = async (companyId: string) => {
    try {
      const res = await fetchApi<{ token: string; company_name: string }>(`/saas-admin/companies/${companyId}/impersonate-token`, {
        method: "POST"
      });
      if (res?.token) {
        sessionStorage.setItem("texaflow_auth_token", res.token);
        sessionStorage.setItem("texaflow_active_company_id", companyId);
        window.open("/", "_blank");
      }
    } catch (err: any) {
      alert("Impersonation failed: " + err.message);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.owner_name.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);

    const matchStatus =
      statusFilter === "all" ||
      (c.subscription?.status || "").toLowerCase() === statusFilter.toLowerCase();

    return matchSearch && matchStatus;
  });

  if (!isAuthenticated || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Platform Super-Admin Area</h1>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            This administration gateway is strictly reserved for TexaFlow SaaS Cloud platform operators. Please log in with your Super Administrator credentials.
          </p>
          <div className="bg-slate-800/60 rounded-xl p-4 mb-6 text-left border border-slate-700/50 text-xs space-y-1">
            <div className="text-slate-400">Default SuperAdmin Username: <span className="font-mono text-emerald-400">superadmin</span></div>
            <div className="text-slate-400">Default Credentials Seed: <span className="font-mono text-emerald-400">SuperAdmin@2026</span></div>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
          >
            Go to Sign In Screen <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-bold text-lg">
            OS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">TexaFlow SaaS Cloud</span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-Tenant Platform Control & Subscription Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Launch ERP Portal
          </button>
          <button
            onClick={logout}
            className="px-3.5 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Alerts */}
        {actionSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
        {actionErrorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
        )}

        {/* Platform KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Registered Enterprises</span>
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {metrics ? metrics.total_companies : "—"}
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <span>{metrics ? metrics.total_users : 0} total active user accounts</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Paid Subs</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {metrics ? metrics.active_subscriptions : "—"}
            </div>
            <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
              <span>{metrics ? metrics.trial_accounts : 0} enterprise trials in progress</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monthly Recurring Revenue</span>
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              ₹{metrics ? metrics.mrr_inr.toLocaleString("en-IN") : "0"}
            </div>
            <div className="text-xs text-indigo-400 mt-2 flex items-center gap-1.5">
              <span>Annual Run Rate: ₹{metrics ? metrics.arr_inr.toLocaleString("en-IN") : "0"}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Suspended / Expired</span>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {metrics ? metrics.suspended_accounts + metrics.expired_accounts : "0"}
            </div>
            <div className="text-xs text-amber-400 mt-2 flex items-center gap-1.5">
              <span>{metrics ? metrics.suspended_accounts : 0} suspended | {metrics ? metrics.expired_accounts : 0} expired</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 space-x-8">
          {[
            { id: "enterprises", label: "Enterprises & Tenants", count: companies.length },
            { id: "plans", label: "Subscription Plans", count: plans.length },
            { id: "transactions", label: "Billing & Transactions", count: transactions.length },
            { id: "audit", label: "Platform Audit Log", count: auditLogs.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300 font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* TAB 1: Enterprises & Tenants */}
        {activeTab === "enterprises" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by company, owner, email, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active (Paid)</option>
                  <option value="trialing">Trialing</option>
                  <option value="suspended">Suspended</option>
                  <option value="expired">Expired</option>
                </select>

                <button
                  onClick={loadData}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                  title="Refresh List"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Tenant Company</th>
                      <th className="px-6 py-4">Owner & Contact</th>
                      <th className="px-6 py-4">Subscription Plan</th>
                      <th className="px-6 py-4">Status & Days Left</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredCompanies.map((c) => {
                      const st = (c.subscription?.status || c.status || "").toLowerCase();
                      const isTrial = st === "trialing" || st === "trial";
                      const isActive = st === "active" || st === "paid";
                      const isSuspended = st === "suspended";

                      return (
                        <tr key={c.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white">{c.name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              ID: {c.id} | Code: {c.code}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-200">{c.owner_name}</div>
                            <div className="text-xs text-slate-400 font-mono">{c.phone || c.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-200">
                              {c.subscription?.plan_name || "Standard Plan"}
                            </span>
                            <div className="text-xs text-slate-500 capitalize">
                              Cycle: {c.subscription?.billing_cycle || "monthly"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${
                                  isActive
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : isTrial
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    : isSuspended
                                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                }`}
                              >
                                {st.toUpperCase()}
                              </span>
                              {c.subscription?.days_remaining !== undefined && (
                                <span className="text-xs text-slate-400 font-mono">
                                  ({c.subscription.days_remaining}d left)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedCompany(c)}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                              >
                                Manage
                              </button>
                              <button
                                onClick={() => handleToggleStatus(c.id, c.subscription?.status || "active")}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                                  isSuspended
                                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                                    : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                                }`}
                              >
                                {isSuspended ? "Activate" : "Suspend"}
                              </button>
                              <button
                                onClick={() => handleImpersonate(c.id)}
                                title="Open Support Session"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredCompanies.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                          No tenant companies found matching your query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Subscription Plans */}
        {activeTab === "plans" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-xs font-bold uppercase tracking-wider">
                      {p.code}
                    </span>
                    <span className="text-xs text-slate-400">Order: #{p.id}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">{p.description}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">₹{p.price_monthly.toLocaleString("en-IN")}</span>
                      <span className="text-slate-400 text-xs">/ month</span>
                    </div>
                    <div className="text-xs text-emerald-400 mt-1">
                      Annual: ₹{p.price_annual.toLocaleString("en-IN")} / year (Save 17%)
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>Up to <strong>{p.max_users}</strong> team users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                      <span>Limit: <strong>{p.monthly_docs_limit.toLocaleString()}</strong> docs/mo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <span>HRMS Module: {p.allow_hrms ? "Included" : "Disabled"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800">
                  <button
                    onClick={() => {
                      alert(`Plan details for ${p.name} are active. SuperAdmin can edit via backend API.`);
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Plan Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: Transactions */}
        {activeTab === "transactions" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Transaction / Receipt</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-semibold text-white">{t.receipt_no || t.id}</td>
                      <td className="px-6 py-4 text-slate-200">{t.company_name}</td>
                      <td className="px-6 py-4 text-slate-400">{t.plan_name}</td>
                      <td className="px-6 py-4 text-emerald-400 font-bold">₹{t.amount.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Audit Log */}
        {activeTab === "audit" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4">Target Company</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {auditLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-semibold text-white">{l.action}</td>
                      <td className="px-6 py-4 text-slate-400">{l.actor_email}</td>
                      <td className="px-6 py-4 text-blue-400">{l.target_company_name || l.target_company_id || "System"}</td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                        {l.details ? JSON.stringify(l.details) : "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No administrative audit logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Action Management Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Manage Tenant Subscription</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedCompany.name} ({selectedCompany.id})</p>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Option 1: Extend Trial */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" /> Extend Free Trial
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={extendDays}
                    onChange={(e) => setExtendDays(parseInt(e.target.value) || 14)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                  />
                  <span className="text-xs text-slate-400">days additional access</span>
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleExtendTrial(selectedCompany.id)}
                    className="ml-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition"
                  >
                    Apply Extension
                  </button>
                </div>
              </div>

              {/* Option 2: Assign / Upgrade Plan */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" /> Assign Paid Plan
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Target Plan</label>
                    <select
                      value={assignPlanId}
                      onChange={(e) => setAssignPlanId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Billing Cycle</label>
                    <select
                      value={assignCycle}
                      onChange={(e) => setAssignCycle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    >
                      <option value="monthly">Monthly Cycle</option>
                      <option value="annual">Annual Cycle (1 Year)</option>
                    </select>
                  </div>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleAssignPlan(selectedCompany.id)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition mt-2"
                >
                  Confirm Plan Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
