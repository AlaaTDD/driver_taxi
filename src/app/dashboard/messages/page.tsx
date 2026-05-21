import { createAdminClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  MessageSquare, User, Clock, ChevronLeft, ChevronRight,
  Headphones, MapPin, Ticket, Car, Hash, CheckCircle2,
  AlertCircle, Users,
} from "lucide-react";
import { ChatButton } from "./messages-client";

type TabType = "support" | "trip";

function formatRelative(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
}

function getInitials(name?: string) {
  if (!name) return "؟";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return parts[0][0];
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tab?: string; trip_id?: string; user_id?: string }>;
}) {
  const params = await searchParams;
  const tab = (params.tab as TabType) || "support";
  const page = Number(params.page) || 1;
  const tripIdFilter = params.trip_id || "";
  const userIdFilter = params.user_id || "";
  const pageSize = 20;

  const t = await getTranslations();
  const supabase = createAdminClient();

  /* ── Stats ── */
  const [supportCountRes, tripMsgCountRes, openTicketsRes] = await Promise.all([
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).then(r => r).catch(() => ({ count: 0 })),
    supabase.from("trip_conversations_view").select("trip_id", { count: "exact", head: true }).then(r => r).catch(() => ({ count: 0 })),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open").then(r => r).catch(() => ({ count: 0 })),
  ]);

  const totalTickets = supportCountRes.count || 0;
  const totalTrips = tripMsgCountRes.count || 0;
  const openTickets = openTicketsRes.count || 0;

  const tabs = [
    { key: "support", label: "تذاكر الدعم", count: totalTickets, icon: Headphones, color: "var(--info)" },
    { key: "trip", label: "محادثات الرحلات", count: totalTrips, icon: Car, color: "var(--warning)" },
  ];

  /* ── Support Tickets ── */
  let supportTickets: any[] = [];
  let supportCount = 0;
  let supportTotalPages = 1;

  if (tab === "support") {
    try {
      let query = supabase
        .from("support_tickets")
        .select("*, users!support_tickets_user_id_fkey(id, name, role)", { count: "exact" })
        .order("updated_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (userIdFilter && /^[0-9a-f-]{36}$/i.test(userIdFilter)) {
        query = query.eq("user_id", userIdFilter);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      supportTickets = data || [];
      supportCount = count || 0;
      supportTotalPages = Math.ceil(supportCount / pageSize);
    } catch (e) {
      console.error("Error fetching support tickets:", e);
    }
  }

  /* ── Trip Conversations ── */
  let tripConversations: any[] = [];
  let tripMsgCount = 0;
  let tripMsgTotalPages = 1;

  if (tab === "trip") {
    try {
      let query = supabase
        .from("trip_conversations_view")
        .select("*", { count: "exact" })
        .order("last_message_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (tripIdFilter) query = query.eq("trip_id", tripIdFilter);

      const { data, count, error } = await query;
      if (error) throw error;
      tripConversations = data || [];
      tripMsgCount = count || 0;
      tripMsgTotalPages = Math.ceil(tripMsgCount / pageSize);

      const userIds = [...new Set(tripConversations.flatMap((c) => [c.driver_id, c.passenger_id]).filter(Boolean))];
      if (userIds.length) {
        const { data: users } = await supabase.from("users").select("id, name, role").in("id", userIds);
        const userMap = new Map((users || []).map((u) => [u.id, u]));
        tripConversations = tripConversations.map((c) => ({
          ...c,
          driver: userMap.get(c.driver_id),
          passenger: userMap.get(c.passenger_id),
        }));
      }
    } catch (e) {
      console.error("Error fetching trip conversations:", e);
    }
  }

  const totalPages = tab === "support" ? supportTotalPages : tripMsgTotalPages;

  const AVATAR_GRADIENTS = [
    "linear-gradient(135deg,#6366f1,#8b5cf6)",
    "linear-gradient(135deg,#3b82f6,#2563eb)",
    "linear-gradient(135deg,#10b981,#059669)",
    "linear-gradient(135deg,#f59e0b,#d97706)",
    "linear-gradient(135deg,#ef4444,#dc2626)",
    "linear-gradient(135deg,#8b5cf6,#ec4899)",
  ];

  return (
    <>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">مركز الرسائل</h1>
            <p className="text-sm text-text-secondary mt-1">إدارة محادثات الدعم الفني وشات الرحلات في مكان واحد</p>
          </div>
          {/* Quick stats */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold" style={{ background: "var(--info-surface)", color: "var(--info)", border: "1px solid var(--info-surface)" }}>
              <Ticket size={13} />
              <span>{totalTickets} تذكرة</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold" style={{ background: "var(--success-surface)", color: "var(--success)", border: "1px solid var(--success-surface)" }}>
              <CheckCircle2 size={13} />
              <span>{openTickets} مفتوحة</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold" style={{ background: "var(--warning-surface)", color: "var(--warning)", border: "1px solid var(--warning-surface)" }}>
              <Car size={13} />
              <span>{totalTrips} رحلة</span>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 p-1.5 rounded-2xl w-fit" style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}>
          {tabs.map((tabItem) => {
            const isActive = tab === tabItem.key;
            return (
              <Link
                key={tabItem.key}
                href={`/dashboard/messages?tab=${tabItem.key}${userIdFilter ? `&user_id=${userIdFilter}` : ""}`}
                id={`messages-tab-${tabItem.key}`}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200"
                style={isActive ? {
                  background: "var(--surface-elevated)",
                  color: tabItem.color,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  border: "1px solid var(--divider)",
                } : {
                  color: "var(--text-tertiary)",
                }}
              >
                <tabItem.icon size={15} />
                {tabItem.label}
                <span
                  className="min-w-[22px] h-5 rounded-full text-[10px] font-black flex items-center justify-center px-1.5"
                  style={isActive ? {
                    background: tabItem.color,
                    color: "white",
                  } : {
                    background: "var(--surface)",
                    color: "var(--text-tertiary)",
                    border: "1px solid var(--divider)",
                  }}
                >
                  {tabItem.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── SUPPORT TICKETS ── */}
        {tab === "support" && (
          <div className="space-y-2">
            {supportTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}>
                  <Ticket size={32} className="text-text-disabled opacity-40" />
                </div>
                <div className="text-center">
                  <p className="text-text-primary font-bold">لا توجد تذاكر دعم</p>
                  <p className="text-text-tertiary text-sm mt-1">يُرجى تشغيل ملف SQL لتفعيل نظام التذاكر إذا لم تفعل ذلك بعد.</p>
                </div>
              </div>
            ) : (
              supportTickets.map((ticket, index) => {
                const user = ticket.users as { id: string; name: string; role: string } | null;
                const isOpen = ticket.status === "open";
                const avatarBg = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
                const initial = getInitials(user?.name);
                return (
                  <div
                    key={ticket.id}
                    className="group relative overflow-hidden transition-all duration-200"
                    style={{
                      background: "var(--surface-elevated)",
                      border: "1px solid var(--divider)",
                      borderRadius: "16px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  >
                    {/* Status stripe on left */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 rounded-r-full"
                      style={{ background: isOpen ? "var(--success)" : "var(--text-disabled)" }}
                    />

                    <div className="flex items-center gap-4 px-5 py-4 pr-6">
                      {/* Avatar */}
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-[15px] shrink-0"
                        style={{ background: avatarBg, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                      >
                        {initial}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-black text-text-primary">{user?.name || "مستخدم"}</span>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              background: isOpen ? "var(--success-surface)" : "var(--surface-glass)",
                              color: isOpen ? "var(--success)" : "var(--text-tertiary)",
                              border: `1px solid ${isOpen ? "var(--success-surface)" : "var(--divider)"}`,
                            }}
                          >
                            {isOpen ? "● مفتوحة" : "○ مغلقة"}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ background: "var(--surface-glass)", color: "var(--text-tertiary)", border: "1px solid var(--divider)" }}
                          >
                            {user?.role === "driver" ? "سائق" : "مستخدم"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <div className="flex items-center gap-1 text-[11px] text-text-tertiary font-mono">
                            <Hash size={10} />
                            {ticket.id.substring(0, 16)}...
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
                            <Clock size={10} />
                            {formatRelative(ticket.updated_at)}
                          </div>
                          {ticket.subject && (
                            <div className="flex items-center gap-1 text-[11px] text-text-secondary font-medium">
                              <Ticket size={10} />
                              {ticket.subject}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="shrink-0">
                        <ChatButton props={{
                          type: "support",
                          id: ticket.id,
                          targetUserId: ticket.user_id,
                          targetUserName: user?.name,
                          ticketStatus: ticket.status,
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── TRIP CONVERSATIONS ── */}
        {tab === "trip" && (
          <div className="space-y-4">
            {/* Search */}
            <form className="flex items-center gap-3">
              <input type="hidden" name="tab" value="trip" />
              <div
                className="flex-1 max-w-sm flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px]"
                style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}
              >
                <MapPin size={14} className="text-text-disabled shrink-0" />
                <input
                  name="trip_id"
                  defaultValue={tripIdFilter}
                  placeholder="ابحث برقم الرحلة..."
                  className="bg-transparent outline-none w-full text-text-primary placeholder:text-text-disabled text-[13px]"
                />
              </div>
              <button type="submit" className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg,var(--primary),var(--primary-dark))" }}>
                بحث
              </button>
              {tripIdFilter && (
                <Link href="/dashboard/messages?tab=trip" className="px-3 py-2.5 rounded-xl text-[12px] text-text-tertiary hover:text-text-secondary transition-colors" style={{ border: "1px solid var(--divider)" }}>
                  مسح
                </Link>
              )}
            </form>

            {/* Conversations List */}
            {tripConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}>
                  <Car size={32} className="text-text-disabled opacity-40" />
                </div>
                <div className="text-center">
                  <p className="text-text-primary font-bold">لا توجد محادثات رحلات</p>
                  <p className="text-text-tertiary text-sm mt-1">يُرجى تشغيل ملف SQL لتفعيل عرض المحادثات.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {tripConversations.map((conv, index) => {
                  const driver = conv.driver as { name: string; role: string } | undefined;
                  const passenger = conv.passenger as { name: string; role: string } | undefined;
                  const hasUnread = conv.has_unread === 1;
                  return (
                    <div
                      key={conv.trip_id}
                      className="group relative overflow-hidden transition-all duration-200"
                      style={{
                        background: "var(--surface-elevated)",
                        border: `1px solid ${hasUnread ? "var(--primary)" : "var(--divider)"}`,
                        borderRadius: "16px",
                        boxShadow: hasUnread
                          ? "0 2px 16px rgba(var(--primary-rgb),0.12)"
                          : "0 2px 8px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div className="flex items-center gap-4 px-5 py-4">
                        {/* Participants avatars stacked */}
                        <div className="relative w-12 h-11 shrink-0">
                          <div
                            className="absolute top-0 right-0 w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-[11px]"
                            style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
                          >
                            {getInitials(driver?.name)}
                          </div>
                          <div
                            className="absolute bottom-0 left-0 w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-[11px]"
                            style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)", boxShadow: "0 2px 6px rgba(0,0,0,0.2)", border: "2px solid var(--surface-elevated)" }}
                          >
                            {getInitials(passenger?.name)}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-black text-success">{driver?.name || "سائق مجهول"}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "var(--success-surface)", color: "var(--success)" }}>سائق</span>
                            </div>
                            <span className="text-text-disabled text-[11px]">↔</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-bold text-info">{passenger?.name || "راكب مجهول"}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "var(--info-surface)", color: "var(--info)" }}>راكب</span>
                            </div>
                            {hasUnread && (
                              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <p className="text-[12px] text-text-secondary truncate max-w-[200px]">{conv.last_message || "—"}</p>
                            <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                              <MessageSquare size={9} />
                              {conv.message_count} رسائل
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-text-disabled">
                              <Clock size={9} />
                              {formatRelative(conv.last_message_at)}
                            </div>
                          </div>
                        </div>

                        {/* Trip link + Chat Button */}
                        <div className="shrink-0 flex items-center gap-2">
                          <Link
                            href={`/dashboard/trips/${conv.trip_id}`}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all hover:opacity-80"
                            style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}
                          >
                            <MapPin size={9} />
                            {conv.trip_id?.substring(0, 8)}
                          </Link>
                          <ChatButton props={{
                            type: "trip",
                            id: conv.trip_id,
                            targetUserId: conv.driver_id,
                            targetUserName: driver?.name,
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <a
              href={`/dashboard/messages?tab=${tab}&page=${page - 1}${tripIdFilter ? `&trip_id=${tripIdFilter}` : ""}${userIdFilter ? `&user_id=${userIdFilter}` : ""}`}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${page <= 1 ? "pointer-events-none opacity-30" : "hover:scale-105"}`}
              style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
            >
              <ChevronRight size={14} />
            </a>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`/dashboard/messages?tab=${tab}&page=${p}${tripIdFilter ? `&trip_id=${tripIdFilter}` : ""}${userIdFilter ? `&user_id=${userIdFilter}` : ""}`}
                className="w-9 h-9 rounded-xl text-[13px] font-bold flex items-center justify-center transition-all hover:scale-105"
                style={p === page ? {
                  background: "linear-gradient(135deg,var(--primary),var(--primary-dark))",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(var(--primary-rgb),0.3)",
                } : {
                  background: "var(--surface-elevated)",
                  border: "1px solid var(--divider)",
                  color: "var(--text-secondary)",
                }}
              >
                {p}
              </a>
            ))}
            <a
              href={`/dashboard/messages?tab=${tab}&page=${page + 1}${tripIdFilter ? `&trip_id=${tripIdFilter}` : ""}${userIdFilter ? `&user_id=${userIdFilter}` : ""}`}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${page >= totalPages ? "pointer-events-none opacity-30" : "hover:scale-105"}`}
              style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={14} />
            </a>
          </div>
        )}
      </div>
    </>
  );
}
