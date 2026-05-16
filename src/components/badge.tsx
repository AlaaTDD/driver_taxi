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
      cls: "text-success bg-success/10 border-success/20",
      dotCls: "bg-success shadow-[0_0_6px_var(--success)]",
    },
    warning: {
      cls: "text-warning bg-warning/10 border-warning/20",
      dotCls: "bg-warning shadow-[0_0_6px_var(--warning)]",
    },
    error: {
      cls: "text-error bg-error/10 border-error/20",
      dotCls: "bg-error shadow-[0_0_6px_var(--error)]",
    },
    info: {
      cls: "text-info bg-info/10 border-info/20",
      dotCls: "bg-info shadow-[0_0_6px_var(--info)]",
    },
    purple: {
      cls: "text-[var(--color-purple)] bg-[var(--color-purple)]/10 border-[var(--color-purple)]/25",
      dotCls: "bg-[var(--color-purple)] shadow-[0_0_6px_var(--color-purple)]",
    },
    cyan: {
      cls: "text-[var(--color-cyan)] bg-[var(--color-cyan)]/10 border-[var(--color-cyan)]/25",
      dotCls: "bg-[var(--color-cyan)] shadow-[0_0_6px_var(--color-cyan)]",
    },
    default: {
      cls: "text-text-secondary bg-surface-elevated border-divider",
      dotCls: "bg-text-tertiary shadow-[0_0_6px_var(--text-tertiary)]",
    },
  };

  const v = variants[variant];
  const sizeClass = size === "sm"
    ? "px-2 py-0.5 text-[10px] gap-1"
    : "px-2.5 py-[3px] text-[11px] gap-1.5";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold tracking-wide transition-all duration-200 border shadow-[var(--shadow-sm)]",
        v.cls,
        sizeClass,
        className
      )}
    >
      {dot && (
        <span
          className={cn("rounded-full flex-shrink-0", size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5", v.dotCls)}
        />
      )}
      {children}
    </span>
  );
}
