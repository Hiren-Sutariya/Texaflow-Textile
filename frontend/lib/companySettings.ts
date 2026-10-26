import { getStoredCompanyId } from "./tenantStorage";
import { API_BASE_URL } from "./api";

export interface CustomFieldLabels {
  // 1. Unified Common Fields (Used everywhere: Sales, Invoices, Purchases, Ledger)
  party_name?: string;       // Customer / Party
  supplier_name?: string;    // Supplier / Mill
  item_name?: string;        // Design / Particulars
  item_unit?: string;        // Item / Takka
  quantity?: string;         // Quantity / Meters
  weight?: string;           // Weight
  kg?: string;               // KG
  cartoon?: string;          // Cartoon / Roll / Pcs
  rate?: string;             // Rate (₹)
  total_amount?: string;     // Amount (₹)
  challan_no?: string;       // Challan No
  bill_no?: string;          // Bill / Invoice No
  hsn_code?: string;         // HSN / SAC Code

  // 2. Backward compatibility mappings
  sales_party?: string;
  sales_item?: string;
  sales_qty?: string;
  sales_rate?: string;
  sales_bill_no?: string;
  sales_total?: string;
  purchase_supplier?: string;
  purchase_item?: string;
  purchase_qty?: string;
  purchase_rate?: string;
  purchase_bill_no?: string;
  purchase_total?: string;
  design_no?: string;
}

export function getFieldLabel(
  settings: CompanySettings | null | undefined,
  field: keyof CustomFieldLabels | string,
  fallback: string
): string {
  const custom = settings?.custom_labels;
  if (!custom) return fallback;

  // Rate: single unified setting changes rate everywhere
  if (field === "rate" || field === "sales_rate" || field === "purchase_rate") {
    return custom.rate?.trim() || custom.sales_rate?.trim() || custom.purchase_rate?.trim() || fallback;
  }

  // Amount: single unified setting changes amount everywhere
  if (field === "total_amount" || field === "sales_total" || field === "purchase_total") {
    return custom.total_amount?.trim() || custom.sales_total?.trim() || custom.purchase_total?.trim() || fallback;
  }

  // Quantity: single unified setting changes quantity everywhere
  if (field === "quantity" || field === "sales_qty" || field === "purchase_qty") {
    return custom.quantity?.trim() || custom.sales_qty?.trim() || custom.purchase_qty?.trim() || fallback;
  }

  // Weight
  if (field === "weight") {
    return custom.weight?.trim() || fallback;
  }

  // KG
  if (field === "kg") {
    return custom.kg?.trim() || fallback;
  }

  // Cartoon
  if (field === "cartoon") {
    return custom.cartoon?.trim() || fallback;
  }

  // Item / Takka
  if (field === "item" || field === "takka" || field === "item_unit") {
    return custom.item_unit?.trim() || fallback;
  }

  // Design / Particulars / Item Name
  if (field === "design_no" || field === "item_name" || field === "sales_item" || field === "purchase_item") {
    return custom.item_name?.trim() || custom.design_no?.trim() || custom.sales_item?.trim() || custom.purchase_item?.trim() || fallback;
  }

  // Party / Customer
  if (field === "party_name" || field === "sales_party") {
    return custom.party_name?.trim() || custom.sales_party?.trim() || fallback;
  }

  // Supplier / Mill
  if (field === "supplier_name" || field === "purchase_supplier") {
    return custom.supplier_name?.trim() || custom.purchase_supplier?.trim() || fallback;
  }

  // Challan No
  if (field === "challan_no" || field === "purchase_bill_no") {
    return custom.challan_no?.trim() || custom.purchase_bill_no?.trim() || fallback;
  }

  // Bill / Invoice No
  if (field === "bill_no" || field === "sales_bill_no") {
    return custom.bill_no?.trim() || custom.sales_bill_no?.trim() || fallback;
  }

  // HSN Code
  if (field === "hsn_code") {
    return custom.hsn_code?.trim() || fallback;
  }

  // Direct lookup
  const direct = (custom as any)[field]?.trim();
  if (direct) return direct;

  return fallback;
}

export interface CompanySettings {
  company_name: string;
  brand_name: string;
  owner_name?: string;
  tagline?: string;
  phone: string;
  alt_phone?: string;
  email?: string;
  address: string;
  city_state: string;
  pincode: string;
  msme_no?: string;
  website?: string;
  gstin: string;
  pan?: string;
  bank_name: string;
  account_holder?: string;
  account_no: string;
  account_type?: string;
  ifsc: string;
  branch_name?: string;
  upi_id?: string;
  qr_code_image?: string;
  sales_invoice_title?: string;
  invoice_title?: string;
  challan_title?: string;
  sales_invoice_prefix?: string;
  next_sales_invoice_no?: string;
  invoice_prefix?: string;
  next_invoice_no?: string;
  challan_prefix?: string;
  next_challan_no?: string;
  hsn_sac_code?: string;
  gst_rate?: string;
  payment_terms?: string;
  signatory_label?: string;
  eway_threshold?: string;
  print_qr?: boolean;
  terms_conditions?: string;
  bill_format?: string;
  custom_labels?: CustomFieldLabels;
}

