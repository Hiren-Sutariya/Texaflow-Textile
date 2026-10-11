"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Trash2,
  Building2,
  X,
  Check,
  Calendar,
  Edit3
} from "lucide-react";

export interface Party {
  id: string;
  srNo: number;
  name: string;
  mobile: string;
  city: string;
  gstin: string;
  credit_days: number;
  join_date: string;
}

const getTodayFormatted = () => {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, "0");
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const y = today.getFullYear();
  return `${d}/${m}/${y}`;
};

const initialParties: Party[] = [
  {
    id: "p-101",
    srNo: 1,
    name: "ABC Tex Fabrics",
    mobile: "+91 98765 43210",
    city: "Surat",
    gstin: "24AAAFA1234A1Z5",
    credit_days: 30,
    join_date: "25/09/2026"
  },
  {
    id: "p-102",
    srNo: 2,
    name: "Royal Fashion House",
    mobile: "+91 98251 99887",
    city: "Ahmedabad",
    gstin: "24BBBFR9876B1Z2",
    credit_days: 15,
    join_date: "28/09/2026"
  },
  {
    id: "p-103",
    srNo: 3,
    name: "Shree Ram Textiles",
    mobile: "+91 97230 44332",
    city: "Surat",
    gstin: "24CCCFS5544C1Z9",
    credit_days: 30,
    join_date: "01/10/2026"
  }
];

