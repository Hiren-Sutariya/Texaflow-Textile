"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, Globe, Check, AlertCircle } from "lucide-react";
import { transliterateGujlishSentence } from "@/lib/translations";

interface VoiceTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChangeValue: (val: string) => void;
  defaultLang?: "gu-IN" | "en-IN" | "hi-IN";
}

export function VoiceTextarea({
  value,
  onChangeValue,
  defaultLang = "gu-IN",
  placeholder = "Add optional expense description, items purchased or notes...",
  rows = 3,
  className = "",
  ...rest
}: VoiceTextareaProps) {
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<"gu-IN" | "en-IN" | "hi-IN">(defaultLang);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Soft audio beep feedback for tactile sensation
  const playAudioTone = useCallback((frequency = 580, duration = 0.09) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext policy fallback
    }
  }, []);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechLang;

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMsg(null);
      playAudioTone(640, 0.1);
    };

    recognition.onresult = (event: any) => {
      let currentFinal = "";
      let currentInterim = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentFinal += transcriptPart;
        } else {
          currentInterim += transcriptPart;
        }
      }

      if (currentFinal) {
        // Transliterate Gujlish terms into proper Gujarati
        const processed = transliterateGujlishSentence(currentFinal.trim());
        onChangeValue(value ? `${value.trim()} ${processed}` : processed);
        setInterimTranscript("");
      } else {
        setInterimTranscript(currentInterim);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech Recognition Event:", event.error);
      if (event.error === "not-allowed") {
        setErrorMsg("કૃપા કરીને બ્રાઉઝરમાં માઇક્રોફોન મંજૂરી (Allow Mic) આપો.");
      } else if (event.error !== "no-speech") {
        setErrorMsg("અવાજ ઓળખવામાં ક્ષતિ આવી. ફરી પ્રયાસ કરો.");
      }
      setIsListening(false);
      setInterimTranscript("");
      playAudioTone(320, 0.15);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [speechLang, value, onChangeValue, playAudioTone]);

  // Click outside to close language menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("તમારા બ્રાઉઝરમાં સ્પીચ-ટુ-ટેક્સ્ટ સપોર્ટ નથી. કૃપા કરીને Google Chrome અથવા Safari વાપરો.");
        return;
      }
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      setInterimTranscript("");
      playAudioTone(480, 0.08);
    } else {
      setErrorMsg(null);
      try {
        recognitionRef.current.lang = speechLang;
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Speech start issue, restarting instance:", err);
        try {
          recognitionRef.current?.stop();
          setTimeout(() => recognitionRef.current?.start(), 150);
        } catch {}
      }
    }
  };

  const getLangBadge = () => {
    switch (speechLang) {
      case "gu-IN":
        return "ગુજરાતી";
      case "hi-IN":
        return "हिन्दी";
      case "en-IN":
        return "English";
    }
  };

  return (
    <div className="w-full max-w-xl font-sans space-y-1.5">
      {/* Top Controls Toolbar outside textarea to prevent overlapping text */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="text-[11px] font-medium text-slate-500">
          {isListening ? (
            <span className="text-rose-600 font-bold flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
              માઈક ચાલુ છે — બોલો...
            </span>
          ) : (
            <span>નોંધ / રીમાર્કસ</span>
          )}
        </span>

        {/* Action Buttons: Language Selector & Mic Button */}
        <div className="flex items-center gap-1.5">
          {/* Language Selector Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="અવાજની ભાષા બદલો (Change Voice Language)"
            >
              <Globe className="w-3 h-3 text-slate-500" />
              <span>{getLangBadge()}</span>
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl border border-slate-200 shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                {[
                  { code: "gu-IN" as const, label: "ગુજરાતી (Gujarati)" },
                  { code: "hi-IN" as const, label: "हिन्दी (Hindi)" },
                  { code: "en-IN" as const, label: "English (Indian)" },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setSpeechLang(item.code);
                      setIsLangMenuOpen(false);
                      if (isListening && recognitionRef.current) {
                        recognitionRef.current.stop();
                        setTimeout(() => {
                          recognitionRef.current.lang = item.code;
                          recognitionRef.current.start();
                        }, 200);
                      }
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      speechLang === item.code
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{item.label}</span>
                    {speechLang === item.code && <Check className="w-3 h-3 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Microphone Trigger Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all shadow-2xs cursor-pointer select-none ${
              isListening
                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 ring-2 ring-rose-400/30 animate-pulse"
                : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300"
            }`}
            title={isListening ? "બોલવાનું બંધ કરો (Stop Recording)" : "બોલીને નોંધ લખો (Speak to Write Remark)"}
          >
            {isListening ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                <MicOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="text-[11px]">બંધ કરો</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-[11px]">બોલો (Mic)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Clean Full-Width Textarea without overlapping buttons */}
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        className={`p-3 max-w-xl w-full bg-white border rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 resize-y min-h-[72px] transition-all shadow-2xs ${
          isListening
            ? "border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/10"
            : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
        } ${className}`}
        {...rest}
      />

      {/* Live Audio Listening Bar & Interim Transcription Display */}
      {isListening && (
        <div className="mt-1.5 p-2 bg-gradient-to-r from-rose-50/90 to-blue-50/90 border border-rose-200/80 rounded-xl flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-0.5 px-1 py-0.5">
              <span className="w-1 h-3.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-5 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider block">
                સાંભળી રહ્યું છે ({getLangBadge()})
              </span>
              <p className="text-xs font-semibold text-slate-800 truncate">
                {interimTranscript || "હવે તમે બોલી શકો છો..."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleListening}
            className="px-2 py-0.5 text-[10px] font-extrabold text-rose-700 bg-white border border-rose-200 rounded-md shadow-2xs hover:bg-rose-50 cursor-pointer shrink-0"
          >
            થોભો
          </button>
        </div>
      )}

      {/* Error Message if Mic Permission Denied */}
      {errorMsg && (
        <div className="mt-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
