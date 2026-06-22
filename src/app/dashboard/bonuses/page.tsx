import { createAdminClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Trophy, Target, Calendar, Car, CheckCircle,
  XCircle, Clock, Zap, TrendingUp, Award,
} from "lucide-react";
import BonusesClient, { ToggleRuleStatus } from "./bonuses-client";
import { getAppCurrency } from "@/lib/currency";

export default async function BonusesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.search || "";
  const t = await getTranslations();
  const supabase = createAdminClient();

  const [rulesRes, summaryRes, recentAwardsRes] = await Promise.all([
    (() => {
      let q = supabase
        .from("bonus_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (searchQuery) {
        q = q.or(`name.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%`);
      }
      return q;
    })(),
    supabase.from("admin_bonus_summary").select("*"),
    supabase
      .from("driver_bonus_ledger")
      .select("*, bonus_rules(name, name_ar), users:driver_id(name)")
      .order("awarded_at", { ascending: false })
      .limit(20),
  ]);

  const rules = rulesRes.data || [];
  const summary = summaryRes.data || [];
  const recentAwards = recentAwardsRes.data || [];

  // Summary aggregation
  const totalBonusesPaid = summary.reduce(
    (sum: number, r: any) => sum + (Number(r.total_bonus_amount) || 0),
    0
  );
  const totalAwardedCount = summary.reduce(
    (sum: number, r: any) => sum + (Number(r.total_awarded_count) || 0),
    0
  );
  const activeRules = rules.filter((r: any) => r.is_active).length;
  const currency = await getAppCurrency();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-[28px] font-black tracking-tight text-text-primary leading-tight">
              {t("bonuses.title")}
            </h1>
            <p className="text-[14px] text-text-tertiary leading-relaxed">
              {t("bonuses.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/15 bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary">
              <Trophy size={13} />
              {activeRules} {t("bonuses.activeRules")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-success/20 bg-success/10 px-3 py-1.5 text-[11px] font-black text-success">
              <Award size={13} />
              {formatCurrency(totalBonusesPaid, currency)}
            </span>
            <BonusesClient />
          </div>
        </div>

        {/* Search */}
        <form className="flex items-center gap-2">
          <input
            type="text"
            name="search"
            defaultValue={searchQuery}
            placeholder={t("common.search") + "..."}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold outline-none transition-colors"
            style={{
              background: searchQuery ? "var(--accent-surface)" : "var(--surface-elevated)",
              border: `1px solid ${searchQuery ? "var(--accent-border)" : "var(--divider-strong)"}`,
              color: "var(--text-primary)",
              minWidth: 200,
            }}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-[13px] font-bold transition-all"
            style={{ background: "var(--primary)", color: "var(--color-black)" }}
          >
            {t("ratings.filters.apply")}
          </button>
          {searchQuery && (
            <a
              href="/dashboard/bonuses"
              className="px-3 py-2 rounded-xl text-[12px] font-semibold text-text-tertiary hover:text-text-secondary"
              style={{ border: "1px solid var(--divider)", background: "var(--surface-elevated)" }}
            >
              {t("ratings.filters.reset")}
            </a>
          )}
        </form>



        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-divider bg-surface-elevated p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Target size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-[12px] text-text-tertiary font-medium">{t("bonuses.totalRules")}</p>
              <p className="text-[22px] font-black text-text-primary num leading-tight">{rules.length}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-divider bg-surface-elevated p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 border border-success/20">
              <TrendingUp size={20} className="text-success" />
            </div>
            <div>
              <p className="text-[12px] text-text-tertiary font-medium">{t("bonuses.totalAwarded")}</p>
              <p className="text-[22px] font-black text-text-primary num leading-tight">{totalAwardedCount}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-divider bg-surface-elevated p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/10 border border-warning/20">
              <Zap size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-[12px] text-text-tertiary font-medium">{t("bonuses.totalPaid")}</p>
              <p className="text-[22px] font-black text-text-primary num leading-tight">{formatCurrency(totalBonusesPaid, currency)}</p>
            </div>
          </div>
        </div>

        {/* Bonus Rules Table */}
        <div className="rounded-2xl border border-divider bg-surface-elevated shadow-sm">
          <div className="px-5 py-4 border-b border-divider flex items-center gap-3 bg-surface/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Trophy size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-text-primary leading-none">{t("bonuses.rulesTitle")}</h3>
              <p className="mt-1 text-[12px] font-medium text-text-tertiary">{rules.length} {t("bonuses.rulesCount")}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-surface/30">
                  <th className="px-5 py-3 text-start text-[11px] font-bold uppercase tracking-wider text-text-tertiary">{t("bonuses.ruleName")}</th>
                  <th className="px-5 py-3 text-start text-[11px] font-bold uppercase tracking-wider text-text-tertiary">{t("bonuses.triggerType")}</th>
                  <th className="px-5 py-3 text-start text-[11px] font-bold uppercase tracking-wider text-text-tertiary">{t("bonuses.threshold")}</th>
                  <th className="px-5 py-3 text-start text-[11px] font-bold uppercase tracking-wider text-text-tertiary">{t("bonuses.bonusAmount")}</th>
                  <th className="px-5 py-3 text-start text-[11px] font-bold uppercase tracking-wider text-text-tertiary">{t("bonuses.vehicleTypes")}</th>
                  <th className="px-5 py-3 text-start text-[11px] font-bold uppercase tracking-wider text-text-tertiary">{t("common.status")}</th>
                  <th className="px-5 py-3 text-start text-[11px] font-bold uppercase tracking-wider text-text-tertiary">{t("bonuses.validity")}</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule: any) => (
                  <tr key={rule.id} className="border-b border-divider last:border-b-0 hover:bg-surface-elevated/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-bold text-text-primary">{rule.name_ar || rule.name}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-1 text-[10px] font-bold text-primary">
                        {rule.trigger_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-bold text-text-primary num">{rule.threshold}</td>
                    <td className="px-5 py-3.5 text-[13px] font-black text-success num">{formatCurrency(Number(rule.bonus_amount), currency)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(rule.vehicle_types || []).map((vt: string, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-0.5 text-[10px] font-bold text-text-secondary border border-divider">
                            <Car size={9} />
                            {vt}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {rule.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-success/10 border border-success/20 px-2 py-1 text-[10px] font-bold text-success">
                            <CheckCircle size={10} />
                            {t("common.active")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-error/10 border border-error/20 px-2 py-1 text-[10px] font-bold text-error">
                            <XCircle size={10} />
                            {t("common.inactive")}
                          </span>
                        )}
                        <ToggleRuleStatus id={rule.id} is_active={rule.is_active} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
                        <Calendar size={11} />
                        {rule.starts_at ? formatDate(rule.starts_at) : "—"}
                        {rule.expires_at && (
                          <span className="text-text-disabled">→ {formatDate(rule.expires_at)}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated border border-divider shadow-sm">
                          <Trophy size={24} className="text-text-disabled" />
                        </div>
                        <p className="text-sm font-bold text-text-disabled">{t("common.noData")}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Awards */}
        <div className="rounded-2xl border border-divider bg-surface-elevated shadow-sm">
          <div className="px-5 py-4 border-b border-divider flex items-center gap-3 bg-surface/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 border border-success/20">
              <Award size={16} className="text-success" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-text-primary leading-none">{t("bonuses.recentAwards")}</h3>
              <p className="mt-1 text-[12px] font-medium text-text-tertiary">{t("bonuses.recentAwardsSubtitle")}</p>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-2">
            {recentAwards.map((award: any) => (
              <div
                key={award.id}
                className="flex items-center justify-between p-3 rounded-xl border border-divider bg-surface hover:bg-surface-elevated transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                    <Trophy size={14} className="text-success" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-text-primary">
                      {award.users?.name || award.driver_id?.substring(0, 8)}
                    </p>
                    <p className="text-[11px] text-text-tertiary font-medium">
                      {award.bonus_rules?.name_ar || award.bonus_rules?.name || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-black text-success num">
                    +{formatCurrency(Number(award.bonus_amount), currency)}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
                    <Clock size={11} />
                    {award.awarded_at ? formatDate(award.awarded_at) : "—"}
                  </div>
                </div>
              </div>
            ))}
            {recentAwards.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm font-bold text-text-disabled">{t("common.noData")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
