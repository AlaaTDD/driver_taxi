"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant: "success" | "warning" | "error" | "info" | "default" | "purple" | "cyan";
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  size?: "sm" | "md";
}

export function Badge({ variant, children, className, dot = false, size = "md" }: BadgeProps) {
  const variants = {
    success: {
      cls: "text-success border",
      bg: "var(--success-surface)",
      border: "var(--success-border)",
      dotBg: "var(--success)",
      glow: "rgba(var(--success-rgb),0.35)",
    },
    warning: {
      cls: "text-warning border",
      bg: "var(--warning-surface)",
      border: "var(--warning-border)",
      dotBg: "var(--warning)",
      glow: "rgba(var(--warning-rgb),0.35)",
    },
    error: {
      cls: "text-error border",
      bg: "var(--error-surface)",
      border: "var(--error-border)",
      dotBg: "var(--error)",
      glow: "rgba(var(--error-rgb),0.35)",
    },
    info: {
      cls: "text-primary border",
      bg: "var(--accent-surface)",
      border: "var(--accent-border)",
      dotBg: "var(--primary)",
      glow: "rgba(var(--primary-rgb),0.35)",
    },
    purple: {
      cls: "text-primary border",
      bg: "var(--accent-surface)",
      border: "var(--accent-border)",
      dotBg: "var(--primary)",
      glow: "rgba(var(--primary-rgb),0.35)",
    },
    cyan: {
      cls: "text-primary border",
      bg: "var(--accent-surface)",
      border: "var(--accent-border)",
      dotBg: "var(--primary)",
      glow: "rgba(var(--primary-rgb),0.35)",
    },
    default: {
      cls: "text-text-secondary border",
      bg: "var(--surface-elevated)",
      border: "var(--divider)",
      dotBg: "var(--text-tertiary)",
      glow: "rgba(140,160,195,0.24)",
    },
  };

  const v = variants[variant];
  const sizeClass = size === "sm"
    ? "px-2 py-0.5 text-[10px] gap-1"
    : "px-2.5 py-[3px] text-[11px] gap-1.5";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold tracking-wide transition-all duration-200",
        v.cls,
        sizeClass,
        className
      )}
      style={{
        background: v.bg,
        borderColor: v.border,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {dot && (
        <span
          className={cn("rounded-full flex-shrink-0", size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5")}
          style={{ background: v.dotBg, boxShadow: `0 0 6px ${v.glow}` }}
        />
      )}
      {children}
    </span>
  );
}
