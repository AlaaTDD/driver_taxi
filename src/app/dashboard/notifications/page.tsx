import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/badge";
import NotificationsClient from "./notifications-client";
import { getTranslations } from "next-intl/server";
import { Bell, Eye, Clock, User } from "lucide-react";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const typeFilter = params.type || "";
  const searchQuery = params.search || "";
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
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,message.ilike.%${searchQuery}%`);
  }

  const { data: notifications, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  const t = await getTranslations();
  
  let unreadQuery = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);
    
  if (typeFilter) {
    unreadQuery = unreadQuery.eq("type", typeFilter);
  }
  
  const { count: unreadTotal } = await unreadQuery;
  const unreadCount = unreadTotal || 0;

  const typeLabels: Record<string, string> = {
    trip_offer: t("notifications.types.tripOffer"),
    offer_accepted: t("notifications.types.offerAccepted"),
    driver_arriving: t("notifications.types.driverArriving"),
    trip_started: t("notifications.types.tripStarted"),
    trip_completed: t("notifications.types.tripCompleted"),
    trip_cancelled: t("notifications.types.tripCancelled"),
    no_drivers: t("notifications.types.noDrivers"),
    new_message: t("notifications.types.newMessage"),
    account_verified: t("notifications.types.accountVerified"),
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
    <>
      <div className="space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("notifications.title")}</h1>
            <p className="text-sm text-text-secondary mt-1">{t("notifications.subtitle")}</p>
          </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold variant-error">
              <span className="w-1.5 h-1.5 rounded-full bg-error shadow-[0_0_5px_rgba(var(--error-rgb),0.6)]" />
              {unreadCount} {t("notifications.unread")}
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold variant-info">
            <Bell size={11} />
            {count || 0} {t("notifications.total")}
          </div>
        </div>
      </div>

        {/* Search */}
        <form className="flex items-center gap-2 mt-4">
          <input type="hidden" name="type" value={typeFilter} />
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
              href={`/dashboard/notifications${typeFilter ? `?type=${typeFilter}` : ""}`}
              className="px-3 py-2 rounded-xl text-[12px] font-semibold text-text-tertiary hover:text-text-secondary"
              style={{ border: "1px solid var(--divider)", background: "var(--surface-elevated)" }}
            >
              {t("ratings.filters.reset")}
            </a>
          )}
        </form>

      
      <NotificationsClient
        currentPage={page}
        totalPages={totalPages}
        currentType={typeFilter}
      />

      
      <div className="space-y-3">
        {(notifications || []).map((notif) => {
          const user = notif.users as unknown as { name: string } | null;
          const isUnread = !notif.is_read;

          return (
            <div
              key={notif.id}
              className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${isUnread ? "notif-card-unread" : "notif-card"}`}
            >
              
              {isUnread && (
                <div className="absolute right-0 top-0 bottom-0 w-[3px] rounded-l-full notif-unread-bar" />
              )}

              
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: "var(--shadow-sm) inset" }} />

              <div className="relative p-5">
                <div className="flex items-start gap-4">
                  
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5 ${isUnread ? "variant-info" : "bg-[var(--surface-glass)] border border-[var(--divider)]"}`}>
                    <Bell size={16} className={isUnread ? "text-[var(--info)]" : "text-text-tertiary"} />
                  </div>

                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <Badge variant={typeBadgeVariants[notif.type] || "default"} dot>
                        {typeLabels[notif.type] || notif.type}
                      </Badge>
                      {isUnread && (
                        <span
                          className="relative w-2 h-2 rounded-full"
                          style={{ background: "var(--info)", boxShadow: "0 0 6px var(--info-surface)" }}
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

                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <User size={11} className="text-text-disabled" />
                        <span className="text-[11px] text-text-tertiary">{user?.name || t("notifications.unknownUser")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-text-disabled" />
                        <span className="text-[11px] text-text-tertiary">{formatDate(notif.created_at)}</span>
                      </div>
                      {!isUnread && (
                        <div className="flex items-center gap-1">
                          <Eye size={11} className="text-success opacity-60" />
                          <span className="text-[10px] text-success opacity-60">{t("notifications.read")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        
        {(!notifications || notifications.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
            >
              <Bell size={32} className="text-text-disabled opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-text-secondary font-semibold">{t("notifications.noNotifications")}</p>
              <p className="text-text-tertiary text-sm mt-1">{t("notifications.noNotificationsDesc")}</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
