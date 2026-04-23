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

  // Chart data - trips by status
  const statusCounts: Record<string, number> = {};
  trips.forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });
  const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({
    name: getStatusLabel(name),
    value,
    status: name,
  }));

  // Revenue by vehicle type
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


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">لوحة التحكم</h1>
          <p className="text-text-secondary text-[13px] mt-0.5">نظرة عامة على النظام</p>
        </div>
        <div className="text-text-disabled text-xs">
          {new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المستخدمين"
          value={totalUsers}
          icon={<Users size={20} />}
        />
        <StatCard
          title="إجمالي السائقين"
          value={totalDrivers}
          icon={<Car size={20} />}
          trend={{
            value: verifiedDrivers,
            label: "معتمدين",
          }}
        />
        <StatCard
          title="الرحلات النشطة"
          value={activeTrips}
          icon={<MapPin size={20} />}
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign size={20} />}
          trend={{
            value: completedTrips,
            label: "رحلة مكتملة",
          }}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-divider/50 p-4 flex items-center gap-3 hover:border-success/20 transition-colors">
          <div className="p-2 bg-success/10 rounded-lg">
            <CheckCircle size={16} className="text-success" />
          </div>
          <div>
            <div className="text-[11px] text-text-secondary">سائقين متاحين</div>
            <div className="text-lg font-bold text-text-primary">{availableDrivers}</div>
          </div>
        </div>
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-divider/50 p-4 flex items-center gap-3 hover:border-warning/20 transition-colors">
          <div className="p-2 bg-warning/10 rounded-lg">
            <AlertTriangle size={16} className="text-warning" />
          </div>
          <div>
            <div className="text-[11px] text-text-secondary">رحلات مشكلة</div>
            <div className="text-lg font-bold text-text-primary">
              {trips.filter((t) => t.status === "problem").length}
            </div>
          </div>
        </div>
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-divider/50 p-4 flex items-center gap-3 hover:border-primary/20 transition-colors">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clock size={16} className="text-primary" />
          </div>
          <div>
            <div className="text-[11px] text-text-secondary">رحلات جارية</div>
            <div className="text-lg font-bold text-text-primary">{activeTrips}</div>
          </div>
        </div>
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-divider/50 p-4 flex items-center gap-3 hover:border-primary/20 transition-colors">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp size={16} className="text-primary" />
          </div>
          <div>
            <div className="text-[11px] text-text-secondary">إجمالي الرحلات</div>
            <div className="text-lg font-bold text-text-primary">{totalTrips}</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TripsStatusChart data={statusChartData} />
        <RevenueChart data={revenueChartData} />
      </div>

      {/* Recent Trips Table */}
      <div className="bg-surface/80 backdrop-blur-sm rounded-2xl border border-divider/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold text-text-primary">أحدث الرحلات</h3>
          <a href="/dashboard/trips" className="text-[12px] text-primary hover:text-primary-dark transition-colors">
            عرض الكل ←
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider/60">
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">من</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">إلى</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">النوع</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">السعر</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">الحالة</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((trip) => (
                <tr key={trip.id} className="border-b border-divider/30 hover:bg-surface-elevated/30 transition-colors">
                  <td className="py-3 px-4 text-text-primary max-w-[150px] truncate text-[13px]">
                    {trip.pickup_address}
                  </td>
                  <td className="py-3 px-4 text-text-primary max-w-[150px] truncate text-[13px]">
                    {trip.destination_address}
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-[13px]">
                    {trip.vehicle_type === "car" ? "عربية" : "مكنة"}
                  </td>
                  <td className="py-3 px-4 text-text-primary font-medium text-[13px]">
                    {formatCurrency(Number(trip.price))}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${getStatusColor(trip.status)}`}
                    >
                      {getStatusLabel(trip.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-[11px]">
                    {formatDate(trip.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
