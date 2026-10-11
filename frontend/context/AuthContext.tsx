"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Manager" | "Accounts";
  roleTitle: string;
  firmName: string;
  avatar?: string;
  lastLogin: string;
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  login: (emailOrPin: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const DEFAULT_USERS: Record<string, UserSession> = {
  owner: {
    id: "usr-owner-01",
    name: "Hiren Sutariya",
    email: "owner@om-sai.com",
    role: "Owner",
    roleTitle: "Proprietor & Director",
    firmName: "Om Sai Enterprises",
    lastLogin: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  },
  manager: {
    id: "usr-mgr-02",
    name: "Rajesh Panchal",
    email: "manager@om-sai.com",
    role: "Manager",
    roleTitle: "Production & Floor Manager",
    firmName: "Om Sai Enterprises",
    lastLogin: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  },
  accounts: {
    id: "usr-acc-03",
    name: "Pravin Mehta",
    email: "accounts@om-sai.com",
    role: "Accounts",
    roleTitle: "Chief Accountant & Auditor",
    firmName: "Om Sai Enterprises",
    lastLogin: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "texaflow_auth_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to parse auth session", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (emailOrPin: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    // Artificial small delay for realistic smooth transition
    await new Promise((r) => setTimeout(r, 400));

    const query = emailOrPin.trim().toLowerCase();

    // Check PIN login (6-digit PIN)
    if (query === "123456" || query === "999999" || query === "7777") {
      const session = DEFAULT_USERS.owner;
      setUser(session);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return { success: true };
    }

    // Check by role key or email
    if (query.includes("owner") || query === "admin" || query === "owner@om-sai.com") {
      if (!password || password.trim().length >= 3) {
        const session = DEFAULT_USERS.owner;
        setUser(session);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        return { success: true };
      }
      return { success: false, error: "Incorrect password for Owner account" };
    }

    if (query.includes("manager") || query === "manager@om-sai.com") {
      const session = DEFAULT_USERS.manager;
      setUser(session);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return { success: true };
    }

    if (query.includes("account") || query === "accounts@om-sai.com") {
      const session = DEFAULT_USERS.accounts;
      setUser(session);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return { success: true };
    }

    // Default fallback - allow any legitimate looking email or user
    if (query.length > 2) {
      const customSession: UserSession = {
        id: `usr-${Date.now()}`,
        name: query.split("@")[0].toUpperCase() || "Authorized User",
        email: query.includes("@") ? query : `${query}@om-sai.com`,
        role: "Owner",
        roleTitle: "Authorized ERP Operator",
        firmName: "Om Sai Enterprises",
        lastLogin: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      };
      setUser(customSession);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customSession));
      return { success: true };
    }

    return { success: false, error: "Please enter valid credentials or select a quick demo profile." };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
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
