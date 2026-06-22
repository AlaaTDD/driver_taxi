"use client";

import { useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

interface TripOffersFilterProps {
  currentStatus: string;
  stats: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    expired: number;
  };
  labels: {
    all: string;
    pending: string;
    accepted: string;
    rejected: string;
    expired: string;
  };
}

export function TripOffersFilter({ currentStatus, stats, labels }: TripOffersFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    router.push(val ? `${pathname}?status=${val}` : pathname);
  };

  return (
    <div className="relative">
      <SlidersHorizontal size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
      <select
        value={currentStatus}
        onChange={handleChange}
        id="trip-offers-status-filter"
        className="appearance-none pl-3 pr-8 py-2 rounded-xl text-[13px] font-semibold outline-none cursor-pointer transition-colors"
        style={{
          background: currentStatus ? "var(--accent-surface)" : "var(--surface-elevated)",
          border: `1px solid ${currentStatus ? "var(--accent-border)" : "var(--divider-strong)"}`,
          color: currentStatus ? "var(--primary)" : "var(--text-primary)",
        }}
      >
        <option value="">{labels.all} ({stats.total})</option>
        <option value="pending">{labels.pending} ({stats.pending})</option>
        <option value="accepted">{labels.accepted} ({stats.accepted})</option>
        <option value="rejected">{labels.rejected} ({stats.rejected})</option>
        <option value="expired">{labels.expired} ({stats.expired})</option>
      </select>
    </div>
  );
}
