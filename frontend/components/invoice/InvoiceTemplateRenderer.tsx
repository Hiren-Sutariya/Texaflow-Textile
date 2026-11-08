"use client";

import React from "react";
import { getFieldLabel, CompanySettings } from "@/lib/companySettings";

// ============================================================================
// 1. NUMBER TO INDIAN RUPEES IN WORDS UTILITY
// ============================================================================
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num === 0) return "Zero Rupees Only";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ",
    "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ",
    "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatTens = (n: number) => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : " ");
  };

  const formatSection = (n: number) => {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + "Hundred ";
      n %= 100;
    }
    if (n > 0) {
      str += formatTens(n);
    }
    return str;
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let result = "";
  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const hundred = integerPart % 1000;

  if (crore > 0) result += formatSection(crore) + "Crore ";
  if (lakh > 0) result += formatSection(lakh) + "Lakh ";
  if (thousand > 0) result += formatSection(thousand) + "Thousand ";
  if (hundred > 0) result += formatSection(hundred);

  result = result.trim() + " Rupees";
  if (decimalPart > 0) {
    result += " and " + formatSection(decimalPart).trim() + " Paise";
  }
  return result + " Only";
}

// ============================================================================
// 2. TEMPLATE CATALOG DEFINITIONS (SaaS Professional Standard)
// ============================================================================
export interface InvoiceTemplateMeta {
  id: "standard" | "modern" | "compact" | "classic";
  name: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  paper: string;
  recommendedFor: string;
  desc: string;
  features: string[];
}

export const INVOICE_TEMPLATES: InvoiceTemplateMeta[] = [
  {
    id: "standard",
    name: "Standard Textile",
    tagline: "Our Active Textile Format",
    badge: "⭐ Our Format",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paper: "A4 Portrait",
    recommendedFor: "Fabric Wholesalers & Job Work",
    desc: "Authentic Surat textile jobwork bill with D.No, Takka, Meters, Weight, KG, Bank & 7 Market terms.",
    features: [
      "7 Standard Surat Textile Market trade terms",
      "Tall vertical ledger lines extending down",
      "Takka, Meters, Weight and KG support",
      "Direct Bank Account & UPI ID section"
    ]
  },
  {
    id: "modern",
    name: "Format 2",
    tagline: "Textile Invoice Format 2",
    badge: "Format 2",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    paper: "A4 Portrait",
    recommendedFor: "Custom Bill Format 2",
    desc: "Clean textile bill layout ready for customization.",
    features: ["Textile items table", "Bank & GST summary"]
  },
  {
    id: "compact",
    name: "Format 3",
    tagline: "Textile Invoice Format 3",
    badge: "Format 3",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    paper: "A4 Portrait",
    recommendedFor: "Custom Bill Format 3",
    desc: "Clean textile bill layout ready for customization.",
    features: ["Textile items table", "Bank & GST summary"]
  },
  {
    id: "classic",
    name: "Format 4",
    tagline: "Textile Invoice Format 4",
    badge: "Format 4",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    paper: "A4 Portrait",
    recommendedFor: "Custom Bill Format 4",
    desc: "Clean textile bill layout ready for customization.",
    features: ["Textile items table", "Bank & GST summary"]
  }
];

// ============================================================================
// 3. INVOICE RENDER DATA INTERFACE
// ============================================================================
export interface InvoiceItemRow {
  sr?: number;
  description: string;
  design_no?: string;
  hsn?: string;
  taka?: number | string;
  meters?: number | string;
  weight?: number | string;
  kg?: number | string;
  cartoon?: number | string;
  rate: number | string;
  amount: number;
}

export interface InvoiceRenderData {
  invoice_no: string;
  date: string;
  invoice_type?: string; // Tax Invoice, Delivery Challan, Jobwork Bill
  due_date?: string;
  credit_days?: number | string;
  challan_no?: string;
  challan_date?: string;
  customer_name: string;
  customer_address?: string;
  customer_phone?: string;
  customer_gstin?: string;
  customer_state?: string;
  customer_state_code?: string;
  shipped_to_name?: string;
  shipped_to_address?: string;
  transporter_name?: string;
  lr_no?: string;
  vehicle_no?: string;
  eway_bill_no?: string;
  items: InvoiceItemRow[];
  taxable_amount: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total_gst_amount?: number;
  round_off?: number;
  total_amount: number;
  notes?: string;
}

