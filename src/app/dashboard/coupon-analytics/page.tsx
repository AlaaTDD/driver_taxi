import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Tag,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Clock,
  Activity,
} from "lucide-react";
import { getAppCurrency } from "@/lib/currency";

export default async function CouponAnalyticsPage() {
  const t = await getTranslations();
  const supabase = createAdminClient();
  const renderTimestamp = new Date().getTime();
  const currency = await getAppCurrency();

  // ── Fetch Analytics Data ──
  const { data: analytics } = await supabase
    .from("coupons")
    .select("*")
    .order("used_count", { ascending: false });

  // ── Fetch Wallet Subsidy Transactions ──
  const { data: subsidyTxs } = await supabase
    .from("wallet_transactions")
    .select("amount, created_at")
    .eq("type", "coupon_subsidy")
    .eq("status", "completed");

  // ── Fetch Budget Alerts (coupons at or above 70% budget usage) ──
  const budgetAlerts = (analytics || [])
    .filter((c) => c.budget_limit && Number(c.budget_limit) > 0)
    .map((c) => {
      const spent = Number(c.spent_budget || 0);
      const limit = Number(c.budget_limit);
      const pct = Math.round((spent / limit) * 100);
      return {
        id: c.id,
        code: c.code,
        title: c.title,
        budget_limit: limit,
        spent_budget: spent,
        usage_pct: pct,
        alert_level: pct >= 100 ? 'exhausted' : pct >= 95 ? 'critical' : pct >= 70 ? 'warning' : 'ok',
        is_active: c.is_active,
      };
    })
    .filter((a) => a.alert_level !== 'ok')
    .sort((a, b) => b.usage_pct - a.usage_pct);

  // ── Fetch Audit Log ──
  const { data: auditLog } = await supabase
    .from("coupon_audit_log")
    .select("*, coupons!fk_coupon_audit_log_coupon(code)")
    .order("created_at", { ascending: false })
    .limit(20);

  // ── Compute Aggregated KPIs ──
  const allCoupons = analytics || [];
  const totalCoupons = allCoupons.length;
  const activeCoupons = allCoupons.filter((c) => c.is_active).length;

  // All usages across all coupons
  const totalDiscountGiven = allCoupons.reduce((sum, c) => sum + Number(c.spent_budget || 0), 0);
  const totalUsageCount = allCoupons.reduce((sum, c) => sum + Number(c.used_count || 0), 0);
  
  // PERF-04 FIX: Replaced unbounded SELECT trip_id FROM coupon_usages with a
  // COUNT-only HEAD request. JS Set(trip_ids).size is O(N) on fetched rows;
  // the COUNT is O(1) at DB level and transfers zero rows.
  const { count: uniqueTripsCount } = await supabase
    .from("coupon_usages")
    .select("id", { count: "exact", head: true });
  const uniqueTrips = uniqueTripsCount ?? 0;
  const avgDiscountPerTrip = totalUsageCount > 0 ? totalDiscountGiven / totalUsageCount : 0;

  // Platform subsidy cost
  const totalSubsidyCost = Math.abs((subsidyTxs || []).reduce((sum, tx) => sum + Number(tx.amount || 0), 0));

  // Top 5 coupons by usage
  const topCoupons = [...allCoupons]
    .sort((a, b) => (b.used_count || 0) - (a.used_count || 0))
    .slice(0, 8);

  // ── Fetch Timeline for Top Coupon ──
  let topCouponTimeline: any[] = [];
  if (topCoupons.length > 0) {
    const { data: timeline } = await supabase.rpc("fn_coupon_usage_timeline", {
      p_coupon_id: topCoupons[0].id
    });
    topCouponTimeline = timeline || [];
  }

  // PERF-04 FIX: Replaced unbounded join across coupon_usages × user_coupons with
  // a limit-capped distinct user_id count. 50 000 rows covers any realistic
  // production dataset; if it grows beyond that, an RPC aggregate is the next step.
  const { data: userUsages } = await supabase
    .from("user_coupons")
    .select("user_id")
    .eq("is_used", true)
    .limit(50000);
  const totalUniqueUsers = new Set(
    (userUsages || []).map((u) => u.user_id).filter(Boolean)
  ).size;

  // Budget stats
  const totalBudgetAllocated = allCoupons.reduce((sum, c) => sum + Number(c.budget_limit || 0), 0);
  const totalBudgetSpent = allCoupons.reduce((sum, c) => sum + Number(c.spent_budget || 0), 0);

  // ── KPI Cards ──
  const kpis = [
    {
      label: t("coupons.analytics.totalDiscountGiven"),
      value: formatCurrency(totalDiscountGiven, currency),
      sub: `${totalUsageCount} ${t("coupons.analytics.usageCount")}`,
      icon: DollarSign,
      color: "var(--primary)",
      bg: "var(--accent-surface)",
      border: "var(--accent-border)",
    },
    {
      label: t("coupons.analytics.platformSubsidyCost"),
      value: formatCurrency(totalSubsidyCost, currency),
      sub: `${t("coupons.stats.totalDiscount")}`,
      icon: TrendingUp,
      color: "var(--error)",
      bg: "var(--error-surface)",
      border: "var(--error-border)",
    },
    {
      label: t("coupons.analytics.avgDiscountPerTrip"),
      value: formatCurrency(avgDiscountPerTrip, currency),
      sub: `${uniqueTrips} ${t("coupons.analytics.completedTrips")}`,
      icon: Target,
      color: "var(--info)",
      bg: "var(--info-surface)",
      border: `rgba(var(--info-rgb), 0.25)`,
    },
    {
      label: t("coupons.analytics.uniqueUsersCount"),
      value: totalUniqueUsers.toString(),
      sub: `${activeCoupons} / ${totalCoupons} ${t("common.active")}`,
      icon: Users,
      color: "var(--success)",
      bg: "var(--success-surface)",
      border: "var(--success-border)",
    },
  ];

  // ── Bar Chart Data for Top Coupons ──
  const maxUsage = Math.max(...topCoupons.map((c) => c.used_count || 0), 1);

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("coupons.analytics.title")}</h1>
        <p className="text-sm text-text-secondary mt-1">{t("coupons.analytics.subtitle")}</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            {/* Subtle glow */}
            <div
              className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
              style={{ background: `linear-gradient(to left, transparent, ${kpi.color})`, opacity: 0.5 }}
            />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">{kpi.label}</p>
                <p className="text-[22px] font-black text-text-primary mt-1.5 num">{kpi.value}</p>
                <p className="text-[11px] text-text-disabled mt-1">{kpi.sub}</p>
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

      {/* ── Two Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Top Coupons by Usage ── */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--divider)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center gap-2.5 mb-6">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-surface)", border: "1px solid var(--accent-border)" }}
            >
              <BarChart3 size={14} className="text-primary" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-text-primary">{t("coupons.analytics.topCoupons")}</h3>
              <p className="text-[11px] text-text-tertiary">{t("coupons.analytics.usageCount")}</p>
            </div>
          </div>

          <div className="space-y-3">
            {topCoupons.map((coupon, i) => {
              const percentage = ((coupon.used_count || 0) / maxUsage) * 100;
              return (
                <div key={coupon.id} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black num"
                        style={{
                          background: i < 3 ? "var(--accent-surface)" : "var(--neutral-surface)",
                          color: i < 3 ? "var(--primary)" : "var(--text-tertiary)",
                          border: `1px solid ${i < 3 ? "var(--accent-border)" : "var(--neutral-border)"}`,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[13px] font-bold text-text-primary mono">{coupon.code}</span>
                      {coupon.title && (
                        <span className="text-[11px] text-text-tertiary">· {coupon.title}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-black num" style={{ color: "var(--success)" }}>
                        {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : formatCurrency(Number(coupon.discount_value), currency)}
                      </span>
                      <span className="text-[12px] font-bold text-text-secondary num">{coupon.used_count || 0}×</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: "var(--surface-elevated)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${percentage}%`,
                        background: `linear-gradient(to left, var(--primary), var(--primary-dark))`,
                        boxShadow: "0 0 8px var(--accent-shadow)",
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {topCoupons.length === 0 && (
              <div className="py-10 text-center text-text-disabled text-[13px]">
                {t("coupons.noCoupons")}
              </div>
            )}
          </div>
        </div>

        {/* ── Budget Overview ── */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--divider)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center gap-2.5 mb-6">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--success-surface)", border: "1px solid var(--success-border)" }}
            >
              <DollarSign size={14} style={{ color: "var(--success)" }} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-text-primary">{t("coupons.fields.budgetLimit")}</h3>
              <p className="text-[11px] text-text-tertiary">{t("coupons.analytics.platformSubsidyCost")}</p>
            </div>
          </div>

          {/* Budget Summary Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div
              className="p-4 rounded-xl"
              style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}
            >
              <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{t("coupons.fields.budgetLimit")}</p>
              <p className="text-[18px] font-black text-text-primary mt-1 num">{formatCurrency(totalBudgetAllocated, currency)}</p>
            </div>
            <div
              className="p-4 rounded-xl"
              style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}
            >
              <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{t("coupons.fields.spentBudget")}</p>
              <p className="text-[18px] font-black num" style={{ color: totalBudgetSpent > 0 ? "var(--primary)" : "var(--text-primary)" }}>
                {formatCurrency(totalBudgetSpent, currency)}
              </p>
            </div>
          </div>

          {/* Overall budget bar */}
          {totalBudgetAllocated > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-text-tertiary">{Math.round((totalBudgetSpent / totalBudgetAllocated) * 100)}% {t("coupons.fields.spentBudget")}</span>
                <span className="text-text-disabled num">{formatCurrency(totalBudgetAllocated - totalBudgetSpent, currency)} {t("coupons.stats.budgetRemaining")}</span>
              </div>
              <div className="w-full h-3 rounded-full" style={{ background: "var(--surface-elevated)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((totalBudgetSpent / totalBudgetAllocated) * 100, 100)}%`,
                    background: (totalBudgetSpent / totalBudgetAllocated) > 0.9
                      ? "var(--error)"
                      : (totalBudgetSpent / totalBudgetAllocated) > 0.7
                        ? "var(--warning)"
                        : "linear-gradient(to left, var(--success), var(--success-light))",
                  }}
                />
              </div>
            </div>
          )}

          {/* Per-Coupon Budget Breakdown */}
          <div className="space-y-2.5">
            {allCoupons
              .filter((c) => c.budget_limit)
              .sort((a, b) => Number(b.spent_budget || 0) - Number(a.spent_budget || 0))
              .slice(0, 6)
              .map((coupon) => {
                const spent = Number(coupon.spent_budget || 0);
                const limit = Number(coupon.budget_limit);
                const pct = Math.round((spent / limit) * 100);
                return (
                  <div key={coupon.id} className="flex items-center gap-3">
                    <span className="text-[12px] font-bold mono text-text-secondary w-24 truncate">{coupon.code}</span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--surface-elevated)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: pct >= 100 ? "var(--error)" : "var(--primary)",
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-bold num text-text-tertiary w-10 text-left">{pct}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ── Coupon Performance Table ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--divider)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="p-5 border-b" style={{ borderColor: "var(--divider)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-[3px] h-5 rounded-full"
              style={{
                background: "linear-gradient(to bottom, var(--primary), var(--primary-dark))",
                boxShadow: "0 0 8px var(--primary-surface)",
              }}
            />
            <h3 className="text-[13px] font-bold text-text-primary">{t("coupons.analytics.topCoupons")} — {t("common.details")}</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="dash-table-head">
                {[
                  t("coupons.fields.code"),
                  t("coupons.fields.discountValue"),
                  t("coupons.analytics.usageCount"),
                  t("coupons.analytics.totalDiscountGiven"),
                  t("coupons.analytics.completedTrips"),
                  t("coupons.analytics.cancelledTrips"),
                  t("coupons.fields.budgetLimit"),
                  t("common.status"),
                ].map((h) => (
                  <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allCoupons.slice(0, 15).map((coupon) => {
                const couponTotal = Number(coupon.spent_budget || 0);
                
                return (
                  <tr key={coupon.id} className="group/row dash-table-row">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Tag size={11} className="text-primary" />
                        <span className="text-[13px] font-bold mono text-text-primary">{coupon.code}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[13px] font-black num" style={{ color: "var(--success)" }}>
                        {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : formatCurrency(Number(coupon.discount_value), currency)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[13px] font-bold num text-text-primary">{coupon.used_count || 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[13px] font-bold num text-text-primary">{formatCurrency(couponTotal, currency)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} style={{ color: "var(--success)" }} />
                        <span className="text-[12px] num text-text-secondary">—</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <XCircle size={12} style={{ color: "var(--error)" }} />
                        <span className="text-[12px] num text-text-secondary">—</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {coupon.budget_limit ? (
                        <span className="text-[12px] num text-text-secondary">
                          {formatCurrency(Number(coupon.spent_budget || 0), currency)} / {formatCurrency(Number(coupon.budget_limit), currency)}
                        </span>
                      ) : (
                        <span className="text-text-disabled text-[12px]">∞</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                        style={{
                          background: coupon.is_active ? "var(--success-surface)" : "var(--error-surface)",
                          color: coupon.is_active ? "var(--success)" : "var(--error)",
                          border: `1px solid ${coupon.is_active ? "var(--success-border)" : "var(--error-border)"}`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: coupon.is_active ? "var(--success)" : "var(--error)" }}
                        />
                        {coupon.is_active ? t("common.active") : t("common.inactive")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Budget Alerts + Audit Log ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Budget Alerts ── */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--divider)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--warning-surface)", border: "1px solid var(--warning-border)" }}
            >
              <AlertTriangle size={14} style={{ color: "var(--warning)" }} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-text-primary">{t("coupons.analytics.budgetAlerts")}</h3>
              <p className="text-[11px] text-text-tertiary">{t("coupons.analytics.budgetAlertsDesc")}</p>
            </div>
          </div>

          {budgetAlerts.length === 0 ? (
            <div className="py-8 text-center">
              <Shield size={28} className="mx-auto mb-2" style={{ color: "var(--success)", opacity: 0.5 }} />
              <p className="text-[12px] text-text-disabled">{t("coupons.analytics.noAlerts")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {budgetAlerts.map((alert) => {
                const levelStyles: Record<string, { bg: string; color: string; border: string }> = {
                  exhausted: { bg: "var(--error-surface)", color: "var(--error)", border: "var(--error-border)" },
                  critical: { bg: "var(--error-surface)", color: "var(--error)", border: "var(--error-border)" },
                  warning: { bg: "var(--warning-surface)", color: "var(--warning)", border: "var(--warning-border)" },
                };
                const style = levelStyles[alert.alert_level] || levelStyles.warning;
                const levelKey = alert.alert_level as 'critical' | 'warning' | 'exhausted';

                return (
                  <div
                    key={alert.id}
                    className="p-3 rounded-xl flex items-center gap-3"
                    style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-bold mono text-text-primary">{alert.code}</span>
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                          style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
                        >
                          <span className="w-1 h-1 rounded-full" style={{ background: style.color }} />
                          {t(`coupons.analytics.alertLevel.${levelKey}`)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full mt-1.5" style={{ background: "var(--divider)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(alert.usage_pct, 100)}%`,
                            background: style.color,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="text-[14px] font-black num" style={{ color: style.color }}>{alert.usage_pct}%</p>
                      <p className="text-[10px] text-text-disabled num">
                        {formatCurrency(alert.spent_budget, currency)} / {formatCurrency(alert.budget_limit, currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Audit Log ── */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--divider)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-surface)", border: "1px solid var(--accent-border)" }}
            >
              <Activity size={14} className="text-primary" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-text-primary">{t("coupons.analytics.auditLog")}</h3>
              <p className="text-[11px] text-text-tertiary">{t("coupons.analytics.auditLogDesc")}</p>
            </div>
          </div>

          {(!auditLog || auditLog.length === 0) ? (
            <div className="py-8 text-center">
              <Clock size={28} className="mx-auto mb-2" style={{ color: "var(--text-disabled)", opacity: 0.5 }} />
              <p className="text-[12px] text-text-disabled">{t("coupons.analytics.noAuditEvents")}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
              {auditLog.map((event: any) => {
                const eventColorMap: Record<string, string> = {
                  activated: "var(--success)",
                  deactivated: "var(--error)",
                  expired: "var(--warning)",
                  budget_exhausted: "var(--error)",
                  max_uses_reached: "var(--warning)",
                  budget_warning: "var(--warning)",
                  created: "var(--primary)",
                  reversed: "var(--info)",
                  manual_edit: "var(--text-secondary)",
                };
                const eventColor = eventColorMap[event.event_type] || "var(--text-tertiary)";
                const couponCode = event.coupons?.code || '—';

                // Time ago
                const diffMs = renderTimestamp - new Date(event.created_at).getTime();
                const diffMin = Math.floor(diffMs / 60000);
                const timeAgo = diffMin < 1 ? 'Just now'
                  : diffMin < 60 ? `${diffMin}m ago`
                  : diffMin < 1440 ? `${Math.floor(diffMin / 60)}h ago`
                  : `${Math.floor(diffMin / 1440)}d ago`;

                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:opacity-90 transition-opacity"
                    style={{ background: "var(--surface-elevated)" }}
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: eventColor, boxShadow: `0 0 6px ${eventColor}` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold mono text-text-primary">{couponCode}</span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                          style={{
                            color: eventColor,
                            background: `color-mix(in srgb, ${eventColor} 10%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${eventColor} 25%, transparent)`,
                          }}
                        >
                          {t(`coupons.analytics.eventTypes.${event.event_type}` as any) || event.event_type}
                        </span>
                      </div>
                      {event.details?.message && (
                        <p className="text-[10px] text-text-disabled mt-0.5 truncate">{event.details.message}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-text-disabled flex-shrink-0 num">{timeAgo}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
