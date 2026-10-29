"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL, invalidateApiCache } from "@/lib/api";
import { useRouter } from "next/navigation";
import { setTenantCookie, clearTenantCookie } from "@/lib/cookieStorage";
import { clearTenantData } from "@/lib/tenantStorage";

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
  loginWithGoogle: (data: { credential?: string; email?: string; name?: string; companyName?: string; picture?: string }) => Promise<{ success: boolean; error?: string; message?: string }>;
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
  const directCid = parsed?.companyId || parsed?.company_id;
  const rawEmail = (parsed?.email || "").toLowerCase().trim();
  const rawUsername = (parsed?.username || "").toLowerCase().trim();
  const rawId = typeof parsed?.id === "string" ? parsed.id.trim() : "";
  const rawFirm = typeof (parsed?.firmName || parsed?.firm_name || parsed?.company_name) === "string" 
    ? (parsed?.firmName || parsed?.firm_name || parsed?.company_name).toLowerCase().trim() 
    : "";
  const rawName = typeof (parsed?.name || parsed?.owner_name) === "string"
    ? (parsed?.name || parsed?.owner_name).toLowerCase().trim()
    : "";

  let resolvedCompanyId = "";

  // 1. Direct authoritative check on company ID first
  if (directCid === "comp-001") {
    resolvedCompanyId = "comp-001";
  } else if (directCid === "comp-002") {
    resolvedCompanyId = "comp-002";
  } else if (rawEmail.includes("shiv") || rawUsername.includes("shiv")) {
    resolvedCompanyId = "comp-001";
  } else if (rawEmail.includes("om-sai") || rawUsername.includes("om-sai") || rawEmail.includes("omsai") || rawUsername.includes("omsai")) {
    resolvedCompanyId = "comp-002";
  } else if (rawId === "user-001" || rawId === "usr-owner-01" || rawId.includes("comp-001")) {
    resolvedCompanyId = "comp-001";
  } else if (rawId === "user-002" || rawId.includes("comp-002")) {
    resolvedCompanyId = "comp-002";
  } else if (rawFirm.includes("shiv")) {
    resolvedCompanyId = "comp-001";
  } else if (rawFirm.includes("om sai") || rawFirm.includes("omsai")) {
    resolvedCompanyId = "comp-002";
  } else if (rawName.includes("hiren")) {
    resolvedCompanyId = "comp-001";
  } else if (rawName.includes("nilesh")) {
    resolvedCompanyId = "comp-002";
  } else if (directCid && /^comp-\d+$/.test(directCid)) {
    resolvedCompanyId = directCid;
  } else if (rawId) {
    const userMatch = rawId.match(/^user-(\d+)$/);
    if (userMatch) resolvedCompanyId = `comp-${userMatch[1]}`;
  }

  if (!resolvedCompanyId) {
    resolvedCompanyId = "comp-001";
  }

  let finalFirmName = resolvedCompanyId === "comp-001" 
    ? "Shiv Creation" 
    : (resolvedCompanyId === "comp-002" ? "Om Sai Enterprise" : "Textile Company");

  let finalName = resolvedCompanyId === "comp-001" 
    ? "Hiren Sutariya" 
    : (resolvedCompanyId === "comp-002" ? "Nilesh Sutariya" : "Owner");

  const rawOriginalFirm = parsed?.firmName || parsed?.firm_name || parsed?.company_name;
  if (rawOriginalFirm && typeof rawOriginalFirm === "string" && rawOriginalFirm.trim() && !rawOriginalFirm.toLowerCase().includes("texaflow") && rawOriginalFirm.toLowerCase() !== "company") {
    const cleanFirm = rawOriginalFirm.trim();
    if (resolvedCompanyId === "comp-001" && !cleanFirm.toLowerCase().includes("om sai")) {
      finalFirmName = cleanFirm;
    } else if (resolvedCompanyId === "comp-002" && !cleanFirm.toLowerCase().includes("shiv")) {
      finalFirmName = cleanFirm;
    } else if (resolvedCompanyId !== "comp-001" && resolvedCompanyId !== "comp-002") {
      finalFirmName = cleanFirm;
    }
  }

  const rawOriginalName = parsed?.name || parsed?.owner_name;
  if (rawOriginalName && typeof rawOriginalName === "string" && rawOriginalName.trim() && rawOriginalName !== "Factory Admin" && rawOriginalName.toLowerCase() !== "owner") {
    const cleanName = rawOriginalName.trim();
    if (resolvedCompanyId === "comp-001" && !cleanName.toLowerCase().includes("nilesh")) {
      finalName = cleanName;
    } else if (resolvedCompanyId === "comp-002" && !cleanName.toLowerCase().includes("hiren")) {
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

    setTenantCookie(tenant.resolvedCompanyId, tenant.firmName, tenant.name);
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
            clearTenantCookie();
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
            sessionStorage.setItem("texaflow_active_company_id", tenant.resolvedCompanyId);
            localStorage.setItem("texaflow_active_company_id", tenant.resolvedCompanyId);
            setTenantCookie(tenant.resolvedCompanyId, tenant.firmName, tenant.name);
            setUser(parsed);

            // Fetch live user & company details from backend strictly matching company_id
            const cid = tenant.resolvedCompanyId;
            const uid = parsed.id || "";
            fetch(`${API_BASE_URL}/auth/credentials?company_id=${cid}&user_id=${uid}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((cred) => {
                if (cred && cred.success && (cred.company_id === cid || cred.companyId === cid)) {
                  let changed = false;
                  // Strict guard against cross-tenant contamination:
                  if (cid === "comp-001" && cred.name && cred.name.toLowerCase().includes("nilesh")) return;
                  if (cid === "comp-002" && cred.name && cred.name.toLowerCase().includes("hiren")) return;
                  if (cid === "comp-001" && cred.firm_name && cred.firm_name.toLowerCase().includes("om sai")) return;
                  if (cid === "comp-002" && cred.firm_name && cred.firm_name.toLowerCase().includes("shiv")) return;

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
                    setTenantCookie(cid, parsed.firmName, parsed.name);
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
    const cleanPassword = (password || "").trim();

    try {
      // Connect to Backend API for strict ID & password authentication directly from database
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_or_email: cleanId,
          password: cleanPassword
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
        const prevSessionRaw = typeof window !== "undefined" ? localStorage.getItem(SESSION_STORAGE_KEY) : null;
        if (prevSessionRaw) {
          try {
            const prev = JSON.parse(prevSessionRaw);
            if (prev.id !== data.user.id || prev.companyId !== tenant.resolvedCompanyId) {
              invalidateApiCache();
            }
          } catch {}
        }

        setUser(session);
        if (data.token || data.access_token) {
          const jwtToken = data.token || data.access_token;
          sessionStorage.setItem("texaflow_auth_token", jwtToken);
          localStorage.setItem("texaflow_auth_token", jwtToken);
        }
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        sessionStorage.setItem("texaflow_active_company_id", tenant.resolvedCompanyId);
        localStorage.setItem("texaflow_active_company_id", tenant.resolvedCompanyId);
        setTenantCookie(tenant.resolvedCompanyId, tenant.firmName, tenant.name);
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

  const loginWithGoogle = async (data: {
    credential?: string;
    email?: string;
    name?: string;
    companyName?: string;
    picture?: string;
  }): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: data.credential || null,
          email: data.email || null,
          name: data.name || null,
          company_name: data.companyName || null,
          picture: data.picture || null
        })
      });

      if (res.ok) {
        const json = await res.json();
        const u = json.user;
        const tenant = resolveSessionTenant(u);

        const session: UserSession = {
          id: u.id,
          name: tenant.name || u.name,
          email: u.email || "",
          username: u.username || "",
          role: "Owner",
          roleTitle: "Proprietor & Director",
          firmName: tenant.firmName || u.firmName,
          companyId: tenant.resolvedCompanyId || u.companyId,
          avatar: u.avatar || data.picture || "",
          lastLogin: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          expiresAt: Date.now() + 4 * 60 * 60 * 1000
        };

        setUser(session);
        if (json.token || json.access_token) {
          const jwtToken = json.token || json.access_token;
          sessionStorage.setItem("texaflow_auth_token", jwtToken);
          localStorage.setItem("texaflow_auth_token", jwtToken);
        }
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        setTenantCookie(session.companyId || tenant.resolvedCompanyId, session.firmName, session.name);
        return { success: true, message: json.message };
      } else {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          error: errData.detail || "Google authentication failed. Please try again."
        };
      }
    } catch (networkErr) {
      console.error("Google auth network error:", networkErr);
      return {
        success: false,
        error: "Cannot connect to server. Please verify your connection."
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
        if (updated.companyId) {
          setTenantCookie(updated.companyId, updated.firmName, updated.name);
        }
      } catch {}
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem("texaflow_auth_token");
      localStorage.removeItem("texaflow_auth_token");
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem("texaflow_auth_session");
      sessionStorage.removeItem("texaflow_active_company_id");
      localStorage.removeItem("texaflow_active_company_id");
      clearTenantCookie();
      clearTenantData();
      invalidateApiCache();
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
        loginWithGoogle,
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
