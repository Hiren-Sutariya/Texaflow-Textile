"use client";

import { useState, useEffect } from "react";
import {
  PackageCheck,
  Scissors,
  Truck,
  CheckCircle2,
  Building2,
  Factory,
  ChevronDown,
  Check
} from "lucide-react";

export interface FinishedDesignItem {
  id: string;
  unit_id?: string;
  order_id?: string;
  design_code: string;
  design_name: string;
  party_name: string;
  machine_number: string;
  total_pcs_produced: number;
  total_stitches?: number;
  completion_date: string;
  status: "Dhaga Cutting" | "Ready for Dispatch" | "Dispatched" | "Completed";
  dispatched_pcs?: number;
  remaining_pcs?: number;
}

// Initial Sample Data for Finished Designs & Stock - Unit 1
const initialFinishedDesignsUnit1: FinishedDesignItem[] = [
  {
    id: "fd-amt-101",
    unit_id: "unit_1",
    design_code: "AMS-101",
    design_name: "Royal Gold Saree Border",
    party_name: "Om Sai Silks",
    machine_number: "Machine 1",
    total_pcs_produced: 450,
    total_stitches: 1850000,
    completion_date: "04-10-2026",
    status: "Dhaga Cutting",
    dispatched_pcs: 0,
    remaining_pcs: 450
  },
  {
    id: "fd-amt-102",
    unit_id: "unit_1",
    design_code: "AMS-102",
    design_name: "Zari Border Dupatta Work",
    party_name: "Vardhman Prints",
    machine_number: "Machine 2",
    total_pcs_produced: 300,
    total_stitches: 1200000,
    completion_date: "03-10-2026",
    status: "Ready for Dispatch",
    dispatched_pcs: 100,
    remaining_pcs: 200
  }
];

// Initial Sample Data for Finished Designs & Stock - Unit 2 (Kadodara)
const initialFinishedDesignsUnit2: FinishedDesignItem[] = [
  {
    id: "fd-kdd-201",
    unit_id: "unit_2",
    design_code: "KDF-501",
    design_name: "Designer Chaniya Choli Embroidery",
    party_name: "Kadodara Fashion Hub",
    machine_number: "Machine 1",
    total_pcs_produced: 1200,
    total_stitches: 5450000,
    completion_date: "04-10-2026",
    status: "Ready for Dispatch",
    dispatched_pcs: 850,
    remaining_pcs: 350
  },
  {
    id: "fd-kdd-202",
    unit_id: "unit_2",
    design_code: "LXF-808",
    design_name: "Bridal Lehenga Heavy Lace",
    party_name: "Laxmi Fabrics Kadodara",
    machine_number: "Machine 2",
    total_pcs_produced: 950,
    total_stitches: 4120000,
    completion_date: "04-10-2026",
    status: "Dhaga Cutting",
    dispatched_pcs: 0,
    remaining_pcs: 950
  },
  {
    id: "fd-kdd-203",
    unit_id: "unit_2",
    design_code: "KDF-404",
    design_name: "Velvet Blouse Piece Work",
    party_name: "Shree Ganesh Creation",
    machine_number: "Machine 3",
    total_pcs_produced: 1500,
    total_stitches: 6200000,
    completion_date: "02-10-2026",
    status: "Dispatched",
    dispatched_pcs: 1500,
    remaining_pcs: 0
  }
];

