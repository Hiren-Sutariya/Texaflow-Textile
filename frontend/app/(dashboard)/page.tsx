import Link from "next/link";
import { 
  Factory, 
  Briefcase, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Clock, 
  Play,
  Pause,
  Wrench,
  Users,
  PieChart,
  Sparkles,
  CreditCard,
  Calculator,
  Palette,
  Receipt,
  Wallet
} from "lucide-react";

const destinationModules = [
  {
    title: "Party Master",
    description: "Register Vepari clients, vendors, brokers & party ledgers",
    href: "/parties",
    icon: Users,
    color: "bg-cyan-50 text-cyan-600 border-cyan-100",
    isUpcoming: true
  },
  {
    title: "Design Library",
    description: "Stitch counts, thread colors & garment specs (Blouse Front/Back)",
    href: "/designs",
    icon: Palette,
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    isUpcoming: false
  },
  {
    title: "Karigar Issue",
    description: "Create order linking Vepari + Design + Fabric receipt",
    href: "/job-works",
    icon: Briefcase,
    color: "bg-blue-50 text-blue-600 border-blue-100",
    isUpcoming: true
  },
  {
    title: "Payments & Vouchers",
    description: "Party payments, receipts & white/black ledger vouchers",
    href: "/payments",
    icon: CreditCard,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    isUpcoming: false
  },
  {
    title: "Worker Payout",
    description: "Manufacturing karigar piece-rate salary & advance payouts",
    href: "/worker-payout",
    icon: Wallet,
    color: "bg-amber-50 text-amber-700 border-amber-100",
    isUpcoming: true
  },
  {
    title: "OMS Performance",
    description: "Order management system analytics, machine RPM & speed",
    href: "/oms-performance",
    icon: TrendingUp,
    color: "bg-purple-50 text-purple-600 border-purple-100",
    isUpcoming: true
  }
];

