"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Building2,
  Boxes,
  Users,
  Eye,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  Printer,
  RotateCcw,
  Save,
  Check,
  X,
  AlertTriangle,
  Lock,
  Layers,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { fetchApi } from "@/lib/api";

const FIXED_ROLES = ["OWNER", "ADMIN", "ACCOUNTANT", "MANAGER", "EMPLOYEE"];

const ACTIONS = [
  { key: "view", label: "View", icon: Eye },
  { key: "create", label: "Create", icon: Edit },
  { key: "edit", label: "Edit", icon: Edit },
  { key: "delete", label: "Delete", icon: Trash2 },
  { key: "export", label: "Export", icon: Download },
  { key: "approve", label: "Approve", icon: CheckCircle },
  { key: "print", label: "Print", icon: Printer },
];

const FIELD_TARGETS = [
  {
    entity: "sales_invoice",
    entityLabel: "Sales Invoices",
    fields: [
      { key: "profit_margin", label: "Profit Margin %" },
      { key: "outstanding_amount", label: "Outstanding Balance" },
      { key: "paid_amount", label: "Paid Amount" },
      { key: "discount", label: "Discount % & Amount" },
      { key: "internal_notes", label: "Internal Billing Notes" },
    ]
  },
  {
    entity: "purchase",
    entityLabel: "Purchases & Inward",
    fields: [
      { key: "cost_breakdown", label: "Internal Cost Breakdown" },
      { key: "total_amount", label: "Total Payable Bill" },
    ]
  },
  {
    entity: "expense",
    entityLabel: "Expenses",
    fields: [
      { key: "internal_notes", label: "Private Expense Notes" },
      { key: "amount", label: "Expense Amount" },
    ]
  },
  {
    entity: "party",
    entityLabel: "Parties & Vendors",
    fields: [
      { key: "credit_limit", label: "Credit Limit (₹)" },
    ]
  }
];

