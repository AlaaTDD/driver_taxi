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
  Zap,
  BarChart2,
  ArrowUpRight,
} from "lucide-react";

export default async function DashboardPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const supabase = createAdminClient();

  const [dashboardRes, recentTripsRes, tripsForChartRes] = await Promise.all([
    supabase.from("admin_dashboard").select("*").single(),
    supabase.from("admin_recent_trips").select("*").limit(10),
    supabase.from("trips").select("id, status, price, vehicle_type"),
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
    { name: "عربية", revenue: carRevenue },
    { name: "مكنة", revenue: motoRevenue },
  ];

  const completionRate = totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0;
  const cancelledTrips = trips.filter((t) => t.status === "cancelled").length;
  const cancellationRate = totalTrips > 0 ? Math.round((cancelledTrips / totalTrips) * 100) : 0;

  const isRTL = locale === "ar";

  return (
    <DashboardShell>
      <div className="space-y-7">

        {/* ─── PAGE HEADER ─────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-divider bg-surface shadow-sm">
          {/* top accent line */}
          <div
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, var(--primary), var(--accent-cyan), var(--accent-purple))" }}
          />

          {/* subtle grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(var(--divider-strong) 1px, transparent 1px), linear-gradient(90deg, var(--divider-strong) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative flex items-center justify-between px-6 py-5">
            <div className="space-y-1">
              {/* eyebrow label */}
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-text-tertiary">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                  </span>
                  Live Dashboard
                </span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-text-primary leading-tight">
                {t("dashboard.overview")}
              </h1>
              <p className="text-sm text-text-tertiary font-medium">{t("metadata.title")}</p>
            </div>

            <div className="hidden md:flex flex-col items-end gap-2">
              {/* date chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-text-secondary font-medium bg-surface-elevated border border-divider">
                <Activity size={11} className="text-primary" />
                <span>
                  {new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              {/* quick totals */}
              <div className="flex items-center gap-3 text-xs text-text-tertiary font-medium">
                <span className="flex items-center gap-1">
                  <BarChart2 size={11} className="text-primary" />
                  <span className="num text-text-secondary font-bold">{totalTrips}</span>
                  <span>{t("dashboard.stats.totalTrips") ?? "رحلة إجمالاً"}</span>
                </span>
                <span className="w-px h-3 bg-divider" />
                <span className="flex items-center gap-1">
                  <Zap size={11} className="text-warning" />
                  <span className="num text-text-secondary font-bold">{activeTrips}</span>
                  <span>نشطة</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── PRIMARY STAT CARDS ──────────────────────────────────── */}
        <section className="space-y-2">
          <SectionLabel icon={<TrendingUp size={12} />} label="المؤشرات الرئيسية" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t("dashboard.stats.totalUsers")}
              value={totalUsers}
              icon={<Users size={18} />}
              iconColor="text-blue-500"
              iconBg="bg-blue-500/10"
              accentColor="#3B82F6"
            />
            <StatCard
              title={t("dashboard.stats.totalDrivers")}
              value={totalDrivers}
              icon={<Car size={18} />}
              iconColor="text-cyan-500"
              iconBg="bg-cyan-500/10"
              accentColor="#06B6D4"
              trend={{ value: verifiedDrivers, label: t("dashboard.stats.verifiedDrivers") }}
            />
            <StatCard
              title={t("dashboard.stats.activeTrips")}
              value={activeTrips}
              icon={<MapPin size={18} />}
              iconColor="text-violet-500"
              iconBg="bg-violet-500/10"
              accentColor="#8B5CF6"
            />
            <StatCard
              title={t("dashboard.stats.totalRevenue")}
              value={formatCurrency(totalRevenue)}
              icon={<DollarSign size={18} />}
              iconColor="text-emerald-500"
              iconBg="bg-emerald-500/10"
              accentColor="#10B981"
              trend={{ value: completedTrips, label: t("dashboard.stats.completedTrips") }}
            />
          </div>
        </section>

        {/* ─── KPI STRIP ───────────────────────────────────────────── */}
        <section className="space-y-2">
          <SectionLabel icon={<Activity size={12} />} label="مؤشرات الأداء التشغيلي" />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Available Drivers */}
            <KpiCard
              label={t("dashboard.stats.availableDrivers")}
              value={availableDrivers}
              icon={<CheckCircle size={15} />}
              accentClass="border-success/40"
              valueClass="text-success"
              iconClass="text-success"
              bgClass="bg-success/[0.04]"
              progress={totalDrivers > 0 ? (availableDrivers / totalDrivers) * 100 : 0}
              progressColor="bg-success"
              suffix={`/ ${totalDrivers}`}
            />

            {/* Pending Drivers */}
            <KpiCard
              label={t("dashboard.stats.pendingDrivers")}
              value={pendingDrivers}
              icon={<Clock size={15} />}
              accentClass="border-warning/40"
              valueClass="text-warning"
              iconClass="text-warning"
              bgClass="bg-warning/[0.04]"
              progress={totalDrivers > 0 ? (pendingDrivers / totalDrivers) * 100 : 0}
              progressColor="bg-warning"
            />

            {/* Cancelled Trips */}
            <KpiCard
              label={t("dashboard.stats.cancelledTrips")}
              value={cancelledTrips}
              icon={<AlertTriangle size={15} />}
              accentClass="border-error/40"
              valueClass="text-error"
              iconClass="text-error"
              bgClass="bg-error/[0.04]"
              progress={cancellationRate}
              progressColor="bg-error"
              suffix={`${cancellationRate}%`}
              showSuffixOnly
            />

            {/* Completion Rate */}
            <KpiCard
              label={t("dashboard.stats.completedTrips")}
              value={`${completionRate}%`}
              icon={<TrendingUp size={15} />}
              accentClass="border-primary/40"
              valueClass="text-primary"
              iconClass="text-primary"
              bgClass="bg-primary/[0.04]"
              progress={completionRate}
              progressColor="bg-primary"
            />

          </div>
        </section>

        {/* ─── CHARTS ──────────────────────────────────────────────── */}
        <section className="space-y-2">
          <SectionLabel icon={<BarChart2 size={12} />} label="التحليلات البيانية" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="توزيع حالات الرحلات">
              <TripsStatusChart data={statusChartData} />
            </ChartCard>
            <ChartCard title="الإيرادات حسب نوع المركبة">
              <RevenueChart data={revenueChartData} />
            </ChartCard>
          </div>
        </section>

        {/* ─── RECENT TRIPS TABLE ──────────────────────────────────── */}
        <section className="space-y-2">
          <SectionLabel icon={<MapPin size={12} />} label="آخر النشاطات" />

          <div className="rounded-2xl overflow-hidden bg-surface border border-divider shadow-sm">
            {/* table header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-divider bg-surface-elevated/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin size={13} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary leading-none">{t("dashboard.recentTrips")}</h3>
                  <p className="text-[11px] text-text-tertiary mt-0.5">آخر {recentTrips.length} رحلة مسجلة</p>
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
                    className="group table-row-hover border-b border-divider/40 last:border-0"
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
                      <span className="inline-flex items-center gap-1 text-sm font-black num text-emerald-500">
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
        </section>

      </div>
    </DashboardShell>
  );
}

/* ─── UTILITY SUB-COMPONENTS ────────────────────────────────────────── */

function SectionLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-text-tertiary">{icon}</span>
      <span className="text-[11px] font-bold tracking-widest uppercase text-text-tertiary">{label}</span>
      <span className="flex-1 h-px bg-divider" />
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  accentClass,
  valueClass,
  iconClass,
  bgClass,
  progress,
  progressColor,
  suffix,
  showSuffixOnly,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accentClass: string;
  valueClass: string;
  iconClass: string;
  bgClass: string;
  progress: number;
  progressColor: string;
  suffix?: string;
  showSuffixOnly?: boolean;
}) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={`group relative flex flex-col gap-3 p-4 rounded-xl border-[1.5px] ${accentClass} ${bgClass} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md overflow-hidden`}
    >
      {/* subtle fill glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
           style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 70%)" }} />

      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold text-text-tertiary leading-tight flex-1">{label}</p>
        <span className={`${iconClass} shrink-0 mt-px opacity-70`}>{icon}</span>
      </div>

      <div className="relative">
        <span className={`text-2xl font-black num leading-none ${valueClass}`}>
          {showSuffixOnly && suffix ? suffix : value}
        </span>
        {!showSuffixOnly && suffix && (
          <span className="text-xs font-semibold text-text-tertiary ms-1.5 num">{suffix}</span>
        )}
      </div>

      {/* progress bar */}
      <div className="relative h-1 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${progressColor} transition-all duration-700`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden bg-surface border border-divider shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-divider bg-surface-elevated/40">
        <div className="w-1 h-4 rounded-full bg-primary shrink-0" />
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}