export interface PaymentTermOption {
  id: string;
  name: string;
  days: number;
  labelGu: string;
  isPopular?: boolean;
}

export const TEXTILE_CREDIT_TERMS: PaymentTermOption[] = [
  { id: "term-0", name: "Cash / Immediate", days: 0, labelGu: "રોકડા (Cash / Due on Receipt)", isPopular: true },
  { id: "term-15", name: "Net 15", days: 15, labelGu: "૧૫ દિવસ શાખ (15 Days Credit)" },
  { id: "term-30", name: "Net 30", days: 30, labelGu: "૩૦ દિવસ શાખ (30 Days Credit)" },
  { id: "term-45", name: "Net 45", days: 45, labelGu: "૪૫ દિવસ શાખ (45 Days - ટેક્સટાઇલ મુદત)", isPopular: true },
  { id: "term-60", name: "Net 60", days: 60, labelGu: "૬૦ દિવસ શાખ (60 Days Credit)" },
  { id: "term-90", name: "Net 90", days: 90, labelGu: "૯૦ દિવસ શાખ (90 Days - કાપડ બજાર)", isPopular: true },
  { id: "term-100", name: "Net 100", days: 100, labelGu: "૧૦૦ દિવસ શાખ (100 Days Credit)", isPopular: true },
  { id: "term-120", name: "Net 120", days: 120, labelGu: "૧૨૦ દિવસ શાખ (120 Days Credit)" },
];

/**
 * Extracts numeric days from term strings like "Net 45", "45 Days", "Net 90 (90 Days)", "Due on Receipt"
 */
export function parseCreditDays(termString?: string | number): number {
  if (typeof termString === "number") return termString;
  if (!termString) return 0;

  const lower = String(termString).toLowerCase().trim();
  if (lower.includes("receipt") || lower.includes("immediate") || lower.includes("cash") || lower.includes("રોકડ")) {
    return 0;
  }

  const match = lower.match(/\b(\d+)\b/);
  if (match) {
    const val = parseInt(match[1], 10);
    return isNaN(val) ? 0 : val;
  }
  return 0;
}

/**
 * Parses date string (handles DD-MM-YYYY or YYYY-MM-DD)
 */
export function parseAnyDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (trimmed.includes("-")) {
    const parts = trimmed.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return isNaN(d.getTime()) ? null : d;
      } else {
        // DD-MM-YYYY
        const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        return isNaN(d.getTime()) ? null : d;
      }
    }
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Calculates Due Date given bill date and credit days, returning in DD-MM-YYYY format
 */
export function calculateDueDate(billDateStr: string, creditDays: number): string {
  if (!billDateStr) return "";
  const d = parseAnyDate(billDateStr);
  if (!d) return billDateStr;

  if (creditDays > 0) {
    d.setDate(d.getDate() + creditDays);
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export interface DueStatusResult {
  status: "Paid" | "Overdue" | "DueToday" | "DueSoon" | "Safe" | "Immediate";
  label: string;
  labelGu: string;
  badgeClass: string;
  daysDiff: number;
  alertLevel: "danger" | "warning" | "info" | "success" | "neutral";
}

/**
 * Calculates live Due status: safe, due soon, due today, or overdue
 */
export function getDueStatus(dueDateStr?: string, isPaid: boolean = false): DueStatusResult {
  if (isPaid) {
    return {
      status: "Paid",
      label: "Paid / Settled",
      labelGu: "ચૂકતે (Paid)",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      daysDiff: 0,
      alertLevel: "success"
    };
  }

  if (!dueDateStr) {
    return {
      status: "Immediate",
      label: "Due on Receipt",
      labelGu: "રોકડા / તાત્કાલિક",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      daysDiff: 0,
      alertLevel: "neutral"
    };
  }

  const d = parseAnyDate(dueDateStr);
  if (!d) {
    return {
      status: "Immediate",
      label: dueDateStr,
      labelGu: dueDateStr,
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      daysDiff: 0,
      alertLevel: "neutral"
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  const diffTime = d.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      status: "Overdue",
      label: `${overdueDays}d Overdue`,
      labelGu: `${overdueDays} દિવસ ઓવરડ્યુ`,
      badgeClass: "bg-rose-50 text-rose-700 border-rose-300 font-extrabold",
      daysDiff: diffDays,
      alertLevel: "danger"
    };
  } else if (diffDays === 0) {
    return {
      status: "DueToday",
      label: "Due Today",
      labelGu: "આજે ડ્યુ (Due Today)",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-extrabold animate-pulse",
      daysDiff: 0,
      alertLevel: "warning"
    };
  } else if (diffDays <= 7) {
    return {
      status: "DueSoon",
      label: `${diffDays}d Left (Due Soon)`,
      labelGu: `${diffDays} દિવસ બાકી (નજીકમાં)`,
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200 font-bold",
      daysDiff: diffDays,
      alertLevel: "warning"
    };
  } else {
    return {
      status: "Safe",
      label: `${diffDays}d Left`,
      labelGu: `${diffDays} દિવસ બાકી`,
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
      daysDiff: diffDays,
      alertLevel: "info"
    };
  }
}
