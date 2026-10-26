"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  Keyboard,
  X,
  Truck,
  ShoppingCart,
  Receipt,
  CreditCard,
  BookOpen,
  Sparkles,
  FileCheck,
  Edit3,
  RotateCcw,
  Check,
  Laptop
} from "lucide-react";
import {
  ShortcutBinding,
  isMacUser,
  getSavedShortcuts,
  saveShortcuts,
  resetShortcuts,
  formatShortcutDisplay,
  matchesShortcut
} from "@/lib/shortcutsStorage";

const ICON_MAP: Record<string, any> = {
  Truck,
  FileCheck,
  ShoppingCart,
  Receipt,
  CreditCard,
  BookOpen,
  Sparkles
};

export function KeyboardShortcutsModal() {
  const router = useRouter();
  const { language } = useLanguage();
  const isGujarati = language === "gu";

  const [isOpen, setIsOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutBinding[]>([]);
  const [isMac, setIsMac] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load shortcuts on mount & listen for updates
  useEffect(() => {
    setIsMac(isMacUser());
    setShortcuts(getSavedShortcuts());

    const handleShortcutsUpdate = () => {
      setShortcuts(getSavedShortcuts());
    };

    window.addEventListener("om_sai_shortcuts_updated", handleShortcutsUpdate);
    return () => {
      window.removeEventListener("om_sai_shortcuts_updated", handleShortcutsUpdate);
    };
  }, []);

  // Global Keydown Listener for execution & modal toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. If currently recording a shortcut inside modal, do nothing here (handled by recorder)
      if (recordingId) return;

      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // 2. Escape closes modal
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setIsCustomizing(false);
        setRecordingId(null);
        return;
      }

      // 3. Shift + ? or / to toggle shortcuts modal (when not inside form input)
      if ((e.key === "?" || (e.shiftKey && e.key === "/")) && !isInput) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // If typing in form input, skip execution of navigation shortcuts
      if (isInput) return;

      // 4. Match against active shortcuts
      const currentShortcuts = getSavedShortcuts();
      for (const sc of currentShortcuts) {
        if (matchesShortcut(e, sc)) {
          e.preventDefault();
          setIsOpen(false);
          setIsCustomizing(false);
          setRecordingId(null);
          if (sc.route) {
            router.push(sc.route);
          }
          break;
        }
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("app_open_keyboard_shortcuts", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("app_open_keyboard_shortcuts", handleCustomOpen);
    };
  }, [isOpen, recordingId, router]);

  // Key Recording Listener when user is customizing a specific shortcut
  useEffect(() => {
    if (!recordingId) return;

    const handleRecordKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Cancel on Escape
      if (e.key === "Escape") {
        setRecordingId(null);
        return;
      }

      // Ignore if only a modifier key is pressed
      if (["Alt", "Control", "Meta", "Shift"].includes(e.key)) {
        return;
      }

      // We have a modifier + key or single key (like F1-F12)
      const cleanKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const cleanCode = e.code;

      const updated = shortcuts.map((sc) => {
        if (sc.id === recordingId) {
          return {
            ...sc,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
            shiftKey: e.shiftKey,
            key: cleanKey,
            code: cleanCode
          };
        }
        return sc;
      });

      setShortcuts(updated);
      saveShortcuts(updated);
      setRecordingId(null);
      setSuccessMsg(isGujarati ? "શોર્ટકટ કી સફળતાપૂર્વક બદલાઈ ગઈ!" : "Shortcut updated successfully!");
      setTimeout(() => setSuccessMsg(null), 2500);
    };

    window.addEventListener("keydown", handleRecordKey, true);
    return () => {
      window.removeEventListener("keydown", handleRecordKey, true);
    };
  }, [recordingId, shortcuts, isGujarati]);

  const handleResetDefaults = () => {
    if (
      confirm(
        isGujarati
          ? "શું તમે બધા શોર્ટકટ્સ મૂળભૂત (Default) સેટિંગ્સ મુજબ કરવા માંગો છો?"
          : "Are you sure you want to reset all shortcuts to defaults?"
      )
    ) {
      const defs = resetShortcuts();
      setShortcuts(defs);
      setRecordingId(null);
      setSuccessMsg(isGujarati ? "ડિફોલ્ટ સેટિંગ્સ લાગુ થઈ ગઈ!" : "Reset to defaults successfully!");
      setTimeout(() => setSuccessMsg(null), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150 text-xs font-sans">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-slate-900 text-sm">
                  {isGujarati ? "કીબોર્ડ શોર્ટકટ કીઝ (Shortcuts)" : "Keyboard Shortcuts"}
                </h2>
                {isMac && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-200/80 text-[10px] font-bold text-slate-700">
                    <Laptop className="w-3 h-3 text-slate-500" />
                    MacBook
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {isGujarati
                  ? "બિલિંગ અને વાઉચર્સ માટે મનપસંદ શોર્ટકટ કી વાપરો"
                  : "Speed up daily billing and factory workflows"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsCustomizing((prev) => !prev);
                setRecordingId(null);
              }}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] ${
                isCustomizing
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
              title={isGujarati ? "કીબોર્ડ શોર્ટકટ્સ કસ્ટમાઇઝ કરો" : "Customize shortcuts"}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isCustomizing ? (isGujarati ? "પૂર્ણ" : "Done") : (isGujarati ? "બદલો" : "Edit")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsCustomizing(false);
                setRecordingId(null);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {successMsg && (
          <div className="px-5 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2 text-emerald-800 text-[11px] font-bold animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* CUSTOMIZE MODE INSTRUCTION */}
        {isCustomizing && (
          <div className="px-5 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
            <p className="text-[11px] text-blue-900 font-medium">
              {isGujarati
                ? "જે શોર્ટકટ બદલવો હોય તેની સામે 'કી સેટ કરો' પર ક્લિક કરી તમારા કીબોર્ડ પરથી કી દબાવો."
                : "Click 'Set Key' next to an action and press any key combo on your keyboard."}
            </p>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-[10px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer shrink-0 ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              {isGujarati ? "મૂળભૂત (Default)" : "Reset"}
            </button>
          </div>
        )}

        {/* SHORTCUTS LIST */}
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((s) => {
            const Icon = ICON_MAP[s.icon] || Keyboard;
            const isRecording = recordingId === s.id;
            const keyBadges = formatShortcutDisplay(s, isMac);

            return (
              <div
                key={s.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                  isRecording
                    ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-200"
                    : "hover:bg-slate-50 border-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${s.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">
                      {isGujarati ? s.labelGu : s.labelEn}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {isGujarati ? s.labelEn : s.labelGu}
                    </span>
                  </div>
                </div>

                {/* KEY DISPLAY OR RECORDING BUTTON */}
                <div className="flex items-center gap-2 shrink-0">
                  {isRecording ? (
                    <div className="flex items-center gap-1.5 animate-pulse bg-amber-100/80 text-amber-900 px-3 py-1 rounded-xl border border-amber-300 font-bold text-[11px]">
                      <span>{isGujarati ? "કોઈપણ કી દબાવો..." : "Press keys now..."}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecordingId(null);
                        }}
                        className="text-amber-700 hover:text-amber-950 ml-1 font-black"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {keyBadges.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="min-w-[24px] h-6 px-2 bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-mono font-black text-slate-700 flex items-center justify-center shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  )}

                  {isCustomizing && !isRecording && (
                    <button
                      type="button"
                      onClick={() => setRecordingId(s.id)}
                      className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
                    >
                      {isGujarati ? "કી સેટ કરો" : "Set Key"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* STATIC SHORTCUTS (GLOBAL COMMAND / HELP) */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/50 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 bg-amber-50 text-amber-700 border-amber-200">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800 text-xs block">
                  {isGujarati ? "ક્વિક એક્શન કમાન્ડ મેનૂ" : "Quick Action Command Menu"}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {isMac ? "Command + K" : "Control + K"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <kbd className="min-w-[24px] h-6 px-2 bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-mono font-black text-slate-700 flex items-center justify-center shadow-2xs">
                {isMac ? "⌘ Cmd" : "Ctrl"}
              </kbd>
              <kbd className="min-w-[24px] h-6 px-2 bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-mono font-black text-slate-700 flex items-center justify-center shadow-2xs">
                K
              </kbd>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/50 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 bg-slate-100 text-slate-700 border-slate-200">
                <Keyboard className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800 text-xs block">
                  {isGujarati ? "આ શોર્ટકટ ગાઈડ બતાવો" : "Show This Shortcuts Guide"}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Shift + /
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <kbd className="min-w-[24px] h-6 px-2 bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-mono font-black text-slate-700 flex items-center justify-center shadow-2xs">
                ?
              </kbd>
            </div>
          </div>
        </div>

        {/* FOOTER TIP */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-medium px-5">
          <span>
            {isMac
              ? (isGujarati ? "MacBook પર ⌥ Option અથવા ⌘ Cmd સાથે કી વાપરો" : "On MacBook use with ⌥ Option or ⌘ Command")
              : (isGujarati ? "Windows પર Alt અથવા Ctrl સાથે કી વાપરો" : "On Windows use with Alt or Ctrl")}
          </span>
          <kbd className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold">
            Esc to close
          </kbd>
        </div>

      </div>
    </div>
  );
}