export default function PlatformPermissionsPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("*"); // '*' is platform default
  const [modules, setModules] = useState<any[]>([]);
  const [matrix, setMatrix] = useState<any>({});
  const [fieldRules, setFieldRules] = useState<any>({});
  const [activeTab, setActiveTab] = useState<"role_actions" | "field_level">("role_actions");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Selected filter for Role Action tab
  const [selectedRole, setSelectedRole] = useState<string>("ACCOUNTANT");

  const loadData = async () => {
    setLoading(true);
    try {
      const [compsRes, matrixRes, fieldsRes, modsRes] = await Promise.all([
        fetchApi("/platform/companies"),
        fetchApi(`/platform/permissions/matrix?company_id=${selectedCompany}`),
        fetchApi(`/platform/permissions/fields?company_id=${selectedCompany}`),
        fetchApi("/platform/modules")
      ]);

      if (compsRes && compsRes.success) setCompanies(compsRes.companies || []);
      if (matrixRes && matrixRes.success) setMatrix(matrixRes.matrix || {});
      if (fieldsRes && fieldsRes.success) setFieldRules(fieldsRes.fields || {});
      if (modsRes && modsRes.success) setModules(modsRes.modules || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCompany]);

  const toggleAction = (role: string, moduleKey: string, actionKey: string) => {
    setMatrix((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[role]) next[role] = {};
      if (!next[role][moduleKey]) next[role][moduleKey] = {};
      next[role][moduleKey][actionKey] = !next[role][moduleKey][actionKey];
      return next;
    });
  };

  const setFieldPermission = (entity: string, fieldName: string, role: string, perm: string) => {
    setFieldRules((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[entity]) next[entity] = {};
      if (!next[entity][fieldName]) next[entity][fieldName] = {};
      next[entity][fieldName][role] = perm;
      return next;
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      // 1. Save Role Action Matrix
      const matrixPromises: Promise<any>[] = [];
      for (const role of FIXED_ROLES) {
        if (matrix[role]) {
          for (const m of modules) {
            const actions = matrix[role][m.key];
            if (actions) {
              matrixPromises.push(
                fetchApi("/platform/permissions/matrix", {
                  method: "PUT",
                  body: JSON.stringify({
                    company_id: selectedCompany,
                    role,
                    module_key: m.key,
                    actions
                  })
                })
              );
            }
          }
        }
      }

      // 2. Save Field Level Permissions
      const fieldPromises: Promise<any>[] = [];
      for (const target of FIELD_TARGETS) {
        for (const f of target.fields) {
          for (const role of FIXED_ROLES) {
            const perm = fieldRules?.[target.entity]?.[f.key]?.[role] || "editable";
            fieldPromises.push(
              fetchApi("/platform/permissions/fields", {
                method: "PUT",
                body: JSON.stringify({
                  company_id: selectedCompany,
                  entity_type: target.entity,
                  field_name: f.key,
                  role,
                  permission: perm
                })
              })
            );
          }
        }
      }

      await Promise.all([...matrixPromises, ...fieldPromises]);
      setSaveStatus({ type: "success", text: "All permissions saved & synced with live backend engine!" });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e: any) {
      setSaveStatus({ type: "error", text: e.message || "Failed to save permissions" });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (selectedCompany === "*") {
      alert("Platform defaults cannot be reset. You can only reset tenant overrides.");
      return;
    }
    if (!window.confirm("Revert this company's custom permissions back to Platform Defaults?")) return;

    try {
      await fetchApi(`/platform/permissions/reset?company_id=${selectedCompany}`, { method: "POST" });
      loadData();
      setSaveStatus({ type: "success", text: "Reverted to Platform Defaults!" });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            <span>Centralized Access Control Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Super Admin exclusively controls module, action, and backend field visibility across all 5 fixed roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedCompany !== "*" && (
            <button
              onClick={handleResetToDefaults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-amber-400 transition-colors cursor-pointer"
              title="Revert company to platform defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          )}

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
          >
            <Save className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
            <span>{saving ? "Saving..." : "Save Matrix"}</span>
          </button>
        </div>
      </div>

      {/* Target Company Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-300">Target Tenant Scope:</span>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
          >
            <option value="*">🌐 Global Platform Defaults (All Companies)</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                🏢 {c.name} ({c.id})
              </option>
            ))}
          </select>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("role_actions")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "role_actions" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Level 2 & 3: Role Actions
          </button>
          <button
            onClick={() => setActiveTab("field_level")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "field_level" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Level 4: Field-Level Rules
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className={`p-3 rounded-xl text-xs font-bold ${
          saveStatus.type === "success"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
        }`}>
          {saveStatus.text}
        </div>
      )}

      {/* TAB 1: ROLE ACTIONS MATRIX */}
      {activeTab === "role_actions" && (
        <div className="space-y-4">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {FIXED_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  selectedRole === role
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Action Permissions Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Module Name</th>
                    {ACTIONS.map((a) => (
                      <th key={a.key} className="py-3 px-3 text-center">
                        {a.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {modules.map((m) => {
                    const rolePerms = matrix[selectedRole]?.[m.key] || {};
                    return (
                      <tr key={m.key} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-white text-xs">{m.label}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{m.key} • {m.category}</p>
                        </td>

                        {ACTIONS.map((a) => {
                          const isChecked = !!rolePerms[a.key];
                          return (
                            <td key={a.key} className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => toggleAction(selectedRole, m.key, a.key)}
                                className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                  isChecked
                                    ? "bg-purple-600 text-white shadow-xs"
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                                }`}
                                title={`${selectedRole} ${a.label} in ${m.label}`}
                              >
                                {isChecked ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIELD-LEVEL SECURITY MATRIX */}
      {activeTab === "field_level" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-300 flex items-start gap-3">
            <Lock className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Strict Backend Enforcement</p>
              <p className="text-slate-400 mt-0.5">
                Fields marked <span className="text-rose-400 font-bold">'Hidden'</span> are stripped from JSON API responses on the server.
                Fields marked <span className="text-amber-400 font-bold">'Read-Only'</span> or <span className="text-slate-300 font-bold">'Not Permitted'</span> cannot be modified via direct API requests.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {FIELD_TARGETS.map((target) => (
              <div key={target.entity} className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-purple-400" />
                    <span>{target.entityLabel} Field Controls</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">{target.entity}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/50 border-b border-slate-800/80 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Field Name</th>
                        {FIXED_ROLES.map((r) => (
                          <th key={r} className="py-3 px-3 text-center">{r}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {target.fields.map((f) => (
                        <tr key={f.key} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white text-xs">{f.label}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{f.key}</p>
                          </td>

                          {FIXED_ROLES.map((role) => {
                            const currentPerm = fieldRules?.[target.entity]?.[f.key]?.[role] || "editable";
                            return (
                              <td key={role} className="py-3.5 px-3 text-center">
                                <select
                                  value={currentPerm}
                                  onChange={(e) => setFieldPermission(target.entity, f.key, role, e.target.value)}
                                  className={`text-[11px] font-bold rounded-lg px-2 py-1 border transition-colors cursor-pointer ${
                                    currentPerm === "hidden"
                                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                      : currentPerm === "read_only"
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                      : currentPerm === "not_permitted_update"
                                      ? "bg-slate-800 text-slate-400 border-slate-700"
                                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  }`}
                                >
                                  <option value="editable">✏️ Editable</option>
                                  <option value="read_only">👁️ Read-Only</option>
                                  <option value="hidden">🚫 Hidden</option>
                                  <option value="not_permitted_update">🔒 No Update</option>
                                </select>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
