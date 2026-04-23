"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant: "success" | "warning" | "error" | "info" | "default";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  const variants = {
    success: "bg-success/15 text-success border border-success/20",
    warning: "bg-warning/15 text-warning border border-warning/20",
    error: "bg-error/15 text-error border border-error/20",
    info: "bg-primary/15 text-primary border border-primary/20",
    default: "bg-surface-elevated text-text-secondary border border-divider/50",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
