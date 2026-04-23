import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/badge";
import CouponsClient from "./coupons-client";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">الكوبونات</h1>
          <p className="text-text-secondary text-[13px] mt-0.5">إدارة كوبونات الخصم</p>
        </div>
        <CouponsClient />
      </div>

      {/* Coupons Table */}
      <div className="bg-surface/80 backdrop-blur-sm rounded-2xl border border-divider/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider/60">
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">الكود</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">نوع الخصم</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">قيمة الخصم</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">حد أدنى</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">استخدامات</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">تاريخ الانتهاء</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">الحالة</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {(coupons || []).map((coupon) => (
                <tr
                  key={coupon.id}
                  className="border-b border-divider/30 hover:bg-surface-elevated/30 transition-colors"
                >
                  <td className="py-3 px-4 text-text-primary font-mono font-bold text-[13px]">
                    {coupon.code}
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-[13px]">
                    {coupon.discount_type === "percentage" ? "نسبة مئوية" : "مبلغ ثابت"}
                  </td>
                  <td className="py-3 px-4 text-text-primary font-medium text-[13px]">
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}%`
                      : formatCurrency(Number(coupon.discount_value))}
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-[13px]">
                    {coupon.min_trip_price ? formatCurrency(Number(coupon.min_trip_price)) : "—"}
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-[13px]">
                    {coupon.used_count}/{coupon.max_uses || "∞"}
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-[11px]">
                    {coupon.expires_at ? formatDate(coupon.expires_at) : "بدون انتهاء"}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={coupon.is_active ? "success" : "error"}>
                      {coupon.is_active ? "نشط" : "معطّل"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <form action={`/api/coupons/toggle`} method="POST">
                        <input type="hidden" name="coupon_id" value={coupon.id} />
                        <input type="hidden" name="is_active" value={coupon.is_active ? "false" : "true"} />
                        <button
                          type="submit"
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                            coupon.is_active
                              ? "bg-warning/15 text-warning hover:bg-warning/25 border-warning/20"
                              : "bg-success/15 text-success hover:bg-success/25 border-success/20"
                          }`}
                        >
                          {coupon.is_active ? "تعطيل" : "تفعيل"}
                        </button>
                      </form>
                      <form action={`/api/coupons/delete`} method="POST">
                        <input type="hidden" name="coupon_id" value={coupon.id} />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-error/15 text-error hover:bg-error/25 border border-error/20 transition-colors"
                        >
                          حذف
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {(!coupons || coupons.length === 0) && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-text-disabled">
                    لا توجد كوبونات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/dashboard/coupons?page=${p}`}
              className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center ${
                p === page
                  ? "bg-primary text-white shadow-sm shadow-primary/25"
                  : "bg-surface/80 border border-divider/60 text-text-secondary hover:border-primary/30"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
