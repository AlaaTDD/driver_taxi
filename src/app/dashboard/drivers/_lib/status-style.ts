// Shared status → color mapping for the drivers dashboard.
// Single source of truth for the avatar/badge colors used across the
// desktop table, mobile cards, and revision request cards — previously
// duplicated inline in three places with the same if/else chain.

import type { CSSProperties } from "react";

export type DriverStatus = "blocked" | "revision" | "verified" | "pending";

export function getDriverStatus(isBlocked: boolean, isVerified: boolean, hasRevision: boolean): DriverStatus {
  if (isBlocked) return "blocked";
  if (hasRevision) return "revision";
  if (isVerified) return "verified";
  return "pending";
}

export interface StatusColors {
  bg: string;
  fg: string;
  border: string;
}

const STATUS_COLORS: Record<DriverStatus, StatusColors> = {
  blocked: { bg: "var(--error-surface)", fg: "var(--error)", border: "var(--error-border)" },
  revision: { bg: "var(--warning-surface)", fg: "var(--warning)", border: "var(--warning-border)" },
  verified: { bg: "var(--success-surface)", fg: "var(--success)", border: "var(--success-border)" },
  pending: { bg: "var(--warning-surface)", fg: "var(--warning)", border: "var(--warning-border)" },
};

export function getStatusColors(status: DriverStatus): StatusColors {
  return STATUS_COLORS[status];
}

// Convenience: avatar circle style object, ready to spread into `style={}`.
export function getAvatarStyle(status: DriverStatus): CSSProperties {
  const c = getStatusColors(status);
  return { background: c.bg, color: c.fg, border: `1px solid ${c.border}` };
}
