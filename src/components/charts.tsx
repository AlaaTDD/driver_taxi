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

const PIE_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#06B6D4",
  "#EF4444",
  "#EC4899",
  "#6366F1",
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

function ChartCard({
  children,
  title,
  accent = "#3B82F6",
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  accent?: string;
  subtitle?: string;
}) {
  return (
    <div
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--divider)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(to left, transparent, ${accent}, transparent)`,
          opacity: 0.5,
        }}
      />

      <div className="relative p-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div
            className="w-[3px] h-5 rounded-full shrink-0"
            style={{
              background: `linear-gradient(to bottom, ${accent}, ${accent}88)`,
              boxShadow: `0 0 8px ${accent}60`,
            }}
          />
          <div>
            <h3 className="text-[13px] font-bold text-text-primary">{title}</h3>
            {subtitle && <p className="text-[11px] text-text-tertiary mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function useChartSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setSize({ width: Math.floor(cr.width), height: Math.floor(cr.height) });
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

  return (
    <ChartCard title={t("dashboard.charts.tripStatus")} subtitle={`${total} ${t("dashboard.charts.totalTrips")}`} accent="#3B82F6">
      <div ref={ref} className="w-full flex flex-col items-center">
        <div className="h-56 w-full">
          {width > 0 && data.length > 0 ? (
            <PieChart width={width} height={224}>
              <Pie
                data={data}
                cx={width / 2}
                cy={105}
                innerRadius={Math.min(width, 224) * 0.26}
                outerRadius={Math.min(width, 224) * 0.42}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
                labelLine={false}
                label={({ cx, cy, midAngle, outerRadius, value }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = (outerRadius ?? 0) + 18;
                  const mAngle = midAngle ?? 0;
                  const x = cx + radius * Math.cos(-mAngle * RADIAN);
                  const y = cy + radius * Math.sin(-mAngle * RADIAN);
                  return (
                    <text
                      x={x}
                      y={y}
                      textAnchor={x > cx ? "start" : "end"}
                      dominantBaseline="central"
                      fill="var(--text-secondary)"
                      fontSize={11}
                      fontFamily="'Cairo', sans-serif"
                    >
                      {((Number(value) / total) * 100).toFixed(0)}%
                    </text>
                  );
                }}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
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
          ) : (
            <div className="h-full flex items-center justify-center text-text-tertiary text-sm">{t("common.noData")}</div>
          )}
        </div>
        {/* Custom Legend - prevents overlap */}
        {data.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 pb-1">
            {data.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span
                  className="inline-block rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background: PIE_COLORS[index % PIE_COLORS.length],
                  }}
                />
                <span className="text-[11px] text-text-secondary">{entry.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ChartCard>
  );
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
  const t = useTranslations();
  const { ref, width, height } = useChartSize();
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <ChartCard title={t("dashboard.charts.revenueByVehicle")} subtitle={`${t("dashboard.charts.totalLabel")}: ${formatCurrency(total)}`} accent="#10B981">
      <div ref={ref} className="h-64 w-full">
        {width > 0 && height > 0 && data.length > 0 ? (
          <BarChart data={data} width={width} height={height} barCategoryGap="40%">
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(26,45,71,0.6)"
              vertical={false}
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
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "rgba(59,130,246,0.06)", radius: 8 }}
              formatter={(value: unknown) => [formatCurrency(Number(value ?? 0)), t("dashboard.charts.revenueLabel")]}
            />
            <Bar
              dataKey="revenue"
              radius={[8, 8, 0, 0]}
              maxBarSize={80}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? "url(#barGradient)" : "url(#barGradient2)"}
                  style={{ filter: "drop-shadow(0 4px 8px rgba(59,130,246,0.2))" }}
                />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <div className="h-full flex items-center justify-center text-text-tertiary text-sm">{t("common.noData")}</div>
        )}
      </div>
      {/* Revenue breakdown */}
      {data.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {data.map((d, i) => (
            <div
              key={d.name}
              className="flex items-center justify-between p-2.5 rounded-xl"
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--divider)",
              }}
            >
              <span className="text-[11px] text-text-tertiary">{d.name}</span>
              <span className="text-[12px] font-bold" style={{ color: i === 0 ? "#60A5FA" : "#34D399" }}>
                {formatCurrency(d.revenue)}
              </span>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
