import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function pnlColor(pnl: number | null | undefined): string {
  if (pnl == null) return "text-muted-foreground";
  return pnl > 0 ? "text-profit" : pnl < 0 ? "text-loss" : "text-muted-foreground";
}

export function resultBadgeClass(result: string): string {
  if (result === "win") return "bg-profit text-green-600 dark:text-green-400";
  if (result === "loss") return "bg-loss text-red-600 dark:text-red-400";
  return "bg-muted text-muted-foreground";
}

export const TIMEFRAMES = ["M1", "M2", "M3", "M5", "M10", "M15", "M30", "H1"];
export const HIGHER_TF = ["H1", "H4", "Daily"];
export const ENTRY_TRIGGERS = [
  "MSS", "BOS", "LiquiditySweep", "OrderBlock", "FVG",
  "SMTDivergence", "RejectionCandle", "Engulfing",
  "BreakerBlock", "MitigationBlock", "SessionManipulation", "CHOCH",
];
export const SESSIONS = ["london", "new_york", "asian", "london_open", "ny_open"];
export const SETUPS = [
  "LiquiditySweep", "OrderBlock", "FVG", "BOS", "MSS",
  "Breaker", "Mitigation", "CHOCH", "SMT", "IFVG",
];
export const EMOTIONS_BEFORE = ["confident", "fearful", "anxious", "overconfident", "tired", "revenge", "focused"];
export const EMOTIONS_AFTER = ["calm", "frustrated", "disciplined", "emotional", "happy", "impulsive"];
export const ACCOUNT_TYPES = ["forex", "crypto", "prop_firm", "demo", "cent"];
export const ACCOUNT_STATUSES = ["active", "passed", "failed", "blown", "archived"];
