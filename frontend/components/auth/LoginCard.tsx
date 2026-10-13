"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Building2,
  KeyRound
} from "lucide-react";

interface LoginCardProps {
  onSuccess?: () => void;
}

export function LoginCard({ onSuccess }: LoginCardProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"owner" | "manager" | "accounts">("owner");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRoleSelect = (role: "owner" | "manager" | "accounts") => {
    setSelectedRole(role);
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        setSuccessMsg("Login successful! Entering ERP console...");
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/");
          }
        }, 300);
      } else {
        setErrorMsg(res.error || "Invalid username or password. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 font-sans">
      
      {/* BRANDING HEADER */}
      <div className="text-center space-y-2">
        <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex items-center justify-center text-2xl mx-auto shadow-2xs">
          🧵
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Om Sai Embroidery
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            TexaFlow Textile ERP • Factory Sign In
          </p>
        </div>
      </div>

      {/* QUICK ROLE SELECTOR (MATCHING LIGHT THEME) */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Select Login Profile
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "owner", title: "👑 Owner", sub: "Proprietor" },
            { id: "manager", title: "🏭 Manager", sub: "Factory Plant" },
            { id: "accounts", title: "💼 Accounts", sub: "Billing & Cash" }
          ].map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleSelect(r.id as any)}
                className={`py-2 px-2 rounded-xl text-center border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs"
                    : "bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-700 font-semibold"
                }`}
              >
                <div className="text-xs leading-tight">{r.title}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">{r.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ALERTS */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Email or Operator ID
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@shivcreation.com"
              required
              className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-2xs"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">Password</label>
            <span className="text-[11px] font-semibold text-slate-400">Default: owner123</span>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-10 pl-9 pr-9 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-2xs font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Single-Session Security
          </span>
          <span>Plant #1</span>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-70 mt-1"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Sign In to ERP</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* QUICK SECURITY HINT */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Secure Local Session Guard Active</span>
      </div>
    </div>
  );
}
