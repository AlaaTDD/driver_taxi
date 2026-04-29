import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeftRight, Clock, User, Car, Eye, Filter } from "lucide-react";

export default async function TripOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const statusFilter = params.status || "";
  const pageSize = 15;

  const supabase = createAdminClient();

  let query = supabase
    .from("trip_offers")
    .select("id, trip_id, driver_id, status, created_at, responded_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: offers, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  // Fetch related user names for drivers
  const driverIds = [...new Set((offers || []).map((o) => o.driver_id).filter(Boolean))];
  const tripIds = [...new Set((offers || []).map((o) => o.trip_id).filter(Boolean))];

  const { data: drivers } = driverIds.length
    ? await supabase.from("users").select("id, name").in("id", driverIds)
    : { data: [] };

  const { data: trips } = tripIds.length
    ? await supabase.from("trips").select("id, pickup_address, status, user_id").in("id", tripIds)
    : { data: [] };

  const tripUserIds = [...new Set((trips || []).map((t) => t.user_id).filter(Boolean))];
  const { data: tripUsers } = tripUserIds.length
    ? await supabase.from("users").select("id, name").in("id", tripUserIds)
    : { data: [] };

  const driverMap = new Map((drivers || []).map((d) => [d.id, d.name]));
  const tripMap = new Map((trips || []).map((t) => [t.id, t]));
  const tripUserMap = new Map((tripUsers || []).map((u) => [u.id, u.name]));

  // Status stats
  const { data: statusStats } = await supabase
    .from("trip_offers")
    .select("status");

  const stats = {
    total: statusStats?.length || 0,
    pending: statusStats?.filter((s) => s.status === "pending").length || 0,
    accepted: statusStats?.filter((s) => s.status === "accepted").length || 0,
    rejected: statusStats?.filter((s) => s.status === "rejected").length || 0,
    expired: statusStats?.filter((s) => s.status === "expired").length || 0,
  };

  const statCards = [
    { label: "الكل", value: stats.total, color: "#60A5FA", bg: "rgba(59,130,246,0.1)", href: "?" },
    { label: "معلق", value: stats.pending, color: "#FBBF24", bg: "rgba(245,158,11,0.1)", href: "?status=pending" },
    { label: "مقبول", value: stats.accepted, color: "#34D399", bg: "rgba(16,185,129,0.1)", href: "?status=accepted" },
    { label: "مرفوض", value: stats.rejected, color: "#F87171", bg: "rgba(239,68,68,0.1)", href: "?status=rejected" },
    { label: "منتهي", value: stats.expired, color: "#9CA3AF", bg: "rgba(107,114,128,0.1)", href: "?status=expired" },
  ];

  return (
    <div className="space-y-7">
      {/* ===== PAGE HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">إدارة</span>
            <span className="w-1 h-1 rounded-full bg-purple-500/60" />
            <span className="text-[11px] text-text-disabled">عروض الرحلات</span>
          </div>
          <h1 className="page-title">عروض الرحلات</h1>
          <p className="page-subtitle">متابعة جميع عروض الرحلات المرسلة للسائقين</p>
        </div>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statCards.map((s) => (
          <Link
            key={s.label}
            href={`/dashboard/trip-offers${s.href}`}
            className="rounded-xl px-4 py-3 transition-all hover:scale-[1.02]"
            style={{
              background: s.bg,
              border: `1px solid ${s.color}22`,
            }}
          >
            <div className="text-[22px] font-black num" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] text-text-tertiary font-semibold mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* ===== TABLE ===== */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--divider)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-[3px] h-5 rounded-full" style={{ background: "linear-gradient(to bottom, #8B5CF6, #6D28D9)", boxShadow: "0 0 8px rgba(139,92,246,0.5)" }} />
            <div>
              <h3 className="text-[13px] font-bold text-text-primary">قائمة العروض</h3>
              <p className="text-[10px] text-text-tertiary">صفحة {page} من {totalPages || 1} — {count || 0} عرض</p>
            </div>
          </div>
          {statusFilter && (
            <Link
              href="/dashboard/trip-offers"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-amber-400 hover:text-amber-300 transition"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              <X size={10} />
              مسح الفلتر
            </Link>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(15,30,53,0.4)", borderBottom: "1px solid var(--divider)" }}>
                {["السائق", "الراكب", "العنوان", "حالة العرض", "حالة الرحلة", "تاريخ الإرسال", "تاريخ الرد", "إجراء"].map((h) => (
                  <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(offers || []).map((offer) => {
                const trip = tripMap.get(offer.trip_id);
                return (
                  <tr key={offer.id} className="group/row table-row-hover" style={{ borderBottom: "1px solid rgba(26,45,71,0.5)" }}>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[12px] font-medium" style={{ background: "rgba(15,30,53,0.8)", color: "var(--text-secondary)", border: "1px solid var(--divider)" }}>
                        <Car size={11} className="text-cyan-400" />
                        {driverMap.get(offer.driver_id) || "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[12px] font-medium" style={{ background: "rgba(15,30,53,0.8)", color: "var(--text-secondary)", border: "1px solid var(--divider)" }}>
                        <User size={11} className="text-violet-400" />
                        {trip ? tripUserMap.get(trip.user_id) || "—" : "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[160px] truncate text-[12px] text-text-tertiary">
                      {trip?.pickup_address || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${getStatusColor(offer.status)}`}>
                        {getStatusLabel(offer.status)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {trip ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${getStatusColor(trip.status)}`}>
                          {getStatusLabel(trip.status)}
                        </span>
                      ) : (
                        <span className="text-text-disabled text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-text-tertiary text-[11px] font-medium whitespace-nowrap">
                      {formatDate(offer.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-text-tertiary text-[11px] font-medium whitespace-nowrap">
                      {offer.responded_at ? formatDate(offer.responded_at) : <span className="text-text-disabled">—</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/dashboard/trips/${offer.trip_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80"
                        style={{ background: "rgba(59,130,246,0.1)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.2)" }}
                      >
                        <Eye size={12} />
                        الرحلة
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {(!offers || offers.length === 0) && (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-text-disabled">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(15,30,53,0.8)", border: "1px solid var(--divider)" }}>
                        <ArrowLeftRight size={24} className="opacity-40" />
                      </div>
                      <div>
                        <p className="text-text-secondary font-semibold">لا توجد عروض</p>
                        <p className="text-text-tertiary text-sm mt-1">لم يتم إرسال أي عروض رحلات بعد</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 px-6" style={{ borderTop: "1px solid var(--divider)" }}>
            {page > 1 && (
              <Link
                href={`/dashboard/trip-offers?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-text-secondary hover:text-text-primary transition"
                style={{ border: "1px solid var(--divider)" }}
              >
                السابق
              </Link>
            )}
            <span className="text-[12px] text-text-tertiary">صفحة {page} من {totalPages}</span>
            {page < totalPages && (
              <Link
                href={`/dashboard/trip-offers?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-text-secondary hover:text-text-primary transition"
                style={{ border: "1px solid var(--divider)" }}
              >
                التالي
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
