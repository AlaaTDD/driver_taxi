import { createAdminClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/stat-card";
import { TripsStatusChart, RevenueChart } from "@/components/charts";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
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
  Bell,
  Calendar,
  ChevronDown,
  UserCheck,
} from "lucide-react";
import { KpiCard } from "@/components/kpi-card";

export default async function DashboardPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const supabase = createAdminClient();

  const [dashboardRes, recentTripsRes, tripsForChartRes, notifRes] = await Promise.all([
    supabase.from("admin_dashboard").select("*").single(),
    supabase.from("admin_recent_trips").select("*").limit(10),
    supabase.from("trips").select("id, status, price, vehicle_type"),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("is_read", false),
  ]);

  const dashboard = dashboardRes.data;
  const recentTrips = recentTripsRes.data || [];
  const trips = tripsForChartRes.data || [];
  const unreadCount = notifRes.count || 0;

  const today = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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

  const isRTL = locale === "ar";

  return (
    <DashboardShell>
      <div className="space-y-6">

        {/* ─── PAGE HEADER ─── matching design exactly ─────────── */}
        <div className="flex items-start justify-between gap-4">
          {/* Right: title + subtitle */}
          <div className="space-y-1">
            <h1 className="text-[28px] font-black tracking-tight text-text-primary leading-tight">
              {t("dashboard.overview")}
            </h1>
            <p className="text-[14px] text-text-tertiary">
              {t("dashboard.welcome")} 👋
            </p>
          </div>

          {/* Left: date + bell */}
          <div className="hidden md:flex items-center gap-3">
            {/* Date chip */}
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] text-text-secondary font-medium cursor-pointer hover:border-primary/30 transition-all"
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--divider)",
              }}
            >
              <Calendar size={14} className="text-text-tertiary" />
              <span>{today}</span>
              <ChevronDown size={12} className="text-text-disabled" />
            </div>

            {/* Notification bell */}
            <Link
              href="/dashboard/notifications"
              id="topbar-notifications"
              className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group hover:border-primary/40 hover:bg-primary/10"
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--divider)",
              }}
            >
              <Bell size={17} className="text-text-secondary group-hover:text-primary transition-colors" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-white text-[9px] font-bold rounded-full px-1"
                  style={{
                    background: "var(--error)",
                    border: "2px solid var(--surface)",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* ─── PRIMARY STAT CARDS ── 4 cards matching design (RTL order) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 (rightmost in RTL): إجمالي المستخدمين */}
          <StatCard
            title={t("dashboard.stats.totalUsers")}
            value={totalUsers}
            icon={<Users size={24} strokeWidth={2.5} />}
            iconColor="text-white"
            accentColor="#7C3AED"
            sparkColor="#7C3AED"
            subtitle={t("dashboard.stats.activeUsers")}
          />
          {/* Card 2: إجمالي السائقين */}
          <StatCard
            title={t("dashboard.stats.totalDrivers")}
            value={totalDrivers}
            icon={<Car size={24} strokeWidth={2.5} />}
            iconColor="text-white"
            accentColor="#3B82F6"
            subtitle={`${availableDrivers} ${t("dashboard.stats.availableDriversSubtitle")}`}
          />
          {/* Card 3: رحلات نشطة */}
          <StatCard
            title={t("dashboard.stats.activeTrips")}
            value={activeTrips}
            icon={<MapPin size={24} strokeWidth={2.5} />}
            iconColor="text-white"
            accentColor="#10B981"
            sparkColor="#10B981"
            subtitle={activeTrips === 0 ? t("dashboard.stats.noActiveTrips") : undefined}
          />
          {/* Card 4 (leftmost in RTL): إجمالي الإيرادات */}
          <StatCard
            title={t("dashboard.stats.totalRevenue")}
            value={formatCurrency(totalRevenue)}
            icon={<DollarSign size={24} strokeWidth={2.5} />}
            iconColor="text-white"
            accentColor="#3B82F6"
            sparkColor="#3B82F6"
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
              color="#10B981"
              progress={totalDrivers > 0 ? (availableDrivers / totalDrivers) * 100 : 0}
              sublabel={t("dashboard.kpis.onlineNow")}
            />

            {/* Pending Drivers */}
            <KpiCard
              label={t("dashboard.kpis.pendingDrivers")}
              value={pendingDrivers}
              icon={<Clock size={18} strokeWidth={2.5} />}
              color="#3B82F6"
              progress={totalDrivers > 0 ? (pendingDrivers / totalDrivers) * 100 : 0}
              sublabel={t("dashboard.kpis.awaitingReview")}
            />

            {/* Completion Rate */}
            <KpiCard
              label={t("dashboard.kpis.completionRate")}
              value={`${completionRate}%`}
              icon={<AlertTriangle size={18} strokeWidth={2.5} />}
              color="#10B981"
              progress={completionRate}
              sublabel={t("dashboard.kpis.ofTotalTrips")}
            />

            {/* Acceptance Rate */}
            <KpiCard
              label={t("dashboard.kpis.acceptanceRate")}
              value={`${acceptanceRate}%`}
              icon={<TrendingUp size={18} strokeWidth={2.5} />}
              color="#8B5CF6"
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
        <div className="dash-table-card">
          <div className="dash-section-header justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <MapPin size={14} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary leading-none">{t("dashboard.recentTrips")}</h3>
                <p className="text-[11px] text-text-tertiary mt-0.5">{t("dashboard.recentTripsSubtitle", { count: recentTrips.length })}</p>
              </div>
            </div>
            <Link
              href="/dashboard/trips"
              className="group flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-all font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/5"
            >
              {t("common.view")}
              <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <DataTable
            headers={[
              { label: t("trips.from"), key: "from" },
              { label: t("trips.to"), key: "to" },
              { label: t("common.status"), key: "status" },
              { label: t("trips.price"), key: "price" },
              { label: t("common.date"), key: "date" },
            ]}
          >
            {recentTrips.length > 0 ? (
              recentTrips.map((trip, idx) => (
                <tr
                  key={trip.id}
                  className="group dash-table-row"
                >
                  <td className="py-3.5 px-5 text-text-primary max-w-[180px] truncate text-sm">
                    <span className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </span>
                      <span className="truncate font-medium">{trip.pickup_address}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-text-secondary max-w-[180px] truncate text-sm">
                    <span className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-elevated shrink-0 border border-divider">
                        <span className="w-1 h-1 rounded-full bg-text-tertiary" />
                      </span>
                      <span className="truncate">{trip.destination_address}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${getStatusColor(trip.status)}`}
                    >
                      {getStatusLabel(trip.status)}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center gap-1 text-sm font-black num text-primary">
                      {formatCurrency(Number(trip.price))}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-text-tertiary text-xs font-medium">
                    {formatDate(trip.created_at)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated border border-divider">
                      <MapPin size={22} className="text-text-disabled" />
                    </div>
                    <p className="text-sm text-text-disabled font-medium">{t("common.noData")}</p>
                  </div>
                </td>
              </tr>
            )}
          </DataTable>
        </div>

      </div>
    </DashboardShell>
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