export function getDefaultCompanySettings(cid: string, firmName?: string): CompanySettings {
  if (cid === "comp-001") {
    const fName = firmName || "Shiv Creation";
    return {
      company_name: fName,
      brand_name: "SHIV CREATION",
      tagline: "High Precision Multi-Head Embroidery Job Work",
      phone: "9978987181",
      alt_phone: "",
      email: "owner@shivcreation.com",
      address: "Plot No. 104-106, GIDC Khatodara Industrial Estate",
      city_state: "Surat, Gujarat",
      pincode: "395002",
      msme_no: "UDYAM-GJ-24-0091823",
      website: "",
      gstin: "24AAACS1234A1Z5",
      pan: "",
      bank_name: "State Bank of India",
      account_holder: fName,
      account_no: "50200012345678",
      account_type: "Current Account",
      ifsc: "SBIN0001234",
      branch_name: "Ring Road Branch, Surat",
      upi_id: "shivcreation@sbi",
      qr_code_image: "",
      sales_invoice_title: "TAX INVOICE / JOBWORK BILL",
      invoice_title: "TAX INVOICE / JOBWORK BILL",
      challan_title: "DELIVERY CHALLAN / TAKKA DISPATCH SLIP",
      sales_invoice_prefix: "SC/26/",
      next_sales_invoice_no: "101",
      invoice_prefix: "INV/26-27/",
      next_invoice_no: "101",
      challan_prefix: "DC/26-27/",
      next_challan_no: "101",
      hsn_sac_code: "998822 (Textile Jobwork)",
      gst_rate: "0% (Exempted)",
      payment_terms: "Due on Receipt",
      signatory_label: `For ${fName} (Authorized Signatory)`,
      eway_threshold: "50000",
      print_qr: true,
      terms_conditions:
        "1. The Goods are dispatched on your account and at your risk and responsibility.\n2. Any complaint regarding goods should be reported in writing within 24 hours of the receipt of the goods.\n3. Goods sold will not taken back.\n4. Payment will be accepted only by A/c payee's draft/cheque.\n5. Interest at 2.0% per month charged on account not paid within due course.\n6. Subject to SURAT Jurisdiction. E. & O.E.\n7. No Dyeing guarantee.",
      custom_labels: {
        party_name: "Party Name",
        supplier_name: "Supplier / Mill",
        item_name: "Particulars",
        item_unit: "Item",
        quantity: "Qty",
        weight: "Weight",
        cartoon: "Cartoon",
        rate: "Rate (₹)",
        total_amount: "Amount (₹)",
        challan_no: "Challan No",
        bill_no: "Bill / Invoice No",
        hsn_code: "HSN Code",
        design_no: "Particulars",
        sales_party: "Party Name",
        purchase_supplier: "Supplier / Mill",
        sales_item: "Particulars",
        purchase_item: "Particulars",
        sales_qty: "Qty",
        purchase_qty: "Qty",
        sales_rate: "Rate (₹)",
        purchase_rate: "Rate (₹)",
        sales_total: "Amount (₹)",
        purchase_total: "Amount (₹)",
        sales_bill_no: "Bill / Invoice No",
        purchase_bill_no: "Challan No"
      }
    };
  }

  const fName = firmName || (cid === "comp-002" ? "Om Sai Enterprise" : "Om Sai Enterprise");
  return {
    company_name: fName,
    brand_name: (cid === "comp-002" ? "OM SAI ENTERPRISE" : fName.toUpperCase()),
    tagline: "High Precision Multi-Head Embroidery Job Work",
    phone: "9978987181",
    alt_phone: "",
    email: "owner@om-sai.com",
    address: "Plot No. 104-106, GIDC Khatodara / Kadodara",
    city_state: "Surat, Gujarat",
    pincode: "395002",
    msme_no: "UDYAM-GJ-24-0091823",
    website: "",
    gstin: "24AAACS1234A1Z5",
    pan: "",
    bank_name: "State Bank of India",
    account_holder: fName,
    account_no: "50200012345678",
    account_type: "Current Account",
    ifsc: "SBIN0001234",
    branch_name: "Ring Road Branch, Surat",
    upi_id: "omsai@sbi",
    qr_code_image: "",
    sales_invoice_title: "TAX INVOICE / JOBWORK BILL",
    invoice_title: "TAX INVOICE / JOBWORK BILL",
    challan_title: "DELIVERY CHALLAN / TAKKA DISPATCH SLIP",
    sales_invoice_prefix: "OS/26-27/",
    next_sales_invoice_no: "101",
    invoice_prefix: "INV/26-27/",
    next_invoice_no: "101",
    challan_prefix: "DC/26-27/",
    next_challan_no: "101",
    hsn_sac_code: "998822 (Textile Jobwork)",
    gst_rate: "0% (Exempted)",
    payment_terms: "Due on Receipt",
    signatory_label: `For ${fName} (Authorized Signatory)`,
    eway_threshold: "50000",
    print_qr: true,
    terms_conditions:
      "1. The Goods are dispatched on your account and at your risk and responsibility.\n2. Any complaint regarding goods should be reported in writing within 24 hours of the receipt of the goods.\n3. Goods sold will not taken back.\n4. Payment will be accepted only by A/c payee's draft/cheque.\n5. Interest at 2.0% per month charged on account not paid within due course.\n6. Subject to SURAT Jurisdiction. E. & O.E.\n7. No Dyeing guarantee.",
    custom_labels: {
      party_name: "Party Name",
      supplier_name: "Supplier / Mill",
      item_name: "Particulars",
      item_unit: "Item",
      quantity: "Qty",
      weight: "Weight",
      cartoon: "Cartoon",
      rate: "Rate (₹)",
      total_amount: "Amount (₹)",
      challan_no: "Challan No",
      bill_no: "Bill / Invoice No",
      hsn_code: "HSN Code",
      design_no: "Particulars",
      sales_party: "Party Name",
      purchase_supplier: "Supplier / Mill",
      sales_item: "Particulars",
      purchase_item: "Particulars",
      sales_qty: "Qty",
      purchase_qty: "Qty",
      sales_rate: "Rate (₹)",
      purchase_rate: "Rate (₹)",
      sales_total: "Amount (₹)",
      purchase_total: "Amount (₹)",
      sales_bill_no: "Bill / Invoice No",
      purchase_bill_no: "Challan No"
    }
  };
}

