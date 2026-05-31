import { createAdminClient } from "@/lib/supabase/server";
import {
  formatDate,
  formatCurrency,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils";
import TripsClient from "./trips-client";
import { getTranslations } from "next-intl/server";
import { MapPin, Gauge, ArrowUpRight, Clock, Car, User } from "lucide-react";
import Link from "next/link";
import { getAppCurrency } from "@/lib/currency";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; vehicle?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const statusFilter = params.status || "";
  const vehicleFilter = params.vehicle || "";
  const pageSize = 12;

  const t = await getTranslations();
  const supabase = createAdminClient();
  const currency = await getAppCurrency();

  let query = supabase
    .from("trips")
    .select(
      "id, status, vehicle_type, pickup_address, destination_address, distance_km, price, final_price, payment_method, created_at, completed_at, user_id, driver_id, trip_route_plans(id)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (statusFilter) query = query.eq("status", statusFilter);
  if (vehicleFilter) query = query.eq("vehicle_type", vehicleFilter);

  const { data: trips, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  const userIds = [
    ...new Set(
      (trips || [])
        .map((t) => [t.user_id, t.driver_id])
        .flat()
        .filter(Boolean),
    ),
  ];
  const { data: tripUsers } = await supabase
    .from("users")
    .select("id, name")
    .in("id", userIds);
  const userMap = new Map((tripUsers || []).map((u) => [u.id, u.name]));

  let revenueQuery = supabase
    .from("trips")
    .select("price, final_price")
    .eq("status", "completed");
  if (vehicleFilter)
    revenueQuery = revenueQuery.eq("vehicle_type", vehicleFilter);
  const { data: allRevenueTrips } = await revenueQuery;

  const totalRevenue = (allRevenueTrips || []).reduce(
    (s, t) => s + (Number(t.final_price ?? t.price) || 0),
    0,
  );

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">
              {t("trips.title")}
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              {t("trips.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/5 border border-primary/20 text-primary">
              <MapPin size={11} />
              {count || 0} {t("trips.title")}
            </span>
            {!statusFilter && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-success/10 border border-success/20 text-success">
                <Gauge size={11} />
                {formatCurrency(totalRevenue, currency)}
              </span>
            )}
          </div>
        </div>

        {/* ── Filters + Pagination ── */}
        <TripsClient
          currentPage={page}
          totalPages={totalPages}
          currentStatus={statusFilter}
          currentVehicle={vehicleFilter}
          totalCount={count || 0}
        />

        {/* ── Trips Card List ── */}
        <div className="rounded-2xl border border-divider bg-surface flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-divider flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <MapPin size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-text-primary leading-none">
                  {t("trips.tripList")}
                </h3>
                <p className="mt-1 text-[12px] font-medium text-text-tertiary">
                  {t("common.page")} {page} {t("common.of")} {totalPages || 1} —{" "}
                  {count || 0} {t("trips.title")}
                </p>
              </div>
            </div>
            {(statusFilter || vehicleFilter) && (
              <Link
                href="/dashboard/trips"
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-warning/30 bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
              >
                ✕ {t("common.activeFilter")}
              </Link>
            )}
          </div>

          {/* Trips list */}
          <div className="p-4 flex flex-col gap-3">
            {(trips || []).length > 0 ? (
              (trips || []).map((trip) => (
                <div
                  key={trip.id}
                  className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-divider bg-surface transition-all duration-200 hover:border-primary/25 hover:shadow-sm gap-4"
                >
                  {/* Left: Route */}
                  <div className="flex items-stretch gap-3.5 flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex flex-col items-center pt-1.5 pb-1 w-4 shrink-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full ring-4"
                        style={{
                          background: "var(--success)",
                          boxShadow: `0 0 0 4px var(--success-surface)`,
                        }}
                      />
                      <div
                        className="w-[1.5px] grow my-1.5"
                        style={{
                          background: `linear-gradient(to bottom, var(--success-surface), var(--accent-surface))`,
                        }}
                      />
                      <div
                        className="w-2.5 h-2.5 rounded-full ring-4"
                        style={{
                          background: "var(--primary)",
                          boxShadow: `0 0 0 4px var(--primary-surface)`,
                        }}
                      />
                    </div>

                    <div className="flex flex-col justify-between py-0.5 min-w-0 flex-1">
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-black text-text-primary truncate">
                            {trip.pickup_address || "—"}
                          </p>
                          {trip.trip_route_plans?.length > 0 && (
                            <span className="shrink-0 text-[9px] font-bold bg-info/10 text-info px-1.5 py-0.5 rounded border border-info/20">
                              متعددة
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-text-tertiary mt-0.5">
                          {t("trips.from")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-text-primary truncate">
                          {trip.destination_address || "—"}
                        </p>
                        <p className="text-[11px] font-bold text-text-tertiary mt-0.5">
                          {t("trips.to")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Participants & Meta */}
                  <div className="flex flex-col gap-2 shrink-0 sm:px-5 sm:border-x border-divider w-full sm:w-auto sm:min-w-[180px] py-1">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                        <User size={13} className="text-text-tertiary" />
                        <span className="font-semibold truncate max-w-[130px]">
                          {userMap.get(trip.user_id) || "—"}
                        </span>
                      </div>
                      {trip.driver_id && (
                        <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                          <Car size={13} className="text-text-tertiary" />
                          <span className="font-semibold truncate max-w-[130px]">
                            {userMap.get(trip.driver_id) || "—"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-text-tertiary font-medium mt-1 pt-2 border-t border-divider/50">
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        <span>{formatDate(trip.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>
                          {trip.vehicle_type === "car" ? "🚗" : "🏍"}{" "}
                          {Number(trip.distance_km).toFixed(1)} {t("common.km")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status, Price & Action */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between shrink-0 gap-3 w-full sm:w-[130px] py-1">
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-1.5 w-full">
                      <span className="text-[16px] font-black num tracking-tight text-text-primary">
                        {formatCurrency(
                          Number(trip.final_price ?? trip.price),
                          currency,
                        )}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(trip.status)}`}
                      >
                        {getStatusLabel(trip.status, t)}
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/trips/${trip.id}`}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-primary/20 bg-primary/8 text-primary text-[11px] font-bold transition-all hover:bg-primary/15 hover:border-primary/35 w-full sm:w-auto mt-auto"
                    >
                      {t("common.view")}
                      <ArrowUpRight size={12} />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-divider">
                  <MapPin size={24} className="text-text-disabled" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-secondary">
                    {t("trips.noTrips")}
                  </p>
                  <p className="text-text-tertiary text-xs mt-1">
                    {t("common.tryChangeFilters")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