export default function DispatchesPage() {
  const [activeUnit, setActiveUnit] = useState<string>("Unit 1");
  const [finishedDesigns, setFinishedDesigns] = useState<FinishedDesignItem[]>(initialFinishedDesignsUnit1);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);

  // Sync finished designs from Production page & Job Orders in localStorage per active unit
  useEffect(() => {
    const syncFinishedStock = () => {
      const currentUnit = localStorage.getItem("app_active_unit") || "Unit 1";
      const defaultList = currentUnit === "Unit 2" ? initialFinishedDesignsUnit2 : initialFinishedDesignsUnit1;

      let list: FinishedDesignItem[] = [];

      // 1. Read app_finished_designs from localStorage
      const savedFinished = localStorage.getItem("app_finished_designs");
      if (savedFinished) {
        try {
          const parsed = JSON.parse(savedFinished);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        } catch (e) {
          console.error("Error loading app_finished_designs", e);
        }
      }

      // Fallback to unit initial sample designs if empty
      if (list.length === 0) {
        list = [...defaultList];
      }

      setFinishedDesigns(list);
    };

    syncFinishedStock();
    window.addEventListener("storage", syncFinishedStock);
    window.addEventListener("app_data_update", syncFinishedStock);
    window.addEventListener("app_location_change", syncFinishedStock);

    return () => {
      window.removeEventListener("storage", syncFinishedStock);
      window.removeEventListener("app_data_update", syncFinishedStock);
      window.removeEventListener("app_location_change", syncFinishedStock);
    };
  }, []);

  // Update Status of a Design Card directly
  const handleUpdateItemStatus = (item: FinishedDesignItem, newStatus: FinishedDesignItem["status"]) => {
    const updatedList = finishedDesigns.map((fd) => {
      if (fd.id === item.id) {
        return { ...fd, status: newStatus };
      }
      return fd;
    });

    setFinishedDesigns(updatedList);
    localStorage.setItem("app_finished_designs", JSON.stringify(updatedList));

    // Also update order status strictly for this order_id in app_job_orders
    if (item.order_id) {
      try {
        const ordersStr = localStorage.getItem("app_job_orders");
        if (ordersStr) {
          const ordersList = JSON.parse(ordersStr);
          if (Array.isArray(ordersList)) {
            const updatedOrders = ordersList.map((o: any) => {
              if (String(o.id) === String(item.order_id)) {
                return {
                  ...o,
                  status: newStatus
                };
              }
              return o;
            });
            localStorage.setItem("app_job_orders", JSON.stringify(updatedOrders));
          }
        }
      } catch (e) {}
    }

    window.dispatchEvent(new Event("app_data_update"));
  };

  // Filter items by active tab
  const filteredDesigns = finishedDesigns.filter((item) => {
    if (activeTab === "All") return true;
    return item.status === activeTab;
  });

  // 4 Metric Card Counts & Sums
  const dhagaCuttingItems = finishedDesigns.filter((f) => f.status === "Dhaga Cutting");
  const dhagaCuttingPcs = dhagaCuttingItems.reduce((sum, item) => sum + item.total_pcs_produced, 0);

  const readyItems = finishedDesigns.filter((f) => f.status === "Ready for Dispatch");
  const readyPcs = readyItems.reduce((sum, item) => sum + item.total_pcs_produced, 0);

  const dispatchedItems = finishedDesigns.filter((f) => f.status === "Dispatched");
  const dispatchedPcs = dispatchedItems.reduce((sum, item) => sum + item.total_pcs_produced, 0);

  const completedItems = finishedDesigns.filter((f) => f.status === "Completed");
  const completedPcs = completedItems.reduce((sum, item) => sum + item.total_pcs_produced, 0);

  // Badge Style Helper
  const getStatusBadge = (status: FinishedDesignItem["status"]) => {
    if (status === "Dhaga Cutting") {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (status === "Ready for Dispatch") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (status === "Dispatched") {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    return "bg-purple-50 text-purple-700 border-purple-200";
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-12">
      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Dhaga Cutting */}
        <div
          onClick={() => setActiveTab("Dhaga Cutting")}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            activeTab === "Dhaga Cutting" ? "border-rose-400 ring-2 ring-rose-200" : "border-slate-200 hover:border-rose-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">
                Dhaga Cutting
              </p>
              <p className="text-xl font-black text-rose-950 mt-0.5">
                {dhagaCuttingPcs.toLocaleString("en-IN")}{" "}
                <span className="text-xs font-bold text-rose-700">Pcs</span>
              </p>
              <span className="text-[11px] font-bold text-rose-600 mt-0.5 block">
                {dhagaCuttingItems.length} Designs in Finishing
              </span>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <Scissors className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 2: Ready for Dispatch */}
        <div
          onClick={() => setActiveTab("Ready for Dispatch")}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            activeTab === "Ready for Dispatch" ? "border-emerald-400 ring-2 ring-emerald-200" : "border-slate-200 hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
                Ready for Dispatch
              </p>
              <p className="text-xl font-black text-emerald-900 mt-0.5">
                {readyPcs.toLocaleString("en-IN")}{" "}
                <span className="text-xs font-bold text-emerald-700">Pcs</span>
              </p>
              <span className="text-[11px] font-bold text-emerald-600 mt-0.5 block">
                {readyItems.length} Stock Ready in Factory
              </span>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 3: Dispatched */}
        <div
          onClick={() => setActiveTab("Dispatched")}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            activeTab === "Dispatched" ? "border-blue-400 ring-2 ring-blue-200" : "border-slate-200 hover:border-blue-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
                Dispatched
              </p>
              <p className="text-xl font-black text-blue-950 mt-0.5">
                {dispatchedPcs.toLocaleString("en-IN")}{" "}
                <span className="text-xs font-bold text-blue-700">Pcs</span>
              </p>
              <span className="text-[11px] font-bold text-blue-600 mt-0.5 block">
                {dispatchedItems.length} Sent to Party
              </span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Truck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 4: Completed */}
        <div
          onClick={() => setActiveTab("Completed")}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            activeTab === "Completed" ? "border-purple-400 ring-2 ring-purple-200" : "border-slate-200 hover:border-purple-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">
                Completed
              </p>
              <p className="text-xl font-black text-purple-950 mt-0.5">
                {completedPcs.toLocaleString("en-IN")}{" "}
                <span className="text-xs font-bold text-purple-700">Pcs</span>
              </p>
              <span className="text-[11px] font-bold text-purple-600 mt-0.5 block">
                {completedItems.length} Orders Finished
              </span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER TABS & STOCK CARDS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 font-sans">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <PackageCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
              Finished Designs & Post-Production Stock
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            {[
              { id: "All", label: `All (${finishedDesigns.length})` },
              { id: "Dhaga Cutting", label: `✂️ Dhaga Cutting (${dhagaCuttingItems.length})` },
              { id: "Ready for Dispatch", label: `📦 Ready (${readyItems.length})` },
              { id: "Dispatched", label: `🚛 Dispatched (${dispatchedItems.length})` },
              { id: "Completed", label: `✓ Completed (${completedItems.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {filteredDesigns.map((item) => (
            <div
              key={item.id}
              className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 hover:border-blue-300 transition-all shadow-2xs relative"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-mono font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                  {item.design_code}
                </span>

                {/* Status Selector Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenStatusMenuId(openStatusMenuId === item.id ? null : item.id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-colors ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    <span>{item.status}</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </button>

                  {openStatusMenuId === item.id && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setOpenStatusMenuId(null)} />
                      <div className="absolute right-0 top-7 z-30 w-44 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 space-y-0.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                        {["Dhaga Cutting", "Ready for Dispatch", "Dispatched", "Completed"].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              handleUpdateItemStatus(item, st as any);
                              setOpenStatusMenuId(null);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between transition-colors ${
                              item.status === st ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span>{st}</span>
                            {item.status === st && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-900 truncate" title={item.design_name}>
                  {item.design_name}
                </h3>
                <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{item.party_name}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 font-medium block text-[10px]">Machine:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Factory className="w-3 h-3 text-slate-400" />
                    {item.machine_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[10px]">Total Produced:</span>
                  <span className="font-mono font-extrabold text-emerald-700 text-xs">
                    {item.total_pcs_produced.toLocaleString("en-IN")} Pcs
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredDesigns.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              <PackageCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-xs">No designs currently in "{activeTab}" status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
