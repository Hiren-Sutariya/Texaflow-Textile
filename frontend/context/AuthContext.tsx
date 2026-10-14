"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: "Owner" | "Manager" | "Accounts";
  roleTitle: string;
  firmName: string;
  companyId?: string;
  avatar?: string;
  lastLogin: string;
  expiresAt?: number;
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  login: (emailOrPin: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserSession: (data: Partial<UserSession>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = "texaflow_auth_session";

function resolveSessionTenant(parsed: any): {
  resolvedCompanyId: string;
  firmName: string;
  name: string;
} {
  const isOmSai = 
    parsed?.companyId === "comp-002" ||
    parsed?.company_id === "comp-002" ||
    (typeof parsed?.id === "string" && parsed.id.includes("comp-002")) ||
    parsed?.firmName?.toLowerCase().includes("om sai") ||
    parsed?.firm_name?.toLowerCase().includes("om sai") ||
    parsed?.company_name?.toLowerCase().includes("om sai") ||
    parsed?.email?.includes("om-sai") ||
    parsed?.username?.includes("om-sai") ||
    parsed?.name?.toLowerCase().includes("nilesh");

  const isShiv = 
    parsed?.companyId === "comp-001" ||
    parsed?.company_id === "comp-001" ||
    (typeof parsed?.id === "string" && (parsed.id.includes("comp-001") || parsed.id === "usr-owner-01" || parsed.id === "user-001")) ||
    parsed?.firmName?.toLowerCase().includes("shiv") ||
    parsed?.firm_name?.toLowerCase().includes("shiv") ||
    parsed?.company_name?.toLowerCase().includes("shiv") ||
    parsed?.email?.includes("shiv") ||
    parsed?.username?.includes("shiv") ||
    parsed?.name?.toLowerCase().includes("hiren");

  let resolvedCompanyId = "comp-002";
  if (isShiv && !isOmSai) {
    resolvedCompanyId = "comp-001";
  } else if (isOmSai) {
    resolvedCompanyId = "comp-002";
  } else if (parsed?.companyId && /^comp-\d+$/.test(parsed.companyId)) {
    resolvedCompanyId = parsed.companyId;
  } else if (parsed?.company_id && /^comp-\d+$/.test(parsed.company_id)) {
    resolvedCompanyId = parsed.company_id;
  } else if (typeof parsed?.id === "string") {
    const userMatch = parsed.id.match(/^user-(\d+)$/);
    if (userMatch) resolvedCompanyId = `comp-${userMatch[1]}`;
  }

  let finalFirmName = resolvedCompanyId === "comp-002" ? "Om Sai Enterprise" : (resolvedCompanyId === "comp-001" ? "Shiv Creation" : "Textile Company");
  let finalName = resolvedCompanyId === "comp-002" ? "Nilesh Sutariya" : (resolvedCompanyId === "comp-001" ? "Hiren Sutariya" : "Owner");

  const rawFirm = parsed?.firmName || parsed?.firm_name || parsed?.company_name;
  if (rawFirm && typeof rawFirm === "string" && rawFirm.trim() && !rawFirm.toLowerCase().includes("texaflow") && rawFirm.toLowerCase() !== "company") {
    const cleanFirm = rawFirm.trim();
    if (resolvedCompanyId === "comp-002" && !cleanFirm.toLowerCase().includes("shiv")) {
      finalFirmName = cleanFirm;
    } else if (resolvedCompanyId === "comp-001" && !cleanFirm.toLowerCase().includes("om sai")) {
      finalFirmName = cleanFirm;
    } else if (resolvedCompanyId !== "comp-001" && resolvedCompanyId !== "comp-002") {
      finalFirmName = cleanFirm;
    }
  }

  const rawName = parsed?.name || parsed?.owner_name;
  if (rawName && typeof rawName === "string" && rawName.trim() && rawName !== "Factory Admin" && rawName.toLowerCase() !== "owner") {
    const cleanName = rawName.trim();
    if (resolvedCompanyId === "comp-002" && !cleanName.toLowerCase().includes("hiren")) {
      finalName = cleanName;
    } else if (resolvedCompanyId === "comp-001" && !cleanName.toLowerCase().includes("nilesh")) {
      finalName = cleanName;
    } else if (resolvedCompanyId !== "comp-001" && resolvedCompanyId !== "comp-002") {
      finalName = cleanName;
    }
  }

  return {
    resolvedCompanyId,
    firmName: finalFirmName,
    name: finalName
  };
}

function getInitialAuthSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed || (!parsed.email && !parsed.username && !parsed.id)) return null;
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) return null;

    const tenant = resolveSessionTenant(parsed);
    parsed.companyId = tenant.resolvedCompanyId;
    parsed.company_id = tenant.resolvedCompanyId;
    parsed.firmName = tenant.firmName;
    parsed.name = tenant.name;

    if (!parsed.roleTitle || parsed.roleTitle === "Owner Account") {
      parsed.roleTitle = "Proprietor & Director";
    }

    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(getInitialAuthSession);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.email || parsed.username || parsed.id)) {
          // Check expiration (4 hours limit)
          if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            localStorage.removeItem(SESSION_STORAGE_KEY);
            setUser(null);
          } else {
            const tenant = resolveSessionTenant(parsed);
            parsed.companyId = tenant.resolvedCompanyId;
            parsed.company_id = tenant.resolvedCompanyId;
            parsed.firmName = tenant.firmName;
            parsed.name = tenant.name;

            if (!parsed.roleTitle || parsed.roleTitle === "Owner Account") {
              parsed.roleTitle = "Proprietor & Director";
            }

            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
            setUser(parsed);

            // Fetch live user & company details from backend strictly matching company_id
            const cid = tenant.resolvedCompanyId;
            const uid = parsed.id || "";
            fetch(`${API_BASE_URL}/auth/credentials?company_id=${cid}&user_id=${uid}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((cred) => {
                if (cred && cred.success && (cred.company_id === cid || cred.companyId === cid)) {
                  let changed = false;
                  if (cred.name && cred.name.trim() && cred.name !== "Factory Admin" && cred.name.toLowerCase() !== "owner" && parsed.name !== cred.name.trim()) {
                    parsed.name = cred.name.trim();
                    changed = true;
                  }
                  if (cred.firm_name && cred.firm_name.trim() && !cred.firm_name.toLowerCase().includes("texaflow") && cred.firm_name.toLowerCase() !== "company" && parsed.firmName !== cred.firm_name.trim()) {
                    parsed.firmName = cred.firm_name.trim();
                    changed = true;
                  }
                  if (changed) {
                    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
                    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
                    setUser({ ...parsed });
                  }
                }
              })
              .catch(() => {});
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Failed to parse auth session", e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (emailOrPin: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanId = emailOrPin.trim();

    try {
      // Connect to Backend API for strict ID & password authentication
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_or_email: cleanId,
          password: password || ""
        })
      });

      if (res.ok) {
        const data = await res.json();
        const tenant = resolveSessionTenant({
          ...data.user,
          firmName: data.user.firmName,
          companyId: data.user.companyId || data.user.company_id
        });

        const session: UserSession = {
          id: data.user.id,
          name: tenant.name,
          email: data.user.email || data.user.username,
          username: data.user.username || data.user.email,
          role: data.user.role || "Owner",
          roleTitle: data.user.roleTitle || "Proprietor & Director",
          firmName: tenant.firmName,
          companyId: tenant.resolvedCompanyId,
          lastLogin: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          expiresAt: Date.now() + 4 * 60 * 60 * 1000 // Valid for 4 hours
        };
        setUser(session);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        return { success: true };
      } else {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          error: errData.detail || "Invalid User ID or Password. Please try again."
        };
      }
    } catch (networkErr) {
      console.error("Backend login network error:", networkErr);
      return {
        success: false,
        error: "Cannot connect to server. Please verify your internet connection."
      };
    }
  };

  const updateUserSession = (data: Partial<UserSession>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem("texaflow_auth_session");
    } catch (e) {
      console.error(e);
    }
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        updateUserSession,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
