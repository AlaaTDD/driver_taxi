import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
  accentColor?: string;
  subtitle?: string;
  /** optional sparkline-style mini chart */
  sparkColor?: string;
  trendPercent?: string;
  trendUp?: boolean;
}

export function StatCard({
  title,
  value,
  icon,
  iconColor = "text-white",
  iconBg = "bg-primary",
  trend,
  className,
  accentColor = "var(--primary)",
  subtitle,
  sparkColor,
  trendPercent,
  trendUp = true,
}: StatCardProps) {
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
            {sparkColor && (
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
                  style={{ filter: "drop-shadow(0 2px 6px rgba(var(--primary-rgb),0.25))" }}
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
                <span style={{ color: accentColor }} className="text-[12px] font-bold num">{trend.value}</span>
                <span className="text-[11px] text-text-tertiary">{trend.label}</span>
              </div>
            )}
          </div>

          {/* Right: big colored icon box */}
          <div
            className={cn(
              "relative flex-shrink-0 w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105",
              iconColor
            )}
            style={{
              background: "var(--accent-surface)",
              border: "1px solid var(--accent-border)",
              color: accentColor,
            }}
          >
            {icon}
          </div>
        </div>

        {/* Bottom bar indicator */}
        {!sparkColor && !trendPercent && !trend && (
          <div
            className="mt-4 h-[3px] rounded-full opacity-30"
            style={{ 
              background: `linear-gradient(to left, transparent, ${accentColor})`,
              width: "60%",
            }}
          />
        )}
      </div>
    </div>
  );
}
