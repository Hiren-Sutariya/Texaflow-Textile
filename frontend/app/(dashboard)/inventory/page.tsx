"use client";

import { useState } from "react";
import { Package, Search, ShieldAlert } from "lucide-react";

const mockStock = [
  {
    id: "s-101",
    material_code: "MAT-101",
    material_name: "Red Viscose Thread",
    category: "Thread",
    unit: "kg",
    warehouse: "Raw Material",
    ownership_type: "Company",
    party_name: null,
    current_stock: 15.5,
    min_alert: 5.0,
    status: "Normal"
  },
  {
    id: "s-102",
    material_code: "MAT-102",
    material_name: "Black Viscose Thread",
    category: "Thread",
    unit: "kg",
    warehouse: "Raw Material",
    ownership_type: "Company",
    party_name: null,
    current_stock: 8.0,
    min_alert: 5.0,
    status: "Normal"
  },
  {
    id: "s-103",
    material_code: "MAT-103",
    material_name: "Gold Metallic Jari 250D",
    category: "Jari",
    unit: "kg",
    warehouse: "Raw Material",
    ownership_type: "Company",
    party_name: null,
    current_stock: 4.0,
    min_alert: 10.0,
    status: "Low_Stock"
  },
  {
    id: "s-104",
    material_code: "FAB-PARTY",
    material_name: "Royal Blue Cotton 60s",
    category: "Fabric",
    unit: "meter",
    warehouse: "Production Floor",
    ownership_type: "Party",
    party_name: "ABC Tex Fabrics",
    current_stock: 500.0,
    min_alert: 0.0,
    status: "Normal"
  }
];

export default function InventoryPage() {
  const [stock, setStock] = useState(mockStock);
  const [ownershipFilter, setOwnershipFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredStock = stock.filter((item) => {
    const matchesOwnership = ownershipFilter === "All" || item.ownership_type === ownershipFilter;
    const matchesSearch = item.material_name.toLowerCase().includes(search.toLowerCase()) || item.material_code.toLowerCase().includes(search.toLowerCase());
    return matchesOwnership && matchesSearch;
  });

  return (
    <div className="space-y-3.5">
      {/* Filter Tabs & Stock Totals Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {["All", "Company", "Party"].map((tab) => (
            <button
              key={tab}
              onClick={() => setOwnershipFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                ownershipFilter === tab
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab === "All" ? "All Inventory" : tab === "Company" ? "Company Stock" : "Party Stock"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-md text-[11px] font-bold text-blue-800">
            Company Stock: 27.5 kg
          </div>
          <div className="px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-md text-[11px] font-bold text-purple-800">
            Party Owned: 500.0 m
          </div>
          <div className="relative flex-1 sm:w-56 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Raw Material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Stock Table & Mobile Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* MOBILE CARD VIEW (< md) - No horizontal scroll */}
        <div className="block md:hidden p-3 sm:p-4 space-y-3 bg-slate-50/50">
          {filteredStock.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-medium bg-white rounded-xl border border-slate-200">
              No inventory materials found.
            </div>
          ) : (
            filteredStock.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3"
              >
                {/* Top Row: Code & Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {s.material_code}
                  </span>
                  {s.status === "Low_Stock" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold">
                      <ShieldAlert className="w-3 h-3 text-red-600" /> Low Stock
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                      Sufficient
                    </span>
                  )}
                </div>

                {/* Name & Owner Party */}
                <div className="pt-1 border-t border-slate-100">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {s.material_name}
                  </h4>
                  {s.party_name && (
                    <span className="text-[11px] text-purple-700 font-semibold block mt-0.5">
                      Owner Party: {s.party_name}
                    </span>
                  )}
                </div>

                {/* Warehouse & Ownership */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Warehouse</span>
                    <span className="font-bold text-slate-800 inline-block mt-0.5">
                      {s.warehouse}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Ownership</span>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.ownership_type === "Company"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}
                    >
                      {s.ownership_type}
                    </span>
                  </div>
                </div>

                {/* Current Stock */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-500">Current In-Stock</span>
                  <span className="font-black text-slate-900 text-base">
                    {s.current_stock} <span className="text-xs font-normal text-slate-500">{s.unit}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Material Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Warehouse Location</th>
                <th className="py-3.5 px-4">Ownership</th>
                <th className="py-3.5 px-4 text-right">Current Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredStock.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{s.material_code}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {s.material_name}
                    {s.party_name && (
                      <span className="block text-[10px] text-purple-700 font-semibold">
                        Owner Party: {s.party_name}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">{s.category}</td>
                  <td className="py-3.5 px-4 text-slate-600">{s.warehouse}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      s.ownership_type === "Company"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}>
                      {s.ownership_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                    {s.current_stock} <span className="text-xs font-normal text-slate-500">{s.unit}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {s.status === "Low_Stock" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-[11px] font-bold">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600" /> Low Stock Alert
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                        Sufficient
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
