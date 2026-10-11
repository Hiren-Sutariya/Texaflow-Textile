"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Folder,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Scissors,
  Check,
  Pencil,
  X,
  Trash2,
  Palette,
  Layers,
  Ruler,
  Hash,
  Building2,
  Sparkles,
  Calculator,
  Tag,
  CircleDot,
  Briefcase,
  Edit3,
  Package
} from "lucide-react";

interface ThreadItem {
  id: string;
  needle_no?: number | string; // Needle 1, 2, 3 or "N1"
  thread_name: string; // e.g. "Rani Pink", "Dull Gold Zari"
  thread_code?: string; // e.g. "Shade #402", "Zari #108"
  color_hex?: string; // e.g. "#EC4899"
  thread_type?: string; // e.g. "Polyester 120D", "Metallic Zari", "Silk Resham"
}

interface ColorTakka {
  id: string;
  color_name: string; // e.g. "Rani", "Rama"
  color_code?: string;
  takka_count: number; // e.g. 10 Takka
  roll_meters?: number[]; // Individual Takka roll meters e.g. [104, 103, 105, 102]
  override_pcs?: number; // e.g. 872 pcs
  threads?: ThreadItem[]; // Thread matching details for this fabric color
}

interface DesignItem {
  id: string;
  component_name: string; // e.g. "Front", "Back", "Patta"
  category: string;
  stitch_count: number;
  rate_per_1k: number; // e.g. 0.45 paise per 1000 stitches
}

interface DesignFolder {
  id: string;
  folder_code: string; // e.g. "Design #2486", "PJD-77-35"
  title: string;
  party_name: string; // e.g. "ABC Tex Fabrics"
  created_date: string;
  machine_requirement: string;
  takko_length_meters: number; // Standard 104 meters per Takko fallback
  cut_length_meters: number;   // Standard 0.93 meters per cut
  colorways: ColorTakka[];
  items: DesignItem[];
}

const initialFolders: DesignFolder[] = [
  {
    id: "des-dummy-1",
    folder_code: "PJD-2486",
    title: "Rani Silk Saree Work",
    party_name: "ABC Tex Fabrics",
    created_date: "2026-10-01",
    machine_requirement: "Multi-Head 12 Needles",
    takko_length_meters: 104,
    cut_length_meters: 0.93,
    items: [
      {
        id: "item-1",
        category: "Front",
        component_name: "Front Body",
        stitch_count: 48500,
        rate_per_1k: 0.45
      },
      {
        id: "item-2",
        category: "Back",
        component_name: "Back Body",
        stitch_count: 36200,
        rate_per_1k: 0.45
      },
      {
        id: "item-3",
        category: "Patta",
        component_name: "Pallu Border",
        stitch_count: 62000,
        rate_per_1k: 0.45
      }
    ],
    colorways: [
      {
        id: "cw-dummy-1",
        color_name: "Rani",
        color_code: "#E11D48",
        takka_count: 2,
        roll_meters: [106, 104],
        override_pcs: 60,
        threads: [
          {
            id: "th-1",
            needle_no: "N1",
            thread_name: "Rani Silk",
            thread_code: "Shade #104"
          },
          {
            id: "th-2",
            needle_no: "N2",
            thread_name: "Dull Gold Zari",
            thread_code: "Zari #802"
          }
        ]
      },
      {
        id: "cw-dummy-2",
        color_name: "Rama",
        color_code: "#0D9488",
        takka_count: 2,
        roll_meters: [105, 103],
        override_pcs: 50,
        threads: [
          {
            id: "th-3",
            needle_no: "N1",
            thread_name: "Rama Green",
            thread_code: "Shade #305"
          },
          {
            id: "th-4",
            needle_no: "N2",
            thread_name: "Silver Zari",
            thread_code: "Zari #901"
          }
        ]
      }
    ]
  }
];

