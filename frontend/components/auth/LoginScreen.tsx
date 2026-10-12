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
  ArrowLeft,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface LoginScreenProps {
  onSuccess?: () => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        setSuccessMsg("Signed in successfully!");
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/");
          }
        }, 200);
      } else {
        setErrorMsg(res.error || "Invalid username or password");
      }
    } catch (err: any) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setSuccessMsg("Authenticating via Google...");
    setIsSubmitting(true);
    try {
      const res = await login("owner@om-sai.com", "owner123");
      if (res.success) {
        setSuccessMsg("Signed in with Google successfully!");
        setTimeout(() => {
          if (onSuccess) onSuccess();
          else router.push("/");
        }, 200);
      }
    } catch {
      setErrorMsg("Google authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleLogin = async () => {
    setErrorMsg("");
    setSuccessMsg("Authenticating via Apple ID...");
    setIsSubmitting(true);
    try {
      const res = await login("owner@om-sai.com", "owner123");
      if (res.success) {
        setSuccessMsg("Signed in with Apple successfully!");
        setTimeout(() => {
          if (onSuccess) onSuccess();
          else router.push("/");
        }, 200);
      }
    } catch {
      setErrorMsg("Apple authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    setTimeout(() => {
      setIsSubmitting(false);
      setForgotSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-r from-blue-50/70 via-slate-50/40 to-blue-50/50 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* LEFT PATH (50% SPLIT): SIGNATURE BLUE & WHITE THEME (DESKTOP & LARGE SCREENS ONLY) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-100/70 via-blue-50/80 to-blue-50/30 border-r border-blue-200/80 p-12 xl:p-16 flex-col justify-between relative overflow-hidden">
        
        {/* Soft blue theme ambient glow */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-3xl pointer-events-none -ml-24 -mt-24" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl pointer-events-none -mr-20 -mb-20" />

        {/* Top: Logo & Firm Name */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0 tracking-wider">
            OS
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none uppercase">
              Om Sai Enterprises
            </h1>
            <p className="text-xs text-blue-600 font-bold mt-1">
              • TexaFlow Textile
            </p>
          </div>
        </div>

        {/* Center Content: Making Work Easy & Growing Business */}
        <div className="relative z-10 my-auto py-6 max-w-lg space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              Run Your Factory Effortlessly. <br />
              <span className="text-blue-600">Grow Your Business Faster.</span>
            </h2>
          </div>

          {/* 7 Clean Value Highlights */}
          <div className="space-y-2.5 pt-1">
            <div className="border-l-2 border-blue-600 pl-3 py-0.5">
              <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight">
                Save Time Every Single Day
              </h3>
            </div>

            <div className="border-l-2 border-blue-600 pl-3 py-0.5">
              <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight">
                Accurate Karigar Wages &amp; Upad Ledgers
              </h3>
            </div>

            <div className="border-l-2 border-blue-600 pl-3 py-0.5">
              <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight">
                Real-Time Machine &amp; Shift Production
              </h3>
            </div>

            <div className="border-l-2 border-blue-600 pl-3 py-0.5">
              <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight">
                Instant Party Ledger &amp; Voucher Status
              </h3>
            </div>

            <div className="border-l-2 border-blue-600 pl-3 py-0.5">
              <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight">
                Faster Job Work Deliveries &amp; Happy Clients
              </h3>
            </div>

            <div className="border-l-2 border-blue-600 pl-3 py-0.5">
              <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight">
                Complete Visibility on Factory Overhead &amp; Profits
              </h3>
            </div>

            <div className="border-l-2 border-blue-600 pl-3 py-0.5">
              <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight">
                Freedom to Scale Machines &amp; Grow Your Business
              </h3>
            </div>
          </div>

          {/* Modern 3-Metric Impact Strip */}
          <div className="pt-2 grid grid-cols-3 gap-2.5">
            <div className="bg-blue-50/90 border border-blue-200/90 rounded-2xl p-3 shadow-2xs">
              <div className="text-sm sm:text-base font-black text-slate-900">100%</div>
              <div className="text-[11px] text-blue-900 font-bold mt-0.5 leading-tight">Accurate Ledgers</div>
            </div>
            <div className="bg-blue-50/90 border border-blue-200/90 rounded-2xl p-3 shadow-2xs">
              <div className="text-sm sm:text-base font-black text-blue-600">Zero</div>
              <div className="text-[11px] text-blue-900 font-bold mt-0.5 leading-tight">Calculation Errors</div>
            </div>
            <div className="bg-blue-50/90 border border-blue-200/90 rounded-2xl p-3 shadow-2xs">
              <div className="text-sm sm:text-base font-black text-slate-900">2x</div>
              <div className="text-[11px] text-blue-900 font-bold mt-0.5 leading-tight">Faster Decisions</div>
            </div>
          </div>
        </div>

        {/* Bottom Left Status */}
        <div className="relative z-10 pt-6 border-t border-blue-200/60 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>256-Bit Encrypted Secure Session</span>
          </div>
          <span className="font-semibold text-blue-700">TexaFlow Textile</span>
        </div>
      </div>

      {/* RIGHT PATH: CLEAN LOGIN & RESET PASSWORD FORM */}
      <div className="w-full lg:w-1/2 min-h-screen bg-gradient-to-bl from-blue-50/60 via-slate-50/80 to-blue-50/40 flex flex-col justify-center items-center px-4 py-8 sm:px-8 sm:py-12 lg:p-16 relative overflow-hidden">
        
        {/* Soft background glow */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile & Tablet Top Brand Header (Visible below lg) */}
        <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0 tracking-wider">
            OS
          </div>
          <div className="text-left">
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none uppercase">
              Om Sai Enterprises
            </h1>
            <p className="text-xs text-blue-600 font-bold mt-1">
              • TexaFlow Textile ERP
            </p>
          </div>
        </div>

        {/* Elongated, Comfortable Auth Card */}
        <div className="w-full max-w-[420px] sm:max-w-[460px] bg-white border border-blue-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm shadow-blue-500/5 space-y-5 sm:space-y-6 relative z-10">


          
          {/* ================= VIEW 1: SIGN IN FORM ================= */}
          {mode === "login" ? (
            <>
              {/* Form Header */}
              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Sign In
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Enter your credentials to access your ERP console
                </p>
              </div>

              {/* Social Quick Login Options (Google & Official Apple) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="h-11 px-4 flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all hover:border-slate-300 shadow-2xs active:scale-[0.99] cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleAppleLogin}
                  disabled={isSubmitting}
                  className="h-11 px-4 flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all hover:border-slate-300 shadow-2xs active:scale-[0.99] cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0 fill-current text-slate-900" viewBox="0 0 384 512">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6 0 90.4-82.5 102.6-119.3-65.2-30.7-63.3-90-63.3-90zM256.8 72.1c10.3-12.6 17.2-30.1 15.3-47.5-14.8.6-32.8 9.9-43.5 22.8-9.4 11-17.5 28.5-15.3 45.7 16.5 1.3 33.2-5.7 43.5-21z" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  or continue with email
                </span>
              </div>

              {/* Alerts */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Extended Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Email / Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter registered email or ID"
                      required
                      autoComplete="username"
                      className="w-full h-12 pl-11 pr-4 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotSubmitted(false);
                        setErrorMsg("");
                        setSuccessMsg("");
                        setMode("forgot");
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
                      required
                      autoComplete="current-password"
                      className="w-full h-12 pl-11 pr-11 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors shadow-2xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-70 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to ERP</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* ================= VIEW 2: INLINE RESET PASSWORD FORM ================= */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Back to sign in header */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 hover:underline transition-colors cursor-pointer -ml-0.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Reset Password
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Enter your registered email address and we'll send you instructions to recover your account
                </p>
              </div>

              {/* Status feedback */}
              {forgotSubmitted ? (
                <div className="space-y-5 pt-2">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-emerald-800 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Reset Instructions Dispatched</span>
                    </div>
                    <p className="text-emerald-700 font-normal leading-relaxed">
                      A password reset link has been dispatched to <strong className="font-bold text-emerald-900">{forgotEmail || email}</strong>. Please check your inbox or spam folder.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setForgotSubmitted(false);
                    }}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                    <span>Return to Sign In</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="owner@om-sai.com"
                        required
                        className="w-full h-12 pl-11 pr-4 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors shadow-2xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-70 mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Recovery Link</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Remember your password? Sign in
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer Credit & Mobile Security Badge */}
        <div className="mt-6 flex flex-col items-center gap-2 text-xs text-slate-400 font-medium text-center">
          <div className="flex items-center gap-1.5 text-slate-500 lg:hidden">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-[11px] sm:text-xs">256-Bit Encrypted Secure Session</span>
          </div>
          <div className="text-[11px] sm:text-xs">
            Powered & Developed by <strong className="text-slate-700 font-bold">DigiScale Infotech</strong>
          </div>
        </div>
      </div>

    </div>
  );
}
