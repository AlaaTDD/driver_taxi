import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Ticket, User, CheckCircle, Clock, Gift } from "lucide-react";

export default async function UserCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; used?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const usedFilter = params.used || "";
  const pageSize = 15;

  const t = await getTranslations();
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


  const userIds = [...new Set((userCoupons || []).map((uc) => uc.user_id).filter(Boolean))];
  const couponIds = [...new Set((userCoupons || []).map((uc) => uc.coupon_id).filter(Boolean))];

  const { data: users } = userIds.length ? await supabase.from("users").select("id, name, phone").in("id", userIds) : { data: [] };
  const { data: coupons } = couponIds.length ? await supabase.from("coupons").select("id, code, discount_type, discount_value").in("id", couponIds) : { data: [] };

  const userMap = new Map((users || []).map((u) => [u.id, u]));
  const couponMap = new Map((coupons || []).map((c) => [c.id, c]));


  const { data: usages } = await supabase.from("coupon_usages").select("id, trip_id, user_coupon_id, discount_amount, created_at");


  const totalAssigned = count || 0;
  const totalUsed = (userCoupons || []).filter((uc) => uc.is_used).length;
  const totalUnused = (userCoupons || []).filter((uc) => !uc.is_used).length;

  const totalDiscount = (usages || []).reduce((s, u) => s + (Number(u.discount_amount) || 0), 0);

  return (
    <>
      <div className="space-y-6">

        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("userCoupons.title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("userCoupons.subtitle")}</p>
        </div>


        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t("userCoupons.stats.assigned"), value: totalAssigned, color: "var(--info)", colorRaw: "37,99,235", icon: Gift },
            { label: t("userCoupons.stats.used"), value: totalUsed, color: "var(--success)", colorRaw: "16,185,129", icon: CheckCircle },
            { label: t("userCoupons.stats.unused"), value: totalUnused, color: "var(--warning)", colorRaw: "217,119,6", icon: Clock },
            { label: t("userCoupons.stats.totalDiscount"), value: formatCurrency(totalDiscount), color: "var(--primary)", colorRaw: "245,158,11", icon: Ticket },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-4 py-3"
              style={{ background: `rgba(${(s as any).colorRaw},0.08)`, border: `1px solid rgba(${(s as any).colorRaw},0.18)` }}
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


        <div className="flex items-center gap-2">
          {[
            { label: t("userCoupons.filters.all"), value: "", count: totalAssigned },
            { label: t("userCoupons.filters.used"), value: "used", count: totalUsed },
            { label: t("userCoupons.filters.unused"), value: "unused", count: totalUnused },
          ].map((f) => (
            <Link
              key={f.value}
              href={`/dashboard/user-coupons${f.value ? `?used=${f.value}` : ""}`}
              className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${usedFilter === f.value ? 'bg-primary-surface text-primary border border-primary/30' : 'bg-surface-glass text-text-tertiary border border-divider hover:bg-surface-elevated'}`}
            >
              {f.label} ({f.count})
            </Link>
          ))}
        </div>


        <div className="dash-table-card">
          <div className="dash-section-header justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-primary to-primary-dark shadow-[0_0_8px_var(--primary)]" />
              <h3 className="text-[13px] font-bold text-text-primary">{t("userCoupons.title")}</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="dash-table-head">
                  {[t("userCoupons.table.user"), t("userCoupons.table.phone"), t("userCoupons.table.code"), t("userCoupons.table.discountType"), t("userCoupons.table.value"), t("userCoupons.table.status"), t("userCoupons.table.assignedAt"), t("userCoupons.table.usedAt")].map((h) => (
                    <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(userCoupons || []).map((uc) => {
                  const user = userMap.get(uc.user_id);
                  const coupon = couponMap.get(uc.coupon_id);
                  return (
                    <tr key={uc.id} className="group/row dash-table-row">
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
                          style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}
                        >
                          <Ticket size={11} />
                          {coupon?.code || "—"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-text-secondary">
                        {coupon?.discount_type === "percentage" ? t("userCoupons.discountType.percentage") : coupon?.discount_type === "fixed" ? t("userCoupons.discountType.fixed") : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-[13px] font-bold num" style={{ color: "var(--success)" }}>
                        {coupon ? (
                          coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}%`
                            : formatCurrency(Number(coupon.discount_value))
                        ) : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${uc.is_used ? "bg-success/15 text-success border border-success/25" : "bg-warning/15 text-warning border border-warning/25"}`}
                        >
                          {uc.is_used ? <><CheckCircle size={10} /> {t("userCoupons.status.used")}</> : <><Clock size={10} /> {t("userCoupons.status.unused")}</>}
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
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-surface-glass border border-divider">
                          <Ticket size={28} className="opacity-40 text-text-disabled" />
                        </div>
                        <p className="text-text-secondary font-semibold">{t("userCoupons.noCoupons")}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 px-6 border-t border-divider">
              {page > 1 && (
                <Link href={`/dashboard/user-coupons?page=${page - 1}${usedFilter ? `&used=${usedFilter}` : ""}`}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-glass border border-divider text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all">
                  السابق
                </Link>
              )}
              <span className="text-[12px] text-text-tertiary">صفحة {page} من {totalPages}</span>
              {page < totalPages && (
                <Link href={`/dashboard/user-coupons?page=${page + 1}${usedFilter ? `&used=${usedFilter}` : ""}`}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-glass border border-divider text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all">
                  التالي
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
