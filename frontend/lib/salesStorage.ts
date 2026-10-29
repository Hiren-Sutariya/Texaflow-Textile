import { getTenantItem, setTenantItem, getStoredCompanyId } from "./tenantStorage";
import { API_BASE_URL } from "./api";
import { getStoredCompanySettings, updateCompanySetting } from "./companySettings";

export interface SalesLineItem {
  id: string;
  category?: string; // General category or description (e.g. "Fabric", "Embroidery", "D.No. 405")
  description: string;
  hsn_code?: string; // HSN/SAC code
  item?: number | string; // Renamed from Takka (e.g. 4)
  quantity?: number | string; // Renamed from Meters (e.g. 420.5)
  takka?: number | string; // Backward compatibility
  meters?: number | string; // Backward compatibility
  design_no?: string; // Backward compatibility
  weight?: number | string;
  kg?: number | string;
  cartoon?: number | string;
  rate?: number | string;
  amount: number;
}

export interface SalesChallan {
  id: string;
  company_id?: string;
  challan_no: string; // e.g. "101", "102"
  date: string; // DD-MM-YYYY
  party_name: string;
  transport?: string;
  vehicle_no?: string;
  items: SalesLineItem[];
  total_item?: number; // Total items / takka
  total_quantity?: number; // Total quantity / meters
  total_takka?: number;
  total_meters?: number;
  total_weight: number;
  total_cartoon: number;
  total_amount: number;
  credit_days?: number;
  due_date?: string;
  billing_status: "Unbilled" | "Billed";
  linked_invoice_no?: string;
  notes?: string;
  created_at?: string;
}

const STORAGE_KEY = "texaflow_sales";

function getHeaders() {
  const cid = getStoredCompanyId() || "comp-001";
  return {
    "Content-Type": "application/json",
    "x-company-id": cid
  };
}

export function parseChallanRecord(raw: any): SalesChallan {
  let itemsParsed: SalesLineItem[] = [];
  if (raw.items) {
    if (typeof raw.items === "string") {
      try {
        itemsParsed = JSON.parse(raw.items);
      } catch {
        itemsParsed = [];
      }
    } else if (Array.isArray(raw.items)) {
      itemsParsed = raw.items;
    }
  }

  return {
    id: raw.id,
    company_id: raw.company_id,
    challan_no: raw.challan_no,
    date: raw.date,
    party_name: raw.party_name,
    transport: raw.transport || "",
    vehicle_no: raw.vehicle_no || "",
    items: itemsParsed,
    total_item: raw.total_item || 0,
    total_quantity: raw.total_quantity || 0,
    total_takka: raw.total_item || 0,
    total_meters: raw.total_quantity || 0,
    total_weight: raw.total_weight || 0,
    total_cartoon: raw.total_cartoon || 0,
    total_amount: raw.total_amount || 0,
    credit_days: raw.credit_days || 30,
    due_date: raw.due_date,
    billing_status: raw.billing_status || "Unbilled",
    linked_invoice_no: raw.linked_invoice_no,
    notes: raw.notes || "",
    created_at: raw.created_at
  };
}

export function getStoredSalesChallans(): SalesChallan[] {
  if (typeof window === "undefined") return [];
  const cid = getStoredCompanyId() || "comp-001";
  const stored = getTenantItem<SalesChallan[]>(STORAGE_KEY);
  if (stored && Array.isArray(stored)) {
    return stored.filter((c) => !c.company_id || c.company_id === cid);
  }
  return [];
}

