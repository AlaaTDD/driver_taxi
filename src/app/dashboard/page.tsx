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
  ArrowLeft,
  Activity,
} from "lucide-react";

export default async function DashboardPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const supabase = createAdminClient();

  const [usersRes, driversRes, tripsRes, driversProfileRes, recentTripsRes] =
    await Promise.all([
      supabase.from("users").select("id, role", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact" }).eq("role", "driver"),
      supabase.from("trips").select("id, status, price, created_at, vehicle_type"),
      supabase.from("drivers_profile").select("id, is_verified, is_available"),
      supabase
        .from("trips")
        .select("id, status, price, created_at, pickup_address, destination_address, vehicle_type, user_id, driver_id")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const totalUsers = usersRes.count || 0;
  const totalDrivers = driversRes.count || 0;
  const trips = tripsRes.data || [];
  const driversProfile = driversProfileRes.data || [];
  const recentTrips = recentTripsRes.data || [];

  const totalTrips = trips.length;
  const completedTrips = trips.filter((t) => t.status === "completed").length;
  const activeTrips = trips.filter(
    (t) => !["completed", "cancelled"].includes(t.status)
  ).length;
  const verifiedDrivers = driversProfile.filter((d) => d.is_verified).length;
  const availableDrivers = driversProfile.filter((d) => d.is_available).length;
  const pendingDrivers = driversProfile.filter((d) => !d.is_verified).length;
  const totalRevenue = trips
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + (Number(t.price) || 0), 0);

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

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("dashboard.overview")}</h1>
            <p className="text-sm text-text-secondary mt-1">{t("metadata.title")}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-text-tertiary font-medium bg-surface-elevated border border-divider">
            <Activity size={12} className="text-success" />
            <span>{new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
        </div>

        {/* Main Stats */}
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

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: t("dashboard.stats.availableDrivers"),
              value: availableDrivers,
              icon: <CheckCircle size={16} />,
              color: "text-success",
              bg: "bg-success/5",
              border: "border-success/20",
            },
            {
              label: t("dashboard.stats.pendingDrivers"),
              value: pendingDrivers,
              icon: <Clock size={16} />,
              color: "text-warning",
              bg: "bg-warning/5",
              border: "border-warning/20",
            },
            {
              label: t("dashboard.stats.cancelledTrips"),
              value: trips.filter((t) => t.status === "cancelled").length,
              icon: <AlertTriangle size={16} />,
              color: "text-error",
              bg: "bg-error/5",
              border: "border-error/20",
            },
            {
              label: t("dashboard.stats.completedTrips"),
              value: `${completionRate}%`,
              icon: <TrendingUp size={16} />,
              color: "text-primary",
              bg: "bg-primary/5",
              border: "border-primary/20",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-4 rounded-xl ${item.bg} border ${item.border} hover:shadow-md transition-all hover:-translate-y-0.5`}
            >
              <div className={`${item.color} shrink-0`}>{item.icon}</div>
              <div>
                <div className="text-[10px] text-text-tertiary font-medium">{item.label}</div>
                <div className={`text-lg font-black num ${item.color}`}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TripsStatusChart data={statusChartData} />
          <RevenueChart data={revenueChartData} />
        </div>

        {/* Recent Trips */}
        <div className="rounded-2xl overflow-hidden bg-surface border border-divider shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-primary" />
              <h3 className="text-sm font-bold text-text-primary">{t("dashboard.recentTrips")}</h3>
            </div>
            <Link
              href="/dashboard/trips"
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-semibold"
            >
              {t("common.view")}
              <ArrowLeft size={13} />
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
              recentTrips.map((trip) => (
                <tr key={trip.id} className="table-row-hover border-b border-divider/50">
                  <td className="py-3 px-5 text-text-primary max-w-[160px] truncate text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {trip.pickup_address}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-text-secondary max-w-[160px] truncate text-sm">{trip.destination_address}</td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold ${getStatusColor(trip.status)}`}>
                      {getStatusLabel(trip.status)}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-sm font-bold num text-emerald-500">{formatCurrency(Number(trip.price))}</td>
                  <td className="py-3 px-5 text-text-tertiary text-xs font-medium">{formatDate(trip.created_at)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-16 text-center text-text-disabled">
                  <div className="flex flex-col items-center gap-3">
                    <MapPin size={24} className="opacity-40" />
                    <p className="text-sm">{t("common.noData")}</p>
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
