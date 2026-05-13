import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { DashboardShell } from "@/components/dashboard-shell";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeftRight, User, Car, ArrowUpRight, Clock, ChevronLeft, ChevronRight } from "lucide-react";

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

  // Stats
  const { data: statusStats } = await supabase.from("trip_offers").select("status");
  const stats = {
    total: statusStats?.length || 0,
    pending: statusStats?.filter((s) => s.status === "pending").length || 0,
    accepted: statusStats?.filter((s) => s.status === "accepted").length || 0,
    rejected: statusStats?.filter((s) => s.status === "rejected").length || 0,
    expired: statusStats?.filter((s) => s.status === "expired").length || 0,
  };

  const statCards = [
    { label: t("tripOffers.stats.all"), value: stats.total, color: "var(--primary)", bg: "var(--accent-surface)", border: "var(--accent-border)", href: "" },
    { label: t("tripOffers.stats.pending"), value: stats.pending, color: "var(--warning)", bg: "var(--warning-surface)", border: "var(--warning-border)", href: "pending" },
    { label: t("tripOffers.stats.accepted"), value: stats.accepted, color: "var(--success)", bg: "var(--success-surface)", border: "var(--success-border)", href: "accepted" },
    { label: t("tripOffers.stats.rejected"), value: stats.rejected, color: "var(--error)", bg: "var(--error-surface)", border: "var(--error-border)", href: "rejected" },
    { label: t("tripOffers.stats.expired"), value: stats.expired, color: "var(--text-disabled)", bg: "var(--neutral-surface)", border: "var(--neutral-border)", href: "expired" },
  ];

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
    <DashboardShell>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("tripOffers.title")}</h1>
            <p className="text-sm text-text-secondary mt-1">{t("tripOffers.subtitle")}</p>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {statCards.map((s) => (
            <Link
              key={s.href}
              href={`/dashboard/trip-offers${s.href ? `?status=${s.href}` : ""}`}
              className="rounded-xl px-4 py-3 transition-all hover:scale-[1.01]"
              style={{
                background: statusFilter === s.href || (!statusFilter && !s.href) ? s.bg : "var(--surface)",
                border: `1px solid ${statusFilter === s.href || (!statusFilter && !s.href) ? s.border : "var(--divider)"}`,
              }}
            >
              <div className="text-[22px] font-black num" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] text-text-tertiary font-semibold mt-0.5">{s.label}</div>
            </Link>
          ))}
        </div>

        {/* ── Offers Card List ── */}
        <div className="rounded-2xl border border-divider bg-surface flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-divider flex items-center justify-between">
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
            {statusFilter && (
              <Link
                href="/dashboard/trip-offers"
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-warning/30 bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
              >
                ✕ {t("tripOffers.clearFilter")}
              </Link>
            )}
          </div>

          {/* Offer cards */}
          <div className="p-4 flex flex-col gap-3">
            {(offers || []).length > 0 ? (
              (offers || []).map((offer) => {
                const trip = tripMap.get(offer.trip_id);
                return (
                  <div
                    key={offer.id}
                    className="group flex flex-col sm:flex-row justify-between p-3.5 rounded-xl border border-divider bg-surface transition-all duration-200 hover:border-primary/25 hover:shadow-sm"
                  >
                    {/* Left: Route */}
                    <div className="flex items-stretch gap-3.5 flex-1 min-w-0">
                      <div className="flex flex-col items-center pt-1.5 pb-1 w-4 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full ring-4" style={{ background: "var(--success)", boxShadow: `0 0 0 4px var(--success-surface)` }} />
                        <div className="w-[1.5px] grow my-1.5" style={{ background: `linear-gradient(to bottom, var(--success-surface), var(--accent-surface))` }} />
                        <div className="w-2.5 h-2.5 rounded-full ring-4" style={{ background: "var(--primary)", boxShadow: `0 0 0 4px var(--primary-surface)` }} />
                      </div>

                      <div className="flex flex-col justify-between py-0.5 min-w-0 flex-1">
                        <div className="mb-4">
                          <p className="text-[13px] font-black text-text-primary truncate">{trip?.pickup_address || "—"}</p>
                          <p className="text-[11px] font-bold text-text-tertiary mt-0.5">{t("trips.from")}</p>
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-text-primary truncate">{trip?.destination_address || "—"}</p>
                          <p className="text-[11px] font-bold text-text-tertiary mt-0.5">{t("trips.to")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Meta + Actions */}
                    <div className="flex flex-col items-end justify-between shrink-0 sm:pl-4 mt-3 sm:mt-0 sm:border-l border-divider gap-3 min-w-[180px]">
                      <div className="flex flex-col items-end gap-1.5 w-full">
                        {/* Statuses */}
                        <div className="flex items-center gap-2 justify-end w-full">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(offer.status)}`}>
                            {getStatusLabel(offer.status)}
                          </span>
                          {trip && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(trip.status)}`}>
                              {getStatusLabel(trip.status)}
                            </span>
                          )}
                        </div>

                        {/* Driver / Passenger */}
                        <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
                          <div className="flex items-center gap-1">
                            <Car size={10} />
                            <span className="truncate max-w-[70px]">{driverMap.get(offer.driver_id) || "—"}</span>
                          </div>
                          <span className="opacity-40">·</span>
                          <div className="flex items-center gap-1">
                            <User size={10} />
                            <span className="truncate max-w-[70px]">{trip ? tripUserMap.get(trip.user_id) || "—" : "—"}</span>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-1 text-text-tertiary">
                          <Clock size={11} />
                          <span className="text-[11px] font-bold">{formatDate(offer.created_at)}</span>
                          {offer.responded_at && (
                            <span className="text-text-disabled text-[10px]">→ {formatDate(offer.responded_at)}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/trips/${offer.trip_id}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/8 text-primary text-[11px] font-bold transition-all hover:bg-primary/15"
                        >
                          {t("tripOffers.trip")}
                          <ArrowUpRight size={11} />
                        </Link>
                        {offer.status === "pending" && (
                          <form action="/api/trip-offers/cancel" method="POST">
                            <input type="hidden" name="offer_id" value={offer.id} />
                            <button
                              type="submit"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-error/20 bg-error/8 text-error text-[11px] font-bold transition-all hover:bg-error/15"
                            >
                              {t("tripOffers.cancel")}
                            </button>
                          </form>
                        )}
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
                        ? { background: "var(--primary)", color: "white", border: "1px solid var(--primary)" }
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
    </DashboardShell>
  );
}
