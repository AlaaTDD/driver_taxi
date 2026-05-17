export type ColorVariant = "primary" | "info" | "success" | "warning" | "error";

export type BadgeVariant = ColorVariant | "default" | "purple" | "cyan";

export const COLOR_MAP: Record<
  ColorVariant,
  { bg: string; border: string; text: string; var: string; rgb: string }
> = {
  primary: {
    bg: "bg-primary/10",
    border: "border-primary/20",
    text: "text-primary",
    var: "var(--primary)",
    rgb: "var(--primary-rgb)",
  },
  info: {
    bg: "bg-info/10",
    border: "border-info/20",
    text: "text-info",
    var: "var(--info)",
    rgb: "var(--info-rgb)",
  },
  success: {
    bg: "bg-success/10",
    border: "border-success/20",
    text: "text-success",
    var: "var(--success)",
    rgb: "var(--success-rgb)",
  },
  warning: {
    bg: "bg-warning/10",
    border: "border-warning/20",
    text: "text-warning",
    var: "var(--warning)",
    rgb: "var(--warning-rgb)",
  },
  error: {
    bg: "bg-error/10",
    border: "border-error/20",
    text: "text-error",
    var: "var(--error)",
    rgb: "var(--error-rgb)",
  },
};

export const STATUS_COLOR_MAP: Record<string, string> = {
  completed: "var(--success)",
  accepted: "var(--primary)",
  driver_arriving: "var(--primary)",
  in_progress: "var(--primary)",
  searching: "var(--warning)",
  pending: "var(--warning)",
  cancelled: "var(--error)",
  rejected: "var(--error)",
  expired: "var(--text-disabled)",
};

export const STATUS_PILL_MAP: Record<string, string> = {
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

export const STATUS_LABELS: Record<string, string> = {
  searching: "جاري البحث",
  accepted: "مقبولة",
  driver_arriving: "السائق في الطريق",
  in_progress: "جارية",
  completed: "مكتملة",
  cancelled: "ملغية",
  pending: "معلقة",
  rejected: "مرفوضة",
  expired: "منتهية",
};

export const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "var(--surface-elevated)",
  border: "1px solid var(--divider)",
  borderRadius: "12px",
  color: "var(--text-primary)",
  boxShadow: "var(--shadow-lg)",
  backdropFilter: "blur(16px)",
  fontSize: "13px",
  padding: "10px 14px",
};

export const PIE_FALLBACK_COLORS: string[] = [
  "var(--primary)",
  "var(--success)",
  "var(--warning)",
  "var(--error)",
  "var(--primary-light)",
];
