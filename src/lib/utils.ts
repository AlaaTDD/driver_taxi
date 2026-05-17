import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { STATUS_PILL_MAP, STATUS_LABELS } from "@/lib/design-tokens";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "EGP"): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
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
  return STATUS_PILL_MAP[status] || "status-pill-muted border";
}

export function getStatusLabel(status: string, t?: any): string {
  if (t) {
    const translation = t(`trips.statuses.${status}`);
    if (translation !== `trips.statuses.${status}`) return translation;
    const common = t(`common.${status}`);
    if (common !== `common.${status}`) return common;
  }
  return STATUS_LABELS[status] || status;
}
