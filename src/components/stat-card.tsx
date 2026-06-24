import { cn } from "@/lib/utils";

import { ColorVariant, COLOR_MAP } from "@/lib/design-tokens";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorVariant?: ColorVariant;
  trend?: { value: number; label: string };
  className?: string;
  subtitle?: string;
  /** if true, shows sparkline mini chart */
  showSparkline?: boolean;
  trendPercent?: string;
  trendUp?: boolean;
}

export function StatCard({
  title,
  value,
  icon,
  colorVariant = "primary",
  className,
  subtitle,
}: StatCardProps) {
  const colors = COLOR_MAP[colorVariant];

  return (
    <div
      className={cn(
        "dash-metric-card group relative overflow-hidden transition-all duration-200 cursor-default",
        className
      )}
    >
      {/* ── Top accent bar ── */}
      <div
        className="absolute top-0 inset-x-0 h-[3px] rounded-t-[14px]"
        style={{
          background: `linear-gradient(90deg, ${colors.var}, transparent 80%)`,
        }}
      />

      <div className="relative p-5 z-10">
        {/* Top row: title + icon */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-[12px] font-semibold text-text-tertiary leading-none">{title}</p>
          <div
            className={cn(
              "flex-shrink-0 w-[34px] h-[34px] rounded-xl flex items-center justify-center transition-all duration-200",
              colors.bg,
              colors.border,
              colors.text,
              "border"
            )}
          >
            {icon}
          </div>
        </div>

        {/* Value */}
        <div className="text-[30px] font-black tracking-tight text-text-primary leading-none num mb-2">
          {value}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-[11px] font-semibold text-text-tertiary leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Hover glow ── */}
      <div
        className="absolute bottom-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 100% 100%, ${colors.var}15, transparent 70%)`,
        }}
      />
    </div>
  );
}
