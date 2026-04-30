import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/badge";
import { DashboardShell } from "@/components/dashboard-shell";
import NotificationsClient from "./notifications-client";
import { getTranslations } from "next-intl/server";
import { Bell, Eye, Clock, User } from "lucide-react";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const typeFilter = params.type || "";
  const pageSize = 10;

  const supabase = createAdminClient();

  let query = supabase
    .from("notifications")
    .select("*, users(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (typeFilter) {
    query = query.eq("type", typeFilter);
  }

  const { data: notifications, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  const t = await getTranslations();
  const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

  const typeLabels: Record<string, string> = {
    trip_offer: "عرض رحلة",
    offer_accepted: "قبول عرض",
    driver_arriving: "سائق قادم",
    trip_started: "بدء الرحلة",
    trip_completed: "رحلة مكتملة",
    trip_cancelled: "رحلة ملغية",
    no_drivers: "لا سائقين",
    new_message: "رسالة جديدة",
    account_verified: "حساب معتمد",
  };

  const typeBadgeVariants: Record<string, "success" | "warning" | "error" | "info" | "default" | "purple" | "cyan"> = {
    trip_offer: "info",
    offer_accepted: "success",
    driver_arriving: "cyan",
    trip_started: "info",
    trip_completed: "success",
    trip_cancelled: "error",
    no_drivers: "warning",
    new_message: "purple",
    account_verified: "success",
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("notifications.title")}</h1>
            <p className="text-sm text-text-secondary mt-1">{t("notifications.subtitle")}</p>
          </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-error"
                style={{ boxShadow: "0 0 5px rgba(239,68,68,0.6)" }}
              />
              {unreadCount} غير مقروء
            </div>
          )}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#93C5FD" }}
          >
            <Bell size={11} />
            {count || 0} إشعار
          </div>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <NotificationsClient
        currentPage={page}
        totalPages={totalPages}
        currentType={typeFilter}
      />

      {/* ===== NOTIFICATIONS LIST ===== */}
      <div className="space-y-3">
        {(notifications || []).map((notif) => {
          const user = notif.users as unknown as { name: string } | null;
          const isUnread = !notif.is_read;

          return (
            <div
              key={notif.id}
              className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: isUnread
                  ? "linear-gradient(145deg, var(--surface-glass) 0%, var(--bg-secondary),0.9) 100%)"
                  : "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
                border: isUnread
                  ? "1px solid rgba(59,130,246,0.2)"
                  : "1px solid rgba(255,255,255,0.04)",
                boxShadow: isUnread
                  ? "0 2px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(59,130,246,0.08)"
                  : "0 1px 6px rgba(0,0,0,0.2)",
              }}
            >
              {/* Unread left bar */}
              {isUnread && (
                <div
                  className="absolute right-0 top-0 bottom-0 w-[3px] rounded-l-full"
                  style={{
                    background: "linear-gradient(to bottom, #3B82F6, #8B5CF6)",
                    boxShadow: "0 0 8px rgba(59,130,246,0.5)",
                  }}
                />
              )}

              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: "0 0 30px rgba(59,130,246,0.04) inset" }}
              />

              <div className="relative p-5">
                <div className="flex items-start gap-4">
                  {/* Notification icon */}
                  <div
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5"
                    style={{
                      background: isUnread ? "rgba(59,130,246,0.12)" : "var(--surface-glass)",
                      border: `1px solid ${isUnread ? "rgba(59,130,246,0.2)" : "var(--divider)"}`,
                    }}
                  >
                    <Bell
                      size={16}
                      style={{ color: isUnread ? "#60A5FA" : "var(--text-tertiary)" }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <Badge variant={typeBadgeVariants[notif.type] || "default"} dot>
                        {typeLabels[notif.type] || notif.type}
                      </Badge>
                      {isUnread && (
                        <span
                          className="relative w-2 h-2 rounded-full"
                          style={{ background: "#3B82F6", boxShadow: "0 0 6px rgba(59,130,246,0.6)" }}
                        >
                          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
                        </span>
                      )}
                    </div>

                    <h4
                      className="text-[14px] font-bold leading-snug mb-1"
                      style={{ color: isUnread ? "var(--text-primary)" : "var(--text-secondary)" }}
                    >
                      {notif.title}
                    </h4>

                    <p className="text-text-tertiary text-[12px] leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <User size={11} className="text-text-disabled" />
                        <span className="text-[11px] text-text-tertiary">{user?.name || "غير محدد"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-text-disabled" />
                        <span className="text-[11px] text-text-tertiary">{formatDate(notif.created_at)}</span>
                      </div>
                      {!isUnread && (
                        <div className="flex items-center gap-1">
                          <Eye size={11} className="text-success opacity-60" />
                          <span className="text-[10px] text-success opacity-60">مقروء</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {(!notifications || notifications.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
            >
              <Bell size={32} className="text-text-disabled opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-text-secondary font-semibold">لا توجد إشعارات</p>
              <p className="text-text-tertiary text-sm mt-1">ستظهر الإشعارات الجديدة هنا</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </DashboardShell>
  );
}
