"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Factory, 
  Package, 
  Truck, 
  Calendar, 
  DollarSign, 
  FileText,
  User
} from "lucide-react";

export default function JobWorkDetailPage() {
  const params = useParams();
  const id = params?.id || "jw-101";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-4">
          <Link href="/job-works" className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-blue-600 text-lg">JW-2026-001</span>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                In Production
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Party: ABC Tex Fabrics (Surat) | Created: 15 Sep 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/finance/costing"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            View Costing Report
          </Link>
          <Link
            href="/dispatches"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            Create Dispatch
          </Link>
        </div>
      </div>

      {/* Shortage Warning Banner */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600 text-white rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-red-900">Material Shortage Detected</h3>
            <p className="text-red-700 mt-0.5">Gold Metallic Jari 250D: Required 10.0 kg | Available 4.0 kg | Shortage: 6.0 kg</p>
          </div>
        </div>
        <Link
          href="/purchases"
          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl whitespace-nowrap text-center"
        >
          Create Purchase Order →
        </Link>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Party Fabric Received */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            <Package className="w-4 h-4 text-purple-600" /> Party Fabric Received
          </div>
          <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl space-y-1 text-xs">
            <div className="font-extrabold text-slate-900">Royal Blue Cotton 60s</div>
            <div className="text-slate-600">Lot #: LOT-5501</div>
            <div className="font-bold text-purple-800 text-sm mt-1">500.0 Meters (Party Owned)</div>
          </div>
        </div>

        {/* Machine Allocation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            <Factory className="w-4 h-4 text-blue-600" /> Machine Allocation
          </div>
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1 text-xs">
            <div className="font-extrabold text-slate-900">M-101 SURAJ 400 Multi-Head</div>
            <div className="text-slate-600">Worker: Ramesh Karigar</div>
            <div className="font-bold text-blue-800 text-sm mt-1">Produced: 1,200 / 2,000 pcs</div>
          </div>
        </div>

        {/* Financial Terms */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Rate & Payment Terms
          </div>
          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1 text-xs">
            <div className="font-extrabold text-slate-900">Rate: ₹12.50 / Piece</div>
            <div className="text-slate-600">Payment Terms: 30 Days Credit</div>
            <div className="font-bold text-emerald-800 text-sm mt-1">Est. Revenue: ₹25,000.00</div>
          </div>
        </div>
      </div>
    </div>
  );
}
