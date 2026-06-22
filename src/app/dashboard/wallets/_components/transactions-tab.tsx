// [WEB-H-06 FIXED] Extracted from wallets/page.tsx to reduce file size.
import Link from "next/link";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

type Transaction = {
  id: string;
  wallet_id?: string;
  wallet_type?: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  status: string;
  created_at: string;
  user_name?: string;
};

type TxTypeMeta = { label: string; variantClass: string };

type Props = {
  transactions: Transaction[];
  count: number;
  page: number;
  totalPages: number;
  walletTypeFilter: string;
  txTypeFilter: string;
  txTypeLabels: Record<string, TxTypeMeta>;
  currency: string;
  t: (key: string) => string;
};

export function TransactionsTab({
  transactions,
  count,
  page,
  totalPages,
  walletTypeFilter,
  txTypeFilter,
  txTypeLabels,
  currency,
  t,
}: Props) {
  const txFilterHref = (type: string) => {
    const base = `/dashboard/wallets?tab=transactions`;
    const wt = walletTypeFilter ? `&wallet_type=${walletTypeFilter}` : "";
    const tt = type ? `&tx_type=${type}` : "";
    return `${base}${wt}${tt}`;
  };

  const paginationBase = `/dashboard/wallets?tab=transactions${walletTypeFilter ? `&wallet_type=${walletTypeFilter}` : ""}${txTypeFilter ? `&tx_type=${txTypeFilter}` : ""}`;

  return (
    <>
      {/* wallet_type filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href={txFilterHref("")}
          className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${!walletTypeFilter ? "bg-primary-surface text-primary border border-primary/30" : "bg-surface-glass border border-divider text-text-tertiary hover:bg-surface-elevated"}`}
        >
          {t("common.all")}
        </Link>
        <Link
          href={`/dashboard/wallets?tab=transactions&wallet_type=driver${txTypeFilter ? `&tx_type=${txTypeFilter}` : ""}`}
          className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${walletTypeFilter === "driver" ? "bg-success/15 text-success border border-success/30" : "bg-surface-glass border border-divider text-text-tertiary hover:bg-surface-elevated"}`}
        >
          {t("common.drivers")}
        </Link>
        <Link
          href={`/dashboard/wallets?tab=transactions&wallet_type=user${txTypeFilter ? `&tx_type=${txTypeFilter}` : ""}`}
          className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${walletTypeFilter === "user" ? "bg-info/15 text-info border border-info/30" : "bg-surface-glass border border-divider text-text-tertiary hover:bg-surface-elevated"}`}
        >
          {t("common.users")}
        </Link>
      </div>

      {/* tx_type filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-text-tertiary font-semibold ml-1">نوع:</span>
        <Link
          href={txFilterHref("")}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${!txTypeFilter ? "bg-primary-surface text-primary border border-primary/30" : "bg-surface-glass border border-divider text-text-tertiary hover:bg-surface-elevated"}`}
        >
          الكل
        </Link>
        {Object.entries(txTypeLabels).map(([key, meta]) => (
          <Link
            key={key}
            href={txFilterHref(key)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${txTypeFilter === key ? `${meta.variantClass} border` : "bg-surface-glass border border-divider text-text-tertiary hover:bg-surface-elevated"}`}
          >
            {meta.label}
          </Link>
        ))}
      </div>

      <div className="dash-table-card">
        <div className="dash-section-header justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-primary to-primary-dark shadow-[0_0_8px_var(--primary)]" />
            <h3 className="text-[13px] font-bold text-text-primary">{t("wallets.txHistory")}</h3>
            <span className="text-text-disabled text-[11px]">({count})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="dash-table-head">
                {[
                  t("common.user"),
                  t("wallets.fields.type"),
                  t("wallets.fields.category"),
                  t("wallets.fields.amount"),
                  t("wallets.fields.before"),
                  t("wallets.fields.after"),
                  t("common.status"),
                  t("common.date"),
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
              {transactions.map((tx) => {
                const txMeta = txTypeLabels[tx.type] || { label: tx.type, variantClass: "variant-neutral" };
                const isPositive = Number(tx.amount) > 0;
                return (
                  <tr key={tx.id} className="group/row dash-table-row">
                    <td className="py-3.5 px-4 text-[12px] text-text-primary font-medium">
                      {tx.user_name || (tx.wallet_id?.substring(0, 8) ?? "") + "..."}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                          tx.wallet_type === "driver" ? "variant-success" : "variant-primary"
                        }`}
                      >
                        {tx.wallet_type === "driver" ? t("common.driver") : t("common.user")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${txMeta.variantClass}`}>
                        {txMeta.label}
                      </span>
                    </td>
                    <td
                      className="py-3.5 px-4 text-[14px] font-black num"
                      style={{ color: isPositive ? "var(--success)" : "var(--error)" }}
                    >
                      {isPositive ? "+" : ""}
                      {formatCurrency(Number(tx.amount), currency)}
                    </td>
                    <td className="py-3.5 px-4 text-[12px] num text-text-tertiary">
                      {formatCurrency(Number(tx.balance_before), currency)}
                    </td>
                    <td className="py-3.5 px-4 text-[12px] num text-text-secondary font-medium">
                      {formatCurrency(Number(tx.balance_after), currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          tx.status === "completed" ? "success" : tx.status === "failed" ? "error" : "warning"
                        }
                        dot
                      >
                        {tx.status === "completed"
                          ? t("wallets.status.completed")
                          : tx.status === "failed"
                            ? t("wallets.status.failed")
                            : tx.status === "reversed"
                              ? t("wallets.status.reversed")
                              : t("wallets.status.pending")}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-text-tertiary text-[11px] whitespace-nowrap">
                      {formatDate(tx.created_at)}
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-text-disabled">
                    <ArrowUpDown size={32} className="mx-auto mb-3 opacity-30" />
                    <p>{t("wallets.noTransactions")}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 px-6 border-t border-divider">
            {page > 1 && (
              <Link
                href={`${paginationBase}&page=${page - 1}`}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-glass border border-divider text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all"
              >
                <ChevronRight size={14} />
              </Link>
            )}
            <span className="text-[12px] text-text-tertiary font-medium">
              {t("common.page")} {page} {t("common.of")} {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`${paginationBase}&page=${page + 1}`}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-glass border border-divider text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all"
              >
                <ChevronLeft size={14} />
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
