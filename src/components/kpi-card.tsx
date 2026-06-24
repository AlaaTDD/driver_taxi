import { cn } from "@/lib/utils";

import { ColorVariant, COLOR_MAP } from "@/lib/design-tokens";

interface KpiCardProps {
  label: string;
  value: string | number;
  total?: number;
  suffix?: string;
  icon: React.ReactNode;
  colorVariant?: ColorVariant;
  progress: number;
  sublabel?: string;
}

export function KpiCard({
  label,
  value,
  total,
  suffix,
  icon,
  colorVariant = "primary",
  progress,
  sublabel,
}: KpiCardProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const colors = COLOR_MAP[colorVariant];

  const totalLabel = typeof total === "number" ? ` / ${total}` : "";

  return (
    <div
      className="group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-surface-elevated"
      aria-label={`${label}: ${value}${totalLabel}`}
    >
      {/* ── Progress Ring ── */}
      <KpiRing progress={clampedProgress} color={colors.var} rgb={colors.rgb} />

      {/* ── Text ── */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-text-tertiary leading-none mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-[17px] font-black num leading-none text-text-primary">
            {value}
          </span>
          {typeof total === "number" && (
            <span className="text-[10px] font-semibold text-text-tertiary num">/ {total}</span>
          )}
          {suffix && (
            <span className="text-[10px] font-semibold text-text-tertiary num">{suffix}</span>
          )}
        </div>
        {sublabel && (
          <p className="text-[10px] text-text-tertiary font-medium mt-0.5">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

/* ── Tiny progress ring ── */
function KpiRing({ progress, color, rgb }: { progress: number; color: string; rgb: string }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex-shrink-0 w-11 h-11 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="var(--divider)"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 1s ease-out",
            filter: `drop-shadow(0 0 3px rgba(${rgb},0.30))`,
          }}
        />
      </svg>
    </div>
  );
}
