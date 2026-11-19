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
    <div className="space-y-4 w-full">
      {/* Subscriptions Table - Excel-like Grid Design */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2.5 px-4 border-r border-slate-200/80">Enterprise</th>
                <th className="py-2.5 px-4 border-r border-slate-200/80">Active Plan Tier</th>
                <th className="py-2.5 px-4 text-center border-r border-slate-200/80">Lifecycle Status</th>
                <th className="py-2.5 px-4 text-center border-r border-slate-200/80">Billing Cycle</th>
                <th className="py-2.5 px-4 border-r border-slate-200/80">Expiration / Renewal</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
              {companies.map((c) => {
                const sub = c.subscription;
                return (
                  <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap">
                      <p className="font-extrabold text-slate-900 text-xs">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.id} • {c.owner_name}</p>
                    </td>

                    <td className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap">
                      <span className="font-bold text-blue-700 text-xs">
                        {sub?.plan_name || "Custom Tier"}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">{sub?.plan_id}</p>
                    </td>

                    <td className="py-3 px-4 text-center border-r border-slate-200/70 whitespace-nowrap">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        sub?.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : sub?.status === "trialing"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {sub?.status || "Unprovisioned"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center border-r border-slate-200/70 whitespace-nowrap uppercase text-[11px] font-bold text-slate-700">
                      {sub?.billing_cycle || "monthly"}
                    </td>

                    <td className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap text-[11px]">
                      {sub?.trial_ends_at && sub?.status === "trialing" ? (
                        <div>
                          <p className="text-amber-700 font-bold">
                            Trial Ends: {new Date(sub.trial_ends_at).toLocaleDateString()}
                          </p>
                        </div>
                      ) : sub?.current_period_end ? (
                        <div>
                          <p className="text-slate-800 font-bold">
                            Renew by: {new Date(sub.current_period_end).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => { setExtendComp(c); setExtendDays(14); setMsg(null); }}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        Extend Trial
                      </button>

                      <button
                        onClick={() => { setAssignComp(c); setSelectedPlanId(sub?.plan_id || "plan-pro"); setMsg(null); }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span>Extend Free Trial</span>
              </h3>
              <button onClick={() => setExtendComp(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {msg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                msg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleExtendTrial} className="space-y-3 text-xs">
              <p className="text-slate-600">
                Extend trial window for <span className="font-bold text-slate-900">{extendComp.name}</span>
              </p>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Number of Days</label>
                <input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  min={1}
                  max={90}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExtendComp(null)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span>Assign Subscription Plan</span>
              </h3>
              <button onClick={() => setAssignComp(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {msg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                msg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleAssignPlan} className="space-y-3 text-xs">
              <p className="text-slate-600">
                Select subscription tier for <span className="font-bold text-slate-900">{assignComp.name}</span>
              </p>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Subscription Plan</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price_monthly}/mo
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Billing Cycle</label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual (Save 20%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    min={1}
                    max={60}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignComp(null)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
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
