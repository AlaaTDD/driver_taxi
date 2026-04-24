import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
  glowColor?: string;
  accentColor?: string;
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  trend,
  className,
  glowColor = "rgba(59,130,246,0.2)",
  accentColor = "#3B82F6",
  subtitle,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-default",
        "hover:-translate-y-1 hover:shadow-2xl",
        className
      )}
      style={{
        background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
        border: `1px solid rgba(255,255,255,0.05)`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(to left, transparent, ${accentColor}, transparent)`,
          opacity: 0.6,
        }}
      />

      {/* Corner glow on hover */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-2xl"
        style={{ background: glowColor }}
      />

      {/* Hover border glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{
          boxShadow: `0 0 0 1px ${glowColor}, 0 8px 32px rgba(0,0,0,0.4), 0 0 40px ${glowColor}`,
        }}
      />

      <div className="relative p-5 z-10">
        {/* Header: title + icon */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-text-tertiary text-[11px] font-semibold uppercase tracking-widest mb-0.5">{title}</p>
            {subtitle && <p className="text-text-disabled text-[10px]">{subtitle}</p>}
          </div>
          <div
            className={cn(
              "relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110",
              iconBg,
              iconColor
            )}
            style={{
              boxShadow: `0 4px 12px ${glowColor}`,
              border: `1px solid ${glowColor}`,
            }}
          >
            {icon}
          </div>
        </div>

        {/* Value */}
        <div
          className="text-3xl font-black tracking-tight text-text-primary transition-all duration-300 num"
          style={{
            textShadow: `0 0 20px ${glowColor}`,
          }}
        >
          {value}
        </div>

        {/* Trend / Extra Info */}
        {trend && (
          <div className="flex items-center gap-2 mt-2">
            <div
              className="h-[3px] rounded-full flex-1 opacity-30"
              style={{ background: `linear-gradient(to left, transparent, ${accentColor})` }}
            />
            <span className="text-[11px] text-text-tertiary font-medium">
              <span style={{ color: accentColor }} className="font-bold">{trend.value}</span>
              {" "}{trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
