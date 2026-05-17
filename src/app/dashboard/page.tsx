import { createAdminClient } from "@/lib/supabase/server";
import { LocalTimeDisplay } from "@/components/local-time-display";
import { StatCard } from "@/components/stat-card";
import { TripsStatusChart, RevenueChart } from "@/components/charts";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import {
  Users,
  Car,
  MapPin,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  BarChart2,
  ArrowUpRight,
  UserCheck,
} from "lucide-react";
import { KpiCard } from "@/components/kpi-card";



export default async function DashboardPage() {
  const t = await getTranslations();
  const supabase = createAdminClient();

  const [dashboardRes, recentTripsRes, tripsForChartRes] = await Promise.all([
    supabase.from("admin_dashboard").select("*").single(),
    supabase.from("admin_recent_trips").select("*").limit(10),
    supabase.from("trips").select("id, status, price, vehicle_type").order("created_at", { ascending: false }).limit(2000),
  ]);

  const dashboard = dashboardRes.data;
  const recentTrips = recentTripsRes.data || [];
  const trips = tripsForChartRes.data || [];

  const totalUsers = Number(dashboard?.total_users ?? 0);
  const totalDrivers = Number(dashboard?.total_drivers ?? 0);
  const totalTrips = Number(dashboard?.total_trips ?? trips.length);
  const completedTrips = Number(dashboard?.completed_trips ?? trips.filter((t) => t.status === "completed").length);
  const activeTrips = Number(dashboard?.active_trips ?? trips.filter((t) => !["completed", "cancelled"].includes(t.status)).length);
  const verifiedDrivers = Number(dashboard?.verified_drivers ?? 0);
  const availableDrivers = Number(dashboard?.available_drivers ?? 0);
  const pendingDrivers = Number(dashboard?.pending_drivers ?? 0);
  const totalRevenue = Number(
    dashboard?.total_revenue ??
      trips
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + (Number(t.price) || 0), 0)
  );

  const statusCounts: Record<string, number> = {};
  trips.forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });
  const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({
    name: getStatusLabel(name),
    value,
    status: name,
  }));

  const carRevenue = trips
    .filter((t) => t.vehicle_type === "car" && t.status === "completed")
    .reduce((s, t) => s + (Number(t.price) || 0), 0);
  const motoRevenue = trips
    .filter((t) => t.vehicle_type === "motorcycle" && t.status === "completed")
    .reduce((s, t) => s + (Number(t.price) || 0), 0);

  const revenueChartData = [
    { name: t("dashboard.charts.car"), revenue: carRevenue },
    { name: t("dashboard.charts.motorcycle"), revenue: motoRevenue },
  ];

  const completionRate = totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0;
  const cancelledTrips = trips.filter((t) => t.status === "cancelled").length;
  const acceptanceRate = totalTrips > 0 ? Math.round(((totalTrips - cancelledTrips) / totalTrips) * 100) : 0;
  const recentCompletedTrips = recentTrips.filter((trip) => trip.status === "completed").length;
  const recentActiveTrips = recentTrips.filter((trip) => !["completed", "cancelled"].includes(trip.status)).length;

  return (
    <>
      <div className="space-y-6">

        {/* ─── PAGE HEADER ──────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-[28px] font-black tracking-tight text-text-primary leading-tight">
              {t("dashboard.overview")}
            </h1>
            <p className="text-[14px] text-text-tertiary leading-relaxed">
              {t("dashboard.welcome")}
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-2 mt-2 sm:mt-0">
            <LocalTimeDisplay />
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/15 bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary">
                <Activity size={13} />
                {totalTrips} {t("dashboard.charts.tripsLabel")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-success/20 bg-success/10 px-3 py-1.5 text-[11px] font-black text-success">
                <CheckCircle size={13} />
                {completionRate}%
              </span>
            </div>
          </div>
        </div>

        {/* ─── PRIMARY STAT CARDS ── 4 cards matching design (RTL order) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 (rightmost in RTL): إجمالي المستخدمين */}
          <StatCard
            title={t("dashboard.stats.totalUsers")}
            value={totalUsers}
            icon={<Users size={24} strokeWidth={2.5} />}
            colorVariant="primary"
            showSparkline
            subtitle={t("dashboard.stats.activeUsers")}
          />
          {/* Card 2: إجمالي السائقين */}
          <StatCard
            title={t("dashboard.stats.totalDrivers")}
            value={totalDrivers}
            icon={<Car size={24} strokeWidth={2.5} />}
            colorVariant="info"
            subtitle={`${availableDrivers} ${t("dashboard.stats.availableDriversSubtitle")}`}
          />
          {/* Card 3: رحلات نشطة */}
          <StatCard
            title={t("dashboard.stats.activeTrips")}
            value={activeTrips}
            icon={<MapPin size={24} strokeWidth={2.5} />}
            colorVariant="success"
            showSparkline
            subtitle={activeTrips === 0 ? t("dashboard.stats.noActiveTrips") : undefined}
          />
          {/* Card 4 (leftmost in RTL): إجمالي الإيرادات */}
          <StatCard
            title={t("dashboard.stats.totalRevenue")}
            value={formatCurrency(totalRevenue)}
            icon={<DollarSign size={24} strokeWidth={2.5} />}
            colorVariant="primary"
            showSparkline
            trendPercent="12.5%"
            trendUp={true}
          />
        </div>

        {/* ─── KPI STRIP ── Operational Performance Indicators ───── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              <h2 className="text-[15px] font-bold text-text-primary">{t("dashboard.operationalKPIs")}</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Available Drivers */}
            <KpiCard
              label={t("dashboard.kpis.availableDrivers")}
              value={availableDrivers}
              suffix={`${t("dashboard.kpis.outOf")} ${totalDrivers}`}
              icon={<UserCheck size={18} strokeWidth={2.5} />}
              colorVariant="success"
              progress={totalDrivers > 0 ? (availableDrivers / totalDrivers) * 100 : 0}
              sublabel={t("dashboard.kpis.onlineNow")}
            />

            {/* Pending Drivers */}
            <KpiCard
              label={t("dashboard.kpis.pendingDrivers")}
              value={pendingDrivers}
              icon={<Clock size={18} strokeWidth={2.5} />}
              colorVariant="warning"
              progress={totalDrivers > 0 ? (pendingDrivers / totalDrivers) * 100 : 0}
              sublabel={t("dashboard.kpis.awaitingReview")}
            />

            {/* Completion Rate */}
            <KpiCard
              label={t("dashboard.kpis.completionRate")}
              value={`${completionRate}%`}
              icon={<AlertTriangle size={18} strokeWidth={2.5} />}
              colorVariant="success"
              progress={completionRate}
              sublabel={t("dashboard.kpis.ofTotalTrips")}
            />

            {/* Acceptance Rate */}
            <KpiCard
              label={t("dashboard.kpis.acceptanceRate")}
              value={`${acceptanceRate}%`}
              icon={<TrendingUp size={18} strokeWidth={2.5} />}
              colorVariant="primary"
              progress={acceptanceRate}
              sublabel={t("dashboard.kpis.ofTotalRequests")}
            />
          </div>
        </div>

        {/* ─── CHARTS ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title={t("dashboard.charts.tripsByStatus")} icon={<BarChart2 size={16} />}>
            <TripsStatusChart data={statusChartData} />
          </ChartCard>
          <ChartCard title={t("dashboard.charts.revenueByVehicle")} icon={<BarChart2 size={16} />}>
            <RevenueChart data={revenueChartData} />
          </ChartCard>
        </div>

        {/* ─── RECENT TRIPS TABLE ──────────────────────────────────── */}
        <div className="rounded-2xl border border-divider bg-surface-elevated shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-divider flex items-center justify-between bg-surface/50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <MapPin size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-text-primary leading-none">{t("dashboard.recentTrips")}</h3>
                <p className="mt-1 text-[12px] font-medium text-text-tertiary">{t("dashboard.recentTripsSubtitle", { count: recentTrips.length })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/trips"
                className="group flex items-center gap-1.5 rounded-lg border border-divider bg-surface px-3 py-1.5 text-[12px] font-bold text-text-secondary transition-all hover:border-accent-border hover:bg-surface-elevated hover:text-text-primary"
              >
                {t("common.view")}
                <ArrowUpRight size={13} className="text-text-tertiary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            {recentTrips.length > 0 ? (
              recentTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="group relative flex flex-col sm:flex-row justify-between p-3.5 rounded-xl border border-divider bg-surface transition-all duration-300 hover:border-primary/30 hover:bg-surface-elevated hover:shadow-md"
                >
                  {/* Left: Route (Primary Focus) */}
                  <div className="flex items-stretch gap-3.5 flex-1 min-w-0">
                    <div className="flex flex-col items-center pt-1.5 pb-1 w-4 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-success ring-4 ring-success/10" />
                      <div className="w-[1.5px] grow my-1.5 bg-gradient-to-b from-success/10 to-primary/10" />
                      <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10" />
                    </div>
                    
                    <div className="flex flex-col justify-between py-0.5 min-w-0">
                      <div className="mb-4">
                        <p className="text-[13px] font-black text-text-primary truncate">{trip.pickup_address || "-"}</p>
                        <p className="text-[11px] font-bold text-text-tertiary mt-0.5">{t("trips.from")}</p>
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-text-primary truncate">{trip.destination_address || "-"}</p>
                        <p className="text-[11px] font-bold text-text-tertiary mt-0.5">{t("trips.to")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Data & Actions (Stacked) */}
                  <div className="flex flex-col items-end justify-between shrink-0 pl-4 mt-3 sm:mt-0 sm:border-l border-divider gap-3">
                    <div className="flex flex-col items-end gap-1.5 w-full">
                      <div className="flex items-center gap-2 justify-end w-full">
                        <span className="text-[15px] font-black num tracking-tight text-text-primary">
                          {formatCurrency(Number(trip.price))}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(trip.status)}`}>
                          {getStatusLabel(trip.status, t)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-tertiary group-hover:text-text-secondary transition-colors">
                        <Clock size={12} />
                        <span className="text-[11px] font-bold">{formatDate(trip.created_at)}</span>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/trips/${trip.id}`}
                      className="mt-1 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg border transition-all hover:shadow-sm table-action"
                    >
                      {t("common.view")}
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated border border-divider shadow-sm">
                  <MapPin size={24} className="text-text-disabled" />
                </div>
                <p className="text-sm font-bold text-text-disabled">{t("common.noData")}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}

/* ─── UTILITY SUB-COMPONENTS ────────────────────────────────────────── */

function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="dash-card">
      <div className="dash-section-header">
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-primary">{icon}</span>
          </div>
        )}
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