export async function fetchLiveSalesChallans(): Promise<SalesChallan[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/sales-challans`, {
      headers: getHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const parsed = data.map(parseChallanRecord);
        // Sync local cache
        setTenantItem(STORAGE_KEY, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not fetch sales challans from backend, fallback to local:", err);
  }
  return getStoredSalesChallans();
}

export function saveSalesChallan(challan: SalesChallan): SalesChallan[] {
  const cid = getStoredCompanyId() || "comp-001";
  const existing = getTenantItem<SalesChallan[]>(STORAGE_KEY) || [];
  
  const payload: SalesChallan = {
    ...challan,
    company_id: challan.company_id || cid,
    created_at: challan.created_at || new Date().toISOString()
  };

  const idx = existing.findIndex((c) => c.id === challan.id);
  let updated: SalesChallan[];
  if (idx >= 0) {
    updated = existing.map((c) => (c.id === challan.id ? payload : c));
  } else {
    updated = [payload, ...existing];
  }

  setTenantItem(STORAGE_KEY, updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("texaflow_sales_updated"));
  }

  // Keep settings next_challan_no in sync if saved challan is >= current next
  try {
    const settings = getStoredCompanySettings();
    const prefix = settings.challan_prefix || "";
    const chNo = (challan.challan_no || "").trim();
    let num: number | null = null;
    if (prefix && chNo.startsWith(prefix)) {
      const match = chNo.slice(prefix.length).trim().match(/^(\d+)/);
      if (match) num = parseInt(match[1], 10);
    } else {
      const match = chNo.match(/(\d+)$/);
      if (match) num = parseInt(match[1], 10);
    }
    if (num !== null && !isNaN(num)) {
      const currentNext = parseInt(settings.next_challan_no || "101", 10);
      if (num >= currentNext) {
        const rawStart = (settings.next_challan_no || "101").trim();
        const padLength = rawStart.startsWith("0") ? rawStart.length : 0;
        const nextVal = padLength > 0 ? String(num + 1).padStart(padLength, "0") : String(num + 1);
        updateCompanySetting("next_challan_no", nextVal);
      }
    }
  } catch {}

  // Fire-and-forget sync with Supabase Backend
  fetch(`${API_BASE_URL}/sales-challans`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  }).catch((e) => console.warn("Supabase background save error for challan:", e));

  return updated;
}

export function deleteSalesChallan(id: string): SalesChallan[] {
  const existing = getTenantItem<SalesChallan[]>(STORAGE_KEY) || [];
  const updated = existing.filter((c) => c.id !== id);
  setTenantItem(STORAGE_KEY, updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("texaflow_sales_updated"));
  }

  // Supabase delete sync
  fetch(`${API_BASE_URL}/sales-challans/${id}`, {
    method: "DELETE",
    headers: getHeaders()
  }).catch((e) => console.warn("Supabase background delete error for challan:", e));

  return updated;
}

export function getNextSalesChallanNo(): string {
  const settings = getStoredCompanySettings();
  const prefix = settings.challan_prefix !== undefined ? settings.challan_prefix : "DC/26-27/";
  const rawStart = (settings.next_challan_no || "101").trim();
  let configuredStart = parseInt(rawStart, 10);
  if (isNaN(configuredStart) || configuredStart < 1) configuredStart = 101;

  const challans = getStoredSalesChallans();
  let maxNum = configuredStart - 1;

  if (challans && challans.length > 0) {
    challans.forEach((c) => {
      const raw = (c.challan_no || "").trim();
      if (prefix && raw.startsWith(prefix)) {
        const remaining = raw.slice(prefix.length).trim();
        const match = remaining.match(/^(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      } else if (!prefix) {
        const match = raw.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
  }

  const nextNum = maxNum + 1;
  const padLength = rawStart.startsWith("0") ? rawStart.length : 0;
  const numStr = padLength > 0 ? String(nextNum).padStart(padLength, "0") : String(nextNum);
  return `${prefix}${numStr}`;
}

// --------------------------------------------------------------------------
// SALES INVOICE (વેચાણ પાકું બિલ / GST Tax Invoice)
// --------------------------------------------------------------------------
export interface SalesInvoice {
  id: string;
  company_id?: string;
  invoice_no: string; // e.g. "INV-0001" or "INV-2026-001"
  date: string; // DD-MM-YYYY
  customer_name: string; // Party Name (Customer)
  customer_gstin?: string;
  customer_address?: string;
  category?: string;
  items_description?: string;
  is_direct?: boolean;
  linked_challan_ids?: string[];
  linked_challan_nos?: string[];
  items?: any[];
  total_item?: number;
  total_quantity?: number;
  total_takka?: number;
  total_meters?: number;
  total_weight?: number;
  total_cartoon?: number;
  subtotal: number;
  taxable_amount: number;
  gst_rate?: number; // 5% default for textiles
  tax_mode?: "cgst_sgst" | "igst" | "none";
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total_amount: number;
  discount_rate?: number;
  discount_amount?: number;
  round_off?: number;
  place_of_supply?: string;
  payment_terms?: string;
  credit_days?: number;
  due_date?: string;
  payment_status: "Paid" | "Pending" | "Unpaid";
  paid_via?: string;
  notes?: string;
  created_at?: string;
}

const INVOICE_STORAGE_KEY = "texaflow_sales_invoices";

export function parseInvoiceRecord(raw: any): SalesInvoice {
  let itemsParsed: any[] = [];
  if (raw.items) {
    if (typeof raw.items === "string") {
      try {
        itemsParsed = JSON.parse(raw.items);
      } catch {
        itemsParsed = [];
      }
    } else if (Array.isArray(raw.items)) {
      itemsParsed = raw.items;
    }
  }

  let chIds: string[] = [];
  if (raw.linked_challan_ids) {
    if (typeof raw.linked_challan_ids === "string") {
      try {
        chIds = JSON.parse(raw.linked_challan_ids);
      } catch {
        chIds = [];
      }
    } else if (Array.isArray(raw.linked_challan_ids)) {
      chIds = raw.linked_challan_ids;
    }
  }

  let chNos: string[] = [];
  if (raw.linked_challan_nos) {
    if (typeof raw.linked_challan_nos === "string") {
      try {
        chNos = JSON.parse(raw.linked_challan_nos);
      } catch {
        chNos = [];
      }
    } else if (Array.isArray(raw.linked_challan_nos)) {
      chNos = raw.linked_challan_nos;
    }
  }

  return {
    id: raw.id,
    company_id: raw.company_id,
    invoice_no: raw.invoice_no,
    date: raw.date,
    customer_name: raw.customer_name,
    customer_gstin: raw.customer_gstin || "",
    customer_address: raw.customer_address || "",
    category: raw.category || "",
    items_description: raw.items_description || "",
    is_direct: raw.is_direct ?? true,
    linked_challan_ids: chIds,
    linked_challan_nos: chNos,
    items: itemsParsed,
    total_item: raw.total_item || 0,
    total_quantity: raw.total_quantity || 0,
    total_takka: raw.total_item || 0,
    total_meters: raw.total_quantity || 0,
    total_weight: raw.total_weight || 0,
    total_cartoon: raw.total_cartoon || 0,
    subtotal: raw.subtotal || 0,
    taxable_amount: raw.taxable_amount || 0,
    gst_rate: raw.gst_rate ?? 5,
    tax_mode: raw.tax_mode || "cgst_sgst",
    cgst_amount: raw.cgst_amount || 0,
    sgst_amount: raw.sgst_amount || 0,
    igst_amount: raw.igst_amount || 0,
    total_amount: raw.total_amount || 0,
    discount_rate: raw.discount_rate || 0,
    discount_amount: raw.discount_amount || 0,
    round_off: raw.round_off || 0,
    place_of_supply: raw.place_of_supply || "",
    payment_terms: raw.payment_terms || "",
    credit_days: raw.credit_days || 30,
    due_date: raw.due_date || "",
    payment_status: raw.payment_status || "Pending",
    paid_via: raw.paid_via || "",
    notes: raw.notes || "",
    created_at: raw.created_at
  };
}

export function getStoredSalesInvoices(): SalesInvoice[] {
  if (typeof window === "undefined") return [];
  const cid = getStoredCompanyId() || "comp-001";
  const stored = getTenantItem<SalesInvoice[]>(INVOICE_STORAGE_KEY);
  if (stored && Array.isArray(stored)) {
    return stored.filter((inv) => !inv.company_id || inv.company_id === cid);
  }
  return [];
}

export async function fetchLiveSalesInvoices(): Promise<SalesInvoice[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/sales-invoices`, {
      headers: getHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const parsed = data.map(parseInvoiceRecord);
        // Sync local cache
        setTenantItem(INVOICE_STORAGE_KEY, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not fetch sales invoices from backend, fallback to local:", err);
  }
  return getStoredSalesInvoices();
}

export function saveSalesInvoice(invoice: SalesInvoice): SalesInvoice[] {
  const cid = getStoredCompanyId() || "comp-001";
  const existing = getTenantItem<SalesInvoice[]>(INVOICE_STORAGE_KEY) || [];

  const payload: SalesInvoice = {
    ...invoice,
    company_id: invoice.company_id || cid,
    created_at: invoice.created_at || new Date().toISOString()
  };

  const idx = existing.findIndex((inv) => inv.id === invoice.id || inv.invoice_no === invoice.invoice_no);
  let updated: SalesInvoice[];
  if (idx >= 0) {
    updated = existing.map((inv) => (inv.id === invoice.id || inv.invoice_no === invoice.invoice_no ? payload : inv));
  } else {
    updated = [payload, ...existing];
  }

  setTenantItem(INVOICE_STORAGE_KEY, updated);

  // Keep settings next_sales_invoice_no or next_invoice_no in sync
  try {
    const settings = getStoredCompanySettings();
    const salesPrefix = settings.sales_invoice_prefix !== undefined ? settings.sales_invoice_prefix : (settings.invoice_prefix || "SC/26/");
    const invPrefix = settings.invoice_prefix !== undefined ? settings.invoice_prefix : "INV/26-27/";
    const invNo = (invoice.invoice_no || "").trim();

    if (salesPrefix && invNo.startsWith(salesPrefix)) {
      const match = invNo.slice(salesPrefix.length).trim().match(/^(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        const currentNext = parseInt(settings.next_sales_invoice_no || settings.next_invoice_no || "101", 10);
        if (num >= currentNext) {
          const rawStart = (settings.next_sales_invoice_no || settings.next_invoice_no || "101").trim();
          const padLength = rawStart.startsWith("0") ? rawStart.length : 0;
          const nextVal = padLength > 0 ? String(num + 1).padStart(padLength, "0") : String(num + 1);
          updateCompanySetting("next_sales_invoice_no", nextVal);
        }
      }
    } else if (invPrefix && invNo.startsWith(invPrefix)) {
      const match = invNo.slice(invPrefix.length).trim().match(/^(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        const currentNext = parseInt(settings.next_invoice_no || "101", 10);
        if (num >= currentNext) {
          const rawStart = (settings.next_invoice_no || "101").trim();
          const padLength = rawStart.startsWith("0") ? rawStart.length : 0;
          const nextVal = padLength > 0 ? String(num + 1).padStart(padLength, "0") : String(num + 1);
          updateCompanySetting("next_invoice_no", nextVal);
        }
      }
    } else {
      const match = invNo.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        const currentNext = parseInt(settings.next_sales_invoice_no || settings.next_invoice_no || "101", 10);
        if (num >= currentNext) {
          updateCompanySetting("next_sales_invoice_no", String(num + 1));
          updateCompanySetting("next_invoice_no", String(num + 1));
        }
      }
    }
  } catch {}

  // If this invoice links to challans, update those challans to "Billed"
  if (Array.isArray(invoice.linked_challan_ids) && invoice.linked_challan_ids.length > 0) {
    const challans = getStoredSalesChallans();
    const updatedChallans = challans.map((ch) => {
      if (invoice.linked_challan_ids?.includes(ch.id) || invoice.linked_challan_nos?.includes(ch.challan_no)) {
        return {
          ...ch,
          billing_status: "Billed" as const,
          linked_invoice_no: invoice.invoice_no
        };
      }
      return ch;
    });
    setTenantItem("texaflow_sales", updatedChallans);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("texaflow_sales_updated"));
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("texaflow_sales_invoices_updated"));
  }

  // Supabase backend sync
  fetch(`${API_BASE_URL}/sales-invoices`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  }).catch((e) => console.warn("Supabase background save error for invoice:", e));

  return updated;
}

