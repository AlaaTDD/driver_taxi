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
  "#22C55E",
  "#F59E0B",
  "#7A9CB8",
  "#8B5CF6",
  "#06B6D4",
  "#EF4444",
  "#EC4899",
];

export function TripsStatusChart({ data }: { data: StatusData[] }) {
  return (
    <div className="bg-surface/80 backdrop-blur-sm rounded-2xl border border-divider/60 p-5">
      <h3 className="text-[13px] font-semibold text-text-primary mb-4">
        توزيع حالات الرحلات
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#0D1829",
                border: "1px solid #1C2E48",
                borderRadius: "12px",
                color: "#EEF4FF",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
  return (
    <div className="bg-surface/80 backdrop-blur-sm rounded-2xl border border-divider/60 p-5">
      <h3 className="text-[13px] font-semibold text-text-primary mb-4">
        الإيرادات حسب نوع المركبة
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#7A9CB8" fontSize={12} />
            <YAxis stroke="#7A9CB8" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0D1829",
                border: "1px solid #1C2E48",
                borderRadius: "12px",
                color: "#EEF4FF",
              }}
              formatter={(value) => [
                formatCurrency(Number(value ?? 0)),
                "الإيرادات",
              ]}
            />
            <Bar dataKey="revenue" fill="#3B82F6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
