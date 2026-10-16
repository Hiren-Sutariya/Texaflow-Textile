"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { Language, translations, getTranslation } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

const originalNodeMap = new WeakMap<Node, string>();
const originalAttrMap = new WeakMap<Element, Record<string, string>>();

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [language, setLanguageState] = useState<Language>("en");
  const isInitializedRef = useRef(false);

  // Initialize from localStorage or cookies on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app_language") as Language | null;
      if (saved === "gu" || saved === "en") {
        setLanguageState(saved);
      }
      isInitializedRef.current = true;
    }
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("app_language", newLang);
      document.cookie = `texaflow_language=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(new CustomEvent("app_language_change", { detail: newLang }));
    }
  }, []);

  // Listen to external language change events
  useEffect(() => {
    const handleExternalChange = (e: any) => {
      const lang = e?.detail as Language;
      if (lang === "en" || lang === "gu") {
        setLanguageState(lang);
      }
    };
    window.addEventListener("app_language_change", handleExternalChange);
    return () => window.removeEventListener("app_language_change", handleExternalChange);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      return getTranslation(key, language, fallback);
    },
    [language]
  );

  // Universal High-Performance DOM Translation Engine
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isUpdatingDom = false;

    const translateSingleTextNode = (node: Node) => {
      const text = node.textContent;
      if (!text || !text.trim()) return;

      const parent = node.parentElement;
      if (!parent) return;
      const tag = parent.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "SVG" || tag === "CODE" || tag === "PRE") return;
      if (parent.isContentEditable) return;

      const trimmed = text.trim();

      if (language === "gu") {
        const guMatch = getTranslation(trimmed, "gu", "");
        if (guMatch && guMatch !== trimmed) {
          if (!originalNodeMap.has(node)) {
            originalNodeMap.set(node, text);
          }
          const leading = text.match(/^\s*/)?.[0] || "";
          const trailing = text.match(/\s*$/)?.[0] || "";
          node.textContent = leading + guMatch + trailing;
        }
      } else {
        if (originalNodeMap.has(node)) {
          const original = originalNodeMap.get(node);
          if (original !== undefined) {
            node.textContent = original;
            originalNodeMap.delete(node);
          }
        }
      }
    };

    const translateSubtree = (root: Node) => {
      if (!root || !root.isConnected) return;

      if (root.nodeType === Node.TEXT_NODE) {
        translateSingleTextNode(root);
        return;
      }

      if (root.nodeType !== Node.ELEMENT_NODE) return;
      const el = root as HTMLElement;
      const rootTag = el.tagName;
      if (rootTag === "SCRIPT" || rootTag === "STYLE" || rootTag === "SVG") return;

      // 1. Translate Placeholders on all inputs & textareas inside el
      const placeholderElements: (HTMLInputElement | HTMLTextAreaElement)[] = [];
      if (rootTag === "INPUT" || rootTag === "TEXTAREA") {
        placeholderElements.push(el as HTMLInputElement);
      }
      if (el.querySelectorAll) {
        const found = el.querySelectorAll("input[placeholder], textarea[placeholder]");
        found.forEach((item) => placeholderElements.push(item as any));
      }

      for (const input of placeholderElements) {
        const ph = input.getAttribute("placeholder");
        if (ph && ph.trim()) {
          const trimmedPh = ph.trim();
          if (language === "gu") {
            const guPh = getTranslation(trimmedPh, "gu", "");
            if (guPh && guPh !== trimmedPh) {
              let attrs = originalAttrMap.get(input);
              if (!attrs) {
                attrs = {};
                originalAttrMap.set(input, attrs);
              }
              if (!attrs.placeholder) attrs.placeholder = ph;
              input.setAttribute("placeholder", guPh);
            }
          } else {
            const attrs = originalAttrMap.get(input);
            if (attrs?.placeholder) {
              input.setAttribute("placeholder", attrs.placeholder);
              delete attrs.placeholder;
            }
          }
        }
      }

      // 2. Translate titles on elements
      const titleElements: HTMLElement[] = [];
      if (el.hasAttribute && el.hasAttribute("title")) {
        titleElements.push(el);
      }
      if (el.querySelectorAll) {
        const found = el.querySelectorAll("[title]");
        found.forEach((item) => titleElements.push(item as any));
      }

      for (const elem of titleElements) {
        const title = elem.getAttribute("title");
        if (title && title.trim()) {
          const trimmedT = title.trim();
          if (language === "gu") {
            const guT = getTranslation(trimmedT, "gu", "");
            if (guT && guT !== trimmedT) {
              let attrs = originalAttrMap.get(elem);
              if (!attrs) {
                attrs = {};
                originalAttrMap.set(elem, attrs);
              }
              if (!attrs.title) attrs.title = title;
              elem.setAttribute("title", guT);
            }
          } else {
            const attrs = originalAttrMap.get(elem);
            if (attrs?.title) {
              elem.setAttribute("title", attrs.title);
              delete attrs.title;
            }
          }
        }
      }

      // 3. Fast TreeWalker for all text nodes under root
      const walker = document.createTreeWalker(
        el,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (n) => {
            const p = n.parentElement;
            if (!p) return NodeFilter.FILTER_REJECT;
            const tName = p.tagName;
            if (tName === "SCRIPT" || tName === "STYLE" || tName === "SVG" || tName === "CODE" || tName === "PRE") {
              return NodeFilter.FILTER_REJECT;
            }
            if (p.isContentEditable) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let textNode: Node | null;
      while ((textNode = walker.nextNode())) {
        translateSingleTextNode(textNode);
      }
    };

    // If English, do a single revert pass if needed and exit (0ms overhead)
    if (language === "en") {
      isUpdatingDom = true;
      try {
        const target = document.querySelector("main") || document.body;
        translateSubtree(target);
      } finally {
        isUpdatingDom = false;
      }
      return;
    }

    // Pass for Gujarati
    isUpdatingDom = true;
    try {
      translateSubtree(document.body);
    } finally {
      isUpdatingDom = false;
    }

    // Delayed passes to catch async data fetched after route mount (e.g. Supabase, localStorage)
    const timer1 = setTimeout(() => {
      isUpdatingDom = true;
      try {
        translateSubtree(document.body);
      } finally {
        isUpdatingDom = false;
      }
    }, 200);

    const timer2 = setTimeout(() => {
      isUpdatingDom = true;
      try {
        translateSubtree(document.body);
      } finally {
        isUpdatingDom = false;
      }
    }, 600);

    const timer3 = setTimeout(() => {
      isUpdatingDom = true;
      try {
        translateSubtree(document.body);
      } finally {
        isUpdatingDom = false;
      }
    }, 1200);

    // RAF-batched MutationObserver
    let rafId: number | null = null;
    const dirtyNodes = new Set<Node>();

    const flushBatch = () => {
      if (dirtyNodes.size === 0) return;
      isUpdatingDom = true;
      try {
        for (const node of dirtyNodes) {
          if (node.isConnected) {
            translateSubtree(node);
          }
        }
        dirtyNodes.clear();
      } finally {
        isUpdatingDom = false;
      }
    };

    const scheduleUpdate = (node: Node) => {
      dirtyNodes.add(node);
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          flushBatch();
        });
      }
    };

    const observer = new MutationObserver((mutations) => {
      if (isUpdatingDom) return;

      for (const m of mutations) {
        if (m.type === "childList") {
          for (let i = 0; i < m.addedNodes.length; i++) {
            scheduleUpdate(m.addedNodes[i]);
          }
        } else if (m.type === "characterData" && m.target) {
          scheduleUpdate(m.target);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (rafId) cancelAnimationFrame(rafId);
      dirtyNodes.clear();
    };
  }, [language, pathname]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
