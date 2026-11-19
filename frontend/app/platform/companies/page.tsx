"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Users,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface CompanyItem {
  id: string;
  name: string;
  legal_name: string;
  owner_name: string;
  email: string;
  phone: string;
  city_state: string;
  gstin: string;
  pan: string;
  status: string;
  user_count: number;
  created_at?: string;
  subscription?: {
    plan_id: string;
    plan_name: string;
    status: string;
    billing_cycle: string;
    trial_ends_at?: string;
  };
}

export default function PlatformCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedComp, setSelectedComp] = useState<CompanyItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    owner_name: "",
    phone: "",
    email: "",
    gstin: "",
    pan: "",
    city_state: ""
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append("search", search);
      if (statusFilter !== "all") q.append("status", statusFilter);

      const res = await fetchApi(`/platform/companies?${q.toString()}`);
      if (res && res.success) {
        setCompanies(res.companies || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCompanies();
  };

  const openEditModal = (comp: CompanyItem) => {
    setSelectedComp(comp);
    setEditFormData({
      name: comp.name || "",
      owner_name: comp.owner_name || "",
      phone: comp.phone || "",
      email: comp.email || "",
      gstin: comp.gstin || "",
      pan: comp.pan || "",
      city_state: comp.city_state || ""
    });
    setMessage(null);
    setEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!selectedComp) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetchApi(`/platform/companies/${selectedComp.id}`, {
        method: "PUT",
        body: JSON.stringify(editFormData)
      });
      if (res && res.success) {
        setMessage({ type: "success", text: "Company profile updated successfully!" });
        loadCompanies();
        setTimeout(() => setEditModalOpen(false), 800);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update profile" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (comp: CompanyItem) => {
    const nextStatus = comp.status === "active" ? "suspended" : "active";
    const confirmMsg = nextStatus === "suspended"
      ? `Are you sure you want to SUSPEND '${comp.name}'? All user mutations will be immediately blocked.`
      : `Reactivate company '${comp.name}'?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetchApi(`/platform/companies/${comp.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus })
      });
      if (res && res.success) {
        loadCompanies();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Enterprise Tenants</h1>
          <p className="text-xs text-slate-500 mt-1">
            Centrally manage company profiles, status, users, and subscription tiers.
          </p>
        </div>

        <button
          onClick={loadCompanies}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name, owner, phone, GSTIN..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </form>

        <div className="flex items-center gap-2">
          {["all", "active", "trialing", "suspended"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-2xs ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Companies Table - Clean White & Blue */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Company Details</th>
                <th className="py-3.5 px-4">Contact & Location</th>
                <th className="py-3.5 px-4">Tax & Legal</th>
                <th className="py-3.5 px-4">Subscription Plan</th>
                <th className="py-3.5 px-4">Users</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 text-xs">{c.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.id}</p>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="text-slate-900 font-medium">{c.owner_name}</p>
                    <p className="text-[11px] text-slate-500">{c.phone || c.email || "No contact"}</p>
                    {c.city_state && <p className="text-[10px] text-slate-400">{c.city_state}</p>}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <p className="text-slate-700">GSTIN: {c.gstin || "Unregistered"}</p>
                    <p className="text-slate-400">PAN: {c.pan || "—"}</p>
                  </td>

                  <td className="py-3.5 px-4">
                    {c.subscription ? (
                      <div>
                        <span className="font-bold text-blue-700 text-xs">
                          {c.subscription.plan_name}
                        </span>
                        <p className="text-[10px] text-slate-500 capitalize">
                          {c.subscription.billing_cycle} • {c.subscription.status}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">No active plan</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-slate-700 font-bold">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>{c.user_count}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      c.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : c.status === "suspended"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {c.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer border border-slate-200"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleStatus(c)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        c.status === "active"
                          ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {c.status === "active" ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No matching companies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && selectedComp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Edit Company Profile</h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
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

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Company / Firm Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Owner / Proprietor Name</label>
                <input
                  type="text"
                  value={editFormData.owner_name}
                  onChange={(e) => setEditFormData({ ...editFormData, owner_name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={editFormData.gstin}
                    onChange={(e) => setEditFormData({ ...editFormData, gstin: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">PAN</label>
                  <input
                    type="text"
                    value={editFormData.pan}
                    onChange={(e) => setEditFormData({ ...editFormData, pan: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">City & State</label>
                <input
                  type="text"
                  value={editFormData.city_state}
                  onChange={(e) => setEditFormData({ ...editFormData, city_state: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
