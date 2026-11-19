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
      { key: "supplier_cost", label: "Supplier Costing Rate" },
      { key: "internal_notes", label: "Internal Procurement Notes" },
      { key: "broker_commission", label: "Broker Commission %" },
    ]
  },
  {
    entity: "expense",
    entityLabel: "Expenses",
    fields: [
      { key: "amount", label: "Expense Amount" },
      { key: "approval_notes", label: "Approval Notes" },
    ]
  },
  {
    entity: "party",
    entityLabel: "Parties & Vendors",
    fields: [
      { key: "credit_limit", label: "Credit Limit" },
      { key: "closing_balance", label: "Current Balance" },
      { key: "pan", label: "PAN Number" },
      { key: "bank_account", label: "Bank Account Details" },
    ]
  }
];

export default function PlatformPermissionsPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("*"); // '*' is platform defaults
  const [modules, setModules] = useState<any[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, Record<string, boolean>>>>({});
  const [fieldRules, setFieldRules] = useState<any>({});
  const [activeTab, setActiveTab] = useState<"role_actions" | "field_level">("role_actions");
  const [selectedRole, setSelectedRole] = useState<string>("ACCOUNTANT");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compsRes, modsRes, matrixRes, fieldsRes] = await Promise.all([
        fetchApi("/platform/companies"),
        fetchApi("/platform/modules"),
        fetchApi(`/platform/permissions/matrix?company_id=${selectedCompany}`),
        fetchApi(`/platform/permissions/fields?company_id=${selectedCompany}`)
      ]);

      if (compsRes?.success) setCompanies(compsRes.companies || []);
      if (modsRes?.success) setModules(modsRes.modules || []);
      if (matrixRes?.success) setMatrix(matrixRes.matrix || {});
      if (fieldsRes?.success) setFieldRules(fieldsRes.fields || {});
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
    setMatrix((prev) => {
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span>Centralized Access Control Matrix</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Super Admin exclusively controls module, action, and backend field visibility across all 5 fixed roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedCompany !== "*" && (
            <button
              onClick={handleResetToDefaults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-amber-700 transition-colors cursor-pointer shadow-2xs"
              title="Revert company to platform defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          )}

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Save className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
            <span>{saving ? "Saving..." : "Save Matrix"}</span>
          </button>
        </div>
      </div>

      {/* Target Company Selector - Clean White & Blue */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-700">Target Tenant Scope:</span>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 shadow-2xs"
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
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("role_actions")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "role_actions" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Level 2 & 3: Role Actions
          </button>
          <button
            onClick={() => setActiveTab("field_level")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "field_level" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Level 4: Field-Level Rules
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className={`p-3 rounded-xl text-xs font-bold ${
          saveStatus.type === "success"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-rose-50 text-rose-700 border border-rose-200"
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
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-2xs ${
                  selectedRole === role
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Action Permissions Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Module Name</th>
                    {ACTIONS.map((a) => (
                      <th key={a.key} className="py-3 px-3 text-center">
                        {a.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modules.map((m) => {
                    const rolePerms = matrix[selectedRole]?.[m.key] || {};
                    return (
                      <tr key={m.key} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 text-xs">{m.label}</p>
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
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
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
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-3 shadow-2xs">
            <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Strict Backend Enforcement</p>
              <p className="text-slate-600 mt-0.5">
                Fields marked <span className="text-rose-600 font-bold">'Hidden'</span> are stripped from JSON API responses on the server.
                Fields marked <span className="text-amber-700 font-bold">'Read-Only'</span> or <span className="text-slate-700 font-bold">'No Update'</span> cannot be modified via direct API requests.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {FIELD_TARGETS.map((target) => (
              <div key={target.entity} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-blue-600" />
                    <span>{target.entityLabel} Field Controls</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">{target.entity}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Field Name</th>
                        {FIXED_ROLES.map((r) => (
                          <th key={r} className="py-3 px-3 text-center">{r}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {target.fields.map((f) => (
                        <tr key={f.key} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-900 text-xs">{f.label}</p>
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
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : currentPerm === "read_only"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : currentPerm === "not_permitted_update"
                                      ? "bg-slate-100 text-slate-600 border-slate-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
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
