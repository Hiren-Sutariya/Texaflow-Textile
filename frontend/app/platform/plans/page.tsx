"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Check,
  Edit2,
  RefreshCw,
  Sparkles,
  Save,
  X,
  Boxes,
  Users,
  HardDrive
} from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function PlatformPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [editPlan, setEditPlan] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await fetchApi("/saas-admin/plans");
      if (res && Array.isArray(res)) setPlans(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openEdit = (p: any) => {
    setEditPlan(p);
    setEditForm({
      price_monthly: p.price_monthly,
      price_annual: p.price_annual,
      max_users: p.max_users,
      max_storage_mb: p.max_storage_mb,
      monthly_docs_limit: p.monthly_docs_limit,
      allow_hrms: p.allow_hrms
    });
    setMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlan) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetchApi(`/saas-admin/plans/${editPlan.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm)
      });
      if (res && res.success) {
        setMsg({ type: "success", text: "Plan limits updated successfully!" });
        loadPlans();
        setTimeout(() => setEditPlan(null), 1000);
      } else {
        setMsg({ type: "error", text: res.detail || "Failed to update" });
      }
    } catch (e: any) {
      setMsg({ type: "error", text: e.message || "Network error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-purple-400" />
            <span>SaaS Subscription Plans & Pricing</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centrally configure commercial pricing tiers, user allocations, and feature entitlements.
          </p>
        </div>

        <button
          onClick={loadPlans}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
              p.code === "enterprise"
                ? "bg-gradient-to-b from-purple-950/40 to-slate-900 border-purple-500/40 shadow-xl"
                : "bg-slate-900/80 border-slate-800"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                  {p.code}
                </span>
                <button
                  onClick={() => openEdit(p)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Edit Plan"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{p.description}</p>
              </div>

              <div className="py-2 border-y border-slate-800/80">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">₹{p.price_monthly.toLocaleString("en-IN")}</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-[11px] text-purple-400 mt-0.5">
                  or ₹{p.price_annual.toLocaleString("en-IN")} / year billed annually
                </p>
              </div>

              {/* Entitlement Metrics */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-3.5 h-3.5" /> Max Users:
                  </span>
                  <span className="font-bold text-white">{p.max_users} seats</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <HardDrive className="w-3.5 h-3.5" /> Storage:
                  </span>
                  <span className="font-bold text-white">{(p.max_storage_mb / 1024).toFixed(1)} GB</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Boxes className="w-3.5 h-3.5" /> Monthly Docs:
                  </span>
                  <span className="font-bold text-white">{p.monthly_docs_limit.toLocaleString()} / mo</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">HRMS & Karigar Payroll:</span>
                  <span className={`font-bold ${p.allow_hrms ? "text-emerald-400" : "text-rose-400"}`}>
                    {p.allow_hrms ? "Included" : "Disabled"}
                  </span>
                </div>
              </div>

              {/* Feature Highlights */}
              {p.features && p.features.length > 0 && (
                <div className="pt-2 space-y-1.5 border-t border-slate-800/60">
                  {p.features.map((feat: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Plan Modal */}
      {editPlan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-400" />
                <span>Configure Plan: {editPlan.name}</span>
              </h3>
              <button onClick={() => setEditPlan(null)} className="p-1 text-slate-400 hover:text-white">
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

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    value={editForm.price_monthly}
                    onChange={(e) => setEditForm({ ...editForm, price_monthly: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Annual Price (₹)</label>
                  <input
                    type="number"
                    value={editForm.price_annual}
                    onChange={(e) => setEditForm({ ...editForm, price_annual: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Max Users</label>
                  <input
                    type="number"
                    value={editForm.max_users}
                    onChange={(e) => setEditForm({ ...editForm, max_users: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Max Storage (MB)</label>
                  <input
                    type="number"
                    value={editForm.max_storage_mb}
                    onChange={(e) => setEditForm({ ...editForm, max_storage_mb: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Monthly Invoices/Challans Limit</label>
                <input
                  type="number"
                  value={editForm.monthly_docs_limit}
                  onChange={(e) => setEditForm({ ...editForm, monthly_docs_limit: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="allow_hrms"
                  checked={editForm.allow_hrms}
                  onChange={(e) => setEditForm({ ...editForm, allow_hrms: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="allow_hrms" className="text-slate-300 font-bold cursor-pointer">
                  Allow HRMS & Karigar Salary Modules
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditPlan(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
