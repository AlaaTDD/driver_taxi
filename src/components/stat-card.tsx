import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-surface/80 backdrop-blur-sm rounded-2xl border border-divider/60 p-5 hover:border-primary/20 transition-colors duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-text-secondary text-[13px] font-medium">{title}</span>
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm shadow-primary/10">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-text-primary tracking-tight">{value}</div>
      {trend && (
        <div className="mt-2 text-xs">
          <span
            className={cn(
              trend.value >= 0 ? "text-success" : "text-error"
            )}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-text-disabled mr-1">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
