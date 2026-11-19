"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldAlert,
  Lock,
  Key,
  Database,
  Server,
  Save,
  CheckCircle2
} from "lucide-react";

export default function PlatformSettingsPage() {
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(240);
  const [supportMaxMinutes, setSupportMaxMinutes] = useState(120);
  const [enforcePasswordComplexity, setEnforcePasswordComplexity] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-400" />
          <span>Platform Settings & Security Policies</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Global cryptographic policies, session management, and tenant isolation parameters.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Platform security policies updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Security Parameters */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            <span>Cryptographic & Session Policies</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Standard Tenant JWT Session Lifetime (Minutes)
              </label>
              <input
                type="number"
                value={sessionTimeoutMinutes}
                onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                min={30}
                max={1440}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
              <p className="text-[10px] text-slate-500 mt-1">Default: 240 minutes (4 hours)</p>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Diagnostic Support Access Token Cap (Minutes)
              </label>
              <input
                type="number"
                value={supportMaxMinutes}
                onChange={(e) => setSupportMaxMinutes(Number(e.target.value))}
                min={15}
                max={180}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
              <p className="text-[10px] text-slate-500 mt-1">Maximum allowed diagnostic impersonation window</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={enforcePasswordComplexity}
                onChange={(e) => setEnforcePasswordComplexity(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-0"
              />
              <span className="font-bold">
                Enforce PBKDF2-SHA256 password hashing with per-user cryptographic salts
              </span>
            </label>
          </div>
        </div>

        {/* Tenant Architecture Status */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Multi-Tenant Architecture Status</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Tenant Isolation</span>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">Cryptographic JWT Claims</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Database Model</span>
              <p className="text-sm font-bold text-purple-400 mt-0.5">Shared PostgreSQL Schema</p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-purple-600/30"
        >
          Save Platform Settings
        </button>
      </form>
    </div>
  );
}
