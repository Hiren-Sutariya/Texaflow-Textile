"use client";

import React, { useState, useEffect } from "react";
import {
  Headphones,
  Building2,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  RefreshCw,
  Plus
} from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function PlatformSupportPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Support Session Modal
  const [openModal, setOpenModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [sessionResult, setSessionResult] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compsRes, sessRes] = await Promise.all([
        fetchApi("/platform/companies"),
        fetchApi("/platform/support/active-sessions")
      ]);
      if (compsRes && compsRes.success) {
        setCompanies(compsRes.companies || []);
        if (!selectedCompanyId && compsRes.companies?.length > 0) {
          setSelectedCompanyId(compsRes.companies[0].id);
        }
      }
      if (sessRes && sessRes.success) {
        setActiveSessions(sessRes.sessions || []);
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

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId || !reason.trim()) {
      setErr("Mandatory justification reason is required.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetchApi("/platform/support/create-session", {
        method: "POST",
        body: JSON.stringify({
          company_id: selectedCompanyId,
          reason: reason.trim(),
          duration_minutes: Number(duration)
        })
      });
      if (res && res.success) {
        setSessionResult(res);
        loadData();
      } else {
        setErr(res.detail || "Failed to generate session");
      }
    } catch (e: any) {
      setErr(e.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    if (!window.confirm("Immediately terminate and revoke this active support diagnostic session?")) return;
    try {
      await fetchApi(`/platform/support/revoke-session?session_id=${sessionId}`, { method: "POST" });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const launchSupportPortal = (token: string, companyId: string) => {
    // Stores support session token in session storage and redirects to tenant root with visual diagnostic banner
    sessionStorage.setItem("texaflow_auth_token", token);
    sessionStorage.setItem("texaflow_active_company_id", companyId);
    sessionStorage.setItem("texaflow_support_mode", "active");
    window.open("/", "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Headphones className="w-6 h-6 text-purple-400" />
            <span>Customer Support & Diagnostic Access</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audited, time-limited tenant support sessions with mandatory justification. Passwords remain completely private.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setOpenModal(true); setSessionResult(null); setErr(null); }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Support Session</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Security Notice */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-white">Strict Customer Privacy & Audit Policy</p>
          <p className="text-slate-400 mt-0.5">
            Every diagnostic support action is permanently logged with the administrator identity, timestamp, and justification reason. Silent or unlogged customer data access is cryptographically forbidden.
          </p>
        </div>
      </div>

      {/* Active Support Sessions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Active Support Sessions ({activeSessions.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/50 border-b border-slate-800/80 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="py-3 px-4">Operator / Company</th>
                <th className="py-3 px-4">Support Justification</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4">Expires At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeSessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-white">{s.company_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Operator: {s.admin_email}
                    </p>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate font-medium">
                    "{s.reason}"
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {s.created_at ? new Date(s.created_at).toLocaleTimeString() : "—"}
                  </td>

                  <td className="py-3.5 px-4 text-amber-400 font-bold text-[11px]">
                    {new Date(s.expires_at).toLocaleTimeString()}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleRevoke(s.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Revoke Immediately
                    </button>
                  </td>
                </tr>
              ))}
              {activeSessions.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-slate-400">
                    No active support sessions. Customer data is completely isolated.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Support Session Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Headphones className="w-4 h-4 text-purple-400" />
                <span>Audited Diagnostic Support Session</span>
              </h3>
              <button onClick={() => setOpenModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {err && (
              <div className="p-3 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {err}
              </div>
            )}

            {sessionResult ? (
              <div className="space-y-4 py-2">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold space-y-1">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Support Session Provisioned Successfully</span>
                  </p>
                  <p className="text-[11px] text-slate-300 font-normal">
                    Valid for {sessionResult.expires_at} with permanent audit logging.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => launchSupportPortal(sessionResult.token, sessionResult.company_id)}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Launch Diagnostic Tenant Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateSession} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Target Tenant Enterprise</label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Mandatory Diagnostic Justification <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Diagnosing GST rounding discrepancy reported in Support Ticket #1084..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    required
                    minLength={5}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">This reason is permanently preserved in the platform audit trail.</p>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Access Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value={15}>15 Minutes (Quick Inspection)</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>60 Minutes (Standard Diagnostic)</option>
                    <option value={120}>120 Minutes (Maximum Permitted)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                  >
                    {submitting ? "Authorizing..." : "Authorize Diagnostic Session"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
