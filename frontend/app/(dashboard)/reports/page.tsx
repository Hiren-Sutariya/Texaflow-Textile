"use client";

import { useState } from "react";
import { Download, Calendar, BarChart3, TrendingUp, PieChart, FileSpreadsheet, Layers, Shield, CheckCircle, MessageSquare } from "lucide-react";

export default function ReportsPage() {
  const [selectedRange, setSelectedRange] = useState("This Month (Sept 2026)");
  const [activeTab, setActiveTab] = useState("production");

  const handleShareWhatsApp = () => {
    const todayStr = new Date().toLocaleDateString("en-GB");
    const reportText = `🏭 *OM SAI EMBROIDERY - PRODUCTION & EFFICIENCY REPORT*\n📅 *Period:* ${selectedRange}\n-----------------------------------------\n📊 *SUMMARY:*\n• Avg Machine Efficiency: *88.5%*\n• Stitch Production: *4,820,000 Stitches*\n• Defect Rate: *1.6%*\n\n✨ *Generated via Om Sai Embroidery System*`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(reportText)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2">
        <select
          value={selectedRange}
          onChange={(e) => setSelectedRange(e.target.value)}
          className="w-full sm:w-auto border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option>Today (22 Sept 2026)</option>
          <option>This Week</option>
          <option>This Month (Sept 2026)</option>
          <option>Q3 FY 2026-27</option>
        </select>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg font-bold text-xs transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Share via WhatsApp
          </button>
          <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Export Excel / PDF
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 text-xs sm:text-sm font-semibold overflow-x-auto pb-1 sm:pb-0">
        <button
          onClick={() => setActiveTab("production")}
          className={`pb-2.5 sm:pb-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "production" ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Production & Efficiency
        </button>
        <button
          onClick={() => setActiveTab("party")}
          className={`pb-2.5 sm:pb-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "party" ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Party Ledger & Job Work
        </button>
        <button
          onClick={() => setActiveTab("financial")}
          className={`pb-2.5 sm:pb-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "financial" ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Financial & Profitability
        </button>
      </div>

      {/* Report Cards Grid */}
      {activeTab === "production" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Avg Machine Efficiency</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">+4.2%</span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">88.5%</p>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-700 h-2 rounded-full" style={{ width: "88.5%" }}></div>
              </div>
              <p className="text-xs text-slate-500">Target: 85% • Top Performer: Machine 1</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Stitch Production (M)</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">This Month</span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">4,820,000</p>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "92%" }}></div>
              </div>
              <p className="text-xs text-slate-500">Across 4 Machines • 98.4% Quality Acceptance</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Wastage / Defect Rate</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Within Limit</span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">1.6%</p>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: "16%" }}></div>
              </div>
              <p className="text-xs text-slate-500 font-medium text-emerald-600">Max threshold is 3.0%</p>
            </div>
          </div>

          {/* Machine Performance Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Machine-wise Output Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Machine No</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Total Stitches</th>
                    <th className="py-2.5 px-3">Meters Produced</th>
                    <th className="py-2.5 px-3">Breakdown Time</th>
                    <th className="py-2.5 px-3">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-blue-700">Machine 1</td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">12-Head Multi</td>
                    <td className="py-2.5 px-3">1,450,000</td>
                    <td className="py-2.5 px-3">2,400 Mtrs</td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">45 Mins</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600">92.4%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-blue-700">Machine 2</td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">17-Head Multi</td>
                    <td className="py-2.5 px-3">1,210,000</td>
                    <td className="py-2.5 px-3">1,950 Mtrs</td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">1 hr 10 Mins</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600">87.1%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-blue-700">M-03 (Multi-Head)</td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">12-Head Multi</td>
                    <td className="py-2.5 px-3">890,000</td>
                    <td className="py-2.5 px-3">450 Pcs</td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">20 Mins</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600">89.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "party" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Party-wise Stock & Billing Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-2.5 px-3">Party Name</th>
                  <th className="py-2.5 px-3">Active Job Works</th>
                  <th className="py-2.5 px-3">Fabric in Hand</th>
                  <th className="py-2.5 px-3">Dispatched Mtrs</th>
                  <th className="py-2.5 px-3">Billed Amount</th>
                  <th className="py-2.5 px-3">Outstanding (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-slate-900">ABC Tex Fabrics</td>
                  <td className="py-2.5 px-3">2 Jobs</td>
                  <td className="py-2.5 px-3 text-xs font-semibold text-slate-700">1,250 Mtrs (Party Stock)</td>
                  <td className="py-2.5 px-3">3,200 Mtrs</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">₹1,85,000</td>
                  <td className="py-2.5 px-3 font-extrabold text-rose-600">₹15,000</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-slate-900">Royal Fashion House</td>
                  <td className="py-2.5 px-3">1 Job</td>
                  <td className="py-2.5 px-3 text-xs font-semibold text-slate-700">450 Pcs (Party Stock)</td>
                  <td className="py-2.5 px-3">1,100 Pcs</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">₹92,000</td>
                  <td className="py-2.5 px-3 font-extrabold text-emerald-600">₹0 (Paid)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "financial" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Gross Margin & Expense Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500">Revenue & Job Billing</h4>
              <div className="text-2xl font-extrabold text-slate-900">₹4,25,000</div>
              <p className="text-xs text-slate-500">Total job work charges invoiced in September 2026.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500">Net Estimated Profit</h4>
              <div className="text-2xl font-extrabold text-emerald-600">₹1,48,500 (34.9%)</div>
              <p className="text-xs text-slate-500">After deducting Karigar wages, power & raw thread costs.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
