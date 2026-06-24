import React from "react";

export function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="dash-card flex flex-col">
      <div className="dash-section-header">
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <span className="text-primary">{icon}</span>
          </div>
        )}
        <h3 className="text-[14px] font-bold text-text-primary">{title}</h3>
      </div>
      <div className="flex-1 p-5">{children}</div>
    </div>
  );
}
