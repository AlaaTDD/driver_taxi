import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import { DashboardShell } from "@/components/dashboard-shell";
import TripsClient from "./trips-client";
import { getTranslations } from "next-intl/server";
import { MapPin, Gauge, Eye } from "lucide-react";
import Link from "next/link";

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

  const t = await getTranslations();
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

  const userIds = [...new Set((trips || []).map((t) => [t.user_id, t.driver_id]).flat().filter(Boolean))];
  const { data: tripUsers } = await supabase
    .from("users")
    .select("id, name")
    .in("id", userIds);

  const userMap = new Map((tripUsers || []).map((u) => [u.id, u.name]));

  const totalRevenue = (trips || [])
    .filter((t) => t.status === "completed")
    .reduce((s, t) => s + (Number(t.price) || 0), 0);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("trips.title")}</h1>
            <p className="text-sm text-text-secondary mt-1">{t("trips.subtitle")}</p>
          </div>

          {/* Total info */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/5 border border-primary/20 text-primary">
              <MapPin size={11} />
              {count || 0} {t("trips.title")}
            </div>
            {!statusFilter && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-success/5 border border-success/20 text-success">
                <Gauge size={11} />
                {formatCurrency(totalRevenue)}
              </div>
            )}
          </div>
        </div>

      {/* ===== FILTERS ===== */}
      <TripsClient
        currentPage={page}
        totalPages={totalPages}
        currentStatus={statusFilter}
        currentVehicle={vehicleFilter}
        totalCount={count || 0}
      />

      {/* ===== TRIPS TABLE ===== */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Table Header bar */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--divider)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-[3px] h-5 rounded-full"
              style={{
                background: "linear-gradient(to bottom, #10B981, #059669)",
                boxShadow: "0 0 8px rgba(16,185,129,0.5)",
              }}
            />
            <div>
              <h3 className="text-[13px] font-bold text-text-primary">قائمة الرحلات</h3>
              <p className="text-[10px] text-text-tertiary">
                صفحة {page} من {totalPages || 1}
              </p>
            </div>
          </div>

          {(statusFilter || vehicleFilter) && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-amber-400"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
              فلتر نشط
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--surface-glass)", borderBottom: "1px solid var(--divider)" }}>
                {["من", "إلى", "المسافة", "السعر", "النوع", "المستخدم", "السائق", "الحالة", "التاريخ", "إجراء"].map((h) => (
                  <th
                    key={h}
                    className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(trips || []).map((trip) => (
                <tr
                  key={trip.id}
                  className="group/row table-row-hover"
                  style={{ borderBottom: "1px solid rgba(26,45,71,0.5)" }}
                >
                  <td className="py-3.5 px-4 max-w-[140px] truncate text-[13px] text-text-primary">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: "#10B981", boxShadow: "0 0 4px rgba(16,185,129,0.6)" }}
                      />
                      <span className="truncate">{trip.pickup_address}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-[140px] truncate text-[13px] text-text-secondary">
                    {trip.destination_address}
                  </td>
                  <td className="py-3.5 px-4 text-text-tertiary text-[13px] num whitespace-nowrap">
                    {Number(trip.distance_km).toFixed(1)} كم
                  </td>
                  <td className="py-3.5 px-4 text-[13px] font-black num text-emerald-400 whitespace-nowrap">
                    {formatCurrency(Number(trip.price))}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap"
                      style={{
                        background: trip.vehicle_type === "car" ? "rgba(59,130,246,0.1)" : "rgba(16,185,129,0.1)",
                        color: trip.vehicle_type === "car" ? "#60A5FA" : "#34D399",
                        border: `1px solid ${trip.vehicle_type === "car" ? "rgba(59,130,246,0.2)" : "rgba(16,185,129,0.2)"}`,
                      }}
                    >
                      {trip.vehicle_type === "car" ? "🚗" : "🏍"}
                      {trip.vehicle_type === "car" ? "عربية" : "مكنة"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium max-w-[100px] truncate"
                      style={{
                        background: "var(--surface-glass)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--divider)",
                      }}
                    >
                      {userMap.get(trip.user_id) || "—"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {trip.driver_id ? (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium max-w-[100px] truncate"
                        style={{
                          background: "var(--surface-glass)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--divider)",
                        }}
                      >
                        {userMap.get(trip.driver_id) || "—"}
                      </span>
                    ) : (
                      <span className="text-text-disabled text-[12px]">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${getStatusColor(trip.status)}`}
                    >
                      {getStatusLabel(trip.status)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-text-tertiary text-[11px] font-medium whitespace-nowrap">
                    {formatDate(trip.created_at)}
                  </td>
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/dashboard/trips/${trip.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80"
                      style={{ background: "rgba(59,130,246,0.1)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.2)" }}
                    >
                      <Eye size={12} /> عرض
                    </Link>
                  </td>
                </tr>
              ))}

              {(!trips || trips.length === 0) && (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-text-disabled">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
                      >
                        <MapPin size={24} className="opacity-40" />
                      </div>
                      <div>
                        <p className="text-text-secondary font-semibold">لا توجد رحلات</p>
                        <p className="text-text-tertiary text-sm mt-1">جرب تغيير الفلاتر</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </DashboardShell>
  );
}
