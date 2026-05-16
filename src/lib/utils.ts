import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return `${value.toFixed(2)} ج.م`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    searching: "status-pill-warning border",
    accepted: "status-pill-primary border",
    driver_arriving: "status-pill-primary border",
    in_progress: "status-pill-primary border",
    completed: "status-pill-success border",
    cancelled: "status-pill-error border",
    pending: "status-pill-warning border",
    rejected: "status-pill-error border",
    expired: "status-pill-muted border",
  };
  return colors[status] || "status-pill-muted border";
}

export function getStatusLabel(status: string, t?: any): string {
  if (!t) return status;
  // Next-intl fallback chain
  try {
    const translation = t(`trips.statuses.${status}`);
    // If next-intl returns the key itself because it's missing, try common
    if (translation === `trips.statuses.${status}`) {
      const common = t(`common.${status}`);
      if (common !== `common.${status}`) return common;
    }
    return translation;
  } catch {
    return status;
  }
}
