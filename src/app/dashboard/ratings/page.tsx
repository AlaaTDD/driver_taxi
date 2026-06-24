import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Star, MessageSquare, Trash2, Car, User, Users, SlidersHorizontal, Phone, ChevronLeft, ChevronRight } from "lucide-react";

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

  const [driverRatingsCountRes, userRatingsCountRes] = await Promise.all([
    supabase.from("ratings").select("id", { count: "exact", head: true }),
    supabase.from("user_ratings").select("id", { count: "exact", head: true }),
  ]);

  const tabs = [
    { key: "driver_ratings", label: t("ratings.tabs.driverRatings"), count: driverRatingsCountRes.count || 0, icon: Car, color: "var(--warning)", colorRaw: "var(--warning-rgb)" },
    { key: "user_ratings", label: t("ratings.tabs.userRatings"), count: userRatingsCountRes.count || 0, icon: Users, color: "var(--primary)", colorRaw: "var(--primary-rgb)" },
  ];

  const { data: drivers } = await supabase.from("users").select("id, name").eq("role", "driver");

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

  const barColors: Record<number, { from: string; to: string; glow: string; label: string }> = {
    5: { from: "#10B981", to: "#34D399", glow: "rgba(16,185,129,0.30)", label: "#10B981" },
    4: { from: "#22C55E", to: "#4ADE80", glow: "rgba(34,197,94,0.25)", label: "#22C55E" },
    3: { from: "#F59E0B", to: "#FCD34D", glow: "rgba(245,158,11,0.28)", label: "#F59E0B" },
    2: { from: "#F97316", to: "#FB923C", glow: "rgba(249,115,22,0.25)", label: "#F97316" },
    1: { from: "#EF4444", to: "#F87171", glow: "rgba(239,68,68,0.28)", label: "#EF4444" },
  };

  const avgFloat = parseFloat(currentAvg);

  // Smart pagination with ellipsis
  const buildPages = (): (number | "...")[] => {
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
  const baseHref = `/dashboard/ratings?tab=${tab}${driverFilter ? `&driver_id=${driverFilter}` : ""}${minRating ? `&min_rating=${minRating}` : ""}`;

  return (
    <>
      <div className="space-y-6">

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("ratings.title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("ratings.subtitle")}</p>
        </div>

        {/* Tabs + Stats row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

        {/* Rating Distribution Hero Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--divider)",
            boxShadow: "0 2px 32px 0 rgba(0,0,0,0.14)",
          }}
        >
          {/* Filter bar */}
          <div
            className="px-5 py-3 flex items-center justify-between gap-4 flex-wrap"
            style={{ borderBottom: "1px solid var(--divider)", background: "var(--surface-elevated)" }}
          >
            <div className="flex items-center gap-2">
              <Star size={14} style={{ color: "var(--warning)" }} />
              <span className="text-[13px] font-black text-text-primary">{t("ratings.distribution")}</span>
            </div>

            <form className="flex items-center gap-2 flex-wrap">
              <input type="hidden" name="tab" value={tab} />

              {tab === "driver_ratings" && (
                <div className="relative">
                  <select
                    name="driver_id"
                    defaultValue={driverFilter}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-xl text-[12px] font-semibold outline-none cursor-pointer"
                    style={{
                      background: driverFilter ? "rgba(245,158,11,0.10)" : "var(--surface)",
                      border: `1px solid ${driverFilter ? "rgba(245,158,11,0.30)" : "var(--divider-strong)"}`,
                      color: driverFilter ? "#F59E0B" : "var(--text-secondary)",
                    }}
                  >
                    <option value="">{t("ratings.filters.allDrivers")}</option>
                    {(drivers || []).map((driver) => (
                      <option key={driver.id} value={driver.id}>{driver.name || driver.id.slice(0, 8)}</option>
                    ))}
                  </select>
                  <SlidersHorizontal size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
                </div>
              )}

              <div className="relative">
                <select
                  name="min_rating"
                  defaultValue={minRating || ""}
                  className="appearance-none pl-3 pr-8 py-1.5 rounded-xl text-[12px] font-semibold outline-none cursor-pointer"
                  style={{
                    background: minRating > 0 ? "rgba(245,158,11,0.10)" : "var(--surface)",
                    border: `1px solid ${minRating > 0 ? "rgba(245,158,11,0.30)" : "var(--divider-strong)"}`,
                    color: minRating > 0 ? "#F59E0B" : "var(--text-secondary)",
                  }}
                >
                  <option value="">{t("ratings.filters.allRatings")}</option>
                  <option value="4">{t("ratings.filters.fourPlus")} ★★★★</option>
                  <option value="3">{t("ratings.filters.threePlus")} ★★★</option>
                  <option value="1">{t("ratings.filters.oneTwo")} ★★</option>
                </select>
                <Star size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
              </div>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12px] font-bold"
                style={{ background: "var(--primary)", color: "var(--color-black)" }}
              >
                {t("ratings.filters.apply")}
              </button>

              {(driverFilter || minRating > 0) && (
                <Link
                  href={`/dashboard/ratings?tab=${tab}`}
                  className="px-3 py-1.5 rounded-xl text-[12px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors"
                  style={{ border: "1px solid var(--divider)", background: "var(--surface)" }}
                >
                  {t("ratings.filters.reset")}
                </Link>
              )}
            </form>
          </div>

          {/* Distribution body */}
          <div className="flex flex-col md:flex-row">

            {/* Left: hero score */}
            <div
              className="flex flex-col items-center justify-center gap-4 px-10 py-8 shrink-0"
              style={{ borderInlineEnd: "1px solid var(--divider)", minWidth: "210px" }}
            >
              <div className="relative flex flex-col items-center gap-1">
                <div
                  className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{
                    width: "120px",
                    height: "120px",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "radial-gradient(circle, #F59E0B 0%, transparent 70%)",
                  }}
                />
                <span
                  className="relative leading-none font-black tabular-nums"
                  style={{
                    fontSize: "80px",
                    letterSpacing: "-5px",
                    background: "linear-gradient(155deg, #F59E0B 0%, #FBBF24 45%, #FDE68A 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {currentAvg}
                </span>
                <span className="relative text-[11px] font-semibold text-text-tertiary">
                  {t("ratings.stats.average")}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => {
                  const filled = s <= Math.floor(avgFloat);
                  const partial = !filled && s === Math.ceil(avgFloat) && avgFloat % 1 >= 0.5;
                  const gradId = `hg-${tab}-${s}`;
                  return (
                    <svg key={s} width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {partial && (
                        <defs>
                          <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
                            <stop offset="55%" stopColor="#F59E0B" />
                            <stop offset="55%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                      )}
                      <polygon
                        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                        fill={filled ? "#F59E0B" : partial ? `url(#${gradId})` : "transparent"}
                        stroke={filled || partial ? "#F59E0B" : "#374151"}
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  );
                })}
              </div>

              <div
                className="px-4 py-1.5 rounded-full text-[11px] font-bold"
                style={{
                  background: "rgba(245,158,11,0.10)",
                  color: "#F59E0B",
                  border: "1px solid rgba(245,158,11,0.20)",
                }}
              >
                {currentTotal.toLocaleString()} {t("ratings.stats.total").toLowerCase()}
              </div>
            </div>

            {/* Right: horizontal bars */}
            <div className="flex-1 flex flex-col justify-center gap-3.5 px-8 py-8">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = currentCounts[stars as keyof typeof currentCounts];
                const pct = currentTotal > 0 ? Math.round((count / currentTotal) * 100) : 0;
                const bc = barColors[stars];
                const isActive = !minRating || Number(minRating) === stars || (minRating === 1 && stars <= 2);

                return (
                  <Link
                    key={stars}
                    href={`/dashboard/ratings?tab=${tab}&min_rating=${stars}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="flex items-center gap-1 w-11 shrink-0" style={{ justifyContent: "flex-end" }}>
                      <span
                        className="text-[13px] font-black tabular-nums"
                        style={{ color: isActive ? bc.label : "var(--text-disabled)" }}
                      >
                        {stars}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <polygon
                          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                          fill={isActive ? bc.label : "#374151"}
                          strokeWidth="0"
                        />
                      </svg>
                    </div>

                    <div
                      className="relative flex-1 rounded-full overflow-hidden"
                      style={{
                        height: "11px",
                        background: "var(--surface-elevated)",
                        border: "1px solid var(--divider)",
                      }}
                    >
                      {pct > 0 && (
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: isActive
                              ? `linear-gradient(90deg, ${bc.from} 0%, ${bc.to} 100%)`
                              : "var(--divider-strong)",
                            boxShadow: isActive ? `0 0 12px ${bc.glow}` : "none",
                            transition: "width 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-24 shrink-0">
                      <span
                        className="text-[13px] font-black tabular-nums"
                        style={{
                          color: isActive ? bc.label : "var(--text-disabled)",
                          minWidth: "28px",
                          textAlign: "right",
                        }}
                      >
                        {count}
                      </span>
                      <span
                        className="text-[11px] font-semibold tabular-nums"
                        style={{ color: isActive ? "var(--text-tertiary)" : "var(--text-disabled)" }}
                      >
                        {pct}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* DRIVER RATINGS LIST */}
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

        {/* USER RATINGS LIST */}
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

        {/* Empty State */}
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">

            {/* Info */}
            <p className="text-[12px] font-medium order-2 sm:order-1" style={{ color: "var(--text-tertiary)" }}>
              {t("common.page")}{" "}
              <span className="font-black" style={{ color: "var(--text-secondary)" }}>{page}</span>{" "}
              {t("common.of")}{" "}
              <span className="font-black" style={{ color: "var(--text-secondary)" }}>{totalPages}</span>
              {" · "}
              <span className="font-black" style={{ color: "var(--text-secondary)" }}>{currentTotal.toLocaleString()}</span>{" "}
              {t("ratings.stats.total").toLowerCase()}
            </p>

            {/* Controls */}
            <div className="flex items-center gap-1 order-1 sm:order-2">

              {/* Prev */}
              <Link
                href={`${baseHref}&page=${page - 1}`}
                aria-label={t("common.previous")}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all${page <= 1 ? " pointer-events-none opacity-25" : ""}`}
                style={{ border: "1px solid var(--divider)", background: "var(--surface)" }}
              >
                <ChevronRight size={15} style={{ color: "var(--text-secondary)" }} />
              </Link>

              {/* Page numbers with ellipsis */}
              {pages.map((p, i) =>
                p === "..." ? (
                  <span
                    key={`e${i}`}
                    className="w-9 h-9 flex items-center justify-center text-[13px] font-bold"
                    style={{ color: "var(--text-disabled)" }}
                  >
                    ···
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={`${baseHref}&page=${p}`}
                    className="w-9 h-9 rounded-xl text-[13px] font-black flex items-center justify-center transition-all"
                    style={
                      p === page
                        ? {
                            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
                            color: "var(--color-white, #fff)",
                            border: "1px solid var(--primary)",
                            boxShadow: "0 4px 14px rgba(var(--primary-rgb),0.30)",
                          }
                        : {
                            border: "1px solid var(--divider)",
                            color: "var(--text-secondary)",
                            background: "var(--surface)",
                          }
                    }
                  >
                    {p}
                  </Link>
                )
              )}

              {/* Next */}
              <Link
                href={`${baseHref}&page=${page + 1}`}
                aria-label={t("common.next")}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all${page >= totalPages ? " pointer-events-none opacity-25" : ""}`}
                style={{ border: "1px solid var(--divider)", background: "var(--surface)" }}
              >
                <ChevronLeft size={15} style={{ color: "var(--text-secondary)" }} />
              </Link>

            </div>
          </div>
        )}

      </div>
    </>
  );
}
