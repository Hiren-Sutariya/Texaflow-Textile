import { getStoredCompanyId } from "./tenantStorage";
import { API_BASE_URL } from "./api";

export interface CompanySettings {
  company_name: string;
  brand_name: string;
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
  invoice_title?: string;
  challan_title?: string;
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
      invoice_title: "TAX INVOICE / JOBWORK BILL",
      challan_title: "DELIVERY CHALLAN / TAKKA DISPATCH SLIP",
      invoice_prefix: "SC/26-27/",
      next_invoice_no: "101",
      challan_prefix: "DC/26-27/",
      next_challan_no: "101",
      hsn_sac_code: "998822 (Textile Jobwork)",
      gst_rate: "5% (Textile Embroidery Jobwork)",
      payment_terms: "Due on Receipt",
      signatory_label: `For ${fName} (Authorized Signatory)`,
      eway_threshold: "50000",
      print_qr: true,
      terms_conditions:
        "1. The Goods are dispatched on your account and at your risk and responsibility.\n2. Any complaint regarding goods should be reported in writing within 24 hours of the receipt of the goods.\n3. Goods sold will not taken back.\n4. Payment will be accepted only by A/c payee's draft/cheque.\n5. Interest at 2.0% per month charged on account not paid within due course.\n6. Subject to SURAT Jurisdiction. E. & O.E.\n7. No Dyeing guarantee."
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
    invoice_title: "TAX INVOICE / JOBWORK BILL",
    challan_title: "DELIVERY CHALLAN / TAKKA DISPATCH SLIP",
    invoice_prefix: "OS/26-27/",
    next_invoice_no: "101",
    challan_prefix: "DC/26-27/",
    next_challan_no: "101",
    hsn_sac_code: "998822 (Textile Jobwork)",
    gst_rate: "5% (Textile Embroidery Jobwork)",
    payment_terms: "Due on Receipt",
    signatory_label: `For ${fName} (Authorized Signatory)`,
    eway_threshold: "50000",
    print_qr: true,
    terms_conditions:
      "1. The Goods are dispatched on your account and at your risk and responsibility.\n2. Any complaint regarding goods should be reported in writing within 24 hours of the receipt of the goods.\n3. Goods sold will not taken back.\n4. Payment will be accepted only by A/c payee's draft/cheque.\n5. Interest at 2.0% per month charged on account not paid within due course.\n6. Subject to SURAT Jurisdiction. E. & O.E.\n7. No Dyeing guarantee."
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
        return { ...defaults, ...parsed };
      }
    }
  } catch {}

  return getDefaultCompanySettings(cid);
}

export async function fetchLiveCompanySettings(cid?: string): Promise<CompanySettings | null> {
  const targetCid = cid || getStoredCompanyId() || "comp-002";
  try {
    const res = await fetch(`${API_BASE_URL}/auth/company-settings?company_id=${targetCid}`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.company_name || data.brand_name)) {
        const defaults = getDefaultCompanySettings(targetCid);
        const merged = { ...defaults, ...data };
        if (typeof window !== "undefined") {
          localStorage.setItem(`app_settings_${targetCid}`, JSON.stringify(merged));
        }
        return merged;
      }
    }
  } catch {}
  return null;
}
