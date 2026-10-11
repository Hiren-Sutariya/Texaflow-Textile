"use client";

import { useState, useMemo } from "react";
import {
  Wallet,
  Coins,
  Search,
  Plus,
  Filter,
  Check,
  X,
  FileSpreadsheet,
  Download,
  Building2,
  UserCheck,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Printer,
  ChevronDown
} from "lucide-react";

export interface WorkerPayoutRecord {
  id: string;
  worker_id: string;
  worker_name: string;
  role: "Karigar (Master)" | "Helper Worker" | "Shift Master" | "Maintenance";
  khata_no: string;
  machine_no: string;
  unit: "Unit 1" | "Unit 2 (Kadodara)";
  shift_output_pcs: number;
  total_stitches: number;
  gross_earning: number;
  advance_deducted: number;
  net_payable: number;
  payout_mode: "Cash" | "UPI / QR" | "Bank Transfer (NEFT)";
  status: "Paid" | "Pending Disbursal" | "Partial Approval";
  payout_date: string;
  voucher_no: string;
}

const initialPayoutRecords: WorkerPayoutRecord[] = [
  {
    id: "WP-1001",
    worker_id: "EMP-01",
    worker_name: "Mukeshbhai Karigar",
    role: "Karigar (Master)",
    khata_no: "KHT-402",
    machine_no: "M-01 (High Speed)",
    unit: "Unit 1",
    shift_output_pcs: 1850,
    total_stitches: 485000,
    gross_earning: 14550,
    advance_deducted: 2000,
    net_payable: 12550,
    payout_mode: "Cash",
    status: "Paid",
    payout_date: "2026-10-09",
    voucher_no: "WPV-2026-089"
  },
  {
    id: "WP-1002",
    worker_id: "EMP-02",
    worker_name: "Rameshbhai Helper",
    role: "Helper Worker",
    khata_no: "KHT-405",
    machine_no: "M-02",
    unit: "Unit 1",
    shift_output_pcs: 1400,
    total_stitches: 320000,
    gross_earning: 9600,
    advance_deducted: 1000,
    net_payable: 8600,
    payout_mode: "UPI / QR",
    status: "Pending Disbursal",
    payout_date: "2026-10-10",
    voucher_no: "WPV-2026-090"
  },
  {
    id: "WP-1003",
    worker_id: "EMP-03",
    worker_name: "Sanjay Master",
    role: "Shift Master",
    khata_no: "KHT-310",
    machine_no: "M-04 (Multi-Color)",
    unit: "Unit 2 (Kadodara)",
    shift_output_pcs: 2200,
    total_stitches: 650000,
    gross_earning: 19500,
    advance_deducted: 3000,
    net_payable: 16500,
    payout_mode: "Bank Transfer (NEFT)",
    status: "Paid",
    payout_date: "2026-10-08",
    voucher_no: "WPV-2026-085"
  },
  {
    id: "WP-1004",
    worker_id: "EMP-04",
    worker_name: "Dineshbhai Karigar",
    role: "Karigar (Master)",
    khata_no: "KHT-412",
    machine_no: "M-03",
    unit: "Unit 2 (Kadodara)",
    shift_output_pcs: 1650,
    total_stitches: 410000,
    gross_earning: 12300,
    advance_deducted: 1500,
    net_payable: 10800,
    payout_mode: "Cash",
    status: "Pending Disbursal",
    payout_date: "2026-10-10",
    voucher_no: "WPV-2026-091"
  }
];

