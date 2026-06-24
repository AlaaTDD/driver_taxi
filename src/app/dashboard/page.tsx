import { createAdminClient } from "@/lib/supabase/server";
import { LocalTimeDisplay } from "@/components/local-time-display";
import { StatCard } from "@/components/stat-card";
import { TripsStatusChart, RevenueChart } from "@/components/charts";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import { ChartCard } from "@/components/chart-card";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

import {
  Users,
  Car,
  MapPin,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
  BarChart2,
  ArrowUpRight,
  UserCheck,
  Gauge,
  ArrowLeftRight,
} from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getAppCurrency } from "@/lib/currency";



export default async function DashboardPage() {
  type Translator = Awaited<ReturnType<typeof getTranslations>>;
  let t: Translator | undefined;
  let locale: string | undefined;
  let supabase, currency;
  // Typed containers so we avoid `any` casts and keep TS strict-happy.
  let dashboard: Record<string, unknown> | null = null;
  let recentTrips: any[] = [];
  let statusChartData: { name: string; value: number; status: string }[] = [];
  let revenueByType: Record<string, number> = {};

  try {
    t = await getTranslations();
    locale = await getLocale();
    supabase = createAdminClient();
    currency = await getAppCurrency();

    const [dashboardRes, recentTripsRes] = await Promise.all([
      supabase.from("admin_dashboard").select("*").single(),
      supabase.from("admin_recent_trips").select("*").limit(10),
    ]);

    dashboard = dashboardRes.data;
    recentTrips = recentTripsRes.data || [];

    // [FALLBACK] Prefer the admin_trips_summary view for O(1) aggregation, but
    // if the view is missing (migration not yet applied) fall back to a direct
    // query against the trips table. Both code paths produce the same shape so
    // the dashboard keeps working even before the DB migration is applied.
    const tryView = await supabase
      .from("admin_trips_summary")
      .select("status, vehicle_type, trip_count, revenue");

    let statusRows: { status: string; trip_count: number }[] = [];
    let revenueRows: { vehicle_type: string | null; revenue: number }[] = [];

    if (tryView.error) {
      // View missing → aggregate directly from trips table.
      const { data: allTrips } = await supabase
        .from("trips")
        .select("status, vehicle_type, final_price, price");

      const agg = (allTrips || []).reduce((acc, tr) => {
        const status = (tr as { status?: string }).status ?? "unknown";
        if (!acc[status]) acc[status] = { status, trip_count: 0, revenue: 0, vehicle_type: (tr as { vehicle_type?: string }).vehicle_type ?? null };
        acc[status].trip_count += 1;
        acc[status].revenue += Number((tr as { final_price?: number; price?: number }).final_price ?? (tr as { price?: number }).price ?? 0);
        return acc;
      }, {} as Record<string, { status: string; trip_count: number; revenue: number; vehicle_type: string | null }>);

      statusRows = Object.values(agg).map((r) => ({ status: r.status, trip_count: r.trip_count }));
      revenueRows = Object.values(agg).filter((r) => r.status === "completed").map((r) => ({ vehicle_type: r.vehicle_type, revenue: r.revenue }));
    } else {
      // View present → collapse per-vehicle-type rows into per-status totals.
      statusRows = (tryView.data || [])
        .reduce((acc, row) => {
          const existing = acc.find((r) => r.status === row.status);
          if (existing) { existing.trip_count += Number(row.trip_count ?? 0); }
          else { acc.push({ status: row.status, trip_count: Number(row.trip_count ?? 0) }); }
          return acc;
        }, [] as { status: string; trip_count: number }[])
        .sort((a, b) => b.trip_count - a.trip_count);
      revenueRows = (tryView.data || []).filter((r) => r.status === "completed");
    }

    // Build chart data from the rows.
    statusChartData = statusRows.map((row) => ({
      name: getStatusLabel(row.status),
      value: Number(row.trip_count ?? 0),
      status: row.status,
    }));

    const vehicleTypeLabels: Record<string, string> = {
      car: t("dashboard.charts.car"),
      motorcycle: t("dashboard.charts.motorcycle"),
    };

    revenueRows.forEach((row) => {
      const vt = row.vehicle_type || t!("common.vehicle");
      revenueByType[vt] = (revenueByType[vt] || 0) + Number(row.revenue ?? 0);
    });
    // Apply localized labels as the final keys.
    revenueByType = Object.fromEntries(
      Object.entries(revenueByType).map(([k, v]) => [vehicleTypeLabels[k] || k, v]),
    );
  } catch (err: any) {
    if (err && (err.digest === 'DYNAMIC_SERVER_USAGE' || err.message?.includes('dynamic-server-error') || err.message?.includes('Dynamic server usage'))) {
      throw err;
    }
    console.error("Dashboard Page Error:", err);
    // [P0-13 FIXED] Never expose err.message/err.stack to the browser. A
    // misconfigured NODE_ENV (e.g. leaked "development" on a preview deploy)
    // would otherwise leak file paths, line numbers, and DB internals. Use an
    // explicit opt-in flag instead, and log details server-side only.
    const showErrorDetails = process.env.SHOW_ERROR_DETAILS === "true";
    return (
      <div className="p-8 text-center rounded-2xl bg-error/10 border border-error/20 text-error max-w-2xl mx-auto my-12">
        <h2 className="text-xl font-bold mb-2">حدث خطأ في تحميل لوحة التحكم (Server Error)</h2>
        <p className="text-sm font-semibold mb-4">
          {showErrorDetails ? (err?.message || String(err)) : "حدث خطأ غير متوقع أثناء تحميل البيانات. يرجى المحاولة لاحقاً."}
        </p>
        <p className="text-[11px] text-text-secondary mb-4 text-right">
          يرجى التحقق من إعدادات مفاتيح البيئة (Environment Variables) في لوحة تحكم Vercel الخاصة بك (مثل SUPABASE_SERVICE_ROLE_KEY).
        </p>
        {showErrorDetails && err?.stack && (
          <pre className="p-4 rounded bg-black/80 text-white text-xs text-left overflow-auto max-h-60 font-mono dir-ltr">
            {err.stack}
          </pre>
        )}
      </div>
    );
  }

  const totalUsers = Number(dashboard?.total_users ?? 0);
  const totalDrivers = Number(dashboard?.total_drivers ?? 0);
  const totalTrips = Number(dashboard?.total_trips ?? 0);
  const completedTrips = Number(dashboard?.completed_trips ?? 0);
  const cancelledTrips = Number(dashboard?.cancelled_trips ?? 0);
  const activeTrips = Number(dashboard?.active_trips ?? 0);
  const verifiedDrivers = Number(dashboard?.verified_drivers ?? 0);
  const availableDrivers = Number(dashboard?.available_drivers ?? 0);
  const pendingDrivers = Number(dashboard?.pending_drivers ?? 0);
  const totalRevenue = Number(dashboard?.total_revenue ?? 0);

  // statusChartData and revenueByType were built inside the try block above.
  const revenueChartData = Object.entries(revenueByType).map(([name, revenue]) => ({
    name,
    revenue,
  }));

  const completionRate = totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0;
  const acceptanceRate = totalTrips > 0 ? Math.round(((totalTrips - cancelledTrips) / totalTrips) * 100) : 0;

  return (
    <div className="space-y-5">

      {/* ═══════════════════════════════════════════════════════════════════
          ROW 1 — PAGE HEADER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-text-primary leading-tight">
            {t("dashboard.overview")}
          </h1>
          <p className="text-[13px] text-text-tertiary leading-relaxed mt-1">
            {t("dashboard.welcome")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <LocalTimeDisplay />
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

      {/* ═══════════════════════════════════════════════════════════════════
          ROW 2 — PRIMARY STAT CARDS (4 columns)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("dashboard.stats.totalUsers")}
          value={totalUsers}
          icon={<Users size={18} strokeWidth={2.5} />}
          colorVariant="primary"
          subtitle={t("dashboard.stats.activeUsers")}
        />
        <StatCard
          title={t("dashboard.stats.totalDrivers")}
          value={totalDrivers}
          icon={<Car size={18} strokeWidth={2.5} />}
          colorVariant="info"
          subtitle={`${availableDrivers} ${t("dashboard.stats.availableDriversSubtitle")}`}
        />
        <StatCard
          title={t("dashboard.stats.activeTrips")}
          value={activeTrips}
          icon={<MapPin size={18} strokeWidth={2.5} />}
          colorVariant="success"
          subtitle={activeTrips === 0 ? t("dashboard.stats.noActiveTrips") : undefined}
        />
        <StatCard
          title={t("dashboard.stats.totalRevenue")}
          value={formatCurrency(totalRevenue, currency, locale)}
          icon={<DollarSign size={18} strokeWidth={2.5} />}
          colorVariant="warning"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ROW 3 — CHARTS + KPI PANEL (7+5 split)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* ── LEFT: Trips Status Chart (takes 7 cols) ── */}
        <div className="xl:col-span-7">
          <ChartCard title={t("dashboard.charts.tripsByStatus")} icon={<BarChart2 size={16} />}>
            <TripsStatusChart data={statusChartData} />
          </ChartCard>
        </div>

        {/* ── RIGHT: Performance KPIs (takes 5 cols) ── */}
        <div className="xl:col-span-5 dash-card">
          <div className="dash-section-header">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Gauge size={16} className="text-primary" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">{t("dashboard.operationalKPIs")}</h3>
          </div>
          <div className="p-3 flex flex-col divide-y divide-divider">
            <KpiCard
              label={t("dashboard.kpis.availableDrivers")}
              value={availableDrivers}
              suffix={`${t("dashboard.kpis.outOf")} ${totalDrivers}`}
              icon={<UserCheck size={16} strokeWidth={2.5} />}
              colorVariant="success"
              progress={totalDrivers > 0 ? (availableDrivers / totalDrivers) * 100 : 0}
              sublabel={t("dashboard.kpis.onlineNow")}
            />
            <KpiCard
              label={t("dashboard.kpis.pendingDrivers")}
              value={pendingDrivers}
              icon={<Clock size={16} strokeWidth={2.5} />}
              colorVariant="warning"
              progress={totalDrivers > 0 ? (pendingDrivers / totalDrivers) * 100 : 0}
              sublabel={t("dashboard.kpis.awaitingReview")}
            />
            <KpiCard
              label={t("dashboard.kpis.completionRate")}
              value={`${completionRate}%`}
              icon={<CheckCircle size={16} strokeWidth={2.5} />}
              colorVariant="success"
              progress={completionRate}
              sublabel={t("dashboard.kpis.ofTotalTrips")}
            />
            <KpiCard
              label={t("dashboard.kpis.acceptanceRate")}
              value={`${acceptanceRate}%`}
              icon={<TrendingUp size={16} strokeWidth={2.5} />}
              colorVariant="primary"
              progress={acceptanceRate}
              sublabel={t("dashboard.kpis.ofTotalRequests")}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ROW 4 — REVENUE CHART + RECENT TRIPS (7+5 split)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* ── LEFT: Revenue Chart (takes 7 cols) ── */}
        <div className="xl:col-span-7">
          <ChartCard title={t("dashboard.charts.revenueByVehicle")} icon={<DollarSign size={16} />}>
            <RevenueChart data={revenueChartData} currency={currency} />
          </ChartCard>
        </div>

        {/* ── RIGHT: Recent Trips (takes 5 cols) ── */}
        <div className="xl:col-span-5 dash-card flex flex-col">
          <div className="dash-section-header">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <ArrowLeftRight size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-text-primary leading-none">{t("dashboard.recentTrips")}</h3>
              <p className="text-[11px] text-text-tertiary mt-0.5">{t("dashboard.recentTripsSubtitle", { count: recentTrips.length })}</p>
            </div>
            <Link
              href="/dashboard/trips"
              className="group flex items-center gap-1 rounded-lg border border-divider bg-surface px-2.5 py-1 text-[11px] font-bold text-text-secondary transition-all hover:border-accent-border hover:bg-surface-elevated hover:text-text-primary"
            >
              {t("common.viewAll")}
              <ArrowUpRight size={12} className="text-text-tertiary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </div>

          {/* ── Trip list ── */}
          <div className="flex-1 overflow-y-auto">
            {recentTrips.length > 0 ? (
              <div className="divide-y divide-table-row-border">
                {recentTrips.slice(0, 6).map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/dashboard/trips/${trip.id}`}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-table-row-hover"
                  >
                    {/* ── Route dots + addresses ── */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-[7px] h-[7px] rounded-full bg-success" />
                        <div className="w-px h-5 bg-divider" />
                        <div className="w-[7px] h-[7px] rounded-full bg-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold text-text-primary truncate leading-tight">
                          {trip.pickup_address || "-"}
                        </p>
                        <p className="text-[11px] text-text-tertiary truncate leading-tight mt-1">
                          {trip.destination_address || "-"}
                        </p>
                      </div>
                    </div>

                    {/* ── Price + Status ── */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13px] font-black num tracking-tight text-text-primary">
                        {formatCurrency(Number(trip.price), currency, locale)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getStatusColor(trip.status)}`}>
                        {getStatusLabel(trip.status, t)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated border border-divider">
                  <MapPin size={20} className="text-text-disabled" />
                </div>
                <p className="text-[12px] font-bold text-text-disabled">{t("common.noData")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
