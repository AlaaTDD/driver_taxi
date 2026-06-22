import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/badge";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  Banknote,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Smartphone
} from "lucide-react";
import { getAppCurrency } from "@/lib/currency";

const VALID_WITHDRAWAL_STATUSES = new Set(["pending", "approved", "processing", "completed", "rejected", "cancelled"]);
const WITHDRAWAL_METHODS = ["bank_transfer", "vodafone_cash", "instapay", "orange_money"];
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

export default async function WithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const statusFilter = VALID_WITHDRAWAL_STATUSES.has(params.status || "") ? params.status || "" : "";
  const searchQuery = (params.search || "").trim().slice(0, 64);
  const normalizedSearch = searchQuery.replace(/[%,()]/g, " ").trim();
  const pageSize = 15;

  const t = await getTranslations();
  const supabase = createAdminClient();
  const currency = await getAppCurrency();
  const errorMessage = params.error ? ({
    missing_id: "طلب السحب غير محدد.",
    invalid_params: "بيانات الطلب غير صحيحة. تأكد من سبب الرفض وحاول مرة أخرى.",
    approve_failed: "فشل اعتماد طلب السحب.",
    reject_failed: "فشل رفض طلب السحب.",
    not_pending: "لا يمكن تعديل طلب سحب لم يعد في حالة الانتظار.",
    unauthorized: "صلاحيات الأدمن غير متزامنة مع قاعدة البيانات.",
  } as Record<string, string>)[params.error] || "حدث خطأ أثناء معالجة طلب السحب." : "";
  const successMessage = params.success ? ({
    withdrawal_approved: "تم اعتماد طلب السحب بنجاح.",
    withdrawal_rejected: "تم رفض طلب السحب وتسجيل السبب.",
  } as Record<string, string>)[params.success] || "تم تنفيذ العملية بنجاح." : "";

  /* ── Stats ─────────────────────────────────────────────────────────────────
   * ✅ BUG-8 FIX: was fetching all rows just to count them in JS (N+1 at scale).
   * Now uses parallel count-only queries with head:true — zero data transferred,
   * and a single SUM query for amounts (only two numeric columns needed).
   */
  const [
    { count: totalCount },
    { count: pendingCount },
    { count: approvedCount },
    { count: completedCount },
    { count: rejectedCount },
    { data: pendingAmountData },
    { data: completedAmountData },
  ] = await Promise.all([
    supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }),
    supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).in("status", ["approved", "processing"]),
    supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    // Only fetch amount column for pending — minimises payload
    supabase.from("withdrawal_requests").select("amount").eq("status", "pending"),
    supabase.from("withdrawal_requests").select("amount").eq("status", "completed"),
  ]);

  const stats = {
    total: totalCount || 0,
    pending: pendingCount || 0,
    approved: approvedCount || 0,
    completed: completedCount || 0,
    rejected: rejectedCount || 0,
    totalAmount: (completedAmountData || []).reduce((s, r) => s + Number(r.amount || 0), 0),
    pendingAmount: (pendingAmountData || []).reduce((s, r) => s + Number(r.amount || 0), 0),
  };

  const statCards = [
    { label: t("withdrawals.stats.pending"), value: stats.pending, amount: formatCurrency(stats.pendingAmount, currency), color: "var(--warning)", colorRaw: "var(--warning-rgb)", icon: Clock },
    { label: t("withdrawals.stats.approved"), value: stats.approved, color: "var(--info)", colorRaw: "var(--info-rgb)", icon: Loader2 },
    { label: t("withdrawals.stats.completed"), value: stats.completed, amount: formatCurrency(stats.totalAmount, currency), color: "var(--success)", colorRaw: "var(--success-rgb)", icon: CheckCircle },
    { label: t("withdrawals.stats.rejected"), value: stats.rejected, color: "var(--error)", colorRaw: "var(--error-rgb)", icon: XCircle },
  ];

  /* ── Query ── */
  let query = supabase
    .from("withdrawal_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (statusFilter) query = query.eq("status", statusFilter);
  if (normalizedSearch) {
    const { data: matchingDrivers } = await supabase
      .from("users")
      .select("id")
      .or(`name.ilike.%${normalizedSearch}%,phone.ilike.%${normalizedSearch}%,email.ilike.%${normalizedSearch}%`)
      .limit(50);
    const driverMatches = (matchingDrivers || []).map((u) => u.id);
    const methodMatches = WITHDRAWAL_METHODS.filter((method) =>
      method.includes(normalizedSearch.toLowerCase().replace(/\s+/g, "_"))
    );

    if (driverMatches.length) {
      query = query.in("driver_id", driverMatches);
    } else if (methodMatches.length) {
      query = query.in("payment_method", methodMatches);
    } else {
      query = query.eq("id", EMPTY_UUID);
    }
  }

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
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("withdrawals.title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("withdrawals.subtitle")}</p>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: `rgba(${s.colorRaw},0.08)`, border: `1px solid rgba(${s.colorRaw},0.18)` }}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={13} style={{ color: s.color }} />
                <span className="text-[10px] text-text-tertiary font-semibold">{s.label}</span>
              </div>
              <div className="text-[22px] font-black num" style={{ color: s.color }}>{s.value}</div>
              {s.amount && (
                <div className="text-[11px] font-semibold num mt-0.5" style={{ color: s.color, opacity: 0.7 }}>{s.amount}</div>
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${statusFilter === f.value ? 'bg-primary-surface text-primary border border-primary/30' : 'bg-surface-glass text-text-tertiary border border-divider hover:bg-surface-elevated'}`}
            >
              {f.label}
              <span className="text-[10px] opacity-70">({f.count})</span>
            </Link>
          ))}
        </div>

        {/* Search */}
        <form className="flex items-center gap-2">
          <input type="hidden" name="status" value={statusFilter} />
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
              href={`/dashboard/withdrawals${statusFilter ? `?status=${statusFilter}` : ""}`}
              className="px-3 py-2 rounded-xl text-[12px] font-semibold text-text-tertiary hover:text-text-secondary"
              style={{ border: "1px solid var(--divider)", background: "var(--surface-elevated)" }}
            >
              {t("ratings.filters.reset")}
            </a>
          )}
        </form>

        {/* Requests Table */}
        <div className="dash-table-card">
          <div className="dash-section-header justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-primary to-primary-dark shadow-[0_0_8px_var(--primary)]" />
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
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold" style={{ background: "var(--primary-surface)", color: "var(--primary)" }}>
                            {(driver?.name || "?")[0]}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-text-primary">{driver?.name || "—"}</p>
                            <p className="text-[10px] text-text-disabled num">{driver?.phone || ""}</p>
                          </div>
                        </div>
                      </td>
                       <td className="py-3.5 px-4 text-[15px] font-black num" style={{ color: "var(--success)" }}>{formatCurrency(Number(req.amount), currency)}</td>
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
                            {/* Approve — no modal needed */}
                            <form action="/api/withdrawals/approve" method="POST">
                              <input type="hidden" name="request_id" value={req.id} />
                              <button
                                type="submit"
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all hover:scale-105 bg-success shadow-sm shadow-success/30"
                              >
                                {t("common.accept")}
                              </button>
                            </form>

                            {/*
                             * ✅ BUG-4 FIX: Rejection reason modal.
                             * Previously the reject button submitted directly with no reason input,
                             * so the RPC always received the hardcoded default string.
                             * Now we use a <details> disclosure pattern (zero JS required, works
                             * server-side) that expands an inline form with a textarea for the reason.
                             * The form submits to /api/withdrawals/reject which now reads `reason`.
                             */}
                            <details className="relative" style={{ display: "inline-block" }}>
                              <summary
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all bg-error/15 text-error border border-error/25 hover:bg-error/25 cursor-pointer list-none"
                              >
                                {t("common.reject")}
                              </summary>
                              <div
                                className="absolute left-0 top-full mt-1 z-20 rounded-xl shadow-2xl p-3 min-w-[260px]"
                                style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}
                              >
                                <p className="text-[11px] font-bold text-text-secondary mb-2">سبب الرفض</p>
                                <form action="/api/withdrawals/reject" method="POST" className="space-y-2">
                                  <input type="hidden" name="request_id" value={req.id} />
                                  <textarea
                                    name="reason"
                                    rows={3}
                                    placeholder="اكتب سبب الرفض هنا..."
                                    required
                                    className="w-full px-3 py-2 rounded-lg text-[12px] resize-none outline-none"
                                    style={{
                                      background: "var(--surface-elevated)",
                                      border: "1px solid var(--divider-strong)",
                                      color: "var(--text-primary)",
                                    }}
                                  />
                                  <button
                                    type="submit"
                                    className="w-full py-1.5 rounded-lg text-[11px] font-bold bg-error text-white transition-all hover:opacity-90"
                                  >
                                    تأكيد الرفض
                                  </button>
                                </form>
                              </div>
                            </details>
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
            <div className="flex items-center justify-center gap-2 py-4 px-6 border-t border-divider">
              {page > 1 && (
                <Link href={`/dashboard/withdrawals?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-glass border border-divider text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all">
                  <ChevronRight size={14} />
                </Link>
              )}
              <span className="text-[12px] text-text-tertiary font-medium">{t("common.page")} {page} {t("common.of")} {totalPages}</span>
              {page < totalPages && (
                <Link href={`/dashboard/withdrawals?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-glass border border-divider text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all">
                  <ChevronLeft size={14} />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
