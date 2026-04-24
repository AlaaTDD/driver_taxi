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
      cls: "bg-success/12 text-success-light border-success/25",
      dotColor: "bg-success-light",
      glow: "rgba(16,185,129,0.3)",
    },
    warning: {
      cls: "bg-warning/12 text-warning-light border-warning/25",
      dotColor: "bg-warning-light",
      glow: "rgba(245,158,11,0.3)",
    },
    error: {
      cls: "bg-error/12 text-error-light border-error/25",
      dotColor: "bg-error-light",
      glow: "rgba(239,68,68,0.3)",
    },
    info: {
      cls: "bg-primary/12 text-primary-light border-primary/25",
      dotColor: "bg-primary-light",
      glow: "rgba(59,130,246,0.3)",
    },
    purple: {
      cls: "bg-accent-purple/12 text-violet-300 border-accent-purple/25",
      dotColor: "bg-violet-400",
      glow: "rgba(139,92,246,0.3)",
    },
    cyan: {
      cls: "bg-info/12 text-cyan-300 border-info/25",
      dotColor: "bg-cyan-400",
      glow: "rgba(6,182,212,0.3)",
    },
    default: {
      cls: "bg-surface-high text-text-secondary border-divider",
      dotColor: "bg-text-tertiary",
      glow: "rgba(74,108,143,0.2)",
    },
  };

  const v = variants[variant];
  const sizeClass = size === "sm"
    ? "px-2 py-0.5 text-[10px] gap-1"
    : "px-2.5 py-[3px] text-[11px] gap-1.5";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold tracking-wide transition-all duration-200",
        v.cls,
        sizeClass,
        className
      )}
      style={{
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {dot && (
        <span
          className={cn("rounded-full flex-shrink-0", v.dotColor, size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5")}
          style={{ boxShadow: `0 0 5px ${v.glow}` }}
        />
      )}
      {children}
    </span>
  );
}
