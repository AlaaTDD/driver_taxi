import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/badge";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  User,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Banknote,
} from "lucide-react";

type TabType = "driver_wallets" | "user_wallets" | "transactions";

export default async function WalletsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; wallet_type?: string; tx_type?: string }>;
}) {
  const params = await searchParams;
  const tab = (params.tab as TabType) || "driver_wallets";
  const page = Number(params.page) || 1;
  const walletTypeFilter = params.wallet_type || "";
  const txTypeFilter = params.tx_type || "";
  const pageSize = 15;

  const t = await getTranslations();
  const supabase = createAdminClient();

  /* ── Stats ── */
  const [driverWalletsRes, userWalletsRes, txRes] = await Promise.all([
    supabase.from("driver_wallets").select("id, balance, total_earned, total_withdrawn, pending_withdrawal, commission_rate"),
    supabase.from("user_wallets").select("id, balance, total_spent, total_topped_up"),
    supabase.from("wallet_transactions").select("id", { count: "exact", head: true }),
  ]);

  const driverWallets = driverWalletsRes.data || [];
  const userWallets = userWalletsRes.data || [];

  const totalDriverBalance = driverWallets.reduce((s, w) => s + Number(w.balance || 0), 0);
  const totalDriverEarned = driverWallets.reduce((s, w) => s + Number(w.total_earned || 0), 0);
  const totalDriverWithdrawn = driverWallets.reduce((s, w) => s + Number(w.total_withdrawn || 0), 0);
  const totalUserBalance = userWallets.reduce((s, w) => s + Number(w.balance || 0), 0);

  const statCards = [
    { label: t("wallets.stats.driverBalance"), value: formatCurrency(totalDriverBalance), variantClass: "variant-success", icon: Car },
    { label: t("wallets.stats.driverEarned"), value: formatCurrency(totalDriverEarned), variantClass: "variant-info", icon: TrendingUp },
    { label: t("wallets.stats.driverWithdrawn"), value: formatCurrency(totalDriverWithdrawn), variantClass: "variant-error", icon: TrendingDown },
    { label: t("wallets.stats.userBalance"), value: formatCurrency(totalUserBalance), variantClass: "variant-warning", icon: User },
  ];

  const tabs = [
    { key: "driver_wallets", label: t("wallets.tabs.driverWallets"), count: driverWallets.length, navClass: "nav-success" },
    { key: "user_wallets", label: t("wallets.tabs.userWallets"), count: userWallets.length, navClass: "nav-warning" },
    { key: "transactions", label: t("wallets.tabs.transactions"), count: txRes.count || 0, navClass: "nav-info" },
  ];

  /* ── Driver wallets with user info ── */
  let driverWalletsData: any[] = [];
  let driverWalletsCount = 0;
  if (tab === "driver_wallets") {
    const driverIds = driverWallets.map((w) => w.id);
    const { data: users } = driverIds.length
      ? await supabase.from("users").select("id, name, phone, email").in("id", driverIds)
      : { data: [] };
    const userMap = new Map((users || []).map((u) => [u.id, u]));
    driverWalletsData = driverWallets.map((w) => ({ ...w, user: userMap.get(w.id) }));
    driverWalletsCount = driverWalletsData.length;
  }

  /* ── User wallets with user info ── */
  let userWalletsData: any[] = [];
  let userWalletsCount = 0;
  if (tab === "user_wallets") {
    const userIds = userWallets.map((w) => w.id);
    const { data: users } = userIds.length
      ? await supabase.from("users").select("id, name, phone, email").in("id", userIds)
      : { data: [] };
    const userMap = new Map((users || []).map((u) => [u.id, u]));
    userWalletsData = userWallets.map((w) => ({ ...w, user: userMap.get(w.id) }));
    userWalletsCount = userWalletsData.length;
  }

  /* ── Transactions ── */
  let transactions: any[] = [];
  let txCount = 0;
  let txTotalPages = 1;
  if (tab === "transactions") {
    let txQuery = supabase
      .from("wallet_transactions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (walletTypeFilter) txQuery = txQuery.eq("wallet_type", walletTypeFilter);
    if (txTypeFilter) txQuery = txQuery.eq("type", txTypeFilter);

    const { data, count } = await txQuery;
    transactions = data || [];
    txCount = count || 0;
    txTotalPages = Math.ceil(txCount / pageSize);

    // Get user names for wallet IDs
    const walletIds = [...new Set(transactions.map((tx) => tx.wallet_id).filter(Boolean))];
    if (walletIds.length) {
      const { data: walletUsers } = await supabase.from("users").select("id, name").in("id", walletIds);
      const uMap = new Map((walletUsers || []).map((u) => [u.id, u.name]));
      transactions = transactions.map((tx) => ({ ...tx, user_name: uMap.get(tx.wallet_id) }));
    }
  }

  const txTypeLabels: Record<string, { label: string; variantClass: string }> = {
    trip_earning: { label: t("wallets.txTypes.trip_earning"), variantClass: "variant-success" },
    trip_payment: { label: t("wallets.txTypes.trip_payment"), variantClass: "variant-info" },
    withdrawal: { label: t("wallets.txTypes.withdrawal"), variantClass: "variant-error" },
    withdrawal_refund: { label: t("wallets.txTypes.withdrawal_refund"), variantClass: "variant-warning" },
    top_up: { label: t("wallets.txTypes.top_up"), variantClass: "variant-warning" },
    refund: { label: t("wallets.txTypes.refund"), variantClass: "variant-info" },
    bonus: { label: t("wallets.txTypes.bonus"), variantClass: "variant-success" },
    penalty: { label: t("wallets.txTypes.penalty"), variantClass: "variant-error" },
    adjustment: { label: t("wallets.txTypes.adjustment"), variantClass: "variant-warning" },
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("wallets.title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("wallets.subtitle")}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="dash-stat p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.variantClass}`}>
                  <s.icon size={16} />
                </div>
              </div>
              <div className="text-[24px] font-black num tracking-tight" style={{ color: s.variantClass.replace('variant-', 'var(--') + ')' }}>{s.value}</div>
              <p className="text-[11px] text-text-tertiary font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>


        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/dashboard/wallets?tab=${t.key}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${t.navClass} ${tab === t.key ? "nav-tab-active" : ""}`}
              style={tab !== t.key ? { background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-tertiary)" } : undefined}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`min-w-[20px] h-5 rounded-full text-[10px] font-black flex items-center justify-center px-1.5 ${tab === t.key ? "nav-tab-badge-active" : ""}`}
                  style={tab !== t.key ? { background: "var(--surface-elevated)", color: "var(--text-tertiary)", border: "1px solid var(--divider)" } : undefined}
                >
                  {t.count}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* ── DRIVER WALLETS TAB ── */}
        {tab === "driver_wallets" && (
          <div className="dash-table-card">
            <div className="dash-section-header">
              <div className="w-[3px] h-5 rounded-full" style={{ background: "linear-gradient(to bottom, var(--success), var(--success-light))", boxShadow: "0 0 8px var(--success-surface)" }} />
              <h3 className="text-[13px] font-bold text-text-primary">{t("wallets.tabs.driverWallets")}</h3>
              <span className="text-text-disabled text-[11px]">({driverWalletsCount})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="dash-table-head">
                    {[t("common.driver"), t("common.phone"), t("wallets.fields.balance"), t("wallets.fields.totalEarned"), t("wallets.fields.totalWithdrawn"), t("wallets.fields.pendingWithdrawal"), t("wallets.fields.commission")].map((h) => (
                      <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {driverWalletsData.map((w) => (
                    <tr key={w.id} className="group/row dash-table-row">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold" style={{ background: "var(--success-surface)", color: "var(--success)" }}>
                            {(w.user?.name || "?")[0]}
                          </div>
                          <span className="text-[13px] font-bold text-text-primary">{w.user?.name || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-text-tertiary num">{w.user?.phone || "—"}</td>
                      <td className="py-3.5 px-4 text-[14px] font-black num" style={{ color: "var(--success)" }}>{formatCurrency(Number(w.balance))}</td>
                      <td className="py-3.5 px-4 text-[13px] font-bold num" style={{ color: "var(--info)" }}>{formatCurrency(Number(w.total_earned))}</td>
                      <td className="py-3.5 px-4 text-[13px] num" style={{ color: "var(--error)" }}>{formatCurrency(Number(w.total_withdrawn))}</td>
                      <td className="py-3.5 px-4 text-[13px] num" style={{ color: "var(--warning)" }}>{formatCurrency(Number(w.pending_withdrawal))}</td>
                      <td className="py-3.5 px-4 text-[13px] num text-text-secondary">{(Number(w.commission_rate) * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                  {driverWalletsData.length === 0 && (
                    <tr><td colSpan={7} className="py-16 text-center text-text-disabled">
                      <Wallet size={32} className="mx-auto mb-3 opacity-30" />
                      <p>{t("wallets.noDriverWallets")}</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── USER WALLETS TAB ── */}
        {tab === "user_wallets" && (
          <div className="dash-table-card">
            <div className="dash-section-header">
              <div className="w-[3px] h-5 rounded-full" style={{ background: "linear-gradient(to bottom, var(--primary-light), var(--primary))", boxShadow: "0 0 8px var(--primary-surface)" }} />
              <h3 className="text-[13px] font-bold text-text-primary">{t("wallets.tabs.userWallets")}</h3>
              <span className="text-text-disabled text-[11px]">({userWalletsCount})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="dash-table-head">
                    {[t("common.user"), t("common.phone"), t("wallets.fields.balance"), t("wallets.fields.totalSpent"), t("wallets.fields.totalToppedUp"), t("common.date")].map((h) => (
                      <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userWalletsData.map((w) => (
                    <tr key={w.id} className="group/row dash-table-row">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold" style={{ background: "var(--primary-surface)", color: "var(--primary)" }}>
                            {(w.user?.name || "?")[0]}
                          </div>
                          <span className="text-[13px] font-bold text-text-primary">{w.user?.name || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-text-tertiary num">{w.user?.phone || "—"}</td>
                      <td className="py-3.5 px-4 text-[14px] font-black num" style={{ color: "var(--primary)" }}>{formatCurrency(Number(w.balance))}</td>
                      <td className="py-3.5 px-4 text-[13px] num" style={{ color: "var(--error)" }}>{formatCurrency(Number(w.total_spent))}</td>
                      <td className="py-3.5 px-4 text-[13px] num" style={{ color: "var(--success)" }}>{formatCurrency(Number(w.total_topped_up))}</td>
                      <td className="py-3.5 px-4 text-text-tertiary text-[11px] whitespace-nowrap">{w.updated_at ? formatDate(w.updated_at) : "—"}</td>
                    </tr>
                  ))}
                  {userWalletsData.length === 0 && (
                    <tr><td colSpan={6} className="py-16 text-center text-text-disabled">
                      <Wallet size={32} className="mx-auto mb-3 opacity-30" />
                      <p>{t("wallets.noUserWallets")}</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TRANSACTIONS TAB ── */}
        {tab === "transactions" && (
          <>
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/dashboard/wallets?tab=transactions" className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${!walletTypeFilter ? 'bg-primary-surface text-primary border border-primary/30' : 'bg-surface-glass border border-divider text-text-tertiary hover:bg-surface-elevated'}`}>{t("common.all")}</Link>
              <Link href="/dashboard/wallets?tab=transactions&wallet_type=driver" className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${walletTypeFilter === 'driver' ? 'bg-success/15 text-success border border-success/30' : 'bg-surface-glass border border-divider text-text-tertiary hover:bg-surface-elevated'}`}>{t("common.drivers")}</Link>
              <Link href="/dashboard/wallets?tab=transactions&wallet_type=user" className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${walletTypeFilter === 'user' ? 'bg-info/15 text-info border border-info/30' : 'bg-surface-glass border border-divider text-text-tertiary hover:bg-surface-elevated'}`}>{t("common.users")}</Link>
            </div>

            <div className="dash-table-card">
              <div className="dash-section-header justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-primary to-primary-dark shadow-[0_0_8px_var(--primary)]" />
                  <h3 className="text-[13px] font-bold text-text-primary">{t("wallets.txHistory")}</h3>
                  <span className="text-text-disabled text-[11px]">({txCount})</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="dash-table-head">
                      {[t("common.user"), t("wallets.fields.type"), t("wallets.fields.category"), t("wallets.fields.amount"), t("wallets.fields.before"), t("wallets.fields.after"), t("common.status"), t("common.date")].map((h) => (
                        <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const txMeta = txTypeLabels[tx.type] || { label: tx.type, variantClass: "variant-neutral" };
                      const isPositive = Number(tx.amount) > 0;
                      return (
                        <tr key={tx.id} className="group/row dash-table-row">
                          <td className="py-3.5 px-4 text-[12px] text-text-primary font-medium">{tx.user_name || tx.wallet_id?.substring(0, 8) + "..."}</td>
                          <td className="py-3.5 px-4">
                             <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${tx.wallet_type === "driver" ? "variant-success" : "variant-primary"}`}>
                              {tx.wallet_type === "driver" ? t("common.driver") : t("common.user")}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                             <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${txMeta.variantClass}`}>
                              {txMeta.label}
                            </span>
                          </td>
                           <td className="py-3.5 px-4 text-[14px] font-black num" style={{ color: isPositive ? "var(--success)" : "var(--error)" }}>
                            {isPositive ? "+" : ""}{formatCurrency(Number(tx.amount))}
                          </td>
                          <td className="py-3.5 px-4 text-[12px] num text-text-tertiary">{formatCurrency(Number(tx.balance_before))}</td>
                          <td className="py-3.5 px-4 text-[12px] num text-text-secondary font-medium">{formatCurrency(Number(tx.balance_after))}</td>
                          <td className="py-3.5 px-4">
                            <Badge variant={tx.status === "completed" ? "success" : tx.status === "failed" ? "error" : "warning"} dot>
                              {tx.status === "completed" ? t("wallets.status.completed") : tx.status === "failed" ? t("wallets.status.failed") : tx.status === "reversed" ? t("wallets.status.reversed") : t("wallets.status.pending")}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-text-tertiary text-[11px] whitespace-nowrap">{formatDate(tx.created_at)}</td>
                        </tr>
                      );
                    })}
                    {transactions.length === 0 && (
                      <tr><td colSpan={8} className="py-16 text-center text-text-disabled">
                        <ArrowUpDown size={32} className="mx-auto mb-3 opacity-30" />
                        <p>{t("wallets.noTransactions")}</p>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {txTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4 px-6 border-t border-divider">
                  {page > 1 && (
                    <Link href={`/dashboard/wallets?tab=transactions&page=${page - 1}${walletTypeFilter ? `&wallet_type=${walletTypeFilter}` : ""}`}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-glass border border-divider text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all">
                      <ChevronRight size={14} />
                    </Link>
                  )}
                  <span className="text-[12px] text-text-tertiary font-medium">{t("common.page")} {page} {t("common.of")} {txTotalPages}</span>
                  {page < txTotalPages && (
                    <Link href={`/dashboard/wallets?tab=transactions&page=${page + 1}${walletTypeFilter ? `&wallet_type=${walletTypeFilter}` : ""}`}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-glass border border-divider text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all">
                      <ChevronLeft size={14} />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
