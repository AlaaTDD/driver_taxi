// [WEB-H-06 FIXED] Extracted from wallets/page.tsx to reduce file size.
import Link from "next/link";
import { Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { WalletActions } from "../wallet-actions";
import { formatCurrency, formatDate } from "@/lib/utils";

type UserWallet = {
  id: string;
  balance: number;
  total_spent: number;
  total_topped_up: number;
  updated_at?: string | null;
  user?: { id: string; name?: string | null; phone?: string | null; email?: string | null } | null;
};

type Props = {
  wallets: UserWallet[];
  count: number;
  page: number;
  totalPages: number;
  currency: string;
  t: (key: string) => string;
};

export function UserWalletsTab({ wallets, count, page, totalPages, currency, t }: Props) {
  return (
    <div className="dash-table-card">
      <div className="dash-section-header">
        <div
          className="w-[3px] h-5 rounded-full"
          style={{
            background: "linear-gradient(to bottom, var(--primary-light), var(--primary))",
            boxShadow: "0 0 8px var(--primary-surface)",
          }}
        />
        <h3 className="text-[13px] font-bold text-text-primary">{t("wallets.tabs.userWallets")}</h3>
        <span className="text-text-disabled text-[11px]">({count})</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="dash-table-head">
              {[
                t("common.user"),
                t("common.phone"),
                t("wallets.fields.balance"),
                t("wallets.fields.totalSpent"),
                t("wallets.fields.totalToppedUp"),
                t("common.date"),
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
            {wallets.map((w) => (
              <tr key={w.id} className="group/row dash-table-row">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold"
                      style={{ background: "var(--primary-surface)", color: "var(--primary)" }}
                    >
                      {(w.user?.name || "?")[0]}
                    </div>
                    <span className="text-[13px] font-bold text-text-primary">{w.user?.name || "—"}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-[12px] text-text-tertiary num">{w.user?.phone || "—"}</td>
                <td className="py-3.5 px-4 text-[14px] font-black num" style={{ color: "var(--primary)" }}>
                  {formatCurrency(Number(w.balance), currency)}
                </td>
                <td className="py-3.5 px-4 text-[13px] num" style={{ color: "var(--error)" }}>
                  {formatCurrency(Number(w.total_spent), currency)}
                </td>
                <td className="py-3.5 px-4 text-[13px] num" style={{ color: "var(--success)" }}>
                  {formatCurrency(Number(w.total_topped_up), currency)}
                </td>
                <td className="py-3.5 px-4 text-text-tertiary text-[11px] whitespace-nowrap">
                  {w.updated_at ? formatDate(w.updated_at) : "—"}
                </td>
                <td className="py-3.5 px-4">
                  <WalletActions walletId={w.id} walletType="user" userName={w.user?.name || "—"} />
                </td>
              </tr>
            ))}
            {wallets.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center text-text-disabled">
                  <Wallet size={32} className="mx-auto mb-3 opacity-30" />
                  <p>{t("wallets.noUserWallets")}</p>
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
              href={`/dashboard/wallets?tab=user_wallets&page=${page - 1}`}
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
              href={`/dashboard/wallets?tab=user_wallets&page=${page + 1}`}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-glass border border-divider text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all"
            >
              <ChevronLeft size={14} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
