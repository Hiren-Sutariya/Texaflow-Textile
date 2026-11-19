"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2
} from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function PlatformSubscriptionsPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Extend Trial Modal
  const [extendComp, setExtendComp] = useState<any | null>(null);
  const [extendDays, setExtendDays] = useState(14);

  // Assign Plan Modal
  const [assignComp, setAssignComp] = useState<any | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("plan-pro");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [months, setMonths] = useState(1);

  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compsRes, plansRes] = await Promise.all([
        fetchApi("/platform/companies"),
        fetchApi("/saas-admin/plans")
      ]);
      if (compsRes && compsRes.success) setCompanies(compsRes.companies || []);
      if (plansRes && Array.isArray(plansRes)) setPlans(plansRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExtendTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendComp) return;
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetchApi(`/saas-admin/companies/${extendComp.id}/extend-trial`, {
        method: "POST",
        body: JSON.stringify({ days: Number(extendDays) })
      });
      if (res && res.success) {
        setMsg({ type: "success", text: res.message || "Trial extended!" });
        loadData();
        setTimeout(() => setExtendComp(null), 1000);
      } else {
        setMsg({ type: "error", text: res.detail || "Action failed" });
      }
    } catch (e: any) {
      setMsg({ type: "error", text: e.message || "Network error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignComp) return;
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetchApi(`/saas-admin/companies/${assignComp.id}/assign-plan`, {
        method: "POST",
        body: JSON.stringify({
          plan_id: selectedPlanId,
          billing_cycle: billingCycle,
          status: "active",
          months: Number(months)
        })
      });
      if (res && res.success) {
        setMsg({ type: "success", text: res.message || "Plan assigned!" });
        loadData();
        setTimeout(() => setAssignComp(null), 1000);
      } else {
        setMsg({ type: "error", text: res.detail || "Action failed" });
      }
    } catch (e: any) {
      setMsg({ type: "error", text: e.message || "Network error" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-purple-400" />
            <span>Subscription Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centrally manage company subscription lifecycles, trial periods, and tier entitlements.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Enterprise</th>
                <th className="py-3.5 px-4">Active Plan Tier</th>
                <th className="py-3.5 px-4">Lifecycle Status</th>
                <th className="py-3.5 px-4">Billing Cycle</th>
                <th className="py-3.5 px-4">Expiration / Renewal</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {companies.map((c) => {
                const sub = c.subscription;
                return (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white text-xs">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.id} • {c.owner_name}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-purple-300 text-xs">
                        {sub?.plan_name || "Custom Tier"}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">{sub?.plan_id}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        sub?.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : sub?.status === "trialing"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {sub?.status || "Unprovisioned"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 uppercase text-[11px] font-bold text-slate-300">
                      {sub?.billing_cycle || "monthly"}
                    </td>

                    <td className="py-3.5 px-4 text-[11px]">
                      {sub?.trial_ends_at && sub?.status === "trialing" ? (
                        <div>
                          <p className="text-amber-400 font-bold">
                            Trial Ends: {new Date(sub.trial_ends_at).toLocaleDateString()}
                          </p>
                        </div>
                      ) : sub?.current_period_end ? (
                        <div>
                          <p className="text-slate-300 font-bold">
                            Renew by: {new Date(sub.current_period_end).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => { setExtendComp(c); setExtendDays(14); setMsg(null); }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Extend Trial
                      </button>

                      <button
                        onClick={() => { setAssignComp(c); setSelectedPlanId(sub?.plan_id || "plan-pro"); setMsg(null); }}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Assign Plan
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extend Trial Modal */}
      {extendComp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Extend Free Trial</span>
              </h3>
              <button onClick={() => setExtendComp(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {msg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                msg.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleExtendTrial} className="space-y-3 text-xs">
              <p className="text-slate-300">
                Extend trial window for <span className="font-bold text-white">{extendComp.name}</span>
              </p>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Number of Days</label>
                <input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  min={1}
                  max={90}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setExtendComp(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                >
                  {actionLoading ? "Extending..." : "Confirm Extension"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Plan Modal */}
      {assignComp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" />
                <span>Assign Subscription Plan</span>
              </h3>
              <button onClick={() => setAssignComp(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {msg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                msg.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleAssignPlan} className="space-y-3 text-xs">
              <p className="text-slate-300">
                Select subscription tier for <span className="font-bold text-white">{assignComp.name}</span>
              </p>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Subscription Plan</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price_monthly}/mo or ₹{p.price_annual}/yr)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Billing Cycle</label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                {billingCycle === "monthly" && (
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Duration (Months)</label>
                    <input
                      type="number"
                      value={months}
                      onChange={(e) => setMonths(Number(e.target.value))}
                      min={1}
                      max={36}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssignComp(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                >
                  {actionLoading ? "Assigning..." : "Assign & Activate Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
