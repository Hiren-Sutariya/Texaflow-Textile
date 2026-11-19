"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Clock,
  Shield,
  ArrowRight
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface AuditLogItem {
  id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  target_company_id?: string;
  target_company_name?: string;
  details?: any;
  created_at?: string;
}

export default function PlatformAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (companyFilter !== "all") q.append("company_id", companyFilter);
      if (actionFilter !== "all") q.append("action", actionFilter);

      const [logsRes, compsRes] = await Promise.all([
        fetchApi(`/platform/audit-logs?${q.toString()}`),
        fetchApi("/platform/companies")
      ]);

      if (logsRes && logsRes.success) setLogs(logsRes.logs || []);
      if (compsRes && compsRes.success) setCompanies(compsRes.companies || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyFilter, actionFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Platform Security & Operational Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log stream of all administrative actions, permission overrides, and security events.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Tenant Scopes</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Action Categories</option>
          <option value="status">Company Status Changes</option>
          <option value="user">User Provisioning & Roles</option>
          <option value="permission">Permission & Field Overrides</option>
          <option value="module">Module Activation</option>
          <option value="trial">Trial & Plan Changes</option>
          <option value="support">Diagnostic Support Access</option>
        </select>
      </div>

      {/* Audit Logs Table - Clean White & Blue */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Scope</th>
                <th className="py-3.5 px-4">Details Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 text-xs">{l.actor_email || "superadmin"}</span>
                    <span className="text-[10px] text-blue-700 ml-1.5 uppercase font-sans font-black bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                      {l.actor_role}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-blue-700 font-bold font-mono text-xs">
                      {l.action}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <p className="text-slate-900 font-sans font-medium">{l.target_company_name}</p>
                    {l.target_company_id && (
                      <p className="text-[10px] text-slate-400">{l.target_company_id}</p>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-600 max-w-sm truncate text-[11px]">
                    {l.details ? JSON.stringify(l.details) : "—"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400 font-sans">
                    No matching audit records found.
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
