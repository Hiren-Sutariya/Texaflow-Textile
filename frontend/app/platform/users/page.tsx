"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  RefreshCw,
  KeyRound,
  Shield,
  Building2,
  X,
  Check,
  AlertTriangle
} from "lucide-react";
import { fetchApi } from "@/lib/api";

const FIXED_ROLES = ["OWNER", "ADMIN", "ACCOUNTANT", "MANAGER", "EMPLOYEE"];

interface UserItem {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  company_id: string;
  company_name: string;
  is_active: boolean;
  created_at?: string;
}

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  // Create Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    company_id: "",
    name: "",
    email: "",
    username: "",
    role: "EMPLOYEE",
    password: ""
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password Reset Modal
  const [resetUser, setResetUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append("search", search);
      if (roleFilter !== "all") q.append("role", roleFilter);
      if (companyFilter !== "all") q.append("company_id", companyFilter);

      const [usersRes, compsRes] = await Promise.all([
        fetchApi(`/platform/users?${q.toString()}`),
        fetchApi(`/platform/companies`)
      ]);

      if (usersRes && usersRes.success) setUsers(usersRes.users || []);
      if (compsRes && compsRes.success) {
        setCompanies(compsRes.companies || []);
        if (!createForm.company_id && compsRes.companies?.length > 0) {
          setCreateForm((prev) => ({ ...prev, company_id: compsRes.companies[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, companyFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetchApi("/platform/users", {
        method: "POST",
        body: JSON.stringify(createForm)
      });
      if (res && res.success) {
        setMessage({ type: "success", text: res.message || "User created successfully!" });
        loadData();
        setCreateForm({
          company_id: companies[0]?.id || "",
          name: "",
          email: "",
          username: "",
          role: "EMPLOYEE",
          password: ""
        });
        setTimeout(() => setCreateOpen(false), 800);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create user" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Network error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !newPassword) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetchApi(`/platform/users/${resetUser.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ new_password: newPassword })
      });
      if (res && res.success) {
        setMessage({ type: "success", text: "Password reset successfully!" });
        setTimeout(() => setResetUser(null), 800);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to reset password" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Network error" });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserActive = async (u: UserItem) => {
    try {
      const res = await fetchApi(`/platform/users/${u.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !u.is_active })
      });
      if (res && res.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Cross-Tenant Users</h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized user management across all registered tenant companies with fixed roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCreateOpen(true); setMessage(null); }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create User</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors cursor-pointer shadow-2xs"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadData()}
            placeholder="Search by name, email, username..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>

        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Fixed Roles</option>
          {FIXED_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Users Table - Clean White & Blue */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User Details</th>
                <th className="py-3.5 px-4">Assigned Company</th>
                <th className="py-3.5 px-4">Fixed Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 text-xs">{u.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{u.username} • {u.email}</p>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-medium text-slate-900">{u.company_name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{u.company_id}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      u.role === "SuperAdmin"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : u.role === "OWNER"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : u.role === "ACCOUNTANT"
                        ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                        : u.role === "MANAGER"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}>
                      {u.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      u.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      {u.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => { setResetUser(u); setNewPassword(""); setMessage(null); }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer border border-slate-200"
                      title="Reset Password"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    {u.role !== "SuperAdmin" && (
                      <button
                        onClick={() => toggleUserActive(u)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          u.is_active
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    No matching users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span>Create Tenant User</span>
              </h3>
              <button onClick={() => setCreateOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Select Company</label>
                <select
                  value={createForm.company_id}
                  onChange={(e) => setCreateForm({ ...createForm, company_id: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  required
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Username / Login ID</label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="ramesh_patel"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Fixed Predefined Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    {FIXED_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Password</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  {actionLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span>Reset User Password</span>
              </h3>
              <button onClick={() => setResetUser(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <p className="text-slate-600">
                Set new password for <span className="font-bold text-slate-900">{resetUser.name}</span> ({resetUser.username})
              </p>

              <div>
                <label className="block text-slate-600 font-bold mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  {actionLoading ? "Updating..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
