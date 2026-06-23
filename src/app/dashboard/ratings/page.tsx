import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Star, MessageSquare, Trash2, Car, User, Users, SlidersHorizontal, Phone } from "lucide-react";

type TabType = "driver_ratings" | "user_ratings";

export default async function RatingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; driver_id?: string; min_rating?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const tab = (params.tab as TabType) || "driver_ratings";
  const page = Number(params.page) || 1;
  const driverFilter = params.driver_id || "";
  const minRating = params.min_rating ? Number(params.min_rating) : 0;
  const pageSize = 15;

  const t = await getTranslations();
  const supabase = createAdminClient();

  /* ── Stats ── */
  const [driverRatingsCountRes, userRatingsCountRes] = await Promise.all([
    supabase.from("ratings").select("id", { count: "exact", head: true }),
    supabase.from("user_ratings").select("id", { count: "exact", head: true }),
  ]);

  const tabs = [
    { key: "driver_ratings", label: t("ratings.tabs.driverRatings"), count: driverRatingsCountRes.count || 0, icon: Car, color: "var(--warning)", colorRaw: "var(--warning-rgb)" },
    { key: "user_ratings", label: t("ratings.tabs.userRatings"), count: userRatingsCountRes.count || 0, icon: Users, color: "var(--primary)", colorRaw: "var(--primary-rgb)" },
  ];

  // Driver list for filter
  const { data: drivers } = await supabase
    .from("users")
    .select("id, name")
    .eq("role", "driver");

  /* ── DRIVER RATINGS ── */
  let ratings: any[] = [];
  let ratingsCount = 0;
  let ratingsTotalPages = 1;
  let avgRating = "0.0";
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  if (tab === "driver_ratings") {
    let query = supabase
      .from("ratings")
      .select("*, users!ratings_user_id_fkey(id, name, phone, avatar_url), trips(id, pickup_address, destination_address)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (driverFilter) query = query.eq("driver_id", driverFilter);
    if (minRating > 0) query = query.gte("rating", minRating);

    const { data, count } = await query;
    ratings = data || [];
    ratingsCount = count || 0;
    ratingsTotalPages = Math.ceil(ratingsCount / pageSize);

    // Aggregate avg + histogram from ALL matching rows (not just current page)
    let aggQuery = supabase.from("ratings").select("rating");
    if (driverFilter) aggQuery = aggQuery.eq("driver_id", driverFilter);
    if (minRating > 0) aggQuery = aggQuery.gte("rating", minRating);
    const { data: allRatingRows } = await aggQuery;
    const allRatingValues = (allRatingRows || []).map((r: { rating: number }) => Number(r.rating));

    avgRating = allRatingValues.length
      ? (allRatingValues.reduce((sum, r) => sum + r, 0) / allRatingValues.length).toFixed(1)
      : "0.0";

    allRatingValues.forEach((rating) => {
      const rounded = Math.round(rating);
      if (rounded >= 1 && rounded <= 5) ratingCounts[rounded as keyof typeof ratingCounts]++;
    });
  }

  /* ── USER RATINGS ── */
  let userRatings: any[] = [];
  let userRatingsCount = 0;
  let userRatingsTotalPages = 1;
  let userAvgRating = "0.0";
  const userRatingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  if (tab === "user_ratings") {
    let query = supabase
      .from("user_ratings")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (minRating > 0) query = query.gte("rating", minRating);

    const { data, count } = await query;
    userRatings = data || [];
    userRatingsCount = count || 0;
    userRatingsTotalPages = Math.ceil(userRatingsCount / pageSize);

    // Aggregate avg + histogram from ALL matching rows (not just current page)
    let userAggQuery = supabase.from("user_ratings").select("rating");
    if (minRating > 0) userAggQuery = userAggQuery.gte("rating", minRating);
    const { data: allUserRatingRows } = await userAggQuery;
    const allUserRatingValues = (allUserRatingRows || []).map((r: { rating: number }) => Number(r.rating));

    userAvgRating = allUserRatingValues.length
      ? (allUserRatingValues.reduce((sum, r) => sum + r, 0) / allUserRatingValues.length).toFixed(1)
      : "0.0";

    allUserRatingValues.forEach((rating) => {
      const rounded = Math.round(rating);
      if (rounded >= 1 && rounded <= 5) userRatingCounts[rounded as keyof typeof userRatingCounts]++;
    });

    const allUserIds = [...new Set(userRatings.map((r) => [r.user_id, r.driver_id]).flat().filter(Boolean))];
    if (allUserIds.length) {
      const { data: users } = await supabase.from("users").select("id, name, phone, role").in("id", allUserIds);
      const userMap = new Map((users || []).map((u) => [u.id, u]));
      userRatings = userRatings.map((r) => ({
        ...r,
        user: userMap.get(r.user_id),
        driver: userMap.get(r.driver_id),
      }));
    }
  }

  const totalPages = tab === "driver_ratings" ? ratingsTotalPages : userRatingsTotalPages;
  const currentAvg = tab === "driver_ratings" ? avgRating : userAvgRating;
  const currentCounts = tab === "driver_ratings" ? ratingCounts : userRatingCounts;
  const currentTotal = tab === "driver_ratings" ? ratingsCount : userRatingsCount;
  const starColors: Record<number, string> = { 5: "var(--success)", 4: "var(--primary)", 3: "var(--info)", 2: "var(--warning)", 1: "var(--error)" };
  const starColorRaw: Record<number, string> = { 5: "16,185,129", 4: "245,158,11", 3: "59,130,246", 2: "245,158,11", 1: "239,68,68" };

  const maxCount = Math.max(...Object.values(currentCounts), 1);

  return (
    <>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("ratings.title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("ratings.subtitle")}</p>
        </div>

        {/* ── Tabs + Stats row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Tab switcher */}
          <div className="flex gap-2 p-1 rounded-xl" style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}>
            {tabs.map((tabItem) => (
              <Link
                key={tabItem.key}
                href={`/dashboard/ratings?tab=${tabItem.key}`}
                id={`ratings-tab-${tabItem.key}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200"
                style={
                  tab === tabItem.key
                    ? { background: `rgba(${tabItem.colorRaw},0.14)`, border: `1px solid rgba(${tabItem.colorRaw},0.28)`, color: tabItem.color }
                    : { color: "var(--text-tertiary)", border: "1px solid transparent" }
                }
              >
                <tabItem.icon size={14} />
                {tabItem.label}
                {tabItem.count > 0 && (
                  <span
                    className="min-w-[20px] h-5 rounded-full text-[10px] font-black flex items-center justify-center px-1.5"
                    style={
                      tab === tabItem.key
                        ? { background: `rgba(${tabItem.colorRaw},0.20)`, color: tabItem.color }
                        : { background: "var(--surface-glass)", color: "var(--text-tertiary)" }
                    }
                  >
                    {tabItem.count}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Quick stats inline */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--warning-surface)", border: "1px solid var(--warning-border)" }}>
                <Star size={14} style={{ color: "var(--warning)" }} />
              </div>
              <div>
                <p className="text-[18px] font-black text-text-primary leading-none">{currentAvg}</p>
                <p className="text-[10px] text-text-tertiary">{t("ratings.stats.average")}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-divider" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--info-surface)", border: "1px solid var(--divider)" }}>
                <MessageSquare size={14} style={{ color: "var(--info)" }} />
              </div>
              <div>
                <p className="text-[18px] font-black text-text-primary leading-none">{currentTotal}</p>
                <p className="text-[10px] text-text-tertiary">{t("ratings.stats.total")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Card: Distribution + Filters side by side ── */}
        <div className="rounded-2xl border border-divider bg-surface overflow-hidden">
          {/* Card header with filters */}
          <div className="px-5 py-4 border-b border-divider flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10 border border-warning/20">
                <Star size={16} style={{ color: "var(--warning)" }} />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-text-primary leading-none">{t("ratings.distribution")}</h3>
                <p className="mt-1 text-[12px] font-medium text-text-tertiary">{currentTotal} {t("ratings.stats.total").toLowerCase()}</p>
              </div>
            </div>

            {/* Filters as dropdowns */}
            <form className="flex items-center gap-2 flex-wrap">
              <input type="hidden" name="tab" value={tab} />

              {tab === "driver_ratings" && (
                <div className="relative">
                  <select
                    name="driver_id"
                    defaultValue={driverFilter}
                    className="appearance-none pl-3 pr-8 py-2 rounded-xl text-[13px] font-semibold outline-none cursor-pointer transition-colors"
                    style={{
                      background: driverFilter ? "var(--accent-surface)" : "var(--surface-elevated)",
                      border: `1px solid ${driverFilter ? "var(--accent-border)" : "var(--divider-strong)"}`,
                      color: driverFilter ? "var(--primary)" : "var(--text-primary)",
                    }}
                  >
                    <option value="">{t("ratings.filters.allDrivers")}</option>
                    {(drivers || []).map((driver) => (
                      <option key={driver.id} value={driver.id}>{driver.name || driver.id.slice(0, 8)}</option>
                    ))}
                  </select>
                  <SlidersHorizontal size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
                </div>
              )}

              <div className="relative">
                <select
                  name="min_rating"
                  defaultValue={minRating || ""}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl text-[13px] font-semibold outline-none cursor-pointer transition-colors"
                  style={{
                    background: minRating > 0 ? "var(--warning-surface)" : "var(--surface-elevated)",
                    border: `1px solid ${minRating > 0 ? "var(--warning-border)" : "var(--divider-strong)"}`,
                    color: minRating > 0 ? "var(--warning)" : "var(--text-primary)",
                  }}
                >
                  <option value="">{t("ratings.filters.allRatings")}</option>
                  <option value="4">{t("ratings.filters.fourPlus")} ★★★★</option>
                  <option value="3">{t("ratings.filters.threePlus")} ★★★</option>
                  <option value="1">{t("ratings.filters.oneTwo")} ★★</option>
                </select>
                <Star size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
              </div>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all"
                style={{ background: "var(--primary)", color: "var(--color-black)", border: "1px solid var(--primary)" }}
              >
                {t("ratings.filters.apply")}
              </button>

              {(driverFilter || minRating > 0) && (
                <Link
                  href={`/dashboard/ratings?tab=${tab}`}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors"
                  style={{ border: "1px solid var(--divider)", background: "var(--surface-elevated)" }}
                >
                  {t("ratings.filters.reset")}
                </Link>
              )}
            </form>
          </div>

          {/* Compact Rating Distribution */}
          <div className="px-5 py-4">
            <div className="flex items-end gap-2 h-20">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = currentCounts[stars as keyof typeof currentCounts];
                const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const color = starColors[stars];
                const rgb = starColorRaw[stars];
                const isActive = !minRating || Number(minRating) === stars || (minRating === 1 && stars <= 2);
                return (
                  <Link
                    key={stars}
                    href={`/dashboard/ratings?tab=${tab}&min_rating=${stars}`}
                    className="flex-1 flex flex-col items-center gap-1.5 group transition-all"
                    title={`${stars} ★ — ${count}`}
                  >
                    {/* Count label */}
                    <span
                      className="text-[10px] font-black transition-all"
                      style={{ color: isActive ? color : "var(--text-disabled)" }}
                    >
                      {count}
                    </span>
                    {/* Bar */}
                    <div className="w-full rounded-t-lg overflow-hidden" style={{ height: "48px", background: "var(--surface-elevated)" }}>
                      <div
                        className="w-full rounded-t-lg transition-all duration-500 group-hover:opacity-80"
                        style={{
                          height: `${Math.max(heightPct, 4)}%`,
                          marginTop: `${100 - Math.max(heightPct, 4)}%`,
                          background: isActive
                            ? `linear-gradient(to top, rgba(${rgb},0.85), rgba(${rgb},0.50))`
                            : "var(--divider)",
                        }}
                      />
                    </div>
                    {/* Star label */}
                    <div className="flex items-center gap-0.5">
                      <span className="text-[10px] font-bold" style={{ color: isActive ? color : "var(--text-disabled)" }}>{stars}</span>
                      <Star size={9} style={{ color: isActive ? color : "var(--text-disabled)" }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── DRIVER RATINGS LIST ── */}
        {tab === "driver_ratings" && (
          <div className="grid gap-3">
            {ratings.map((rating) => {
              const user = rating.users as unknown as { id: string; name: string; phone?: string; avatar_url: string } | null;
              const trip = rating.trips as unknown as { id: string; pickup_address: string; destination_address: string } | null;
              const stars = Math.round(Number(rating.rating));
              return (
                <div key={rating.id} className="rounded-xl border border-divider bg-surface p-4 hover:border-warning/20 transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black shrink-0" style={{ background: "var(--info-surface)", color: "var(--info)", border: "1px solid var(--divider)" }}>
                        {(user?.name || "?")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-bold text-text-primary text-[14px]">{user?.name || t("common.user")}</span>
                          {user?.phone && (
                            <a
                              href={`tel:${user.phone}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-text-tertiary hover:text-primary transition-colors num"
                              dir="ltr"
                            >
                              <Phone size={10} />
                              {user.phone}
                            </a>
                          )}
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={13} fill={i < stars ? "var(--warning)" : "transparent"} style={{ color: i < stars ? "var(--warning)" : "var(--text-disabled)" }} />
                            ))}
                          </div>
                          <span className="text-[11px] font-bold text-text-tertiary">{rating.rating}/5</span>
                        </div>
                        {rating.comment && (
                          <p className="text-[13px] text-text-secondary leading-relaxed mb-2 italic">&quot;{rating.comment}&quot;</p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-text-disabled flex-wrap">
                          {trip && (
                            <div className="flex items-center gap-1">
                              <Car size={11} />
                              <span className="truncate max-w-[200px]">{trip.pickup_address?.slice(0, 25)}… → {trip.destination_address?.slice(0, 25)}…</span>
                            </div>
                          )}
                          <span>{formatDate(rating.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <form action={`/api/ratings/delete`} method="POST" className="shrink-0">
                      <input type="hidden" name="rating_id" value={rating.id} />
                      <button type="submit" className="p-2 rounded-lg hover:bg-error/10 text-text-disabled hover:text-error transition-colors" title={t("ratings.deleteRating")}>
                        <Trash2 size={15} />
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── USER RATINGS LIST ── */}
        {tab === "user_ratings" && (
          <div className="grid gap-3">
            {userRatings.map((rating) => {
              const user = rating.user as { id: string; name: string; phone?: string; role: string } | undefined;
              const driver = rating.driver as { id: string; name: string; phone?: string; role: string } | undefined;
              const stars = Math.round(Number(rating.rating));
              return (
                <div key={rating.id} className="rounded-xl border border-divider bg-surface p-4 hover:border-primary/20 transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black shrink-0" style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}>
                      {(driver?.name || "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Car size={12} className="text-text-tertiary" />
                          <span className="font-bold text-text-primary text-[13px]">{driver?.name || t("common.driver")}</span>
                          {driver?.phone && (
                            <a
                              href={`tel:${driver.phone}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-text-tertiary hover:text-primary transition-colors num"
                              dir="ltr"
                            >
                              <Phone size={10} />
                              {driver.phone}
                            </a>
                          )}
                        </div>
                        <span className="text-text-disabled text-[11px]">←</span>
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-text-tertiary" />
                          <span className="text-text-secondary text-[13px]">{user?.name || t("common.user")}</span>
                          {user?.phone && (
                            <a
                              href={`tel:${user.phone}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-text-tertiary hover:text-primary transition-colors num"
                              dir="ltr"
                            >
                              <Phone size={10} />
                              {user.phone}
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={13} fill={i < stars ? "var(--primary)" : "transparent"} style={{ color: i < stars ? "var(--primary)" : "var(--text-disabled)" }} />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-text-tertiary">{rating.rating}/5</span>
                      </div>
                      {rating.comment && (
                        <p className="text-[13px] text-text-secondary leading-relaxed mb-2 italic">&quot;{rating.comment}&quot;</p>
                      )}
                      <p className="text-[11px] text-text-disabled">{formatDate(rating.created_at)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Empty State ── */}
        {((tab === "driver_ratings" && ratings.length === 0) || (tab === "user_ratings" && userRatings.length === 0)) && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}>
              <Star size={28} className="text-text-disabled opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-text-secondary font-semibold">{t("ratings.noRatings")}</p>
              <p className="text-text-tertiary text-sm mt-1">{t("ratings.noRatingsDesc")}</p>
            </div>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-text-tertiary">{t("common.page")} {page} {t("common.of")} {totalPages}</div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`?tab=${tab}&page=${page - 1}${driverFilter ? `&driver_id=${driverFilter}` : ""}${minRating ? `&min_rating=${minRating}` : ""}`}
                  className="px-4 py-2 rounded-xl text-[12px] font-semibold text-text-secondary hover:text-text-primary transition-colors"
                  style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}
                >
                  {t("common.previous")}
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?tab=${tab}&page=${page + 1}${driverFilter ? `&driver_id=${driverFilter}` : ""}${minRating ? `&min_rating=${minRating}` : ""}`}
                  className="px-4 py-2 rounded-xl text-[12px] font-semibold text-text-secondary hover:text-text-primary transition-colors"
                  style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}
                >
                  {t("common.next")}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
