"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Briefcase,
  ChevronDown,
  Check,
  X,
  Trash2,
  Clock,
  CheckCircle2,
  Scissors,
  Cpu
} from "lucide-react";

export interface ColorwayQty {
  color_name: string;
  pcs: number;
}

export interface JobOrder {
  id: string;
  order_no: string;
  date: string; // Job order created date
  party_name: string;
  main_merchant: string;
  fabric_quality: string;
  design_name: string; // Description
  design_code: string; // Design Code (without #)
  assigned_machine?: string; // Assigned Machine (e.g., Machine 1, Schiffli M/C 01)
  colorways?: ColorwayQty[]; // Color breakdown
  total_quantity: number; // Total Pcs
  unit: "Pcs";
  rate_per_1k: number; // Rate per pc or 1k
  target_date: string;
  status: "Pending" | "In Production" | "Dhaga Cutting" | "Ready for Dispatch" | "Completed";
  notes?: string;
}

const initialOrders: JobOrder[] = [];

const partyOptions = [
  "ABC Tex Fabrics",
  "Royal Fashion House",
  "Shree Ram Textiles"
];

const machineOptions = [
  "Select Machine",
  "Machine 1",
  "Machine 2",
  "Machine 3",
  "Machine 4"
];

const AVAILABLE_MACHINES = ["Unassigned", "Machine 1", "Machine 2", "Machine 3", "Machine 4"];

const STATUS_LIST = ["Pending", "In Production", "Dhaga Cutting", "Ready for Dispatch", "Completed"] as const;

// Helper to parse colorwise input string e.g. "Rani: 50, Rama: 50"
const parseColorwaysInput = (inputStr: string): ColorwayQty[] => {
  if (!inputStr.trim()) return [];
  return inputStr
    .split(",")
    .map((part) => {
      const [cName, cQty] = part.split(":").map((s) => s.trim());
      const parsedQty = Number(cQty);
      return {
        color_name: cName || "Standard",
        pcs: isNaN(parsedQty) ? 0 : parsedQty
      };
    })
    .filter((c) => c.color_name);
};