export default function DesignsPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<DesignFolder[]>(initialFolders);
  const [search, setSearch] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedRollMetersColorId, setExpandedRollMetersColorId] = useState<string | null>(null);
  const [colorwayActiveTab, setColorwayActiveTab] = useState<Record<string, "takka" | "threads">>({});

  // Load design folders from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("app_design_folders");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFolders(parsed);
        }
      } catch (e) {
        console.error("Failed to load design folders from localStorage", e);
      }
    }
  }, []);

  const saveDesignFolders = (newFolders: DesignFolder[]) => {
    setFolders(newFolders);
    localStorage.setItem("app_design_folders", JSON.stringify(newFolders));
  };

  // Convert Design directly to a Job Order
  const handleCreateOrderFromDesign = (e: React.MouseEvent, folder: DesignFolder) => {
    e.stopPropagation();
    const totalPcs = getTotalPcsForFolder(folder) || 100;
    const avgRate = folder.items.length > 0 
      ? (folder.items.reduce((s, i) => s + i.rate_per_1k, 0) / folder.items.length)
      : 0.45;

    // Clean design code to ensure no '#' prefix
    const cleanDesignCode = folder.folder_code.replace(/#/g, "").trim();

    // Map colorways with calculated pcs
    const colorBreakdown = folder.colorways.map((cw) => ({
      color_name: cw.color_name,
      pcs: calculateColorPcs(cw, folder)
    }));

    // Build Job Order object (assigned_machine defaults to Unassigned so user chooses)
    const newOrder = {
      id: `ord-${Date.now()}`,
      order_no: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleDateString("en-GB"),
      party_name: folder.party_name,
      main_merchant: "Direct Order",
      fabric_quality: "Standard Fabric",
      design_name: folder.title && folder.title !== "-" ? folder.title : "Saree Heavy Design Suite",
      design_code: cleanDesignCode,
      assigned_machine: "Unassigned",
      colorways: colorBreakdown.length > 0 ? colorBreakdown : [{ color_name: "Standard Run", pcs: totalPcs }],
      total_quantity: totalPcs,
      unit: "Pcs" as const,
      rate_per_1k: Number(avgRate.toFixed(2)),
      target_date: new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-GB"),
      status: "Pending" as const,
      notes: ""
    };

    // Save to localStorage 'app_job_orders'
    const savedOrders = localStorage.getItem("app_job_orders");
    let existingOrders: any[] = [];
    if (savedOrders) {
      try {
        existingOrders = JSON.parse(savedOrders);
      } catch (err) {
        console.error(err);
      }
    }
    localStorage.setItem("app_job_orders", JSON.stringify([newOrder, ...existingOrders]));

    // Navigate to /orders
    router.push("/orders");
  };

  // INLINE TOGGLES
  const [isAddingFolderInline, setIsAddingFolderInline] = useState(false);
  const [isAddingColorInline, setIsAddingColorInline] = useState(false);
  const [isAddingComponentInline, setIsAddingComponentInline] = useState(false);

  // Form State: New Folder (Clean empty default state)
  const [newFolderParty, setNewFolderParty] = useState("");
  const [newFolderCode, setNewFolderCode] = useState("");
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [newFolderTakka, setNewFolderTakka] = useState<number | "">("");
  const [newFolderPcs, setNewFolderPcs] = useState<number | "">("");
  const [newFolderStitches, setNewFolderStitches] = useState<number | "">("");
  const [newFolderRate, setNewFolderRate] = useState<number | "">("");
  const [newFolderParts, setNewFolderParts] = useState("");

  // Refs for Keyboard Enter Navigation across form fields (Field 0 -> 7)
  const designFormRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Registered Parties list from localStorage (loads full party objects for suggestions)
  const [registeredParties, setRegisteredParties] = useState<
    { id: string; srNo: number; name: string; mobile: string; city: string; gstin: string }[]
  >([
    { id: "p-101", srNo: 1, name: "ABC Tex Fabrics", mobile: "+91 98765 43210", city: "Surat", gstin: "24AAAFA1234A1Z5" },
    { id: "p-102", srNo: 2, name: "Royal Fashion House", mobile: "+91 98251 99887", city: "Ahmedabad", gstin: "24BBBFR9876B1Z2" },
    { id: "p-103", srNo: 3, name: "Shree Ram Textiles", mobile: "+91 97230 44332", city: "Surat", gstin: "24CCCFS5544C1Z9" }
  ]);

  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [partyHighlightIdx, setPartyHighlightIdx] = useState<number>(0);

  const getPartySuggestionsList = () => {
    const clean = newFolderParty.trim().toLowerCase();
    const matched = registeredParties.filter((p) =>
      p.name.toLowerCase().includes(clean)
    );
    const showNewOption = !registeredParties.some(
      (p) => p.name.toLowerCase() === clean
    );
    return { matched, showNewOption, totalCount: matched.length + (showNewOption ? 1 : 0) };
  };

  const loadPartiesInDesigns = () => {
    const initialDefault = [
      { id: "p-101", srNo: 1, name: "ABC Tex Fabrics", mobile: "+91 98765 43210", city: "Surat", gstin: "24AAAFA1234A1Z5" },
      { id: "p-102", srNo: 2, name: "Royal Fashion House", mobile: "+91 98251 99887", city: "Ahmedabad", gstin: "24BBBFR9876B1Z2" },
      { id: "p-103", srNo: 3, name: "Shree Ram Textiles", mobile: "+91 97230 44332", city: "Surat", gstin: "24CCCFS5544C1Z9" }
    ];

    try {
      const saved = localStorage.getItem("app_parties");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRegisteredParties(parsed);
          return;
        }
      }
    } catch (e) {}

    setRegisteredParties(initialDefault);
  };

  useEffect(() => {
    loadPartiesInDesigns();
    const handleUpdate = () => loadPartiesInDesigns();
    window.addEventListener("app_data_update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("app_data_update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Ref wrapper for click-outside auto-closing party dropdown
  const partyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(event.target as Node)) {
        setIsPartyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Direct Add Party without Popup Modal
  const handleDirectAddParty = (targetName?: string) => {
    const cleanName = (targetName || newFolderParty).trim();
    if (!cleanName) {
      alert("Please enter party name!");
      return;
    }

    const exists = registeredParties.some(
      (p) => p.name.toLowerCase() === cleanName.toLowerCase()
    );

    let updatedList = [...registeredParties];
    if (!exists) {
      const nextSrNo =
        registeredParties.length > 0
          ? Math.max(...registeredParties.map((p) => p.srNo || 0)) + 1
          : 1;
      const newPartyObj = {
        id: `p-${Date.now()}`,
        srNo: nextSrNo,
        name: cleanName,
        mobile: "-",
        city: "Surat",
        gstin: "-",
        credit_days: 30,
        join_date: new Date().toLocaleDateString("en-GB")
      };

      updatedList = [newPartyObj, ...registeredParties];
      setRegisteredParties(updatedList);

      // Save to all 3 keys to ensure cross-page consistency everywhere
      try {
        localStorage.setItem("app_parties", JSON.stringify(updatedList));
        localStorage.setItem("app_parties_list", JSON.stringify(updatedList));
        localStorage.setItem("parties_register_data", JSON.stringify(updatedList));
        window.dispatchEvent(new Event("app_data_update"));
      } catch (err) {
        console.error("Error saving new party:", err);
      }
    }

    // Set selected party in design form & close dropdown
    setNewFolderParty(cleanName);
    setIsPartyDropdownOpen(false);

    // Focus next input (Design Code)
    setTimeout(() => {
      designFormRefs.current[1]?.focus();
    }, 100);
  };

  // Form State: Multi-Colorways Support
  interface DraftThreadRow {
    needle_no: string;
    thread_name: string;
    shade_code: string;
  }

  interface DraftColorRow {
    id: string;
    color_name: string;
    takka_count: number | "";
    roll_meters: string;
    threads: DraftThreadRow[];
  }

  const [colorDraftRows, setColorDraftRows] = useState<DraftColorRow[]>([
    {
      id: "cr-1",
      color_name: "",
      takka_count: "",
      roll_meters: "",
      threads: []
    }
  ]);

  const handleAddColorDraftRow = () => {
    setColorDraftRows((prev) => [
      ...prev,
      {
        id: `cr-${Date.now()}-${prev.length}`,
        color_name: "",
        takka_count: "",
        roll_meters: "",
        threads: []
      }
    ]);
  };

  const handleRemoveColorDraftRow = (rowId: string) => {
    setColorDraftRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleUpdateColorDraftRow = (
    rowId: string,
    field: "color_name" | "takka_count" | "roll_meters",
    value: any
  ) => {
    setColorDraftRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    );
  };

  const handleAddThreadToColorRow = (rowId: string) => {
    setColorDraftRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          return {
            ...r,
            threads: [
              ...r.threads,
              { needle_no: `N${r.threads.length + 1}`, thread_name: "", shade_code: "" }
            ]
          };
        }
        return r;
      })
    );
  };

  const handleRemoveThreadFromColorRow = (rowId: string, threadIdx: number) => {
    setColorDraftRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          return {
            ...r,
            threads: r.threads.filter((_, idx) => idx !== threadIdx)
          };
        }
        return r;
      })
    );
  };

  const handleUpdateThreadInColorRow = (
    rowId: string,
    threadIdx: number,
    field: "needle_no" | "thread_name" | "shade_code",
    value: string
  ) => {
    setColorDraftRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const updatedThreads = r.threads.map((th, idx) =>
            idx === threadIdx ? { ...th, [field]: value } : th
          );
          return { ...r, threads: updatedThreads };
        }
        return r;
      })
    );
  };

  // Keyboard navigation across form input fields on Enter
  const handleColorFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const target = e.target as HTMLInputElement;
      const form = target.form;
      if (!form) return;
      const focusable = Array.from(
        form.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
          'input:not([type="hidden"]):not([disabled]), button[type="submit"]'
        )
      );
      const index = focusable.indexOf(target);
      if (index > -1 && index < focusable.length - 1) {
        (focusable[index + 1] as HTMLElement).focus();
      } else if (index === focusable.length - 1) {
        form.requestSubmit();
      }
    }
  };

  // Form State: New Component inside selected folder
  const [newCompName, setNewCompName] = useState("");
  const [newCompCategory, setNewCompCategory] = useState<string>("Front");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>([
    "Front",
    "Back",
    "Patta",
    "Blouse",
    "Saree Body",
    "Dupatta",
    "Sleeve",
    "Daman",
    "Pallu",
    "Gala"
  ]);
  const [newCompStitch, setNewCompStitch] = useState<number | "">("");
  const [newCompRate, setNewCompRate] = useState<number | "">("");

  // Form State: New Thread Matching Inline inside Fabric Color card
  const [addingThreadForColorId, setAddingThreadForColorId] = useState<string | null>(null);
  const [newThreadNeedleNo, setNewThreadNeedleNo] = useState<string>("");
  const [newThreadName, setNewThreadName] = useState("");
  const [newThreadCode, setNewThreadCode] = useState("");
  const [newThreadType, setNewThreadType] = useState("Polyester 120D");

  // State for Editing Thread Matching
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editThreadNeedle, setEditThreadNeedle] = useState<string>("");
  const [editThreadName, setEditThreadName] = useState<string>("");
  const [editThreadCode, setEditThreadCode] = useState<string>("");

  // Track edit roll mode for each colorway (Locked/Read-Only by default)
  const [isEditingRolls, setIsEditingRolls] = useState<Record<string, boolean>>({});

  const toggleEditRolls = (colorId: string) => {
    setIsEditingRolls((prev) => ({ ...prev, [colorId]: !prev[colorId] }));
  };

  // Helper: Calculate total meters for a colorway (defaults to 0 if not entered)
  const getColorMeters = (cw: ColorTakka, defaultTakkoMeters: number = 0) => {
    if (cw.roll_meters && cw.roll_meters.length > 0) {
      return cw.roll_meters.reduce((sum, m) => sum + (Number(m) || 0), 0);
    }
    return cw.takka_count * (defaultTakkoMeters || 0);
  };

  // Helper: Get effective cut size based on components:
  // - No components added yet: return 0 (0 Pcs)
  // - Front, Back & Patta (includes Patta): return 0.93m (106 / 0.93 = 114 Pcs)
  // - Front & Back only (no Patta): return 0.80m (106 / 0.80 = 133 Pcs)
  const getEffectiveCutLength = (folder: DesignFolder) => {
    if (!folder.items || folder.items.length === 0) {
      return 0;
    }
    const hasPatta = folder.items.some(
      (item) =>
        item.category.toLowerCase().includes("patta") ||
        item.component_name.toLowerCase().includes("patta")
    );
    return hasPatta ? 0.93 : 0.80;
  };

  // Helper: Calculate Pcs from manual user input in TOTAL PCS box or roll meters
  const calculateColorPcs = (cw: ColorTakka, folder: DesignFolder) => {
    if (cw.override_pcs !== undefined && cw.override_pcs > 0) return cw.override_pcs;
    const totalMeters = getColorMeters(cw, folder.takko_length_meters);
    const cutLen = getEffectiveCutLength(folder);
    if (totalMeters > 0 && cutLen > 0) {
      return Math.round(totalMeters / cutLen);
    }
    return 50;
  };

  // Filter Folders by Search (Party Name, Design Code, Title)
  const filteredFolders = folders.filter((f) =>
    f.party_name.toLowerCase().includes(search.toLowerCase()) ||
    f.folder_code.toLowerCase().includes(search.toLowerCase()) ||
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  // Calculate Total Pcs for a folder
  const getTotalPcsForFolder = (f: DesignFolder) => {
    return f.colorways.reduce((sum, c) => {
      return sum + calculateColorPcs(c, f);
    }, 0);
  };

  // Calculate Total Meters for a folder
  const getTotalMetersForFolder = (f: DesignFolder) => {
    return f.colorways.reduce((sum, c) => {
      return sum + getColorMeters(c, f.takko_length_meters);
    }, 0);
  };

  // Handle Keyboard Navigation across Design Form fields (0 -> 2)
  const handleDesignFormKeyDown = (e: React.KeyboardEvent, fieldIndex: number) => {
    // Field 0: Party Name (With Up/Down Arrow & Enter Keyboard Navigation)
    if (fieldIndex === 0) {
      const { matched, showNewOption, totalCount } = getPartySuggestionsList();

      if (isPartyDropdownOpen && totalCount > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setPartyHighlightIdx((prev) => (prev + 1) % totalCount);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setPartyHighlightIdx((prev) => (prev - 1 + totalCount) % totalCount);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setIsPartyDropdownOpen(false);
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          if (partyHighlightIdx < matched.length) {
            const selected = matched[partyHighlightIdx];
            setNewFolderParty(selected.name);
          } else if (showNewOption) {
            handleDirectAddParty();
          }
          setIsPartyDropdownOpen(false);
          setTimeout(() => {
            designFormRefs.current[1]?.focus();
          }, 50);
          return;
        }
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();

      // Field 0: Party Name Fallback
      if (fieldIndex === 0) {
        setIsPartyDropdownOpen(false);
        if (!newFolderParty.trim()) {
          alert("⚠️ Please enter Party Name!");
          setTimeout(() => {
            designFormRefs.current[0]?.focus();
          }, 50);
          return;
        }
        const nextInput = designFormRefs.current[1];
        if (nextInput) nextInput.focus();
        return;
      }

      // Field 1: Design Code
      if (fieldIndex === 1) {
        if (!newFolderCode.trim()) {
          alert("⚠️ Please enter Design Code / No!");
          setTimeout(() => {
            designFormRefs.current[1]?.focus();
          }, 50);
          return;
        }
        const nextInput = designFormRefs.current[2];
        if (nextInput) nextInput.focus();
        return;
      }

      if (fieldIndex < 2) {
        const nextInput = designFormRefs.current[fieldIndex + 1];
        if (nextInput) nextInput.focus();
      } else {
        // Final field (Description / Title) -> Save Design!
        handleSaveFolderInline(e);
      }
    }
  };

  // Save New Folder Inline with Manual User Fields (3-field clean creation)
  const handleSaveFolderInline = (e: React.FormEvent) => {
    e.preventDefault();
    const partyClean = newFolderParty.trim();
    if (!partyClean) {
      alert("⚠️ Please enter Party Name!");
      setTimeout(() => {
        designFormRefs.current[0]?.focus();
      }, 50);
      return;
    }
    if (!newFolderCode.trim()) {
      alert("⚠️ Please enter Design Code / No!");
      setTimeout(() => {
        designFormRefs.current[1]?.focus();
      }, 50);
      return;
    }

    // Auto register party in software list if not already present
    handleDirectAddParty(partyClean);

    const created: DesignFolder = {
      id: `f-${Date.now()}`,
      folder_code: newFolderCode.trim().startsWith("Design") ? newFolderCode.trim() : `Design ${newFolderCode.trim()}`,
      title: newFolderTitle.trim() || "-",
      party_name: newFolderParty.trim(),
      created_date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      machine_requirement: "17 Head Multi-Head",
      takko_length_meters: 104,
      cut_length_meters: 0.93,
      colorways: [],
      items: []
    };

    setFolders([created, ...folders]);
    setSelectedFolderId(created.id);
    setIsAddingFolderInline(false);
    setNewFolderParty("");
    setNewFolderCode("");
    setNewFolderTitle("");
    setNewFolderTakka("");
    setNewFolderPcs("");
    setNewFolderStitches("");
    setNewFolderRate("");
    setNewFolderParts("");
  };

  // Save Colorway Inline (Unified Multi-Color Form: Color, Takka & Threads)
  const handleSaveColorwayInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolderId) return;

    const validRows = colorDraftRows.filter((r) => r.color_name.trim().length > 0);
    if (validRows.length === 0) {
      alert("Please enter at least one Color Name!");
      return;
    }

    const newColorways: ColorTakka[] = validRows.map((row, idx) => {
      const parsedRollMeters = row.roll_meters
        .split(/[\s,]+/)
        .map((m) => Number(m.trim()))
        .filter((n) => !isNaN(n) && n > 0);

      const takkaCount = Number(row.takka_count) || (parsedRollMeters.length > 0 ? parsedRollMeters.length : 1);

      const parsedThreads: ThreadItem[] = row.threads
        .filter((t) => t.thread_name.trim().length > 0)
        .map((t, tIdx) => ({
          id: `th-${Date.now()}-${idx}-${tIdx}`,
          needle_no: Number(t.needle_no.replace(/\D/g, "")) || tIdx + 1,
          thread_name: t.thread_name.trim(),
          thread_code: t.shade_code.trim() ? (t.shade_code.trim().toLowerCase().includes("shade") ? t.shade_code.trim() : `Shade ${t.shade_code.trim()}`) : `Shade ${t.thread_name.trim()}`,
          thread_type: "Polyester 120D"
        }));

      return {
        id: `c-${Date.now()}-${idx}`,
        color_name: row.color_name.trim(),
        takka_count: takkaCount,
        roll_meters: parsedRollMeters.length > 0 ? parsedRollMeters : undefined,
        threads: parsedThreads.length > 0 ? parsedThreads : undefined
      };
    });

    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === selectedFolderId) {
          return { ...f, colorways: [...f.colorways, ...newColorways] };
        }
        return f;
      })
    );

    setIsAddingColorInline(false);
    setColorDraftRows([
      {
        id: `cr-${Date.now()}`,
        color_name: "",
        takka_count: "",
        roll_meters: "",
        threads: []
      }
    ]);
  };

  // Update Individual Roll Meter
  const handleUpdateRollMeter = (folderId: string, colorId: string, rollIdx: number, val: number) => {
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          return {
            ...f,
            colorways: f.colorways.map((cw) => {
              if (cw.id === colorId) {
                const currentMeters = Array.from({ length: cw.takka_count }, (_, i) =>
                  cw.roll_meters && cw.roll_meters[i] !== undefined ? cw.roll_meters[i] : 0
                );
                currentMeters[rollIdx] = val;
                return {
                  ...cw,
                  roll_meters: currentMeters
                };
              }
              return cw;
            })
          };
        }
        return f;
      })
    );
  };

  // Update Override Pcs for a colorway
  const handleUpdateOverridePcs = (folderId: string, colorId: string, val: number | undefined) => {
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          return {
            ...f,
            colorways: f.colorways.map((cw) => {
              if (cw.id === colorId) {
                return {
                  ...cw,
                  override_pcs: val !== undefined && val > 0 ? val : undefined
                };
              }
              return cw;
            })
          };
        }
        return f;
      })
    );
  };


  // Bulk set roll meters string for a colorway
  const handleBulkUpdateRollMetersStr = (folderId: string, colorId: string, strVal: string) => {
    const metersArr = strVal
      .split(",")
      .map((m) => Number(m.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          return {
            ...f,
            colorways: f.colorways.map((cw) => {
              if (cw.id === colorId) {
                return {
                  ...cw,
                  takka_count: metersArr.length > 0 ? metersArr.length : cw.takka_count,
                  roll_meters: metersArr.length > 0 ? metersArr : undefined
                };
              }
              return cw;
            })
          };
        }
        return f;
      })
    );
  };

  // Add a new Takka roll to a colorway
  const handleAddRollToColorway = (folderId: string, colorId: string) => {
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          return {
            ...f,
            colorways: f.colorways.map((cw) => {
              if (cw.id === colorId) {
                const currentMeters = Array.from({ length: cw.takka_count }, (_, i) =>
                  cw.roll_meters && cw.roll_meters[i] !== undefined ? cw.roll_meters[i] : 0
                );

                const newMeters = [...currentMeters, 0];

                return {
                  ...cw,
                  takka_count: newMeters.length,
                  roll_meters: newMeters
                };
              }
              return cw;
            })
          };
        }
        return f;
      })
    );
  };

  // Remove a specific Takka roll from a colorway
  const handleRemoveRollFromColorway = (folderId: string, colorId: string, rollIdx: number) => {
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          return {
            ...f,
            colorways: f.colorways.map((cw) => {
              if (cw.id === colorId) {
                const currentMeters = Array.from({ length: cw.takka_count }, (_, i) =>
                  cw.roll_meters && cw.roll_meters[i] !== undefined ? cw.roll_meters[i] : 0
                );

                if (currentMeters.length <= 1) return cw;

                const newMeters = currentMeters.filter((_, idx) => idx !== rollIdx);

                return {
                  ...cw,
                  takka_count: newMeters.length,
                  roll_meters: newMeters
                };
              }
              return cw;
            })
          };
        }
        return f;
      })
    );
  };

  const handleDeleteCategoryOption = (catToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = categoriesList.filter((c) => c !== catToDelete);
    setCategoriesList(updated);
    if (newCompCategory === catToDelete) {
      setNewCompCategory(updated[0] || "Front");
    }
  };

  // Save Component Inline
  const handleSaveComponentInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolderId) return;

    const finalCategory = newCompCategory.trim() || "Other";
    if (!categoriesList.includes(finalCategory)) {
      setCategoriesList([...categoriesList, finalCategory]);
    }

    const newItem: DesignItem = {
      id: `i-${Date.now()}`,
      component_name: newCompName.trim() || finalCategory,
      category: finalCategory,
      stitch_count: Number(newCompStitch) || 0,
      rate_per_1k: Number(newCompRate) || 0.45
    };

    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === selectedFolderId) {
          return { ...f, items: [...f.items, newItem] };
        }
        return f;
      })
    );

    setIsAddingComponentInline(false);
    setNewCompName("");
    setNewCompCategory(finalCategory);
    setNewCompStitch("");
    setNewCompRate("");
    setIsCustomCategory(false);
  };

  // Delete Colorway
  const handleDeleteColorway = (folderId: string, colorId: string) => {
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          return { ...f, colorways: f.colorways.filter((c) => c.id !== colorId) };
        }
        return f;
      })
    );
  };

  // Delete Folder
  const handleDeleteFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this design folder?")) {
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
    }
  };

  // Auto-derive color hex from thread name (No color picker needed)
  const getAutoColorHex = (str: string) => {
    if (!str) return "#3B82F6";
    const s = str.toLowerCase();
    if (s.includes("rani") || s.includes("pink") || s.includes("rose")) return "#EC4899";
    if (s.includes("red") || s.includes("maroon") || s.includes("ruby")) return "#EF4444";
    if (s.includes("blue") || s.includes("navy") || s.includes("royal")) return "#2563EB";
    if (s.includes("rama") || s.includes("teal") || s.includes("cyan")) return "#06B6D4";
    if (s.includes("green") || s.includes("emerald") || s.includes("pista")) return "#10B981";
    if (s.includes("gold") || s.includes("zari") || s.includes("yellow") || s.includes("mustard")) return "#EAB308";
    if (s.includes("orange") || s.includes("peach")) return "#F97316";
    if (s.includes("purple") || s.includes("violet") || s.includes("wine")) return "#8B5CF6";
    if (s.includes("white") || s.includes("milk") || s.includes("offwhite") || s.includes("resham")) return "#F8FAFC";
    if (s.includes("black") || s.includes("jet")) return "#1E293B";
    if (s.includes("silver") || s.includes("grey") || s.includes("gray")) return "#94A3B8";

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return `#${"00000".substring(0, 6 - c.length)}${c}`;
  };

  // Save Thread Matching Inline for a specific colorway
  const handleSaveThreadInline = (e: React.FormEvent, targetColorId: string) => {
    e.preventDefault();
    if (!selectedFolderId || !newThreadName.trim()) return;

    const rawCode = newThreadCode.trim();
    // Strip leading '#' if user entered '#402'
    const cleanCode = rawCode.startsWith("#") ? rawCode.substring(1) : rawCode;

    const newThread: ThreadItem = {
      id: `t-${Date.now()}`,
      needle_no: newThreadNeedleNo !== "" ? (isNaN(Number(newThreadNeedleNo)) ? newThreadNeedleNo : Number(newThreadNeedleNo)) : undefined,
      thread_name: newThreadName.trim(),
      thread_code: cleanCode ? (cleanCode.toLowerCase().includes("shade") || cleanCode.toLowerCase().includes("zari") || cleanCode.toLowerCase().includes("silk") ? cleanCode : `Shade ${cleanCode}`) : undefined,
      color_hex: getAutoColorHex(newThreadName.trim()),
      thread_type: newThreadType.trim() || "Polyester 120D"
    };

    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === selectedFolderId) {
          return {
            ...f,
            colorways: f.colorways.map((cw) => {
              if (cw.id === targetColorId) {
                return {
                  ...cw,
                  threads: [...(cw.threads || []), newThread]
                };
              }
              return cw;
            })
          };
        }
        return f;
      })
    );

    setAddingThreadForColorId(null);
    setNewThreadName("");
    setNewThreadCode("");
    setNewThreadNeedleNo("");
    setNewThreadType("Polyester 120D");
  };

  // Delete Thread Matching
  const handleDeleteThread = (folderId: string, colorId: string, threadId: string) => {
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          return {
            ...f,
            colorways: f.colorways.map((cw) => {
              if (cw.id === colorId) {
                return {
                  ...cw,
                  threads: (cw.threads || []).filter((t) => t.id !== threadId)
                };
              }
              return cw;
            })
          };
        }
        return f;
      })
    );
  };

  // Update Existing Thread
  const handleUpdateThread = (folderId: string, colorId: string, threadId: string) => {
    if (!editThreadName.trim()) return;
    const cleanCode = editThreadCode.trim().startsWith("#") ? editThreadCode.trim().substring(1) : editThreadCode.trim();

    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          return {
            ...f,
            colorways: f.colorways.map((cw) => {
              if (cw.id === colorId) {
                return {
                  ...cw,
                  threads: (cw.threads || []).map((t) => {
                    if (t.id === threadId) {
                      return {
                        ...t,
                        needle_no: editThreadNeedle ? (isNaN(Number(editThreadNeedle)) ? editThreadNeedle : Number(editThreadNeedle)) : t.needle_no,
                        thread_name: editThreadName.trim(),
                        thread_code: cleanCode ? (cleanCode.toLowerCase().includes("shade") || cleanCode.toLowerCase().includes("zari") || cleanCode.toLowerCase().includes("silk") ? cleanCode : `Shade ${cleanCode}`) : undefined,
                      };
                    }
                    return t;
                  })
                };
              }
              return cw;
            })
          };
        }
        return f;
      })
    );

    setEditingThreadId(null);
    setEditThreadNeedle("");
    setEditThreadName("");
    setEditThreadCode("");
  };

  // Delete Component
  const handleDeleteComponent = (folderId: string, itemId: string) => {
    if (confirm("Remove this item?")) {
      setFolders((prev) =>
        prev.map((f) => {
          if (f.id === folderId) {
            return { ...f, items: f.items.filter((i) => i.id !== itemId) };
          }
          return f;
        })
      );
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* HEADER TOOLBAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
        {selectedFolder ? (() => {
          const totalPcs = getTotalPcsForFolder(selectedFolder);
          const totalTakka = selectedFolder.colorways.reduce((s, c) => s + c.takka_count, 0);
          const totalMeters = getTotalMetersForFolder(selectedFolder);

          return (
            <div className="flex items-center justify-between w-full flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => {
                    setSelectedFolderId(null);
                    setExpandedRollMetersColorId(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all active:scale-98"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" /> Back to Designs
                </button>

                <div className="h-4 w-px bg-slate-200" />

                <span className="px-2.5 py-1 bg-white text-slate-800 border border-slate-200 font-bold rounded-lg shadow-2xs">
                  Party: {selectedFolder.party_name}
                </span>

                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 font-mono font-black rounded-lg shadow-2xs">
                  {selectedFolder.folder_code}
                </span>

                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold rounded-md">
                  Active
                </span>
              </div>

            </div>
          );
        })() : (
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by party or design code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>
        )}

        {!selectedFolder && (
          <button
            onClick={() => setIsAddingFolderInline(!isAddingFolderInline)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" /> {isAddingFolderInline ? "Close Form" : "Add New Design"}
          </button>
        )}
      </div>

      {/* INLINE ADD DESIGN FOLDER FORM */}
      {!selectedFolder && isAddingFolderInline && (
        <form
          onSubmit={handleSaveFolderInline}
          className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs space-y-3 animate-in fade-in duration-100 font-sans text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Folder className="w-4 h-4 text-blue-600" />
              <span>Add New Design Folder (નવી ડિઝાઇન ઉમેરો)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingFolderInline(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div ref={partyDropdownRef} className="relative">
              <label className="block font-bold text-slate-700 mb-1">Party Name *</label>
              <input
                ref={(el) => { designFormRefs.current[0] = el; }}
                onKeyDown={(e) => handleDesignFormKeyDown(e, 0)}
                type="text"
                placeholder="Type party name to search..."
                value={newFolderParty}
                onFocus={() => {
                  if (newFolderParty.trim().length > 0) {
                    setIsPartyDropdownOpen(true);
                    setPartyHighlightIdx(0);
                  }
                }}
                onBlur={() => setTimeout(() => setIsPartyDropdownOpen(false), 200)}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewFolderParty(val);
                  setIsPartyDropdownOpen(val.trim().length > 0);
                  setPartyHighlightIdx(0);
                }}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                required
                autoFocus
              />

              {/* Status Badge */}
              {newFolderParty.trim() !== "" && (() => {
                const typedClean = newFolderParty.trim().toLowerCase();
                const matchedParty = registeredParties.find((p) => p.name.toLowerCase() === typedClean);
                const partialMatches = registeredParties.filter((p) => p.name.toLowerCase().includes(typedClean));

                if (matchedParty) {
                  return (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Registered: <strong>{matchedParty.name}</strong> ({matchedParty.city})</span>
                      </span>
                    </div>
                  );
                } else if (partialMatches.length > 0) {
                  return (
                    <div className="mt-1">
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span>{partialMatches.length} Registered {partialMatches.length === 1 ? "Party" : "Parties"} Found</span>
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <div className="mt-1">
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 block">
                        ⚠️ Party not in directory. Click "+ Register Party" below.
                      </span>
                    </div>
                  );
                }
              })()}

              {/* CLEAN & SIMPLE PARTY SUGGESTION DROPDOWN */}
              {isPartyDropdownOpen && newFolderParty.trim().length > 0 && (() => {
                const { matched, showNewOption } = getPartySuggestionsList();
                return (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden text-xs font-sans">
                    {/* Dropdown Header */}
                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Party Suggestions</span>
                      <button
                        type="button"
                        onClick={() => setIsPartyDropdownOpen(false)}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Suggestions List */}
                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 p-1">
                      {matched.map((p, idx) => {
                        const isHighlighted = partyHighlightIdx === idx;
                        const isSelected = newFolderParty.trim().toLowerCase() === p.name.toLowerCase();
                        return (
                          <button
                            key={p.id || p.name}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setNewFolderParty(p.name);
                              setIsPartyDropdownOpen(false);
                              designFormRefs.current[1]?.focus();
                            }}
                            onMouseEnter={() => setPartyHighlightIdx(idx)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                              isHighlighted
                                ? "bg-blue-50/90 border border-blue-200 font-extrabold text-blue-900 shadow-2xs"
                                : isSelected
                                ? "bg-slate-100 font-extrabold text-slate-900"
                                : "hover:bg-slate-50 font-semibold text-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[11px] shrink-0 uppercase ${
                                isHighlighted ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                              }`}>
                                {p.name.charAt(0)}
                              </span>
                              <div className="truncate">
                                <span className="text-xs font-bold text-slate-900">{p.name}</span>
                                {p.city && (
                                  <span className="text-[10px] text-slate-400 font-medium ml-1.5">• {p.city}</span>
                                )}
                              </div>
                            </div>

                            <span className={`text-[11px] font-bold ${isHighlighted ? "text-blue-700" : "text-blue-600"} hover:underline shrink-0`}>
                              Select
                            </span>
                          </button>
                        );
                      })}

                      {/* REGISTER NEW PARTY OPTION */}
                      {showNewOption && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleDirectAddParty();
                              setIsPartyDropdownOpen(false);
                              designFormRefs.current[1]?.focus();
                            }}
                            onMouseEnter={() => setPartyHighlightIdx(matched.length)}
                            className={`w-full text-left px-3 py-2 font-bold rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                              partyHighlightIdx === matched.length
                                ? "bg-blue-100/90 border-blue-300 text-blue-950 shadow-2xs"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Plus className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                              <span className="text-xs">Register "{newFolderParty.trim()}" as New Party</span>
                            </div>
                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-extrabold shrink-0">
                              + Add
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Design Code / No *</label>
              <input
                ref={(el) => { designFormRefs.current[1] = el; }}
                onKeyDown={(e) => handleDesignFormKeyDown(e, 1)}
                onFocus={() => setIsPartyDropdownOpen(false)}
                type="text"
                placeholder="e.g. Design 2486"
                value={newFolderCode}
                onChange={(e) => setNewFolderCode(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description / Title</label>
              <input
                ref={(el) => { designFormRefs.current[2] = el; }}
                onKeyDown={(e) => handleDesignFormKeyDown(e, 2)}
                onFocus={() => setIsPartyDropdownOpen(false)}
                type="text"
                placeholder="e.g. Heavy Rani & Rama Saree Suite"
                value={newFolderTitle}
                onChange={(e) => setNewFolderTitle(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddingFolderInline(false)}
              className="px-4 h-9 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-2xs transition-all active:scale-98"
            >
              Save Design
            </button>
          </div>
        </form>
      )}

      {/* CLEAN ENTERPRISE DESIGN FOLDER CARDS GRID */}
      {!selectedFolder && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredFolders.map((f) => {
            const totalPcs = getTotalPcsForFolder(f);
            const totalTakka = f.colorways.reduce((s, c) => s + c.takka_count, 0);

            return (
              <div
                key={f.id}
                onClick={() => setSelectedFolderId(f.id)}
                className="group bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-500 transition-all p-3.5 cursor-pointer flex flex-col justify-between space-y-3"
              >
                {/* Header Preview Box */}
                <div className="bg-slate-50/90 p-3 rounded-lg border border-slate-200/80 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-blue-700 rounded text-[10px] font-bold shadow-2xs">
                      {f.party_name}
                    </span>
                    <button
                      onClick={(e) => handleDeleteFolder(e, f.id)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded transition-colors"
                      title="Delete Design Folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-start gap-2 pt-0.5">
                    <div className="p-1.5 bg-blue-600 text-white rounded-md shrink-0 mt-0.5">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-mono font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors truncate">
                        {f.folder_code}
                      </h3>
                      {f.title && f.title !== "-" && (
                        <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5" title={f.title}>
                          {f.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Details Body */}
                <div className="space-y-2 text-xs">
                  {/* Metric Pills */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-amber-50/80 border border-amber-200/70 p-1.5 rounded-md text-center">
                      <span className="text-amber-800 block text-[9px] font-semibold uppercase tracking-wider">Fabric Roll</span>
                      <strong className="text-slate-900 font-bold">{totalTakka} Takka</strong>
                    </div>
                    <div className="bg-emerald-50/80 border border-emerald-200/70 p-1.5 rounded-md text-center">
                      <span className="text-emerald-800 block text-[9px] font-semibold uppercase tracking-wider">Production</span>
                      <strong className="text-slate-900 font-bold">{totalPcs.toLocaleString()} Pcs</strong>
                    </div>
                  </div>

                  {/* Included Parts Badges & Create Order Action */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1 flex-wrap">
                      {f.items.length > 0 ? (
                        f.items.map((item) => (
                          <span
                            key={item.id}
                            className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-medium text-[10px] rounded border border-slate-200"
                          >
                            {item.category}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No parts added</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleCreateOrderFromDesign(e, f)}
                      className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/80 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-98"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Create Job Order</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredFolders.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200">
              <Folder className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-xs font-bold text-slate-800">No Design Folders Found</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 mb-3">No design folders match "{search}".</p>
              <button
                onClick={() => setSearch("")}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-md"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      )}

      {/* PROFESSIONAL ENTERPRISE 2-COLUMN SPLIT LAYOUT FOR DESIGN DETAILS */}
      {selectedFolder && (() => {
        const totalPcs = getTotalPcsForFolder(selectedFolder);
        const totalTakka = selectedFolder.colorways.reduce((s, c) => s + c.takka_count, 0);
        const totalMeters = getTotalMetersForFolder(selectedFolder);
        const totalStitches = selectedFolder.items.reduce((s, i) => s + i.stitch_count, 0);

        return (
          <div className="space-y-4 animate-in fade-in duration-150">


            {/* SPLIT 2-COLUMN CONTAINER (Equal 50-50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LEFT COLUMN: FABRIC COLORS & TAKKA LIST (50% Width) */}
              <div className="space-y-3">
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  {/* Card Header */}
                  <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        Fabric Colors & Takka Details ({selectedFolder.colorways.length})
                        {totalPcs > 0 && (
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md normal-case">
                            Total: {totalPcs.toLocaleString()} Pcs
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsAddingColorInline(!isAddingColorInline)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-500" /> Add Details
                    </button>
                  </div>
                  {/* UNIFIED FLAT MULTI-COLOR ADD FORM */}
                  {isAddingColorInline && (
                    <div className="p-3 bg-slate-50/90 border-b border-slate-200 animate-in fade-in duration-100">
                      <form onSubmit={handleSaveColorwayInline} className="space-y-3">
                        {colorDraftRows.map((row, rIdx) => (
                          <div key={row.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-800">
                                Color #{rIdx + 1} Details
                              </span>
                              {colorDraftRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColorDraftRow(row.id)}
                                  className="text-slate-400 hover:text-red-600 text-[11px] font-bold inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remove Color
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Color Name *</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Rani Color"
                                  value={row.color_name}
                                  onKeyDown={handleColorFormKeyDown}
                                  onChange={(e) => handleUpdateColorDraftRow(row.id, "color_name", e.target.value)}
                                  className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Takka Count *</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 10"
                                  value={row.takka_count}
                                  onKeyDown={handleColorFormKeyDown}
                                  onChange={(e) => handleUpdateColorDraftRow(row.id, "takka_count", e.target.value !== "" ? Number(e.target.value) : "")}
                                  className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Roll Meters (Optional)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 104, 103, 105"
                                  value={row.roll_meters}
                                  onKeyDown={handleColorFormKeyDown}
                                  onChange={(e) => handleUpdateColorDraftRow(row.id, "roll_meters", e.target.value)}
                                  className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                                />
                              </div>
                            </div>

                            {/* OPTIONAL THREAD MATCHING SECTION (NO DUMMY DEFAULTS) */}
                            <div className="pt-2 border-t border-slate-100 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                  <Layers className="w-3 h-3 text-indigo-500" /> Thread Matching Details (Optional)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddThreadToColorRow(row.id)}
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Thread Row
                                </button>
                              </div>

                              {row.threads.map((th, tIdx) => (
                                <div key={tIdx} className="grid grid-cols-12 gap-2 items-center">
                                  <div className="col-span-3 sm:col-span-2">
                                    <input
                                      type="text"
                                      placeholder="N1"
                                      value={th.needle_no}
                                      onKeyDown={handleColorFormKeyDown}
                                      onChange={(e) => handleUpdateThreadInColorRow(row.id, tIdx, "needle_no", e.target.value)}
                                      className="w-full h-7 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-center text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                                    />
                                  </div>
                                  <div className="col-span-5 sm:col-span-6">
                                    <input
                                      type="text"
                                      placeholder="Thread Name / Color (e.g. Rani Pink)"
                                      value={th.thread_name}
                                      onKeyDown={handleColorFormKeyDown}
                                      onChange={(e) => handleUpdateThreadInColorRow(row.id, tIdx, "thread_name", e.target.value)}
                                      className="w-full h-7 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                                    />
                                  </div>
                                  <div className="col-span-3 sm:col-span-3">
                                    <input
                                      type="text"
                                      placeholder="Shade (e.g. 402)"
                                      value={th.shade_code}
                                      onKeyDown={handleColorFormKeyDown}
                                      onChange={(e) => handleUpdateThreadInColorRow(row.id, tIdx, "shade_code", e.target.value)}
                                      className="w-full h-7 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                                    />
                                  </div>
                                  <div className="col-span-1 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveThreadFromColorRow(row.id, tIdx)}
                                      className="text-slate-400 hover:text-red-600 p-0.5"
                                      title="Remove Thread"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* ACTION BAR: ADD ANOTHER COLOR + CANCEL/SAVE */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={handleAddColorDraftRow}
                            className="h-8 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Another Color
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsAddingColorInline(false)}
                              className="h-8 px-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-bold text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs text-xs"
                            >
                              Save Details
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* CLEAN FULL-WIDTH FABRIC COLORS LIST */}
                  {selectedFolder.colorways.length > 0 ? (
                    <div className="divide-y divide-slate-100 text-xs">
                      {selectedFolder.colorways.map((cw) => {
                        const colorMeters = getColorMeters(cw, 0);
                        const calculatedPcs = calculateColorPcs(cw, selectedFolder);
                        const effectiveCut = getEffectiveCutLength(selectedFolder);
                        const isExpanded = expandedRollMetersColorId === cw.id;
                        const activeTab = colorwayActiveTab[cw.id] || "takka";
                        const rollMetersArr = Array.from({ length: cw.takka_count }, (_, i) =>
                          cw.roll_meters && cw.roll_meters[i] !== undefined ? cw.roll_meters[i] : 0
                        );

                        const setSubTab = (tab: "takka" | "threads") => {
                          setColorwayActiveTab((prev) => ({ ...prev, [cw.id]: tab }));
                        };

                        return (
                          <div key={cw.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                            {/* CLEAN MINIMAL ROW SUMMARY */}
                            <div className="px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                                  style={{ backgroundColor: cw.color_code || "#3B82F6" }}
                                />
                                <span className="font-bold text-slate-900 text-xs">{cw.color_name}</span>
                                {calculatedPcs > 0 && (
                                  <span className="text-[10px] font-black text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                                    {calculatedPcs.toLocaleString()} Pcs
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isExpanded && activeTab === "takka") {
                                      setExpandedRollMetersColorId(null);
                                    } else {
                                      setExpandedRollMetersColorId(cw.id);
                                      setSubTab("takka");
                                    }
                                  }}
                                  className={`h-8 px-3 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                                    isExpanded && activeTab === "takka"
                                      ? "bg-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-300/50"
                                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200/90"
                                  }`}
                                  title="Click to view Takka roll meters"
                                >
                                  <Ruler className="w-3.5 h-3.5 text-amber-600" />
                                  <span>{cw.takka_count} Takka ({colorMeters}m)</span>
                                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-150 ${isExpanded && activeTab === "takka" ? "rotate-180" : ""}`} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isExpanded && activeTab === "threads") {
                                      setExpandedRollMetersColorId(null);
                                    } else {
                                      setExpandedRollMetersColorId(cw.id);
                                      setSubTab("threads");
                                    }
                                  }}
                                  className={`h-8 px-3 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                                    isExpanded && activeTab === "threads"
                                      ? "bg-indigo-100 text-indigo-900 border border-indigo-300 ring-1 ring-indigo-300/50"
                                      : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80"
                                  }`}
                                  title="Click to view Thread matching"
                                >
                                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>{(cw.threads || []).length} Threads</span>
                                  <ChevronDown className={`w-3.5 h-3.5 text-indigo-500 transition-transform duration-150 ${isExpanded && activeTab === "threads" ? "rotate-180" : ""}`} />
                                </button>

                                <button
                                  onClick={() => handleDeleteColorway(selectedFolder.id, cw.id)}
                                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center shrink-0"
                                  title="Delete Colorway"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* REDESIGNED MINIMAL EXPANDED DRAWER */}
                            {isExpanded && (
                              <div className="bg-slate-50/70 p-3.5 border-t border-slate-200/80 space-y-3 animate-in fade-in duration-100">

                                {/* SUB-TAB 1: TAKKA ROLL METERS & MANAGEMENT */}
                                {activeTab === "takka" && (
                                  <div className="space-y-3 animate-in fade-in duration-100">
                                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                                      {/* Simple Neutral Total Pcs Field */}
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Total Pcs:</span>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            min="0"
                                            placeholder=""
                                            value={cw.override_pcs !== undefined ? cw.override_pcs : ""}
                                            onChange={(e) => {
                                              const val = e.target.value !== "" ? Number(e.target.value) : undefined;
                                              handleUpdateOverridePcs(selectedFolder.id, cw.id, val);
                                            }}
                                            className="w-16 text-center font-bold text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-2 py-1 shadow-2xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                                            title="Total Pcs for this color. Type here to set/override Pcs."
                                          />
                                          <span className="text-xs font-bold text-slate-500">Pcs</span>
                                          {cw.override_pcs !== undefined && (
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateOverridePcs(selectedFolder.id, cw.id, undefined)}
                                              className="text-slate-400 hover:text-red-600 text-xs ml-0.5 font-bold transition-colors"
                                              title="Reset to calculated Pcs"
                                            >
                                              ✕
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Action Button: Add Takka */}
                                      <button
                                        type="button"
                                        onClick={() => handleAddRollToColorway(selectedFolder.id, cw.id)}
                                        className="h-7 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer shrink-0"
                                        title="Add a new Takka roll"
                                      >
                                        <Plus className="w-3.5 h-3.5 text-amber-700" />
                                        <span>Add Takka</span>
                                      </button>
                                    </div>

                                    {/* Roll Cards Grid with Editable Meters & Delete Action */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                      {rollMetersArr.map((meterVal, rIdx) => {
                                        return (
                                          <div key={rIdx} className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs text-center space-y-1.5 relative group hover:border-amber-300 transition-colors">
                                            <div className="flex items-center justify-between gap-1">
                                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">ROLL #{rIdx + 1}</span>
                                              {rollMetersArr.length > 1 && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleRemoveRollFromColorway(selectedFolder.id, cw.id, rIdx)}
                                                  className="text-slate-300 hover:text-red-600 p-0.5 rounded transition-colors"
                                                  title="Delete this Takka roll"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              )}
                                            </div>

                                            {/* Editable Meter Input */}
                                            <div className="flex items-center justify-center gap-0.5">
                                              <input
                                                id={`roll-input-${cw.id}-${rIdx}`}
                                                type="number"
                                                min="0"
                                                value={meterVal || ""}
                                                onChange={(e) => {
                                                  const val = e.target.value !== "" ? Number(e.target.value) : 0;
                                                  handleUpdateRollMeter(selectedFolder.id, cw.id, rIdx, val);
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    const nextInput = document.getElementById(`roll-input-${cw.id}-${rIdx + 1}`);
                                                    if (nextInput) {
                                                      nextInput.focus();
                                                      (nextInput as HTMLInputElement).select();
                                                    }
                                                  }
                                                }}
                                                className="w-16 text-center font-extrabold text-sm text-slate-900 font-mono bg-slate-50 border border-slate-200 rounded px-1 py-0.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                title="Click to edit meter value, press Enter to move to next roll"
                                              />
                                              <span className="text-xs font-bold text-slate-400">m</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* SUB-TAB 2: THREAD MATCHING */}
                                {activeTab === "threads" && (
                                  <div className="space-y-3 animate-in fade-in duration-100">
                                    {/* Top Action Bar */}
                                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                                      <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                                        Thread Matching Details
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAddingThreadForColorId(cw.id);
                                          setNewThreadNeedleNo("");
                                          setNewThreadName("");
                                          setNewThreadCode("");
                                        }}
                                        className="h-7 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer shrink-0"
                                      >
                                        <Plus className="w-3.5 h-3.5 text-indigo-700" />
                                        <span>Add Thread</span>
                                      </button>
                                    </div>

                                    {/* INLINE ADD THREAD FORM */}
                                    {addingThreadForColorId === cw.id && (
                                      <form
                                        onSubmit={(e) => handleSaveThreadInline(e, cw.id)}
                                        className="bg-white p-3 rounded-xl border border-indigo-200 shadow-2xs space-y-2 text-xs animate-in fade-in duration-100"
                                      >
                                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 font-bold text-slate-800 text-xs">
                                          <span>Add New Thread Matching</span>
                                          <button
                                            type="button"
                                            onClick={() => setAddingThreadForColorId(null)}
                                            className="text-slate-400 hover:text-slate-600"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                          <div className="col-span-3 sm:col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Needle No</label>
                                            <input
                                              type="text"
                                              placeholder="N1"
                                              value={newThreadNeedleNo}
                                              onChange={(e) => setNewThreadNeedleNo(e.target.value)}
                                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-center"
                                            />
                                          </div>
                                          <div className="col-span-5 sm:col-span-6">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Thread Name *</label>
                                            <input
                                              type="text"
                                              placeholder="e.g. Rani Silk, Gold Zari"
                                              value={newThreadName}
                                              onChange={(e) => setNewThreadName(e.target.value)}
                                              required
                                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold"
                                            />
                                          </div>
                                          <div className="col-span-4 sm:col-span-4">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Shade Code</label>
                                            <input
                                              type="text"
                                              placeholder="e.g. 104, Shade #402"
                                              value={newThreadCode}
                                              onChange={(e) => setNewThreadCode(e.target.value)}
                                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                                            />
                                          </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-1">
                                          <button
                                            type="button"
                                            onClick={() => setAddingThreadForColorId(null)}
                                            className="px-2.5 py-1 text-slate-600 font-semibold text-[11px]"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="submit"
                                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-[11px] shadow-2xs"
                                          >
                                            Save Thread
                                          </button>
                                        </div>
                                      </form>
                                    )}

                                    {/* THREAD CARDS GRID */}
                                    {(cw.threads && cw.threads.length > 0) ? (
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                        {cw.threads.map((th) => {
                                          const isEditingThisThread = editingThreadId === th.id;

                                          const formattedCode = th.thread_code
                                            ? th.thread_code.startsWith("#")
                                              ? th.thread_code.substring(1)
                                              : th.thread_code
                                            : "";

                                          const needleLabel = th.needle_no
                                            ? (th.needle_no.toString().toUpperCase().startsWith("N") ? th.needle_no.toString().toUpperCase() : `N${th.needle_no}`)
                                            : null;

                                          if (isEditingThisThread) {
                                            return (
                                              <div key={th.id} className="bg-white p-2.5 rounded-xl border border-indigo-400 shadow-2xs space-y-1.5 text-xs text-left">
                                                <div className="flex items-center justify-between gap-1 border-b border-indigo-100 pb-1">
                                                  <input
                                                    type="text"
                                                    placeholder="N1"
                                                    value={editThreadNeedle}
                                                    onChange={(e) => setEditThreadNeedle(e.target.value)}
                                                    className="w-10 px-1 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold text-[10px] rounded border border-indigo-200 text-center"
                                                  />
                                                  <div className="flex items-center gap-1">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleUpdateThread(selectedFolder.id, cw.id, th.id)}
                                                      className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded"
                                                      title="Save thread"
                                                    >
                                                      <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => setEditingThreadId(null)}
                                                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                                                      title="Cancel"
                                                    >
                                                      <X className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>
                                                </div>
                                                <input
                                                  type="text"
                                                  value={editThreadName}
                                                  onChange={(e) => setEditThreadName(e.target.value)}
                                                  placeholder="Thread Name"
                                                  className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-900"
                                                />
                                                <input
                                                  type="text"
                                                  value={editThreadCode}
                                                  onChange={(e) => setEditThreadCode(e.target.value)}
                                                  placeholder="Shade #"
                                                  className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono text-indigo-700"
                                                />
                                              </div>
                                            );
                                          }

                                          return (
                                            <div key={th.id} className="relative bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs text-center space-y-1.5 flex flex-col justify-between group hover:border-indigo-300 transition-all">
                                              <div className="flex items-center justify-between gap-1">
                                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded border border-indigo-100">
                                                  {needleLabel ? needleLabel : "THREAD"}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setEditingThreadId(th.id);
                                                      setEditThreadNeedle(th.needle_no ? th.needle_no.toString() : "");
                                                      setEditThreadName(th.thread_name || "");
                                                      setEditThreadCode(th.thread_code || "");
                                                    }}
                                                    className="text-slate-300 hover:text-indigo-600 p-0.5 rounded transition-colors"
                                                    title="Edit thread"
                                                  >
                                                    <Pencil className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteThread(selectedFolder.id, cw.id, th.id)}
                                                    className="text-slate-300 hover:text-red-600 p-0.5 rounded transition-colors"
                                                    title="Remove thread"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              </div>
                                              <div className="py-0.5">
                                                <span className="font-extrabold text-xs text-slate-800 leading-tight block text-center break-words">
                                                  {th.thread_name}
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-center gap-1 flex-wrap pt-0.5">
                                                {formattedCode && (
                                                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50/90 px-1.5 py-0.5 rounded border border-indigo-100">
                                                    {formattedCode.toLowerCase().includes("shade") || formattedCode.toLowerCase().includes("zari") || formattedCode.toLowerCase().includes("silk") ? formattedCode : `Shade #${formattedCode}`}
                                                  </span>
                                                )}
                                                {th.thread_type && (
                                                  <span className="text-[9px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 truncate max-w-[80px]">
                                                    {th.thread_type}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 space-y-1">
                                        <p>No thread & shade matching added for this colorway yet.</p>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAddingThreadForColorId(cw.id);
                                            setNewThreadNeedleNo(`N${(cw.threads || []).length + 1}`);
                                            setNewThreadName("");
                                            setNewThreadCode("");
                                          }}
                                          className="text-indigo-600 hover:underline font-bold text-xs"
                                        >
                                          + Add First Thread
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50/60 text-slate-500 space-y-2">
                      <Palette className="w-7 h-7 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">No Fabric Colors / Takka Added</p>
                      <p className="text-[11px] text-slate-500">Click "+ Add Details" above to add colorways and Takka roll details.</p>
                    </div>
                  )}


                </div>
              </div>

              {/* RIGHT COLUMN: GARMENT COMPONENTS (FRONT, BACK, PATTA) (50% Width - No Prices) */}
              <div className="space-y-3">
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-visible">
                  {/* Card Header */}
                  <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Garment Components ({selectedFolder.items.length})
                      </span>
                    </div>
                    <button
                      onClick={() => setIsAddingComponentInline(!isAddingComponentInline)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-500" /> Add Part
                    </button>
                  </div>

                  {/* INLINE ADD COMPONENT FORM */}
                  {isAddingComponentInline && (
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200">
                      <form
                        onSubmit={handleSaveComponentInline}
                        className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2 flex-wrap text-xs animate-in fade-in duration-100 relative z-30"
                      >
                        {/* CUSTOM DESIGNED CATEGORY SELECTOR */}
                        {isCustomCategory ? (
                          <div className="relative flex items-center w-40 h-9">
                            <input
                              type="text"
                              placeholder="Category *"
                              value={newCompCategory}
                              onChange={(e) => setNewCompCategory(e.target.value)}
                              className="w-full h-9 pl-3 pr-8 bg-white border border-blue-500 rounded-lg font-semibold text-slate-900 focus:outline-none text-xs shadow-2xs"
                              autoFocus
                              required
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomCategory(false);
                                setNewCompCategory("Front");
                              }}
                              className="absolute right-1 text-slate-400 hover:text-slate-600 p-1"
                              title="Back to dropdown"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative w-40">
                            <button
                              type="button"
                              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                              className="w-full h-9 px-3 bg-white border border-slate-200 hover:border-blue-400 rounded-lg font-semibold text-slate-900 text-xs flex items-center justify-between gap-1 shadow-2xs transition-colors"
                            >
                              <span className="truncate">{newCompCategory || "Select Category"}</span>
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isCategoryOpen && (
                              <>
                                <div className="fixed inset-0 z-20" onClick={() => setIsCategoryOpen(false)} />
                                <div className="absolute left-0 top-10 z-30 w-52 bg-white rounded-xl border border-slate-200 shadow-2xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-0.5">
                                    Select Category
                                  </div>

                                  {/* Add Custom Category button pinned at TOP */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsCustomCategory(true);
                                      setNewCompCategory("");
                                      setIsCategoryOpen(false);
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-blue-200/80"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Add Custom Category...</span>
                                  </button>

                                  <div className="h-px bg-slate-100 my-1" />

                                  <div className="max-h-44 overflow-y-auto space-y-0.5 no-scrollbar">
                                    {categoriesList.map((cat) => (
                                      <div
                                        key={cat}
                                        onClick={() => {
                                          setNewCompCategory(cat);
                                          setIsCategoryOpen(false);
                                        }}
                                        className={`group w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                          newCompCategory === cat
                                            ? "bg-blue-50 text-blue-700 font-bold"
                                            : "text-slate-700 hover:bg-slate-100"
                                        }`}
                                      >
                                        <span className="truncate pr-2">{cat}</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                          {newCompCategory === cat && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                          <button
                                            type="button"
                                            onClick={(e) => handleDeleteCategoryOption(cat, e)}
                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-0.5 rounded transition-opacity"
                                            title={`Delete ${cat} category`}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        <input
                          type="text"
                          placeholder="Additional Note"
                          value={newCompName}
                          onChange={(e) => setNewCompName(e.target.value)}
                          className="w-44 h-9 px-2.5 bg-white border border-slate-200 rounded-md font-medium text-slate-900 focus:outline-none text-xs"
                        />
                        <input
                          type="number"
                          placeholder="Stitches"
                          value={newCompStitch}
                          onChange={(e) => setNewCompStitch(e.target.value !== "" ? parseInt(e.target.value) : "")}
                          className="w-28 h-9 px-2 bg-white border border-slate-200 rounded-md font-semibold text-slate-900 text-center focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button type="submit" className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-2xs text-xs flex items-center justify-center">
                          Save
                        </button>
                        <button type="button" onClick={() => setIsAddingComponentInline(false)} className="h-9 w-9 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 flex items-center justify-center">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  )}

                  {/* CLEAN STRUCTURED TABLE / ROWS (NO PRICE COLUMNS) */}
                  {selectedFolder.items.length > 0 ? (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-4">Component</th>
                          <th className="py-2.5 px-4 text-right">Stitch Count</th>
                          <th className="py-2.5 px-3 text-center w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {selectedFolder.items.map((item) => {
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold text-[10px] rounded border border-slate-200">
                                    {item.category}
                                  </span>
                                  <span className="font-bold text-slate-900">{item.component_name}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                                <span className="inline-block w-24 text-right font-extrabold">{item.stitch_count.toLocaleString()}</span>
                                <span className="inline-block w-16 text-left pl-1.5 font-sans text-[11px] font-normal text-slate-500">Stitches</span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => handleDeleteComponent(selectedFolder.id, item.id)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                                  title="Delete Component"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-emerald-50/80 border-t-2 border-slate-900 text-xs font-bold">
                          <td className="py-2.5 px-4 text-emerald-950 uppercase tracking-wider text-[11px] font-extrabold">
                            Total Garment Stitch Count:
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-xs font-black text-emerald-950">
                            <span className="inline-block w-24 text-right font-black text-emerald-950 text-sm">{totalStitches.toLocaleString()}</span>
                            <span className="inline-block w-16 text-left pl-1.5 font-sans text-[11px] font-extrabold text-emerald-950">Stitches</span>
                          </td>
                          <td className="py-2.5 px-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  ) : (
                    <div className="p-6 text-center bg-slate-50/60 border-t border-b border-slate-200 space-y-2">
                      <Scissors className="w-7 h-7 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">No Garment Components Added</p>
                      <p className="text-[11px] text-slate-500">Click "+ Add Part" above to add Front, Back, Patta stitch details.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

