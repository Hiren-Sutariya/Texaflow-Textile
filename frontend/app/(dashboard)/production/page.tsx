"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Cpu,
  Activity,
  Plus,
  Minus,
  Search,
  Check,
  X,
  Play,
  Wrench,
  User,
  Clock,
  Filter,
  BarChart3,
  Edit3,
  Trash2,
  Trophy,
  Award,
  MessageSquare,
  Share2,
  Copy,
  Send,
  CheckCircle2,
  AlertTriangle,
  ChevronDown
} from "lucide-react";

export interface ProductionLog {
  id: string;
  unit_id?: string;
  date: string;
  machine_id: string;
  machine_name: string;
  shift: "Day" | "Night";
  operator_name: string;
  party_name: string;
  design_code: string;
  color_name?: string;
  completed_pcs: number;
  completed_stitches?: number;
  notes?: string;
}

export interface EmbroideryMachine {
  id: string;
  unit_id?: string;
  machine_number: string; // e.g. "Machine 1"
  head_count: number;     // e.g. 12 Head, 17 Head, 20 Head
  needle_count: number;   // e.g. 12 Needles
  status: "Running" | "Idle" | "Maintenance" | "No Material";
  current_job?: {
    order_id?: string;
    party_name: string;
    design_code: string;
    design_name: string;
    target_pcs: number;
    completed_pcs: number;
    operator_name: string;
    started_date: string;
  };
}

// Initial Clean Machines - Unit 1
const initialMachinesUnit1: EmbroideryMachine[] = [
  { id: "u1-m-1", machine_number: "Machine 1", unit_id: "unit_1", head_count: 12, needle_count: 12, status: "Idle" },
  { id: "u1-m-2", machine_number: "Machine 2", unit_id: "unit_1", head_count: 17, needle_count: 12, status: "Idle" },
  { id: "u1-m-3", machine_number: "Machine 3", unit_id: "unit_1", head_count: 12, needle_count: 12, status: "Idle" },
  { id: "u1-m-4", machine_number: "Machine 4", unit_id: "unit_1", head_count: 12, needle_count: 12, status: "Idle" }
];

// Initial Clean Machines - Unit 2 (Kadodara)
const initialMachinesUnit2: EmbroideryMachine[] = [
  { id: "u2-m-1", machine_number: "Machine 1", unit_id: "unit_2", head_count: 20, needle_count: 12, status: "Idle" },
  { id: "u2-m-2", machine_number: "Machine 2", unit_id: "unit_2", head_count: 15, needle_count: 12, status: "Idle" },
  { id: "u2-m-3", machine_number: "Machine 3", unit_id: "unit_2", head_count: 17, needle_count: 12, status: "Idle" },
  { id: "u2-m-4", machine_number: "Machine 4", unit_id: "unit_2", head_count: 12, needle_count: 12, status: "Idle" },
  { id: "u2-m-5", machine_number: "Machine 5", unit_id: "unit_2", head_count: 12, needle_count: 12, status: "Idle" },
  { id: "u2-m-6", machine_number: "Machine 6", unit_id: "unit_2", head_count: 15, needle_count: 12, status: "Idle" }
];

// Initial Clean Production Logs
const initialLogs: ProductionLog[] = [];

