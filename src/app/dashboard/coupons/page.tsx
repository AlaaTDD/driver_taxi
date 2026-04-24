import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/badge";
import CouponsClient from "./coupons-client";
import { Tag, Percent, Hash, ChevronLeft, ChevronRight } from "lucide-react";

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = 10;

  const supabase = createAdminClient();

  const { data: coupons, count } = await supabase
    .from("coupons")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const totalPages = Math.ceil((count || 0) / pageSize);

  const activeCount = (coupons || []).filter((c) => c.is_active).length;

  return (
    <div className="space-y-7">

      {/* ===== PAGE HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">إدارة</span>
            <span className="w-1 h-1 rounded-full bg-amber-500/60" />
            <span className="text-[11px] text-text-disabled">الكوبونات</span>
          </div>
          <h1 className="page-title">الكوبونات</h1>
          <p className="page-subtitle">إدارة كوبونات الخصم وعروض المستخدمين</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34D399" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success" style={{ boxShadow: "0 0 5px rgba(16,185,129,0.5)" }} />
            {activeCount} نشط
          </div>
          {/* Add New Coupon Button */}
          <CouponsClient />
        </div>
      </div>

      {/* ===== COUPONS TABLE ===== */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--divider)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-[3px] h-5 rounded-full"
              style={{
                background: "linear-gradient(to bottom, #F59E0B, #D97706)",
                boxShadow: "0 0 8px rgba(245,158,11,0.5)",
              }}
            />
            <div>
              <h3 className="text-[13px] font-bold text-text-primary">قائمة الكوبونات</h3>
              <p className="text-[10px] text-text-tertiary">{count || 0} كوبون إجمالاً</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(15,30,53,0.4)", borderBottom: "1px solid var(--divider)" }}>
                {["الكود", "نوع الخصم", "قيمة الخصم", "حد أدنى", "الاستخدامات", "تاريخ الانتهاء", "الحالة", "إجراءات"].map((h) => (
                  <th
                    key={h}
                    className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(coupons || []).map((coupon) => {
                const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();

                return (
                  <tr
                    key={coupon.id}
                    className="group/row table-row-hover"
                    style={{ borderBottom: "1px solid rgba(26,45,71,0.5)" }}
                  >
                    {/* Coupon Code */}
                    <td className="py-3.5 px-4">
                      <div
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[12px] mono"
                        style={{
                          background: "rgba(245,158,11,0.1)",
                          color: "#FCD34D",
                          border: "1px solid rgba(245,158,11,0.25)",
                          boxShadow: "0 2px 8px rgba(245,158,11,0.1)",
                        }}
                      >
                        <Tag size={11} />
                        {coupon.code}
                      </div>
                    </td>

                    {/* Discount Type */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {coupon.discount_type === "percentage" ? (
                          <Percent size={12} className="text-text-tertiary" />
                        ) : (
                          <Hash size={12} className="text-text-tertiary" />
                        )}
                        <span className="text-text-secondary text-[13px]">
                          {coupon.discount_type === "percentage" ? "نسبة مئوية" : "مبلغ ثابت"}
                        </span>
                      </div>
                    </td>

                    {/* Discount Value */}
                    <td className="py-3.5 px-4">
                      <span className="text-[14px] font-black num"
                        style={{ color: "#34D399" }}>
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}٪`
                          : formatCurrency(Number(coupon.discount_value))}
                      </span>
                    </td>

                    {/* Min Price */}
                    <td className="py-3.5 px-4 text-text-tertiary text-[13px] num">
                      {coupon.min_trip_price ? formatCurrency(Number(coupon.min_trip_price)) : "—"}
                    </td>

                    {/* Usage */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-text-primary font-bold text-[13px] num">{coupon.used_count}</span>
                        <span className="text-text-disabled text-[11px]">/</span>
                        <span className="text-text-tertiary text-[12px] num">{coupon.max_uses || "∞"}</span>
                      </div>
                    </td>

                    {/* Expiry */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {coupon.expires_at ? (
                        <span className={`text-[12px] font-medium ${isExpired ? "text-error" : "text-text-tertiary"}`}>
                          {isExpired ? "⚠ " : ""}{formatDate(coupon.expires_at)}
                        </span>
                      ) : (
                        <span className="text-text-disabled text-[12px]">بدون انتهاء</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge variant={coupon.is_active ? "success" : "error"} dot>
                        {coupon.is_active ? "نشط" : "معطّل"}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex gap-2">
                        <form action={`/api/coupons/toggle`} method="POST">
                          <input type="hidden" name="coupon_id" value={coupon.id} />
                          <input type="hidden" name="is_active" value={coupon.is_active ? "false" : "true"} />
                          <button
                            type="submit"
                            className={`btn py-1.5 px-3 text-[11px] ${coupon.is_active ? "btn-warning" : "btn-success"}`}
                            id={`toggle-coupon-${coupon.id}`}
                          >
                            {coupon.is_active ? "تعطيل" : "تفعيل"}
                          </button>
                        </form>
                        <form action={`/api/coupons/delete`} method="POST">
                          <input type="hidden" name="coupon_id" value={coupon.id} />
                          <button
                            type="submit"
                            className="btn btn-error py-1.5 px-3 text-[11px]"
                            id={`delete-coupon-${coupon.id}`}
                          >
                            حذف
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {(!coupons || coupons.length === 0) && (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-text-disabled">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: "rgba(15,30,53,0.8)", border: "1px solid var(--divider)" }}
                      >
                        <Tag size={24} className="opacity-40" />
                      </div>
                      <div>
                        <p className="text-text-secondary font-semibold">لا توجد كوبونات</p>
                        <p className="text-text-tertiary text-sm mt-1">أضف كوبون جديد للبدء</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <a
            href={`/dashboard/coupons?page=${page - 1}`}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${page <= 1 ? "pointer-events-none opacity-30" : ""}`}
            style={{ background: "rgba(15,30,53,0.6)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
          >
            <ChevronRight size={14} />
          </a>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/dashboard/coupons?page=${p}`}
              className="w-9 h-9 rounded-xl text-[13px] font-bold flex items-center justify-center transition-all"
              style={
                p === page
                  ? { background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "white", boxShadow: "0 4px 12px rgba(59,130,246,0.3)", border: "1px solid rgba(59,130,246,0.3)" }
                  : { background: "rgba(15,30,53,0.6)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }
              }
            >
              {p}
            </a>
          ))}

          <a
            href={`/dashboard/coupons?page=${page + 1}`}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${page >= totalPages ? "pointer-events-none opacity-30" : ""}`}
            style={{ background: "rgba(15,30,53,0.6)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={14} />
          </a>
        </div>
      )}
    </div>
  );
}
