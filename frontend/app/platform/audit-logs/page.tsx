"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  Clock,
  Building2,
  UserCheck
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import {
  CourtFlowTable,
  CourtFlowBadge,
  CourtFlowButton,
  CourtFlowInput
} from "@/components/courtflow";

interface AuditLogItem {
  id: string;
  created_at: string;
  actor_id: string;
  actor_role: string;
  action: string;
  target_company_id?: string;
  target_user_id?: string;
  details?: any;
}

export default function PlatformAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (actionFilter !== "all") q.append("action", actionFilter);

      const res = await fetchApi(`/platform/audit-logs?${q.toString()}`);
      if (res && res.success) {
        setLogs(res.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const columns = [
    {
      key: "time",
      header: "TIMESTAMP",
      render: (l: AuditLogItem) => (
        <div className="flex items-center gap-2 text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-xs">{l.created_at ? new Date(l.created_at).toLocaleString() : "Just now"}</span>
        </div>
      ),
    },
    {
      key: "actor",
      header: "ACTOR / ROLE",
      render: (l: AuditLogItem) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{l.actor_id}</p>
          <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
            {l.actor_role}
          </span>
        </div>
      ),
    },
    {
      key: "action",
      header: "SECURITY EVENT",
      render: (l: AuditLogItem) => (
        <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {l.action}
        </span>
      ),
    },
    {
      key: "target",
      header: "TARGET COMPANY",
      render: (l: AuditLogItem) => (
        <span className="text-xs text-slate-600 font-mono">
          {l.target_company_id || "Platform Wide"}
        </span>
      ),
    },
    {
      key: "details",
      header: "PAYLOAD & METADATA",
      render: (l: AuditLogItem) => (
        <span className="text-[11px] text-slate-500 max-w-sm truncate block font-mono">
          {l.details ? JSON.stringify(l.details) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4 w-full pb-8">
      {/* Top filter bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Platform Security Audit Logs</h2>
          <p className="text-xs text-slate-500">Immutable trail of administrative and security events</p>
        </div>

        <div className="flex items-center gap-2">
          {["all", "company_update", "permission_update", "user_status_change"].map((act) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-xs ${
                actionFilter === act
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {act === "all" ? "All Events" : act.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <CourtFlowTable
        columns={columns}
        data={logs}
        loading={loading}
        emptyTitle="No audit records found"
        emptyDescription="Security events will appear here as administrators perform actions."
      />
    </div>
  );
}
