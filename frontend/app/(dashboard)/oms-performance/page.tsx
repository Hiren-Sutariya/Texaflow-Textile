"use client";

import { useState } from "react";
import {
  TrendingUp,
  BarChart3,
  Factory,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Percent,
  Layers,
  Search,
  Filter,
  RefreshCw
} from "lucide-react";

export default function OMSPerformancePage() {
  const [selectedUnit, setSelectedUnit] = useState<"All" | "Unit 1" | "Unit 2 (Kadodara)">("All");

  const machineStats = [
    {
      id: "M-01",
      name: "Embroidery Machine 01 (High-Speed)",
      unit: "Unit 1",
      status: "Running",
      operator: "Mukeshbhai Karigar",
      speed_rpm: 850,
      stitches_today: 485000,
      target_stitches: 500000,
      efficiency: 97.0,
      active_order: "ORD-2026-881 (Radha Dress Saree)",
    },
    {
      id: "M-02",
      name: "Embroidery Machine 02",
      unit: "Unit 1",
      status: "Running",
      operator: "Rameshbhai Helper",
      speed_rpm: 780,
      stitches_today: 320000,
      target_stitches: 450000,
      efficiency: 71.1,
      active_order: "ORD-2026-884 (Surat Silk Dupatta)",
    },
    {
      id: "M-03",
      name: "Embroidery Machine 03",
      unit: "Unit 2 (Kadodara)",
      status: "Maintenance",
      operator: "Dineshbhai Karigar",
      speed_rpm: 0,
      stitches_today: 120000,
      target_stitches: 450000,
      efficiency: 26.6,
      active_order: "ORD-2026-879 (Bridal Lehenga Border)",
    },
    {
      id: "M-04",
      name: "Embroidery Machine 04 (Multi-Color)",
      unit: "Unit 2 (Kadodara)",
      status: "Running",
      operator: "Sanjay Master",
      speed_rpm: 920,
      stitches_today: 650000,
      target_stitches: 600000,
      efficiency: 108.3,
      active_order: "ORD-2026-890 (Chaniya Choli Motif)",
    }
  ];

  const filteredMachines = machineStats.filter(
    (m) => selectedUnit === "All" || m.unit === selectedUnit
  );

  return (
    <div className="space-y-4 select-none">
      {/* Page Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              OMS Operations & Production Performance Engine
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Real-time Order Management System analytics, machine efficiency & output metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* High-Level Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Fulfillment Velocity</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600">98.4%</p>
          <p className="text-[11px] text-slate-400 font-medium">On-time client order dispatch</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Machine Efficiency</span>
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-extrabold text-blue-600">89.2%</p>
          <p className="text-[11px] text-slate-400 font-medium">Average stitch output rate</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Job Cost Profit Margin</span>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-extrabold text-purple-600">+34.8%</p>
          <p className="text-[11px] text-slate-400 font-medium">Thread & labor cost yield</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Machine Downtime</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-amber-600">1.2 Hrs</p>
          <p className="text-[11px] text-slate-400 font-medium">1 machine under maintenance</p>
        </div>
      </div>

      {/* Unit Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unit 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Unit 1 (Main Plant)</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Optimal (92.5%)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Active Machines</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">2 / 2</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Shift Output</div>
              <div className="text-base font-extrabold text-emerald-600 mt-0.5">8,05,000</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Operator Count</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">6 Karigars</div>
            </div>
          </div>
        </div>

        {/* Unit 2 Kadodara */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Unit 2 (Kadodara Unit)</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
              Maintenance Alert (84.1%)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Active Machines</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">1 / 2</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Shift Output</div>
              <div className="text-base font-extrabold text-blue-600 mt-0.5">7,70,000</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Operator Count</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">5 Karigars</div>
            </div>
          </div>
        </div>
      </div>

      {/* Machine & Order Operations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Live Machine Throughput & OMS Performance Log
          </h3>

          <div className="flex items-center gap-2">
            {(["All", "Unit 1", "Unit 2 (Kadodara)"] as const).map((unit) => (
              <button
                key={unit}
                onClick={() => setSelectedUnit(unit)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedUnit === unit
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Machine & Unit</th>
                <th className="py-3 px-4">Operator / Karigar</th>
                <th className="py-3 px-4">Active Order</th>
                <th className="py-3 px-4 text-center">RPM Speed</th>
                <th className="py-3 px-4 text-right">Stitches Completed</th>
                <th className="py-3 px-4 text-right">Efficiency %</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredMachines.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-slate-900">{m.name}</div>
                    <div className="text-[10px] text-emerald-600 font-bold">{m.unit}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-bold">{m.operator}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-900 font-medium">{m.active_order}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold">
                    {m.speed_rpm > 0 ? (
                      <span className="text-emerald-600 font-extrabold">{m.speed_rpm} RPM</span>
                    ) : (
                      <span className="text-slate-400">0 RPM</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                    {m.stitches_today.toLocaleString("en-IN")} / {m.target_stitches.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-extrabold text-xs px-2 py-0.5 rounded-md ${
                        m.efficiency >= 90
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : m.efficiency >= 70
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {m.efficiency}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {m.status === "Running" ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Running
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                        Maintenance
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
