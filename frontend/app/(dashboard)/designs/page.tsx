"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { getTenantItem, setTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
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
  Package,
  Image as ImageIcon,
  MessageSquare,
  Share2,
  ExternalLink,
  Copy,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  EyeOff
} from "lucide-react";

export interface ThreadItem {
  id: string;
  needle_no?: number | string;
  thread_name: string;
  thread_code?: string;
  color_hex?: string;
  thread_type?: string;
}

export interface ColorTakka {
  id: string;
  color_name: string;
  color_code?: string;
  takka_count: number;
  roll_meters?: number[];
  override_pcs?: number;
  threads?: ThreadItem[];
}

export interface DesignItem {
  id: string;
  component_name: string;
  category: string;
  stitch_count: number;
  rate_per_1k: number;
}

export interface DesignOrderHistoryItem {
  id: string;
  order_no: string;
  order_date: string;
  party_name: string;
  party_mobile?: string;
  fabric_terms: "Party Fabric (Job Work)" | "Our Fabric (With Fabric)";
  material_terms: "Factory Material" | "Party Supplied Material";
  total_pcs: number;
  rate_per_pc: number;
  total_amount: number;
  colors: { id: string; color_name: string; pcs: number; takka?: string }[];
  delivery_date: string;
  status: "Sample Pending" | "Sample Approved" | "In Production" | "Completed";
  notes?: string;
}

export interface DesignFolder {
  id: string;
  folder_code: string;
  title: string;
  party_name: string;
  design_type: "In-House Master" | "Party Exclusive";
  category: string;
  image_url?: string;
  emb_file_name?: string;
  stitch_count: number;
  rate_per_1k: number;
  created_date: string;
  machine_requirement: string;
  work_types: string[];
  items: DesignItem[];
  colorways: ColorTakka[];
  order_history?: DesignOrderHistoryItem[];
  takko_length_meters?: number;
  cut_length_meters?: number;
}

const DESIGN_CATEGORIES = [
  "Saree",
  "Blouse",
  "Kurti",
  "Lehenga",
  "Dupatta",
  "Dress / Suit",
  "Sherwani",
  "Border / Patta",
  "Fabric All-Over",
  "Other"
];

const WORK_TYPE_OPTIONS = [
  "Sequins (3mm / 5mm)",
  "Dull Gold Zari",
  "Copper Zari",
  "Silver Zari",
  "Cording / Dori Work",
  "Multi-Color Resham",
  "Thread / Plain Embroidery",
  "Mending & Finishing"
];

