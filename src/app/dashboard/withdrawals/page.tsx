import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/badge";
import { DashboardShell } from "@/components/dashboard-shell";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  Banknote,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  User,
  CreditCard,
  Smartphone,
} from "lucide-react";

export default async function WithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const statusFilter = params.status || "";
  const pageSize = 15;

  const t = await getTranslations();
  const supabase = createAdminClient();

  /* ── Stats ── */
  const { data: allRequests } = await supabase.from("withdrawal_requests").select("id, status, amount");

  const stats = {
    total: allRequests?.length || 0,
    pending: allRequests?.filter((r) => r.status === "pending").length || 0,
    approved: allRequests?.filter((r) => r.status === "approved" || r.status === "processing").length || 0,
    completed: allRequests?.filter((r) => r.status === "completed").length || 0,
    rejected: allRequests?.filter((r) => r.status === "rejected").length || 0,
    totalAmount: allRequests?.filter((r) => r.status === "completed").reduce((s, r) => s + Number(r.amount || 0), 0) || 0,
    pendingAmount: allRequests?.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.amount || 0), 0) || 0,
  };

  const statCards = [
    { label: t("withdrawals.stats.pending"), value: stats.pending, amount: formatCurrency(stats.pendingAmount), color: "#FBBF24", icon: Clock },
    { label: t("withdrawals.stats.approved"), value: stats.approved, color: "#60A5FA", icon: Loader2 },
    { label: t("withdrawals.stats.completed"), value: stats.completed, amount: formatCurrency(stats.totalAmount), color: "#34D399", icon: CheckCircle },
    { label: t("withdrawals.stats.rejected"), value: stats.rejected, color: "#F87171", icon: XCircle },
  ];

  /* ── Query ── */
  let query = supabase
    .from("withdrawal_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data: requests, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  // Get driver names
  const driverIds = [...new Set((requests || []).map((r) => r.driver_id).filter(Boolean))];
  const { data: drivers } = driverIds.length
    ? await supabase.from("users").select("id, name, phone").in("id", driverIds)
    : { data: [] };
  const driverMap = new Map((drivers || []).map((d) => [d.id, d]));

  // Get admin names
  const adminIds = [...new Set((requests || []).map((r) => r.admin_id).filter(Boolean))];
  const { data: admins } = adminIds.length
    ? await supabase.from("users").select("id, name").in("id", adminIds)
    : { data: [] };
  const adminMap = new Map((admins || []).map((a) => [a.id, a.name]));

  const methodLabels: Record<string, { label: string; icon: typeof CreditCard }> = {
    bank_transfer: { label: t("withdrawals.methods.bank_transfer"), icon: CreditCard },
    vodafone_cash: { label: t("withdrawals.methods.vodafone_cash"), icon: Smartphone },
    instapay: { label: t("withdrawals.methods.instapay"), icon: Smartphone },
    orange_money: { label: t("withdrawals.methods.orange_money"), icon: Smartphone },
  };

  const statusLabels: Record<string, { label: string; variant: "success" | "warning" | "error" | "info" | "default" }> = {
    pending: { label: t("wallets.status.pending"), variant: "warning" },
    approved: { label: t("withdrawals.status.approved"), variant: "info" },
    processing: { label: t("withdrawals.status.processing"), variant: "info" },
    completed: { label: t("wallets.status.completed"), variant: "success" },
    rejected: { label: t("withdrawals.status.rejected"), variant: "error" },
    cancelled: { label: t("common.cancelled"), variant: "default" },
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("withdrawals.title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("withdrawals.subtitle")}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: `${s.color}11`, border: `1px solid ${s.color}22` }}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={13} style={{ color: s.color }} />
                <span className="text-[10px] text-text-tertiary font-semibold">{s.label}</span>
              </div>
              <div className="text-[22px] font-black num" style={{ color: s.color }}>{s.value}</div>
              {s.amount && (
                <div className="text-[11px] font-semibold num mt-0.5" style={{ color: `${s.color}AA` }}>{s.amount}</div>
              )}
            </div>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: t("common.all"), value: "", count: stats.total },
            { label: t("wallets.status.pending"), value: "pending", count: stats.pending },
            { label: t("withdrawals.status.approved"), value: "approved", count: stats.approved },
            { label: t("wallets.status.completed"), value: "completed", count: stats.completed },
            { label: t("withdrawals.status.rejected"), value: "rejected", count: stats.rejected },
          ].map((f) => (
            <Link
              key={f.value}
              href={`/dashboard/withdrawals${f.value ? `?status=${f.value}` : ""}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
              style={{
                background: statusFilter === f.value ? "rgba(59,130,246,0.15)" : "var(--surface-glass)",
                color: statusFilter === f.value ? "#60A5FA" : "var(--text-tertiary)",
                border: `1px solid ${statusFilter === f.value ? "rgba(59,130,246,0.3)" : "var(--divider)"}`,
              }}
            >
              {f.label}
              <span className="text-[10px] opacity-70">({f.count})</span>
            </Link>
          ))}
        </div>

        {/* Requests Table */}
        <div className="dash-table-card">
          <div className="dash-section-header justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-[3px] h-5 rounded-full" style={{ background: "linear-gradient(to bottom, #E879F9, #A855F7)", boxShadow: "0 0 8px rgba(232,121,249,0.5)" }} />
              <h3 className="text-[13px] font-bold text-text-primary">{t("withdrawals.title")}</h3>
              <span className="text-text-disabled text-[11px]">({count || 0})</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="dash-table-head">
                  {[t("common.driver"), t("wallets.fields.amount"), t("withdrawals.method"), t("common.status"), t("users.roles.admin"), t("common.date"), t("common.actions")].map((h) => (
                    <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(requests || []).map((req) => {
                  const driver = driverMap.get(req.driver_id);
                  const method = methodLabels[req.payment_method] || { label: req.payment_method, icon: CreditCard };
                  const status = statusLabels[req.status] || { label: req.status, variant: "default" as const };

                  return (
                    <tr key={req.id} className="group/row dash-table-row">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold" style={{ background: "rgba(232,121,249,0.15)", color: "#E879F9" }}>
                            {(driver?.name || "?")[0]}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-text-primary">{driver?.name || "—"}</p>
                            <p className="text-[10px] text-text-disabled num">{driver?.phone || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[15px] font-black num text-emerald-400">{formatCurrency(Number(req.amount))}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold" style={{ background: "var(--surface-glass)", color: "var(--text-secondary)", border: "1px solid var(--divider)" }}>
                          <method.icon size={11} />
                          {method.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={status.variant} dot>{status.label}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-text-tertiary">{req.admin_id ? adminMap.get(req.admin_id) || "—" : "—"}</td>
                      <td className="py-3.5 px-4 text-text-tertiary text-[11px] whitespace-nowrap">{formatDate(req.created_at)}</td>
                      <td className="py-3.5 px-4">
                        {req.status === "pending" ? (
                          <div className="flex gap-2">
                            <form action="/api/withdrawals/approve" method="POST">
                              <input type="hidden" name="request_id" value={req.id} />
                              <button
                                type="submit"
                                id={`approve-withdrawal-${req.id}`}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all hover:scale-105"
                                style={{ background: "linear-gradient(135deg,#10B981,#059669)", boxShadow: "0 3px 8px rgba(16,185,129,0.3)" }}
                              >
                                {t("common.accept")}
                              </button>
                            </form>
                            <form action="/api/withdrawals/reject" method="POST">
                              <input type="hidden" name="request_id" value={req.id} />
                              <button
                                type="submit"
                                id={`reject-withdrawal-${req.id}`}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80"
                                style={{ background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}
                              >
                                {t("common.reject")}
                              </button>
                            </form>
                          </div>
                        ) : req.status === "rejected" && req.rejection_reason ? (
                          <span className="text-[11px] text-error/60 max-w-[120px] truncate block" title={req.rejection_reason}>
                            ❌ {req.rejection_reason}
                          </span>
                        ) : (
                          <span className="text-text-disabled text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {(!requests || requests.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-text-disabled">
                      <Banknote size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-text-secondary font-semibold">{t("withdrawals.noWithdrawals")}</p>
                      <p className="text-text-tertiary text-sm mt-1">{t("withdrawals.noWithdrawalsDesc")}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 px-6" style={{ borderTop: "1px solid var(--divider)" }}>
              {page > 1 && (
                <Link href={`/dashboard/withdrawals?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-text-secondary hover:text-text-primary transition" style={{ border: "1px solid var(--divider)" }}>
                  {t("common.previous")}
                </Link>
              )}
              <span className="text-[12px] text-text-tertiary">{t("common.page")} {page} {t("common.of")} {totalPages}</span>
              {page < totalPages && (
                <Link href={`/dashboard/withdrawals?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-text-secondary hover:text-text-primary transition" style={{ border: "1px solid var(--divider)" }}>
                  {t("common.next")}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
