import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/badge";
import NotificationsClient from "./notifications-client";

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

  const typeBadgeVariants: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
    trip_offer: "info",
    offer_accepted: "success",
    driver_arriving: "info",
    trip_started: "info",
    trip_completed: "success",
    trip_cancelled: "error",
    no_drivers: "warning",
    new_message: "default",
    account_verified: "success",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">الإشعارات</h1>
        <p className="text-text-secondary text-[13px] mt-0.5">عرض وإدارة إشعارات النظام</p>
      </div>

      <NotificationsClient
        currentPage={page}
        totalPages={totalPages}
        currentType={typeFilter}
      />

      {/* Notifications List */}
      <div className="space-y-3">
        {(notifications || []).map((notif) => {
          const user = notif.users as unknown as { name: string } | null;
          return (
            <div
              key={notif.id}
              className={`bg-surface/80 backdrop-blur-sm rounded-xl border border-divider/60 p-4 hover:border-primary/20 transition-colors ${
                !notif.is_read ? "border-primary/30 bg-primary/5" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={typeBadgeVariants[notif.type] || "default"}>
                      {typeLabels[notif.type] || notif.type}
                    </Badge>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="text-text-primary text-[13px] font-medium">
                    {notif.title}
                  </div>
                  <div className="text-text-secondary text-[12px] mt-1">
                    {notif.message}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-text-disabled">
                    <span>المستخدم: {user?.name || "—"}</span>
                    <span>{formatDate(notif.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {(!notifications || notifications.length === 0) && (
          <div className="text-center py-12 text-text-disabled">لا توجد إشعارات</div>
        )}
      </div>
    </div>
  );
}
