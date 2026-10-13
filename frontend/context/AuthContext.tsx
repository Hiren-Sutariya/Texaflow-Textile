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

function getInitialAuthSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed || (!parsed.email && !parsed.username && !parsed.id)) return null;
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) return null;

    let resolvedCompanyId = parsed.companyId;
    if (parsed.id && typeof parsed.id === "string" && parsed.id.includes("comp-")) {
      const m = parsed.id.match(/(comp-\d+)/);
      if (m) resolvedCompanyId = m[1];
    }
    if (!resolvedCompanyId || !/^comp-\d+$/.test(resolvedCompanyId)) {
      resolvedCompanyId = "comp-001";
    }

    parsed.companyId = resolvedCompanyId;

    // Synchronously resolve real name from local tenant settings if missing or placeholder
    if (!parsed.name || parsed.name === "Factory Admin") {
      const savedTenant = localStorage.getItem(`app_settings_${resolvedCompanyId}`);
      if (savedTenant) {
        try {
          const p = JSON.parse(savedTenant);
          if (p?.owner_name && typeof p.owner_name === "string" && p.owner_name.trim()) {
            parsed.name = p.owner_name.trim();
          }
        } catch {}
      }
      if (!parsed.name && resolvedCompanyId === "comp-001") {
        parsed.name = "Hiren Sutariya";
      }
    }

    // Synchronously resolve real firm name from local tenant settings if missing or placeholder
    if (!parsed.firmName || parsed.firmName.toLowerCase().includes("texaflow")) {
      const savedTenant = localStorage.getItem(`app_settings_${resolvedCompanyId}`);
      if (savedTenant) {
        try {
          const p = JSON.parse(savedTenant);
          if (p?.company_name && typeof p.company_name === "string" && p.company_name.trim()) {
            parsed.firmName = p.company_name.trim();
          } else if (p?.brand_name && typeof p.brand_name === "string" && p.brand_name.trim()) {
            parsed.firmName = p.brand_name.trim();
          }
        } catch {}
      }
      if (!parsed.firmName && resolvedCompanyId === "comp-001") {
        parsed.firmName = "Shiv Creation";
      }
    }

    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(getInitialAuthSession);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem(SESSION_STORAGE_KEY);
    }
    return true;
  });
  const router = useRouter();

  useEffect(() => {
    try {
      // 1. Purge legacy persistent localStorage sessions to prevent infinite logins
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem("texaflow_auth_session");

      // 2. Only read from sessionStorage (strictly cleared when browser/tab closes)
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.email || parsed.username || parsed.id)) {
          // Check expiration (4 hours limit)
          if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            setUser(null);
          } else {
            let resolvedCompanyId = parsed.companyId;
            if (parsed.id && typeof parsed.id === "string" && parsed.id.includes("comp-")) {
              const m = parsed.id.match(/(comp-\d+)/);
              if (m) resolvedCompanyId = m[1];
            }
            if (!resolvedCompanyId || !/^comp-\d+$/.test(resolvedCompanyId)) {
              resolvedCompanyId = "comp-001";
            }

            parsed.companyId = resolvedCompanyId;
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
            setUser(parsed);

            // Fetch live user & company details from backend to ensure real owner name and firm name
            const cid = resolvedCompanyId;
            const uid = parsed.id || "";
            fetch(`${API_BASE_URL}/auth/credentials?company_id=${cid}&user_id=${uid}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((cred) => {
                if (cred && cred.success) {
                  let changed = false;
                  if (cred.name && cred.name.trim() && cred.name !== "Factory Admin" && parsed.name !== cred.name.trim()) {
                    parsed.name = cred.name.trim();
                    changed = true;
                  }
                  if (cred.firm_name && cred.firm_name.trim() && !cred.firm_name.toLowerCase().includes("texaflow") && parsed.firmName !== cred.firm_name.trim()) {
                    parsed.firmName = cred.firm_name.trim();
                    changed = true;
                  }
                  if (changed) {
                    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
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
        let resolvedCompanyId = data.user.companyId;
        if (!resolvedCompanyId || !/^comp-\d+$/.test(resolvedCompanyId)) {
          if (data.user.id && data.user.id.includes("comp-")) {
            const m = data.user.id.match(/(comp-\d+)/);
            if (m) resolvedCompanyId = m[1];
          } else {
            resolvedCompanyId = "comp-001";
          }
        }

        const fallbackFirm = resolvedCompanyId === "comp-001" ? "Shiv Creation" : "Company";
        const finalFirmName = data.user.firmName && !data.user.firmName.toLowerCase().includes("texaflow") ? data.user.firmName : fallbackFirm;
        const finalName = data.user.name && data.user.name.trim() && data.user.name !== "Factory Admin" ? data.user.name.trim() : (resolvedCompanyId === "comp-001" ? "Hiren Sutariya" : "Owner");

        const session: UserSession = {
          id: data.user.id,
          name: finalName,
          email: data.user.email || data.user.username,
          username: data.user.username || data.user.email,
          role: data.user.role || "Owner",
          roleTitle: data.user.roleTitle || "Proprietor & Director",
          firmName: finalFirmName,
          companyId: resolvedCompanyId,
          lastLogin: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          expiresAt: Date.now() + 4 * 60 * 60 * 1000 // Valid for 4 hours
        };
        setUser(session);
        // Save ONLY in sessionStorage - completely wiped when browser closes!
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem("texaflow_auth_session");
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
