import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Ticket, User, CheckCircle, XCircle, Clock, Gift } from "lucide-react";

export default async function UserCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; used?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const usedFilter = params.used || "";
  const pageSize = 15;

  const supabase = createAdminClient();

  let query = supabase
    .from("user_coupons")
    .select("id, user_id, coupon_id, is_used, assigned_at, used_at", { count: "exact" })
    .order("assigned_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (usedFilter === "used") query = query.eq("is_used", true);
  if (usedFilter === "unused") query = query.eq("is_used", false);

  const { data: userCoupons, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  // Fetch related data
  const userIds = [...new Set((userCoupons || []).map((uc) => uc.user_id).filter(Boolean))];
  const couponIds = [...new Set((userCoupons || []).map((uc) => uc.coupon_id).filter(Boolean))];

  const { data: users } = userIds.length ? await supabase.from("users").select("id, name, phone").in("id", userIds) : { data: [] };
  const { data: coupons } = couponIds.length ? await supabase.from("coupons").select("id, code, discount_type, discount_value").in("id", couponIds) : { data: [] };

  const userMap = new Map((users || []).map((u) => [u.id, u]));
  const couponMap = new Map((coupons || []).map((c) => [c.id, c]));

  // Coupon usage stats from coupon_usages table
  const { data: usages } = await supabase.from("coupon_usages").select("id, trip_id, user_coupon_id, discount_amount, created_at");

  // Stats
  const totalAssigned = count || 0;
  const totalUsed = (userCoupons || []).filter((uc) => uc.is_used).length;
  const totalUnused = (userCoupons || []).filter((uc) => !uc.is_used).length;
  const totalUsages = usages?.length || 0;
  const totalDiscount = (usages || []).reduce((s, u) => s + (Number(u.discount_amount) || 0), 0);

  return (
    <div className="space-y-7">
      {/* ===== PAGE HEADER ===== */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">إدارة</span>
          <span className="w-1 h-1 rounded-full bg-amber-500/60" />
          <span className="text-[11px] text-text-disabled">كوبونات المستخدمين</span>
        </div>
        <h1 className="page-title">كوبونات المستخدمين</h1>
        <p className="page-subtitle">متابعة الكوبونات المعينة للمستخدمين وسجل الاستخدام</p>
      </div>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "كوبونات معينة", value: totalAssigned, color: "#60A5FA", icon: Gift },
          { label: "مستخدمة", value: totalUsed, color: "#34D399", icon: CheckCircle },
          { label: "غير مستخدمة", value: totalUnused, color: "#FBBF24", icon: Clock },
          { label: "إجمالي الخصومات", value: formatCurrency(totalDiscount), color: "#F472B6", icon: Ticket },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl px-4 py-3"
            style={{ background: `${s.color}11`, border: `1px solid ${s.color}22` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={13} style={{ color: s.color }} />
              <span className="text-[10px] text-text-tertiary font-semibold">{s.label}</span>
            </div>
            <div className="text-[20px] font-black num" style={{ color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ===== FILTER TABS ===== */}
      <div className="flex items-center gap-2">
        {[
          { label: "الكل", value: "", count: totalAssigned },
          { label: "مستخدمة", value: "used", count: totalUsed },
          { label: "غير مستخدمة", value: "unused", count: totalUnused },
        ].map((f) => (
          <Link
            key={f.value}
            href={`/dashboard/user-coupons${f.value ? `?used=${f.value}` : ""}`}
            className="px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{
              background: usedFilter === f.value ? "rgba(59,130,246,0.15)" : "rgba(15,30,53,0.5)",
              color: usedFilter === f.value ? "#60A5FA" : "var(--text-tertiary)",
              border: `1px solid ${usedFilter === f.value ? "rgba(59,130,246,0.3)" : "var(--divider)"}`,
            }}
          >
            {f.label} ({f.count})
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
            <div className="w-[3px] h-5 rounded-full" style={{ background: "linear-gradient(to bottom, #F59E0B, #D97706)", boxShadow: "0 0 8px rgba(245,158,11,0.5)" }} />
            <h3 className="text-[13px] font-bold text-text-primary">كوبونات المستخدمين</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(15,30,53,0.4)", borderBottom: "1px solid var(--divider)" }}>
                {["المستخدم", "الهاتف", "كود الكوبون", "نوع الخصم", "القيمة", "الحالة", "تاريخ التعيين", "تاريخ الاستخدام"].map((h) => (
                  <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(userCoupons || []).map((uc) => {
                const user = userMap.get(uc.user_id);
                const coupon = couponMap.get(uc.coupon_id);
                return (
                  <tr key={uc.id} className="group/row table-row-hover" style={{ borderBottom: "1px solid rgba(26,45,71,0.5)" }}>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-text-primary font-medium">
                        <User size={12} className="text-violet-400" />
                        {user?.name || "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[12px] text-text-tertiary num">{user?.phone || "—"}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono"
                        style={{ background: "rgba(245,158,11,0.1)", color: "#FBBF24", border: "1px solid rgba(245,158,11,0.2)" }}
                      >
                        <Ticket size={11} />
                        {coupon?.code || "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[12px] text-text-secondary">
                      {coupon?.discount_type === "percentage" ? "نسبة مئوية" : coupon?.discount_type === "fixed" ? "مبلغ ثابت" : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-[13px] font-bold num text-emerald-400">
                      {coupon ? (
                        coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}%`
                          : formatCurrency(Number(coupon.discount_value))
                      ) : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                        style={{
                          background: uc.is_used ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                          color: uc.is_used ? "#34D399" : "#FBBF24",
                          border: `1px solid ${uc.is_used ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
                        }}
                      >
                        {uc.is_used ? <><CheckCircle size={10} /> مستخدم</> : <><Clock size={10} /> غير مستخدم</>}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-tertiary text-[11px] font-medium whitespace-nowrap">
                      {uc.assigned_at ? formatDate(uc.assigned_at) : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-text-tertiary text-[11px] font-medium whitespace-nowrap">
                      {uc.used_at ? formatDate(uc.used_at) : <span className="text-text-disabled">—</span>}
                    </td>
                  </tr>
                );
              })}

              {(!userCoupons || userCoupons.length === 0) && (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-text-disabled">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(15,30,53,0.8)", border: "1px solid var(--divider)" }}>
                        <Ticket size={24} className="opacity-40" />
                      </div>
                      <p className="text-text-secondary font-semibold">لا توجد كوبونات معينة</p>
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
              <Link href={`/dashboard/user-coupons?page=${page - 1}${usedFilter ? `&used=${usedFilter}` : ""}`}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-text-secondary hover:text-text-primary transition" style={{ border: "1px solid var(--divider)" }}>
                السابق
              </Link>
            )}
            <span className="text-[12px] text-text-tertiary">صفحة {page} من {totalPages}</span>
            {page < totalPages && (
              <Link href={`/dashboard/user-coupons?page=${page + 1}${usedFilter ? `&used=${usedFilter}` : ""}`}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-text-secondary hover:text-text-primary transition" style={{ border: "1px solid var(--divider)" }}>
                التالي
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
