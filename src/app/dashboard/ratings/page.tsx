import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { DashboardShell } from "@/components/dashboard-shell";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Star, MessageSquare, Trash2, Car, User, Users } from "lucide-react";

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
    { key: "driver_ratings", label: t("ratings.tabs.driverRatings"), count: driverRatingsCountRes.count || 0, icon: Car, color: "#F59E0B" },
    { key: "user_ratings", label: t("ratings.tabs.userRatings"), count: userRatingsCountRes.count || 0, icon: Users, color: "#8B5CF6" },
  ];

  // Driver list for filter
  const { data: drivers } = await supabase
    .from("users")
    .select("id, name")
    .eq("role", "driver");

  /* ── DRIVER RATINGS (existing ratings table) ── */
  let ratings: any[] = [];
  let ratingsCount = 0;
  let ratingsTotalPages = 1;
  let avgRating = "0.0";
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  if (tab === "driver_ratings") {
    let query = supabase
      .from("ratings")
      .select("*, users!ratings_user_id_fkey(name, avatar_url), trips(id, pickup_address, destination_address)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (driverFilter) query = query.eq("driver_id", driverFilter);
    if (minRating > 0) query = query.gte("rating", minRating);

    const { data, count } = await query;
    ratings = data || [];
    ratingsCount = count || 0;
    ratingsTotalPages = Math.ceil(ratingsCount / pageSize);

    avgRating = ratings.length
      ? (ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length).toFixed(1)
      : "0.0";

    ratings.forEach((r) => {
      const rating = Math.round(Number(r.rating));
      if (rating >= 1 && rating <= 5) ratingCounts[rating as keyof typeof ratingCounts]++;
    });
  }

  /* ── USER RATINGS (user_ratings table) ── */
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

    userAvgRating = userRatings.length
      ? (userRatings.reduce((sum, r) => sum + Number(r.rating), 0) / userRatings.length).toFixed(1)
      : "0.0";

    userRatings.forEach((r) => {
      const rating = Math.round(Number(r.rating));
      if (rating >= 1 && rating <= 5) userRatingCounts[rating as keyof typeof userRatingCounts]++;
    });

    // Get user names
    const allUserIds = [...new Set(userRatings.map((r) => [r.user_id, r.driver_id]).flat().filter(Boolean))];
    if (allUserIds.length) {
      const { data: users } = await supabase.from("users").select("id, name, role").in("id", allUserIds);
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

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("ratings.title")}</h1>
            <p className="text-sm text-text-secondary mt-1">{t("ratings.subtitle")}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("ratings.stats.total"), value: currentTotal, icon: MessageSquare, color: "#3B82F6" },
              { label: t("ratings.stats.average"), value: currentAvg, icon: Star, color: "#F59E0B" },
              { label: t("ratings.stats.fiveStars"), value: currentCounts[5], icon: Star, color: "#10B981" },
              { label: t("ratings.stats.oneTwoStars"), value: currentCounts[1] + currentCounts[2], icon: Star, color: "#EF4444" },
            ].map((stat) => (
              <div key={stat.label} className="dash-card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}>
                    <stat.icon size={18} style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-[11px] text-text-tertiary">{stat.label}</p>
                    <p className="text-[18px] font-black text-text-primary">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/dashboard/ratings?tab=${t.key}`}
              id={`ratings-tab-${t.key}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200"
              style={
                tab === t.key
                  ? { background: `${t.color}25`, border: `1px solid ${t.color}35`, color: t.color, boxShadow: `0 4px 12px ${t.color}15` }
                  : { background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-tertiary)" }
              }
            >
              <t.icon size={14} />
              {t.label}
              {t.count > 0 && (
                <span className="min-w-[20px] h-5 rounded-full text-[10px] font-black flex items-center justify-center px-1.5" style={{ background: tab === t.key ? t.color : "var(--surface-glass)", color: tab === t.key ? "white" : "var(--text-tertiary)", border: tab === t.key ? "none" : "1px solid var(--divider)" }}>
                  {t.count}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Rating Distribution */}
        <div className="dash-card p-5">
          <h3 className="text-[13px] font-bold text-text-primary mb-4">{t("ratings.distribution")}</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = currentCounts[stars as keyof typeof currentCounts];
              const total = tab === "driver_ratings" ? (ratings?.length || 1) : (userRatings?.length || 1);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const colors = { 5: "#10B981", 4: "#8B5CF6", 3: "#3B82F6", 2: "#F59E0B", 1: "#EF4444" };
              return (
                <div key={stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-[12px] font-bold text-text-secondary">{stars}</span>
                    <Star size={12} style={{ color: colors[stars as keyof typeof colors] }} />
                  </div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-glass)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, background: colors[stars as keyof typeof colors] }} />
                  </div>
                  <span className="text-[11px] text-text-tertiary w-10 text-left">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters (only for driver ratings tab) */}
        {tab === "driver_ratings" && (
          <form className="flex flex-wrap gap-3 items-center">
            <input type="hidden" name="tab" value="driver_ratings" />
            <select name="driver_id" defaultValue={driverFilter} className="px-4 py-2.5 rounded-xl text-[13px] outline-none" style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}>
              <option value="">{t("ratings.filters.allDrivers")}</option>
              {(drivers || []).map((driver) => (
                <option key={driver.id} value={driver.id}>{driver.name || driver.id.slice(0, 8)}</option>
              ))}
            </select>
            <select name="min_rating" defaultValue={minRating || ""} className="px-4 py-2.5 rounded-xl text-[13px] outline-none" style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}>
              <option value="">{t("ratings.filters.allRatings")}</option>
              <option value="4">{t("ratings.filters.fourPlus")}</option>
              <option value="3">{t("ratings.filters.threePlus")}</option>
              <option value="1">{t("ratings.filters.oneTwo")}</option>
            </select>
            <button type="submit" className="btn btn-primary px-4 py-2.5 rounded-xl text-[13px] font-medium">{t("ratings.filters.apply")}</button>
            {(driverFilter || minRating > 0) && (
              <Link href="/dashboard/ratings?tab=driver_ratings" className="px-4 py-2.5 rounded-xl text-[13px] text-text-tertiary hover:text-text-secondary" style={{ border: "1px solid var(--divider)" }}>{t("ratings.filters.reset")}</Link>
            )}
          </form>
        )}

        {/* Filters (only for user ratings tab) */}
        {tab === "user_ratings" && (
          <form className="flex flex-wrap gap-3 items-center">
            <input type="hidden" name="tab" value="user_ratings" />
            <select name="min_rating" defaultValue={minRating || ""} className="px-4 py-2.5 rounded-xl text-[13px] outline-none" style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}>
              <option value="">{t("ratings.filters.allRatings")}</option>
              <option value="4">{t("ratings.filters.fourPlus")}</option>
              <option value="3">{t("ratings.filters.threePlus")}</option>
              <option value="1">{t("ratings.filters.oneTwo")}</option>
            </select>
            <button type="submit" className="btn btn-primary px-4 py-2.5 rounded-xl text-[13px] font-medium">{t("ratings.filters.apply")}</button>
            {minRating > 0 && (
              <Link href="/dashboard/ratings?tab=user_ratings" className="px-4 py-2.5 rounded-xl text-[13px] text-text-tertiary hover:text-text-secondary" style={{ border: "1px solid var(--divider)" }}>{t("ratings.filters.reset")}</Link>
            )}
          </form>
        )}

        {/* ── DRIVER RATINGS LIST ── */}
        {tab === "driver_ratings" && (
          <div className="grid gap-4">
            {ratings.map((rating) => {
              const user = rating.users as unknown as { name: string; avatar_url: string } | null;
              const trip = rating.trips as unknown as { id: string; pickup_address: string; destination_address: string } | null;
              const stars = Math.round(Number(rating.rating));
              return (
                <div key={rating.id} className="dash-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[16px] font-bold" style={{ background: "rgba(59,130,246,0.15)", color: "#60A5FA" }}>
                        {(user?.name || "?")[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-text-primary">{user?.name || t("common.user")}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < stars ? "#F59E0B" : "transparent"} style={{ color: i < stars ? "#F59E0B" : "var(--text-disabled)" }} />
                            ))}
                          </div>
                          <span className="text-[12px] text-text-tertiary">{rating.rating}/5</span>
                        </div>
                        {rating.comment && (
                          <p className="text-[14px] text-text-secondary mb-3 leading-relaxed">&quot;{rating.comment}&quot;</p>
                        )}
                        {trip && (
                          <div className="flex items-center gap-2 text-[11px] text-text-disabled">
                            <Car size={12} />
                            <span>{t("ratings.trip")}: {trip.pickup_address?.slice(0, 30)}... → {trip.destination_address?.slice(0, 30)}...</span>
                          </div>
                        )}
                        <p className="text-[11px] text-text-disabled mt-2">{formatDate(rating.created_at)}</p>
                      </div>
                    </div>
                    <form action={`/api/ratings/delete`} method="POST">
                      <input type="hidden" name="rating_id" value={rating.id} />
                      <button type="submit" className="p-2 rounded-lg hover:bg-error/10 text-text-tertiary hover:text-error transition-colors" title={t("ratings.deleteRating")}>
                        <Trash2 size={16} />
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
          <div className="grid gap-4">
            {userRatings.map((rating) => {
              const user = rating.user as { name: string; role: string } | undefined;
              const driver = rating.driver as { name: string; role: string } | undefined;
              const stars = Math.round(Number(rating.rating));
              return (
                <div key={rating.id} className="dash-card p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[16px] font-bold" style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>
                      {(driver?.name || "?")[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Car size={12} className="text-emerald-400" />
                          <span className="font-bold text-text-primary text-[13px]">{driver?.name || t("common.driver")}</span>
                        </div>
                        <span className="text-[11px] text-text-disabled">←</span>
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-blue-400" />
                          <span className="text-text-secondary text-[13px]">{user?.name || t("common.user")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < stars ? "#8B5CF6" : "transparent"} style={{ color: i < stars ? "#8B5CF6" : "var(--text-disabled)" }} />
                          ))}
                        </div>
                        <span className="text-[12px] text-text-tertiary">{rating.rating}/5</span>
                      </div>
                      {rating.comment && (
                        <p className="text-[14px] text-text-secondary mb-3 leading-relaxed">&quot;{rating.comment}&quot;</p>
                      )}
                      <p className="text-[11px] text-text-disabled">{formatDate(rating.created_at)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {((tab === "driver_ratings" && ratings.length === 0) || (tab === "user_ratings" && userRatings.length === 0)) && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}>
              <Star size={28} className="text-text-disabled opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-text-secondary font-semibold">{t("ratings.noRatings")}</p>
              <p className="text-text-tertiary text-sm mt-1">{t("ratings.noRatingsDesc")}</p>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-text-tertiary">{t("common.page")} {page} {t("common.of")} {totalPages}</div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`?tab=${tab}&page=${page - 1}${driverFilter ? `&driver_id=${driverFilter}` : ""}${minRating ? `&min_rating=${minRating}` : ""}`} className="px-4 py-2 rounded-xl text-[12px] text-text-secondary hover:text-text-primary transition-colors" style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}>{t("common.previous")}</Link>
              )}
              {page < totalPages && (
                <Link href={`?tab=${tab}&page=${page + 1}${driverFilter ? `&driver_id=${driverFilter}` : ""}${minRating ? `&min_rating=${minRating}` : ""}`} className="px-4 py-2 rounded-xl text-[12px] text-text-secondary hover:text-text-primary transition-colors" style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}>{t("common.next")}</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
