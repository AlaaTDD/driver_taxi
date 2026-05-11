import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/badge";
import { DashboardShell } from "@/components/dashboard-shell";
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
    { label: "رصيد السائقين", value: formatCurrency(totalDriverBalance), color: "#34D399", icon: Car },
    { label: "إجمالي أرباح السائقين", value: formatCurrency(totalDriverEarned), color: "#60A5FA", icon: TrendingUp },
    { label: "إجمالي المسحوب", value: formatCurrency(totalDriverWithdrawn), color: "#F87171", icon: TrendingDown },
    { label: "رصيد المستخدمين", value: formatCurrency(totalUserBalance), color: "#A78BFA", icon: User },
  ];

  const tabs = [
    { key: "driver_wallets", label: "محافظ السائقين", count: driverWallets.length, color: "#34D399" },
    { key: "user_wallets", label: "محافظ المستخدمين", count: userWallets.length, color: "#A78BFA" },
    { key: "transactions", label: "المعاملات المالية", count: txRes.count || 0, color: "#60A5FA" },
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

  const txTypeLabels: Record<string, { label: string; color: string }> = {
    trip_earning: { label: "أرباح رحلة", color: "#34D399" },
    trip_payment: { label: "دفع رحلة", color: "#60A5FA" },
    withdrawal: { label: "سحب", color: "#F87171" },
    withdrawal_refund: { label: "استرداد سحب", color: "#FBBF24" },
    top_up: { label: "شحن", color: "#A78BFA" },
    refund: { label: "استرداد", color: "#06B6D4" },
    bonus: { label: "بونص", color: "#10B981" },
    penalty: { label: "غرامة", color: "#EF4444" },
    adjustment: { label: "تعديل", color: "#8B5CF6" },
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">المحافظ المالية</h1>
          <p className="text-sm text-text-secondary mt-1">إدارة محافظ السائقين والمستخدمين والمعاملات المالية</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: `${s.color}11`, border: `1px solid ${s.color}22` }}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={13} style={{ color: s.color }} />
                <span className="text-[10px] text-text-tertiary font-semibold">{s.label}</span>
              </div>
              <div className="text-[20px] font-black num" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/dashboard/wallets?tab=${t.key}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200"
              style={
                tab === t.key
                  ? { background: `${t.color}25`, border: `1px solid ${t.color}35`, color: t.color, boxShadow: `0 4px 12px ${t.color}15` }
                  : { background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-tertiary)" }
              }
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className="min-w-[20px] h-5 rounded-full text-[10px] font-black flex items-center justify-center px-1.5"
                  style={{
                    background: tab === t.key ? t.color : "var(--surface-glass)",
                    color: tab === t.key ? "white" : "var(--text-tertiary)",
                    border: tab === t.key ? "none" : "1px solid var(--divider)",
                  }}
                >
                  {t.count}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* ── DRIVER WALLETS TAB ── */}
        {tab === "driver_wallets" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
            <div className="flex items-center gap-2.5 px-6 py-4" style={{ borderBottom: "1px solid var(--divider)" }}>
              <div className="w-[3px] h-5 rounded-full" style={{ background: "linear-gradient(to bottom, #34D399, #059669)", boxShadow: "0 0 8px rgba(52,211,153,0.5)" }} />
              <h3 className="text-[13px] font-bold text-text-primary">محافظ السائقين</h3>
              <span className="text-text-disabled text-[11px]">({driverWalletsCount})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--surface-glass)", borderBottom: "1px solid var(--divider)" }}>
                    {["السائق", "الهاتف", "الرصيد", "إجمالي الأرباح", "إجمالي المسحوب", "معلق السحب", "العمولة"].map((h) => (
                      <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {driverWalletsData.map((w) => (
                    <tr key={w.id} className="group/row table-row-hover" style={{ borderBottom: "1px solid rgba(26,45,71,0.5)" }}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold" style={{ background: "rgba(52,211,153,0.15)", color: "#34D399" }}>
                            {(w.user?.name || "?")[0]}
                          </div>
                          <span className="text-[13px] font-bold text-text-primary">{w.user?.name || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-text-tertiary num">{w.user?.phone || "—"}</td>
                      <td className="py-3.5 px-4 text-[14px] font-black num text-emerald-400">{formatCurrency(Number(w.balance))}</td>
                      <td className="py-3.5 px-4 text-[13px] font-bold num text-blue-400">{formatCurrency(Number(w.total_earned))}</td>
                      <td className="py-3.5 px-4 text-[13px] num text-red-400">{formatCurrency(Number(w.total_withdrawn))}</td>
                      <td className="py-3.5 px-4 text-[13px] num text-amber-400">{formatCurrency(Number(w.pending_withdrawal))}</td>
                      <td className="py-3.5 px-4 text-[13px] num text-text-secondary">{(Number(w.commission_rate) * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                  {driverWalletsData.length === 0 && (
                    <tr><td colSpan={7} className="py-16 text-center text-text-disabled">
                      <Wallet size={32} className="mx-auto mb-3 opacity-30" />
                      <p>لا توجد محافظ سائقين</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── USER WALLETS TAB ── */}
        {tab === "user_wallets" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
            <div className="flex items-center gap-2.5 px-6 py-4" style={{ borderBottom: "1px solid var(--divider)" }}>
              <div className="w-[3px] h-5 rounded-full" style={{ background: "linear-gradient(to bottom, #A78BFA, #7C3AED)", boxShadow: "0 0 8px rgba(167,139,250,0.5)" }} />
              <h3 className="text-[13px] font-bold text-text-primary">محافظ المستخدمين</h3>
              <span className="text-text-disabled text-[11px]">({userWalletsCount})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--surface-glass)", borderBottom: "1px solid var(--divider)" }}>
                    {["المستخدم", "الهاتف", "الرصيد", "إجمالي المصروف", "إجمالي الشحن", "آخر تحديث"].map((h) => (
                      <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userWalletsData.map((w) => (
                    <tr key={w.id} className="group/row table-row-hover" style={{ borderBottom: "1px solid rgba(26,45,71,0.5)" }}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold" style={{ background: "rgba(167,139,250,0.15)", color: "#A78BFA" }}>
                            {(w.user?.name || "?")[0]}
                          </div>
                          <span className="text-[13px] font-bold text-text-primary">{w.user?.name || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-text-tertiary num">{w.user?.phone || "—"}</td>
                      <td className="py-3.5 px-4 text-[14px] font-black num text-violet-400">{formatCurrency(Number(w.balance))}</td>
                      <td className="py-3.5 px-4 text-[13px] num text-red-400">{formatCurrency(Number(w.total_spent))}</td>
                      <td className="py-3.5 px-4 text-[13px] num text-emerald-400">{formatCurrency(Number(w.total_topped_up))}</td>
                      <td className="py-3.5 px-4 text-text-tertiary text-[11px] whitespace-nowrap">{w.updated_at ? formatDate(w.updated_at) : "—"}</td>
                    </tr>
                  ))}
                  {userWalletsData.length === 0 && (
                    <tr><td colSpan={6} className="py-16 text-center text-text-disabled">
                      <Wallet size={32} className="mx-auto mb-3 opacity-30" />
                      <p>لا توجد محافظ مستخدمين</p>
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
              <Link href="/dashboard/wallets?tab=transactions" className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${!walletTypeFilter ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-surface-glass border border-divider text-text-tertiary'}`}>الكل</Link>
              <Link href="/dashboard/wallets?tab=transactions&wallet_type=driver" className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${walletTypeFilter === 'driver' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-surface-glass border border-divider text-text-tertiary'}`}>سائقين</Link>
              <Link href="/dashboard/wallets?tab=transactions&wallet_type=user" className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${walletTypeFilter === 'user' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30' : 'bg-surface-glass border border-divider text-text-tertiary'}`}>مستخدمين</Link>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--divider)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-[3px] h-5 rounded-full" style={{ background: "linear-gradient(to bottom, #3B82F6, #1D4ED8)", boxShadow: "0 0 8px rgba(59,130,246,0.5)" }} />
                  <h3 className="text-[13px] font-bold text-text-primary">سجل المعاملات</h3>
                  <span className="text-text-disabled text-[11px]">({txCount})</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "var(--surface-glass)", borderBottom: "1px solid var(--divider)" }}>
                      {["المستخدم", "النوع", "الفئة", "المبلغ", "قبل", "بعد", "الحالة", "التاريخ"].map((h) => (
                        <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const txMeta = txTypeLabels[tx.type] || { label: tx.type, color: "#9CA3AF" };
                      const isPositive = Number(tx.amount) > 0;
                      return (
                        <tr key={tx.id} className="group/row table-row-hover" style={{ borderBottom: "1px solid rgba(26,45,71,0.5)" }}>
                          <td className="py-3.5 px-4 text-[12px] text-text-primary font-medium">{tx.user_name || tx.wallet_id?.substring(0, 8) + "..."}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold" style={{ background: tx.wallet_type === "driver" ? "rgba(52,211,153,0.1)" : "rgba(167,139,250,0.1)", color: tx.wallet_type === "driver" ? "#34D399" : "#A78BFA", border: `1px solid ${tx.wallet_type === "driver" ? "rgba(52,211,153,0.2)" : "rgba(167,139,250,0.2)"}` }}>
                              {tx.wallet_type === "driver" ? "سائق" : "مستخدم"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold" style={{ background: `${txMeta.color}15`, color: txMeta.color, border: `1px solid ${txMeta.color}25` }}>
                              {txMeta.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[14px] font-black num" style={{ color: isPositive ? "#34D399" : "#F87171" }}>
                            {isPositive ? "+" : ""}{formatCurrency(Number(tx.amount))}
                          </td>
                          <td className="py-3.5 px-4 text-[12px] num text-text-tertiary">{formatCurrency(Number(tx.balance_before))}</td>
                          <td className="py-3.5 px-4 text-[12px] num text-text-secondary font-medium">{formatCurrency(Number(tx.balance_after))}</td>
                          <td className="py-3.5 px-4">
                            <Badge variant={tx.status === "completed" ? "success" : tx.status === "failed" ? "error" : "warning"} dot>
                              {tx.status === "completed" ? "مكتمل" : tx.status === "failed" ? "فشل" : tx.status === "reversed" ? "معكوس" : "معلق"}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-text-tertiary text-[11px] whitespace-nowrap">{formatDate(tx.created_at)}</td>
                        </tr>
                      );
                    })}
                    {transactions.length === 0 && (
                      <tr><td colSpan={8} className="py-16 text-center text-text-disabled">
                        <ArrowUpDown size={32} className="mx-auto mb-3 opacity-30" />
                        <p>لا توجد معاملات</p>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {txTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4 px-6" style={{ borderTop: "1px solid var(--divider)" }}>
                  {page > 1 && (
                    <Link href={`/dashboard/wallets?tab=transactions&page=${page - 1}${walletTypeFilter ? `&wallet_type=${walletTypeFilter}` : ""}`}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-text-secondary hover:text-text-primary transition" style={{ border: "1px solid var(--divider)" }}>
                      السابق
                    </Link>
                  )}
                  <span className="text-[12px] text-text-tertiary">صفحة {page} من {txTotalPages}</span>
                  {page < txTotalPages && (
                    <Link href={`/dashboard/wallets?tab=transactions&page=${page + 1}${walletTypeFilter ? `&wallet_type=${walletTypeFilter}` : ""}`}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-text-secondary hover:text-text-primary transition" style={{ border: "1px solid var(--divider)" }}>
                      التالي
                    </Link>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
