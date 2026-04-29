import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Star, MessageSquare, Trash2, Car } from "lucide-react";

export default async function RatingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; driver_id?: string; min_rating?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const driverFilter = params.driver_id || "";
  const minRating = params.min_rating ? Number(params.min_rating) : 0;
  const pageSize = 15;

  const supabase = createAdminClient();

  // Get drivers list for filter
  const { data: drivers } = await supabase
    .from("users")
    .select("id, name")
    .eq("role", "driver");

  let query = supabase
    .from("ratings")
    .select("*, users!ratings_user_id_fkey(name, avatar_url), trips(id, pickup_address, destination_address)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (driverFilter) {
    query = query.eq("driver_id", driverFilter);
  }

  if (minRating > 0) {
    query = query.gte("rating", minRating);
  }

  const { data: ratings, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  // Calculate stats
  const avgRating = ratings?.length
    ? (ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length).toFixed(1)
    : "0.0";

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratings?.forEach((r) => {
    const rating = Math.round(Number(r.rating));
    if (rating >= 1 && rating <= 5) {
      ratingCounts[rating as keyof typeof ratingCounts]++;
    }
  });

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">إدارة</span>
          <span className="w-1 h-1 rounded-full bg-yellow-500/60" />
          <span className="text-[11px] text-text-disabled">التقييمات</span>
        </div>
        <h1 className="page-title">تقييمات الرحلات</h1>
        <p className="page-subtitle">عرض وإدارة تقييمات المستخدمين للسائقين</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي التقييمات", value: count || 0, icon: MessageSquare, color: "#3B82F6" },
          { label: "متوسط التقييم", value: avgRating, icon: Star, color: "#F59E0B" },
          { label: "5 نجوم", value: ratingCounts[5], icon: Star, color: "#10B981" },
          { label: "1-2 نجوم", value: ratingCounts[1] + ratingCounts[2], icon: Star, color: "#EF4444" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4"
            style={{
              background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}
              >
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

      {/* Rating Distribution */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <h3 className="text-[13px] font-bold text-text-primary mb-4">توزيع التقييمات</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingCounts[stars as keyof typeof ratingCounts];
            const total = ratings?.length || 1;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const colors = {
              5: "#10B981",
              4: "#8B5CF6",
              3: "#3B82F6",
              2: "#F59E0B",
              1: "#EF4444",
            };

            return (
              <div key={stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-[12px] font-bold text-text-secondary">{stars}</span>
                  <Star size={12} style={{ color: colors[stars as keyof typeof colors] }} />
                </div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(15,30,53,0.6)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      background: colors[stars as keyof typeof colors],
                    }}
                  />
                </div>
                <span className="text-[11px] text-text-tertiary w-10 text-left">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <select
          name="driver_id"
          defaultValue={driverFilter}
          className="px-4 py-2.5 rounded-xl text-[13px] outline-none"
          style={{
            background: "rgba(15,30,53,0.6)",
            border: "1px solid var(--divider)",
            color: "var(--text-primary)",
          }}
          onChange={(e) => {
            const url = new URL(window.location.href);
            if (e.target.value) url.searchParams.set("driver_id", e.target.value);
            else url.searchParams.delete("driver_id");
            window.location.href = url.toString();
          }}
        >
          <option value="">كل السائقين</option>
          {(drivers || []).map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.name || driver.id.slice(0, 8)}
            </option>
          ))}
        </select>

        <select
          name="min_rating"
          defaultValue={minRating || ""}
          className="px-4 py-2.5 rounded-xl text-[13px] outline-none"
          style={{
            background: "rgba(15,30,53,0.6)",
            border: "1px solid var(--divider)",
            color: "var(--text-primary)",
          }}
          onChange={(e) => {
            const url = new URL(window.location.href);
            if (e.target.value) url.searchParams.set("min_rating", e.target.value);
            else url.searchParams.delete("min_rating");
            window.location.href = url.toString();
          }}
        >
          <option value="">كل التقييمات</option>
          <option value="4">4+ نجوم</option>
          <option value="3">3+ نجوم</option>
          <option value="1">1-2 نجوم</option>
        </select>
      </form>

      {/* Ratings List */}
      <div className="grid gap-4">
        {(ratings || []).map((rating) => {
          const user = rating.users as unknown as { name: string; avatar_url: string } | null;
          const trip = rating.trips as unknown as {
            id: string;
            pickup_address: string;
            destination_address: string;
          } | null;
          const stars = Math.round(Number(rating.rating));

          return (
            <div
              key={rating.id}
              className="rounded-2xl p-5"
              style={{
                background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-[16px] font-bold"
                    style={{ background: "rgba(59,130,246,0.15)", color: "#60A5FA" }}
                  >
                    {(user?.name || "?")[0]}
                  </div>

                  <div>
                    {/* User & Stars */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-text-primary">{user?.name || "مستخدم"}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < stars ? "#F59E0B" : "transparent"}
                            style={{ color: i < stars ? "#F59E0B" : "var(--text-disabled)" }}
                          />
                        ))}
                      </div>
                      <span className="text-[12px] text-text-tertiary">{rating.rating}/5</span>
                    </div>

                    {/* Comment */}
                    {rating.comment && (
                      <p className="text-[14px] text-text-secondary mb-3 leading-relaxed">
                        &quot;{rating.comment}&quot;
                      </p>
                    )}

                    {/* Trip Info */}
                    {trip && (
                      <div className="flex items-center gap-2 text-[11px] text-text-disabled">
                        <Car size={12} />
                        <span>رحلة: {trip.pickup_address?.slice(0, 30)}... → {trip.destination_address?.slice(0, 30)}...</span>
                      </div>
                    )}

                    {/* Date */}
                    <p className="text-[11px] text-text-disabled mt-2">{formatDate(rating.created_at)}</p>
                  </div>
                </div>

                {/* Delete Button */}
                <form action={`/api/ratings/delete`} method="POST">
                  <input type="hidden" name="rating_id" value={rating.id} />
                  <button
                    type="submit"
                    className="p-2 rounded-lg hover:bg-error/10 text-text-tertiary hover:text-error transition-colors"
                    title="حذف التقييم"
                  >
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {(!ratings || ratings.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(15,30,53,0.8)", border: "1px solid var(--divider)" }}
          >
            <Star size={28} className="text-text-disabled opacity-40" />
          </div>
          <div className="text-center">
            <p className="text-text-secondary font-semibold">لا توجد تقييمات</p>
            <p className="text-text-tertiary text-sm mt-1">ستظهر التقييمات هنا بعد اكتمال الرحلات</p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-text-tertiary">
            صفحة {page} من {totalPages}
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?page=${page - 1}${driverFilter ? `&driver_id=${driverFilter}` : ""}${minRating ? `&min_rating=${minRating}` : ""}`}
                className="px-4 py-2 rounded-xl text-[12px] text-text-secondary hover:text-text-primary transition-colors"
                style={{ background: "rgba(15,30,53,0.6)", border: "1px solid var(--divider)" }}
              >
                السابق
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?page=${page + 1}${driverFilter ? `&driver_id=${driverFilter}` : ""}${minRating ? `&min_rating=${minRating}` : ""}`}
                className="px-4 py-2 rounded-xl text-[12px] text-text-secondary hover:text-text-primary transition-colors"
                style={{ background: "rgba(15,30,53,0.6)", border: "1px solid var(--divider)" }}
              >
                التالي
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
