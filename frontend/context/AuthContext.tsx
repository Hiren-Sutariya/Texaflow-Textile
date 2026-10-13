"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";

export interface UserSession {
  id: string;
  name: string;
  email: string;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.email || parsed.username || parsed.id)) {
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
              sessionStorage.removeItem(SESSION_STORAGE_KEY);
              return null;
            }
            let resolvedCompanyId = parsed.companyId;
            if (parsed.id && parsed.id.includes("comp-")) {
              const m = parsed.id.match(/(comp-\d+)/);
              if (m) resolvedCompanyId = m[1];
            } else if (parsed.firmName && parsed.firmName.toLowerCase().includes("radhe")) {
              resolvedCompanyId = "comp-002";
            } else if (parsed.firmName && !parsed.firmName.toLowerCase().includes("om sai") && parsed.companyId === "comp-001") {
              resolvedCompanyId = `comp-${parsed.firmName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}`;
            }
            if (resolvedCompanyId) parsed.companyId = resolvedCompanyId;
            return parsed;
          }
        }
      } catch {}
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.email || parsed.username || parsed.id)) {
            if (!parsed.expiresAt || Date.now() <= parsed.expiresAt) {
              return false;
            }
          }
        }
      } catch {}
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
          // Auto-reconcile companyId if session has legacy or mismatched companyId
          let resolvedCompanyId = parsed.companyId;
          if (parsed.id && parsed.id.includes("comp-")) {
            const m = parsed.id.match(/(comp-\d+)/);
            if (m) resolvedCompanyId = m[1];
          } else if (parsed.firmName && parsed.firmName.toLowerCase().includes("radhe")) {
            resolvedCompanyId = "comp-002";
          } else if (parsed.firmName && !parsed.firmName.toLowerCase().includes("om sai") && parsed.companyId === "comp-001") {
            resolvedCompanyId = `comp-${parsed.firmName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}`;
          }
            if (resolvedCompanyId && resolvedCompanyId !== parsed.companyId) {
              parsed.companyId = resolvedCompanyId;
              sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
            }
            setUser(parsed);
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
        if (!resolvedCompanyId) {
          if (data.user.id && data.user.id.includes("comp-")) {
            const m = data.user.id.match(/(comp-\d+)/);
            if (m) resolvedCompanyId = m[1];
          } else if (data.user.firmName && !data.user.firmName.toLowerCase().includes("om sai")) {
            resolvedCompanyId = `comp-${data.user.firmName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}`;
          } else {
            resolvedCompanyId = "comp-001";
          }
        }

        const session: UserSession = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email || data.user.username,
          role: data.user.role || "Owner",
          roleTitle: data.user.roleTitle || "Proprietor & Director",
          firmName: data.user.firmName || "Om Sai Enterprises",
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
