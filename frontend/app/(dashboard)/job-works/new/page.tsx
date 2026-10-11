"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, CheckCircle2, FileText, Printer, Palette, Sparkles, Layers } from "lucide-react";

interface ColorThreadSchedule {
  color_name: string;
  piece_qty: number;
  needle_1: string;
  needle_2: string;
  needle_3: string;
  needle_4: string;
  needle_5: string;
  needle_6: string;
}

export default function NewJobWorkPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");

  // Job Card Header Information (Exact Surat Factory Job Card Format)
  const [partyName, setPartyName] = useState("Hari Har");
  const [designNo, setDesignNo] = useState("2486");
  const [stitchesCount, setStitchesCount] = useState(25000);
  const [totalPieces, setTotalPieces] = useState(1090);
  const [machineNoParts, setMachineNoParts] = useState("BLS + Front + Back - Patta");
  const [entryDate, setEntryDate] = useState("2026-09-19");
  const [operatorName, setOperatorName] = useState("Ramesh Karigar");
  const [shiftType, setShiftType] = useState("Day Shift");
  const [notes, setNotes] = useState("Keep tension loose on Needle #4 green thread.");

  // Color Lots & Needle Thread Schedule Grid
  const [colorSchedules, setColorSchedules] = useState<ColorThreadSchedule[]>([
    {
      color_name: "Rani (Magenta Pink)",
      piece_qty: 872,
      needle_1: "1. 370 - Hariom",
      needle_2: "2. 351 - Hariom",
      needle_3: "3. 6074 - Hariom",
      needle_4: "4. 580 - Green",
      needle_5: "5. Coco - 24",
      needle_6: "6. Gold Jari 250D"
    },
    {
      color_name: "Ram (Sky Blue)",
      piece_qty: 218,
      needle_1: "1. 370 - Hariom",
      needle_2: "2. 351 - Hariom",
      needle_3: "3. 6074 - Hariom",
      needle_4: "4. 580 - Green",
      needle_5: "5. Coco - 24",
      needle_6: "6. Silver Metallic"
    }
  ]);

  const handleAddColorRow = () => {
    setColorSchedules([
      ...colorSchedules,
      {
        color_name: "",
        piece_qty: 0,
        needle_1: "",
        needle_2: "",
        needle_3: "",
        needle_4: "",
        needle_5: "",
        needle_6: ""
      }
    ]);
  };

  const handleRemoveColorRow = (index: number) => {
    setColorSchedules(colorSchedules.filter((_, i) => i !== index));
  };

  const handleColorRowChange = (index: number, field: keyof ColorThreadSchedule, value: any) => {
    const updated = [...colorSchedules];
    updated[index] = { ...updated[index], [field]: value };
    setColorSchedules(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Job Card for Party "${partyName}" (Design #${designNo}) saved successfully! Total Pieces: ${totalPieces}`);
    router.push("/job-works");
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Action Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href="/job-works" className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-xs font-bold text-slate-900">Job Card Creation & Thread Schedule Entry</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "form" ? "bg-blue-600 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Job Card Form Entry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "preview" ? "bg-blue-600 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Digital Paper Slip Preview
          </button>
        </div>
      </div>

      {/* FORM ENTRY TAB */}
      {activeTab === "form" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header Card Information */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              1. Job Card Header Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Party's Name (Vepari)</label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Hari Har / ABC Tex"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Design No.</label>
                <input
                  type="text"
                  value={designNo}
                  onChange={(e) => setDesignNo(e.target.value)}
                  placeholder="e.g. 2486"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Stitches Count</label>
                <input
                  type="number"
                  value={stitchesCount}
                  onChange={(e) => setStitchesCount(Number(e.target.value))}
                  placeholder="e.g. 25000"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Total Pieces</label>
                <input
                  type="number"
                  value={totalPieces}
                  onChange={(e) => setTotalPieces(Number(e.target.value))}
                  placeholder="e.g. 1090"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-emerald-700 font-extrabold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Machine Specs / Parts (e.g. BLS+front+back-patta)</label>
                <input
                  type="text"
                  value={machineNoParts}
                  onChange={(e) => setMachineNoParts(e.target.value)}
                  placeholder="e.g. BLS + front + back - patta"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Job Card Date</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Shift Type</label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="Day Shift">Day Shift</option>
                  <option value="Night Shift">Night Shift</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Operator / Karigar Name</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="e.g. Ramesh Karigar"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* 2. Color Lots & Needle Thread Schedule Grid */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-600" />
                2. Fabric Color Lots & Needle Thread Cone Schedule
              </h2>
              <button
                type="button"
                onClick={handleAddColorRow}
                className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Color Lot Row
              </button>
            </div>

            <div className="space-y-4">
              {colorSchedules.map((row, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 text-xs font-medium">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Fabric Color Name (e.g. Rani / Ram)</label>
                        <input
                          type="text"
                          value={row.color_name}
                          onChange={(e) => handleColorRowChange(idx, "color_name", e.target.value)}
                          placeholder="e.g. Rani 872 / Ram 218"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Pieces Qty for this Color</label>
                        <input
                          type="number"
                          value={row.piece_qty}
                          onChange={(e) => handleColorRowChange(idx, "piece_qty", Number(e.target.value))}
                          placeholder="e.g. 872 pcs"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-emerald-700 font-bold"
                        />
                      </div>
                    </div>
                    {colorSchedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColorRow(idx)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mt-5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* 6 Needle Cones Sequence Inputs */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[11px]">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-0.5">Needle #1</label>
                      <input
                        type="text"
                        value={row.needle_1}
                        onChange={(e) => handleColorRowChange(idx, "needle_1", e.target.value)}
                        placeholder="370 - Hariom"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-0.5">Needle #2</label>
                      <input
                        type="text"
                        value={row.needle_2}
                        onChange={(e) => handleColorRowChange(idx, "needle_2", e.target.value)}
                        placeholder="351 - Hariom"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-0.5">Needle #3</label>
                      <input
                        type="text"
                        value={row.needle_3}
                        onChange={(e) => handleColorRowChange(idx, "needle_3", e.target.value)}
                        placeholder="6074 - Hariom"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-0.5">Needle #4</label>
                      <input
                        type="text"
                        value={row.needle_4}
                        onChange={(e) => handleColorRowChange(idx, "needle_4", e.target.value)}
                        placeholder="580 - Green"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-0.5">Needle #5</label>
                      <input
                        type="text"
                        value={row.needle_5}
                        onChange={(e) => handleColorRowChange(idx, "needle_5", e.target.value)}
                        placeholder="Coco - 24"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-0.5">Needle #6</label>
                      <input
                        type="text"
                        value={row.needle_6}
                        onChange={(e) => handleColorRowChange(idx, "needle_6", e.target.value)}
                        placeholder="Gold Jari"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Notes & Submission */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Special Operator Notes / Remarks</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Enter any special instruction for machine operator..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/job-works")}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Save Job Card Entry
              </button>
            </div>
          </div>
        </form>
      )}

      {/* DIGITAL PAPER SLIP PREVIEW (Exact Replica of Surat Factory Job Card Paper Slip) */}
      {activeTab === "preview" && (
        <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-md max-w-xl mx-auto space-y-4">
          <div className="border-2 border-slate-800 p-4 font-sans text-slate-900 bg-emerald-50/20 rounded-md">
            {/* Paper Header */}
            <div className="text-center border-b-2 border-slate-800 pb-2 mb-3">
              <h1 className="text-xl font-black tracking-widest uppercase border-2 border-slate-900 inline-block px-4 py-0.5">
                JOB CARD
              </h1>
            </div>

            {/* Paper Header Fields */}
            <div className="space-y-1.5 text-xs font-semibold border-b-2 border-slate-800 pb-3">
              <div className="flex justify-between">
                <span>Party's Name: <strong className="text-blue-800 text-sm">{partyName}</strong></span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span>Design No.: <strong className="font-mono text-sm">{designNo}</strong></span>
                <span>Stitches: <strong>{stitchesCount.toLocaleString()}</strong></span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span>Pieces: <strong className="text-emerald-700 text-sm">{totalPieces} pcs</strong></span>
                <span>Date: <strong>{entryDate}</strong></span>
              </div>
              <div>
                <span>Machine No. / Specs: <strong className="text-slate-800">{machineNoParts}</strong></span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-slate-400 text-[11px]">
                <span>Operator: <strong>{operatorName}</strong></span>
                <span>Shift: <strong>{shiftType}</strong></span>
              </div>
            </div>

            {/* Color & Thread Sequence Grid Table */}
            <div className="mt-3">
              <table className="w-full text-left border-collapse border border-slate-800 text-[11px]">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-800 text-[10px] font-bold uppercase">
                    <th className="p-1.5 border-r border-slate-800">Fabric Color & Pcs</th>
                    <th className="p-1.5">Needle / Thread Cone Sequence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {colorSchedules.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-800">
                      <td className="p-2 border-r border-slate-800 font-bold bg-slate-50 align-top">
                        <div className="text-slate-900">{row.color_name}</div>
                        <div className="text-emerald-700 text-[10px]">{row.piece_qty} pcs</div>
                      </td>
                      <td className="p-2 text-[11px]">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono">
                          <div>① {row.needle_1 || "-"}</div>
                          <div>④ {row.needle_4 || "-"}</div>
                          <div>② {row.needle_2 || "-"}</div>
                          <div>⑤ {row.needle_5 || "-"}</div>
                          <div>③ {row.needle_3 || "-"}</div>
                          <div>⑥ {row.needle_6 || "-"}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Note Section */}
            <div className="mt-3 border-t-2 border-slate-800 pt-2 text-[11px]">
              <strong>NOTE:</strong> {notes || "None"}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-2xs hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print Job Card Slip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