const formatMobileNumber = (val: string): string => {
  if (!val || val === "-") return "-";
  const digits = val.replace(/\D/g, "");
  if (!digits) return val;

  let num = digits;
  if (num.startsWith("91") && num.length === 12) {
    num = num.slice(2);
  }

  if (num.length === 10) {
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }

  if (num.length > 5 && num.length < 10) {
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }

  if (val.startsWith("+91")) return val;
  return `+91 ${val}`;
};

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>(initialParties);
  const [search, setSearch] = useState("");

  // Edit Party Inline State
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [editPartyData, setEditPartyData] = useState<{
    name: string;
    mobile: string;
    city: string;
    gstin: string;
    credit_days: number | "";
    join_date: string;
  }>({
    name: "",
    mobile: "",
    city: "Surat",
    gstin: "",
    credit_days: 30,
    join_date: ""
  });

  // Load parties from localStorage with auto-purge of extra test parties
  useEffect(() => {
    try {
      const isCleaned = localStorage.getItem("parties_cleaned_v3");
      const saved = localStorage.getItem("app_parties");
      if (!isCleaned) {
        saveParties(initialParties);
        localStorage.setItem("parties_cleaned_v3", "true");
      } else if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setParties(parsed);
        } else {
          saveParties(initialParties);
        }
      } else {
        saveParties(initialParties);
      }
    } catch (e) {
      console.error("Error loading app_parties:", e);
    }
  }, []);

  const saveParties = (newPartiesList: Party[]) => {
    setParties(newPartiesList);
    try {
      localStorage.setItem("app_parties", JSON.stringify(newPartiesList));
      localStorage.setItem("app_parties_list", JSON.stringify(newPartiesList));
      localStorage.removeItem("parties_register_data");
      window.dispatchEvent(new Event("app_data_update"));
    } catch (e) {
      console.error("Error saving app_parties:", e);
    }
  };

  const handleResetToDefaultParties = () => {
    if (confirm("Reset to default 3 Registered Parties?")) {
      saveParties(initialParties);
    }
  };

  // Inline Add New Party State
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [newParty, setNewParty] = useState({
    name: "",
    mobile: "",
    city: "Surat",
    gstin: "",
    credit_days: 30 as number | "",
    join_date: getTodayFormatted()
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const editInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const digitQuery = q.replace(/\D/g, "");
      const partyMobileDigits = p.mobile.replace(/\D/g, "");

      return (
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.gstin.toLowerCase().includes(q) ||
        p.mobile.toLowerCase().includes(q) ||
        (digitQuery.length > 0 && partyMobileDigits.includes(digitQuery))
      );
    });
  }, [parties, search]);

  const handleSaveNewParty = () => {
    if (!newParty.name.trim()) {
      alert("⚠️ Please enter Party Name!");
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
      return;
    }

    const nextSrNo = parties.length > 0 ? Math.max(...parties.map((p) => p.srNo)) + 1 : 1;
    const added: Party = {
      id: `p-${Date.now()}`,
      srNo: nextSrNo,
      name: newParty.name.trim(),
      mobile: formatMobileNumber(newParty.mobile.trim()),
      city: newParty.city.trim() || "Surat",
      gstin: newParty.gstin.trim() || "-",
      credit_days: Number(newParty.credit_days) || 30,
      join_date: newParty.join_date.trim() || getTodayFormatted()
    };

    saveParties([added, ...parties]);
    setIsAddingInline(false);
    setNewParty({
      name: "",
      mobile: "",
      city: "Surat",
      gstin: "",
      credit_days: 30,
      join_date: getTodayFormatted()
    });
  };

  // Keyboard navigation on Enter key for Add Mode
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else {
        handleSaveNewParty();
      }
    }
  };

  // Keyboard navigation on Enter key for Edit Mode
  const handleEditKeyDown = (e: React.KeyboardEvent, index: number, partyId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index < 5) {
        editInputRefs.current[index + 1]?.focus();
      } else {
        handleSaveEdit(partyId);
      }
    }
  };

  const handleDeleteParty = (id: string) => {
    if (confirm("Are you sure you want to delete this Party?")) {
      saveParties(parties.filter((p) => p.id !== id));
    }
  };

  const handleStartEdit = (p: Party) => {
    setEditingPartyId(p.id);
    setEditPartyData({
      name: p.name,
      mobile: p.mobile === "-" ? "" : p.mobile,
      city: p.city,
      gstin: p.gstin === "-" ? "" : p.gstin,
      credit_days: p.credit_days || 30,
      join_date: p.join_date || getTodayFormatted()
    });
    setTimeout(() => editInputRefs.current[0]?.focus(), 50);
  };

  const handleSaveEdit = (id: string) => {
    if (!editPartyData.name.trim()) {
      alert("⚠️ Please enter Party Name!");
      setTimeout(() => editInputRefs.current[0]?.focus(), 50);
      return;
    }

    saveParties(
      parties.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            name: editPartyData.name.trim(),
            mobile: formatMobileNumber(editPartyData.mobile.trim()),
            city: editPartyData.city.trim() || "Surat",
            gstin: editPartyData.gstin.trim() || "-",
            credit_days: Number(editPartyData.credit_days) || 30,
            join_date: editPartyData.join_date.trim() || getTodayFormatted()
          };
        }
        return p;
      })
    );

    setEditingPartyId(null);
  };

  return (
    <div className="space-y-5 text-xs font-sans pb-12">
      {/* MAIN TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Header Search & Actions */}
        <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">Party Master Directory</h2>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Party Name, City, GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleResetToDefaultParties}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border border-slate-200"
              title="Reset to 3 Standard Registered Parties"
            >
              <span>Reset 3 Parties</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAddingInline(true);
                setTimeout(() => inputRefs.current[0]?.focus(), 50);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Party</span>
            </button>
          </div>
        </div>

        {/* PARTY DIRECTORY TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse divide-y divide-slate-100 min-w-[850px]">
            <thead className="bg-slate-50/90 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-center w-16">SR NO.</th>
                <th className="py-3 px-5">PARTY NAME</th>
                <th className="py-3 px-4">MOBILE NO.</th>
                <th className="py-3 px-4">CITY</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4 text-center">CREDIT DAYS</th>
                <th className="py-3 px-4 text-center">JOIN DATE</th>
                <th className="py-3 px-4 text-center w-28">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
              {/* INLINE ADD NEW PARTY ROW */}
              {isAddingInline && (
                <tr className="bg-blue-50/60 border-y-2 border-blue-500 transition-all">
                  <td className="py-3 px-4 text-center font-bold text-blue-700">NEW</td>
                  <td className="py-2.5 px-4">
                    <input
                      ref={(el) => { inputRefs.current[0] = el; }}
                      type="text"
                      placeholder="Party Name *"
                      value={newParty.name}
                      onChange={(e) => setNewParty({ ...newParty, name: e.target.value })}
                      onKeyDown={(e) => handleKeyDown(e, 0)}
                      className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                      autoFocus
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <input
                      ref={(el) => { inputRefs.current[1] = el; }}
                      type="text"
                      placeholder="+91 98980 00000"
                      value={newParty.mobile}
                      onChange={(e) => setNewParty({ ...newParty, mobile: e.target.value })}
                      onKeyDown={(e) => handleKeyDown(e, 1)}
                      className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <input
                      ref={(el) => { inputRefs.current[2] = el; }}
                      type="text"
                      placeholder="City"
                      value={newParty.city}
                      onChange={(e) => setNewParty({ ...newParty, city: e.target.value })}
                      onKeyDown={(e) => handleKeyDown(e, 2)}
                      className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <input
                      ref={(el) => { inputRefs.current[3] = el; }}
                      type="text"
                      placeholder="GSTIN"
                      value={newParty.gstin}
                      onChange={(e) => setNewParty({ ...newParty, gstin: e.target.value })}
                      onKeyDown={(e) => handleKeyDown(e, 3)}
                      className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <input
                      ref={(el) => { inputRefs.current[4] = el; }}
                      type="number"
                      placeholder="30"
                      value={newParty.credit_days}
                      onChange={(e) => setNewParty({ ...newParty, credit_days: e.target.value === "" ? "" : Number(e.target.value) })}
                      onKeyDown={(e) => handleKeyDown(e, 4)}
                      className="w-16 text-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <input
                      ref={(el) => { inputRefs.current[5] = el; }}
                      type="text"
                      value={newParty.join_date}
                      onChange={(e) => setNewParty({ ...newParty, join_date: e.target.value })}
                      onKeyDown={(e) => handleKeyDown(e, 5)}
                      className="w-24 text-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSaveNewParty}
                        className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingInline(false)}
                        className="p-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {filteredParties.map((p) => {
                const isEditing = editingPartyId === p.id;
                if (isEditing) {
                  return (
                    <tr key={p.id} className="bg-amber-50/50 border-y-2 border-amber-400 transition-all">
                      <td className="py-3 px-4 text-center font-bold text-amber-700">{p.srNo}</td>
                      <td className="py-2.5 px-4">
                        <input
                          ref={(el) => { editInputRefs.current[0] = el; }}
                          type="text"
                          value={editPartyData.name}
                          onChange={(e) => setEditPartyData({ ...editPartyData, name: e.target.value })}
                          onKeyDown={(e) => handleEditKeyDown(e, 0, p.id)}
                          className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                          autoFocus
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          ref={(el) => { editInputRefs.current[1] = el; }}
                          type="text"
                          value={editPartyData.mobile}
                          onChange={(e) => setEditPartyData({ ...editPartyData, mobile: e.target.value })}
                          onKeyDown={(e) => handleEditKeyDown(e, 1, p.id)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          ref={(el) => { editInputRefs.current[2] = el; }}
                          type="text"
                          value={editPartyData.city}
                          onChange={(e) => setEditPartyData({ ...editPartyData, city: e.target.value })}
                          onKeyDown={(e) => handleEditKeyDown(e, 2, p.id)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          ref={(el) => { editInputRefs.current[3] = el; }}
                          type="text"
                          value={editPartyData.gstin}
                          onChange={(e) => setEditPartyData({ ...editPartyData, gstin: e.target.value })}
                          onKeyDown={(e) => handleEditKeyDown(e, 3, p.id)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          ref={(el) => { editInputRefs.current[4] = el; }}
                          type="number"
                          value={editPartyData.credit_days}
                          onChange={(e) => setEditPartyData({ ...editPartyData, credit_days: e.target.value === "" ? "" : Number(e.target.value) })}
                          onKeyDown={(e) => handleEditKeyDown(e, 4, p.id)}
                          className="w-16 text-center px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          ref={(el) => { editInputRefs.current[5] = el; }}
                          type="text"
                          value={editPartyData.join_date}
                          onChange={(e) => setEditPartyData({ ...editPartyData, join_date: e.target.value })}
                          onKeyDown={(e) => handleEditKeyDown(e, 5, p.id)}
                          className="w-24 text-center px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(p.id)}
                            className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg text-xs hover:bg-amber-700 transition-colors cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPartyId(null)}
                            className="p-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-4 px-5 text-center font-bold text-slate-500">{p.srNo}</td>
                    <td className="py-4 px-5 font-extrabold text-slate-900 text-xs sm:text-sm">{p.name}</td>
                    <td className="py-4 px-5 font-mono font-bold text-slate-700">{formatMobileNumber(p.mobile)}</td>
                    <td className="py-4 px-5 font-medium text-slate-800">{p.city}</td>
                    <td className="py-4 px-5 font-mono text-slate-600 text-[11px]">{p.gstin || "-"}</td>
                    <td className="py-4 px-5 text-center">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-extrabold rounded-lg text-[10px] border border-blue-100/80 inline-block">
                        {p.credit_days || 30} Days
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center text-slate-500 font-medium text-[11px]">{p.join_date}</td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Party"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteParty(p.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Party"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
