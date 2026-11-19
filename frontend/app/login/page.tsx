"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LoginScreen } from "@/components/auth/LoginScreen";

export default function LoginPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (user?.role === "SuperAdmin") {
        router.push("/platform");
      } else {
        router.push("/");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <LoginScreen 
      onSuccess={() => {
        if (user?.role === "SuperAdmin") {
          router.push("/platform");
        } else {
          router.push("/");
        }
      }} 
    />
  );
}