export default function JobOrdersPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const [orders, setOrders] = useState<JobOrder[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("app_job_orders");
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch {}
    }
    return initialOrders;
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [partyFilter, setPartyFilter] = useState("All");
  const [availableParties, setAvailableParties] = useState<string[]>(partyOptions);
  const [availableDesignFolders, setAvailableDesignFolders] = useState<any[]>([]);
  const [availableMachines, setAvailableMachines] = useState<string[]>(AVAILABLE_MACHINES);
  const [formMachineOptions, setFormMachineOptions] = useState<string[]>(machineOptions);

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [isFormPartyOpen, setIsFormPartyOpen] = useState(false);
  const [isFormMachineOpen, setIsFormMachineOpen] = useState(false);
  const [isFormDesignOpen, setIsFormDesignOpen] = useState(false);

  // Track status & machine dropdown positions in viewport space to prevent any table clipping
  const [statusPopoverPos, setStatusPopoverPos] = useState<{ orderId: string; top: number; left: number } | null>(null);
  const [machinePopoverPos, setMachinePopoverPos] = useState<{ orderId: string; top: number; left: number } | null>(null);

  const [showInlineForm, setShowInlineForm] = useState(false);

  // Load from localStorage app_job_orders & parties_register_data & app_design_folders & app_machines
  useEffect(() => {
    setHasMounted(true);
    // Load Machines List
    const loadMachinesList = () => {
      let defaults = ["Machine 1", "Machine 2", "Machine 3", "Machine 4"];
      try {
        const saved = localStorage.getItem("app_machines");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const names = parsed
              .map((m: any) => (m.machine_number || m.name || "").replace(/#/g, "").trim())
              .filter(Boolean);
            if (names.length > 0) {
              defaults = names;
            }
          }
        }
      } catch (e) {}
      const uniqueM = Array.from(new Set(defaults));
      setAvailableMachines(["Unassigned", ...uniqueM]);
      setFormMachineOptions(["Select Machine", ...uniqueM]);
    };

    loadMachinesList();
    window.addEventListener("app_data_update", loadMachinesList);
    window.addEventListener("storage", loadMachinesList);

    // Load Parties Register
    const loadPartiesList = () => {
      let combined: string[] = [];
      const keys = ["app_parties", "app_parties_list", "parties_register_data"];
      for (const k of keys) {
        try {
          const saved = localStorage.getItem(k);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              const names = parsed.map((p: any) => (typeof p === "string" ? p : p.name)).filter(Boolean);
              combined = [...combined, ...names];
            }
          }
        } catch (e) {}
      }
      const uniqueNames = Array.from(new Set([...combined, ...partyOptions]));
      if (uniqueNames.length > 0) {
        setAvailableParties(uniqueNames);
      }
    };

    loadPartiesList();
    window.addEventListener("app_data_update", loadPartiesList);

    // Load Design Folders
    let designFoldersList: any[] = [];
    const savedDesignFolders = localStorage.getItem("app_design_folders");
    if (savedDesignFolders) {
      try {
        const parsedD = JSON.parse(savedDesignFolders);
        if (Array.isArray(parsedD) && parsedD.length > 0) {
          designFoldersList = parsedD;
          setAvailableDesignFolders(parsedD);
        }
      } catch (e) {}
    }

    const saved = localStorage.getItem("app_job_orders");
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            setOrders([]);
            return;
          }
          const activeAssignedSet = new Set<string>();

          // Clean & sanitize job orders (Synchronize colorways directly with Design Library)
          const cleaned = parsed.map((o: JobOrder) => {
            const cleanCode = (o.design_code || "").replace(/#/g, "").trim();

            // Find matching design folder in Design Library
            const matchingDesign = designFoldersList.find(
              (df) => (df.folder_code || "").replace(/#/g, "").trim() === cleanCode
            );

            let updatedColorways = o.colorways;
            let updatedTotalPcs = o.total_quantity;

            if (matchingDesign && matchingDesign.colorways && matchingDesign.colorways.length > 0) {
              // Sync colorways breakdown from Design Library
              const syncedCols: ColorwayQty[] = matchingDesign.colorways.map((cw: any) => {
                let val = cw.override_pcs;
                if ((val === undefined || val <= 0) && cw.roll_meters && cw.roll_meters.length > 0) {
                  const totM = cw.roll_meters.reduce((s: number, m: any) => s + (Number(m) || 0), 0);
                  val = Math.round(totM / 0.93);
                }
                if (val === undefined || val <= 0) val = 50;
                return {
                  color_name: cw.color_name,
                  pcs: val
                };
              });
              updatedColorways = syncedCols;
              updatedTotalPcs = syncedCols.reduce((sum, c) => sum + (c.pcs || 0), 0);
            } else if (cleanCode === "PJD-2486" || !cleanCode) {
              // Sync default PJD-2486 design values (Rani: 60, Rama: 50 -> Total 110)
              updatedColorways = [
                { color_name: "Rani", pcs: 60 },
                { color_name: "Rama", pcs: 50 }
              ];
              updatedTotalPcs = 110;
            } else if (updatedColorways && updatedColorways.length > 0) {
              // Ensure colorways pcs are parsed cleanly
              const allZero = updatedColorways.every((c) => Number(c.pcs) === 0);
              if (allZero && o.total_quantity > 0) {
                const equalShare = Math.round(o.total_quantity / updatedColorways.length);
                updatedColorways = updatedColorways.map((cw) => ({
                  ...cw,
                  pcs: equalShare > 0 ? equalShare : 15
                }));
              }
              const validCols = updatedColorways;
              updatedTotalPcs = validCols.reduce((sum, c) => sum + (c.pcs || 0), 0);
            }

            let mach = o.assigned_machine || "Unassigned";

            // Remove Schiffli machines fallback
            if (mach.toLowerCase().includes("schiffli")) {
              mach = "Unassigned";
            }

            // Ensure single machine active assignment constraint
            if (mach !== "Unassigned" && mach !== "Select Machine" && o.status !== "Completed") {
              if (activeAssignedSet.has(mach)) {
                mach = "Unassigned"; // Reset duplicate assigned active machine to Unassigned
              } else {
                activeAssignedSet.add(mach);
              }
            }

            return {
              ...o,
              assigned_machine: mach,
              design_code: cleanCode,
              colorways: updatedColorways,
              total_quantity: updatedTotalPcs
            };
          });
          setOrders(cleaned);
          localStorage.setItem("app_job_orders", JSON.stringify(cleaned));
        }
      } catch (e) {
        console.error("Failed to load job orders from localStorage", e);
      }
    }
  }, []);

  // Save back to localStorage whenever orders change
  const saveOrdersList = (newOrdersList: JobOrder[]) => {
    setOrders(newOrdersList);
    localStorage.setItem("app_job_orders", JSON.stringify(newOrdersList));
  };

  // Form State (Default colorways e.g. Rani: 60, Rama: 50)
  const [formData, setFormData] = useState({
    party_name: "ABC Tex Fabrics",
    design_name: "",
    design_code: "",
    assigned_machine: "Select Machine",
    colorways_input: "Rani: 60, Rama: 50",
    total_quantity: 110,
    target_date: new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-GB"),
    status: "Pending" as JobOrder["status"],
    notes: ""
  });

  // Live parsed colors for form feedback
  const liveParsedColors = parseColorwaysInput(formData.colorways_input);
  const liveColorwiseSum = liveParsedColors.reduce((sum, c) => sum + (c.pcs || 0), 0);

  // Auto populate form when selecting a design folder from Design Library
  const handleSelectDesignFolder = (design: any) => {
    const cleanCode = (design.folder_code || "").replace(/#/g, "").trim();
    let colorStr = "Rani: 60, Rama: 50";
    if (design.colorways && design.colorways.length > 0) {
      colorStr = design.colorways
        .map((cw: any) => {
          let val = cw.override_pcs;
          if ((val === undefined || val <= 0) && cw.roll_meters && cw.roll_meters.length > 0) {
            const totM = cw.roll_meters.reduce((s: number, m: any) => s + (Number(m) || 0), 0);
            val = Math.round(totM / 0.93);
          }
          if (val === undefined || val <= 0) val = 50;
          return `${cw.color_name}: ${val}`;
        })
        .join(", ");
    }

    const parsedCols = parseColorwaysInput(colorStr);
    const sumQty = parsedCols.reduce((acc, c) => acc + (c.pcs || 0), 0);

    setFormData({
      ...formData,
      party_name: design.party_name || formData.party_name,
      design_code: cleanCode,
      design_name: design.title || "",
      colorways_input: colorStr,
      total_quantity: sumQty > 0 ? sumQty : 100
    });
    setIsFormDesignOpen(false);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.party_name.trim()) {
      alert("Please select or enter Party Name!");
      return;
    }

    const cleanCode = formData.design_code.replace(/#/g, "").trim() || `Design ${Math.floor(1000 + Math.random() * 9000)}`;

    const parsedColors = parseColorwaysInput(formData.colorways_input);
    const colorwiseSum = parsedColors.reduce((sum, c) => sum + (c.pcs || 0), 0);
    const calculatedTotalPcs = colorwiseSum > 0 ? colorwiseSum : (Number(formData.total_quantity) || 35);

    const assignedMach = formData.assigned_machine;
    if (assignedMach !== "Unassigned" && assignedMach !== "Select Machine") {
      const busyOrder = orders.find(
        (o) => o.status !== "Completed" && o.assigned_machine === assignedMach
      );
      if (busyOrder) {
        alert(
          `⚠️ ${assignedMach} already has design ${busyOrder.design_code} (${busyOrder.party_name}) running! Please finish or unassign the existing order before assigning a new one.`
        );
        return;
      }
    }

    const isAssigningMach = assignedMach !== "Unassigned" && assignedMach !== "Select Machine";

    const newOrder: JobOrder = {
      id: `ord-${Date.now()}`,
      order_no: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleDateString("en-GB"),
      party_name: formData.party_name.trim(),
      main_merchant: "Direct Order",
      fabric_quality: "Standard Fabric",
      design_name: formData.design_name.trim() || "Saree Design Suite",
      design_code: cleanCode,
      assigned_machine: assignedMach,
      colorways: parsedColors.length > 0 ? parsedColors : [{ color_name: "Standard Run", pcs: calculatedTotalPcs }],
      total_quantity: calculatedTotalPcs,
      unit: "Pcs",
      rate_per_1k: 0,
      target_date: formData.target_date,
      status: isAssigningMach ? "In Production" : formData.status,
      notes: formData.notes.trim()
    };

    saveOrdersList([newOrder, ...orders]);
    window.dispatchEvent(new Event("app_data_update"));
    setShowInlineForm(false);
    setFormData({
      party_name: availableParties[0] || "ABC Tex Fabrics",
      design_name: "",
      design_code: "",
      assigned_machine: "Select Machine",
      colorways_input: "Rani: 60, Rama: 50",
      total_quantity: 110,
      target_date: new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-GB"),
      status: "Pending",
      notes: ""
    });
  };

  // Change Machine Assignment directly from table popover with warning block if machine is already busy
  const handleMachineChange = (orderId: string, newMachine: string) => {
    const isAssigningMachine = newMachine !== "Unassigned" && newMachine !== "Select Machine";

    if (isAssigningMachine) {
      const busyOrder = orders.find(
        (o) => o.id !== orderId && o.status !== "Completed" && o.assigned_machine === newMachine
      );
      if (busyOrder) {
        alert(
          `⚠️ ${newMachine} already has design ${busyOrder.design_code} (${busyOrder.party_name}) running! Please finish or unassign the existing order before assigning a new one.`
        );
        setMachinePopoverPos(null);
        return;
      }
    }

    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          assigned_machine: newMachine,
          completed_pcs: 0,
          completed_stitches: 0,
          status: isAssigningMachine ? ("In Production" as const) : (o.status === "In Production" ? ("Pending" as const) : o.status)
        };
      }
      return o;
    });
    saveOrdersList(updated);
    window.dispatchEvent(new Event("app_data_update"));
    setMachinePopoverPos(null);
  };

  const toggleMachinePopover = (orderId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (machinePopoverPos?.orderId === orderId) {
      setMachinePopoverPos(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMachinePopoverPos({
        orderId,
        top: rect.bottom + 6,
        left: rect.left
      });
    }
  };

  // Change Status for a SINGLE order strictly by orderId
  const handleStatusChange = (orderId: string, newStatus: JobOrder["status"]) => {
    const isPostProduction =
      newStatus === "Dhaga Cutting" || newStatus === "Ready for Dispatch" || newStatus === "Completed";

    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          assigned_machine: isPostProduction ? "Unassigned" : o.assigned_machine
        };
      }
      return o;
    });
    saveOrdersList(updated);

    // Sync to finished designs ONLY for this specific orderId
    if (isPostProduction) {
      try {
        const targetOrder = updated.find((o) => o.id === orderId);
        if (targetOrder) {
          const finishedStr = localStorage.getItem("app_finished_designs");
          let finishedList: any[] = finishedStr ? JSON.parse(finishedStr) : [];
          if (!Array.isArray(finishedList)) finishedList = [];

          const existingIdx = finishedList.findIndex(
            (f) => String(f.order_id) === String(orderId) || f.id === `fd-order-${orderId}`
          );

          const itemStatus = newStatus as "Dhaga Cutting" | "Ready for Dispatch" | "Completed";

          if (existingIdx !== -1) {
            finishedList[existingIdx] = {
              ...finishedList[existingIdx],
              status: itemStatus
            };
          } else {
            finishedList.unshift({
              id: `fd-order-${orderId}`,
              order_id: orderId,
              design_code: (targetOrder.design_code || "").replace(/#/g, "").trim(),
              design_name: targetOrder.design_name || "Embroidery Work",
              party_name: targetOrder.party_name,
              machine_number: targetOrder.assigned_machine || "Production Floor",
              total_pcs_produced: targetOrder.total_quantity || 110,
              completion_date: targetOrder.target_date || new Date().toLocaleDateString("en-GB"),
              status: itemStatus,
              remaining_pcs: targetOrder.total_quantity || 110
            });
          }
          localStorage.setItem("app_finished_designs", JSON.stringify(finishedList));
        }
      } catch (e) {
        console.error("Error syncing order status change to finished designs", e);
      }
    }

    window.dispatchEvent(new Event("app_data_update"));
    setStatusPopoverPos(null);
  };

  const toggleStatusPopover = (orderId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (statusPopoverPos?.orderId === orderId) {
      setStatusPopoverPos(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setStatusPopoverPos({
        orderId,
        top: rect.bottom + 6,
        left: rect.left
      });
    }
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm("Are you sure you want to delete this job order?")) {
      const updated = orders.filter((o) => o.id !== id);
      saveOrdersList(updated);
    }
  };

  // Filter Orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_no.toLowerCase().includes(search.toLowerCase()) ||
      o.party_name.toLowerCase().includes(search.toLowerCase()) ||
      o.design_name.toLowerCase().includes(search.toLowerCase()) ||
      (o.assigned_machine || "").toLowerCase().includes(search.toLowerCase()) ||
      o.design_code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || o.status === statusFilter;
    const matchesParty = partyFilter === "All" || o.party_name === partyFilter;
    return matchesSearch && matchesStatus && matchesParty;
  });

  // Summary Metrics
  const totalOrdersCount = orders.length;
  const runningOrdersCount = orders.filter((o) => o.status === "In Production").length;
  const dhagaCuttingOrdersCount = orders.filter((o) => o.status === "Dhaga Cutting").length;
  const completedOrdersCount = orders.filter((o) => o.status === "Completed").length;

  if (!hasMounted) return null;

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* CARD 1: TOTAL ORDERS */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mr-1">Total Orders</p>
            <p className="text-base sm:text-xl font-black text-slate-900 mt-0.5">{totalOrdersCount} <span className="text-[10px] sm:text-xs font-semibold text-slate-500">Orders</span></p>
          </div>
          <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* CARD 2: IN PRODUCTION */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mr-1">In Production</p>
            <p className="text-base sm:text-xl font-black text-blue-600 mt-0.5">{runningOrdersCount} <span className="text-[10px] sm:text-xs font-semibold text-blue-500">Active</span></p>
          </div>
          <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* CARD 3: DHAGA CUTTING */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mr-1">Dhaga Cutting</p>
            <p className="text-base sm:text-xl font-black text-rose-600 mt-0.5">{dhagaCuttingOrdersCount} <span className="text-[10px] sm:text-xs font-semibold text-rose-500">Orders</span></p>
          </div>
          <div className="p-2 sm:p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shrink-0">
            <Scissors className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* CARD 4: COMPLETED */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mr-1">Completed</p>
            <p className="text-base sm:text-xl font-black text-emerald-600 mt-0.5">{completedOrdersCount} <span className="text-[10px] sm:text-xs font-semibold text-emerald-500">Done</span></p>
          </div>
          <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* UNIFIED CONTROL BAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Title Badge */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
              Job Orders List
            </h2>
            <p className="text-[10px] text-slate-500 font-medium">Colorwise breakdown and order tracking</p>
          </div>
        </div>

        {/* Search, Custom Dropdowns & Action Button */}
        <div className="flex items-center gap-2 flex-wrap text-xs w-full lg:w-auto justify-end">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Party, Machine, Design..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 h-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* CUSTOM PARTY FILTER DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsPartyDropdownOpen(!isPartyDropdownOpen);
                setIsStatusDropdownOpen(false);
              }}
              className="px-3 h-9 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <span>{partyFilter === "All" ? "All Parties" : partyFilter}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isPartyDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isPartyDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsPartyDropdownOpen(false)} />
                <div className="absolute right-0 top-11 z-30 w-48 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setPartyFilter("All");
                      setIsPartyDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                      partyFilter === "All" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>All Parties</span>
                    {partyFilter === "All" && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                  {availableParties.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPartyFilter(p);
                        setIsPartyDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                        partyFilter === p ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate">{p}</span>
                      {partyFilter === p && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* CUSTOM STATUS FILTER DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsStatusDropdownOpen(!isStatusDropdownOpen);
                setIsPartyDropdownOpen(false);
              }}
              className="px-3 h-9 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <span>{statusFilter === "All" ? "All Statuses" : statusFilter}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isStatusDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsStatusDropdownOpen(false)} />
                <div className="absolute right-0 top-11 z-30 w-48 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 font-sans">
                  {["All", ...STATUS_LIST].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setStatusFilter(st);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                        statusFilter === st ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>{st === "All" ? "All Statuses" : st}</span>
                      {statusFilter === st && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Add Job Order Button */}
          <button
            type="button"
            onClick={() => setShowInlineForm(!showInlineForm)}
            className="px-3.5 h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job Order</span>
          </button>
        </div>
      </div>

      {/* INLINE FORM TO CREATE NEW JOB ORDER */}
      {showInlineForm && (
        <div className="bg-white p-4.5 rounded-2xl border border-blue-200 shadow-lg space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Briefcase className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Create New Job Order</h3>
            </div>
            <button
              onClick={() => setShowInlineForm(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs font-sans">
            {/* Import from Design Library Banner */}
            {availableDesignFolders.length > 0 && (
              <div className="relative bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs">Import from Design Library</span>
                    <p className="text-[10px] text-slate-500 font-medium">Selecting will auto-fill Party, Design Code, and Color Breakdown Pcs</p>
                  </div>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormDesignOpen(!isFormDesignOpen);
                      setIsFormPartyOpen(false);
                      setIsFormMachineOpen(false);
                    }}
                    className="px-3 h-8 bg-white border border-blue-300 hover:bg-blue-100 text-blue-800 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Choose Design</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-blue-600 transition-transform ${isFormDesignOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isFormDesignOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setIsFormDesignOpen(false)} />
                      <div className="absolute right-0 top-10 z-30 w-72 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 space-y-1 max-h-56 overflow-y-auto font-sans">
                        {availableDesignFolders.map((df) => (
                          <button
                            key={df.id}
                            type="button"
                            onClick={() => handleSelectDesignFolder(df)}
                            className="w-full p-2 rounded-lg hover:bg-blue-50 text-left transition-colors flex flex-col gap-0.5 border border-transparent hover:border-blue-100"
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                              <span className="text-blue-700 font-mono">{(df.folder_code || "").replace(/#/g, "")}</span>
                              <span className="text-[10px] text-slate-500">{df.party_name}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 truncate font-semibold">{df.title || "No Title"}</div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Party Select */}
              <div className="relative">
                <label className="block font-bold text-slate-700 mb-1">Party Name *</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormPartyOpen(!isFormPartyOpen);
                    setIsFormMachineOpen(false);
                    setIsFormDesignOpen(false);
                  }}
                  className="w-full px-3 h-9 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs flex items-center justify-between hover:bg-slate-100"
                >
                  <span className="truncate">{formData.party_name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isFormPartyOpen ? "rotate-180" : ""}`} />
                </button>

                {isFormPartyOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsFormPartyOpen(false)} />
                    <div className="absolute left-0 top-16 z-30 w-full bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 space-y-0.5 font-sans max-h-48 overflow-y-auto">
                      {availableParties.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, party_name: p });
                            setIsFormPartyOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                            formData.party_name === p ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span className="truncate">{p}</span>
                          {formData.party_name === p && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Machine Assignment Select */}
              <div className="relative">
                <label className="block font-bold text-slate-700 mb-1">Assign Machine *</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormMachineOpen(!isFormMachineOpen);
                    setIsFormPartyOpen(false);
                    setIsFormDesignOpen(false);
                  }}
                  className="w-full px-3 h-9 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs flex items-center justify-between hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Cpu className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{formData.assigned_machine}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isFormMachineOpen ? "rotate-180" : ""}`} />
                </button>

                {isFormMachineOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsFormMachineOpen(false)} />
                    <div className="absolute left-0 top-16 z-30 w-full bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 space-y-0.5 font-sans">
                      {formMachineOptions.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, assigned_machine: m });
                            setIsFormMachineOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                            formData.assigned_machine === m ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span>{m}</span>
                          {formData.assigned_machine === m && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Design Code */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Design Code / No *</label>
                <input
                  type="text"
                  placeholder="e.g. PJD-2486 (No #)"
                  value={formData.design_code}
                  onChange={(e) => setFormData({ ...formData, design_code: e.target.value.replace(/#/g, "") })}
                  className="w-full px-3 h-9 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 bg-slate-50/50"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Rani Silk Saree Work"
                  value={formData.design_name}
                  onChange={(e) => setFormData({ ...formData, design_name: e.target.value })}
                  className="w-full px-3 h-9 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
              {/* Colorways input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Colorwise Breakdown Pcs</label>
                  <span className="text-[10px] text-slate-400 font-medium">Format: Rani: 60, Rama: 50</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Rani: 60, Rama: 50"
                  value={formData.colorways_input}
                  onChange={(e) => {
                    const newStr = e.target.value;
                    const parsed = parseColorwaysInput(newStr);
                    const sum = parsed.reduce((acc, c) => acc + (c.pcs || 0), 0);
                    setFormData({
                      ...formData,
                      colorways_input: newStr,
                      total_quantity: sum > 0 ? sum : formData.total_quantity
                    });
                  }}
                  className="w-full px-3 h-9 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-blue-500 bg-slate-50/50"
                />

                {/* Visual Parsed Color Badges */}
                {liveParsedColors.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400">Parsed Breakdown:</span>
                    {liveParsedColors.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-[10px] font-bold">
                        {c.color_name}: <span className="font-extrabold">{c.pcs} Pcs</span>
                      </span>
                    ))}
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Sum = {liveColorwiseSum} Pcs
                    </span>
                  </div>
                )}
              </div>

              {/* Total Quantity calculation info */}
              <div className="flex flex-col justify-center">
                <label className="block font-bold text-slate-700 mb-1">Total Quantity</label>
                <div className="px-3 h-9 bg-slate-100 border border-slate-200 rounded-xl font-mono font-black text-slate-900 text-sm flex items-center">
                  {liveColorwiseSum > 0 ? liveColorwiseSum : formData.total_quantity} Pcs
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-medium">
                Calculated Total: <strong className="text-slate-900 font-extrabold">{liveColorwiseSum > 0 ? liveColorwiseSum : formData.total_quantity} Pcs</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowInlineForm(false)}
                  className="px-4 h-9 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs active:scale-98"
                >
                  Save Job Order
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* STRICT UNIFORM FIXED-HEIGHT JOB ORDERS TABLE & MOBILE CARDS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* MOBILE CARD VIEW (< md) - No horizontal scroll */}
        <div className="block md:hidden p-3 sm:p-4 space-y-3 bg-slate-50/50">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold bg-white rounded-xl border border-slate-200">
              No orders found matching your search.
            </div>
          ) : (
            filteredOrders.map((item) => {
              const cleanCode = (item.design_code || "").replace(/#/g, "").trim();
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3"
                >
                  {/* Top Bar: Date, Party Name, Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md inline-block mb-1">
                        {item.date || "01/10/2026"}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm truncate" title={item.party_name}>
                        {item.party_name}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Machine & Status Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div>
                      {item.status === "Dhaga Cutting" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/90 rounded-lg text-xs font-extrabold">
                          <Scissors className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>Dhaga Cutting</span>
                        </span>
                      ) : item.status === "Ready for Dispatch" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200/90 rounded-lg text-xs font-extrabold">
                          <Check className="w-3 h-3 text-purple-500 shrink-0" />
                          <span>Ready Dispatch</span>
                        </span>
                      ) : item.status === "Completed" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/90 rounded-lg text-xs font-extrabold">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => toggleMachinePopover(item.id, e)}
                          className="inline-flex items-center gap-1 text-xs font-bold transition-all cursor-pointer"
                        >
                          {item.assigned_machine && item.assigned_machine !== "Unassigned" && item.assigned_machine !== "Select Machine" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-extrabold shadow-2xs">
                              <Cpu className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>{item.assigned_machine}</span>
                              <ChevronDown className="w-3 h-3 text-current opacity-70" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold">
                              <span>Unassigned</span>
                              <ChevronDown className="w-3 h-3 text-current opacity-70" />
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleStatusPopover(item.id, e)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer shadow-2xs ${
                        item.status === "Completed"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : item.status === "In Production"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : item.status === "Dhaga Cutting"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : item.status === "Ready for Dispatch"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <span>{item.status}</span>
                      <ChevronDown className="w-3 h-3 text-current opacity-70" />
                    </button>
                  </div>

                  {/* Description & Design Code */}
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Design Code</span>
                      <span className="font-mono font-black text-blue-700">{cleanCode || "-"}</span>
                    </div>
                    {item.design_name && item.design_name.trim() !== "" && (
                      <div className="text-slate-600 font-medium truncate mt-0.5">
                        {item.design_name}
                      </div>
                    )}
                  </div>

                  {/* Total Quantity & Color Breakdown */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-[65%] no-scrollbar">
                      {item.colorways && item.colorways.length > 0 ? (
                        item.colorways.map((cw, idx) => (
                          <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 inline-flex items-center gap-1">
                            <span>{cw.color_name}:</span>
                            <span className="text-blue-700 font-black">{cw.pcs}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs font-semibold">Single batch</span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                      <span className="font-black text-slate-900 text-sm">
                        {item.total_quantity.toLocaleString()} Pcs
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans table-fixed min-w-[1150px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider h-11">
                <th className="py-3 px-4 w-[110px]">Order Date</th>
                <th className="py-3 px-4 w-[160px]">Party Name</th>
                <th className="py-3 px-4 w-[140px]">Assigned Machine</th>
                <th className="py-3 px-4 w-[210px]">Description</th>
                <th className="py-3 px-4 w-[120px]">Design Code</th>
                <th className="py-3 px-4 w-[250px]">Colorwise Breakdown (Pcs)</th>
                <th className="py-3 px-4 w-[110px] text-right">Total Pcs</th>
                <th className="py-3 px-4 w-[150px]">Status</th>
                <th className="py-3 px-3 w-[50px] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredOrders.map((item) => {
                const cleanCode = (item.design_code || "").replace(/#/g, "").trim();
                const isPopoverOpen = statusPopoverPos?.orderId === item.id;
                const isMachinePopoverOpen = machinePopoverPos?.orderId === item.id;

                return (
                  <tr
                    key={item.id}
                    className={`h-14 transition-colors ${isPopoverOpen || isMachinePopoverOpen ? "bg-blue-50/60" : "hover:bg-blue-50/50"}`}
                  >
                    {/* 1. ORDER CREATION DATE */}
                    <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap align-middle">
                      {item.date || "01/10/2026"}
                    </td>

                    {/* 2. PARTY */}
                    <td className="py-2.5 px-4 font-bold text-slate-900 align-middle truncate" title={item.party_name}>
                      <div className="truncate">{item.party_name}</div>
                    </td>

                    {/* 3. ASSIGNED MACHINE (SHOW STYLED STAGE BADGES FOR POST-PRODUCTION STATUSES) */}
                    <td className="py-2.5 px-4 align-middle whitespace-nowrap">
                      {item.status === "Dhaga Cutting" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/90 rounded-lg text-xs font-extrabold select-none shadow-2xs" title="Order is in Dhaga Cutting stage (Off Machine)">
                          <Scissors className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>Dhaga Cutting</span>
                        </span>
                      ) : item.status === "Ready for Dispatch" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200/90 rounded-lg text-xs font-extrabold select-none shadow-2xs" title="Order is Ready for Dispatch (Off Machine)">
                          <Check className="w-3 h-3 text-purple-500 shrink-0" />
                          <span>Ready Dispatch</span>
                        </span>
                      ) : item.status === "Completed" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/90 rounded-lg text-xs font-extrabold select-none shadow-2xs" title="Order is Completed (Off Machine)">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => toggleMachinePopover(item.id, e)}
                          className="inline-flex items-center gap-1 text-xs font-bold transition-all cursor-pointer hover:scale-102"
                          title="Click to assign or change machine"
                        >
                          {item.assigned_machine && item.assigned_machine !== "Unassigned" && item.assigned_machine !== "Select Machine" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-extrabold shadow-2xs hover:bg-blue-100">
                              <Cpu className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>{item.assigned_machine}</span>
                              <ChevronDown className="w-3 h-3 text-current opacity-70 ml-0.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-200">
                              <span>Unassigned</span>
                              <ChevronDown className="w-3 h-3 text-current opacity-70 ml-0.5" />
                            </span>
                          )}
                        </button>
                      )}
                    </td>

                    {/* 4. DESCRIPTION */}
                    <td className="py-2.5 px-4 font-semibold text-slate-800 align-middle truncate" title={item.design_name}>
                      <div className="truncate">{item.design_name?.trim() ? item.design_name : "-"}</div>
                    </td>

                    {/* 5. DESIGN CODE (WITHOUT #) */}
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap align-middle">
                      {cleanCode}
                    </td>

                    {/* 6. COLORWISE BREAKDOWN (EXACT CALCULATED PCS) */}
                    <td className="py-2.5 px-4 align-middle">
                      <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap max-w-[240px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {item.colorways && item.colorways.length > 0 ? (
                          item.colorways.map((cw, idx) => (
                            <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold shrink-0 inline-flex items-center gap-1">
                              <span>{cw.color_name}:</span>
                              <span className="text-blue-700 font-black">{cw.pcs}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 font-semibold">{item.total_quantity}</span>
                        )}
                      </div>
                    </td>

                    {/* 7. TOTAL QUANTITY (PCS) */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap font-extrabold text-slate-900 text-sm align-middle">
                      {item.total_quantity.toLocaleString()}
                    </td>

                    {/* 8. STATUS (INTERACTIVE DROPDOWN FOR THIS ORDER) */}
                    <td className="py-2.5 px-4 whitespace-nowrap align-middle">
                      <button
                        type="button"
                        onClick={(e) => toggleStatusPopover(item.id, e)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer shadow-2xs hover:scale-102 ${
                          item.status === "Completed"
                            ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                            : item.status === "In Production"
                            ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            : item.status === "Dhaga Cutting"
                            ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            : item.status === "Ready for Dispatch"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        }`}
                        title="Click to change status for this specific order"
                      >
                        <span>{item.status}</span>
                        <ChevronDown className="w-3 h-3 text-current opacity-70" />
                      </button>
                    </td>

                    {/* 9. ACTION */}
                    <td className="py-2.5 px-3 text-center align-middle">
                      <button
                        onClick={() => handleDeleteOrder(item.id)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-xs">No job orders found matching filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FIXED VIEWPORT MACHINE DROPDOWN POPOVER */}
      {machinePopoverPos && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setMachinePopoverPos(null)} />
          <div
            style={{ top: `${machinePopoverPos.top}px`, left: `${machinePopoverPos.left}px` }}
            className="fixed z-[101] w-52 bg-white rounded-xl border border-slate-200 shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 font-sans"
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-100 mb-1">
              Assign to Machine
            </div>
            {availableMachines.map((m) => {
              const targetOrder = orders.find((o) => o.id === machinePopoverPos.orderId);
              const isSelected = (targetOrder?.assigned_machine || "Unassigned") === m;

              const busyOrder =
                m !== "Unassigned"
                  ? orders.find(
                      (o) => o.id !== machinePopoverPos.orderId && o.status !== "Completed" && o.assigned_machine === m
                    )
                  : null;

              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMachineChange(machinePopoverPos.orderId, m)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : busyOrder
                      ? "bg-amber-50/60 text-slate-600 hover:bg-amber-100/80 cursor-pointer"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{m}</span>
                    {busyOrder && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded shrink-0">
                        In Use ({busyOrder.design_code})
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* FIXED VIEWPORT STATUS DROPDOWN POPOVER */}
      {statusPopoverPos && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setStatusPopoverPos(null)} />
          <div
            style={{ top: `${statusPopoverPos.top}px`, left: `${statusPopoverPos.left}px` }}
            className="fixed z-[101] w-48 bg-white rounded-xl border border-slate-200 shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 font-sans"
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-100 mb-1">
              Update Order Status
            </div>
            {STATUS_LIST.map((st) => {
              const targetOrder = orders.find((o) => o.id === statusPopoverPos.orderId);
              const isSelected = targetOrder?.status === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(statusPopoverPos.orderId, st)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    isSelected ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{st}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
