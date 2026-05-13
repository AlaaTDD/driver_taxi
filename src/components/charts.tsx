"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";

interface StatusData {
  name: string;
  value: number;
  status: string;
}

interface RevenueData {
  name: string;
  revenue: number;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  completed: "var(--success)",
  accepted: "var(--primary)",
  driver_arriving: "var(--primary)",
  in_progress: "var(--primary)",
  searching: "var(--warning)",
  pending: "var(--warning)",
  cancelled: "var(--error)",
  rejected: "var(--error)",
  expired: "var(--text-disabled)",
};

const PIE_FALLBACK = [
  "var(--primary)",
  "var(--success)",
  "var(--warning)",
  "var(--error)",
  "var(--primary-light)",
];

const TOOLTIP_STYLE = {
  backgroundColor: "var(--surface-elevated)",
  border: "1px solid var(--divider)",
  borderRadius: "12px",
  color: "var(--text-primary)",
  boxShadow: "var(--shadow-lg)",
  backdropFilter: "blur(16px)",
  fontSize: "13px",
  padding: "10px 14px",
};

const statusTone = (status: string, index: number) =>
  STATUS_COLOR_MAP[status] || PIE_FALLBACK[index % PIE_FALLBACK.length];

function useChartSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        const newWidth = Math.floor(cr.width);
        const newHeight = Math.floor(cr.height);
        setSize(prev => {
          if (prev.width === newWidth && prev.height === newHeight) return prev;
          return { width: newWidth, height: newHeight };
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, ...size };
}

export function TripsStatusChart({ data }: { data: StatusData[] }) {
  const t = useTranslations();
  const { ref, width } = useChartSize();
  const total = data.reduce((s, d) => s + d.value, 0);
  
  /* Find the largest slice for center text */
  const maxEntry = data.reduce((a, b) => (a.value > b.value ? a : b), data[0] || { value: 0, name: "" });
  const maxPercent = total > 0 ? Math.round((maxEntry.value / total) * 100) : 0;

  return (
    <div ref={ref} className="w-full">
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Donut chart with center label */}
        <div className="relative flex-shrink-0" style={{ width: Math.min(width * 0.55, 220), height: Math.min(width * 0.55, 220) }}>
          {width > 0 && data.length > 0 ? (
            <>
              <PieChart width={Math.min(width * 0.55, 220)} height={Math.min(width * 0.55, 220)}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="85%"
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                  labelLine={false}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={statusTone(data[index]?.status || "", index)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: unknown, name?: unknown) => {
                    const v = Number(value ?? 0);
                    return [`${v} ${t("dashboard.charts.tripsLabel")} (${((v / total) * 100).toFixed(1)}%)`, String(name ?? "")] as unknown as [string, string];
                  }}
                />
              </PieChart>
              {/* Center percentage text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[28px] font-black text-text-primary num leading-none">{maxPercent}%</span>
                <span className="text-[10px] text-text-tertiary mt-1 font-medium">إجمالي الرحلات</span>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-text-tertiary text-sm">{t("common.noData")}</div>
          )}
        </div>

        {/* Legend on the right */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="mb-3">
            <p className="text-[11px] text-text-tertiary font-medium">إجمالي الرحلات</p>
            <p className="text-[18px] font-black text-primary num">{total} <span className="text-[12px] text-text-tertiary font-medium">رحلة إجمالاً</span></p>
          </div>
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2.5 py-1">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  background: statusTone(entry.status, index),
                }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-[12px] font-semibold text-text-primary">{entry.name}</span>
              </div>
              <span className="text-[11px] text-text-tertiary font-medium num">
                {entry.value} ({total > 0 ? Math.round((entry.value / total) * 100) : 0}%) رحلة
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
  const t = useTranslations();
  const { ref, width, height } = useChartSize();
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <div ref={ref} className="w-full">
      <div className="flex flex-col gap-4">
        {/* Revenue summary */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-text-tertiary font-medium">إجمالي الإيرادات</p>
            <p className="text-[22px] font-black text-primary num">{formatCurrency(total)}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2L10 7H2L6 2Z" fill="var(--success)" />
              </svg>
              <span className="text-[11px] font-bold" style={{ color: "var(--success)" }}>12.5%</span>
              <span className="text-[10px] text-text-disabled">عن الشهر السابق</span>
            </div>
          </div>
          {/* Period selector */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-text-secondary hover:bg-surface-elevated transition-all"
            style={{ border: "1px solid var(--divider)" }}
          >
            هذا الشهر
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 4L5 6L7 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Bar chart */}
        <div className="h-52 w-full">
          {width > 0 && data.length > 0 ? (
            <BarChart data={data} width={width} height={208} barCategoryGap="40%">
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="var(--primary-dark)" stopOpacity={0.78} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--divider)"
                vertical={false}
                opacity={0.5}
              />
              <XAxis
                dataKey="name"
                stroke="var(--text-tertiary)"
                fontSize={12}
                fontFamily="'Cairo', sans-serif"
                tick={{ fill: "var(--text-secondary)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="var(--text-tertiary)"
                fontSize={11}
                tick={{ fill: "var(--text-tertiary)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v} ج.م`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "rgba(var(--primary-rgb),0.08)", radius: 8 }}
                formatter={(value: unknown) => [formatCurrency(Number(value ?? 0)), t("dashboard.charts.revenueLabel")]}
              />
              <Bar
                dataKey="revenue"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
                fill="url(#barGradient)"
              />
            </BarChart>
          ) : (
            <div className="h-full flex items-center justify-center text-text-tertiary text-sm">{t("common.noData")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
