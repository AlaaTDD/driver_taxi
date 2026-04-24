import { createAdminClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/stat-card";
import { TripsStatusChart, RevenueChart } from "@/components/charts";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
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
    (t) => !["completed", "cancelled", "no_drivers"].includes(t.status)
  ).length;
  const verifiedDrivers = driversProfile.filter((d) => d.is_verified).length;
  const availableDrivers = driversProfile.filter((d) => d.is_available).length;
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
    <div className="space-y-7">

      {/* ===== PAGE HEADER ===== */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">لوحة التحكم</span>
            <span className="w-1 h-1 rounded-full bg-primary/60" />
            <span className="text-[11px] text-text-disabled">نظرة عامة</span>
          </div>
          <h1 className="page-title">مرحباً بك 👋</h1>
          <p className="page-subtitle">إليك ملخص النشاط في منصة تاكسي</p>
        </div>
        <div
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] text-text-tertiary font-medium"
          style={{ background: "rgba(15,30,53,0.7)", border: "1px solid var(--divider)" }}
        >
          <Activity size={12} className="text-success" style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.6))" }} />
          <span>{new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
      </div>

      {/* ===== MAIN STATS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المستخدمين"
          value={totalUsers}
          icon={<Users size={18} />}
          iconColor="text-blue-300"
          iconBg="bg-blue-500/15"
          glowColor="rgba(59,130,246,0.25)"
          accentColor="#3B82F6"
          subtitle="مستخدم مسجّل"
        />
        <StatCard
          title="إجمالي السائقين"
          value={totalDrivers}
          icon={<Car size={18} />}
          iconColor="text-cyan-300"
          iconBg="bg-cyan-500/15"
          glowColor="rgba(6,182,212,0.25)"
          accentColor="#06B6D4"
          trend={{ value: verifiedDrivers, label: "سائق معتمد" }}
        />
        <StatCard
          title="الرحلات النشطة"
          value={activeTrips}
          icon={<MapPin size={18} />}
          iconColor="text-violet-300"
          iconBg="bg-violet-500/15"
          glowColor="rgba(139,92,246,0.25)"
          accentColor="#8B5CF6"
          subtitle="قيد التنفيذ الآن"
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign size={18} />}
          iconColor="text-emerald-300"
          iconBg="bg-emerald-500/15"
          glowColor="rgba(16,185,129,0.25)"
          accentColor="#10B981"
          trend={{ value: completedTrips, label: "رحلة مكتملة" }}
        />
      </div>

      {/* ===== QUICK METRICS ROW ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "سائقين متاحين",
            value: availableDrivers,
            icon: <CheckCircle size={16} />,
            color: "text-success",
            bg: "rgba(16,185,129,0.1)",
            border: "rgba(16,185,129,0.2)",
            glow: "rgba(16,185,129,0.15)",
          },
          {
            label: "رحلات مشكلة",
            value: trips.filter((t) => t.status === "problem").length,
            icon: <AlertTriangle size={16} />,
            color: "text-warning",
            bg: "rgba(245,158,11,0.1)",
            border: "rgba(245,158,11,0.2)",
            glow: "rgba(245,158,11,0.12)",
          },
          {
            label: "رحلات جارية",
            value: activeTrips,
            icon: <Clock size={16} />,
            color: "text-violet-400",
            bg: "rgba(139,92,246,0.1)",
            border: "rgba(139,92,246,0.2)",
            glow: "rgba(139,92,246,0.12)",
          },
          {
            label: "معدل الإكمال",
            value: `${completionRate}%`,
            icon: <TrendingUp size={16} />,
            color: "text-blue-400",
            bg: "rgba(59,130,246,0.1)",
            border: "rgba(59,130,246,0.2)",
            glow: "rgba(59,130,246,0.12)",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="group relative flex items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 cursor-default"
            style={{
              background: item.bg,
              border: `1px solid ${item.border}`,
              boxShadow: `0 2px 8px rgba(0,0,0,0.2)`,
            }}
          >
            {/* Hover glow */}
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ boxShadow: `0 0 24px ${item.glow} inset` }}
            />
            <div className={`relative ${item.color} flex-shrink-0`}>
              {item.icon}
            </div>
            <div className="relative">
              <div className="text-[10px] text-text-tertiary font-medium leading-none mb-1">{item.label}</div>
              <div className={`text-[18px] font-black num ${item.color}`}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== CHARTS ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TripsStatusChart data={statusChartData} />
        <RevenueChart data={revenueChartData} />
      </div>

      {/* ===== RECENT TRIPS TABLE ===== */}
      <div
        className="group rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Table Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--divider)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-[3px] h-5 rounded-full flex-shrink-0"
              style={{
                background: "linear-gradient(to bottom, #3B82F6, #8B5CF6)",
                boxShadow: "0 0 8px rgba(59,130,246,0.5)",
              }}
            />
            <div>
              <h3 className="text-[13px] font-bold text-text-primary">أحدث الرحلات</h3>
              <p className="text-[10px] text-text-tertiary">آخر {recentTrips.length} رحلة</p>
            </div>
          </div>
          <a
            href="/dashboard/trips"
            className="flex items-center gap-1.5 text-[12px] text-primary hover:text-primary-light transition-colors group/link font-semibold"
          >
            عرض الكل
            <ArrowLeft size={13} className="transition-transform group-hover/link:-translate-x-1 duration-200" />
          </a>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(15,30,53,0.4)" }}>
                {["من", "إلى", "النوع", "السعر", "الحالة", "التاريخ"].map((h) => (
                  <th
                    key={h}
                    className="text-right py-3 px-5 text-[11px] font-bold text-text-tertiary uppercase tracking-wider"
                    style={{ borderBottom: "1px solid var(--divider)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTrips.length > 0 ? (
                recentTrips.map((trip, index) => (
                  <tr
                    key={trip.id}
                    className="group/row table-row-hover"
                    style={{
                      borderBottom: "1px solid rgba(26,45,71,0.5)",
                      animationDelay: `${index * 40}ms`,
                    }}
                  >
                    <td className="py-3.5 px-5 text-text-primary max-w-[160px] truncate text-[13px]">
                      <span className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: "#3B82F6", boxShadow: "0 0 4px rgba(59,130,246,0.6)" }}
                        />
                        {trip.pickup_address}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-text-secondary max-w-[160px] truncate text-[13px]">
                      {trip.destination_address}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                        style={{
                          background: trip.vehicle_type === "car" ? "rgba(59,130,246,0.1)" : "rgba(16,185,129,0.1)",
                          color: trip.vehicle_type === "car" ? "#60A5FA" : "#34D399",
                          border: `1px solid ${trip.vehicle_type === "car" ? "rgba(59,130,246,0.2)" : "rgba(16,185,129,0.2)"}`,
                        }}
                      >
                        {trip.vehicle_type === "car" ? "🚗 عربية" : "🏍 مكنة"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[13px] font-black num text-emerald-400">
                      {formatCurrency(Number(trip.price))}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusColor(trip.status)}`}
                      >
                        {getStatusLabel(trip.status)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-text-tertiary text-[11px] font-medium">
                      {formatDate(trip.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-text-disabled">
                      <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center">
                        <MapPin size={24} className="opacity-40" />
                      </div>
                      <p className="text-sm">لا توجد رحلات حتى الآن</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
