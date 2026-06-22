import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/badge";
import CouponsClient from "./coupons-client";
import { getTranslations } from "next-intl/server";
import { Tag, Percent, Hash, ChevronLeft, ChevronRight, DollarSign, Users, Wallet, TrendingUp, Building2, User, Zap } from "lucide-react";
import { getAppCurrency } from "@/lib/currency";

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = 10;

  const t = await getTranslations();
  const supabase = createAdminClient();

  const { data: coupons, count } = await supabase
    .from("coupons")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const totalPages = Math.ceil((count || 0) / pageSize);
  const currency = await getAppCurrency();

  // Fetch stats for all coupons
  const { data: allCouponsData } = await supabase
    .from("coupons")
    .select("is_active, spent_budget, budget_limit");

  const allCouponsStats = allCouponsData || [];
  const activeCount = allCouponsStats.filter((c) => c.is_active).length;
  const totalDiscount = allCouponsStats.reduce((sum, c) => sum + Number(c.spent_budget || 0), 0);
  const budgetRemaining = allCouponsStats.reduce((sum, c) => {
    if (c.budget_limit) return sum + (Math.max(0, Number(c.budget_limit) - Number(c.spent_budget || 0)));
    return sum;
  }, 0);
  
  const allCoupons = coupons || [];

  // KPI Cards data
  const kpis = [
    {
      label: t("coupons.stats.totalActive"),
      value: `${activeCount}`,
      sub: `${t("common.of")} ${count || 0}`,
      icon: Tag,
      color: "var(--success)",
      bg: "var(--success-surface)",
      border: "var(--success-border)",
    },
    {
      label: t("coupons.stats.totalDiscount"),
      value: formatCurrency(totalDiscount, currency),
      sub: t("coupons.analytics.platformSubsidyCost"),
      icon: DollarSign,
      color: "var(--primary)",
      bg: "var(--accent-surface)",
      border: "var(--accent-border)",
    },
    {
      label: t("coupons.stats.budgetRemaining"),
      value: formatCurrency(budgetRemaining, currency),
      sub: t("coupons.fields.budgetLimit"),
      icon: Wallet,
      color: "var(--info)",
      bg: "var(--info-surface)",
      border: `rgba(var(--info-rgb), 0.25)`,
    },
  ];

  const fundedByIcon = (funded_by: string) => {
    switch (funded_by) {
      case "platform": return <Building2 size={11} />;
      case "driver": return <User size={11} />;
      case "shared": return <Zap size={11} />;
      default: return <Building2 size={11} />;
    }
  };

  return (
    <>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("coupons.title")}</h1>
            <p className="text-sm text-text-secondary mt-1">{t("coupons.subtitle")}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-success/5 border border-success/20 text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              {activeCount} {t("common.active")}
            </div>
            <CouponsClient />
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map((kpi, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:translate-y-[-1px]"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--divider)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-[22px] font-black text-text-primary mt-1 num">{kpi.value}</p>
                  <p className="text-[11px] text-text-disabled mt-0.5">{kpi.sub}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: kpi.bg, border: `1px solid ${kpi.border}` }}
                >
                  <kpi.icon size={18} style={{ color: kpi.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table Card ── */}
        <div className="dash-table-card">

          <div className="dash-section-header justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-[3px] h-5 rounded-full"
                style={{
                  background: "linear-gradient(to bottom, var(--primary), var(--primary-dark))",
                  boxShadow: "0 0 8px var(--primary-surface)",
                }}
              />
              <div>
                <h3 className="text-[13px] font-bold text-text-primary">{t("coupons.couponList")}</h3>
                <p className="text-[10px] text-text-tertiary">{count || 0} {t("coupons.totalCoupons")}</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="dash-table-head">
                  {[
                    t("coupons.fields.code"),
                    t("coupons.fields.title"),
                    t("coupons.fields.discountType"),
                    t("coupons.fields.discountValue"),
                    t("coupons.fields.minTripPrice"),
                    t("coupons.fields.uses"),
                    t("coupons.fields.budgetLimit"),
                    t("coupons.fields.fundedBy"),
                    t("coupons.fields.expiresAt"),
                    t("common.status"),
                    t("common.actions"),
                  ].map((h) => (
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
                {allCoupons.map((coupon) => {
                  const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                  const notStarted = coupon.starts_at && new Date(coupon.starts_at) > new Date();
                  const budgetExhausted = coupon.budget_limit && Number(coupon.spent_budget || 0) >= Number(coupon.budget_limit);
                  
                  let statusVariant: "success" | "error" | "warning" = "success";
                  let statusLabel = t("common.active");
                  if (!coupon.is_active) { statusVariant = "error"; statusLabel = t("common.inactive"); }
                  else if (isExpired) { statusVariant = "error"; statusLabel = "⏰ " + t("coupons.fields.expiresAt"); }
                  else if (notStarted) { statusVariant = "warning"; statusLabel = t("coupons.notStarted"); }
                  else if (budgetExhausted) { statusVariant = "warning"; statusLabel = t("coupons.budgetExhausted"); }

                  return (
                    <tr key={coupon.id} className="group/row dash-table-row">
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[12px] mono"
                          style={{
                            background: "var(--accent-surface)",
                            color: "var(--primary)",
                            border: "1px solid var(--accent-border)",
                            boxShadow: "0 2px 8px var(--accent-shadow)",
                          }}
                        >
                          <Tag size={11} />
                          {coupon.code}
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4">
                        <span className="text-text-secondary text-[13px]">
                          {coupon.title || "—"}
                        </span>
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
                            {coupon.discount_type === "percentage" ? t("coupons.types.percentage") : t("coupons.types.fixed")}
                          </span>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-4">
                        <span className="text-[14px] font-black num" style={{ color: "var(--success)" }}>
                          {coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}٪`
                            : formatCurrency(Number(coupon.discount_value), currency)}
                        </span>
                        {coupon.max_discount && coupon.discount_type === "percentage" && (
                          <span className="text-[10px] text-text-disabled block">
                            max: {formatCurrency(Number(coupon.max_discount), currency)}
                          </span>
                        )}
                      </td>

                      {/* Min Trip Price */}
                      <td className="py-3.5 px-4 text-text-tertiary text-[13px] num">
                        {coupon.min_trip_price ? formatCurrency(Number(coupon.min_trip_price), currency) : "—"}
                      </td>

                      {/* Uses */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-text-primary font-bold text-[13px] num">{coupon.used_count}</span>
                          <span className="text-text-disabled text-[11px]">/</span>
                          <span className="text-text-tertiary text-[12px] num">{coupon.max_uses || "∞"}</span>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-3.5 px-4">
                        {coupon.budget_limit ? (
                          <div>
                            <div className="flex items-center gap-1.5 text-[12px]">
                              <span className="text-text-primary font-bold num">{formatCurrency(Number(coupon.spent_budget || 0), currency)}</span>
                              <span className="text-text-disabled">/</span>
                              <span className="text-text-tertiary num">{formatCurrency(Number(coupon.budget_limit), currency)}</span>
                            </div>
                            {/* Budget progress bar */}
                            <div className="w-full h-1 rounded-full mt-1.5" style={{ background: "var(--surface-elevated)" }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min((Number(coupon.spent_budget || 0) / Number(coupon.budget_limit)) * 100, 100)}%`,
                                  background: Number(coupon.spent_budget || 0) >= Number(coupon.budget_limit) ? "var(--error)" : "var(--primary)",
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-text-disabled text-[12px]">∞</span>
                        )}
                      </td>

                      {/* Funded By */}
                      <td className="py-3.5 px-4">
                        <div
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold"
                          style={{
                            background: "var(--neutral-surface)",
                            border: "1px solid var(--neutral-border)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {fundedByIcon(coupon.funded_by || "platform")}
                          {t(`coupons.fundedByOptions.${coupon.funded_by || "platform"}`)}
                        </div>
                      </td>

                      {/* Expiry */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {coupon.expires_at ? (
                          <span className={`text-[12px] font-medium ${isExpired ? "text-error" : "text-text-tertiary"}`}>
                            {isExpired ? "⚠ " : ""}{formatDate(coupon.expires_at)}
                          </span>
                        ) : (
                          <span className="text-text-disabled text-[12px]">{t("coupons.noExpiration")}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={statusVariant} dot>
                          {statusLabel}
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
                              {coupon.is_active ? t("common.disable") : t("common.enable")}
                            </button>
                          </form>
                          <form action={`/api/coupons/delete`} method="POST">
                            <input type="hidden" name="coupon_id" value={coupon.id} />
                            <button
                              type="submit"
                              className="btn btn-error py-1.5 px-3 text-[11px]"
                              id={`delete-coupon-${coupon.id}`}
                            >
                              {t("common.delete")}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {(!coupons || coupons.length === 0) && (
                  <tr>
                    <td colSpan={11} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-text-disabled">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center"
                          style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
                        >
                          <Tag size={24} className="opacity-40" />
                        </div>
                        <div>
                          <p className="text-text-secondary font-semibold">{t("coupons.noCoupons")}</p>
                          <p className="text-text-tertiary text-sm mt-1">{t("coupons.addCouponPrompt")}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <a
              href={`/dashboard/coupons?page=${page - 1}`}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${page <= 1 ? "pointer-events-none opacity-30" : ""}`}
              style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
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
                    ? { background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "var(--color-white)", boxShadow: "0 4px 12px var(--accent-shadow)", border: "1px solid var(--accent-border)" }
                    : { background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }
                }
              >
                {p}
              </a>
            ))}

            <a
              href={`/dashboard/coupons?page=${page + 1}`}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${page >= totalPages ? "pointer-events-none opacity-30" : ""}`}
              style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={14} />
            </a>
          </div>
        )}
      </div>
    </>
  );
}
