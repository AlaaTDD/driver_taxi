import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeftRight, User, Car, ArrowUpRight, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { TripOffersFilter } from "./trip-offers-filter";

export default async function TripOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const statusFilter = params.status || "";
  const pageSize = 12;

  const t = await getTranslations();
  const supabase = createAdminClient();

  let query = supabase
    .from("trip_offers")
    .select("id, trip_id, driver_id, status, created_at, responded_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data: offers, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  const driverIds = [...new Set((offers || []).map((o) => o.driver_id).filter(Boolean))];
  const tripIds = [...new Set((offers || []).map((o) => o.trip_id).filter(Boolean))];

  const { data: drivers } = driverIds.length
    ? await supabase.from("users").select("id, name").in("id", driverIds)
    : { data: [] };

  const { data: trips } = tripIds.length
    ? await supabase.from("trips").select("id, pickup_address, destination_address, status, user_id").in("id", tripIds)
    : { data: [] };

  const tripUserIds = [...new Set((trips || []).map((t) => t.user_id).filter(Boolean))];
  const { data: tripUsers } = tripUserIds.length
    ? await supabase.from("users").select("id, name").in("id", tripUserIds)
    : { data: [] };

  const driverMap = new Map((drivers || []).map((d) => [d.id, d.name]));
  const tripMap = new Map((trips || []).map((t) => [t.id, t]));
  const tripUserMap = new Map((tripUsers || []).map((u) => [u.id, u.name]));

  // Stats for the dropdown labels
  const { data: statusStats } = await supabase.from("trip_offers").select("status");
  const stats = {
    total: statusStats?.length || 0,
    pending: statusStats?.filter((s) => s.status === "pending").length || 0,
    accepted: statusStats?.filter((s) => s.status === "accepted").length || 0,
    rejected: statusStats?.filter((s) => s.status === "rejected").length || 0,
    expired: statusStats?.filter((s) => s.status === "expired").length || 0,
  };

  // Active status label for display
  const activeStatusLabel = statusFilter
    ? statusFilter === "pending"   ? t("tripOffers.stats.pending")
    : statusFilter === "accepted"  ? t("tripOffers.stats.accepted")
    : statusFilter === "rejected"  ? t("tripOffers.stats.rejected")
    : statusFilter === "expired"   ? t("tripOffers.stats.expired")
    : t("tripOffers.stats.all")
    : t("tripOffers.stats.all");

  // Build pagination pages
  const buildPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const delta = 2;
    const range: (number | "...")[] = [];
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    range.push(1);
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("...");
    range.push(totalPages);
    return range;
  };

  const pages = totalPages > 1 ? buildPages() : [];

  return (
    <>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("tripOffers.title")}</h1>
            <p className="text-sm text-text-secondary mt-1">{t("tripOffers.subtitle")}</p>
          </div>
        </div>

        {/* ── Offers Card List ── */}
        <div className="rounded-2xl border border-divider bg-surface flex flex-col">
          {/* Card Header with inline dropdown filter */}
          <div className="px-5 py-4 border-b border-divider flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <ArrowLeftRight size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-text-primary leading-none">{t("tripOffers.list")}</h3>
                <p className="mt-1 text-[12px] font-medium text-text-tertiary">
                  {t("common.page")} {page} {t("common.of")} {totalPages || 1} — {count || 0}
                </p>
              </div>
            </div>

            {/* Dropdown filter — client component */}
            <div className="flex items-center gap-2">
              {statusFilter && (
                <Link
                  href="/dashboard/trip-offers"
                  className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-warning/30 bg-warning/8 text-warning hover:bg-warning/15 transition-colors"
                >
                  <span>✕</span>
                  <span>{activeStatusLabel}</span>
                </Link>
              )}
              <TripOffersFilter
                currentStatus={statusFilter}
                stats={stats}
                labels={{
                  all: t("tripOffers.stats.all"),
                  pending: t("tripOffers.stats.pending"),
                  accepted: t("tripOffers.stats.accepted"),
                  rejected: t("tripOffers.stats.rejected"),
                  expired: t("tripOffers.stats.expired"),
                }}
              />
            </div>
          </div>

          {/* Offer cards */}
          <div className="p-4 flex flex-col gap-3">
            {(offers || []).length > 0 ? (
              (offers || []).map((offer) => {
                const trip = tripMap.get(offer.trip_id);
                return (
                  <div
                    key={offer.id}
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-divider bg-surface transition-all duration-200 hover:border-primary/25 hover:shadow-sm gap-4"
                  >
                    {/* Left: Route */}
                    <div className="flex items-stretch gap-3.5 flex-1 min-w-0 w-full sm:w-auto">
                      <div className="flex flex-col items-center pt-1.5 pb-1 w-4 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full ring-4" style={{ background: "var(--success)", boxShadow: `0 0 0 4px var(--success-surface)` }} />
                        <div className="w-[1.5px] grow my-1.5" style={{ background: `linear-gradient(to bottom, var(--success-surface), var(--accent-surface))` }} />
                        <div className="w-2.5 h-2.5 rounded-full ring-4" style={{ background: "var(--primary)", boxShadow: `0 0 0 4px var(--primary-surface)` }} />
                      </div>

                      <div className="flex flex-col justify-between py-0.5 min-w-0 flex-1">
                        <div className="mb-3">
                          <p className="text-[13px] font-black text-text-primary truncate">{trip?.pickup_address || "—"}</p>
                          <p className="text-[11px] font-bold text-text-tertiary mt-0.5">{t("trips.from")}</p>
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-text-primary truncate">{trip?.destination_address || "—"}</p>
                          <p className="text-[11px] font-bold text-text-tertiary mt-0.5">{t("trips.to")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Participants & Meta */}
                    <div className="flex flex-col gap-2 shrink-0 sm:px-5 sm:border-x border-divider w-full sm:w-auto sm:min-w-[180px] py-1">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                          <User size={13} className="text-text-tertiary" />
                          <span className="font-semibold truncate max-w-[130px]">{trip ? tripUserMap.get(trip.user_id) || "—" : "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                          <Car size={13} className="text-text-tertiary" />
                          <span className="font-semibold truncate max-w-[130px]">{driverMap.get(offer.driver_id) || "—"}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 text-[11px] text-text-tertiary font-medium mt-1 pt-2 border-t border-divider/50">
                        <div className="flex items-center gap-1">
                          <Clock size={11} />
                          <span>{formatDate(offer.created_at)}</span>
                        </div>
                        {offer.responded_at && (
                          <div className="flex items-center gap-1 pl-4 opacity-70">
                            <span className="text-[10px]">↳ {formatDate(offer.responded_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Statuses & Actions */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between shrink-0 gap-3 w-full sm:w-[150px] py-1">
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-1.5 w-full">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(offer.status)}`}>
                          {getStatusLabel(offer.status, t)}
                        </span>
                        {trip && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(trip.status)}`}>
                            {t("tripOffers.trip")} {getStatusLabel(trip.status, t)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-auto w-full">
                        {offer.status === "pending" && (
                          <form action="/api/trip-offers/cancel" method="POST">
                            <input type="hidden" name="offer_id" value={offer.id} />
                            <button
                              type="submit"
                              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-error/20 bg-error/8 text-error text-[11px] font-bold transition-all hover:bg-error/15"
                            >
                              {t("common.cancel")}
                            </button>
                          </form>
                        )}
                        <Link
                          href={`/dashboard/trips/${offer.trip_id}`}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-primary/20 bg-primary/8 text-primary text-[11px] font-bold transition-all hover:bg-primary/15 hover:border-primary/35 w-full sm:w-auto"
                        >
                          {t("tripOffers.trip")}
                          <ArrowUpRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-divider">
                  <ArrowLeftRight size={24} className="text-text-disabled" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-secondary">{t("tripOffers.noOffers")}</p>
                  <p className="text-text-tertiary text-xs mt-1">{t("tripOffers.noOffersDesc")}</p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 py-4 border-t border-divider">
              <Link
                href={`/dashboard/trip-offers?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border border-divider text-text-secondary transition-all ${page <= 1 ? "pointer-events-none opacity-30" : "hover:bg-surface"}`}
              >
                <ChevronRight size={14} />
              </Link>

              {pages.map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-text-disabled text-[12px]">···</span>
                ) : (
                  <Link
                    key={p}
                    href={`/dashboard/trip-offers?page=${p}${statusFilter ? `&status=${statusFilter}` : ""}`}
                    className="w-8 h-8 rounded-lg text-[12px] font-bold flex items-center justify-center transition-all"
                    style={
                      p === page
                        ? { background: "var(--primary)", color: "var(--color-white)", border: "1px solid var(--primary)" }
                        : { border: "1px solid var(--divider)", color: "var(--text-secondary)" }
                    }
                  >
                    {p}
                  </Link>
                )
              )}

              <Link
                href={`/dashboard/trip-offers?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border border-divider text-text-secondary transition-all ${page >= totalPages ? "pointer-events-none opacity-30" : "hover:bg-surface"}`}
              >
                <ChevronLeft size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
