"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  Building2,
  Check,
  X,
  Save,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function PlatformModulesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [modules, setModules] = useState<any[]>([]);
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compsRes, modsRes] = await Promise.all([
        fetchApi("/platform/companies"),
        fetchApi("/platform/modules")
      ]);

      if (compsRes && compsRes.success) {
        setCompanies(compsRes.companies || []);
        if (!selectedCompany && compsRes.companies?.length > 0) {
          setSelectedCompany(compsRes.companies[0].id);
        }
      }
      if (modsRes && modsRes.success) {
        setModules(modsRes.modules || []);
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

  useEffect(() => {
    if (!selectedCompany) return;
    const fetchCompanyModules = async () => {
      try {
        const res = await fetchApi(`/platform/companies/${selectedCompany}/modules`);
        if (res && res.success) {
          setModuleStates(res.modules || {});
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCompanyModules();
  }, [selectedCompany]);

  const toggleModule = (key: string) => {
    setModuleStates((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    if (!selectedCompany) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetchApi(`/platform/companies/${selectedCompany}/modules`, {
        method: "PUT",
        body: JSON.stringify({ modules: moduleStates })
      });
      if (res && res.success) {
        setStatus({ type: "success", text: "Module activation updated for company!" });
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus({ type: "error", text: res.detail || "Failed to update" });
      }
    } catch (e: any) {
      setStatus({ type: "error", text: e.message || "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handleBulk = (enable: boolean) => {
    const updated: Record<string, boolean> = {};
    modules.forEach((m) => {
      updated[m.key] = enable;
    });
    setModuleStates(updated);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-purple-400" />
            <span>Module Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Level 1 Security: Selectively enable or disable entire ERP business modules per tenant company.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
        >
          <Save className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
          <span>{saving ? "Saving..." : "Save Module Configuration"}</span>
        </button>
      </div>

      {/* Tenant Selector & Bulk Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-300">Selected Enterprise:</span>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                🏢 {c.name} ({c.id})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => handleBulk(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 transition-colors cursor-pointer"
          >
            Enable All
          </button>
          <button
            onClick={() => handleBulk(false)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-rose-400 transition-colors cursor-pointer"
          >
            Disable All
          </button>
        </div>
      </div>

      {status && (
        <div className={`p-3 rounded-xl text-xs font-bold ${
          status.type === "success"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
        }`}>
          {status.text}
        </div>
      )}

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {modules.map((m) => {
          const isEnabled = moduleStates[m.key] !== false; // default True
          return (
            <div
              key={m.key}
              onClick={() => toggleModule(m.key)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                isEnabled
                  ? "bg-slate-900/90 border-purple-500/40 hover:border-purple-500/80 shadow-md"
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{m.label}</h4>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    {m.category}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-1">{m.key}</p>
              </div>

              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                isEnabled
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-800 text-slate-500"
              }`}>
                {isEnabled ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