export function getStoredCompanySettings(): CompanySettings {
  const cid = getStoredCompanyId() || "comp-002";
  if (typeof window === "undefined") {
    return getDefaultCompanySettings(cid);
  }

  try {
    const raw = localStorage.getItem(`app_settings_${cid}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.company_name || parsed.brand_name)) {
        const defaults = getDefaultCompanySettings(cid);
        const sales_invoice_prefix = parsed.sales_invoice_prefix !== undefined ? parsed.sales_invoice_prefix : (parsed.invoice_prefix || defaults.sales_invoice_prefix);
        const next_sales_invoice_no = parsed.next_sales_invoice_no !== undefined ? parsed.next_sales_invoice_no : (parsed.next_invoice_no || defaults.next_sales_invoice_no);
        const sales_invoice_title = parsed.sales_invoice_title || parsed.invoice_title || defaults.sales_invoice_title;
        const custom_labels = {
          ...(defaults.custom_labels || {}),
          ...(parsed.custom_labels || {})
        };
        return {
          ...defaults,
          ...parsed,
          custom_labels,
          sales_invoice_prefix,
          next_sales_invoice_no,
          sales_invoice_title
        };
      }
    }
  } catch {}

  return getDefaultCompanySettings(cid);
}

export function saveCompanySettings(settings: CompanySettings): void {
  if (typeof window === "undefined") return;
  const cid = getStoredCompanyId() || "comp-002";
  try {
    localStorage.setItem(`app_settings_${cid}`, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("app_settings_update", { detail: { ...settings, company_id: cid } }));
  } catch {}
}

export function updateCompanySetting<K extends keyof CompanySettings>(key: K, value: CompanySettings[K]): void {
  if (typeof window === "undefined") return;
  const cid = getStoredCompanyId() || "comp-002";
  try {
    const current = getStoredCompanySettings();
    const updated = { ...current, [key]: value };
    localStorage.setItem(`app_settings_${cid}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("app_settings_update", { detail: { ...updated, company_id: cid } }));
  } catch {}
}

export async function fetchLiveCompanySettings(cid?: string): Promise<CompanySettings | null> {
  const targetCid = cid || getStoredCompanyId() || "comp-002";
  try {
    const res = await fetch(`${API_BASE_URL}/auth/company-settings?company_id=${targetCid}`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.company_name || data.brand_name)) {
        const defaults = getDefaultCompanySettings(targetCid);
        const existingLocal = getStoredCompanySettings();
        const serverCustomLabels = data.custom_labels || (data.settings_json && data.settings_json.custom_labels);
        const resolvedCustomLabels = {
          ...(defaults.custom_labels || {}),
          ...(existingLocal.custom_labels || {}),
          ...(serverCustomLabels || {})
        };
        const merged: CompanySettings = {
          ...defaults,
          ...existingLocal,
          ...data,
          custom_labels: resolvedCustomLabels
        };
        if (typeof window !== "undefined") {
          localStorage.setItem(`app_settings_${targetCid}`, JSON.stringify(merged));
        }
        return merged;
      }
    }
  } catch {}
  return null;
}
