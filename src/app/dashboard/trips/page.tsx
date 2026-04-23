import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import TripsClient from "./trips-client";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; vehicle?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const statusFilter = params.status || "";
  const vehicleFilter = params.vehicle || "";
  const pageSize = 10;

  const supabase = createAdminClient();

  let query = supabase
    .from("trips")
    .select(
      "id, status, vehicle_type, pickup_address, destination_address, distance_km, price, payment_method, created_at, completed_at, user_id, driver_id",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }
  if (vehicleFilter) {
    query = query.eq("vehicle_type", vehicleFilter);
  }

  const { data: trips, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  // Get user/driver names for the trips
  const userIds = [...new Set((trips || []).map((t) => [t.user_id, t.driver_id]).flat().filter(Boolean))];
  const { data: tripUsers } = await supabase
    .from("users")
    .select("id, name")
    .in("id", userIds);

  const userMap = new Map((tripUsers || []).map((u) => [u.id, u.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">الرحلات</h1>
        <p className="text-text-secondary text-[13px] mt-0.5">إدارة ومتابعة جميع الرحلات</p>
      </div>

      <TripsClient
        currentPage={page}
        totalPages={totalPages}
        currentStatus={statusFilter}
        currentVehicle={vehicleFilter}
        totalCount={count || 0}
      />

      {/* Trips Table */}
      <div className="bg-surface/80 backdrop-blur-sm rounded-2xl border border-divider/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider/60">
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">من</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">إلى</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">المسافة</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">السعر</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">النوع</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">المستخدم</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">السائق</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">الحالة</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {(trips || []).map((trip) => (
                <tr
                  key={trip.id}
                  className="border-b border-divider/30 hover:bg-surface-elevated/30 transition-colors"
                >
                  <td className="py-3 px-4 text-text-primary max-w-[120px] truncate text-[13px]">
                    {trip.pickup_address}
                  </td>
                  <td className="py-3 px-4 text-text-primary max-w-[120px] truncate text-[13px]">
                    {trip.destination_address}
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-[13px]">
                    {Number(trip.distance_km).toFixed(1)} كم
                  </td>
                  <td className="py-3 px-4 text-text-primary font-medium text-[13px]">
                    {formatCurrency(Number(trip.price))}
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-[13px]">
                    {trip.vehicle_type === "car" ? "عربية" : "مكنة"}
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-[13px]">
                    {userMap.get(trip.user_id) || "—"}
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-[13px]">
                    {trip.driver_id ? userMap.get(trip.driver_id) || "—" : "—"}
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
              {(!trips || trips.length === 0) && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-text-disabled">
                    لا توجد رحلات
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
