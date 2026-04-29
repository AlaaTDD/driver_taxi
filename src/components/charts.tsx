"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

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
  backgroundColor: "rgba(7, 15, 28, 0.95)",
  border: "1px solid rgba(59, 130, 246, 0.2)",
  borderRadius: "12px",
  color: "#F0F6FF",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
  backdropFilter: "blur(16px)",
  fontSize: "13px",
  fontFamily: "'Cairo', sans-serif",
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
        background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
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

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: `0 0 40px rgba(${hexToRgb(accent)}, 0.04) inset` }}
      />

      <div className="relative p-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div
            className="w-[3px] h-5 rounded-full flex-shrink-0"
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

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "59, 130, 246";
}

export function TripsStatusChart({ data }: { data: StatusData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard title="توزيع حالات الرحلات" subtitle={`${total} رحلة إجمالاً`} accent="#3B82F6">
      <div className="h-64" style={{ minHeight: 200, minWidth: 200 }}>
        {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                  style={{ filter: `drop-shadow(0 0 6px ${PIE_COLORS[index % PIE_COLORS.length]}60)` }}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: unknown) => { const v = Number(value ?? 0); return [`${v} رحلة (${((v / total) * 100).toFixed(1)}%)`, ""]; }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: "var(--text-secondary)", fontSize: "11px", fontFamily: "'Cairo', sans-serif" }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-text-tertiary text-sm">لا توجد بيانات</div>
        )}
      </div>

      {/* Center total label */}
      {data.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          {data.slice(0, 4).map((d, i) => (
            <div key={d.status} className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: PIE_COLORS[i % PIE_COLORS.length], boxShadow: `0 0 4px ${PIE_COLORS[i % PIE_COLORS.length]}80` }}
              />
              <span>{d.name}</span>
              <span className="font-bold text-text-secondary">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <ChartCard title="الإيرادات حسب نوع المركبة" subtitle={`إجمالي: ${formatCurrency(total)}`} accent="#10B981">
      <div className="h-64" style={{ minHeight: 200, minWidth: 200 }}>
        {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
          <BarChart data={data} barCategoryGap="40%">
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
              formatter={(value: unknown) => [formatCurrency(Number(value ?? 0)), "الإيرادات"]}
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
        </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-text-tertiary text-sm">لا توجد بيانات</div>
        )}
      </div>

      {/* Revenue breakdown */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {data.map((d, i) => (
          <div
            key={d.name}
            className="flex items-center justify-between p-2.5 rounded-xl"
            style={{
              background: "rgba(15,30,53,0.5)",
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
    </ChartCard>
  );
}
