export interface ShortcutBinding {
  id: string;
  labelEn: string;
  labelGu: string;
  route?: string;
  icon: string;
  color: string;
  
  // Custom or active settings
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  key: string;      // e.g. "c", "i"
  code: string;     // e.g. "KeyC", "KeyI"
}

export const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  {
    id: "new_sales_challan",
    labelEn: "New Sales Challan",
    labelGu: "નવું સેલ્સ ચલણ બનાવો",
    route: "/sales/new",
    icon: "Truck",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    altKey: true,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    key: "c",
    code: "KeyC"
  },
  {
    id: "new_sales_invoice",
    labelEn: "New Sales Invoice",
    labelGu: "નવું સેલ્સ પાકું બિલ",
    route: "/sales-invoices/new",
    icon: "FileCheck",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    altKey: true,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    key: "i",
    code: "KeyI"
  },
  {
    id: "new_purchase",
    labelEn: "New Purchase Bill",
    labelGu: "નવું ખરીદી બિલ બનાવો",
    route: "/purchases/new",
    icon: "ShoppingCart",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    altKey: true,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    key: "p",
    code: "KeyP"
  },
  {
    id: "new_expense",
    labelEn: "New Company Expense",
    labelGu: "નવો રોજિંદો ખર્ચ નોંધો",
    route: "/expenses/new",
    icon: "Receipt",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    altKey: true,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    key: "e",
    code: "KeyE"
  },
  {
    id: "new_payment",
    labelEn: "New Payment / Receipt",
    labelGu: "ચુકવણી / રસીદ વાઉચર",
    route: "/payments/new",
    icon: "CreditCard",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    altKey: true,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    key: "v",
    code: "KeyV"
  },
  {
    id: "open_ledger",
    labelEn: "Open Party Ledger",
    labelGu: "પાર્ટી ખાતાવહી (લેજર)",
    route: "/ledger",
    icon: "BookOpen",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    altKey: true,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    key: "l",
    code: "KeyL"
  }
];

const STORAGE_KEY = "om_sai_custom_shortcuts_v1";

export function isMacUser(): boolean {
  if (typeof window === "undefined" || !window.navigator) return false;
  const platform = window.navigator.platform || "";
  const userAgent = window.navigator.userAgent || "";
  return /Mac|iPhone|iPod|iPad/i.test(platform) || /Macintosh|Mac OS X/i.test(userAgent);
}

export function getSavedShortcuts(): ShortcutBinding[] {
  if (typeof window === "undefined") return DEFAULT_SHORTCUTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SHORTCUTS;
    const parsed = JSON.parse(raw) as ShortcutBinding[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SHORTCUTS;
    
    // Merge with defaults to ensure all required fields and actions exist
    return DEFAULT_SHORTCUTS.map((def) => {
      const found = parsed.find((p) => p.id === def.id);
      return found ? { ...def, ...found } : def;
    });
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

export function saveShortcuts(shortcuts: ShortcutBinding[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
    window.dispatchEvent(new CustomEvent("om_sai_shortcuts_updated"));
  } catch (err) {
    console.error("Failed to save shortcuts to localStorage", err);
  }
}

export function resetShortcuts(): ShortcutBinding[] {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("om_sai_shortcuts_updated"));
  }
  return DEFAULT_SHORTCUTS;
}

export function formatShortcutDisplay(binding: ShortcutBinding, isMac: boolean): string[] {
  const parts: string[] = [];
  
  if (isMac) {
    if (binding.metaKey) parts.push("⌘ Cmd");
    if (binding.ctrlKey) parts.push("⌃ Control");
    if (binding.altKey) parts.push("⌥ Option");
    if (binding.shiftKey) parts.push("⇧ Shift");
  } else {
    if (binding.ctrlKey) parts.push("Ctrl");
    if (binding.altKey) parts.push("Alt");
    if (binding.shiftKey) parts.push("Shift");
    if (binding.metaKey) parts.push("Win");
  }
  
  let keyLabel = binding.key ? binding.key.toUpperCase() : "";
  if (!keyLabel && binding.code) {
    keyLabel = binding.code.replace(/^Key/, "").replace(/^Digit/, "");
  }
  if (keyLabel) {
    parts.push(keyLabel);
  }
  
  return parts.length > 0 ? parts : ["None"];
}

export function matchesShortcut(e: KeyboardEvent, binding: ShortcutBinding): boolean {
  // Check modifier keys strictly
  if (Boolean(binding.altKey) !== Boolean(e.altKey)) return false;
  if (Boolean(binding.ctrlKey) !== Boolean(e.ctrlKey)) return false;
  if (Boolean(binding.metaKey) !== Boolean(e.metaKey)) return false;
  if (Boolean(binding.shiftKey) !== Boolean(e.shiftKey)) return false;

  const targetCode = binding.code?.toLowerCase();
  const eventCode = e.code?.toLowerCase();
  const targetKey = binding.key?.toLowerCase();
  const eventKey = e.key?.toLowerCase();

  // Match either by code (e.g. "keyc") or key (e.g. "c")
  // This solves Mac Option key diacritics where Option+c outputs special chars
  if (targetCode && eventCode && targetCode === eventCode) {
    return true;
  }
  if (targetKey && eventKey && targetKey === eventKey) {
    return true;
  }

  return false;
}
