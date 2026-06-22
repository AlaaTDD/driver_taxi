// [WEB-H-06 FIXED] Tab content extracted to _components/ — page was 485 lines.
// page.tsx now handles only: data fetching, stats, tab nav, and component wiring.
import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { TrendingUp, TrendingDown, User, Car } from "lucide-react";
import { getAppCurrency } from "@/lib/currency";
import { DriverWalletsTab } from "./_components/driver-wallets-tab";
import { UserWalletsTab } from "./_components/user-wallets-tab";
import { TransactionsTab } from "./_components/transactions-tab";

type TabType = "driver_wallets" | "user_wallets" | "transactions";
const VALID_TABS = new Set<TabType>(["driver_wallets", "user_wallets", "transactions"]);
const VALID_WALLET_TYPES = new Set(["driver", "user"]);
const VALID_TX_TYPES = new Set([
  "trip_earning",
  "trip_payment",
  "withdrawal",
  "withdrawal_refund",
  "top_up",
  "refund",
  "bonus",
  "penalty",
  "adjustment",
  "coupon_subsidy",
]);

// ── Local types (WEB-H-01 FIXED: no more `any`) ──────────────────────────────
type WalletUser = { id: string; name?: string | null; phone?: string | null; email?: string | null };
type WalletStats = {
  total_driver_balance?: number | null;
  total_driver_earned?:  number | null;
  total_driver_withdrawn?: number | null;
  total_user_balance?: number | null;
};
type DriverWallet = {
  id: string; balance: number; total_earned: number; total_withdrawn: number;
  pending_withdrawal: number; commission_rate: number;
  user?: WalletUser | null;
};
type UserWallet = {
  id: string; balance: number; total_spent: number; total_topped_up: number;
  updated_at?: string | null;
  user?: WalletUser | null;
};
type WalletTx = {
  id: string; wallet_id?: string; wallet_type?: string; type: string;
  amount: number; balance_before: number; balance_after: number;
  status: string; created_at: string; user_name?: string;
};

