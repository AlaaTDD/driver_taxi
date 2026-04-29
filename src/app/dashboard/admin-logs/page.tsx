import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Shield, Clock, User, Database, FileText } from "lucide-react";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; admin_id?: string; action?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const adminFilter = params.admin_id || "";
  const actionFilter = params.action || "";
  const pageSize = 20;

  const supabase = createAdminClient();

  // Get list of admins for filter
  const { data: admins } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_admin", true);

  let query = supabase
    .from("admin_logs")
    .select("*, users(name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (adminFilter) {
    query = query.eq("admin_id", adminFilter);
  }

  if (actionFilter) {
    query = query.eq("action", actionFilter);
  }

  const { data: logs, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  const actionLabels: Record<string, { label: string; color: string; bg: string }> = {
    create: { label: "إنشاء", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
    update: { label: "تعديل", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
    delete: { label: "حذف", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
    verify: { label: "اعتماد", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
    revoke: { label: "إلغاء اعتماد", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    block: { label: "حظر", color: "#EC4899", bg: "rgba(236,72,153,0.1)" },
    unblock: { label: "فك حظر", color: "#06B6D4", bg: "rgba(6,182,212,0.1)" },
    send_notification: { label: "إرسال إشعار", color: "#6366F1", bg: "rgba(99,102,241,0.1)" },
  };

  const tableLabels: Record<string, string> = {
    users: "المستخدمين",
    drivers_profile: "ملف السائق",
    trips: "الرحلات",
    complaints: "الشكاوي",
    coupons: "الكوبونات",
    vehicle_types: "أنواع المركبات",
    notifications: "الإشعارات",
    support_messages: "رسائل الدعم",
    ratings: "التقييمات",
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">نظام</span>
          <span className="w-1 h-1 rounded-full bg-amber-500/60" />
          <span className="text-[11px] text-text-disabled">المراقبة</span>
        </div>
        <h1 className="page-title">سجل نشاط الأدمن</h1>
        <p className="page-subtitle">تتبع كل التغييرات والإجراءات التي تمت بواسطة المشرفين</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي السجلات", value: count || 0, icon: FileText, color: "#3B82F6" },
          { label: "المشرفين النشطين", value: (admins || []).length, icon: User, color: "#10B981" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4"
            style={{
              background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-[11px] text-text-tertiary">{stat.label}</p>
                <p className="text-[18px] font-black text-text-primary">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <select
          name="admin_id"
          defaultValue={adminFilter}
          className="px-4 py-2.5 rounded-xl text-[13px] outline-none"
          style={{
            background: "rgba(15,30,53,0.6)",
            border: "1px solid var(--divider)",
            color: "var(--text-primary)",
          }}
          onChange={(e) => {
            const url = new URL(window.location.href);
            if (e.target.value) url.searchParams.set("admin_id", e.target.value);
            else url.searchParams.delete("admin_id");
            window.location.href = url.toString();
          }}
        >
          <option value="">كل المشرفين</option>
          {(admins || []).map((admin) => (
            <option key={admin.id} value={admin.id}>
              {admin.name || admin.id.slice(0, 8)}
            </option>
          ))}
        </select>

        <select
          name="action"
          defaultValue={actionFilter}
          className="px-4 py-2.5 rounded-xl text-[13px] outline-none"
          style={{
            background: "rgba(15,30,53,0.6)",
            border: "1px solid var(--divider)",
            color: "var(--text-primary)",
          }}
          onChange={(e) => {
            const url = new URL(window.location.href);
            if (e.target.value) url.searchParams.set("action", e.target.value);
            else url.searchParams.delete("action");
            window.location.href = url.toString();
          }}
        >
          <option value="">كل الإجراءات</option>
          {Object.entries(actionLabels).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </form>

      {/* Logs Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--divider)" }}>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                  الإجراء
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                  الجدول
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                  الأدمن
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                  IP
                </th>
              </tr>
            </thead>
            <tbody>
              {(logs || []).map((log) => {
                const action = actionLabels[log.action] || {
                  label: log.action,
                  color: "var(--text-secondary)",
                  bg: "rgba(15,30,53,0.5)",
                };
                const admin = log.users as unknown as { name: string; email: string } | null;

                return (
                  <tr
                    key={log.id}
                    className="group hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: "1px solid var(--divider)" }}
                  >
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                        style={{
                          background: action.bg,
                          color: action.color,
                        }}
                      >
                        <Shield size={11} />
                        {action.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-2 text-[13px] text-text-secondary">
                        <Database size={13} className="text-text-disabled" />
                        {tableLabels[log.table_name] || log.table_name}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold"
                          style={{ background: "rgba(139,92,246,0.15)", color: "#8B5CF6" }}
                        >
                          {(admin?.name || "?")[0]}
                        </div>
                        <div>
                          <p className="text-[13px] text-text-primary font-medium">
                            {admin?.name || "غير معروف"}
                          </p>
                          <p className="text-[10px] text-text-disabled">{admin?.email || log.admin_id?.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-[12px] text-text-tertiary">
                        <Clock size={12} />
                        {formatDate(log.created_at)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] text-text-disabled font-mono">
                        {log.ip_address || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {(!logs || logs.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(15,30,53,0.8)", border: "1px solid var(--divider)" }}
            >
              <Shield size={28} className="text-text-disabled opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-text-secondary font-semibold">لا توجد سجلات</p>
              <p className="text-text-tertiary text-sm mt-1">ستظهر الإجراءات هنا عند تنفيذها</p>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderTop: "1px solid var(--divider)" }}
          >
            <div className="text-[11px] text-text-tertiary">
              صفحة {page} من {totalPages}
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${adminFilter ? `&admin_id=${adminFilter}` : ""}${actionFilter ? `&action=${actionFilter}` : ""}`}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-text-secondary hover:text-text-primary transition-colors"
                  style={{ background: "rgba(15,30,53,0.6)", border: "1px solid var(--divider)" }}
                >
                  السابق
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`?page=${page + 1}${adminFilter ? `&admin_id=${adminFilter}` : ""}${actionFilter ? `&action=${actionFilter}` : ""}`}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-text-secondary hover:text-text-primary transition-colors"
                  style={{ background: "rgba(15,30,53,0.6)", border: "1px solid var(--divider)" }}
                >
                  التالي
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
