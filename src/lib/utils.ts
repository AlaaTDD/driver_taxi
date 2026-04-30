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
    searching: "bg-warning/20 text-warning",
    accepted: "bg-primary/20 text-primary",
    driver_arriving: "bg-cyan-400/20 text-cyan-400",
    in_progress: "bg-purple-400/20 text-purple-400",
    completed: "bg-success/20 text-success",
    cancelled: "bg-error/20 text-error",
    pending: "bg-warning/20 text-warning",
    rejected: "bg-error/20 text-error",
    expired: "bg-text-disabled/30 text-text-secondary",
  };
  return colors[status] || "bg-text-disabled/30 text-text-secondary";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    searching: "جاري البحث",
    accepted: "تم القبول",
    driver_arriving: "السائق قادم",
    in_progress: "جارية",
    completed: "مكتملة",
    cancelled: "ملغية",
    pending: "معلق",
    rejected: "مرفوض",
    expired: "منتهي",
  };
  return labels[status] || status;
}