export default function ProductionPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [activeUnit, setActiveUnit] = useState<string>("Unit 1");
  const [machines, setMachines] = useState<EmbroideryMachine[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("app_machines_unit_1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return initialMachinesUnit1;
  });
  const [logs, setLogs] = useState<ProductionLog[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("app_production_logs");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter(
              (l: any) =>
                l.party_name !== "ABC Tex Fabrics" &&
                l.party_name !== "Royal Fashion House" &&
                l.party_name !== "Shree Ram Textiles"
            );
          }
        }
      } catch {}
    }
    return [];
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedOperatorFilter, setSelectedOperatorFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  // Inline Machine Card Entry State (Direct card input, no modals!)
  const [inlinePcs, setInlinePcs] = useState<Record<string, string>>({});
  const [inlineStitches, setInlineStitches] = useState<Record<string, string>>({});
  const [inlineShift, setInlineShift] = useState<Record<string, "Day" | "Night">>({});
  const [inlineSavedToast, setInlineSavedToast] = useState<Record<string, boolean>>({});
  const [inlineNotes, setInlineNotes] = useState<Record<string, string>>({});
  const [inlineToastMessage, setInlineToastMessage] = useState<Record<string, string>>({});
  const [completingMachineId, setCompletingMachineId] = useState<string | null>(null);

  // WhatsApp Report Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappCopied, setWhatsappCopied] = useState(false);

  // Assign Order Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignMachineId, setAssignMachineId] = useState<string>("");
  const [assignPartyName, setAssignPartyName] = useState("");
  const [assignDesignCode, setAssignDesignCode] = useState("");
  const [assignDesignName, setAssignDesignName] = useState("");
  const [assignTargetPcs, setAssignTargetPcs] = useState("");
  const [assignOperator, setAssignOperator] = useState("");

  // Inline Add Machine State
  const [isAddingMachineInline, setIsAddingMachineInline] = useState(false);
  const [addMachineName, setAddMachineName] = useState("");
  const [addMachineHeadCount, setAddMachineHeadCount] = useState<number>(12);

  // Custom Floating Status Dropdown Menu State
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);



  // Prevent SSR Hydration Mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle Enter key navigation across form fields (Go to next input on Enter)
  const handleKeyDownOnForm = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      // If pressing enter inside a textarea or directly on submit button, proceed with standard submit
      if (
        target.tagName === "TEXTAREA" ||
        (target.tagName === "BUTTON" && (target as HTMLButtonElement).type === "submit")
      ) {
        return;
      }

      const form = e.currentTarget;
      const focusableElements = Array.from(
        form.querySelectorAll<HTMLElement>(
          "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), button[type='submit']:not([disabled])"
        )
      );

      const currentIndex = focusableElements.indexOf(target);
      if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
        e.preventDefault();
        const nextElement = focusableElements[currentIndex + 1];
        nextElement.focus();
      }
    }
  };

  // Load state from localStorage & sync with Job Orders per active unit
  useEffect(() => {
    const syncActiveUnitAndMachines = () => {
      const currentUnit = localStorage.getItem("app_active_unit") || "Unit 1";
      setActiveUnit(currentUnit);

      const defaultList = currentUnit === "Unit 2" ? initialMachinesUnit2 : initialMachinesUnit1;

      const storageKey = `app_machines_${currentUnit.toLowerCase().replace(/\s+/g, "_")}`;
      const savedMachines = localStorage.getItem(storageKey);
      
      let loadedMachines = defaultList;
      if (savedMachines) {
        try {
          const parsed = JSON.parse(savedMachines);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedMachines = parsed.map((m: EmbroideryMachine) => ({
              ...m,
              machine_number: (m.machine_number || "").replace(/#/g, "").trim()
            }));
          }
        } catch (e) {
          console.error("Error parsing machines", e);
        }
      }

      setMachines(loadedMachines);
    };

    syncActiveUnitAndMachines();
    window.addEventListener("app_location_change", syncActiveUnitAndMachines);
    window.addEventListener("app_data_update", syncActiveUnitAndMachines);

    return () => {
      window.removeEventListener("app_location_change", syncActiveUnitAndMachines);
      window.removeEventListener("app_data_update", syncActiveUnitAndMachines);
    };
  }, []);

  // Save machines to localStorage
  const saveMachines = (newMachines: EmbroideryMachine[]) => {
    setMachines(newMachines);
    try {
      localStorage.setItem("app_machines", JSON.stringify(newMachines));
      window.dispatchEvent(new Event("app_data_update"));
    } catch (e) {
      console.error("Error saving app_machines", e);
    }
  };

  // Save logs to localStorage
  const saveLogs = (newLogs: ProductionLog[]) => {
    setLogs(newLogs);
    localStorage.setItem("app_production_logs", JSON.stringify(newLogs));
  };

  // Sync completed Pcs to active job orders in localStorage
  const syncJobOrderPcsInLocalStorage = (machineNumber: string, designCode: string, newCompletedPcs: number) => {
    try {
      const ordersStr = localStorage.getItem("app_job_orders");
      if (ordersStr) {
        const ordersList = JSON.parse(ordersStr);
        if (Array.isArray(ordersList)) {
          const updatedOrders = ordersList.map((o: any) => {
            if (
              o.assigned_machine &&
              o.assigned_machine.toLowerCase() === machineNumber.toLowerCase() &&
              (o.design_code || "").replace(/#/g, "").trim().toLowerCase() === designCode.replace(/#/g, "").trim().toLowerCase()
            ) {
              return {
                ...o,
                completed_pcs: newCompletedPcs
              };
            }
            return o;
          });
          localStorage.setItem("app_job_orders", JSON.stringify(updatedOrders));
        }
      }
    } catch (e) {
      console.error("Error updating job order completed_pcs", e);
    }
  };

  // Direct Inline Machine Production Entry (Add Pcs & Stitches)
  const handleInlineAddPcs = (machine: EmbroideryMachine) => {
    const pcsVal = Number(inlinePcs[machine.id]);
    if (!pcsVal || pcsVal <= 0) {
      alert("Please enter valid Pcs!");
      return;
    }

    const rawStitches = (inlineStitches[machine.id] || "").replace(/,/g, "").trim();
    const stitchesVal = rawStitches && Number(rawStitches) > 0 ? Number(rawStitches) : 0;

    const shiftVal = inlineShift[machine.id] || "Day";
    const job = machine.current_job;
    const noteVal = (inlineNotes[machine.id] || "").trim();

    const newLog: ProductionLog = {
      id: `log-${Date.now()}`,
      date: new Date().toLocaleDateString("en-GB"),
      machine_id: machine.id,
      machine_name: machine.machine_number,
      shift: shiftVal,
      operator_name: job?.operator_name || "Ramesh Bhai",
      party_name: job?.party_name || "Direct Party",
      design_code: job?.design_code || "PJD-2486",
      completed_pcs: pcsVal,
      completed_stitches: stitchesVal,
      notes: noteVal || `${shiftVal} Shift Production`
    };

    let calculatedNewPcs = pcsVal;

    // Update completed_pcs & completed_stitches on machine in state & localStorage
    const updatedMachines = machines.map((mac) => {
      if (mac.id === machine.id && mac.current_job) {
        calculatedNewPcs = (mac.current_job.completed_pcs || 0) + pcsVal;
        return {
          ...mac,
          current_job: {
            ...mac.current_job,
            completed_pcs: calculatedNewPcs,
            completed_stitches: ((mac.current_job as any).completed_stitches || 0) + stitchesVal
          }
        };
      }
      return mac;
    });

    syncJobOrderPcsInLocalStorage(machine.machine_number, job?.design_code || "PJD-2486", calculatedNewPcs);
    saveMachines(updatedMachines);
    saveLogs([newLog, ...logs]);

    // Clear inputs & show instant success feedback
    setInlinePcs((prev) => ({ ...prev, [machine.id]: "" }));
    setInlineStitches((prev) => ({ ...prev, [machine.id]: "" }));
    setInlineNotes((prev) => ({ ...prev, [machine.id]: "" }));
    setInlineToastMessage((prev) => ({ ...prev, [machine.id]: "✓ Production Added!" }));
    setInlineSavedToast((prev) => ({ ...prev, [machine.id]: true }));
    setTimeout(() => {
      setInlineSavedToast((prev) => ({ ...prev, [machine.id]: false }));
    }, 2500);
  };

  // Direct Inline Machine Production Entry (Deduct Pcs & Stitches)
  const handleInlineDeductPcs = (machine: EmbroideryMachine) => {
    const pcsVal = Number(inlinePcs[machine.id]);
    if (!pcsVal || pcsVal <= 0) {
      alert("Please enter valid Pcs to deduct!");
      return;
    }
    const shiftVal = inlineShift[machine.id] || "Day";
    const job = machine.current_job;
    const noteVal = (inlineNotes[machine.id] || "").trim();

    // Read stitches ONLY if explicitly entered by user
    const rawStitches = (inlineStitches[machine.id] || "").replace(/,/g, "").trim();
    const stitchesVal = rawStitches && Number(rawStitches) > 0 ? Number(rawStitches) : undefined;

    const newLog: ProductionLog = {
      id: `log-${Date.now()}`,
      date: new Date().toLocaleDateString("en-GB"),
      machine_id: machine.id,
      machine_name: machine.machine_number,
      shift: shiftVal,
      operator_name: job?.operator_name || "Ramesh Bhai",
      party_name: job?.party_name || "Direct Party",
      design_code: job?.design_code || "PJD-2486",
      completed_pcs: -pcsVal,
      completed_stitches: stitchesVal ? -stitchesVal : undefined,
      notes: noteVal || `${shiftVal} Shift Deduction`
    };

    let calculatedNewPcs = 0;

    // Update completed_pcs & completed_stitches on machine in state & localStorage (clamped to min 0)
    const updatedMachines = machines.map((mac) => {
      if (mac.id === machine.id && mac.current_job) {
        const currentPcs = mac.current_job.completed_pcs || 0;
        const currentStitches = (mac.current_job as any).completed_stitches || 0;
        calculatedNewPcs = Math.max(0, currentPcs - pcsVal);
        return {
          ...mac,
          current_job: {
            ...mac.current_job,
            completed_pcs: calculatedNewPcs,
            completed_stitches: stitchesVal
              ? Math.max(0, currentStitches - stitchesVal)
              : currentStitches
          }
        };
      }
      return mac;
    });

    syncJobOrderPcsInLocalStorage(machine.machine_number, job?.design_code || "PJD-2486", calculatedNewPcs);
    saveMachines(updatedMachines);
    saveLogs([newLog, ...logs]);

    // Clear inputs & show instant success feedback
    setInlinePcs((prev) => ({ ...prev, [machine.id]: "" }));
    setInlineStitches((prev) => ({ ...prev, [machine.id]: "" }));
    setInlineNotes((prev) => ({ ...prev, [machine.id]: "" }));
    setInlineToastMessage((prev) => ({ ...prev, [machine.id]: "✓ Production Deducted!" }));
    setInlineSavedToast((prev) => ({ ...prev, [machine.id]: true }));
    setTimeout(() => {
      setInlineSavedToast((prev) => ({ ...prev, [machine.id]: false }));
    }, 2500);
  };

  // Mark Current Design Job on Machine as Complete -> Moves to Dhaga Cutting
  const handleMarkJobComplete = (machine: EmbroideryMachine) => {
    const job = machine.current_job;
    if (!job) return;

    if (
      !confirm(
        `Are you sure design "${job.design_code}" (${job.party_name}) on ${machine.machine_number} is completed and moving to Dhaga Cutting?`
      )
    ) {
      return;
    }

    const targetStatus = "Dhaga Cutting";

    // 1. Update ONLY matching job order assigned strictly to this machine in localStorage
    try {
      const ordersStr = localStorage.getItem("app_job_orders");
      if (ordersStr) {
        const ordersList = JSON.parse(ordersStr);
        if (Array.isArray(ordersList)) {
          let updated = false;
          const updatedOrders = ordersList.map((o: any) => {
            // Match strictly by order_id or exact assigned_machine
            const isMatchByMachine =
              o.assigned_machine &&
              o.assigned_machine.trim().toLowerCase() === machine.machine_number.trim().toLowerCase();

            const isMatchByOrderId = job.order_id && o.id === job.order_id;

            if (!updated && (isMatchByOrderId || isMatchByMachine)) {
              updated = true;
              return {
                ...o,
                status: targetStatus,
                assigned_machine: "Unassigned"
              };
            }
            return o;
          });
          localStorage.setItem("app_job_orders", JSON.stringify(updatedOrders));
        }
      }
    } catch (e) {
      console.error("Error updating job order status in handleMarkJobComplete", e);
    }

    // 2. Add completed design item to finished stock for Dispatches page
    try {
      const finishedStr = localStorage.getItem("app_finished_designs");
      let finishedList: any[] = [];
      if (finishedStr) {
        finishedList = JSON.parse(finishedStr);
      }
      const newFinishedItem = {
        id: `fd-${Date.now()}`,
        design_code: job.design_code,
        design_name: job.design_name,
        party_name: job.party_name,
        machine_number: machine.machine_number,
        total_pcs_produced: job.completed_pcs || job.target_pcs,
        total_stitches: (job as any).completed_stitches || 0,
        completion_date: new Date().toLocaleDateString("en-GB"),
        status: targetStatus,
        dispatched_pcs: 0,
        remaining_pcs: job.completed_pcs || job.target_pcs
      };
      if (Array.isArray(finishedList)) {
        finishedList.unshift(newFinishedItem);
        localStorage.setItem("app_finished_designs", JSON.stringify(finishedList));
      }
    } catch (e) {
      console.error("Error saving finished design", e);
    }

    // 3. Set machine status to Idle and clear current_job
    const updatedMachines = machines.map((m) => {
      if (m.id === machine.id) {
        return {
          ...m,
          status: "Idle" as const,
          current_job: undefined
        };
      }
      return m;
    });

    saveMachines(updatedMachines);
    window.dispatchEvent(new Event("app_data_update"));
    window.dispatchEvent(new Event("storage"));
    setCompletingMachineId(null);
  };



  // Quick Change Machine Status directly from machine card header
  const handleQuickChangeStatus = (machineId: string, newStatus: EmbroideryMachine["status"]) => {
    const updated = machines.map((m) => {
      if (m.id === machineId) {
        return {
          ...m,
          status: newStatus
        };
      }
      return m;
    });
    saveMachines(updated);
  };

  // Delete Machine
  const handleDeleteMachine = (machineId: string) => {
    const targetMach = machines.find((m) => m.id === machineId);
    if (!targetMach) return;

    // Check if machine currently has a job running or assigned
    let busyDesignCode = targetMach.current_job?.design_code;
    let busyPartyName = targetMach.current_job?.party_name;

    // Check localStorage app_job_orders for active assignments to this machine
    try {
      const ordersStr = localStorage.getItem("app_job_orders");
      if (ordersStr) {
        const ordersList: any[] = JSON.parse(ordersStr);
        if (Array.isArray(ordersList)) {
          const assignedOrder = ordersList.find(
            (o) =>
              o.assigned_machine?.toLowerCase() === targetMach.machine_number.toLowerCase() &&
              o.status !== "Completed"
          );
          if (assignedOrder) {
            busyDesignCode = busyDesignCode || assignedOrder.design_code;
            busyPartyName = busyPartyName || assignedOrder.party_name;
          }
        }
      }
    } catch (e) {
      console.error("Error reading app_job_orders in handleDeleteMachine:", e);
    }

    if (busyDesignCode) {
      alert(
        `⚠️ ${targetMach.machine_number} already has design ${busyDesignCode}${busyPartyName ? ` (${busyPartyName})` : ""} running! Please finish or unassign the order before deleting.`
      );
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${targetMach.machine_number}?`)) {
      const updated = machines.filter((m) => m.id !== machineId);
      saveMachines(updated);

      // Clean up any remaining references in localStorage app_job_orders
      try {
        const ordersStr = localStorage.getItem("app_job_orders");
        if (ordersStr) {
          let ordersList: any[] = JSON.parse(ordersStr);
          if (Array.isArray(ordersList)) {
            let changed = false;
            ordersList = ordersList.map((o) => {
              if (o.assigned_machine?.toLowerCase() === targetMach.machine_number.toLowerCase()) {
                changed = true;
                return {
                  ...o,
                  assigned_machine: "Unassigned",
                  status: o.status === "In Production" ? "Pending" : o.status
                };
              }
              return o;
            });
            if (changed) {
              localStorage.setItem("app_job_orders", JSON.stringify(ordersList));
              window.dispatchEvent(new Event("app_data_update"));
            }
          }
        }
      } catch (e) {
        console.error("Error unassigning deleted machine orders:", e);
      }
    }
  };

  // Direct Inline Add Machine Handler
  const handleDirectAddMachineInline = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = (addMachineName || `Machine ${machines.length + 1}`).replace(/#/g, "").trim();
    if (!cleanName) {
      alert("Please enter Machine Name!");
      return;
    }

    const newMachineObj: EmbroideryMachine = {
      id: `m-${Date.now()}`,
      machine_number: cleanName,
      head_count: Number(addMachineHeadCount) || 12,
      needle_count: 12,
      status: "Idle"
    };

    saveMachines([...machines, newMachineObj]);
    setIsAddingMachineInline(false);
    setAddMachineName("");
    setAddMachineHeadCount(12);
  };

  // Open Assign Order Modal
  const openAssignModal = (machineId: string) => {
    setAssignMachineId(machineId);
    setAssignPartyName("");
    setAssignDesignCode("");
    setAssignDesignName("");
    setAssignTargetPcs("");
    setAssignOperator("");
    setIsAssignModalOpen(true);
  };

  // Save Machine Job Order Assignment
  const handleSaveAssignJob = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMachine = machines.find((m) => m.id === assignMachineId);
    if (!targetMachine) return;

    // Check if machine already has an active job running
    if (targetMachine.status === "Running" && targetMachine.current_job) {
      alert(
        `⚠️ ${targetMachine.machine_number} already has design ${targetMachine.current_job.design_code} (${targetMachine.current_job.party_name}) running! Please finish or unassign the order before assigning a new job.`
      );
      setIsAssignModalOpen(false);
      return;
    }

    const cleanDesignCode = assignDesignCode.replace(/#/g, "").trim();
    const targetPcsNum = Number(assignTargetPcs) || 35;

    const updated = machines.map((m) => {
      if (m.id === assignMachineId) {
        return {
          ...m,
          status: "Running" as const,
          current_job: {
            order_id: `ord-${Date.now()}`,
            party_name: assignPartyName.trim(),
            design_code: cleanDesignCode,
            design_name: assignDesignName.trim() || "Job Work",
            target_pcs: targetPcsNum,
            completed_pcs: 0,
            completed_stitches: 0,
            operator_name: assignOperator.trim() || "Operator",
            started_date: new Date().toLocaleDateString("en-GB")
          }
        };
      }
      return m;
    });

    saveMachines(updated);

    // Sync with app_job_orders in localStorage to avoid stale/duplicate machine assignments
    try {
      const ordersStr = localStorage.getItem("app_job_orders");
      let ordersList: any[] = ordersStr ? JSON.parse(ordersStr) : [];
      if (!Array.isArray(ordersList)) ordersList = [];

      // Unassign any existing order assigned to this machine
      ordersList = ordersList.map((o) => {
        if (o.assigned_machine?.toLowerCase() === targetMachine.machine_number.toLowerCase()) {
          return { ...o, assigned_machine: "Unassigned" };
        }
        return o;
      });

      // Find if an order with same party & design exists, or create a new one
      const existingIdx = ordersList.findIndex(
        (o) =>
          o.party_name?.toLowerCase() === assignPartyName.trim().toLowerCase() &&
          o.design_code?.replace(/#/g, "").trim().toLowerCase() === cleanDesignCode.toLowerCase() &&
          o.status !== "Completed"
      );

      if (existingIdx >= 0) {
        ordersList[existingIdx].assigned_machine = targetMachine.machine_number;
        ordersList[existingIdx].status = "In Production";
        ordersList[existingIdx].total_quantity = targetPcsNum;
        ordersList[existingIdx].completed_pcs = 0;
        ordersList[existingIdx].completed_stitches = 0;
      } else {
        ordersList.unshift({
          id: `ord-${Date.now()}`,
          order_no: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
          date: new Date().toLocaleDateString("en-GB"),
          party_name: assignPartyName.trim(),
          design_name: assignDesignName.trim() || "Job Work",
          design_code: cleanDesignCode,
          assigned_machine: targetMachine.machine_number,
          colorways: [{ color_name: "Standard Run", pcs: targetPcsNum }],
          total_quantity: targetPcsNum,
          completed_pcs: 0,
          completed_stitches: 0,
          unit: "Pcs",
          rate_per_1k: 0,
          target_date: new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-GB"),
          status: "In Production",
          notes: "Assigned directly from Production Dashboard"
        });
      }

      localStorage.setItem("app_job_orders", JSON.stringify(ordersList));
      window.dispatchEvent(new Event("app_data_update"));
    } catch (e) {
      console.error("Failed to sync job orders on assign", e);
    }

    setIsAssignModalOpen(false);
  };

  // Unassign / Finish Job on Machine
  const handleFinishJob = (machineId: string) => {
    const targetMachine = machines.find((m) => m.id === machineId);
    const updated = machines.map((m) => {
      if (m.id === machineId) {
        return {
          ...m,
          status: "Idle" as const,
          current_job: undefined
        };
      }
      return m;
    });
    saveMachines(updated);

    if (targetMachine) {
      try {
        const ordersStr = localStorage.getItem("app_job_orders");
        if (ordersStr) {
          const ordersList = JSON.parse(ordersStr);
          if (Array.isArray(ordersList)) {
            const cleaned = ordersList.map((o) => {
              if (o.assigned_machine?.toLowerCase() === targetMachine.machine_number.toLowerCase()) {
                return {
                  ...o,
                  assigned_machine: "Unassigned",
                  completed_pcs: 0,
                  completed_stitches: 0
                };
              }
              return o;
            });
            localStorage.setItem("app_job_orders", JSON.stringify(cleaned));
            window.dispatchEvent(new Event("app_data_update"));
          }
        }
      } catch (e) {}
    }
  };

  const filteredMachines = machines.filter((m) => {
    const matchesSearch =
      m.machine_number.toLowerCase().includes(search.toLowerCase()) ||
      (m.current_job?.party_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.current_job?.design_code || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.current_job?.operator_name || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Karigar (Operator) Performance Summary
  const operatorPerformance = useMemo(() => {
    const map: Record<
      string,
      { operator_name: string; total_pcs: number; total_stitches: number; shifts_count: number }
    > = {};

    logs.forEach((log) => {
      const name = (log.operator_name || "").trim();
      if (!name) return;
      if (!map[name]) {
        map[name] = { operator_name: name, total_pcs: 0, total_stitches: 0, shifts_count: 0 };
      }
      map[name].total_pcs += Number(log.completed_pcs) || 0;
      map[name].total_stitches += Number(log.completed_stitches) || 0;
      map[name].shifts_count += 1;
    });

    return Object.values(map).sort((a, b) => b.total_pcs - a.total_pcs);
  }, [logs]);

  const totalFactoryProduction = useMemo(() => {
    return operatorPerformance.reduce((acc, curr) => acc + curr.total_pcs, 0);
  }, [operatorPerformance]);

  // Helper to format Stitches in Lakhs cleanly (e.g. 4000000 -> "40.00 Lakh")
  const formatLakhsOnly = (stitchesCount: number) => {
    if (!stitchesCount || stitchesCount <= 0) return "0.00 Lakh";
    const lakhsVal = (stitchesCount / 100000).toFixed(2);
    return `${lakhsVal} Lakh`;
  };

  // Generate clean, professional structured side-by-side machine-wise WhatsApp Daily Report
  const generateWhatsAppReportText = () => {
    const todayStr = new Date().toLocaleDateString("en-GB");
    const runningMachines = machines.filter((m) => m.status === "Running");

    // Calculate total stitches & pcs across today's logs
    const todayLogs = logs.filter((l) => l.date === todayStr);
    const totalStitchesLogged = todayLogs.reduce((acc, curr) => acc + (Number(curr.completed_stitches) || 0), 0);
    const totalPcsLogged = todayLogs.reduce((acc, curr) => acc + (Number(curr.completed_pcs) || 0), 0);

    const displayTotalPcs = totalPcsLogged > 0 ? totalPcsLogged : totalFactoryProduction;

    let text = `🏭 *OM SAI EMBROIDERY - DAILY REPORT* 🧵\n`;
    text += `📅 *Date:* ${todayStr}\n\n`;

    text += `📊 *FACTORY SUMMARY:*\n`;
    text += `• Total Output: *${displayTotalPcs.toLocaleString("en-IN")} Pcs*\n`;
    if (totalStitchesLogged > 0) {
      text += `• Total Production: *${formatLakhsOnly(totalStitchesLogged)}*\n`;
    }
    text += `• Active Machines: *${runningMachines.length} / ${machines.length}*\n\n`;

    text += `⚙️ *MACHINE-WISE PRODUCTION:* \n`;
    text += `\`\`\`\n`;
    text += `┌─────────────────────┬─────────────────────┐\n`;

    const pad = (str: string, len: number) => {
      if (str.length >= len) return str.substring(0, len);
      return str + " ".repeat(len - str.length);
    };

    const getMachineCols = (m?: EmbroideryMachine) => {
      if (!m) {
        return {
          title: pad("", 19),
          lines: [pad("", 19), pad("", 19), pad("", 19), pad("", 19)]
        };
      }

      const job = m.current_job;
      const title = pad(`${m.machine_number} (${m.head_count}H)`, 19);

      if (job && m.status !== "Maintenance" && m.status !== "No Material") {
        const mLogsToday = logs.filter(
          (l) => (l.machine_id === m.id || l.machine_name.toLowerCase() === m.machine_number.toLowerCase()) && l.date === todayStr
        );
        const mPcsFromLogs = mLogsToday.reduce((acc, l) => acc + (Number(l.completed_pcs) || 0), 0);
        const mStitchesFromLogs = mLogsToday.reduce((acc, l) => acc + (Number(l.completed_stitches) || 0), 0);

        const pcsToShow = mLogsToday.length > 0 ? mPcsFromLogs : (job.completed_pcs || 0);
        const stitchesToShow = mStitchesFromLogs > 0 ? mStitchesFromLogs : ((job as any).completed_stitches || 0);
        const operatorName = job.operator_name || "Ramesh Bhai";

        return {
          title,
          lines: [
            pad(`Op: ${operatorName}`, 19),
            pad(`Des: ${job.design_code}`, 19),
            pad(`Pcs: ${pcsToShow.toLocaleString("en-IN")} Pcs`, 19),
            pad(`Prod: ${formatLakhsOnly(stitchesToShow)}`, 19)
          ]
        };
      } else {
        let statusText = "Status: Idle";
        if (m.status === "Maintenance") statusText = "Status: Maint.";
        else if (m.status === "No Material") statusText = "Status: No Mat.";

        return {
          title,
          lines: [
            pad(statusText, 19),
            pad("-", 19),
            pad("-", 19),
            pad("-", 19)
          ]
        };
      }
    };

    for (let i = 0; i < machines.length; i += 2) {
      const d1 = getMachineCols(machines[i]);
      const d2 = getMachineCols(machines[i + 1]);

      text += `│ ${d1.title} │ ${d2.title} │\n`;
      for (let k = 0; k < 4; k++) {
        text += `│ ${d1.lines[k]} │ ${d2.lines[k]} │\n`;
      }

      if (i + 2 < machines.length) {
        text += `├─────────────────────┼─────────────────────┤\n`;
      }
    }

    text += `└─────────────────────┴─────────────────────┘\n`;
    text += `\`\`\`\n\n`;
    text += `✨ *Om Sai Embroidery System*`;

    return text;
  };

  const handleSendWhatsApp = () => {
    const reportText = generateWhatsAppReportText();
    const cleanPhone = whatsappPhone.replace(/\D/g, "");
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(reportText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(reportText)}`;
    window.open(url, "_blank");
  };

  const handleCopyWhatsAppText = () => {
    const reportText = generateWhatsAppReportText();
    navigator.clipboard.writeText(reportText);
    setWhatsappCopied(true);
    setTimeout(() => setWhatsappCopied(false), 2500);
  };

  // Filtered logs matching search & Karigar dropdown filter
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.machine_name.toLowerCase().includes(search.toLowerCase()) ||
        log.party_name.toLowerCase().includes(search.toLowerCase()) ||
        log.design_code.toLowerCase().includes(search.toLowerCase()) ||
        log.operator_name.toLowerCase().includes(search.toLowerCase());

      const matchesOperator =
        selectedOperatorFilter === "All" ||
        log.operator_name.toLowerCase() === selectedOperatorFilter.toLowerCase();

      return matchesSearch && matchesOperator;
    });
  }, [logs, search, selectedOperatorFilter]);

  // Pagination calculation (10 items max per page)
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  if (!isMounted) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* FILTER & SEARCH BAR WITH ADD MACHINE ACTIONS */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs text-xs">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const nextNum = machines.length + 1;
              setAddMachineName(`Machine ${nextNum}`);
              setAddMachineHeadCount(12);
              setIsAddingMachineInline(!isAddingMachineInline);
            }}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Add a new Embroidery Machine"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Add Machine</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Generate & Send WhatsApp Daily Report"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Report</span>
          </button>
        </div>

        <div className="flex items-center w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
            {["All", "Running", "Idle", "Maintenance"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-slate-600" />
            Machine Status & Active Orders
          </h2>
        </div>

        {/* INLINE ADD NEW MACHINE BAR (NO MODALS / POPUPS!) */}
        {isAddingMachineInline && (
          <form onSubmit={handleDirectAddMachineInline} onKeyDown={handleKeyDownOnForm} className="mb-4 p-3 bg-blue-50/90 border-2 border-blue-400 rounded-2xl shadow-2xs flex flex-wrap items-center gap-3 animate-in fade-in duration-100">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-extrabold text-blue-950 text-xs">Add New Machine:</span>
            </div>

            <input
              type="text"
              placeholder="Machine Name (e.g. Machine 5) *"
              value={addMachineName}
              onChange={(e) => setAddMachineName(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-500 w-44"
              autoFocus
              required
            />

            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="100"
                placeholder="Head (e.g. 12)"
                value={addMachineHeadCount || ""}
                onChange={(e) => setAddMachineHeadCount(e.target.value === "" ? 12 : Number(e.target.value))}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-500 w-24 text-center"
              />
              <span className="text-xs font-bold text-slate-600">Head</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Machine</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddingMachineInline(false)}
                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMachines.map((m) => {
            const isRunning = m.status === "Running";
            const isMaintenance = m.status === "Maintenance";
            const job = m.current_job;
            const progressPercent = job && job.target_pcs > 0
              ? Math.min(100, Math.round((job.completed_pcs / job.target_pcs) * 100))
              : 0;

            return (
              <div
                key={m.id}
                className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between space-y-4 shadow-2xs relative ${
                  isRunning
                    ? "border-emerald-300 ring-1 ring-emerald-200/50"
                    : isMaintenance
                    ? "border-red-200 bg-red-50/20"
                    : "border-slate-200"
                }`}
              >
                {/* Header Machine Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <span className="font-mono font-black text-slate-900 text-sm whitespace-nowrap">{m.machine_number}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0 whitespace-nowrap">
                        {m.head_count} Head
                      </span>
                      {activeUnit === "Owner View" && (
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${
                          m.unit_id === "unit_2" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {m.unit_id === "unit_2" ? "Unit 2 (Pandesara)" : "Unit 1 (Katargam)"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      {/* Custom Sleek Floating Status Badge Selector */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setOpenStatusMenuId(openStatusMenuId === m.id ? null : m.id)}
                          className={`text-[10px] font-extrabold px-2 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                            m.status === "Running"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                              : m.status === "Maintenance"
                              ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              : m.status === "No Material"
                              ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                              : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                          }`}
                          title="Click to Change Status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              m.status === "Running"
                                ? "bg-emerald-500 animate-pulse"
                                : m.status === "Maintenance"
                                ? "bg-red-500"
                                : m.status === "No Material"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            }`}
                          />
                          <span>{m.status}</span>
                          <ChevronDown className="w-3 h-3 text-slate-400 opacity-70" />
                        </button>

                        {/* Custom Floating Status Menu */}
                        {openStatusMenuId === m.id && (
                          <>
                            {/* Backdrop overlay */}
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenStatusMenuId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                              {(job
                                ? [
                                    { status: "Running", label: "Running", dotBg: "bg-emerald-500", text: "text-emerald-800", hover: "hover:bg-emerald-50" },
                                    { status: "Maintenance", label: "Maintenance", dotBg: "bg-red-500", text: "text-red-700", hover: "hover:bg-red-50" },
                                    { status: "No Material", label: "No Material", dotBg: "bg-amber-500", text: "text-amber-900", hover: "hover:bg-amber-50" }
                                  ]
                                : [
                                    { status: "Idle", label: "Idle (Free)", dotBg: "bg-slate-400", text: "text-slate-700", hover: "hover:bg-slate-50" },
                                    { status: "Maintenance", label: "Maintenance", dotBg: "bg-red-500", text: "text-red-700", hover: "hover:bg-red-50" },
                                    { status: "No Material", label: "No Material", dotBg: "bg-amber-500", text: "text-amber-900", hover: "hover:bg-amber-50" }
                                  ]
                              ).map((opt) => (
                                <button
                                  key={opt.status}
                                  type="button"
                                  onClick={() => {
                                    handleQuickChangeStatus(m.id, opt.status as EmbroideryMachine["status"]);
                                    setOpenStatusMenuId(null);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left transition-colors cursor-pointer ${opt.hover} ${
                                    m.status === opt.status ? "bg-slate-100/90 font-black" : "text-slate-600"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${opt.dotBg}`} />
                                    <span className={opt.text}>{opt.label}</span>
                                  </div>
                                  {m.status === opt.status && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Direct Trash Delete Icon Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteMachine(m.id)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Delete Machine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Current Assigned Job Details */}
                  {job ? (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs relative">
                      {/* Paused / Maintenance / No Material Banner if status is not Running */}
                      {m.status === "Maintenance" && (
                        <div className="bg-red-100 text-red-800 border border-red-200 px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5">
                          <Wrench className="w-3 h-3 text-red-600 shrink-0" />
                          <span>Machine in Maintenance (Job Paused)</span>
                        </div>
                      )}
                      {m.status === "No Material" && (
                        <div className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>No Material / Yarn (Job Paused)</span>
                        </div>
                      )}
                      {m.status === "Idle" && (
                        <div className="bg-slate-200/70 text-slate-700 border border-slate-300 px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5">
                          <span>⏸️ Machine Idle (Job Paused)</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">
                          {job.party_name}
                        </span>
                        <span className="font-mono font-extrabold text-blue-700 text-xs">{job.design_code}</span>
                      </div>

                      <p className="font-bold text-slate-800 text-[11px] truncate" title={job.design_name}>
                        {job.design_name}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 pt-1 border-t border-slate-200/60">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" /> {job.operator_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {job.started_date}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-extrabold">
                          <span className="text-slate-600">Progress</span>
                          <div className="flex items-center gap-1 font-mono">
                            <span className="text-emerald-700 font-bold">
                              {job.completed_pcs} / {job.target_pcs} Pcs
                            </span>
                            {job.completed_pcs > job.target_pcs ? (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded text-[9px] font-black shrink-0">
                                +{job.completed_pcs - job.target_pcs} Extra
                              </span>
                            ) : (
                              <span className="text-slate-500 font-bold">({progressPercent}%)</span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                            style={{ width: `${Math.min(100, progressPercent)}%` }}
                          />
                          {job.completed_pcs > job.target_pcs && (
                            <div
                              className="bg-amber-400 h-full transition-all duration-300 rounded-r-full"
                              style={{
                                width: `${Math.min(
                                  30,
                                  Math.round(((job.completed_pcs - job.target_pcs) / job.target_pcs) * 100)
                                )}%`
                              }}
                              title={`+${job.completed_pcs - job.target_pcs} Extra Pcs`}
                            />
                          )}
                        </div>
                      </div>

                      {/* Mark Design / Job Complete Button -> Moves to Dhaga Cutting */}
                      <button
                        type="button"
                        onClick={() => handleMarkJobComplete(m)}
                        className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                        title="Click to complete this design and move to Dhaga Cutting / Dispatches"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>✓ Complete Design</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      {m.status === "Maintenance" ? (
                        <div className="bg-red-50/70 p-4 rounded-xl border border-dashed border-red-300 text-center space-y-1 text-xs">
                          <p className="text-red-700 font-extrabold text-[11px] flex items-center justify-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-red-600" /> Machine under Maintenance
                          </p>
                          <p className="text-[10px] text-red-500 font-medium">Repair or Service in progress</p>
                        </div>
                      ) : m.status === "No Material" ? (
                        <div className="bg-amber-50/70 p-4 rounded-xl border border-dashed border-amber-300 text-center space-y-1 text-xs">
                          <p className="text-amber-900 font-extrabold text-[11px] flex items-center justify-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> No Material / Yarn
                          </p>
                          <p className="text-[10px] text-amber-600 font-medium">Waiting for yarn or fabric to start</p>
                        </div>
                      ) : (
                        <div className="bg-slate-50/70 p-4 rounded-xl border border-dashed border-slate-300 text-center space-y-1 text-xs">
                          <p className="text-slate-700 font-bold text-[11px]">🟢 Machine Idle (Free)</p>
                          <p className="text-[10px] text-slate-400">Machine is free to assign work</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Direct Inline Production Entry on Machine Card (No Modals!) */}
                <div className="pt-2 border-t border-slate-200/80 space-y-2 font-sans">
                  {job ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Shift Production Entry:</span>
                        {inlineSavedToast[m.id] && (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded animate-in fade-in ${
                              (inlineToastMessage[m.id] || "").includes("Deduct")
                                ? "text-amber-800 bg-amber-100 border border-amber-200"
                                : "text-emerald-800 bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            {inlineToastMessage[m.id] || "✓ Saved!"}
                          </span>
                        )}
                      </div>

                      {/* Row 1: Segmented Custom Pill Shift Selector + Pcs Input + Add & Deduct Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Custom Segmented Pill Toggle for Day / Night (No native OS select popup!) */}
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 shrink-0">
                          <button
                            type="button"
                            onClick={() => setInlineShift({ ...inlineShift, [m.id]: "Day" })}
                            className={`px-2 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                              (inlineShift[m.id] || "Day") === "Day"
                                ? "bg-amber-400 text-slate-950 shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Day
                          </button>
                          <button
                            type="button"
                            onClick={() => setInlineShift({ ...inlineShift, [m.id]: "Night" })}
                            className={`px-2 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                              inlineShift[m.id] === "Night"
                                ? "bg-indigo-600 text-white shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Night
                          </button>
                        </div>

                        <input
                          type="number"
                          min="1"
                          placeholder="Pcs"
                          value={inlinePcs[m.id] || ""}
                          onChange={(e) => setInlinePcs({ ...inlinePcs, [m.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleInlineAddPcs(m);
                            }
                          }}
                          className="h-8 w-14 px-1 text-center bg-slate-50 border border-slate-200 rounded-lg font-black text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 shrink-0"
                          title="Completed Pcs"
                        />

                        {/* Production / Stitches Input Box */}
                        <input
                          type="text"
                          placeholder="Stitches (Optional)"
                          value={inlineStitches[m.id] || ""}
                          onChange={(e) => setInlineStitches({ ...inlineStitches, [m.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleInlineAddPcs(m);
                            }
                          }}
                          className="h-8 flex-1 min-w-[110px] px-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 shrink-0"
                          title="Production Stitches (Optional)"
                        />

                        {/* Action Buttons: Add & Deduct */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleInlineAddPcs(m)}
                            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs flex items-center justify-center gap-0.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Add completed Pcs & Stitches"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleInlineDeductPcs(m)}
                            className="h-8 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold rounded-lg text-xs flex items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95"
                            title="Deduct Pcs & Stitches if mistake occurs"
                          >
                            <Minus className="w-3.5 h-3.5" />
                            <span>Deduct</span>
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Optional Remark Input (e.g., lower production, thread break, damage) */}
                      <div>
                        <input
                          type="text"
                          placeholder="Remark / Note (Optional, shown only in logs)"
                          value={inlineNotes[m.id] || ""}
                          onChange={(e) => setInlineNotes({ ...inlineNotes, [m.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleInlineAddPcs(m);
                            }
                          }}
                          className="w-full h-7 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
                        />
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push("/orders")}
                      className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-blue-700" />
                      <span>Assign Order in /orders</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DAILY SHIFT PRODUCTION LOGS TABLE WITH KARIGAR DROPDOWN FILTER & PAGINATION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Recent Shift Logs
            </span>
          </div>

          {/* Plain Clean Operator Dropdown Select Menu (Only Name) */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedOperatorFilter}
              onChange={(e) => {
                setSelectedOperatorFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="All">All Karigars</option>
              {operatorPerformance.map((op) => (
                <option key={op.operator_name} value={op.operator_name}>
                  {op.operator_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredLogs.length > 0 ? (
          <div>
            {/* MOBILE CARD VIEW (< md) - No horizontal scroll */}
            <div className="block md:hidden p-3 sm:p-4 space-y-3 bg-slate-50/50">
              {paginatedLogs.map((log) => {
                const stitches = log.completed_stitches;
                const formatted = stitches ? Math.abs(stitches).toLocaleString("en-IN") : "-";
                const lakhs = stitches ? (Math.abs(stitches) / 100000).toFixed(2) : "0";

                return (
                  <div
                    key={log.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2.5"
                  >
                    {/* Top Bar: Date, Shift & Machine */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {log.date}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.shift === "Day"
                              ? "bg-amber-50 text-amber-900 border border-amber-200"
                              : "bg-indigo-50 text-indigo-900 border border-indigo-200"
                          }`}
                        >
                          {log.shift} Shift
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-extrabold border border-slate-200">
                        {log.machine_name.replace(/#/g, "").trim()}
                      </span>
                    </div>

                    {/* Operator & Design */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Operator</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {log.operator_name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Design Code</span>
                        <span className="font-mono font-black text-blue-700 text-xs">
                          {log.design_code}
                        </span>
                      </div>
                    </div>

                    {/* Production Metrics 2-column */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed Pcs</span>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 font-black text-xs rounded-md border ${
                            log.completed_pcs >= 0
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                        >
                          {log.completed_pcs >= 0 ? `+${log.completed_pcs}` : `${log.completed_pcs}`} Pcs
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Stitches</span>
                        <span className="font-mono font-black text-slate-800 text-xs inline-block mt-0.5">
                          {stitches ? (
                            <span>{formatted} <span className="text-[10px] text-slate-500 font-semibold">({lakhs}L)</span></span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {log.notes && (
                      <div className="text-[11px] text-slate-500 bg-slate-50/60 p-2 rounded-lg border border-slate-100 truncate">
                        <span className="font-bold text-slate-600">Note: </span>{log.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200 min-w-[850px]">
                <thead className="bg-slate-50/90 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Machine</th>
                    <th className="px-4 py-3">Operator</th>
                    <th className="px-4 py-3">Design</th>
                    <th className="px-4 py-3">Shift</th>
                    <th className="px-4 py-3 text-right">Completed Pcs</th>
                    <th className="px-4 py-3 text-right">Stitches Completed</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                        No production logs found matching your filters. Click &quot;Daily Shift Entry&quot; to record output.
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600">{log.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">{log.machine_name.replace(/#/g, "").trim()}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-700">{log.operator_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono font-extrabold text-blue-700 text-xs">{log.design_code}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                            log.shift === "Day"
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-indigo-100 text-indigo-900 border border-indigo-200"
                          }`}
                        >
                          {log.shift} Shift
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span
                          className={`px-2.5 py-1 font-extrabold text-xs rounded-lg border ${
                            log.completed_pcs >= 0
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                        >
                          {log.completed_pcs >= 0 ? `+${log.completed_pcs}` : `${log.completed_pcs}`} Pcs
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-xs" suppressHydrationWarning>
                        {(() => {
                          const stitches = log.completed_stitches;
                          if (!stitches) return <span className="text-slate-400 font-medium">-</span>;
                          const formatted = Math.abs(stitches).toLocaleString("en-IN");
                          const lakhs = (Math.abs(stitches) / 100000).toFixed(2);
                          return (
                            <span className={log.completed_pcs >= 0 ? "text-slate-800" : "text-rose-700"}>
                              {log.completed_pcs < 0 ? `-${formatted}` : formatted} <span className="text-[10px] text-slate-500 font-semibold">({lakhs} L)</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-[11px] truncate max-w-xs">
                        {log.notes || "-"}
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS FOOTER */}
            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-bold text-slate-900">
                  {Math.min(currentPage * pageSize, filteredLogs.length)}
                </span>{" "}
                of <span className="font-bold text-slate-900">{filteredLogs.length}</span> entries
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer"
                >
                  Previous
                </button>

                <span className="px-2.5 font-bold text-slate-800">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No shift production entries recorded yet. Click <strong>Daily Shift Entry</strong> to record output.
          </div>
        )}
      </div>



      {/* MODAL 2: ASSIGN JOB ORDER TO MACHINE */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <Play className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Assign Job Order to Machine
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignJob} onKeyDown={handleKeyDownOnForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Party Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. ABC Tex Fabrics"
                    value={assignPartyName}
                    onChange={(e) => setAssignPartyName(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Design Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. PJD-2486"
                    value={assignDesignCode}
                    onChange={(e) => setAssignDesignCode(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono font-extrabold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Design Description</label>
                <input
                  type="text"
                  placeholder="e.g. Rani Silk Saree Work"
                  value={assignDesignName}
                  onChange={(e) => setAssignDesignName(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Pcs *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 450 Pcs"
                    value={assignTargetPcs}
                    onChange={(e) => setAssignTargetPcs(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-black text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Shift Operator *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Bhai"
                    value={assignOperator}
                    onChange={(e) => setAssignOperator(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-2xs transition-all"
                >
                  Assign to Machine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}





      {/* MODAL: WHATSAPP DAILY PRODUCTION REPORT SUMMARY */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100 font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>WhatsApp Daily Summary Report</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase">
                      Live Preview
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Send real-time factory output to Owner or Party via WhatsApp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>



            {/* Recipient Phone Number Input */}
            <div className="space-y-1 text-xs">
              <label className="block text-[11px] font-extrabold text-slate-700">
                Recipient Mobile Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 9898012345 (Leave empty to choose recipient in WhatsApp)"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>

            {/* Report Live Preview Container */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-extrabold text-slate-700">Formatted Message Payload:</span>
                {whatsappCopied ? (
                  <span className="text-emerald-700 font-extrabold text-[10px] bg-emerald-100 px-2 py-0.5 rounded animate-in fade-in">
                    ✓ Copied to Clipboard!
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium text-[10px]">
                    {generateWhatsAppReportText().split("\n").length} lines • {generateWhatsAppReportText().length} chars
                  </span>
                )}
              </div>

              <div className="bg-slate-900 text-emerald-300 p-4 rounded-xl border border-slate-800 font-mono text-xs whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed selection:bg-emerald-500 selection:text-slate-950 shadow-inner">
                {generateWhatsAppReportText()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopyWhatsAppText}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Copy Text</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Send via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