export default async function WalletsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; wallet_type?: string; tx_type?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const tab = VALID_TABS.has(params.tab as TabType) ? (params.tab as TabType) : "driver_wallets";
  const page = Math.max(1, Number(params.page) || 1);
  const walletTypeFilter = VALID_WALLET_TYPES.has(params.wallet_type || "") ? params.wallet_type || "" : "";
  const txTypeFilter = VALID_TX_TYPES.has(params.tx_type || "") ? params.tx_type || "" : "";
  const pageSize = 15;

  const t = await getTranslations();
  const supabase = createAdminClient();
  const currency = await getAppCurrency();
  const errorMessage = params.error ? ({
    invalid_params: "البيانات المرسلة غير صحيحة. راجع المبلغ ونوع العملية وحاول مرة أخرى.",
    wallet_rpc_missing: "دوال المحفظة غير موجودة أو لم يتم تطبيق تحديثات قاعدة البيانات.",
    update_failed: "فشل تحديث المحفظة. راجع السجلات أو أعد المحاولة.",
    insufficient_balance: "الرصيد غير كافٍ لتنفيذ هذه العملية.",
    unauthorized: "صلاحيات الأدمن غير متزامنة مع قاعدة البيانات.",
  } as Record<string, string>)[params.error] || "حدث خطأ أثناء تنفيذ عملية المحفظة." : "";
  const successMessage = params.success ? ({
    wallet_updated: "تم تحديث رصيد المحفظة بنجاح.",
    wallet_topped_up: "تم شحن رصيد المستخدم بنجاح.",
  } as Record<string, string>)[params.success] || "تم تنفيذ العملية بنجاح." : "";

  /* ── Stats ── */
  const [txRes, statsRes] = await Promise.all([
    supabase.from("wallet_transactions").select("id", { count: "exact", head: true }),
    supabase.rpc("get_wallet_stats").single(),
  ]);

  const stats = (statsRes.data || {}) as WalletStats;

  const statCards = [
    { label: t("wallets.stats.driverBalance"), value: stats.total_driver_balance != null ? formatCurrency(Number(stats.total_driver_balance), currency) : "—", variantClass: "variant-success", icon: Car },
    { label: t("wallets.stats.driverEarned"), value: stats.total_driver_earned != null ? formatCurrency(Number(stats.total_driver_earned), currency) : "—", variantClass: "variant-info", icon: TrendingUp },
    { label: t("wallets.stats.driverWithdrawn"), value: stats.total_driver_withdrawn != null ? formatCurrency(Number(stats.total_driver_withdrawn), currency) : "—", variantClass: "variant-error", icon: TrendingDown },
    { label: t("wallets.stats.userBalance"), value: stats.total_user_balance != null ? formatCurrency(Number(stats.total_user_balance), currency) : "—", variantClass: "variant-warning", icon: User },
  ];

  const tabs = [
    { key: "driver_wallets", label: t("wallets.tabs.driverWallets"), count: 0, navClass: "nav-success" },
    { key: "user_wallets", label: t("wallets.tabs.userWallets"), count: 0, navClass: "nav-warning" },
    { key: "transactions", label: t("wallets.tabs.transactions"), count: txRes.count || 0, navClass: "nav-info" },
  ];

  /* ── Driver wallets ── */
  let driverWalletsData: DriverWallet[] = [];
  let driverWalletsCount = 0;
  let driverTotalPages = 1;
  if (tab === "driver_wallets") {
    const { data: dWallets, count } = await supabase
      .from("driver_wallets")
      .select(`
        id, balance, total_earned, total_withdrawn, pending_withdrawal, commission_rate,
        users!inner(id, name, phone, email)
      `, { count: "exact" })
      .order("id", { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);

    driverWalletsCount = count || 0;
    driverTotalPages = Math.ceil(driverWalletsCount / pageSize);
    driverWalletsData = (dWallets || []).map((w) => ({
      ...w,
      // Supabase join returns users as array; take first element
      user: (Array.isArray(w.users) ? (w.users[0] ?? null) : w.users) as WalletUser | null,
    }));
    tabs[0].count = driverWalletsCount;
  }

  /* ── User wallets ── */
  let userWalletsData: UserWallet[] = [];
  let userWalletsCount = 0;
  let userTotalPages = 1;
  if (tab === "user_wallets") {
    const { data: uWallets, count } = await supabase
      .from("user_wallets")
      .select(`
        id, balance, total_spent, total_topped_up, updated_at,
        users!inner(id, name, phone, email)
      `, { count: "exact" })
      .order("id", { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);

    userWalletsCount = count || 0;
    userTotalPages = Math.ceil(userWalletsCount / pageSize);
    userWalletsData = (uWallets || []).map((w) => ({
      ...w,
      // Supabase join returns users as array; take first element
      user: (Array.isArray(w.users) ? (w.users[0] ?? null) : w.users) as WalletUser | null,
    }));
    tabs[1].count = userWalletsCount;
  }

  /* ── Transactions ── */
  let transactions: WalletTx[] = [];
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

    const walletIds = [...new Set(transactions.map((tx) => tx.wallet_id).filter(Boolean))];
    if (walletIds.length) {
      const { data: walletUsers } = await supabase.from("users").select("id, name").in("id", walletIds);
      const uMap = new Map((walletUsers || []).map((u) => [u.id, u.name]));
      transactions = transactions.map((tx) => ({ ...tx, user_name: uMap.get(tx.wallet_id) }));
    }
  }

  // ✅ BUG-7 FIX: tx_type filter labels — complete list matching DB ENUM.
  // 'coupon_subsidy' was missing from the original map.
  const txTypeLabels: Record<string, { label: string; variantClass: string }> = {
    trip_earning:      { label: t("wallets.txTypes.trip_earning"),      variantClass: "variant-success" },
    trip_payment:      { label: t("wallets.txTypes.trip_payment"),      variantClass: "variant-info"    },
    withdrawal:        { label: t("wallets.txTypes.withdrawal"),        variantClass: "variant-error"   },
    withdrawal_refund: { label: t("wallets.txTypes.withdrawal_refund"), variantClass: "variant-warning" },
    top_up:            { label: t("wallets.txTypes.top_up"),            variantClass: "variant-warning" },
    refund:            { label: t("wallets.txTypes.refund"),            variantClass: "variant-info"    },
    bonus:             { label: t("wallets.txTypes.bonus"),             variantClass: "variant-success" },
    penalty:           { label: t("wallets.txTypes.penalty"),           variantClass: "variant-error"   },
    adjustment:        { label: t("wallets.txTypes.adjustment"),        variantClass: "variant-warning" },
    coupon_subsidy:    { label: t("wallets.txTypes.coupon_subsidy"),    variantClass: "variant-info"    },
  };

  // Helper to build the transactions filter URL, preserving wallet_type when set
  const txFilterHref = (type: string) => {
    const base = `/dashboard/wallets?tab=transactions`;
    const wt = walletTypeFilter ? `&wallet_type=${walletTypeFilter}` : "";
    const tt = type ? `&tx_type=${type}` : "";
    return `${base}${wt}${tt}`;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("wallets.title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("wallets.subtitle")}</p>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-error/25 bg-error/10 px-4 py-3 text-[13px] font-semibold text-error">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-[13px] font-semibold text-success">
            {successMessage}
          </div>
        )}

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
          <DriverWalletsTab
            wallets={driverWalletsData}
            count={driverWalletsCount}
            page={page}
            totalPages={driverTotalPages}
            currency={currency}
            t={t}
          />
        )}

        {/* ── USER WALLETS TAB ── */}
        {tab === "user_wallets" && (
          <UserWalletsTab
            wallets={userWalletsData}
            count={userWalletsCount}
            page={page}
            totalPages={userTotalPages}
            currency={currency}
            t={t}
          />
        )}

        {/* ── TRANSACTIONS TAB ── */}
        {tab === "transactions" && (
          <TransactionsTab
            transactions={transactions}
            count={txCount}
            page={page}
            totalPages={txTotalPages}
            walletTypeFilter={walletTypeFilter}
            txTypeFilter={txTypeFilter}
            txTypeLabels={txTypeLabels}
            currency={currency}
            t={t}
          />
        )}
      </div>
    </>
  );
}