export default function DesignsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [folders, setFolders] = useState<DesignFolder[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cid = getStoredCompanyId();
        const saved = getTenantItem<DesignFolder[]>(
          "app_design_folders",
          cid === "comp-001" ? "om_sai_designs_library" : undefined
        );
        if (saved !== null && Array.isArray(saved)) {
          return saved;
        }
      } catch {}
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<"specs" | "orders">("specs");

  // Load design folders from backend & localStorage
  useEffect(() => {
    setIsMounted(true);
    const loadDesignsFromApi = async () => {
      try {
        const live = await fetchApi<any[]>("/designs");
        const cid = getStoredCompanyId();
        if (Array.isArray(live)) {
          if (live.length === 0) {
            setFolders([]);
            setTenantItem("app_design_folders", [], cid === "comp-001" ? "om_sai_designs_library" : undefined);
            setIsLoading(false);
            return;
          }
          const mapped: DesignFolder[] = live.map((d) => {
            let parsedItems: DesignItem[] = [];
            let parsedColorways: ColorTakka[] = [];
            let parsedHistory: DesignOrderHistoryItem[] = [];
            let parsedWorkTypes: string[] = [];

            if (d.items) {
              try {
                const rawItems = typeof d.items === "string" ? JSON.parse(d.items) : d.items;
                if (Array.isArray(rawItems)) parsedItems = rawItems;
              } catch {}
            }
            if (d.colorways) {
              try {
                const rawCws = typeof d.colorways === "string" ? JSON.parse(d.colorways) : d.colorways;
                if (Array.isArray(rawCws)) parsedColorways = rawCws;
              } catch {}
            }
            if (d.order_history) {
              try {
                const rawHist = typeof d.order_history === "string" ? JSON.parse(d.order_history) : d.order_history;
                if (Array.isArray(rawHist)) parsedHistory = rawHist;
              } catch {}
            }
            if (d.work_types) {
              try {
                const rawWt = typeof d.work_types === "string" ? JSON.parse(d.work_types) : d.work_types;
                if (Array.isArray(rawWt)) parsedWorkTypes = rawWt;
              } catch {}
            }

            return {
              id: d.id,
              folder_code: d.folder_code,
              title: d.title || "-",
              party_name: d.party_name || "In-House Master",
              design_type: d.design_type || (d.party_name && d.party_name !== "In-House Master" ? "Party Exclusive" : "In-House Master"),
              category: d.category || "Saree",
              image_url: d.image_url || undefined,
              emb_file_name: d.emb_file_name || undefined,
              stitch_count: Number(d.stitch_count) || (parsedItems.reduce((s, i) => s + (Number(i.stitch_count) || 0), 0) || 35000),
              rate_per_1k: Number(d.rate_per_1k) || 0.45,
              created_date: d.created_date || "01-10-2026",
              machine_requirement: d.machine_requirement || "17 Head Multi-Head",
              work_types: parsedWorkTypes.length > 0 ? parsedWorkTypes : ["Dull Gold Zari", "Multi-Color Resham"],
              takko_length_meters: d.takko_length_meters || 104,
              cut_length_meters: d.cut_length_meters || 0.93,
              items: parsedItems,
              colorways: parsedColorways,
              order_history: parsedHistory
            };
          });

          setFolders(mapped);
          setTenantItem("app_design_folders", mapped, cid === "comp-001" ? "om_sai_designs_library" : undefined);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Could not fetch live designs, reading localStorage fallback", err);
      }
      setIsLoading(false);
    };
    loadDesignsFromApi();
  }, []);

  const saveDesignFolders = (newFolders: DesignFolder[]) => {
    setFolders(newFolders);
    const cid = getStoredCompanyId();
    setTenantItem("app_design_folders", newFolders, cid === "comp-001" ? "om_sai_designs_library" : undefined);
    window.dispatchEvent(new Event("app_data_update"));
  };

  // INLINE TOGGLES
  const [isAddingFolderInline, setIsAddingFolderInline] = useState(false);
  const [isAddingColorInline, setIsAddingColorInline] = useState(false);
  const [isAddingComponentInline, setIsAddingComponentInline] = useState(false);

  // Form State: New Design Master
  const [newFolderImage, setNewFolderImage] = useState<string>("");
  const [newFolderCode, setNewFolderCode] = useState("");
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [newFolderCategory, setNewFolderCategory] = useState("Saree");
  const [newFolderDesignType, setNewFolderDesignType] = useState<"In-House Master" | "Party Exclusive">("In-House Master");
  const [newFolderParty, setNewFolderParty] = useState("");
  const [newFolderStitches, setNewFolderStitches] = useState<number | "">(35000);
  const [newFolderRate, setNewFolderRate] = useState<number | "">(0.45);
  const [newFolderWorkTypes, setNewFolderWorkTypes] = useState<string[]>(["Dull Gold Zari"]);
  const [newFolderEmbFile, setNewFolderEmbFile] = useState("");
  const [showWatermark, setShowWatermark] = useState(true);

  // Party selector dropdown state
  const [registeredParties, setRegisteredParties] = useState<{ id?: string; name: string; city?: string; mobile?: string }[]>([]);
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [partyHighlightIdx, setPartyHighlightIdx] = useState(0);
  const partyDropdownRef = useRef<HTMLDivElement>(null);
  const designFormRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Smart Job Order Modal States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderTargetDesign, setOrderTargetDesign] = useState<DesignFolder | null>(null);
  const [orderPartyName, setOrderPartyName] = useState("");
  const [orderPartyMobile, setOrderPartyMobile] = useState("");
  const [orderFabricTerms, setOrderFabricTerms] = useState<"Party Fabric (Job Work)" | "Our Fabric (With Fabric)">("Party Fabric (Job Work)");
  const [orderMaterialTerms, setOrderMaterialTerms] = useState<"Factory Material" | "Party Supplied Material">("Factory Material");
  const [orderColorRows, setOrderColorRows] = useState<{ id: string; color_name: string; takka: string; pcs: number | "" }[]>([
    { id: "col-1", color_name: "Rani", takka: "5", pcs: 150 },
    { id: "col-2", color_name: "Rama", takka: "5", pcs: 150 }
  ]);
  const [orderTargetDate, setOrderTargetDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getFullYear()}`;
  });
  const [orderSampleStatus, setOrderSampleStatus] = useState<"Sample Pending" | "Sample Approved" | "In Production">("Sample Pending");
  const [orderNotes, setOrderNotes] = useState("");

  // WhatsApp Confirmation Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppText, setWhatsAppText] = useState("");
  const [whatsAppTargetMobile, setWhatsAppTargetMobile] = useState("");
  const [copiedToast, setCopiedToast] = useState(false);

  // Load parties for dropdowns
  const loadPartiesInDesigns = () => {
    let partyList: { id?: string; name: string; city?: string; mobile?: string }[] = [];
    try {
      const saved = localStorage.getItem("app_parties");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((p: any) => {
            if (p.name && !partyList.some((x) => x.name === p.name)) {
              partyList.push({ id: p.id, name: p.name, city: p.city || "Surat", mobile: p.mobile || "" });
            }
          });
        }
      }
    } catch (e) {}

    try {
      const savedVendors = localStorage.getItem("app_vendors_master");
      if (savedVendors) {
        const parsedV = JSON.parse(savedVendors);
        if (Array.isArray(parsedV)) {
          parsedV.forEach((v: any) => {
            const name = (v.display_name || v.company_name || `${v.first_name || ""} ${v.last_name || ""}`).trim();
            if (name && !partyList.some((p) => p.name === name)) {
              partyList.push({
                id: v.id,
                name,
                city: v.city || "Surat",
                mobile: v.mobile || v.phone || ""
              });
            }
          });
        }
      }
    } catch (e) {}

    setRegisteredParties(partyList);
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

  // Click outside listener for party dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(event.target as Node)) {
        setIsPartyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Photo Upload with Auto Canvas Compress (Max 800px)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) return;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setNewFolderImage(compressed);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  // Toggle Work Type Tag
  const toggleWorkType = (tag: string) => {
    setNewFolderWorkTypes((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Calculate Job Work Rate (Stitches * Rate / 1000)
  const calculateRatePerPiece = (stitches: number | "", rate: number | "") => {
    const st = Number(stitches) || 0;
    const rt = Number(rate) || 0;
    return Number(((st * rt) / 1000).toFixed(2));
  };

  // Save New Design Folder
  const handleSaveDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderCode.trim()) {
      alert("⚠️ Please enter Design Code / No!");
      return;
    }

    const cleanCode = newFolderCode.trim().startsWith("Design") || newFolderCode.trim().startsWith("D-")
      ? newFolderCode.trim()
      : `D-${newFolderCode.trim()}`;
    const cleanTitle = newFolderTitle.trim() || `${newFolderCategory} Embroidered Suite`;
    const partyClean = newFolderDesignType === "Party Exclusive" && newFolderParty.trim()
      ? newFolderParty.trim()
      : "In-House Master";
    const dateFormatted = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
    const stitchesNum = Number(newFolderStitches) || 35000;
    const rateNum = Number(newFolderRate) || 0.45;
    let assignedId = `des-${Date.now()}`;

    const newDesignObj: DesignFolder = {
      id: assignedId,
      folder_code: cleanCode,
      title: cleanTitle,
      party_name: partyClean,
      design_type: newFolderDesignType,
      category: newFolderCategory,
      image_url: newFolderImage || undefined,
      emb_file_name: newFolderEmbFile.trim() || undefined,
      stitch_count: stitchesNum,
      rate_per_1k: rateNum,
      created_date: dateFormatted,
      machine_requirement: "17 Head Multi-Head",
      work_types: newFolderWorkTypes.length > 0 ? newFolderWorkTypes : ["Dull Gold Zari"],
      takko_length_meters: 104,
      cut_length_meters: 0.93,
      items: [
        {
          id: `i-${Date.now()}-1`,
          component_name: "Front Daman & Body",
          category: "Front",
          stitch_count: Math.round(stitchesNum * 0.6),
          rate_per_1k: rateNum
        },
        {
          id: `i-${Date.now()}-2`,
          component_name: "Back & Patta Border",
          category: "Back",
          stitch_count: Math.round(stitchesNum * 0.4),
          rate_per_1k: rateNum
        }
      ],
      colorways: [],
      order_history: []
    };

    try {
      const backendRes = await fetchApi<any>("/designs", {
        method: "POST",
        body: JSON.stringify({
          folder_code: cleanCode,
          title: cleanTitle,
          party_name: partyClean,
          design_type: newFolderDesignType,
          category: newFolderCategory,
          image_url: newFolderImage || null,
          stitch_count: stitchesNum,
          rate_per_1k: rateNum,
          work_types: JSON.stringify(newFolderWorkTypes),
          created_date: dateFormatted,
          machine_requirement: "17 Head Multi-Head",
          items: JSON.stringify(newDesignObj.items),
          colorways: JSON.stringify([])
        })
      });
      if (backendRes?.id) {
        newDesignObj.id = backendRes.id;
      }
    } catch (err) {
      console.warn("Backend design create fallback", err);
    }

    const nextFolders = [newDesignObj, ...folders];
    saveDesignFolders(nextFolders);
    setSelectedFolderId(newDesignObj.id);
    setIsAddingFolderInline(false);
    setNewFolderImage("");
    setNewFolderCode("");
    setNewFolderTitle("");
    setNewFolderParty("");
    setNewFolderStitches(35000);
    setNewFolderRate(0.45);
    setNewFolderWorkTypes(["Dull Gold Zari"]);
    setNewFolderEmbFile("");
  };

  // Open Order Modal for a specific design
  const handleOpenOrderModal = (e: React.MouseEvent, design: DesignFolder) => {
    e.stopPropagation();
    setOrderTargetDesign(design);
    setOrderPartyName(design.design_type === "Party Exclusive" && design.party_name !== "In-House Master" ? design.party_name : "");
    const matchedParty = registeredParties.find((p) => p.name === design.party_name);
    setOrderPartyMobile(matchedParty?.mobile || "");
    setOrderFabricTerms("Party Fabric (Job Work)");
    setOrderMaterialTerms("Factory Material");
    setOrderColorRows([
      { id: "col-1", color_name: "Rani", takka: "5", pcs: 150 },
      { id: "col-2", color_name: "Rama", takka: "5", pcs: 150 }
    ]);
    setOrderSampleStatus("Sample Pending");
    setOrderNotes("");
    setIsOrderModalOpen(true);
  };

  // Add / Remove Color Row in Order Modal
  const handleAddOrderColorRow = () => {
    setOrderColorRows((prev) => [
      ...prev,
      { id: `col-${Date.now()}`, color_name: "", takka: "", pcs: "" }
    ]);
  };

  const handleRemoveOrderColorRow = (id: string) => {
    if (orderColorRows.length <= 1) return;
    setOrderColorRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateOrderColorRow = (id: string, field: "color_name" | "takka" | "pcs", val: any) => {
    setOrderColorRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  // Calculate Order Totals
  const orderTotalPcs = orderColorRows.reduce((sum, r) => sum + (Number(r.pcs) || 0), 0);
  const orderRatePerPc = orderTargetDesign ? calculateRatePerPiece(orderTargetDesign.stitch_count, orderTargetDesign.rate_per_1k) : 0;
  const orderTotalAmount = orderTotalPcs * orderRatePerPc;

  // Build Formatted WhatsApp Message
  const generateWhatsAppMessage = (order: DesignOrderHistoryItem, design: DesignFolder) => {
    const colorBreakdownText = order.colors
      .map((c) => `  • ${c.color_name || "Standard"}: ${c.pcs} pcs${c.takka ? ` (${c.takka} Takka)` : ""}`)
      .join("\n");

    return `🪡 *SHIV CREATION - ORDER CONFIRMATION*\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *Order No:* #${order.order_no}\n` +
      `🎨 *Design:* ${design.folder_code} (${design.title})\n` +
      `👗 *Category:* ${design.category}\n` +
      `🧵 *Stitches:* ${design.stitch_count.toLocaleString("en-IN")} | *Rate:* ₹${order.rate_per_pc}/pc\n` +
      `📦 *Fabric Terms:* ${order.fabric_terms}\n` +
      `✨ *Material Terms:* ${order.material_terms}\n` +
      `🎯 *Sample Status:* ${order.status}\n` +
      `📅 *Target Delivery:* ${order.delivery_date}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🎨 *Colors & Quantities:*\n` +
      `${colorBreakdownText}\n` +
      `-----------------------------------\n` +
      `*Total Quantity:* ${order.total_pcs.toLocaleString("en-IN")} Pcs\n` +
      `*Total Estimate:* ₹${order.total_amount.toLocaleString("en-IN")}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `Please reply *CONFIRM* to verify this order. Thank you!`;
  };

  // Save Order & optionally launch WhatsApp
  const handleSaveOrderBatch = (andLaunchWhatsApp: boolean = false) => {
    if (!orderTargetDesign) return;
    if (!orderPartyName.trim()) {
      alert("⚠️ Please enter Party Name for this order!");
      return;
    }
    if (orderTotalPcs <= 0) {
      alert("⚠️ Please enter quantity for at least one color!");
      return;
    }

    const orderNo = `ORD-${Math.floor(100 + Math.random() * 900)}`;
    const orderDate = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");

    const newOrderRecord: DesignOrderHistoryItem = {
      id: `ord-${Date.now()}`,
      order_no: orderNo,
      order_date: orderDate,
      party_name: orderPartyName.trim(),
      party_mobile: orderPartyMobile.trim() || undefined,
      fabric_terms: orderFabricTerms,
      material_terms: orderMaterialTerms,
      total_pcs: orderTotalPcs,
      rate_per_pc: orderRatePerPc,
      total_amount: orderTotalAmount,
      colors: orderColorRows.map((r) => ({
        id: r.id,
        color_name: r.color_name.trim() || "Standard",
        pcs: Number(r.pcs) || 0,
        takka: r.takka.trim() || undefined
      })),
      delivery_date: orderTargetDate,
      status: orderSampleStatus,
      notes: orderNotes.trim() || undefined
    };

    // Append to design's order history
    const updatedFolders = folders.map((f) => {
      if (f.id === orderTargetDesign.id) {
        const existingHistory = f.order_history || [];
        return {
          ...f,
          order_history: [newOrderRecord, ...existingHistory]
        };
      }
      return f;
    });

    saveDesignFolders(updatedFolders);
    setIsOrderModalOpen(false);

    const formattedMessage = generateWhatsAppMessage(newOrderRecord, orderTargetDesign);
    setWhatsAppText(formattedMessage);
    setWhatsAppTargetMobile(orderPartyMobile.trim());

    if (andLaunchWhatsApp) {
      launchWhatsAppWeb(orderPartyMobile.trim(), formattedMessage);
    } else {
      setIsWhatsAppModalOpen(true);
    }
  };

  // Launch WhatsApp Web or App
  const launchWhatsAppWeb = (mobile: string, text: string) => {
    const cleanNumber = mobile.replace(/\D/g, "");
    const fullNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
    const url = fullNumber
      ? `https://wa.me/${fullNumber}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Update Status of an Order in History
  const handleUpdateOrderStatus = (
    designId: string,
    orderId: string,
    newStatus: DesignOrderHistoryItem["status"]
  ) => {
    const updated = folders.map((f) => {
      if (f.id === designId && f.order_history) {
        return {
          ...f,
          order_history: f.order_history.map((o) =>
            o.id === orderId ? { ...o, status: newStatus } : o
          )
        };
      }
      return f;
    });
    saveDesignFolders(updated);
  };

  // Delete Design Folder
  const handleDeleteFolder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this Design from library?")) return;
    try {
      await fetchApi(`/designs/${id}`, { method: "DELETE" });
    } catch (err) {}
    const updated = folders.filter((f) => f.id !== id);
    saveDesignFolders(updated);
    if (selectedFolderId === id) setSelectedFolderId(null);
  };

  // Filter Folders by Search
  const filteredFolders = folders.filter((f) =>
    f.folder_code.toLowerCase().includes(search.toLowerCase()) ||
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.party_name.toLowerCase().includes(search.toLowerCase()) ||
    f.category.toLowerCase().includes(search.toLowerCase())
  );

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  if (!isMounted) return null;

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-16">
      {/* TOP HEADER & SEARCH TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {selectedFolder ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedFolderId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Designs
            </button>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-blue-700 text-sm bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {selectedFolder.folder_code}
              </span>
              <span className="font-bold text-slate-800 truncate max-w-[200px] sm:max-w-[300px]">
                {selectedFolder.title}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Design No, Title, Category, Party..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        )}

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {selectedFolder ? (
            <>
              <button
                type="button"
                onClick={(e) => handleOpenOrderModal(e, selectedFolder)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" /> + Create Job Order
              </button>
              <button
                type="button"
                onClick={() => {
                  const sampleText = `🎨 *SHIV CREATION - DESIGN CATALOG*\n` +
                    `📋 *Design Code:* ${selectedFolder.folder_code}\n` +
                    `👗 *Category:* ${selectedFolder.category} (${selectedFolder.title})\n` +
                    `🧵 *Stitches:* ${selectedFolder.stitch_count.toLocaleString("en-IN")}\n` +
                    `💰 *Est. Job Rate:* ₹${calculateRatePerPiece(selectedFolder.stitch_count, selectedFolder.rate_per_1k)} / Piece (@ ₹${selectedFolder.rate_per_1k}/1k)\n` +
                    `✨ *Work Types:* ${selectedFolder.work_types.join(", ")}\n` +
                    `Please contact us to place bulk job orders.`;
                  setWhatsAppText(sampleText);
                  setWhatsAppTargetMobile("");
                  setIsWhatsAppModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Share Design Card on WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5 text-green-600" /> WhatsApp Card
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsAddingFolderInline(!isAddingFolderInline)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> {isAddingFolderInline ? "Close Form" : "Add New Design"}
            </button>
          )}
        </div>
      </div>

      {/* INLINE ADD NEW DESIGN MASTER FORM */}
      {!selectedFolder && isAddingFolderInline && (
        <form
          onSubmit={handleSaveDesign}
          className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-blue-400 shadow-xl space-y-4 animate-in fade-in duration-100 font-sans text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                <Palette className="w-4 h-4" />
              </div>
              <span>Add New Master Design (નવી ડિઝાઇન એડવાન્સમાં ઉમેરો)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingFolderInline(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2-COLUMN FORM LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: PHOTO UPLOAD & WATERMARK PREVIEW (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                Design Sample Photo
              </label>
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 p-3 flex flex-col items-center justify-center min-h-[220px] hover:border-blue-500 transition-colors group overflow-hidden">
                {newFolderImage ? (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img
                      src={newFolderImage}
                      alt="Design Preview"
                      className="w-full h-full object-cover"
                    />
                    {showWatermark && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <span className="transform -rotate-25 text-white/40 text-xs sm:text-sm font-black tracking-widest border border-white/30 px-3 py-1 bg-black/30 rounded backdrop-blur-2xs">
                          SHIV CREATION • SAMPLE ONLY
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setNewFolderImage("")}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md transition-all cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="design-photo-upload"
                    className="flex flex-col items-center justify-center cursor-pointer p-4 text-center w-full h-full"
                  >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <span className="font-extrabold text-slate-800 text-xs mt-2">Upload Sample Photo</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG / PNG / WebP (Auto-optimized)</span>
                  </label>
                )}
                <input
                  id="design-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Watermark Toggle */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Show Watermark Overlay
                </span>
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: CORE DESIGN & PRICING SPECIFICATIONS (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Row 1: Code, Title, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Design Code / No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. D-2486"
                    value={newFolderCode}
                    onChange={(e) => setNewFolderCode(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Heavy Sabyasachi Border"
                    value={newFolderTitle}
                    onChange={(e) => setNewFolderTitle(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Garment Category</label>
                  <select
                    value={newFolderCategory}
                    onChange={(e) => setNewFolderCategory(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                  >
                    {DESIGN_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Ownership Toggle & Party Selection */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Design Ownership & Exclusivity
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewFolderDesignType("In-House Master")}
                    className={`py-2 px-3 rounded-xl border font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newFolderDesignType === "In-House Master"
                        ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> In-House Master (પોતાનું સેમ્પલ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFolderDesignType("Party Exclusive")}
                    className={`py-2 px-3 rounded-xl border font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newFolderDesignType === "Party Exclusive"
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" /> Party Exclusive (પાર્ટી સ્પેશિયલ)
                  </button>
                </div>

                {newFolderDesignType === "Party Exclusive" && (
                  <div ref={partyDropdownRef} className="relative pt-1 animate-in fade-in duration-100">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Exclusive Party Name *</label>
                    <input
                      type="text"
                      placeholder="Type party name..."
                      value={newFolderParty}
                      onChange={(e) => {
                        setNewFolderParty(e.target.value);
                        setIsPartyDropdownOpen(true);
                      }}
                      onFocus={() => setIsPartyDropdownOpen(true)}
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                    />

                    {isPartyDropdownOpen && newFolderParty.trim().length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto p-1 space-y-0.5">
                        {registeredParties
                          .filter((p) => p.name.toLowerCase().includes(newFolderParty.toLowerCase()))
                          .map((p) => (
                            <button
                              key={p.name}
                              type="button"
                              onClick={() => {
                                setNewFolderParty(p.name);
                                setIsPartyDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-900 cursor-pointer flex items-center justify-between"
                            >
                              <span>{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">{p.city}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Row 3: Stitches & Costing Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Stitch Count *</label>
                  <input
                    type="number"
                    required
                    placeholder="35000"
                    value={newFolderStitches}
                    onChange={(e) => setNewFolderStitches(e.target.value ? Number(e.target.value) : "")}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rate per 1k Stitches (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.45"
                    value={newFolderRate}
                    onChange={(e) => setNewFolderRate(e.target.value ? Number(e.target.value) : "")}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-center h-9 flex flex-col justify-center">
                  <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider">
                    Est. Job Work Rate
                  </span>
                  <span className="font-mono font-black text-emerald-950 text-xs">
                    ₹{calculateRatePerPiece(newFolderStitches, newFolderRate)} / Piece
                  </span>
                </div>
              </div>

              {/* Row 4: Work Type Tags */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  Work Type & Materials (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {WORK_TYPE_OPTIONS.map((tag) => {
                    const isSelected = newFolderWorkTypes.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleWorkType(tag)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddingFolderInline(false)}
              className="px-4 h-9 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              Save Master Design
            </button>
          </div>
        </form>
      )}

      {/* DESIGN CATALOG GRID VIEW (When no folder is selected) */}
      {!selectedFolder && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFolders.length === 0 ? (
            <div className="col-span-full py-12 px-4 text-center bg-white rounded-2xl border border-slate-200">
              <Palette className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">
                {search.trim() ? `No design records matching "${search}".` : "No master designs in library yet."}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click "+ Add New Design" to upload sample photo, stitches, and store designs in advance.
              </p>
            </div>
          ) : (
            filteredFolders.map((f) => {
              const ratePerPiece = calculateRatePerPiece(f.stitch_count, f.rate_per_1k);
              const orderCount = f.order_history?.length || 0;
              const totalPiecesOrdered = f.order_history?.reduce((sum, o) => sum + o.total_pcs, 0) || 0;

              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFolderId(f.id)}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  {/* Photo / Sample Banner */}
                  <div className="relative w-full h-44 bg-slate-100 overflow-hidden border-b border-slate-100 flex items-center justify-center">
                    {f.image_url ? (
                      <>
                        <img
                          src={f.image_url}
                          alt={f.folder_code}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                          <span className="transform -rotate-25 text-white/30 text-[10px] font-black tracking-widest border border-white/20 px-2 py-0.5 bg-black/20 rounded">
                            SHIV CREATION
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <Palette className="w-8 h-8 opacity-40 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">No Photo</span>
                      </div>
                    )}

                    {/* Category & Ownership Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="px-2 py-0.5 bg-white/95 backdrop-blur-xs text-blue-700 rounded-md text-[10px] font-black shadow-2xs border border-blue-100">
                        {f.category}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-2xs border ${
                          f.design_type === "In-House Master"
                            ? "bg-purple-50 text-purple-800 border-purple-200"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}
                      >
                        {f.design_type === "In-House Master" ? "In-House" : f.party_name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteFolder(e, f.id)}
                        className="p-1 bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Delete Design"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Body Specs */}
                  <div className="p-3.5 space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-slate-900 text-xs tracking-tight">
                          {f.folder_code}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{f.created_date}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-xs truncate mt-0.5" title={f.title}>
                        {f.title}
                      </h3>
                    </div>

                    {/* Stitches & Rate Metric Chips */}
                    <div className="grid grid-cols-2 gap-2 text-center text-[10px] bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                      <div>
                        <span className="text-slate-400 block font-semibold uppercase tracking-wider">Stitches</span>
                        <span className="font-mono font-black text-slate-800 text-[11px]">
                          {f.stitch_count.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold uppercase tracking-wider">Job Rate</span>
                        <span className="font-mono font-black text-emerald-700 text-[11px]">
                          ₹{ratePerPiece} / Pc
                        </span>
                      </div>
                    </div>

                    {/* Work Types Preview Chips */}
                    {f.work_types && f.work_types.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {f.work_types.slice(0, 3).map((w) => (
                          <span
                            key={w}
                            className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200"
                          >
                            {w}
                          </span>
                        ))}
                        {f.work_types.length > 3 && (
                          <span className="text-[9px] font-bold text-slate-400">
                            +{f.work_types.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Order Count Badge */}
                    {orderCount > 0 && (
                      <div className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 flex items-center justify-between">
                        <span>Orders Placed:</span>
                        <span>{orderCount} batches ({totalPiecesOrdered} Pcs)</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="p-2.5 pt-0 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleOpenOrderModal(e, f)}
                      className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" /> Order
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const sampleText = `🎨 *SHIV CREATION - DESIGN CATALOG*\n` +
                          `📋 *Design Code:* ${f.folder_code}\n` +
                          `👗 *Category:* ${f.category} (${f.title})\n` +
                          `🧵 *Stitches:* ${f.stitch_count.toLocaleString("en-IN")}\n` +
                          `💰 *Job Work Rate:* ₹${ratePerPiece} / Piece (@ ₹${f.rate_per_1k}/1k)\n` +
                          `✨ *Work Types:* ${f.work_types.join(", ")}\n` +
                          `Reply to place job order.`;
                        setWhatsAppText(sampleText);
                        setWhatsAppTargetMobile(f.design_type === "Party Exclusive" ? registeredParties.find((p) => p.name === f.party_name)?.mobile || "" : "");
                        setIsWhatsAppModalOpen(true);
                      }}
                      className="py-1.5 px-2 bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3 text-green-600" /> Share
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SELECTED DESIGN DETAILS VIEW */}
      {selectedFolder && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Top Banner Card with Photo & High Level Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative flex items-center justify-center">
                {selectedFolder.image_url ? (
                  <img
                    src={selectedFolder.image_url}
                    alt={selectedFolder.folder_code}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Palette className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-blue-700 text-base">
                    {selectedFolder.folder_code}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200">
                    {selectedFolder.category}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                    {selectedFolder.design_type === "In-House Master" ? "In-House Collection" : selectedFolder.party_name}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-slate-900">{selectedFolder.title}</h2>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>Stitches: <strong className="text-slate-800">{selectedFolder.stitch_count.toLocaleString("en-IN")}</strong></span>
                  <span>•</span>
                  <span>Rate: <strong className="text-emerald-700 font-mono">₹{calculateRatePerPiece(selectedFolder.stitch_count, selectedFolder.rate_per_1k)} / Pc</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={(e) => handleOpenOrderModal(e, selectedFolder)}
                className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" /> + Create Job Order
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
            <button
              type="button"
              onClick={() => setActiveDetailTab("specs")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeDetailTab === "specs"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              📐 Design Specs & Components ({selectedFolder.items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveDetailTab("orders")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeDetailTab === "orders"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Job Orders & WhatsApp Batches ({selectedFolder.order_history?.length || 0})</span>
            </button>
          </div>

          {/* TAB 1: DESIGN SPECS & GARMENT COMPONENTS */}
          {activeDetailTab === "specs" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Photo Preview & Work Types */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" /> Sample Image & Punching
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Watermark Active
                  </div>
                </div>

                <div className="relative w-full h-64 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                  {selectedFolder.image_url ? (
                    <>
                      <img
                        src={selectedFolder.image_url}
                        alt="Design Full Preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <span className="transform -rotate-25 text-white/40 text-sm font-black tracking-widest border border-white/30 px-3 py-1 bg-black/30 rounded backdrop-blur-2xs">
                          SHIV CREATION • SAMPLE ONLY
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-slate-400">
                      <ImageIcon className="w-10 h-10 mx-auto mb-1 opacity-40" />
                      <p className="text-xs font-bold">No photo attached to this master design.</p>
                    </div>
                  )}
                </div>

                {/* Work Type Tags */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Applied Work Types
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFolder.work_types?.map((wt) => (
                      <span
                        key={wt}
                        className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold border border-slate-200"
                      >
                        ✓ {wt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Garment Components Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-blue-600" /> Garment Components ({selectedFolder.items.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingComponentInline(!isAddingComponentInline)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Part
                  </button>
                </div>

                {/* Component List */}
                <div className="space-y-2">
                  {selectedFolder.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold px-2 py-0.5 bg-white border border-slate-200 text-blue-700 rounded text-[10px] mr-2">
                          {item.category}
                        </span>
                        <strong className="text-slate-800">{item.component_name}</strong>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-slate-900 block">
                          {item.stitch_count.toLocaleString("en-IN")} Stitches
                        </span>
                        <span className="text-[10px] text-slate-400">@ ₹{item.rate_per_1k}/1k</span>
                      </div>
                    </div>
                  ))}

                  {selectedFolder.items.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-6">
                      No separate components added. Main design stitch count applies.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JOB ORDERS & WHATSAPP BATCHES */}
          {activeDetailTab === "orders" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                    Past & Active Production Batches
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Orders received from parties for {selectedFolder.folder_code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleOpenOrderModal(e, selectedFolder)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" /> + Create Job Order
                </button>
              </div>

              {/* Order Cards List */}
              <div className="space-y-3">
                {(!selectedFolder.order_history || selectedFolder.order_history.length === 0) ? (
                  <div className="py-12 text-center text-slate-400">
                    <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-bold text-slate-600">No orders placed for this design yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "+ Create Job Order" to record party orders with dynamic colors and send WhatsApp confirmation.
                    </p>
                  </div>
                ) : (
                  selectedFolder.order_history.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-blue-300 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 text-xs">
                            #{ord.order_no}
                          </span>
                          <strong className="text-slate-900 text-sm">{ord.party_name}</strong>
                          {ord.party_mobile && (
                            <span className="text-[11px] text-slate-500 font-mono">({ord.party_mobile})</span>
                          )}
                        </div>

                        {/* Status Selector Dropdown */}
                        <div className="flex items-center gap-2">
                          <select
                            value={ord.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(selectedFolder.id, ord.id, e.target.value as any)
                            }
                            className={`text-[11px] font-black px-2.5 py-1 rounded-lg border cursor-pointer ${
                              ord.status === "Sample Approved" || ord.status === "Completed"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : ord.status === "In Production"
                                ? "bg-blue-50 text-blue-800 border-blue-300"
                                : "bg-amber-50 text-amber-800 border-amber-300"
                            }`}
                          >
                            <option value="Sample Pending">⏳ Sample Pending</option>
                            <option value="Sample Approved">✓ Sample Approved</option>
                            <option value="In Production">⚙️ In Production</option>
                            <option value="Completed">✓ Completed</option>
                          </select>

                          {/* WhatsApp Resend Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const msg = generateWhatsAppMessage(ord, selectedFolder);
                              setWhatsAppText(msg);
                              setWhatsAppTargetMobile(ord.party_mobile || "");
                              setIsWhatsAppModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                          </button>
                        </div>
                      </div>

                      {/* Terms Badges & Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Fabric Supply</span>
                          <strong className="text-slate-800 text-[11px]">{ord.fabric_terms}</strong>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Material Supply</span>
                          <strong className="text-slate-800 text-[11px]">{ord.material_terms}</strong>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Delivery Date</span>
                          <strong className="text-slate-800 text-[11px]">{ord.delivery_date}</strong>
                        </div>
                      </div>

                      {/* Colors Table */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Colorways & Quantity Breakdown
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {ord.colors.map((c, cIdx) => (
                            <div
                              key={cIdx}
                              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1.5"
                            >
                              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                              <span>{c.color_name}:</span>
                              <strong className="font-mono text-blue-900">{c.pcs} Pcs</strong>
                              {c.takka && <span className="text-[10px] text-slate-400">({c.takka} Takka)</span>}
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-500">Total Quantity:</span>
                          <span className="text-emerald-700 font-mono text-sm">
                            {ord.total_pcs.toLocaleString("en-IN")} Pcs • Total: ₹{ord.total_amount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SMART JOB ORDER & CONTRACT MODAL */}
      {isOrderModalOpen && orderTargetDesign && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl p-5 space-y-4 text-xs font-sans">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Create Job Order for {orderTargetDesign.folder_code}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Rate: ₹{orderRatePerPc} / Pc • {orderTargetDesign.stitch_count.toLocaleString("en-IN")} Stitches
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Party & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Party / Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Surat Silk Mills"
                  value={orderPartyName}
                  onChange={(e) => setOrderPartyName(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp Mobile Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9825100000"
                  value={orderPartyMobile}
                  onChange={(e) => setOrderPartyMobile(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Terms Toggles: Fabric & Material */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  1. Fabric Supply Condition
                </span>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 cursor-pointer font-bold text-slate-800 text-[11px]">
                    <input
                      type="radio"
                      name="fabricTerms"
                      checked={orderFabricTerms === "Party Fabric (Job Work)"}
                      onChange={() => setOrderFabricTerms("Party Fabric (Job Work)")}
                      className="text-blue-600"
                    />
                    <span>Party નું કાપડ (Job Work Only)</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 cursor-pointer font-bold text-slate-800 text-[11px]">
                    <input
                      type="radio"
                      name="fabricTerms"
                      checked={orderFabricTerms === "Our Fabric (With Fabric)"}
                      onChange={() => setOrderFabricTerms("Our Fabric (With Fabric)")}
                      className="text-blue-600"
                    />
                    <span>આપણું પોતાનું કાપડ (With Fabric)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  2. Material / Thread Supply
                </span>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 cursor-pointer font-bold text-slate-800 text-[11px]">
                    <input
                      type="radio"
                      name="materialTerms"
                      checked={orderMaterialTerms === "Factory Material"}
                      onChange={() => setOrderMaterialTerms("Factory Material")}
                      className="text-blue-600"
                    />
                    <span>આપણી ફેક્ટરીનું મટીરીયલ (With Material)</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 cursor-pointer font-bold text-slate-800 text-[11px]">
                    <input
                      type="radio"
                      name="materialTerms"
                      checked={orderMaterialTerms === "Party Supplied Material"}
                      onChange={() => setOrderMaterialTerms("Party Supplied Material")}
                      className="text-blue-600"
                    />
                    <span>Party નું મટીરીયલ (Party Zari/Sequence)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Dynamic Colors & Quantities Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs">
                  Colors & Quantities (જેટલા કલર આવ્યા હોય તેટલા ઉમેરો)
                </span>
                <button
                  type="button"
                  onClick={handleAddOrderColorRow}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-[11px] border border-blue-200 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Color
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {orderColorRows.map((row, idx) => (
                  <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Color Name (e.g. Rani)"
                        value={row.color_name}
                        onChange={(e) => handleUpdateOrderColorRow(row.id, "color_name", e.target.value)}
                        className="w-full h-8 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Takka (e.g. 5)"
                        value={row.takka}
                        onChange={(e) => handleUpdateOrderColorRow(row.id, "takka", e.target.value)}
                        className="w-full h-8 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Pieces *"
                        value={row.pcs}
                        onChange={(e) => handleUpdateOrderColorRow(row.id, "pcs", e.target.value ? Number(e.target.value) : "")}
                        className="w-full h-8 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-black text-slate-900 focus:bg-white focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      {orderColorRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOrderColorRow(row.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation Box */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between font-bold text-xs">
                <span className="text-emerald-900">
                  Total Order Volume: <strong>{orderTotalPcs} Pcs</strong>
                </span>
                <span className="font-mono text-emerald-950 font-black text-sm">
                  Total Estimate: ₹{orderTotalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Target Delivery & Sample Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Delivery Date</label>
                <input
                  type="text"
                  placeholder="DD-MM-YYYY"
                  value={orderTargetDate}
                  onChange={(e) => setOrderTargetDate(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Sample Status</label>
                <select
                  value={orderSampleStatus}
                  onChange={(e) => setOrderSampleStatus(e.target.value as any)}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 cursor-pointer"
                >
                  <option value="Sample Pending">⏳ Sample Approval Pending</option>
                  <option value="Sample Approved">✓ Sample Passed & Approved</option>
                  <option value="In Production">⚙️ Direct in Bulk Production</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="px-4 h-9 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveOrderBatch(false)}
                className="px-4 h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-2xs transition-all cursor-pointer"
              >
                Save Order
              </button>
              <button
                type="button"
                onClick={() => handleSaveOrderBatch(true)}
                className="px-5 h-9 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Save & Send WhatsApp 📲
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP CONFIRMATION PREVIEW MODAL */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-50 text-green-700 rounded-xl border border-green-200">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">WhatsApp Order Confirmation</h3>
                  <p className="text-[11px] text-slate-500">Preview message before sending to party</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Recipient Mobile Number</label>
              <input
                type="text"
                placeholder="Party WhatsApp Mobile (e.g. 9825100000)"
                value={whatsAppTargetMobile}
                onChange={(e) => setWhatsAppTargetMobile(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-green-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Message Preview</label>
              <textarea
                rows={9}
                value={whatsAppText}
                onChange={(e) => setWhatsAppText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed text-slate-900 focus:bg-white focus:outline-none focus:border-green-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(whatsAppText);
                  setCopiedToast(true);
                  setTimeout(() => setCopiedToast(false), 2000);
                }}
                className="px-3.5 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedToast ? "Copied!" : "Copy Text"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="px-4 h-9 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    launchWhatsAppWeb(whatsAppTargetMobile, whatsAppText);
                    setIsWhatsAppModalOpen(false);
                  }}
                  className="px-5 h-9 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open WhatsApp 📲</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