// ============================================================================
// 4. SAMPLE DATA GENERATOR FOR LIVE PREVIEWS IN SETTINGS
// ============================================================================
export function getSampleInvoiceData(settings?: CompanySettings | null): InvoiceRenderData {
  const firmName = settings?.company_name || settings?.brand_name || "SHIV CREATION";
  return {
    invoice_no: (settings?.sales_invoice_prefix || "SC/26/") + "6609",
    date: new Date().toLocaleDateString("en-IN").replace(/\//g, "-"),
    invoice_type: "TAX INVOICE",
    due_date: new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-IN").replace(/\//g, "-"),
    credit_days: 30,
    challan_no: "CH-1024",
    challan_date: new Date(Date.now() - 3 * 86400000).toLocaleDateString("en-IN").replace(/\//g, "-"),
    customer_name: "HARI OM TEXTILE / RADHE KRISHNA",
    customer_address: "Shop No. 204, Millennium Textile Market-2, Ring Road, Surat, Gujarat - 395002",
    customer_phone: "9825102938",
    customer_gstin: "24AAAFH4512A1Z8",
    customer_state: "Gujarat",
    customer_state_code: "24",
    shipped_to_name: "Hari Om Dyeing & Printing Mills",
    shipped_to_address: "Plot 88, GIDC Pandesara, Surat - 394221",
    transporter_name: "Patel Roadways / Local Auto",
    lr_no: "SUR-98432",
    vehicle_no: "GJ-05-BX-4412",
    eway_bill_no: "241892839102",
    items: [
      {
        sr: 1,
        design_no: "6074",
        description: "Reyon 14Kg Multi-Head Embroidery Fabric",
        hsn: "5402",
        taka: 12,
        meters: "480.00",
        weight: "48.50",
        kg: "48.50",
        rate: "42.50",
        amount: 20400
      },
      {
        sr: 2,
        design_no: "370",
        description: "Cotton Slub Grey Takka Work",
        hsn: "5402",
        taka: 4,
        meters: "160.00",
        weight: "18.20",
        kg: "18.20",
        rate: "65.00",
        amount: 10400
      },
      {
        sr: 3,
        design_no: "1052",
        description: "Heavy Foil Sequence Cut Work",
        hsn: "5407",
        taka: 8,
        meters: "320.00",
        weight: "34.00",
        kg: "34.00",
        rate: "88.00",
        amount: 28160
      }
    ],
    taxable_amount: 58960,
    cgst_amount: 1474,
    sgst_amount: 1474,
    igst_amount: 0,
    total_gst_amount: 2948,
    round_off: 0,
    total_amount: 61908,
    notes: "Consolidated billing for Lot No. 883. Goods dispatched in safe poly-roll packing."
  };
}

// Default 7 Textile Terms
const DEFAULT_TEXTILE_TERMS = [
  "1. The Goods are dispatched on your account and at your risk and responsibility.",
  "2. Any complaint regarding goods should be reported in writing within 24 hours of receipt.",
  "3. Goods sold will not be taken back.",
  "4. Payment will be accepted only by A/c payee's draft / cheque / RTGS / NEFT / UPI.",
  "5. Interest at 2.0% per month charged on account not paid within due course.",
  "6. Subject to SURAT Jurisdiction. E. & O.E.",
  "7. No Dyeing guarantee."
];

// ============================================================================
// 5. TEMPLATE 1: STANDARD TEXTILE GST FORMAT (A4)
// ============================================================================
function StandardTextileTemplate({
  data,
  settings,
  showLogo = true,
  showQr = true,
  showLogoBox = false
}: {
  data: InvoiceRenderData;
  settings: CompanySettings;
  showLogo?: boolean;
  showQr?: boolean;
  showLogoBox?: boolean;
}) {
  const firmName = settings.brand_name || settings.company_name || "SHIV CREATION";
  const address = settings.address
    ? `${settings.address}, ${settings.city_state || "Surat, Gujarat"}${settings.pincode ? ` - ${settings.pincode}` : ""}`
    : "Surat, Gujarat";
  const phone = settings.phone || settings.alt_phone || "9978987181";

  const totalTaka = data.items.reduce((s, it) => s + (Number(it.taka) || 0), 0);
  const totalMeters = data.items.reduce((s, it) => s + (Number(it.meters) || 0), 0);
  const totalWeight = data.items.reduce((s, it) => s + (Number(it.weight) || 0), 0);
  const totalKg = data.items.reduce((s, it) => s + (Number(it.kg) || 0), 0);

  const termsList = settings.terms_conditions
    ? settings.terms_conditions.split("\n").filter(Boolean)
    : DEFAULT_TEXTILE_TERMS;

  const qrSrc = settings.qr_code_image || (settings.upi_id ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(firmName)}&am=${data.total_amount}&cu=INR`)}` : "");

  const isChallanDoc = (data.invoice_type || "").toLowerCase().includes("challan");

  return (
    <div className="w-full bg-white text-black font-sans text-xs border border-black selection:bg-none">
      {/* 1. Header Bar */}
      {showLogoBox ? (
        <div className="border-b border-black flex items-stretch bg-[#d9d9d9] min-h-[58px] sm:min-h-[64px]">
          {/* Flush Left Corner: Logo Box */}
          <div className="w-20 sm:w-24 shrink-0 bg-white border-r border-black flex items-center justify-center p-1.5 self-stretch">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="max-h-12 max-w-full object-contain" />
            ) : (
              <div className="text-center leading-none select-none">
                <span className="font-black text-sm text-black block tracking-tight">
                  {firmName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "SC"}
                </span>
                <span className="text-[8px] font-extrabold text-neutral-500 uppercase tracking-widest block mt-0.5">LOGO</span>
              </div>
            )}
          </div>

          {/* Center: Company Name & Tagline */}
          <div className="flex-1 py-2 text-center flex flex-col justify-center pr-20 sm:pr-24">
            <h1 className="font-black text-lg sm:text-xl tracking-wider uppercase text-black leading-tight">
              {firmName}
            </h1>
            {settings.tagline && (
              <p className="text-[10px] text-neutral-700 font-bold tracking-wide mt-0.5">
                {settings.tagline}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#d9d9d9] py-2 text-center border-b border-black">
          <h1 className="font-black text-xl tracking-wider uppercase text-black">
            {firmName}
          </h1>
          {settings.tagline && (
            <p className="text-[10px] text-neutral-700 font-bold tracking-wide -mt-0.5">
              {settings.tagline}
            </p>
          )}
        </div>
      )}

      {/* 2. Top Meta: Either Invoice No or Challan No & Date (Only for Format 1, 3, 4; Format 2 has it in subheader) */}
      {!showLogoBox && (
        <div className="px-4 py-1.5 border-b border-black flex justify-between items-center text-xs font-bold text-black bg-white">
          <div>
            <span>{isChallanDoc ? "CH. NO. : " : "INV NO. : "}</span>
            <span className="font-mono text-sm font-extrabold">
              {isChallanDoc ? (data.challan_no || data.invoice_no) : (data.invoice_no || data.challan_no)}
            </span>
          </div>
          <div className="text-right">
            <span>Date : </span>
            <span className="font-mono">{data.date}</span>
          </div>
        </div>
      )}

      {/* 3. Sub-Header: Tax Invoice Bar */}
      {showLogoBox ? (
        <div className="px-4 py-1.5 border-b border-black grid grid-cols-3 items-center text-xs font-bold text-black bg-white">
          {/* Left: Either INV NO or CH NO (Only one, never both) */}
          <div className="text-left font-mono">
            <span>{isChallanDoc ? "CH. NO. : " : "INV NO. : "}</span>
            <span className="font-black text-sm">
              {isChallanDoc ? (data.challan_no || data.invoice_no) : (data.invoice_no || data.challan_no)}
            </span>
          </div>

          {/* Center: Perfectly Centered Title */}
          <div className="text-center">
            <span className="font-black text-sm tracking-widest uppercase">
              {data.invoice_type || (isChallanDoc ? "DELIVERY CHALLAN" : "TAX INVOICE")}
            </span>
          </div>

          {/* Right: Only Date (without 30d / credit days) */}
          <div className="text-right font-mono">
            <span>Date : </span>
            <span className="font-bold">{data.date}</span>
          </div>
        </div>
      ) : (
        <div className="px-4 py-1.5 border-b border-black grid grid-cols-3 items-center text-xs font-bold text-black bg-white">
          <div className="w-full"></div>
          <div className="text-center">
            <span className="font-extrabold text-sm tracking-wide uppercase">
              {data.invoice_type || (isChallanDoc ? "DELIVERY CHALLAN" : "TAX INVOICE")}
            </span>
          </div>
          <div className="text-right font-mono">
            {data.due_date ? (
              <span>Due: {data.due_date} {data.credit_days ? `(${data.credit_days}d)` : ""}</span>
            ) : null}
          </div>
        </div>
      )}

      {/* 4. Two Equal Boxes: Seller (Left) vs Buyer (Right) */}
      <div className="border-b border-black grid grid-cols-2 text-black">
        {/* Left Box: Seller */}
        <div className="p-3 border-r border-black flex flex-col justify-between min-h-[105px]">
          <div className="space-y-0.5">
            <div className="text-xs">
              <span className="font-bold">M/s. : </span>
              <span className="font-extrabold uppercase">{firmName}</span>
            </div>
            <p className="text-[11px] text-neutral-800 leading-tight">{address}</p>
            <p className="text-[11px] font-bold">Mo : {phone}</p>
          </div>
          <div className="flex justify-between items-center text-xs font-bold pt-1.5 border-t border-dashed border-neutral-300">
            <span>GST No.{settings.gstin ? ` : ${settings.gstin}` : ""}</span>
            <span>State Code : 24</span>
          </div>
        </div>

        {/* Right Box: Buyer */}
        <div className="p-3 flex flex-col justify-between min-h-[105px]">
          <div className="space-y-0.5">
            <div className="text-xs">
              <span className="font-bold">M/s. : </span>
              <span className="font-extrabold uppercase">{data.customer_name}</span>
            </div>
            {data.customer_address && (
              <p className="text-[11px] text-neutral-800 leading-tight">{data.customer_address}</p>
            )}
            {data.customer_phone && (
              <p className="text-[11px] font-bold">Mo : {data.customer_phone}</p>
            )}
          </div>
          <div className="flex justify-between items-center text-xs font-bold pt-1.5 border-t border-dashed border-neutral-300">
            <span>GST No.{data.customer_gstin ? ` : ${data.customer_gstin}` : " : -"}</span>
            <span>State Code : {data.customer_state_code || "24"}</span>
          </div>
        </div>
      </div>

      {/* 5. Item Table */}
      <div className="w-full">
        <table className="w-full text-left text-xs border-collapse text-black">
          <thead>
            <tr className="border-b border-black text-xs font-bold text-black bg-white">
              <th className="py-1 px-2 border-r border-black text-center w-8">No</th>
              <th className="py-1 px-3 border-r border-black">Particulars / Design</th>
              <th className="py-1 px-2 border-r border-black text-center w-16">HSN Code</th>
              <th className="py-1 px-2 border-r border-black text-center w-12">Taka</th>
              <th className="py-1 px-2 border-r border-black text-center w-16">Meters</th>
              <th className="py-1 px-2 border-r border-black text-right w-16">Weight</th>
              <th className="py-1 px-2 border-r border-black text-right w-14">KG</th>
              <th className="py-1 px-2 border-r border-black text-right w-16">Rate (₹)</th>
              <th className="py-1 px-3 text-right w-24">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it, idx) => (
              <tr key={idx} className="h-6">
                <td className="py-1 px-2 text-center border-r border-black">{idx + 1}</td>
                <td className="py-1 px-3 border-r border-black font-semibold">
                  {it.design_no ? <span className="font-mono font-bold mr-1.5">[{it.design_no}]</span> : null}
                  {it.description}
                </td>
                <td className="py-1 px-2 text-center font-mono border-r border-black">{it.hsn || "5402"}</td>
                <td className="py-1 px-2 text-center font-mono border-r border-black">{it.taka || "-"}</td>
                <td className="py-1 px-2 text-center font-mono border-r border-black">{it.meters || "-"}</td>
                <td className="py-1 px-2 text-right font-mono border-r border-black">{it.weight || "-"}</td>
                <td className="py-1 px-2 text-right font-mono border-r border-black">{it.kg || "-"}</td>
                <td className="py-1 px-2 text-right font-mono border-r border-black">{it.rate || "-"}</td>
                <td className="py-1 px-3 text-right font-mono font-bold">
                  {Number(it.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {/* Tall vertical lines spacer */}
            <tr className="h-44 sm:h-52">
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td></td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-[#d9d9d9] border-t border-b border-black font-bold text-xs">
              <td className="py-1.5 px-2 border-r border-black text-center">TOTAL</td>
              <td className="py-1.5 px-3 border-r border-black"></td>
              <td className="py-1.5 px-2 border-r border-black"></td>
              <td className="py-1.5 px-2 text-center font-mono border-r border-black">{totalTaka || "-"}</td>
              <td className="py-1.5 px-2 text-center font-mono border-r border-black">{totalMeters ? totalMeters.toFixed(2) : "-"}</td>
              <td className="py-1.5 px-2 text-right font-mono border-r border-black">{totalWeight ? totalWeight.toFixed(2) : "-"}</td>
              <td className="py-1.5 px-2 text-right font-mono border-r border-black">{totalKg ? totalKg.toFixed(2) : "-"}</td>
              <td className="py-1.5 px-2 border-r border-black"></td>
              <td className="py-1.5 px-3 text-right font-mono font-black">
                {data.taxable_amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 6. Bank Details (Left) vs GST & Subtotal (Right) */}
      <div className="grid grid-cols-[1.4fr_1fr] border-b border-black text-black">
        {/* Left: Bank Details & UPI QR */}
        <div className="p-2.5 text-xs font-bold space-y-1 border-r border-black flex justify-between items-start">
          <div className="space-y-1">
            <div className="underline font-black pb-0.5">Bank Details:</div>
            <div>Bank Name : <span className="font-medium">{settings.bank_name || "-"}</span></div>
            <div>Bank A/c : <span className="font-mono font-medium">{settings.account_no || "-"}</span></div>
            <div>Bank IFSC : <span className="font-mono font-medium">{settings.ifsc || "-"}</span></div>
            {settings.upi_id && <div>UPI ID : <span className="font-mono font-medium">{settings.upi_id}</span></div>}
          </div>
          {showQr && qrSrc && (
            <div className="text-center p-1 bg-white border border-slate-300 rounded shrink-0 ml-2">
              <img src={qrSrc} alt="UPI QR" className="w-16 h-16 object-contain" />
              <span className="text-[8px] font-bold block text-slate-500 uppercase mt-0.5">Scan & Pay</span>
            </div>
          )}
        </div>

        {/* Right: Tax Breakdown */}
        <div className="divide-y divide-black text-xs font-bold flex flex-col justify-center">
          <div className="flex justify-between items-center px-3 py-1.5">
            <span>Taxable Amount</span>
            <span className="font-mono">
              {data.taxable_amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {Number(data.cgst_amount || 0) > 0 && (
            <div className="flex justify-between items-center px-3 py-1 text-[11px]">
              <span>CGST (2.5%)</span>
              <span className="font-mono">+{Number(data.cgst_amount).toFixed(2)}</span>
            </div>
          )}
          {Number(data.sgst_amount || 0) > 0 && (
            <div className="flex justify-between items-center px-3 py-1 text-[11px]">
              <span>SGST (2.5%)</span>
              <span className="font-mono">+{Number(data.sgst_amount).toFixed(2)}</span>
            </div>
          )}
          {Number(data.igst_amount || 0) > 0 && (
            <div className="flex justify-between items-center px-3 py-1 text-[11px]">
              <span>IGST (5%)</span>
              <span className="font-mono">+{Number(data.igst_amount).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 7. Total Amount Row */}
      <div className="grid grid-cols-[1.4fr_1fr] border-b border-black bg-[#d9d9d9] text-black">
        <div className="border-r border-black p-2 flex items-center px-3">
          <span className="text-[10px] font-serif italic font-bold">
            {numberToIndianWords(data.total_amount)}
          </span>
        </div>
        <div className="p-2 px-3 flex justify-between items-center text-xs font-black">
          <span>Total Amount :</span>
          <span className="font-mono text-sm">
            ₹{data.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* 8. Terms & Conditions and Authorised Signatory */}
      <div className="grid grid-cols-[1.4fr_1fr] text-black">
        <div className="p-3 text-[10px] space-y-0.5 font-normal leading-tight border-r border-black">
          <div className="font-bold text-xs pb-0.5">Terms and Conditions :</div>
          {termsList.map((term, i) => (
            <p key={i}>{term}</p>
          ))}
        </div>
        <div className="p-3 flex flex-col justify-between items-end min-h-[120px] text-right">
          <div className="font-bold text-xs uppercase">
            FOR {firmName}
          </div>
          <div className="font-bold text-[10px] uppercase tracking-wider">
            AUTHORISED SIGNATORY
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. TEMPLATE 2: MODERN CORPORATE GST FORMAT (A4)
// ============================================================================
function ModernCorporateTemplate({
  data,
  settings,
  showLogo = true,
  showQr = true
}: {
  data: InvoiceRenderData;
  settings: CompanySettings;
  showLogo?: boolean;
  showQr?: boolean;
}) {
  const firmName = settings.brand_name || settings.company_name || "SHIV CREATION";
  const address = settings.address
    ? `${settings.address}, ${settings.city_state || "Surat, Gujarat"}${settings.pincode ? ` - ${settings.pincode}` : ""}`
    : "Surat, Gujarat";
  const phone = settings.phone || settings.alt_phone || "9978987181";

  const qrSrc = settings.qr_code_image || (settings.upi_id ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(firmName)}&am=${data.total_amount}&cu=INR`)}` : "");

  return (
    <div className="w-full bg-white text-slate-900 font-sans text-xs border border-slate-300 rounded-xl overflow-hidden shadow-xs">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-md">
            {firmName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <h1 className="font-black text-lg tracking-wide uppercase text-white leading-tight">
              {firmName}
            </h1>
            <p className="text-[11px] text-slate-300 font-medium">
              {settings.tagline || "Textile Manufacturing & Quality Job Work"}
            </p>
            <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
              <span>GSTIN: <strong className="text-blue-400 font-mono">{settings.gstin || "24AAAFA1234A1Z5"}</strong></span>
              <span>•</span>
              <span>State: 24 (Gujarat)</span>
            </div>
          </div>
        </div>
        <div className="text-right space-y-1">
          <span className="inline-block px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 font-extrabold text-[10px] uppercase rounded-lg tracking-wider">
            TAX INVOICE
          </span>
          <div className="font-mono text-xs text-slate-200">
            Invoice: <span className="font-black text-white">{data.invoice_no}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">Date: {data.date}</div>
        </div>
      </div>

      {/* 2. Customer Cards Grid */}
      <div className="p-4 grid grid-cols-2 gap-3 bg-slate-50/70 border-b border-slate-200 text-xs">
        {/* Billed To Card */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 shadow-2xs">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">BILLED TO (BUYER)</span>
          <p className="font-black text-slate-900 text-sm">{data.customer_name}</p>
          {data.customer_address && <p className="text-[11px] text-slate-600 leading-snug">{data.customer_address}</p>}
          <div className="pt-1 flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-700">GSTIN: <strong className="font-mono text-blue-700">{data.customer_gstin || "UNREGISTERED"}</strong></span>
            <span className="font-bold text-slate-500">State: {data.customer_state_code || "24"}</span>
          </div>
        </div>

        {/* Shipped To & Transport Card */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 shadow-2xs">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">DISPATCH & PAYMENT TERMS</span>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
            <div>
              <span className="text-slate-400 font-semibold block text-[10px]">Challan Ref:</span>
              <span className="font-mono font-bold text-slate-800">{data.challan_no || "Direct Bill"}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px]">Payment Terms:</span>
              <span className="font-bold text-slate-800">{data.credit_days ? `${data.credit_days} Days Credit` : "Due on Receipt"}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px]">Due Date:</span>
              <span className="font-mono font-bold text-rose-600">{data.due_date || data.date}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px]">Transporter:</span>
              <span className="font-bold text-slate-800 truncate block">{data.transporter_name || "Self / Transport"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Items Table */}
      <div className="p-4">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 font-black uppercase text-[10px] tracking-wider border-y border-slate-200">
              <th className="py-2.5 px-3 text-center w-10">#</th>
              <th className="py-2.5 px-3">Description & Quality</th>
              <th className="py-2.5 px-2 text-center w-16">HSN</th>
              <th className="py-2.5 px-2 text-center w-14">Taka</th>
              <th className="py-2.5 px-2 text-center w-16">Meters</th>
              <th className="py-2.5 px-2 text-right w-16">Rate (₹)</th>
              <th className="py-2.5 px-3 text-right w-24">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {data.items.map((it, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                <td className="py-2 px-3">
                  <div className="font-bold text-slate-900">
                    {it.design_no && <span className="font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] mr-1.5 font-bold">DN: {it.design_no}</span>}
                    {it.description}
                  </div>
                  {it.weight && <span className="text-[10px] text-slate-400 font-mono">Weight: {it.weight} kg</span>}
                </td>
                <td className="py-2 px-2 text-center font-mono text-slate-600">{it.hsn || "5402"}</td>
                <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">{it.taka || "-"}</td>
                <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">{it.meters || "-"}</td>
                <td className="py-2 px-2 text-right font-mono text-slate-800">₹{it.rate || "-"}</td>
                <td className="py-2 px-3 text-right font-mono font-black text-slate-950">
                  ₹{Number(it.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Bottom Grid: Bank & QR (Left) vs Summary (Right) */}
      <div className="p-4 pt-1 grid grid-cols-2 gap-4 border-t border-slate-200 items-start">
        {/* Left: Bank Details & UPI QR */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">BANK & PAYMENT ACCOUNT</span>
            <p className="font-bold text-slate-900">{settings.bank_name || "State Bank of India"}</p>
            <p className="text-[11px] font-mono text-slate-700">A/c: <strong>{settings.account_no || "0000000000"}</strong></p>
            <p className="text-[11px] font-mono text-slate-700">IFSC: <strong>{settings.ifsc || "SBIN0001234"}</strong></p>
            {settings.upi_id && <p className="text-[10px] font-mono text-blue-700 font-bold">UPI: {settings.upi_id}</p>}
          </div>
          {showQr && qrSrc && (
            <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs text-center shrink-0">
              <img src={qrSrc} alt="UPI QR" className="w-18 h-18 object-contain mx-auto" />
              <span className="text-[8px] font-black text-emerald-700 block uppercase mt-0.5">Scan to Pay</span>
            </div>
          )}
        </div>

        {/* Right: Tax Breakdown Card */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-600 font-medium">
            <span>Taxable Amount</span>
            <span className="font-mono font-bold text-slate-900">
              ₹{data.taxable_amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {Number(data.cgst_amount || 0) > 0 && (
            <div className="flex justify-between items-center text-slate-600 text-[11px]">
              <span>CGST (2.5%)</span>
              <span className="font-mono font-bold text-slate-800">
                + ₹{Number(data.cgst_amount).toFixed(2)}
              </span>
            </div>
          )}
          {Number(data.sgst_amount || 0) > 0 && (
            <div className="flex justify-between items-center text-slate-600 text-[11px]">
              <span>SGST (2.5%)</span>
              <span className="font-mono font-bold text-slate-800">
                + ₹{Number(data.sgst_amount).toFixed(2)}
              </span>
            </div>
          )}
          {Number(data.igst_amount || 0) > 0 && (
            <div className="flex justify-between items-center text-slate-600 text-[11px]">
              <span>IGST (5%)</span>
              <span className="font-mono font-bold text-slate-800">
                + ₹{Number(data.igst_amount).toFixed(2)}
              </span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-300 flex justify-between items-center font-black text-sm text-slate-950">
            <span>Grand Total</span>
            <span className="font-mono text-base text-blue-700">
              ₹{data.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 italic pt-0.5">
            {numberToIndianWords(data.total_amount)}
          </div>
        </div>
      </div>

      {/* 5. Footer Signatory & Computer Note */}
      <div className="p-4 pt-2 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
        <div className="text-[10px] space-y-0.5">
          <p className="font-bold text-slate-700">Subject to Surat Jurisdiction. Goods dispatched at buyer risk.</p>
          <p className="italic">This is a computer-generated tax invoice. No physical signature is required.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase text-slate-800">FOR {firmName}</p>
          <div className="h-9"></div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-t border-slate-300 pt-1">
            Authorised Signatory
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. TEMPLATE 3: COMPACT TAKKA DISPATCH SLIP (A5)
// ============================================================================
function CompactChallanTemplate({
  data,
  settings
}: {
  data: InvoiceRenderData;
  settings: CompanySettings;
}) {
  const firmName = settings.brand_name || settings.company_name || "SHIV CREATION";
  const phone = settings.phone || "9978987181";

  const totalTaka = data.items.reduce((s, it) => s + (Number(it.taka) || 0), 0);
  const totalMeters = data.items.reduce((s, it) => s + (Number(it.meters) || 0), 0);
  const totalWeight = data.items.reduce((s, it) => s + (Number(it.weight) || 0), 0);

  return (
    <div className="w-full bg-white text-black font-sans text-xs border-2 border-black p-3 space-y-2.5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-black pb-2">
        <div>
          <h2 className="font-black text-base uppercase tracking-wider">{firmName}</h2>
          <p className="text-[10px] text-neutral-800">{settings.address || "Ring Road, Surat, Gujarat"}</p>
          <p className="text-[10px] font-bold">Mo: {phone}</p>
        </div>
        <div className="text-right">
          <span className="px-2 py-0.5 bg-black text-white font-extrabold text-[10px] uppercase rounded">
            DISPATCH SLIP (A5)
          </span>
          <p className="font-mono font-bold text-xs mt-1">No: {data.challan_no || data.invoice_no}</p>
          <p className="font-mono text-[10px]">Date: {data.date}</p>
        </div>
      </div>

      {/* Customer & Transporter */}
      <div className="grid grid-cols-2 gap-2 text-xs border-b border-black pb-2">
        <div>
          <span className="text-[9px] font-bold uppercase text-neutral-500 block">Deliver To Party:</span>
          <p className="font-extrabold uppercase">{data.customer_name}</p>
          {data.customer_phone && <p className="text-[10px]">Mo: {data.customer_phone}</p>}
        </div>
        <div>
          <span className="text-[9px] font-bold uppercase text-neutral-500 block">Transport / LR Info:</span>
          <p className="font-bold">{data.transporter_name || "Local Tempo / Auto"}</p>
          {data.lr_no && <p className="font-mono text-[10px]">LR No: {data.lr_no}</p>}
        </div>
      </div>

      {/* Compact Item Table */}
      <table className="w-full text-left text-xs border border-black border-collapse">
        <thead>
          <tr className="bg-neutral-100 font-bold border-b border-black text-[10px] uppercase">
            <th className="p-1 text-center w-8 border-r border-black">#</th>
            <th className="p-1 px-2 border-r border-black">Item / Quality / DN</th>
            <th className="p-1 text-center w-14 border-r border-black">Takka</th>
            <th className="p-1 text-center w-16 border-r border-black">Meters</th>
            <th className="p-1 text-right w-16 border-r border-black">Weight</th>
            <th className="p-1 text-right w-20">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, idx) => (
            <tr key={idx} className="border-b border-neutral-300">
              <td className="p-1 text-center font-mono border-r border-black">{idx + 1}</td>
              <td className="p-1 px-2 border-r border-black font-semibold">
                {it.design_no ? `[DN ${it.design_no}] ` : ""}{it.description}
              </td>
              <td className="p-1 text-center font-mono font-bold border-r border-black">{it.taka || "-"}</td>
              <td className="p-1 text-center font-mono font-bold border-r border-black">{it.meters || "-"}</td>
              <td className="p-1 text-right font-mono border-r border-black">{it.weight || "-"}</td>
              <td className="p-1 text-right font-mono font-bold">
                {it.amount > 0 ? Number(it.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-neutral-200 font-black text-xs">
            <td colSpan={2} className="p-1 px-2 border-r border-black text-right">TOTAL DISPATCHED</td>
            <td className="p-1 text-center font-mono border-r border-black">{totalTaka}</td>
            <td className="p-1 text-center font-mono border-r border-black">{totalMeters ? totalMeters.toFixed(2) : "-"}</td>
            <td className="p-1 text-right font-mono border-r border-black">{totalWeight ? totalWeight.toFixed(2) : "-"}</td>
            <td className="p-1 text-right font-mono">₹{data.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        </tfoot>
      </table>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-4 pt-3 text-center text-[10px]">
        <div className="border border-dashed border-black p-2 rounded">
          <div className="h-6"></div>
          <p className="font-bold uppercase">Receiver Signature / Stamp</p>
        </div>
        <div className="border border-dashed border-black p-2 rounded">
          <div className="h-6"></div>
          <p className="font-bold uppercase">For, {firmName}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. TEMPLATE 4: CLASSIC ACCOUNTING LEDGER FORMAT (A4)
// ============================================================================
function ClassicAccountingTemplate({
  data,
  settings
}: {
  data: InvoiceRenderData;
  settings: CompanySettings;
}) {
  const firmName = settings.brand_name || settings.company_name || "SHIV CREATION";
  return (
    <div className="w-full bg-white text-black font-serif text-xs border-4 border-double border-black p-4 space-y-3">
      {/* Formal Top Bar */}
      <div className="flex justify-between items-center border-b-2 border-black pb-2">
        <span className="font-sans text-[10px] font-bold uppercase tracking-widest bg-black text-white px-2 py-0.5">
          TAX INVOICE - ORIGINAL
        </span>
        <span className="font-sans text-[11px] font-bold">GSTIN: {settings.gstin || "24AAAFA1234A1Z5"}</span>
      </div>

      <div className="text-center py-2 border-b border-black">
        <h1 className="font-black text-2xl tracking-wider uppercase font-sans">{firmName}</h1>
        <p className="text-xs italic">{settings.address || "Textile Market, Surat, Gujarat"}</p>
        <p className="text-[11px] font-bold font-sans">Contact: {settings.phone || "9978987181"} | State Code: 24</p>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b border-black pb-2 text-xs font-sans">
        <div>
          <p className="font-bold uppercase text-neutral-500 text-[10px]">Buyer Particulars:</p>
          <p className="font-black text-sm">{data.customer_name}</p>
          <p className="text-[11px]">{data.customer_address || "Surat, Gujarat"}</p>
          <p className="font-bold font-mono">GSTIN: {data.customer_gstin || "N/A"}</p>
        </div>
        <div className="text-right space-y-0.5 font-mono">
          <p><span className="font-sans font-bold">Invoice No:</span> {data.invoice_no}</p>
          <p><span className="font-sans font-bold">Date:</span> {data.date}</p>
          <p><span className="font-sans font-bold">Terms:</span> {data.credit_days ? `${data.credit_days} Days` : "Net 30"}</p>
          <p><span className="font-sans font-bold">Place of Supply:</span> 24-Gujarat</p>
        </div>
      </div>

      {/* Items */}
      <table className="w-full text-left border-collapse border border-black font-sans text-xs">
        <thead>
          <tr className="bg-neutral-100 font-bold border-b border-black">
            <th className="p-1.5 text-center w-8 border-r border-black">#</th>
            <th className="p-1.5 border-r border-black">Item Description & HSN</th>
            <th className="p-1.5 text-center w-14 border-r border-black">Taka</th>
            <th className="p-1.5 text-center w-16 border-r border-black">Meters</th>
            <th className="p-1.5 text-right w-16 border-r border-black">Rate (₹)</th>
            <th className="p-1.5 text-right w-24">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, idx) => (
            <tr key={idx} className="border-b border-neutral-300">
              <td className="p-1.5 text-center font-mono border-r border-black">{idx + 1}</td>
              <td className="p-1.5 border-r border-black font-semibold">
                {it.design_no && `[D.No ${it.design_no}] `}{it.description} <span className="font-mono text-neutral-500 text-[10px]">(HSN: {it.hsn || "5402"})</span>
              </td>
              <td className="p-1.5 text-center font-mono border-r border-black">{it.taka || "-"}</td>
              <td className="p-1.5 text-center font-mono border-r border-black">{it.meters || "-"}</td>
              <td className="p-1.5 text-right font-mono border-r border-black">{it.rate || "-"}</td>
              <td className="p-1.5 text-right font-mono font-bold">
                {Number(it.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-neutral-100 font-black">
            <td colSpan={2} className="p-2 border-r border-black text-right">TOTAL INVOICE VALUE</td>
            <td className="p-2 text-center font-mono border-r border-black">{data.items.reduce((s, it) => s + (Number(it.taka) || 0), 0)}</td>
            <td className="p-2 text-center font-mono border-r border-black">{data.items.reduce((s, it) => s + (Number(it.meters) || 0), 0).toFixed(2)}</td>
            <td className="p-2 border-r border-black"></td>
            <td className="p-2 text-right font-mono text-sm">₹{data.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        </tfoot>
      </table>

      {/* Words & Bank */}
      <div className="flex justify-between items-start gap-3 border-t border-black pt-2 font-sans text-xs">
        <div className="flex-1 space-y-1">
          <p className="text-[11px] font-serif italic"><strong>In Words:</strong> {numberToIndianWords(data.total_amount)}</p>
          <p className="text-[10px] text-neutral-600">Bank: {settings.bank_name} | A/c: {settings.account_no} | IFSC: {settings.ifsc}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-xs uppercase">FOR {firmName}</p>
          <div className="h-8"></div>
          <p className="font-bold text-[10px] uppercase border-t border-black pt-1">Authorised Signatory</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 9. UNIFIED MASTER RENDERER COMPONENT
// ============================================================================
export default function InvoiceTemplateRenderer({
  templateId = "standard",
  data,
  settings,
  showLogo = true,
  showQr = true
}: {
  templateId?: string;
  data: InvoiceRenderData;
  settings: CompanySettings;
  showLogo?: boolean;
  showQr?: boolean;
}) {
  const normId = (templateId || "").toLowerCase();

  // FORMAT 2: Textile format with Logo Box in top-left corner of the header
  if (normId.includes("format2") || normId.includes("modern")) {
    return <StandardTextileTemplate data={data} settings={settings} showLogo={showLogo} showQr={showQr} showLogoBox={true} />;
  }
  // FORMAT 3: Textile format ready for custom bill 3
  if (normId.includes("format3") || normId.includes("compact")) {
    return <StandardTextileTemplate data={data} settings={settings} showLogo={showLogo} showQr={showQr} showLogoBox={false} />;
  }
  // FORMAT 4: Textile format ready for custom bill 4
  if (normId.includes("format4") || normId.includes("classic")) {
    return <StandardTextileTemplate data={data} settings={settings} showLogo={showLogo} showQr={showQr} showLogoBox={false} />;
  }
  // Default: FORMAT 1 - Standard Textile (full-width centered title)
  return <StandardTextileTemplate data={data} settings={settings} showLogo={showLogo} showQr={showQr} showLogoBox={false} />;
}

