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
  updateUserSession: (data: Partial<UserSession>) => void;
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
    lastLogin: "10:30 AM"
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "texaflow_auth_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.email || parsed.username || parsed.id)) {
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
    const cleanId = emailOrPin.trim();

    try {
      // Connect to Backend API for strict ID & password authentication
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_or_email: cleanId,
          password: password || ""
        })
      });

      if (res.ok) {
        const data = await res.json();
        const session: UserSession = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email || data.user.username,
          role: data.user.role || "Owner",
          roleTitle: data.user.roleTitle || "Proprietor & Director",
          firmName: data.user.firmName || "Om Sai Enterprises",
          lastLogin: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        };
        setUser(session);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
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
        error: "Cannot connect to server. Please verify backend is running on port 8000."
      };
    }
  };

  const updateUserSession = (data: Partial<UserSession>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
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
