"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Filter,
  RefreshCw,
  Users,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  ShieldAlert,
  ArrowUpRight,
  Plus
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

  const columns = [
    {
      key: "name",
      header: "COMPANY DETAILS",
      render: (c: CompanyItem) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200">
            {c.name ? c.name[0]?.toUpperCase() : "C"}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{c.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">{c.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "owner",
      header: "OWNER & CONTACT",
      render: (c: CompanyItem) => (
        <div>
          <p className="text-xs font-semibold text-slate-800">{c.owner_name}</p>
          <p className="text-[11px] text-slate-400">{c.phone || c.email || "No contact"}</p>
        </div>
      ),
    },
    {
      key: "tax",
      header: "GSTIN / PAN",
      render: (c: CompanyItem) => (
        <div className="font-mono text-[11px] text-slate-600">
          <p>GSTIN: {c.gstin || "Unregistered"}</p>
          <p className="text-slate-400">PAN: {c.pan || "—"}</p>
        </div>
      ),
    },
    {
      key: "plan",
      header: "SUBSCRIPTION",
      render: (c: CompanyItem) => (
        <div>
          {c.subscription ? (
            <>
              <span className="font-semibold text-emerald-700 text-xs">
                {c.subscription.plan_name}
              </span>
              <p className="text-[10px] text-slate-400 capitalize">
                {c.subscription.billing_cycle} • {c.subscription.status}
              </p>
            </>
          ) : (
            <span className="text-slate-400 text-xs">No active plan</span>
          )}
        </div>
      ),
    },
    {
      key: "users",
      header: "USERS",
      render: (c: CompanyItem) => (
        <span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>{c.user_count}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      render: (c: CompanyItem) => (
        <CourtFlowBadge
          status={c.status}
          label={c.status === "active" ? "Active" : c.status === "suspended" ? "Suspended" : "Trial"}
        />
      ),
    },
    {
      key: "action",
      header: "ACTION",
      className: "text-right",
      render: (c: CompanyItem) => (
        <CourtFlowActionMenu
          onEdit={() => openEditModal(c)}
          onCancel={() => toggleStatus(c)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4 w-full pb-8">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name, owner, phone, GSTIN..."
            className="w-full bg-white border border-[#eaecf0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["all", "active", "trialing", "suspended"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors shadow-xs ${
                statusFilter === st
                  ? "bg-[#12b76a] text-white"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Companies CourtFlow Table */}
      <CourtFlowTable
        columns={columns}
        data={companies}
        loading={loading}
        emptyTitle="No companies found"
        emptyDescription="Try adjusting your search query or status filter."
      />

      {/* CourtFlow Edit Modal */}
      <CourtFlowModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Company Profile"
        subtitle={`Configure legal entity details for ${selectedComp?.name}`}
        primaryActionLabel="Save Changes"
        onPrimaryAction={handleSaveProfile}
        isLoading={saving}
        cancelLabel="Cancel"
      >
        <div className="space-y-4">
          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Company Name</label>
            <CourtFlowInput
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              placeholder="e.g. Om Sai Enterprise"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Owner Name</label>
              <CourtFlowInput
                value={editFormData.owner_name}
                onChange={(e) => setEditFormData({ ...editFormData, owner_name: e.target.value })}
                placeholder="Full Name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Phone</label>
              <CourtFlowInput
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="10 digit phone"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">GSTIN</label>
              <CourtFlowInput
                value={editFormData.gstin}
                onChange={(e) => setEditFormData({ ...editFormData, gstin: e.target.value })}
                placeholder="15-digit GSTIN"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">PAN</label>
              <CourtFlowInput
                value={editFormData.pan}
                onChange={(e) => setEditFormData({ ...editFormData, pan: e.target.value })}
                placeholder="PAN Number"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">City / State</label>
            <CourtFlowInput
              value={editFormData.city_state}
              onChange={(e) => setEditFormData({ ...editFormData, city_state: e.target.value })}
              placeholder="Surat, Gujarat"
            />
          </div>
        </div>
      </CourtFlowModal>
    </div>
  );
}
