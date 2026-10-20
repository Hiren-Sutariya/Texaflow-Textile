"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Building2,
  User,
  Phone,
  MapPin,
  Receipt,
  UserCheck,
  X,
  Sparkles,
  KeyRound,
  RefreshCw,
  Edit2
} from "lucide-react";

interface LoginScreenProps {
  onSuccess?: () => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [mode, setMode] = useState<"login" | "forgot" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Register company state
  const [regCompanyName, setRegCompanyName] = useState("");
  const [regOwnerName, setRegOwnerName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regPhone, setRegPhone] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regGstin, setRegGstin] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Email Verification OTP State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [regOtp, setRegOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [otpSentEmail, setOtpSentEmail] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [otpErrorMsg, setOtpErrorMsg] = useState("");

  // OTP Countdown timer
  useEffect(() => {
    let interval: any = null;
    if (isOtpModalOpen && otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpModalOpen, otpCountdown]);

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
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/");
        }
      } else {
        setErrorMsg(res.error || "Invalid username or password");
      }
    } catch (err: any) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    setSuccessMsg("");
    setErrorMsg("Google Sign-In atyare service ma nathi. Krupya niche aapel Username / Email ane Password dwara manually login karo. (Google Sign-In is currently not in service. Please sign in manually.)");
  };

  const handleRegisterKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT") {
        const form = target.closest("form");
        if (!form) return;
        const inputs = Array.from(form.querySelectorAll("input:not([disabled])")) as HTMLElement[];
        const currentIndex = inputs.indexOf(target);
        if (currentIndex > -1 && currentIndex < inputs.length - 1) {
          e.preventDefault();
          inputs[currentIndex + 1].focus();
        }
      }
    }
  };

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanCompany = regCompanyName.trim();
    const cleanOwner = regOwnerName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanUsername = regUsername.trim();
    const cleanPassword = regPassword.trim();
    const cleanConfirmPassword = regConfirmPassword.trim();

    if (!cleanCompany) {
      setErrorMsg("Please enter Company / Firm Name");
      return;
    }
    if (!cleanOwner) {
      setErrorMsg("Please enter Owner / Director Name");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMsg("Please enter a valid Email Address");
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg("Username must be at least 3 characters long");
      return;
    }
    if (/\s/.test(cleanUsername)) {
      setErrorMsg("Username cannot contain spaces. Use letters, numbers or underscore.");
      return;
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      setErrorMsg("Password must be at least 4 characters long");
      return;
    }
    if (cleanPassword !== cleanConfirmPassword) {
      setErrorMsg("Password and Confirm Password do not match");
      return;
    }

    setIsSendingOtp(true);
    setIsRegistering(true);

    try {
      // Step 1: Send Registration OTP & Validate Email Authenticity (Disposable + DNS MX check)
      const res = await fetch(`${API_BASE_URL}/auth/send-registration-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: cleanCompany,
          owner_name: cleanOwner,
          email: cleanEmail,
          username: cleanUsername,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Email validation failed. Please check your email.");
      }

      // Step 2: Open OTP Verification Modal
      setOtpSentEmail(cleanEmail);
      setDevOtpHint(data.dev_otp || null);
      setRegOtp("");
      setOtpErrorMsg("");
      setOtpCountdown(60);
      setIsOtpModalOpen(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to verify email. Please try again.");
    } finally {
      setIsSendingOtp(false);
      setIsRegistering(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0 || isSendingOtp) return;
    setIsSendingOtp(true);
    setOtpErrorMsg("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-registration-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: regCompanyName.trim(),
          owner_name: regOwnerName.trim(),
          email: regEmail.trim().toLowerCase(),
          username: regUsername.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to resend OTP. Please try again.");
      }

      setDevOtpHint(data.dev_otp || null);
      setOtpCountdown(60);
    } catch (err: any) {
      setOtpErrorMsg(err.message || "Failed to resend OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleConfirmRegistrationWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = regOtp.trim();
    if (cleanOtp.length !== 6) {
      setOtpErrorMsg("Please enter the 6-digit verification OTP.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpErrorMsg("");

    const cleanCompany = regCompanyName.trim();
    const cleanOwner = regOwnerName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanUsername = regUsername.trim();
    const cleanPassword = regPassword.trim();
    const cleanPhone = regPhone.trim();
    const cleanCity = regCity.trim();
    const cleanGstin = regGstin.trim().toUpperCase();

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register-company`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: cleanCompany,
          owner_name: cleanOwner,
          email: cleanEmail,
          username: cleanUsername,
          password: cleanPassword,
          phone: cleanPhone || undefined,
          gstin: cleanGstin || undefined,
          address: cleanCity || undefined,
          city: cleanCity || undefined,
          otp: cleanOtp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed. Please check the OTP.");
      }

      setIsOtpModalOpen(false);
      const newCid = data?.company?.id || data?.user?.companyId || "comp-003";

      // Seed initial tenant settings in localStorage immediately
      try {
        const initialSettings = {
          company_name: cleanCompany,
          brand_name: cleanCompany.toUpperCase(),
          owner_name: cleanOwner,
          phone: cleanPhone || "",
          email: cleanEmail,
          username: cleanUsername,
          address: cleanCity || "",
          gstin: cleanGstin || "",
          status: "active",
        };
        localStorage.setItem(`app_settings_${newCid}`, JSON.stringify(initialSettings));
        localStorage.setItem(`texaflow_login_username_${newCid}`, cleanUsername);
        localStorage.setItem("texaflow_active_company_id", newCid);
      } catch {}

      setSuccessMsg(`Company "${cleanCompany}" registered successfully! Launching ERP...`);

      // Auto-login into the newly created company panel using the new username
      const loginRes = await login(cleanUsername, cleanPassword);
      if (loginRes.success) {
        setTimeout(() => {
          if (onSuccess) onSuccess();
          else window.location.href = "/";
        }, 300);
      } else {
        setMode("login");
        setEmail(cleanUsername);
      }
    } catch (err: any) {
      setOtpErrorMsg(err.message || "Failed to complete registration.");
    } finally {
      setIsVerifyingOtp(false);
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
            TF
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none uppercase">
              TexaFlow Textile ERP
            </h1>
            <p className="text-xs text-blue-600 font-bold mt-1">
              • Multi-Enterprise Cloud Platform
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
            TF
          </div>
          <div className="text-left">
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none uppercase">
              TexaFlow Textile ERP
            </h1>
            <p className="text-xs text-blue-600 font-bold mt-1">
              • Multi-Enterprise Portal
            </p>
          </div>
        </div>

        {/* Elongated, Comfortable Auth Card */}
        <div className={`w-full ${mode === "register" ? "max-w-[560px] sm:max-w-[620px]" : "max-w-[420px] sm:max-w-[460px]"} bg-white border border-blue-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-9 shadow-sm shadow-blue-500/5 space-y-5 sm:space-y-6 relative z-10 transition-all duration-300`}>


          
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

              {/* Google Workspace & Single Sign-On (Temporarily Disabled / Not in service) */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-11 px-4 flex items-center justify-between sm:justify-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-600 text-xs sm:text-sm font-semibold transition-all hover:border-slate-300 shadow-2xs active:scale-[0.99] cursor-pointer"
                  title="Google Sign-In is currently not in service. Please sign in manually."
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 opacity-75" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                    Not in service
                  </span>
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

                {/* Onboard New Company */}
                <div className="pt-2 text-center border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">
                    New company?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                    >
                      Register Company
                    </button>
                  </p>
                </div>
              </form>
            </>
          ) : mode === "register" ? (
            /* ================= VIEW 3: REGISTER NEW COMPANY ================= */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
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
                  Register Company
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Create a dedicated multi-tenant ERP panel for your textile firm
                </p>
              </div>

              {/* Alerts */}
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

              <form onSubmit={handleRegisterCompany} onKeyDown={handleRegisterKeyDown} className="space-y-3">
                {/* Row 1: Company / Firm Name & Owner Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Company / Firm Name *</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={regCompanyName}
                        onChange={(e) => setRegCompanyName(e.target.value)}
                        placeholder="e.g. Radhe Krishna Textiles"
                        required
                        className="w-full h-11 pl-10 pr-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Owner / Director Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={regOwnerName}
                        onChange={(e) => setRegOwnerName(e.target.value)}
                        placeholder="e.g. Ramesh Patel"
                        required
                        className="w-full h-11 pl-10 pr-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Dedicated Email ID & Dedicated Login Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="owner@radhe-textiles.com"
                        required
                        className="w-full h-11 pl-10 pr-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Login Username *</span>
                      <span className="text-[10px] text-blue-600 font-semibold lowercase">for quick login</span>
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                        placeholder="e.g. radhetextiles"
                        required
                        className="w-full h-11 pl-10 pr-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Password *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={regShowPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full h-11 pl-10 pr-10 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setRegShowPassword(!regShowPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={regShowPassword ? "text" : "password"}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full h-11 pl-10 pr-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 4: Phone & GSTIN (Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Phone (Optional)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full h-11 pl-10 pr-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">GSTIN (Optional)</label>
                    <div className="relative">
                      <Receipt className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={regGstin}
                        onChange={(e) => setRegGstin(e.target.value.toUpperCase())}
                        placeholder="24AAAAA0000A1Z5"
                        maxLength={15}
                        className="w-full h-11 pl-10 pr-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs uppercase font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 5: City / Business Address (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">City / Business Address (Optional)</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="e.g. Ring Road, Surat, Gujarat"
                      className="w-full h-11 pl-10 pr-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRegistering || isSendingOtp}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-70 mt-2"
                >
                  {isSendingOtp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Email &amp; Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Register &amp; Launch ERP</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    Already registered? Back to Sign In
                  </button>
                </div>
              </form>
            </div>
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
                        placeholder="owner@shivcreation.com"
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
            Powered &amp; Developed by <strong className="text-slate-700 font-bold">DigiScale Infotech</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6-DIGIT EMAIL VERIFICATION OTP MODAL */}
      {/* ========================================================================= */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-blue-100 space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Email Verification (OTP)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Enter the 6-digit verification code sent to your email
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOtpModalOpen(false);
                  setRegOtp("");
                  setOtpErrorMsg("");
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Email Banner */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-blue-900 min-w-0">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold truncate">{otpSentEmail}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOtpModalOpen(false);
                  setRegOtp("");
                  setOtpErrorMsg("");
                }}
                className="text-[11px] font-bold text-blue-600 hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Change</span>
              </button>
            </div>

            {/* Dev Mode OTP Banner (if available during testing) */}
            {devOtpHint && (
              <div
                onClick={() => setRegOtp(devOtpHint)}
                className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer hover:bg-amber-100/60 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Test Mode OTP: <strong className="font-mono font-black tracking-wider text-amber-900">{devOtpHint}</strong></span>
                </div>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                  Click to Auto-fill
                </span>
              </div>
            )}

            {/* OTP Input Form */}
            <form onSubmit={handleConfirmRegistrationWithOtp} className="space-y-4 pt-1">
              {otpErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{otpErrorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>6-Digit Verification Code *</span>
                  <span className="text-[11px] text-slate-400 font-normal">Valid for 10 minutes</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={regOtp}
                  onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  autoFocus
                  required
                  className="w-full h-12 text-center text-2xl font-black font-mono tracking-[0.4em] bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl text-slate-900 shadow-2xs transition-colors outline-none"
                />
              </div>

              {/* Resend OTP Bar */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Didn&apos;t receive the code?</span>
                {otpCountdown > 0 ? (
                  <span className="text-slate-400 font-semibold text-[11px]">
                    Resend in {otpCountdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isSendingOtp}
                    onClick={handleResendOtp}
                    className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSendingOtp ? "animate-spin" : ""}`} />
                    <span>Resend OTP</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpModalOpen(false);
                    setRegOtp("");
                    setOtpErrorMsg("");
                  }}
                  className="w-1/3 h-11 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regOtp.trim().length !== 6 || isVerifyingOtp}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isVerifyingOtp ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying &amp; Launching...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm &amp; Launch ERP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
