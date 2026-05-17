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
  trend,
  className,
  subtitle,
  showSparkline,
  trendPercent,
  trendUp = true,
}: StatCardProps) {
  const colors = COLOR_MAP[colorVariant];
  const sparkColor = colors.var;

  return (
    <div
      className={cn(
        "dash-stat group relative overflow-hidden transition-all duration-300 cursor-default",
        "hover:-translate-y-0.5",
        className
      )}
    >
      <div className="relative p-5 z-10">
        {/* Top row: title + icon */}
        <div className="flex items-start justify-between gap-3">
          {/* Left: title + value */}
          <div className="flex-1 min-w-0">
            <p className="text-text-tertiary text-[12px] font-semibold mb-2">{title}</p>
            <div className="text-[28px] font-black tracking-tight text-text-primary leading-none num">
              {value}
            </div>
            {subtitle && (
              <p className="mt-2 truncate text-[11px] font-semibold text-text-tertiary">
                {subtitle}
              </p>
            )}

            {/* Trend percentage */}
            {trendPercent && (
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className="text-[12px] font-bold flex items-center gap-0.5"
                  style={{ color: trendUp ? "var(--success)" : "var(--error)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: trendUp ? "none" : "rotate(180deg)" }}>
                    <path d="M6 2L10 7H2L6 2Z" fill="currentColor" />
                  </svg>
                  {trendPercent}
                </span>
              </div>
            )}

            {/* Sparkline mini chart */}
            {showSparkline && (
              <svg className="mt-3 w-full h-[32px]" viewBox="0 0 120 32" fill="none" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`spark-grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkColor} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={sparkColor} stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 28 Q10 20 20 22 Q30 24 40 18 Q50 12 60 16 Q70 20 80 10 Q90 5 100 8 Q110 11 120 4"
                  stroke={sparkColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.9"
                  className="sparkline-path"
                  style={{ "--spark-rgb": colors.rgb } as React.CSSProperties}
                />
                <path
                  d="M0 28 Q10 20 20 22 Q30 24 40 18 Q50 12 60 16 Q70 20 80 10 Q90 5 100 8 Q110 11 120 4 L120 32 L0 32 Z"
                  fill={`url(#spark-grad-${title})`}
                />
              </svg>
            )}

            {/* Trend info */}
            {trend && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className={cn("text-[12px] font-bold num", colors.text)}>{trend.value}</span>
                <span className="text-[11px] text-text-tertiary">{trend.label}</span>
              </div>
            )}
          </div>

          {/* Right: big colored icon box */}
          <div
            className={cn(
              "relative flex-shrink-0 w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105",
              colors.bg,
              colors.border,
              colors.text,
              "border"
            )}
          >
            {icon}
          </div>
        </div>

        {/* Bottom bar indicator */}
        {!showSparkline && !trendPercent && !trend && (
          <div
            className="mt-4 h-[3px] rounded-full opacity-30"
            style={{ 
              background: `linear-gradient(to left, transparent, ${sparkColor})`,
              width: "60%",
            }}
          />
        )}
      </div>
    </div>
  );
}
