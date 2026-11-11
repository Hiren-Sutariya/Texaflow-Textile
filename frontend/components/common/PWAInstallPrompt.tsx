"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, PlusSquare, Smartphone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const { language } = useLanguage();
  const isGujarati = language === "gu";
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // 2. Check if already installed / standalone mode
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isRunningStandalone);
    if (isRunningStandalone) return;

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Capture standard Android/Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user previously dismissed today
      const dismissedUntil = localStorage.getItem("texaflow_pwa_dismissed_until");
      if (!dismissedUntil || Date.now() > Number(dismissedUntil)) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS, show installation hint once if not dismissed
    if (isIosDevice) {
      const dismissedUntil = localStorage.getItem("texaflow_pwa_dismissed_until");
      if (!dismissedUntil || Date.now() > Number(dismissedUntil)) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    // Hide for 7 days
    localStorage.setItem("texaflow_pwa_dismissed_until", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 flex items-start gap-3.5 backdrop-blur-md">
        {/* App Icon */}
        <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shrink-0 shadow-md">
          <Smartphone className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-extrabold text-sm text-white tracking-tight">
              {isGujarati ? "TexaFlow એપ ઇન્સ્ટોલ કરો" : "Install TexaFlow App"}
            </h4>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {isGujarati
              ? "તમારા મોબાઈલની હોમ સ્ક્રીન પર એક ક્લિકમાં એપ મેળવો (સંપૂર્ણ ફુલ સ્ક્રીન)."
              : "Install TexaFlow on your home screen for quick, full-screen mobile access."}
          </p>

          {/* Action button */}
          <div className="mt-3 flex items-center gap-2">
            {isIOS ? (
              <div className="text-[11px] font-semibold text-blue-300 flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                <span>{isGujarati ? "ટેપ કરો" : "Tap"}</span>
                <Share className="w-3.5 h-3.5 text-blue-400" />
                <span>{isGujarati ? "અને પછી 'Add to Home Screen' દબાવો" : "then 'Add to Home Screen'"}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleInstallClick}
                className="h-8.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGujarati ? "એપ ઇન્સ્ટોલ કરો" : "Install Now"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              className="h-8.5 px-3 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {isGujarati ? "પછીથી" : "Later"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;
