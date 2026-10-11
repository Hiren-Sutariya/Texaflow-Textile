"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Check,
  X,
  MoreHorizontal,
  Eye,
  Edit3,
  Trash2,
  UserCheck,
  Cpu,
  Layers,
  Printer,
  Sparkles,
  ArrowUpRight,
  User,
  Calendar,
  Building2
} from "lucide-react";

export interface KarigarIssue {
  id: string;
  slip_code: string;
  karigar_name: string;
  karigar_khata: string;
  karigar_photo?: string;
  design_code: string;
  program_name: string;
  machine_no: string;
  total_pieces: number;
  completed_pieces: number;
  issue_date: string;
  status: "Active In Production" | "Completed" | "Ready / Available";
  notes?: string;
  color_schedules?: {
    color_name: string;
    piece_qty: number;
    thread_details?: string;
  }[];
}

const initialIssues: KarigarIssue[] = [
  {
    id: "iss-1",
    slip_code: "ISS-2026-001",
    karigar_name: "Ramesh Karigar",
    karigar_khata: "KAR-001",
    karigar_photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    design_code: "D-2486",
    program_name: "Rani & Gold Jari Front Patta",
    machine_no: "Machine 1",
    total_pieces: 1090,
    completed_pieces: 872,
    issue_date: "2026-10-05",
    status: "Active In Production",
    notes: "Keep thread tension loose on Needle #4 green thread.",
    color_schedules: [
      { color_name: "Rani (Magenta Pink)", piece_qty: 872, thread_details: "Needle 1-4 Hariom Thread" },
      { color_name: "Ram (Sky Blue)", piece_qty: 218, thread_details: "Silver Metallic Thread" }
    ]
  },
  {
    id: "iss-2",
    slip_code: "ISS-2026-002",
    karigar_name: "Suresh Patel",
    karigar_khata: "KAR-002",
    karigar_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    design_code: "D-1052",
    program_name: "Chaniya Choli Heavy Border",
    machine_no: "Machine 3",
    total_pieces: 850,
    completed_pieces: 850,
    issue_date: "2026-10-02",
    status: "Completed",
    notes: "Completed with zero defects on 12-head machine.",
    color_schedules: [
      { color_name: "Deep Red", piece_qty: 850, thread_details: "Gold Zari + Red Silk Thread" }
    ]
  },
  {
    id: "iss-3",
    slip_code: "ISS-2026-003",
    karigar_name: "Mukesh Verma",
    karigar_khata: "KAR-003",
    karigar_photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    design_code: "D-3301",
    program_name: "Laser Sequence Blouse Cutwork",
    machine_no: "Machine 2",
    total_pieces: 600,
    completed_pieces: 320,
    issue_date: "2026-10-07",
    status: "Active In Production",
    notes: "Requires dual laser head beam check every 100 pcs.",
    color_schedules: [
      { color_name: "Gold / Silver Dual", piece_qty: 600, thread_details: "Multi-Color Sequence Roll" }
    ]
  },
  {
    id: "iss-4",
    slip_code: "ISS-2026-004",
    karigar_name: "Ketan Sharma",
    karigar_khata: "KAR-004",
    karigar_photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    design_code: "D-4112",
    program_name: "Dupatta All-Over Butti",
    machine_no: "Machine 5",
    total_pieces: 1200,
    completed_pieces: 0,
    issue_date: "2026-10-09",
    status: "Ready / Available",
    notes: "Design program loaded on USB. Material staged.",
    color_schedules: [
      { color_name: "Pastel Green", piece_qty: 1200, thread_details: "Viscose Rayon Thread" }
    ]
  }
];

