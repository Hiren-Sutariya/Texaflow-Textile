"use client";

import { useState, useRef } from "react";
import { 
  Upload, 
  X, 
  FileSpreadsheet, 
  Download, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2 
} from "lucide-react";
import { getStoredCompanyId } from "@/lib/tenantStorage";
import { API_BASE_URL } from "@/lib/api";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "parties" | "workers";
  onSuccess: () => void;
}

export function ExcelImportModal({
  isOpen,
  onClose,
  entityType,
  onSuccess
}: ExcelImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const isParties = entityType === "parties";

  // Download Clean Sample Excel Template
  const handleDownloadSample = async () => {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      if (isParties) {
        const sampleData = [
          {
            "Party Name *": "Shree Ram Textiles (Surat)",
            "Account Type": "Customer",
            "Mobile": "9825012345",
            "GSTIN": "24ABCDE1234F1Z5",
            "City": "Surat",
            "Opening Balance (₹)": 15000,
            "Payment Terms": "Net 15 Days (Surat Market Standard)"
          },
          {
            "Party Name *": "Balaji Dyeing & Printing",
            "Account Type": "Vendor",
            "Mobile": "9879054321",
            "GSTIN": "24XYZAB9876C1Z2",
            "City": "Surat",
            "Opening Balance (₹)": 0,
            "Payment Terms": "Net 30 Days"
          }
        ];
        const ws = XLSX.utils.json_to_sheet(sampleData);
        XLSX.utils.book_append_sheet(wb, ws, "Sample Parties");
        XLSX.writeFile(wb, "Sample_Parties_Import_Template.xlsx");
      } else {
        const sampleData = [
          {
            "Worker Name *": "Ramesh Master",
            "Role": "Karigar",
            "Mobile": "9876543210",
            "Aadhaar": "123456789012",
            "Salary Type": "Piece Rate",
            "Daily or Piece Rate (₹)": 25
          },
          {
            "Worker Name *": "Suresh Helper",
            "Role": "Helper",
            "Mobile": "9898989898",
            "Aadhaar": "",
            "Salary Type": "Monthly",
            "Daily or Piece Rate (₹)": 15000
          }
        ];
        const ws = XLSX.utils.json_to_sheet(sampleData);
        XLSX.utils.book_append_sheet(wb, ws, "Sample Workers");
        XLSX.writeFile(wb, "Sample_Workers_Import_Template.xlsx");
      }
    } catch (err) {
      console.error("Failed to generate sample Excel", err);
      setErrorMsg("Error generating sample template");
    }
  };

  // Parse Excel or CSV file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setErrorMsg(null);
    setSuccessCount(null);
    setFile(selectedFile);
    setIsParsing(true);

    try {
      const XLSX = await import("xlsx");
      const reader = new FileReader();

      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json(ws, { defval: "" });

          if (!Array.isArray(rawData) || rawData.length === 0) {
            setErrorMsg("ફાઈલમાં કોઈ ડેટા નથી મળ્યો. કૃપા કરી ભરેલી ફાઈલ અપલોડ કરો.");
            setIsParsing(false);
            return;
          }

          // Map columns flexibly
          const mapped = rawData.map((row: any) => {
            if (isParties) {
              const name =
                row["Party Name *"] ||
                row["Party Name"] ||
                row["party_name"] ||
                row["Name"] ||
                row["PARTY NAME"] ||
                "";

              const accountType =
                row["Account Type"] ||
                row["account_type"] ||
                row["Type"] ||
                "Customer";

              const mobile =
                row["Mobile"] ||
                row["Phone"] ||
                row["mobile"] ||
                row["contact"] ||
                "";

              const gstin =
                row["GSTIN"] ||
                row["gstin"] ||
                row["GST"] ||
                "";

              const city =
                row["City"] ||
                row["city"] ||
                "Surat";

              const openingBal =
                Number(row["Opening Balance (₹)"] || row["Opening Balance"] || row["opening_balance"] || 0);

              const paymentTerms =
                row["Payment Terms"] ||
                row["payment_terms"] ||
                "Net 15 Days (Surat Market Standard)";

              return {
                name: String(name).trim(),
                account_type: String(accountType).trim() || "Customer",
                mobile: String(mobile).trim(),
                gstin: String(gstin).trim().toUpperCase(),
                city: String(city).trim() || "Surat",
                opening_balance: isNaN(openingBal) ? 0 : openingBal,
                payment_terms: String(paymentTerms).trim()
              };
            } else {
              const name =
                row["Worker Name *"] ||
                row["Worker Name"] ||
                row["name"] ||
                row["Name"] ||
                "";

              const role =
                row["Role"] ||
                row["role"] ||
                "Karigar";

              const mobile =
                row["Mobile"] ||
                row["Phone"] ||
                row["mobile"] ||
                "";

              const aadhaar =
                row["Aadhaar"] ||
                row["aadhaar"] ||
                "";

              const salaryType =
                row["Salary Type"] ||
                row["salary_type"] ||
                "Piece Rate";

              const rate =
                Number(row["Daily or Piece Rate (₹)"] || row["Rate"] || row["daily_rate"] || 0);

              return {
                name: String(name).trim(),
                role: String(role).trim() || "Karigar",
                mobile: String(mobile).trim(),
                aadhaar: String(aadhaar).trim(),
                salary_type: String(salaryType).trim() || "Piece Rate",
                daily_rate: isNaN(rate) ? 0 : rate
              };
            }
          }).filter((item) => item.name.length > 0);

          if (mapped.length === 0) {
            setErrorMsg("નામ (Name) નું કોલમ મળ્યું નથી અથવા ખાલી છે. કૃપા કરી સેમ્પલ ફોર્મેટ ચેક કરો.");
          } else {
            setParsedRows(mapped);
          }
        } catch (err) {
          console.error("Sheet parse error", err);
          setErrorMsg("એક્સેલ શીટ વાંચવામાં ખામી આવી. કૃપા કરી માન્ય .xlsx ફાઈલ વાપરો.");
        } finally {
          setIsParsing(false);
        }
      };

      reader.readAsBinaryString(selectedFile);
    } catch (err) {
      console.error("File read error", err);
      setIsParsing(false);
      setErrorMsg("ફાઈલ પ્રોસેસ કરવામાં એરર આવી.");
    }
  };

  // Perform Bulk Upload to Backend API
  const handlePerformImport = async () => {
    if (parsedRows.length === 0) return;

    setIsImporting(true);
    setErrorMsg(null);
    setImportProgress({ current: 0, total: parsedRows.length });

    const cid = getStoredCompanyId() || "comp-001";
    let countSuccess = 0;

    for (let i = 0; i < parsedRows.length; i++) {
      const item = parsedRows[i];
      setImportProgress({ current: i + 1, total: parsedRows.length });

      try {
        if (isParties) {
          const payload = {
            company_id: cid,
            company_name: item.name,
            display_name: item.name,
            account_type: item.account_type,
            first_name: item.name.split(" ")[0] || item.name,
            last_name: item.name.split(" ").slice(1).join(" ") || "",
            mobile: item.mobile,
            work_phone: item.mobile,
            gstin: item.gstin,
            billing_city: item.city,
            shipping_city: item.city,
            opening_balance: item.opening_balance,
            current_balance: item.opening_balance,
            balance_type: item.opening_balance >= 0 ? "Debit" : "Credit",
            payment_terms: item.payment_terms
          };

          const res = await fetch(`${API_BASE_URL}/parties/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-company-id": cid
            },
            body: JSON.stringify(payload)
          });

          if (res.ok) countSuccess++;
        } else {
          const payload = {
            company_id: cid,
            name: item.name,
            role: item.role,
            mobile: item.mobile,
            phone: item.mobile,
            aadhaar: item.aadhaar,
            salary_type: item.salary_type,
            daily_rate: item.daily_rate,
            status: "Active"
          };

          const res = await fetch(`${API_BASE_URL}/employees/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-company-id": cid
            },
            body: JSON.stringify(payload)
          });

          if (res.ok) countSuccess++;
        }
      } catch (err) {
        console.error("Failed to import single row", err);
      }
    }

    setIsImporting(false);
    setSuccessCount(countSuccess);

    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans text-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {isParties
                  ? "પાર્ટીઓનું બલ્ક એક્સેલ ઇમ્પોર્ટ (Import Parties)"
                  : "કારીગરોનું બલ્ક એક્સેલ ઇમ્પોર્ટ (Import Workers)"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                એક્સેલ અથવા સીએસવી (.xlsx / .csv) ફાઇલથી એકસાથે તમામ રેકોર્ડ ઉમેરો
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4">
          {/* STEP 1: SAMPLE TEMPLATE */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-emerald-950 block text-xs">
                ૧. તૈયાર નમૂના ફોર્મેટ ડાઉનલોડ કરો
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">
                યોગ્ય કોલમ હેડર્સ માટે સેમ્પલ એક્સેલ ફાઈલ ડાઉનલોડ કરીને તેમાં ડેટા ભરી શકો છો.
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] flex items-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>સેમ્પલ (.xlsx)</span>
            </button>
          </div>

          {/* STEP 2: FILE UPLOAD ZONE */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              ૨. તમારી એક્સેલ ફાઇલ પસંદ કરો (.xlsx અથવા .csv)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 mx-auto flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-xs">
                  {file ? file.name : "ફાઇલ પસંદ કરવા માટે અહીં ક્લિક કરો"}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Excel (.xlsx), CSV સપોર્ટેડ છે
                </p>
              </div>
            </div>
          </div>

          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PARSING SPINNER */}
          {isParsing && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-700 text-xs font-bold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              <span>એક્સેલ ફાઈલ વાંચી રહ્યા છીએ...</span>
            </div>
          )}

          {/* PREVIEW DETECTED ROWS */}
          {parsedRows.length > 0 && !isImporting && successCount === null && (
            <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>કુલ મળી આવેલા રેકોર્ડ્સ:</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg font-mono">
                  {parsedRows.length} {isParties ? "પાર્ટીઓ" : "કારીગરો"}
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-200 text-[11px] bg-white rounded-xl border border-slate-200">
                {parsedRows.slice(0, 5).map((r, i) => (
                  <div key={i} className="px-3 py-1.5 flex items-center justify-between">
                    <span className="font-bold text-slate-800 truncate">{r.name}</span>
                    <span className="text-slate-400 text-[10px]">{r.mobile || r.city || r.role}</span>
                  </div>
                ))}
                {parsedRows.length > 5 && (
                  <div className="px-3 py-1 text-[10px] text-slate-400 text-center font-medium bg-slate-50">
                    + અન્ય {parsedRows.length - 5} રેકોર્ડ્સ
                  </div>
                )}
              </div>
            </div>
          )}

          {/* IMPORTING PROGRESS */}
          {isImporting && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between font-bold text-blue-900 text-xs">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ઇમ્પોર્ટ થઈ રહ્યું છે...
                </span>
                <span>
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 transition-all duration-150"
                  style={{
                    width: `${Math.round((importProgress.current / importProgress.total) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* SUCCESS BANNER */}
          {successCount !== null && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-black text-sm">સફળતાપૂર્વક ઇમ્પોર્ટ થયું!</p>
                <p className="font-normal text-[11px] text-emerald-700">
                  {successCount} રેકોર્ડ્સ ડેટાબેઝમાં સફળતાપૂર્વક ઉમેરાઈ ગયા છે.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            રદ કરો (Cancel)
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0 || isImporting || isParsing || successCount !== null}
            onClick={handlePerformImport}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:cursor-not-allowed"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>હવે ઇમ્પોર્ટ કરો ({parsedRows.length})</span>
          </button>
        </div>

      </div>
    </div>
  );
}
