import { cn } from "@/lib/utils";

type ColorVariant = "primary" | "info" | "success" | "warning" | "error";

const COLOR_MAP: Record<ColorVariant, { bg: string; border: string; text: string; var: string; rgb: string }> = {
  primary: { bg: "bg-primary/10", border: "border-primary/20", text: "text-primary", var: "var(--primary)", rgb: "var(--primary-rgb)" },
  info: { bg: "bg-info/10", border: "border-info/20", text: "text-info", var: "var(--info)", rgb: "var(--info-rgb)" },
  success: { bg: "bg-success/10", border: "border-success/20", text: "text-success", var: "var(--success)", rgb: "var(--success-rgb)" },
  warning: { bg: "bg-warning/10", border: "border-warning/20", text: "text-warning", var: "var(--warning)", rgb: "var(--warning-rgb)" },
  error: { bg: "bg-error/10", border: "border-error/20", text: "text-error", var: "var(--error)", rgb: "var(--error-rgb)" },
};

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
  
  // Circumference for the SVG ring
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div
      className="dash-stat group relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
    >
      {/* Right side in UI (First in DOM for RTL): The Ring */}
      <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center">
        {/* Background Ring */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="var(--divider)"
            strokeWidth="5"
            fill="none"
          />
          {/* Progress Ring */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={colors.var}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: "stroke-dashoffset 1s ease-out",
              filter: `drop-shadow(0 0 4px rgba(${colors.rgb},0.34))`,
            }}
          />
        </svg>
      </div>

      {/* Middle Text + Left Icon (Second in DOM for RTL: goes to Left) */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        {/* Text Stack (Middle) */}
        <div className="flex flex-col items-start text-start">
          <p className="text-[12px] font-bold text-text-primary mb-0.5">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-[20px] font-black num leading-none text-text-primary">
              {value}
            </span>
            {suffix && (
              <span className="text-[11px] font-semibold text-text-tertiary num">{suffix}</span>
            )}
          </div>
          {sublabel && (
            <p className="text-[10px] text-text-tertiary font-medium mt-1">{sublabel}</p>
          )}
        </div>
        
        {/* Left Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
            colors.bg,
            colors.border,
            colors.text,
            "border"
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