export default function KarigarIssuesPage() {
  const [issues, setIssues] = useState<KarigarIssue[]>(initialIssues);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active In Production" | "Completed" | "Ready / Available">("All");
  const [selectedKarigarFilter, setSelectedKarigarFilter] = useState<string>("All");

  // Dropdown states
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isKarigarFilterOpen, setIsKarigarFilterOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  // Modals
  const [previewIssue, setPreviewIssue] = useState<KarigarIssue | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [formKarigarName, setFormKarigarName] = useState("Ramesh Karigar");
  const [formKarigarKhata, setFormKarigarKhata] = useState("KAR-001");
  const [formDesignCode, setFormDesignCode] = useState("D-2486");
  const [formProgramName, setFormProgramName] = useState("");
  const [formMachineNo, setFormMachineNo] = useState("Machine 1");
  const [formTotalPieces, setFormTotalPieces] = useState<number>(500);
  const [formNotes, setFormNotes] = useState("");

  const karigarDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listeners
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (karigarDropdownRef.current && !karigarDropdownRef.current.contains(event.target as Node)) {
        setIsKarigarFilterOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Summary Metrics
  const totalPiecesIssued = useMemo(() => {
    return issues.reduce((acc, curr) => acc + curr.total_pieces, 0);
  }, [issues]);

  const activeSlipsCount = useMemo(() => {
    return issues.filter((i) => i.status === "Active In Production").length;
  }, [issues]);

  const factoryKarigarsCount = useMemo(() => {
    const set = new Set(issues.map((i) => i.karigar_name));
    return set.size;
  }, [issues]);

  const completedIssuesCount = useMemo(() => {
    return issues.filter((i) => i.status === "Completed").length;
  }, [issues]);

  // Unique Karigars list for filter
  const karigarsList = useMemo(() => {
    const names = Array.from(new Set(issues.map((i) => i.karigar_name)));
    return names;
  }, [issues]);

  // Filtered Issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Status tab filter
      if (statusFilter !== "All" && issue.status !== statusFilter) {
        return false;
      }
      // Karigar dropdown filter
      if (selectedKarigarFilter !== "All" && issue.karigar_name !== selectedKarigarFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = issue.karigar_name.toLowerCase().includes(q);
        const matchesKhata = issue.karigar_khata.toLowerCase().includes(q);
        const matchesDesign = issue.design_code.toLowerCase().includes(q);
        const matchesProgram = issue.program_name.toLowerCase().includes(q);
        const matchesSlip = issue.slip_code.toLowerCase().includes(q);
        const matchesMachine = issue.machine_no.toLowerCase().includes(q);
        return matchesName || matchesKhata || matchesDesign || matchesProgram || matchesSlip || matchesMachine;
      }
      return true;
    });
  }, [issues, statusFilter, selectedKarigarFilter, searchQuery]);

  const handleAddIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKarigarName || !formDesignCode) return;

    const newIssue: KarigarIssue = {
      id: `iss-${Date.now()}`,
      slip_code: `ISS-2026-00${issues.length + 1}`,
      karigar_name: formKarigarName,
      karigar_khata: formKarigarKhata || "KAR-NEW",
      design_code: formDesignCode,
      program_name: formProgramName || "Embroidery Work Program",
      machine_no: formMachineNo,
      total_pieces: Number(formTotalPieces) || 100,
      completed_pieces: 0,
      issue_date: new Date().toISOString().split("T")[0],
      status: "Active In Production",
      notes: formNotes
    };

    setIssues([newIssue, ...issues]);
    setIsAddModalOpen(false);
    // Reset
    setFormProgramName("");
    setFormNotes("");
  };

  const handleDeleteIssue = (id: string) => {
    if (confirm("Are you sure you want to remove this Karigar Issue slip?")) {
      setIssues(issues.filter((i) => i.id !== id));
      if (previewIssue?.id === id) setPreviewIssue(null);
    }
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-12">
      {/* TOP 4 SUMMARY STAT CARDS (2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* CARD 1: TOTAL PIECES ISSUED */}
        <div className="p-3 sm:p-3.5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-emerald-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Pieces Issued
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {totalPiecesIssued.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400">Pcs</span>
          </div>
        </div>

        {/* CARD 2: ACTIVE SLIPS */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-sky-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active Slips
            </span>
            <div className="p-1.5 bg-sky-50 text-sky-700 rounded-xl border border-sky-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {activeSlipsCount}
            </span>
            <span className="text-xs font-bold text-slate-400">Slips</span>
          </div>
        </div>

        {/* CARD 3: FACTORY KARIGARS */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-purple-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Factory Karigars
            </span>
            <div className="p-1.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {factoryKarigarsCount}
            </span>
            <span className="text-xs font-bold text-slate-400">Karigars</span>
          </div>
        </div>

        {/* CARD 4: COMPLETED ISSUES */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-amber-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Completed Issues
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {completedIssuesCount}
            </span>
            <span className="text-xs font-bold text-slate-400">Completed</span>
          </div>
        </div>
      </div>

      {/* UNIFIED SINGLE FILTER & ACTION BAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col xl:flex-row items-center justify-between gap-3">
        {/* LEFT STATUS PILL TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full xl:w-auto no-scrollbar py-0.5">
          {/* ALL WORKERS (409) */}
          <button
            type="button"
            onClick={() => setStatusFilter("All")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === "All"
                ? "bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            All Workers ({issues.length})
          </button>

          {/* ACTIVE IN PRODUCTION (359) */}
          <button
            type="button"
            onClick={() => setStatusFilter("Active In Production")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === "Active In Production"
                ? "bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Active In Production ({issues.filter((i) => i.status === "Active In Production").length})
          </button>

          {/* COMPLETED (48) */}
          <button
            type="button"
            onClick={() => setStatusFilter("Completed")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === "Completed"
                ? "bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Completed ({issues.filter((i) => i.status === "Completed").length})
          </button>

          {/* READY / AVAILABLE */}
          <button
            type="button"
            onClick={() => setStatusFilter("Ready / Available")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === "Ready / Available"
                ? "bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Ready / Available
          </button>
        </div>

        {/* RIGHT ACTION & FILTER CONTROLS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:w-auto justify-end">
          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search worker, program, design..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8.5 pr-8 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* ALL KARIGARS DROPDOWN */}
            <div ref={karigarDropdownRef} className="relative flex-1 sm:flex-none select-none">
              <button

              type="button"
              onClick={() => setIsKarigarFilterOpen(!isKarigarFilterOpen)}
              className={`h-9 px-3 bg-white border rounded-xl text-xs font-bold text-slate-900 flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs focus:outline-none ${
                isKarigarFilterOpen
                  ? "border-emerald-500 ring-2 ring-emerald-500/20"
                  : "border-slate-300 hover:border-emerald-500"
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {selectedKarigarFilter === "All"
                    ? `All Karigars (${karigarsList.length})`
                    : selectedKarigarFilter}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isKarigarFilterOpen ? "rotate-180 text-emerald-600" : ""}`} />
            </button>

            {isKarigarFilterOpen && (
              <div className="absolute left-0 top-11 z-40 min-w-full w-max max-w-[240px] bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto no-scrollbar">
                {/* ALL KARIGARS OPTION CARD */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedKarigarFilter("All");
                    setIsKarigarFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                    selectedKarigarFilter === "All"
                      ? "bg-emerald-50 text-emerald-950 font-extrabold border-emerald-500 shadow-2xs"
                      : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                  }`}
                >
                  <span className="truncate">All Karigars ({karigarsList.length})</span>
                  {selectedKarigarFilter === "All" && (
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 ml-2" />
                  )}
                </button>

                {/* INDIVIDUAL KARIGAR OPTION CARDS */}
                {karigarsList.map((k) => {
                  const isSelected = selectedKarigarFilter === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setSelectedKarigarFilter(k);
                        setIsKarigarFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-emerald-50 text-emerald-950 font-extrabold border-emerald-500 shadow-2xs"
                          : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                      }`}
                    >
                      <span className="truncate">{k}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

            {/* + ADD WORKER ISSUE BUTTON */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 sm:flex-none h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Issue</span>
            </button>

            {/* THREE DOTS (...) BUTTON */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                className="h-9 w-9 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 transition-all cursor-pointer shadow-2xs"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isActionsMenuOpen && (
                <div className="absolute right-0 top-11 z-40 w-44 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-1 animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                      setIsActionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Print Slips</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("All");
                      setSelectedKarigarFilter("All");
                      setIsActionsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DATA TABLE & MOBILE CARD VIEW */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* MOBILE CARD VIEW (< md) - No horizontal scroll */}
        <div className="block md:hidden p-3 sm:p-4 space-y-3 bg-slate-50/50">
          {filteredIssues.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold bg-white rounded-xl border border-slate-200">
              No Karigar Issue slips found matching your filters.
            </div>
          ) : (
            filteredIssues.map((issue, idx) => {
              const progressPct =
                issue.total_pieces > 0
                  ? Math.min(100, Math.round((issue.completed_pieces / issue.total_pieces) * 100))
                  : 0;
              return (
                <div
                  key={issue.id}
                  onClick={() => setPreviewIssue(issue)}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3 active:scale-[0.99] transition-all cursor-pointer hover:border-emerald-300"
                >
                  {/* Top Bar: SR No, Slip Code & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        #{idx + 1}
                      </span>
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {issue.slip_code}
                      </span>
                    </div>
                    {issue.status === "Active In Production" && (
                      <span className="px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200/80 rounded-full text-[10px] font-extrabold shrink-0">
                        Active In Production
                      </span>
                    )}
                    {issue.status === "Completed" && (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-[10px] font-extrabold shrink-0">
                        Completed
                      </span>
                    )}
                    {issue.status === "Ready / Available" && (
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-extrabold shrink-0">
                        Ready / Available
                      </span>
                    )}
                  </div>

                  {/* Karigar & Machine */}
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {issue.karigar_photo ? (
                        <img
                          src={issue.karigar_photo}
                          alt={issue.karigar_name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                          {issue.karigar_name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 text-sm truncate">
                          {issue.karigar_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Khata: {issue.karigar_khata}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold border border-slate-200 shrink-0">
                      {issue.machine_no}
                    </span>
                  </div>

                  {/* Design & Program Details */}
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Design Code</span>
                      <span className="font-mono font-black text-slate-900">{issue.design_code}</span>
                    </div>
                    <div className="text-slate-600 font-medium truncate mt-0.5">
                      {issue.program_name}
                    </div>
                  </div>

                  {/* Production Stats & Progress */}
                  <div className="space-y-1.5 bg-emerald-50/40 rounded-xl p-2.5 border border-emerald-100/70">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold">Progress ({progressPct}%)</span>
                      <span className="font-black text-slate-900">
                        <span className={issue.completed_pieces === issue.total_pieces ? "text-emerald-700 font-extrabold" : "text-slate-800"}>
                          {issue.completed_pieces.toLocaleString()}
                        </span>
                        <span className="text-slate-400 font-normal"> / {issue.total_pieces.toLocaleString()} Pcs</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setPreviewIssue(issue)}
                      className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-700" />
                      <span>View Slip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteIssue(issue.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors cursor-pointer"
                      title="Delete Slip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3.5 w-16">SR NO.</th>
                <th className="px-4 py-3.5">SLIP CODE</th>
                <th className="px-4 py-3.5">KARIGAR NAME</th>
                <th className="px-4 py-3.5">DESIGN / PROGRAM</th>
                <th className="px-4 py-3.5">MACHINE NO</th>
                <th className="px-4 py-3.5 text-right">TOTAL PCS</th>
                <th className="px-4 py-3.5 text-right">COMPLETED</th>
                <th className="px-4 py-3.5">STATUS</th>
                <th className="px-4 py-3.5 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                    No Karigar Issue slips found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue, idx) => (
                  <tr
                    key={issue.id}
                    onClick={() => setPreviewIssue(issue)}
                    className="hover:bg-emerald-50/40 cursor-pointer group"
                  >
                    {/* SR NO */}
                    <td className="px-5 py-4 font-mono text-slate-400 font-bold">
                      #{idx + 1}
                    </td>

                    {/* SLIP CODE */}
                    <td className="px-5 py-4">
                      <span className="font-mono font-extrabold text-slate-900 group-hover:text-emerald-700">
                        {issue.slip_code}
                      </span>
                    </td>

                    {/* KARIGAR NAME */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        {issue.karigar_photo ? (
                          <img
                            src={issue.karigar_photo}
                            alt={issue.karigar_name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                            {issue.karigar_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-extrabold text-slate-900 group-hover:text-emerald-700">
                            {issue.karigar_name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Khata: {issue.karigar_khata}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* DESIGN / PROGRAM */}
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-slate-900">
                        {issue.design_code}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {issue.program_name}
                      </div>
                    </td>

                    {/* MACHINE NO */}
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-[11px] font-bold border border-slate-200">
                        {issue.machine_no}
                      </span>
                    </td>

                    {/* TOTAL PCS */}
                    <td className="px-5 py-4 text-right font-black text-slate-900">
                      {issue.total_pieces.toLocaleString()} Pcs
                    </td>

                    {/* COMPLETED PCS */}
                    <td className="px-5 py-4 text-right font-bold text-slate-700">
                      <span className={issue.completed_pieces === issue.total_pieces ? "text-emerald-600 font-black" : ""}>
                        {issue.completed_pieces.toLocaleString()} Pcs
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      {issue.status === "Active In Production" && (
                        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200/80 rounded-lg text-[11px] font-extrabold inline-block">
                          Active In Production
                        </span>
                      )}
                      {issue.status === "Completed" && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-lg text-[11px] font-extrabold inline-block">
                          Completed
                        </span>
                      )}
                      {issue.status === "Ready / Available" && (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-extrabold inline-block">
                          Ready / Available
                        </span>
                      )}
                    </td>

                    {/* ACTION */}
                    <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewIssue(issue)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="View Slip Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteIssue(issue.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Slip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PREVIEW MODAL FOR KARIGAR ISSUE SLIP */}
      {previewIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto no-scrollbar p-6 relative">
            <button
              onClick={() => setPreviewIssue(null)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-emerald-600">{previewIssue.slip_code}</div>
                <h3 className="text-lg font-black text-slate-900">Karigar Issue Slip Details</h3>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-xs font-bold">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 text-[10px] block">Karigar Name</span>
                  <span className="text-slate-900 text-sm font-extrabold">{previewIssue.karigar_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Khata Number</span>
                  <span className="text-slate-900 text-sm font-extrabold">{previewIssue.karigar_khata}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Design Code</span>
                  <span className="text-emerald-700 text-sm font-extrabold">{previewIssue.design_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Machine Number</span>
                  <span className="text-slate-900 text-sm font-extrabold">{previewIssue.machine_no}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block mb-1">Program Description</span>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-800 border border-slate-200">
                  {previewIssue.program_name}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                  <div className="text-[10px] text-emerald-800 uppercase">Total Issued</div>
                  <div className="text-base font-black text-emerald-950 mt-0.5">{previewIssue.total_pieces} Pcs</div>
                </div>
                <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200/60">
                  <div className="text-[10px] text-sky-800 uppercase">Completed</div>
                  <div className="text-base font-black text-sky-950 mt-0.5">{previewIssue.completed_pieces} Pcs</div>
                </div>
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/60">
                  <div className="text-[10px] text-purple-800 uppercase">Issue Date</div>
                  <div className="text-xs font-black text-purple-950 mt-1">{previewIssue.issue_date}</div>
                </div>
              </div>

              {previewIssue.notes && (
                <div>
                  <span className="text-slate-400 text-[10px] block mb-1">Special Notes & Instructions</span>
                  <div className="p-3 bg-amber-50/80 rounded-xl text-amber-900 border border-amber-200/80 italic font-medium">
                    "{previewIssue.notes}"
                  </div>
                </div>
              )}

              {previewIssue.color_schedules && previewIssue.color_schedules.length > 0 && (
                <div>
                  <span className="text-slate-400 text-[10px] block mb-1.5">Color Lot Breakdown</span>
                  <div className="space-y-1.5">
                    {previewIssue.color_schedules.map((c, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="font-extrabold text-slate-800">{c.color_name}</span>
                        <span className="font-mono text-emerald-700 font-bold">{c.piece_qty} Pcs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewIssue(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW KARIGAR ISSUE SLIP MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Add New Karigar Issue Slip</h3>
                <p className="text-xs text-slate-500">Allocate new production pieces to a worker</p>
              </div>
            </div>

            <form onSubmit={handleAddIssue} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Karigar Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Karigar"
                  value={formKarigarName}
                  onChange={(e) => setFormKarigarName(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Design Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. D-2486"
                    value={formDesignCode}
                    onChange={(e) => setFormDesignCode(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Machine Number</label>
                  <input
                    type="text"
                    placeholder="e.g. Machine 1"
                    value={formMachineNo}
                    onChange={(e) => setFormMachineNo(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Program / Work Description</label>
                <input
                  type="text"
                  placeholder="e.g. Rani & Gold Jari Front Patta"
                  value={formProgramName}
                  onChange={(e) => setFormProgramName(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Pieces Issued *</label>
                  <input
                    type="number"
                    placeholder="500"
                    value={formTotalPieces}
                    onChange={(e) => setFormTotalPieces(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Khata Number</label>
                  <input
                    type="text"
                    placeholder="e.g. KAR-001"
                    value={formKarigarKhata}
                    onChange={(e) => setFormKarigarKhata(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes / Instructions</label>
                <textarea
                  placeholder="Add special instructions for shift..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-2xs transition-all active:scale-95"
                >
                  Save Issue Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
