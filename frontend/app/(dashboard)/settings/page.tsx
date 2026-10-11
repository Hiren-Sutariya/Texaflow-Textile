"use client";

import { useState } from "react";
import { Building2, Save, Cpu, Warehouse, Shield, CheckCircle2, FileText, Bell } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [companyDetails, setCompanyDetails] = useState({
    name: "Om Sai Embroidery Works",
    tagline: "High Precision Multi-Head Embroidery Job Work",
    gstin: "24AAAFA1234A1Z5",
    pan: "AAAFA1234A",
    phone: "+91 98765 43210",
    email: "contact@omsaiembroidery.com",
    address: "Plot No. 104-106, GIDC Khatodara Industrial Estate",
    city: "Surat",
    state: "Gujarat",
    pincode: "395002",
    bank_name: "HDFC Bank Ltd",
    account_no: "50200012345678",
    ifsc: "HDFC0000123",
    branch: "Ring Road Branch, Surat"
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Save Notification */}
      {savedSuccess && (
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Settings Saved Successfully
          </div>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("company")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "company" ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Company & Bank Profile
        </button>
        <button
          onClick={() => setActiveTab("machines")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "machines" ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Machines & Floor Setup
        </button>
        <button
          onClick={() => setActiveTab("warehouses")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "warehouses" ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Warehouses & Stock Racks
        </button>
      </div>

      {activeTab === "company" && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-700" /> Business Identity & GST Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyDetails.name}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={companyDetails.tagline}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={companyDetails.gstin}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, gstin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">PAN Number</label>
                <input
                  type="text"
                  value={companyDetails.pan}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, pan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" /> Factory Address & Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Street Address / GIDC</label>
                <input
                  type="text"
                  value={companyDetails.address}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">City & State</label>
                <input
                  type="text"
                  value={`${companyDetails.city}, ${companyDetails.state}`}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-700" /> Bank Account (For Invoice Printing)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Bank Name</label>
                <input
                  type="text"
                  value={companyDetails.bank_name}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, bank_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Account Number</label>
                <input
                  type="text"
                  value={companyDetails.account_no}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, account_no: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={companyDetails.ifsc}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, ifsc: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" /> Save System Settings
            </button>
          </div>
        </form>
      )}

      {activeTab === "machines" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-700" /> Configured Embroidery Machines
          </h3>
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Machine 1: 12-Head Multi-Head Embroidery</h4>
                <p className="text-xs text-slate-500">Target Speed: 750 RPM • Assigned Operator: Ramesh Patel</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Operational</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Machine 2: 17-Head Multi-Head Embroidery</h4>
                <p className="text-xs text-slate-500">Target Speed: 720 RPM • Assigned Operator: Dinesh Kumar</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Operational</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">M-03: Multi-Head 12-Head Sequin</h4>
                <p className="text-xs text-slate-500">Target Speed: 750 RPM • Assigned Operator: Suresh Sahu</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Operational</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "warehouses" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-blue-700" /> Warehouse & Stock Storage Locations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Main Raw Material Store (Godown A)</h4>
              <p className="text-xs text-slate-500">Stores: Grey Cloth, Viscose Yarn, Zari Spools & Sequins</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Finished Goods Dispatch Dock (Godown B)</h4>
              <p className="text-xs text-slate-500">Stores: Completed Embroidery Rolls & Ready Dispatches</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