export default function WorkerPayoutPage() {
  const [records, setRecords] = useState<WorkerPayoutRecord[]>(initialPayoutRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);

  // New Voucher Form State
  const [formWorkerName, setFormWorkerName] = useState("");
  const [formRole, setFormRole] = useState<WorkerPayoutRecord["role"]>("Karigar (Master)");
  const [formKhataNo, setFormKhataNo] = useState("");
  const [formGross, setFormGross] = useState("");
  const [formAdvance, setFormAdvance] = useState("");
  const [formMode, setFormMode] = useState<WorkerPayoutRecord["payout_mode"]>("Cash");

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.worker_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.khata_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.voucher_no.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = roleFilter === "All" || r.role === roleFilter;
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [records, searchQuery, roleFilter, statusFilter]);

  const summaryStats = useMemo(() => {
    let pending = 0;
    let paid = 0;
    let totalAdvance = 0;
    records.forEach((r) => {
      totalAdvance += r.advance_deducted;
      if (r.status === "Pending Disbursal") {
        pending += r.net_payable;
      } else if (r.status === "Paid") {
        paid += r.net_payable;
      }
    });
    return { pending, paid, totalAdvance, count: records.length };
  }, [records]);

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWorkerName || !formGross) {
      alert("Please enter Worker Name and Gross Earning.");
      return;
    }
    const gross = parseFloat(formGross) || 0;
    const adv = parseFloat(formAdvance) || 0;
    const net = Math.max(0, gross - adv);
    const newRecord: WorkerPayoutRecord = {
      id: `WP-${Date.now().toString().slice(-4)}`,
      worker_id: `EMP-${Math.floor(Math.random() * 90 + 10)}`,
      worker_name: formWorkerName,
      role: formRole,
      khata_no: formKhataNo || "KHT-101",
      machine_no: "M-01",
      unit: "Unit 1",
      shift_output_pcs: 1200,
      total_stitches: 350000,
      gross_earning: gross,
      advance_deducted: adv,
      net_payable: net,
      payout_mode: formMode,
      status: "Pending Disbursal",
      payout_date: new Date().toISOString().split("T")[0],
      voucher_no: `WPV-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`
    };
    setRecords([newRecord, ...records]);
    setShowModal(false);
    setFormWorkerName("");
    setFormGross("");
    setFormAdvance("");
  };

  const handleMarkPaid = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Paid" } : r))
    );
  };

  return (
    <div className="space-y-4 select-none">
      {/* Page Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              Manufacturing Worker Payout & Karigar Payroll
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage Karigar piece-rates, shift earnings, advances & salary vouchers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Payout Voucher</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Pending Payout</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-amber-600">
            ₹{summaryStats.pending.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Awaiting cash/bank disbursal</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Paid This Month</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600">
            ₹{summaryStats.paid.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Disbursed worker vouchers</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Advances Deducted</span>
            <Coins className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-extrabold text-indigo-600">
            ₹{summaryStats.totalAdvance.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Recovered from worker khata</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Active Vouchers</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {summaryStats.count} Vouchers
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Karigars & Helpers total</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Worker, Khata No, Voucher..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Role:</span>
          </div>
          {["All", "Karigar (Master)", "Helper Worker", "Shift Master"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                roleFilter === role
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Worker Payout Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Voucher / Worker</th>
                <th className="py-3 px-4">Role & Khata</th>
                <th className="py-3 px-4">Machine & Unit</th>
                <th className="py-3 px-4 text-right">Gross Earning</th>
                <th className="py-3 px-4 text-right">Adv. Deducted</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="py-3 px-4">Payout Mode</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    No worker payout records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-extrabold text-slate-900">{r.worker_name}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{r.voucher_no} • {r.payout_date}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-slate-800 font-bold">{r.role}</div>
                      <div className="text-[10px] text-slate-400">{r.khata_no}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-slate-700">{r.machine_no}</div>
                      <div className="text-[10px] text-emerald-600 font-bold">{r.unit}</div>
                    </td>
                    <td className="py-4 px-5 text-right font-bold text-slate-900">
                      ₹{r.gross_earning.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-5 text-right font-bold text-rose-600">
                      -₹{r.advance_deducted.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-5 text-right font-extrabold text-emerald-700 text-sm">
                      ₹{r.net_payable.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {r.payout_mode}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      {r.status === "Paid" ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                          Paid
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 inline-block">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-center">
                      {r.status === "Pending Disbursal" ? (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(r.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          Disburse
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-bold">Settled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Voucher Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Create Worker Payout Voucher</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Worker Name *</label>
                <input
                  type="text"
                  required
                  value={formWorkerName}
                  onChange={(e) => setFormWorkerName(e.target.value)}
                  placeholder="e.g. Mukeshbhai Karigar"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Karigar (Master)">Karigar (Master)</option>
                    <option value="Helper Worker">Helper Worker</option>
                    <option value="Shift Master">Shift Master</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Khata No</label>
                  <input
                    type="text"
                    value={formKhataNo}
                    onChange={(e) => setFormKhataNo(e.target.value)}
                    placeholder="e.g. KHT-402"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Gross Earning (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formGross}
                    onChange={(e) => setFormGross(e.target.value)}
                    placeholder="12000"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Advance Deducted (₹)</label>
                  <input
                    type="number"
                    value={formAdvance}
                    onChange={(e) => setFormAdvance(e.target.value)}
                    placeholder="1500"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={formMode}
                  onChange={(e) => setFormMode(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI / QR">UPI / QR</option>
                  <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
                >
                  Save Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
