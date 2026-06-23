import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { STATUS_PILL_MAP, STATUS_LABELS } from "@/lib/design-tokens";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// [UI-05 FIXED] Intl.NumberFormat can throw in environments that lack the
// requested locale or in test runners. Wrap in try/catch so the UI always
// renders a numeric value instead of crashing.
export function formatCurrency(value: number, currency = "EGP", locale = "ar-EG"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatDate(date: string, locale = "ar-EG"): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status: string): string {
  return STATUS_PILL_MAP[status] || "status-pill-muted border";
}

export function getStatusLabel(status: string, t?: (key: string) => string): string {
  if (t) {
    const translation = t(`trips.statuses.${status}`);
    if (translation !== `trips.statuses.${status}`) return translation;
    const common = t(`common.${status}`);
    if (common !== `common.${status}`) return common;
  }
  return STATUS_LABELS[status] || status;
}
