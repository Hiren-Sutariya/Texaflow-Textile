"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTenantItem, setTenantItem, getStoredCompanyId } from "@/lib/tenantStorage";
import { getStoredCompanySettings, fetchLiveCompanySettings, CompanySettings, getFieldLabel } from "@/lib/companySettings";
import { calculateDueDate, getDueStatus, parseAnyDate } from "@/lib/creditTerms";
import { useLanguage } from "@/context/LanguageContext";
import {
  SalesChallan,
  SalesLineItem,
  getStoredSalesChallans,
  saveSalesChallan,
  deleteSalesChallan
} from "@/lib/salesStorage";
import {
  Truck,
  Plus,
  Search,
  Printer,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronDown,
  X,
  AlertTriangle,
  Check,
  TrendingUp,
  Receipt,
  FileText,
  MessageCircle
} from "lucide-react";

interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = ""
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-xs select-none ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 bg-white border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""
        }`}
      >
        <span className={`truncate font-bold ${selectedOption ? "text-slate-900" : "text-slate-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1.5 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 min-w-full w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-blue-50 text-blue-950 font-extrabold border-blue-500 shadow-2xs"
                      : "text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium border-slate-200 bg-white"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function getSalesDueInfo(challan: SalesChallan) {
  if (challan.billing_status === "Billed") {
    return {
      isBillPending: false,
      isPaid: true,
      isOverdue: false,
      isDueToday: false,
      text: "Settled",
      daysLeft: 0,
    };
  }

  const challanD = parseAnyDate(challan.date);
  const creditDays = typeof challan.credit_days === "number" ? challan.credit_days : parseInt(String(challan.credit_days || "30"), 10) || 30;

  let dueD: Date | null = null;
  if (challan.due_date) {
    dueD = parseAnyDate(challan.due_date);
  }
  if (!dueD && challanD) {
    dueD = new Date(challanD.getTime());
    if (creditDays > 0) {
      dueD.setDate(dueD.getDate() + creditDays);
    }
  }

  if (!dueD) {
    return {
      isBillPending: false,
      isPaid: false,
      isOverdue: false,
      isDueToday: false,
      text: "-",
      daysLeft: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueD.setHours(0, 0, 0, 0);

  const diffTime = dueD.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      isBillPending: false,
      isPaid: false,
      isOverdue: true,
      isDueToday: false,
      text: `${Math.abs(diffDays)}d Overdue`,
      daysLeft: diffDays,
    };
  }

  if (diffDays === 0) {
    return {
      isBillPending: false,
      isPaid: false,
      isOverdue: false,
      isDueToday: true,
      text: "Due Today",
      daysLeft: 0,
    };
  }

  return {
    isBillPending: false,
    isPaid: false,
    isOverdue: false,
    isDueToday: false,
    text: `${diffDays}d left`,
    daysLeft: diffDays,
  };
}

export default function SalesPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isGujarati = language === "gu";

  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedParty, setSelectedParty] = useState<string>("All");

  // Print modal state
  const [previewChallan, setPreviewChallan] = useState<SalesChallan | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => getStoredCompanySettings());

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load challans
  const loadData = () => {
    const list = getStoredSalesChallans();
    setChallans(list);
  };

  useEffect(() => {
    loadData();
    const handleSalesUpdate = () => loadData();
    window.addEventListener("texaflow_sales_updated", handleSalesUpdate);
    window.addEventListener("storage", handleSalesUpdate);
    return () => {
      window.removeEventListener("texaflow_sales_updated", handleSalesUpdate);
      window.removeEventListener("storage", handleSalesUpdate);
    };
  }, []);

  // Sync company settings
  useEffect(() => {
    const syncSettings = () => {
      setCompanySettings(getStoredCompanySettings());
    };
    const cid = getStoredCompanyId() || "comp-001";
    fetchLiveCompanySettings(cid).then((st) => {
      if (st) setCompanySettings(st);
    });

    window.addEventListener("app_settings_update", syncSettings);
    window.addEventListener("app_settings_updated", syncSettings);
    return () => {
      window.removeEventListener("app_settings_update", syncSettings);
      window.removeEventListener("app_settings_updated", syncSettings);
    };
  }, []);

  // Parties list for filter dropdown
  const partiesList = useMemo(() => {
    const names = challans.map((c) => c.party_name).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [challans]);

  // Aggregate Stats
  const totalSalesAmount = useMemo(() => {
    return challans.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  }, [challans]);

  const unbilledChallans = useMemo(() => {
    return challans.filter((c) => c.billing_status === "Unbilled");
  }, [challans]);

  const pendingAmount = useMemo(() => {
    return unbilledChallans.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  }, [unbilledChallans]);

  const billedChallans = useMemo(() => {
    return challans.filter((c) => c.billing_status === "Billed");
  }, [challans]);

  // Filtered list
  const filteredChallans = useMemo(() => {
    return challans.filter((c) => {
      if (statusFilter !== "All" && c.billing_status !== statusFilter) return false;
      if (selectedParty !== "All" && c.party_name !== selectedParty) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const chNo = (c.challan_no || "").toLowerCase();
        const party = (c.party_name || "").toLowerCase();
        const transport = (c.transport || "").toLowerCase();
        const vehicle = (c.vehicle_no || "").toLowerCase();
        const itemsMatch = c.items?.some(
          (it) =>
            (it.category || "").toLowerCase().includes(q) ||
            (it.design_no || "").toLowerCase().includes(q) ||
            (it.description || "").toLowerCase().includes(q) ||
            (it.hsn_code || "").toLowerCase().includes(q)
        );

        if (
          !chNo.includes(q) &&
          !party.includes(q) &&
          !transport.includes(q) &&
          !vehicle.includes(q) &&
          !itemsMatch
        ) {
          return false;
        }
      }
      return true;
    });
  }, [challans, statusFilter, selectedParty, search]);

  const handleDelete = (id: string) => {
    deleteSalesChallan(id);
    setDeletingId(null);
    loadData();
  };

  const handlePrint = (challan: SalesChallan) => {
    setPreviewChallan(challan);
  };

  const executePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = (challan: SalesChallan) => {
    const firmName = companySettings?.company_name || "Om Sai / Shiv Creation";
    const partyName = challan.party_name || "Valued Customer";
    const challanNo = challan.challan_no || "-";
    const challanDate = challan.date || "";
    const totalMtrs = challan.total_quantity || challan.total_meters || 0;
    const totalTakka = challan.total_item || challan.total_takka || 0;
    const totalAmount = (challan.total_amount || 0).toLocaleString("en-IN");
    
    const message = 
      `*DELIVERY CHALLAN - ${firmName.toUpperCase()}*\n\n` +
      `નમસ્તે *${partyName}*,\n` +
      `આપનું સેલ્સ ચલણ બની ગયેલ છે:\n\n` +
      `📄 *ચલણ નં:* ${challanNo}\n` +
      `📅 *તારીખ:* ${challanDate}\n` +
      `📦 *જથ્થો:* ${totalTakka > 0 ? `${totalTakka} તાકા / ` : ""}${totalMtrs} મીટર\n` +
      `💰 *કુલ રકમ:* ₹${totalAmount}\n\n` +
      `આભાર! 🙏\n` +
      `_${firmName}_`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto select-none pb-12">
      {/* 4 Stat KPI Cards - EXACT same size and style as Purchases page */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* CARD 1: TOTAL SALES */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {t("TOTAL SALES")}
            </p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              ₹{totalSalesAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 2: PENDING CREDIT */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider truncate">
              {t("PENDING CREDIT")}
            </p>
            <p className="text-xl font-black text-amber-600 mt-0.5">
              ₹{pendingAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 3: UNBILLED CHALLANS */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider truncate">
              {t("UNBILLED CHALLANS")}
            </p>
            <p className={`text-xl font-black ${unbilledChallans.length > 0 ? "text-rose-600" : "text-slate-900"} mt-0.5`}>
              {unbilledChallans.length}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 4: PAID / SETTLED (BILLED CHALLANS) */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider truncate">
              {t("PAID / SETTLED")}
            </p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">
              {billedChallans.length}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t("Search by customer, challan no, category, hsn...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Dropdown */}
          <div className="w-40 shrink-0">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: "All", label: t("All Status") },
                { value: "Unbilled", label: t("Unbilled") },
                { value: "Billed", label: t("Billed") }
              ]}
            />
          </div>

          {/* Party Dropdown */}
          <div className="w-44 shrink-0">
            <CustomSelect
              value={selectedParty}
              onChange={(val) => setSelectedParty(val)}
              options={[
                { value: "All", label: t("All Customers") },
                ...partiesList.map((p) => ({ value: p, label: p }))
              ]}
            />
          </div>

          {/* Generate Monthly Invoice Button */}
          <Link
            href="/invoices/generate"
            className="h-9 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0 text-xs"
            title={isGujarati ? "ચલણમાંથી માસિક પાકું બિલ બનાવો" : "Generate Monthly Tax Invoice"}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isGujarati ? "પાકું બિલ બનાવો" : "Generate Invoice"}</span>
          </Link>

          {/* New Sales Challan Button */}
          <Link
            href="/sales/new"
            className="h-9 px-3.5 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-all shadow-2xs cursor-pointer shrink-0 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t("New Sales Challan")}</span>
          </Link>
        </div>
      </div>

      {/* EXCEL SHEET TABLE - EXACT MATCH WITH DUE (DAYS) BEFORE STATUS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs table-fixed min-w-[1100px]">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                {/* 1. DATE */}
                <th className="py-2.5 px-2 w-[7.5%] border-r border-slate-200/80">{t("DATE")}</th>
                {/* 2. CHALLAN NO */}
                <th className="py-2.5 px-2 w-[7.5%] border-r border-slate-200/80 truncate">
                  {getFieldLabel(companySettings, "challan_no", t("CHALLAN NO"))}
                </th>
                {/* 3. CUSTOMER / PARTY */}
                <th className="py-2.5 px-2 w-[13%] border-r border-slate-200/80 truncate">
                  {getFieldLabel(companySettings, "party_name", t("CUSTOMER / PARTY"))}
                </th>
                {/* 4. PARTICULARS */}
                <th className="py-2.5 px-2 w-[16%] border-r border-slate-200/80 truncate">
                  {getFieldLabel(companySettings, "item_name", t("PARTICULARS"))}
                </th>
                {/* 5. QUANTITY (Renamed from Meters) */}
                <th className="py-2.5 px-1.5 text-right w-[8%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "quantity", t("QUANTITY"))}
                </th>
                {/* 6. WEIGHT */}
                <th className="py-2.5 px-1 text-right w-[6.5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "weight", t("WEIGHT"))}
                </th>
                {/* 7. KG */}
                <th className="py-2.5 px-1 text-right w-[6.5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "kg", t("KG"))}
                </th>
                {/* 8. CARTOON */}
                <th className="py-2.5 px-1 text-center w-[5.5%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "cartoon", t("CARTOON"))}
                </th>
                {/* 9. RATE (₹) */}
                <th className="py-2.5 px-1.5 text-right w-[8%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "rate", t("RATE (₹)"))}
                </th>
                {/* 10. AMOUNT (₹) */}
                <th className="py-2.5 px-2 text-right w-[9%] border-r border-slate-200/80">
                  {getFieldLabel(companySettings, "total_amount", t("AMOUNT (₹)"))}
                </th>
                {/* 11. DUE (DAYS) */}
                <th className="py-2.5 px-1 text-center w-[7.5%] border-r border-slate-200/80">{t("DUE (DAYS)")}</th>
                {/* 12. STATUS */}
                <th className="py-2.5 px-1 text-center w-[6%] border-r border-slate-200/80">{t("STATUS")}</th>
                {/* 13. ACTION */}
                <th className="py-2.5 px-2 text-center w-[9.5%] min-w-[125px]">{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
              {filteredChallans.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <Truck className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                    <p className="text-sm font-bold text-slate-600">{t("No Sales Challans Found")}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {search ? t("Try searching with different terms") : t("Click '+ New Sales Challan' to create your first dispatch")}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredChallans.map((challan) => {
                  const firstItem = challan.items?.[0];
                  const extraItemsCount = (challan.items?.length || 0) - 1;
                  const isBilled = challan.billing_status === "Billed";

                  // Due date & status calculation
                  const dueInfo = getSalesDueInfo(challan);

                  const hsnCode = firstItem?.hsn_code || "5407";
                  const categoryName = firstItem?.category || firstItem?.design_no || firstItem?.description || "-";
                  const totalItemVal = challan.total_item || challan.total_takka || "-";
                  const totalQtyVal = challan.total_quantity || challan.total_meters || "-";
                  const totalKgVal = (challan.items || []).reduce((acc: number, it: any) => acc + (parseFloat(String(it.kg || "")) || 0), 0);
                  const kgDisplay = (challan as any).total_kg ? String((challan as any).total_kg) : (totalKgVal > 0 ? totalKgVal.toFixed(2) : "-");

                  // Rate extraction
                  let rateDisplay = "-";
                  const firstItemRate = firstItem?.rate ? parseFloat(String(firstItem.rate)) : 0;
                  if (firstItemRate > 0) {
                    rateDisplay = `₹${firstItemRate.toFixed(2)}`;
                  } else {
                    const itemWithRate = challan.items?.find((it) => it.rate && parseFloat(String(it.rate)) > 0);
                    if (itemWithRate?.rate) {
                      rateDisplay = `₹${parseFloat(String(itemWithRate.rate)).toFixed(2)}`;
                    } else {
                      const totAmt = Number(challan.total_amount || 0);
                      const totQty = Number(challan.total_quantity || challan.total_meters || 0);
                      if (totAmt > 0 && totQty > 0) {
                        rateDisplay = `₹${(totAmt / totQty).toFixed(2)}`;
                      } else {
                        const totWt = Number(challan.total_weight || 0);
                        if (totAmt > 0 && totWt > 0) {
                          rateDisplay = `₹${(totAmt / totWt).toFixed(2)}`;
                        }
                      }
                    }
                  }

                  return (
                    <tr
                      key={challan.id}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => handlePrint(challan)}
                    >
                      {/* 1. DATE */}
                      <td className="py-2 px-2 font-mono text-slate-600 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {challan.date}
                      </td>

                      {/* 2. CHALLAN NO */}
                      <td className="py-2 px-1.5 font-mono font-bold text-slate-900 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {challan.challan_no}
                      </td>

                      {/* 3. CUSTOMER / PARTY (Broker removed) */}
                      <td className="py-2 px-2 align-middle border-r border-slate-200/70">
                        <Link
                          href={`/ledger?party=${encodeURIComponent(challan.party_name)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-slate-900 hover:text-blue-600 hover:underline truncate w-full block transition-colors cursor-pointer"
                          title={`View Ledger for ${challan.party_name}`}
                        >
                          {challan.party_name}
                        </Link>
                      </td>

                      {/* 4. PERTICULARS (Multiple items/options: Design, Fabric, Quality, Saree, etc.) */}
                      <td className="py-2 px-2 align-middle border-r border-slate-200/70">
                        <div className="truncate w-full" title={categoryName}>
                          <span className="font-bold text-slate-800">{categoryName}</span>
                          {extraItemsCount > 0 && (
                            <span className="text-[10px] text-slate-400 ml-1">+{extraItemsCount}</span>
                          )}
                        </div>
                      </td>

                      {/* 5. QUANTITY (Renamed from Meters) */}
                      <td className="py-2 px-1.5 text-right font-mono font-bold text-slate-800 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {typeof totalQtyVal === "number" ? Number(totalQtyVal).toFixed(1) : totalQtyVal}
                      </td>

                      {/* 6. WEIGHT */}
                      <td className="py-2 px-1 text-right font-mono text-slate-800 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {challan.total_weight ? `${Number(challan.total_weight).toFixed(2)}` : "-"}
                      </td>

                      {/* 7. KG */}
                      <td className="py-2 px-1 text-right font-mono text-slate-800 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {kgDisplay}
                      </td>

                      {/* 8. CARTOON */}
                      <td className="py-2 px-1 text-center font-mono text-slate-800 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {challan.total_cartoon || "-"}
                      </td>

                      {/* 10. RATE (₹) */}
                      <td className="py-2 px-1.5 text-right font-mono font-bold text-slate-800 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        {rateDisplay}
                      </td>

                      {/* 11. AMOUNT (₹) */}
                      <td className="py-2 px-2 text-right font-mono font-black text-slate-900 whitespace-nowrap align-middle border-r border-slate-200/70 text-xs">
                        ₹{Number(challan.total_amount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2
                        })}
                      </td>

                      {/* 12. DUE (DAYS) - EXACT MATCH WITH PURCHASES PAGE */}
                      <td className="py-2 px-1 text-center align-middle whitespace-nowrap border-r border-slate-200/70">
                        {dueInfo.isBillPending ? (
                          <span className="text-xs font-bold text-amber-700 inline-flex items-center gap-1 justify-center">
                            <span>-</span>
                          </span>
                        ) : dueInfo.isPaid ? (
                          <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1 justify-center">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{t("Settled")}</span>
                          </span>
                        ) : dueInfo.isOverdue ? (
                          <span className="font-mono text-xs font-bold text-rose-600 inline-flex items-center gap-1 justify-center">
                            <Clock className="w-3 h-3 text-rose-600" />
                            <span>{dueInfo.text}</span>
                          </span>
                        ) : dueInfo.isDueToday ? (
                          <span className="font-mono text-xs font-bold text-amber-700 inline-flex items-center gap-1 justify-center">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{t("Due Today")}</span>
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-bold text-amber-700 inline-flex items-center gap-1 justify-center">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{dueInfo.text}</span>
                          </span>
                        )}
                      </td>

                      {/* 13. STATUS */}
                      <td className="py-2 px-1 text-center align-middle whitespace-nowrap border-r border-slate-200/70">
                        {isBilled ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{t("Paid")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>{t("Pending")}</span>
                          </span>
                        )}
                      </td>

                      {/* 14. ACTION */}
                      <td className="py-2.5 px-2 text-center align-middle whitespace-nowrap min-w-[125px]">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handlePrint(challan)}
                            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={t("Print Bill Slip")}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(challan)}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="WhatsApp પર શેર કરો"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/sales/new?id=${challan.id}`}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={t("Edit")}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeletingId(challan.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={t("Delete")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 text-base">{t("Delete Sales Challan?")}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t("Are you sure you want to delete this sales challan? This action will remove the dispatch entry and cannot be undone.")}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-sm shadow-rose-600/20"
              >
                {t("Delete Challan")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SALES CHALLAN / BILL PRINT SLIP MODAL (EXACT SAME AS PURCHASES PAGE) */}
      {previewChallan && (() => {
        let parsedItems: any[] = [];
        if (Array.isArray(previewChallan.items)) {
          parsedItems = previewChallan.items;
        }

        const validItems = parsedItems.filter(
          (it: any) =>
            (it.description && it.description.trim()) ||
            (it.category && it.category.trim()) ||
            (it.design_no && it.design_no.trim()) ||
            (it.quantity && it.quantity.toString().trim()) ||
            (it.meters && it.meters.toString().trim()) ||
            (it.amount && it.amount.toString().trim())
        );

        let totalQtySum = 0;
        let qtyUnit = "";
        let hasNumericQty = false;
        let totalWeightSum = 0;
        let hasNumericWeight = false;
        let totalKgSum = 0;
        let hasKg = false;
        let totalCartoonSum = 0;
        let hasCartoon = false;

        validItems.forEach((it: any) => {
          const rawQ = (it.quantity || it.meters || "").toString().trim();
          const match = rawQ.match(/^([\d.]+)\s*(.*)$/);
          if (match) {
            hasNumericQty = true;
            totalQtySum += parseFloat(match[1]);
            if (!qtyUnit && match[2]) qtyUnit = match[2].trim();
          }

          if (it.weight && !isNaN(parseFloat(String(it.weight)))) {
            hasNumericWeight = true;
            totalWeightSum += parseFloat(String(it.weight));
          }

          if (it.kg && !isNaN(parseFloat(String(it.kg)))) {
            hasKg = true;
            totalKgSum += parseFloat(String(it.kg));
          }

          if (it.cartoon && !isNaN(parseInt(String(it.cartoon)))) {
            const cVal = parseInt(String(it.cartoon));
            if (cVal > 0) {
              hasCartoon = true;
              totalCartoonSum += cVal;
            }
          }
        });

        if (previewChallan.total_cartoon && Number(previewChallan.total_cartoon) > 0) {
          hasCartoon = true;
          if (totalCartoonSum === 0) totalCartoonSum = Number(previewChallan.total_cartoon);
        }
        if ((previewChallan as any).total_kg && Number((previewChallan as any).total_kg) > 0) {
          hasKg = true;
          if (totalKgSum === 0) totalKgSum = Number((previewChallan as any).total_kg);
        }

        const termsList = (companySettings.terms_conditions && companySettings.terms_conditions.trim())
          ? companySettings.terms_conditions.split("\n").map((t: string) => t.trim()).filter(Boolean)
          : [
              "1. The Goods are dispatched on your account and at your risk and responsibility.",
              "2. Any complaint regarding goods should be reported in writing within 24 hours of the receipt of the goods.",
              "3. Goods sold will not taken back.",
              "4. Payment will be accepted only by A/c payee's draft/cheque",
              "5. Interest at 2.0% per month charged on account not paid within due course.",
              "6. Subject to SURAT Jurisdiction. E. & O.E.",
              "7. No Dyeing guarantee."
            ];

        const companyAddressDisplay = [
          companySettings.address,
          companySettings.city_state,
          companySettings.pincode ? `PIN: ${companySettings.pincode}` : ""
        ]
          .filter(Boolean)
          .join(", ")
          .toUpperCase() || "PLOT NO. 500, 501, XYZ TEXTILE PARK, V-4, PARYA GAM, OLPAD, SURAT, GUJARAT";

        const billTotalAmount = Number(previewChallan.total_amount || 0);

        return (
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewChallan(null);
            }}
          >
            <style>{`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 8mm;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                  width: 100% !important;
                }
                body * {
                  visibility: hidden !important;
                }
                #printable-bill-slip, #printable-bill-slip * {
                  visibility: visible !important;
                }
                #printable-bill-slip {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  border: none !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: white !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>

            {/* FLOATING ACTION BUTTONS */}
            <div className="fixed top-4 right-4 flex items-center gap-2 z-50 no-print">
              <button
                type="button"
                onClick={() => previewChallan && handleShareWhatsApp(previewChallan)}
                className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full shadow-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs"
                title="WhatsApp પર શેર કરો"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Share</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs"
                title={t("Print") + " / PDF"}
              >
                <Printer className="w-4 h-4" />
                <span>{t("Print")} / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewChallan(null)}
                className="p-2 bg-slate-800/90 hover:bg-slate-900 text-white rounded-full shadow-xl transition-all cursor-pointer active:scale-95"
                title={t("Close")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center max-w-[820px] w-full my-auto space-y-3">
              {/* THE WHITE A4 INVOICE SHEET (MATCHING EXACT BLUEPRINT) */}
              <div
                id="printable-bill-slip"
                className="w-full bg-white p-4 sm:p-8 rounded-sm shadow-2xl text-black font-sans select-text text-left"
              >
                {/* INNER BORDERED TAX INVOICE BOX */}
                <div className="w-full border border-black bg-white">
                  {/* 1. TOP HEADER GREY BOX (DYNAMIC COMPANY NAME) */}
                  <div className="bg-[#d9d9d9] border-b border-black py-2 text-center">
                    <h1 className="font-extrabold text-xl sm:text-2xl tracking-wider text-black uppercase">
                      {companySettings.brand_name || companySettings.company_name || "SHIV CREATION"}
                    </h1>
                  </div>

                  {/* 2. INV NO & DATE ROW (ON BOTH CORNERS) */}
                  <div className="px-4 py-2 border-b border-black flex justify-between items-center text-xs font-bold text-black bg-white">
                    <div className="flex items-center gap-1.5">
                      <span>INV NO. :</span>
                      <span className="font-mono font-black text-sm">{previewChallan.challan_no}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Date :</span>
                      <span className="font-mono font-bold text-sm">{previewChallan.date}</span>
                    </div>
                  </div>

                  {/* 3. TAX INVOICE & CH. NO BAR */}
                  <div className="px-4 py-1.5 border-b border-black flex justify-between items-center text-xs font-bold text-black bg-white">
                    <div className="w-1/4"></div>
                    <div className="text-center flex-1">
                      <span className="font-extrabold text-sm tracking-wide uppercase">Tax Invoice</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 w-auto text-right">
                      <span>Ch. No :</span>
                      <span className="font-mono font-semibold">
                        {previewChallan.due_date
                          ? `${previewChallan.due_date} (${previewChallan.credit_days || 0}d)`
                          : (previewChallan.credit_days ? `${calculateDueDate(previewChallan.date, previewChallan.credit_days)} (${previewChallan.credit_days}d)` : "-")}
                      </span>
                    </div>
                  </div>

                  {/* 4. TWO EQUAL BOXES (LEFT: MY COMPANY DETAILS, RIGHT: PARTY / CUSTOMER DETAILS) */}
                  <div className="border-b border-black grid grid-cols-2 text-black">
                    {/* Left Box: My Company Details */}
                    <div className="p-3 border-r border-black flex flex-col justify-between min-h-[110px]">
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="font-bold">M/s. : </span>
                          <span className="font-extrabold uppercase text-black">
                            {companySettings.company_name || companySettings.brand_name || "SHIV CREATION"}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-neutral-800 leading-snug">
                          {companyAddressDisplay}
                        </p>
                        <p className="text-[11px] font-bold text-black">
                          Mo : {companySettings.phone || companySettings.alt_phone || "9099226483"}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-dashed border-neutral-300">
                        <span>GST No.{companySettings.gstin ? ` : ${companySettings.gstin}` : ""}</span>
                        <span>State Code : 24</span>
                      </div>
                    </div>

                    {/* Right Box: Client / Party Details */}
                    <div className="p-3 flex flex-col justify-between min-h-[110px]">
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="font-bold">M/s. : </span>
                          <span className="font-extrabold uppercase text-black">
                            {previewChallan.party_name}
                          </span>
                        </div>
                        {previewChallan.notes && (
                          <p className="text-[11px] text-neutral-700 leading-snug italic">
                            {previewChallan.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-dashed border-neutral-300">
                        <span>GST No.{(() => {
                          const m = previewChallan.notes?.match(/GST[:\s]+([0-9A-Z]{15})/i);
                          return m ? ` : ${m[1]}` : "";
                        })()}</span>
                        <span>State Code : 24</span>
                      </div>
                    </div>
                  </div>

                  {/* 5. TABLE SECTION */}
                  <div className="w-full">
                    <table className="w-full text-left text-xs border-collapse text-black">
                      <thead>
                        <tr className="border-b border-black text-xs font-bold text-black bg-white">
                          <th className="py-1.5 px-2 text-center w-[35px] border-r border-black">No</th>
                          <th className="py-1.5 px-3 border-r border-black">{getFieldLabel(companySettings, "item_name", "DESCRIPTION")}</th>
                          <th className="py-1.5 px-2 text-center w-[75px] border-r border-black">{getFieldLabel(companySettings, "hsn_code", "HSN Code")}</th>
                          <th className="py-1.5 px-2 text-center w-[60px] border-r border-black">{getFieldLabel(companySettings, "quantity", "Qty")}</th>
                          <th className="py-1.5 px-2 text-right w-[85px] border-r border-black">{getFieldLabel(companySettings, "weight", "Weight")}</th>
                          <th className="py-1.5 px-2 text-right w-[75px] border-r border-black">{getFieldLabel(companySettings, "kg", "KG")}</th>
                          {hasCartoon && (
                            <th className="py-1.5 px-2 text-center w-[60px] border-r border-black">{getFieldLabel(companySettings, "cartoon", "Cartoon")}</th>
                          )}
                          <th className="py-1.5 px-2 text-right w-[75px] border-r border-black">{getFieldLabel(companySettings, "rate", "Rate")}</th>
                          <th className="py-1.5 px-3 text-right w-[110px]">{getFieldLabel(companySettings, "total_amount", "Amount")}</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-medium text-black">
                        {validItems.length > 0 ? (
                          validItems.map((it: any, idx: number) => {
                            const desc = it.description || it.category || (it.design_no ? `Design #${it.design_no}` : "-");
                            const hsn = it.hsn_code || (companySettings.hsn_sac_code ? companySettings.hsn_sac_code.split(" ")[0] : "998822");
                            const qty = it.quantity || it.meters || it.item || it.takka || "-";
                            const amt = it.amount ? parseFloat(String(it.amount)) : 0;
                            let rateDisplay = "-";
                            if (it.rate) {
                              rateDisplay = parseFloat(String(it.rate)).toFixed(2);
                            } else if (amt > 0) {
                              const wNum = it.weight ? parseFloat(String(it.weight)) : 0;
                              const matchNum = String(qty || "").match(/^([\d.]+)/);
                              const qNum = matchNum ? parseFloat(matchNum[1]) : 0;
                              if (wNum > 0) {
                                rateDisplay = (amt / wNum).toFixed(2);
                              } else if (qNum > 0) {
                                rateDisplay = (amt / qNum).toFixed(2);
                              }
                            }

                            return (
                              <tr key={idx} className="h-6">
                                <td className="py-1 px-2 text-center border-r border-black">
                                  {idx + 1}
                                </td>
                                <td className="py-1 px-3 border-r border-black">
                                  {desc}
                                </td>
                                <td className="py-1 px-2 text-center font-mono border-r border-black">
                                  {hsn}
                                </td>
                                <td className="py-1 px-2 text-center font-mono border-r border-black">
                                  {qty}
                                </td>
                                <td className="py-1 px-2 text-right font-mono border-r border-black">
                                  {it.weight ? Number(it.weight).toFixed(2) : "-"}
                                </td>
                                <td className="py-1 px-2 text-right font-mono border-r border-black">
                                  {it.kg ? Number(it.kg).toFixed(2) : "-"}
                                </td>
                                {hasCartoon && (
                                  <td className="py-1 px-2 text-center font-mono border-r border-black">
                                    {it.cartoon || "-"}
                                  </td>
                                )}
                                <td className="py-1 px-2 text-right font-mono border-r border-black">
                                  {rateDisplay}
                                </td>
                                <td className="py-1 px-3 text-right font-mono font-bold">
                                  {amt > 0 ? amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr className="h-6">
                            <td className="py-1 px-2 text-center border-r border-black">1</td>
                            <td className="py-1 px-3 border-r border-black">
                              {previewChallan.notes || "Textile Dispatches"}
                            </td>
                            <td className="py-1 px-2 text-center font-mono border-r border-black">
                              {companySettings.hsn_sac_code ? companySettings.hsn_sac_code.split(" ")[0] : "998822"}
                            </td>
                            <td className="py-1 px-2 text-center font-mono border-r border-black">
                              {previewChallan.total_quantity || previewChallan.total_meters || previewChallan.total_item || "-"}
                            </td>
                            <td className="py-1 px-2 text-right font-mono border-r border-black">
                              {previewChallan.total_weight ? Number(previewChallan.total_weight).toFixed(2) : "-"}
                            </td>
                            <td className="py-1 px-2 text-right font-mono border-r border-black">
                              {(previewChallan as any).total_kg ? Number((previewChallan as any).total_kg).toFixed(2) : "-"}
                            </td>
                            {hasCartoon && (
                              <td className="py-1 px-2 text-center font-mono border-r border-black">
                                {previewChallan.total_cartoon || "-"}
                              </td>
                            )}
                            <td className="py-1 px-2 text-right font-mono border-r border-black">-</td>
                            <td className="py-1 px-3 text-right font-mono font-bold">
                              {billTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}

                        {/* Spacer with tall vertical column lines extending down, matching Image 1 */}
                        <tr className="h-64 sm:h-72">
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          {hasCartoon && <td className="border-r border-black"></td>}
                          <td className="border-r border-black"></td>
                          <td></td>
                        </tr>
                      </tbody>

                      {/* Total Row (Grey Background) */}
                      <tfoot>
                        <tr className="bg-[#d9d9d9] border-t border-b border-black font-bold text-xs">
                          <td className="py-1.5 px-2 border-r border-black"></td>
                          <td className="py-1.5 px-3 border-r border-black"></td>
                          <td className="py-1.5 px-2 border-r border-black"></td>
                          <td className="py-1.5 px-2 text-center font-mono border-r border-black">
                            {hasNumericQty ? (qtyUnit ? `${totalQtySum} ${qtyUnit}` : totalQtySum) : (previewChallan.total_quantity || previewChallan.total_meters || "")}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono border-r border-black">
                            {hasNumericWeight ? totalWeightSum.toFixed(2) : (previewChallan.total_weight ? Number(previewChallan.total_weight).toFixed(2) : "")}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono border-r border-black">
                            {hasKg ? totalKgSum.toFixed(2) : ((previewChallan as any).total_kg ? Number((previewChallan as any).total_kg).toFixed(2) : "")}
                          </td>
                          {hasCartoon && (
                            <td className="py-1.5 px-2 text-center font-mono border-r border-black">
                              {totalCartoonSum}
                            </td>
                          )}
                          <td className="py-1.5 px-2 border-r border-black"></td>
                          <td className="py-1.5 px-3 text-right font-mono font-black">
                            {billTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* 6. BANK DETAILS & GST / SUBTOTAL GRID (60% / 40% SPLIT) */}
                  <div className="grid grid-cols-[1.4fr_1fr] border-b border-black text-black">
                    {/* Left: Bank Details */}
                    <div className="p-2.5 text-xs font-bold space-y-1 border-r border-black">
                      <div className="underline font-black pb-0.5">Bank Details:</div>
                      <div>Bank Name : <span className="font-medium">{companySettings.bank_name || ""}</span></div>
                      <div>Bank A/c : <span className="font-mono font-medium">{companySettings.account_no || ""}</span></div>
                      <div>Bank Ifsc : <span className="font-mono font-medium">{companySettings.ifsc || ""}</span></div>
                    </div>

                    {/* Right: GST & Subtotal */}
                    <div className="divide-y divide-black text-xs font-bold flex flex-col justify-center">
                      <div className="flex justify-between items-center px-3 py-2">
                        <span>GST</span>
                        <span className="font-mono">
                          {companySettings.gst_rate ? companySettings.gst_rate.split(" ")[0] : "5%"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center px-3 py-2">
                        <span>Subtotal</span>
                        <span className="font-mono text-sm">
                          {billTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 7. TOTAL AMOUNT ROW (SPLIT: BLANK GREY ON LEFT, TOTAL AMOUNT ON RIGHT) */}
                  <div className="grid grid-cols-[1.4fr_1fr] border-b border-black bg-[#d9d9d9] text-black">
                    <div className="border-r border-black p-2 min-h-[30px]"></div>
                    <div className="p-2 px-3 flex justify-between items-center text-xs font-black">
                      <span>Total Amount :</span>
                      <span className="font-mono text-sm">
                        {billTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* 8. TERMS & CONDITIONS AND AUTHORISED SIGNATORY (60% / 40% SPLIT) */}
                  <div className="grid grid-cols-[1.4fr_1fr] text-black">
                    {/* Left Column: Terms and Conditions */}
                    <div className="p-3 text-[10px] space-y-1 font-normal text-black leading-tight border-r border-black">
                      <div className="font-bold text-xs pb-0.5">Terms and Conditions :</div>
                      {termsList.map((term, i) => (
                        <p key={i}>{term}</p>
                      ))}
                    </div>

                    {/* Right Column: Signatory */}
                    <div className="p-3 flex flex-col justify-between items-end min-h-[140px] text-right">
                      <div className="font-bold text-xs text-black uppercase">
                        FOR {companySettings.brand_name || companySettings.company_name || "TEXAFLOW"}
                      </div>
                      <div className="font-bold text-[10px] text-black uppercase tracking-wider">
                        AUTHORISED SIGNATORY
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