export default function DashboardPage() {
  return (
    <div className="space-y-3.5">
      {/* Top Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Embroidery Operations Overview & Command Center</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/job-works/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Job Work
          </Link>
          <Link
            href="/production"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all"
          >
            <Factory className="w-3.5 h-3.5" />
            Log Production
          </Link>
          <Link
            href="/payments"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-all border border-slate-200"
          >
            <CreditCard className="w-3.5 h-3.5 text-slate-600" />
            Add Payment
          </Link>
        </div>
      </div>

      {/* SELECT A DESTINATION / MAIN FEATURE CARDS SECTION */}
      <div className="space-y-3">
        <div className="text-center sm:text-left">
          <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Select a Destination</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {destinationModules.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="group relative bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center text-center justify-between overflow-hidden"
              >
                {item.isUpcoming && (
                  <span className="absolute top-2 right-2 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/90 shadow-2xs">
                    Upcoming
                  </span>
                )}
                <div className="flex flex-col items-center w-full">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.color} mb-2 group-hover:scale-105 transition-transform duration-200 shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition-colors">{item.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Production */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Today's Production</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Factory className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-extrabold text-slate-900">2,580 <span className="text-xs font-normal text-slate-500">pcs</span></h2>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Accepted 2,570 pcs (Rejection 0.3%)</span>
            </div>
          </div>
        </div>

        {/* Pending Job Work */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Job Work</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-extrabold text-slate-900">12 <span className="text-xs font-normal text-slate-500">active jobs</span></h2>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>3 jobs due within 48 hours</span>
            </div>
          </div>
        </div>

        {/* Total Stock */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Inventory Stock</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-extrabold text-slate-900">540 <span className="text-xs font-normal text-slate-500">kg/m</span></h2>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mt-2">
              <span className="text-blue-700">Company: 28.7 kg</span>
              <span className="text-purple-700">Party Owned: 500 m</span>
            </div>
          </div>
        </div>

        {/* Month Net Profit */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Month Profit</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-extrabold text-emerald-600">₹1,49,300</h2>
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mt-2">
              <span>Rec: ₹15,000</span>
              <span className="text-red-600">Payable: ₹15,050</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Production Snapshot + Operational Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Machine Snapshot (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Live Machine & Worker Snapshot</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time status across embroidery floor machines</p>
            </div>
            <Link href="/production" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View All Floor →
            </Link>
          </div>

          {/* MOBILE CARD VIEW (< md) - No horizontal scroll */}
          <div className="block md:hidden p-3 space-y-3 bg-slate-50/50">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>M-101 (SURAJ 400)</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Play className="w-2.5 h-2.5 fill-emerald-600" /> Running
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Worker</span>
                  <span className="font-bold text-slate-800">Ramesh Karigar</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Shift Output</span>
                  <span className="font-extrabold text-slate-900">1,200 pcs</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-medium truncate">
                Design: <span className="font-bold text-slate-800">DES-A101 Peacock Border</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>M-102 (TAJIMA Sequin)</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Play className="w-2.5 h-2.5 fill-emerald-600" /> Running
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Worker</span>
                  <span className="font-bold text-slate-800">Suresh Operator</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Shift Output</span>
                  <span className="font-extrabold text-slate-900">1,380 pcs</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-medium truncate">
                Design: <span className="font-bold text-slate-800">DES-A102 Sequin Neck</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span>M-103 (BAUYU Cord)</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Pause className="w-2.5 h-2.5 fill-amber-600" /> Idle
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Worker</span>
                  <span className="font-bold text-slate-500">Unassigned</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Shift Output</span>
                  <span className="font-extrabold text-slate-400">0 pcs</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 font-medium truncate">
                Design: None
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>M-104 (SURAJ 500)</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Wrench className="w-2.5 h-2.5 text-blue-600" /> Maintenance
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Worker</span>
                  <span className="font-bold text-slate-500">Maintenance Crew</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Shift Output</span>
                  <span className="font-extrabold text-slate-400">0 pcs</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-medium truncate">
                Design: <span className="font-bold text-slate-700">Tension Servicing</span>
              </div>
            </div>
          </div>

          {/* DESKTOP TABLE VIEW (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Machine</th>
                  <th className="py-3.5 px-4">Current Worker</th>
                  <th className="py-3.5 px-4">Active Design</th>
                  <th className="py-3.5 px-4 text-right">Shift Output</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    M-101 (SURAJ 400)
                  </td>
                  <td className="py-3.5 px-4">Ramesh Karigar</td>
                  <td className="py-3.5 px-4 text-slate-800">DES-A101 Peacock Border</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-900">1,200 pcs</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Play className="w-3 h-3 fill-emerald-600" /> Running
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    M-102 (TAJIMA Sequin)
                  </td>
                  <td className="py-3.5 px-4">Suresh Operator</td>
                  <td className="py-3.5 px-4 text-slate-800">DES-A102 Sequin Neck</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-900">1,380 pcs</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Play className="w-3 h-3 fill-emerald-600" /> Running
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    M-103 (BAUYU Cord)
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">Unassigned</td>
                  <td className="py-3.5 px-4 text-slate-400">None</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-400">0 pcs</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Pause className="w-3 h-3 fill-amber-600" /> Idle
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    M-104 (SURAJ 500)
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">Maintenance Crew</td>
                  <td className="py-3.5 px-4 text-slate-400">Tension Servicing</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-400">0 pcs</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Wrench className="w-3 h-3 text-blue-600" /> Maintenance
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Alerts & Action Required */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Operational Alerts
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                4 Required
              </span>
            </div>

            <div className="space-y-3 mt-4">
              <div className="p-3 bg-red-50/80 border border-red-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-bold text-red-900">Material Shortage Alert</h4>
                  <span className="text-[10px] font-bold text-red-700">Urgent</span>
                </div>
                <p className="text-[11px] text-red-800 mt-1">
                  JW-2026-001 requires 6 kg Gold Metallic Jari. Only 4 kg available.
                </p>
                <Link
                  href="/purchases"
                  className="inline-block mt-2 text-[11px] font-bold text-red-700 underline hover:text-red-900"
                >
                  Create Purchase Requirement →
                </Link>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-bold text-amber-900">Delayed Job Work</h4>
                  <span className="text-[10px] font-bold text-amber-700">Due 4 Days</span>
                </div>
                <p className="text-[11px] text-amber-800 mt-1">
                  ABC Tex Fabrics (JW-2026-001) Peacock Border 2,000 pcs in production.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Overdue Payment</h4>
                  <span className="text-[10px] font-bold text-slate-600">₹15,000</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Invoice INV-2026-012 from ABC Tex Fabrics due since 5 days.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-2">Quick Commands</h4>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/job-works/new" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 text-center">
                + New Job Work
              </Link>
              <Link href="/payments" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 text-center">
                + Record Payment
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
