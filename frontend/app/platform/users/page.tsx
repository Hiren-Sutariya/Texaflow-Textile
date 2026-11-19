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
import {
  CourtFlowTable,
  CourtFlowBadge,
  CourtFlowActionMenu,
  CourtFlowModal,
  CourtFlowButton,
  CourtFlowInput
} from "@/components/courtflow";

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

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    company_id: "",
    name: "",
    email: "",
    username: "",
    role: "EMPLOYEE",
    password: ""
  });
  const [creating, setCreating] = useState(false);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdTargetUser, setPwdTargetUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [updatingPwd, setUpdatingPwd] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append("search", search);
      if (roleFilter !== "all") q.append("role", roleFilter);
      if (companyFilter !== "all") q.append("company_id", companyFilter);

      const [resUsers, resCompanies] = await Promise.all([
        fetchApi(`/platform/users?${q.toString()}`),
        fetchApi("/platform/companies")
      ]);

      if (resUsers && resUsers.success) {
        setUsers(resUsers.users || []);
      }
      if (resCompanies && resCompanies.success) {
        setCompanies(resCompanies.companies || []);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateUser = async () => {
    if (!createForm.company_id || !createForm.name || !createForm.username || !createForm.password) {
      setFeedback({ type: "error", text: "Please fill in all mandatory fields" });
      return;
    }

    setCreating(true);
    setFeedback(null);
    try {
      const res = await fetchApi("/platform/users", {
        method: "POST",
        body: JSON.stringify(createForm)
      });
      if (res && res.success) {
        setFeedback({ type: "success", text: "User provisioned successfully!" });
        loadData();
        setCreateOpen(false);
        setCreateForm({
          company_id: "",
          name: "",
          email: "",
          username: "",
          role: "EMPLOYEE",
          password: ""
        });
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to create user" });
      }
    } catch (e: any) {
      setFeedback({ type: "error", text: e.message || "Network error" });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (u: UserItem) => {
    const nextActive = !u.is_active;
    try {
      const res = await fetchApi(`/platform/users/${u.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ is_active: nextActive })
      });
      if (res && res.success) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openPasswordReset = (u: UserItem) => {
    setPwdTargetUser(u);
    setNewPassword("");
    setFeedback(null);
    setPwdOpen(true);
  };

  const handleResetPassword = async () => {
    if (!pwdTargetUser || !newPassword || newPassword.length < 6) {
      setFeedback({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setUpdatingPwd(true);
    setFeedback(null);
    try {
      const res = await fetchApi(`/platform/users/${pwdTargetUser.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ new_password: newPassword })
      });
      if (res && res.success) {
        setFeedback({ type: "success", text: "Password successfully reset!" });
        setTimeout(() => setPwdOpen(false), 900);
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to reset password" });
      }
    } catch (e: any) {
      setFeedback({ type: "error", text: e.message || "Network error" });
    } finally {
      setUpdatingPwd(false);
    }
  };

  const columns = [
    {
      key: "user",
      header: "USER IDENTITY",
      render: (u: UserItem) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200">
            {u.name ? u.name[0]?.toUpperCase() : "U"}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{u.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">@{u.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: "company",
      header: "TENANT / COMPANY",
      render: (u: UserItem) => (
        <div>
          <p className="text-xs font-semibold text-slate-800">{u.company_name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{u.company_id}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "FIXED ROLE",
      render: (u: UserItem) => (
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60 uppercase">
          {u.role}
        </span>
      ),
    },
    {
      key: "email",
      header: "EMAIL",
      render: (u: UserItem) => (
        <span className="text-xs text-slate-600">{u.email || "—"}</span>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      render: (u: UserItem) => (
        <CourtFlowBadge
          status={u.is_active ? "active" : "cancelled"}
          label={u.is_active ? "Active" : "Deactivated"}
        />
      ),
    },
    {
      key: "action",
      header: "ACTION",
      className: "text-right",
      render: (u: UserItem) => (
        <CourtFlowActionMenu
          onEdit={() => openPasswordReset(u)}
          onCancel={() => handleToggleStatus(u)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4 w-full pb-8">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, username, email..."
            className="w-full bg-white border border-[#eaecf0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-white border border-[#eaecf0] text-slate-700 text-xs rounded-xl px-3 py-2 shadow-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-[#eaecf0] text-slate-700 text-xs rounded-xl px-3 py-2 shadow-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Roles</option>
            {FIXED_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <CourtFlowButton
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Add User
          </CourtFlowButton>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Users CourtFlow Table */}
      <CourtFlowTable
        columns={columns}
        data={users}
        loading={loading}
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search criteria or role filters."
      />

      {/* CourtFlow Create User Modal */}
      <CourtFlowModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Provision Platform User"
        subtitle="Create an authorized tenant user assigned to a predefined fixed role"
        primaryActionLabel="Create User"
        onPrimaryAction={handleCreateUser}
        isLoading={creating}
        cancelLabel="Cancel"
      >
        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Assign Company</label>
            <select
              value={createForm.company_id}
              onChange={(e) => setCreateForm({ ...createForm, company_id: e.target.value })}
              className="w-full bg-white border border-[#d0d5dd] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">-- Select Company --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Full Name</label>
            <CourtFlowInput
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Username</label>
              <CourtFlowInput
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                placeholder="Unique username"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <CourtFlowInput
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Role</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full bg-white border border-[#d0d5dd] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {FIXED_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Initial Password</label>
              <CourtFlowInput
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Minimum 6 chars"
              />
            </div>
          </div>
        </div>
      </CourtFlowModal>

      {/* Password Reset Modal */}
      <CourtFlowModal
        isOpen={pwdOpen}
        onClose={() => setPwdOpen(false)}
        title="Reset User Password"
        subtitle={`Set a new secure password for ${pwdTargetUser?.name} (@${pwdTargetUser?.username})`}
        primaryActionLabel="Reset Password"
        onPrimaryAction={handleResetPassword}
        isLoading={updatingPwd}
        cancelLabel="Cancel"
      >
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700">New Password</label>
          <CourtFlowInput
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter at least 6 characters"
          />
        </div>
      </CourtFlowModal>
    </div>
  );
}