export function deleteSalesInvoice(id: string): SalesInvoice[] {
  const existing = getTenantItem<SalesInvoice[]>(INVOICE_STORAGE_KEY) || [];
  const target = existing.find((inv) => inv.id === id);
  const updated = existing.filter((inv) => inv.id !== id);
  setTenantItem(INVOICE_STORAGE_KEY, updated);

  // Revert linked challans back to Unbilled
  if (target && Array.isArray(target.linked_challan_ids) && target.linked_challan_ids.length > 0) {
    const challans = getStoredSalesChallans();
    const updatedChallans = challans.map((ch) => {
      if (target.linked_challan_ids?.includes(ch.id) || target.linked_challan_nos?.includes(ch.challan_no)) {
        return {
          ...ch,
          billing_status: "Unbilled" as const,
          linked_invoice_no: undefined
        };
      }
      return ch;
    });
    setTenantItem("texaflow_sales", updatedChallans);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("texaflow_sales_updated"));
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("texaflow_sales_invoices_updated"));
  }

  // Supabase delete sync
  fetch(`${API_BASE_URL}/sales-invoices/${id}`, {
    method: "DELETE",
    headers: getHeaders()
  }).catch((e) => console.warn("Supabase background delete error for invoice:", e));

  return updated;
}

export function getNextSalesInvoiceNo(): string {
  const settings = getStoredCompanySettings();
  const prefix = settings.sales_invoice_prefix !== undefined
    ? settings.sales_invoice_prefix
    : (settings.invoice_prefix || "SC/26/");
  const rawStart = (settings.next_sales_invoice_no || settings.next_invoice_no || "101").trim();
  let configuredStart = parseInt(rawStart, 10);
  if (isNaN(configuredStart) || configuredStart < 1) configuredStart = 101;

  const invoices = getStoredSalesInvoices();
  let maxNum = configuredStart - 1;

  if (invoices && invoices.length > 0) {
    invoices.forEach((inv) => {
      const raw = (inv.invoice_no || "").trim();
      if (prefix && raw.startsWith(prefix)) {
        const remaining = raw.slice(prefix.length).trim();
        const match = remaining.match(/^(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      } else if (!prefix) {
        const match = raw.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
  }

  const nextNum = maxNum + 1;
  const padLength = rawStart.startsWith("0") ? rawStart.length : 0;
  const numStr = padLength > 0 ? String(nextNum).padStart(padLength, "0") : String(nextNum);
  return `${prefix}${numStr}`;
}

export function getNextInvoiceNo(): string {
  const settings = getStoredCompanySettings();
  const prefix = settings.invoice_prefix !== undefined ? settings.invoice_prefix : "INV/26-27/";
  const rawStart = (settings.next_invoice_no || "101").trim();
  let configuredStart = parseInt(rawStart, 10);
  if (isNaN(configuredStart) || configuredStart < 1) configuredStart = 101;

  const invoices = getStoredSalesInvoices();
  let maxNum = configuredStart - 1;

  if (invoices && invoices.length > 0) {
    invoices.forEach((inv) => {
      const raw = (inv.invoice_no || "").trim();
      if (prefix && raw.startsWith(prefix)) {
        const remaining = raw.slice(prefix.length).trim();
        const match = remaining.match(/^(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      } else if (!prefix) {
        const match = raw.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
  }

  const nextNum = maxNum + 1;
  const padLength = rawStart.startsWith("0") ? rawStart.length : 0;
  const numStr = padLength > 0 ? String(nextNum).padStart(padLength, "0") : String(nextNum);
  return `${prefix}${numStr}`;
}
