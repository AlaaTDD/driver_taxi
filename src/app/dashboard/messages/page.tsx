import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { MessageSquare, User, Clock, ChevronLeft, ChevronRight, Headphones, MapPin, ArrowLeftRight } from "lucide-react";

type TabType = "support" | "trip";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tab?: string; trip_id?: string }>;
}) {
  const params = await searchParams;
  const tab = (params.tab as TabType) || "support";
  const page = Number(params.page) || 1;
  const tripIdFilter = params.trip_id || "";
  const pageSize = 20;

  const t = await getTranslations();
  const supabase = createAdminClient();

  /* ── Stats ── */
  const [supportCountRes, tripMsgCountRes] = await Promise.all([
    supabase.from("support_messages").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }),
  ]);

  const tabs = [
    { key: "support", label: t("messages.tabs.support"), count: supportCountRes.count || 0, icon: Headphones, color: "var(--info)", colorRaw: "37,99,235" },
    { key: "trip", label: t("messages.tabs.trip"), count: tripMsgCountRes.count || 0, icon: MapPin, color: "var(--primary)", colorRaw: "217,119,6" },
  ];

  /* ── Support Messages ── */
  let supportMessages: any[] = [];
  let supportCount = 0;
  let supportTotalPages = 1;

  if (tab === "support") {
    const { data, count } = await supabase
      .from("support_messages")
      .select("*, users!support_messages_user_id_fkey(id, name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    supportMessages = data || [];
    supportCount = count || 0;
    supportTotalPages = Math.ceil(supportCount / pageSize);
  }

  /* ── Trip Messages ── */
  let tripMessages: any[] = [];
  let tripMsgCount = 0;
  let tripMsgTotalPages = 1;

  if (tab === "trip") {
    let tripQuery = supabase
      .from("messages")
      .select("id, trip_id, sender_id, receiver_id, message, is_read, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (tripIdFilter) {
      tripQuery = tripQuery.eq("trip_id", tripIdFilter);
    }

    const { data, count } = await tripQuery;
    tripMessages = data || [];
    tripMsgCount = count || 0;
    tripMsgTotalPages = Math.ceil(tripMsgCount / pageSize);

    // Get user names for all sender/receiver IDs
    const userIds = [...new Set(tripMessages.map((m) => [m.sender_id, m.receiver_id]).flat().filter(Boolean))];
    if (userIds.length) {
      const { data: users } = await supabase.from("users").select("id, name, role").in("id", userIds);
      const userMap = new Map((users || []).map((u) => [u.id, u]));
      tripMessages = tripMessages.map((m) => ({
        ...m,
        sender: userMap.get(m.sender_id),
        receiver: userMap.get(m.receiver_id),
      }));
    }
  }

  const totalPages = tab === "support" ? supportTotalPages : tripMsgTotalPages;

  const AVATAR_COLORS = [
    "linear-gradient(135deg, var(--info), var(--primary))",
    "linear-gradient(135deg, var(--primary), var(--primary-dark))",
    "linear-gradient(135deg, var(--success), var(--info))",
    "linear-gradient(135deg, var(--success), var(--success-light))",
    "linear-gradient(135deg, var(--warning), var(--error))",
  ];

  return (
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("messages.title")}</h1>
            <p className="text-sm text-text-secondary mt-1">{t("messages.subtitle")}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/5 border border-cyan-500/20 text-cyan-500">
              <MessageSquare size={11} />
              {(supportCountRes.count || 0) + (tripMsgCountRes.count || 0)} {t("messages.total")}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/dashboard/messages?tab=${t.key}`}
              id={`messages-tab-${t.key}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200"
              style={
                tab === t.key
                  ? { background: `rgba(${t.colorRaw},0.12)`, border: `1px solid rgba(${t.colorRaw},0.26)`, color: t.color, boxShadow: `0 4px 12px rgba(${t.colorRaw},0.12)` }
                  : { background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-tertiary)" }
              }
            >
              <t.icon size={14} />
              {t.label}
              {t.count > 0 && (
                <span
                  className="min-w-[20px] h-5 rounded-full text-[10px] font-black flex items-center justify-center px-1.5"
                  style={{
                    background: tab === t.key ? `rgba(${t.colorRaw},0.20)` : "var(--surface-glass)",
                    color: tab === t.key ? t.color : "var(--text-tertiary)",
                    border: tab === t.key ? `1px solid rgba(${t.colorRaw},0.28)` : "1px solid var(--divider)",
                  }}
                >
                  {t.count}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* ── SUPPORT MESSAGES TAB ── */}
        {tab === "support" && (
          <div className="space-y-3">
            {supportMessages.map((msg, index) => {
              const user = msg.users as unknown as { id: string; name: string } | null;
              const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];
              const initial = user?.name?.charAt(0) || "؟";
              return (
                <div
                  key={msg.id}
                  className="group relative dash-card overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: "0 0 30px rgba(6,182,212,0.04) inset" }} />
                  <div className="relative flex items-start gap-4 p-5">
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-[13px] border border-white/10" style={{ background: avatarBg, boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
                        {initial}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <User size={11} className="text-text-disabled" />
                          <span className="text-[13px] font-bold text-text-primary">{user?.name || t("messages.support.unknownUser")}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full" style={{ background: "var(--text-disabled)" }} />
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} className="text-text-disabled" />
                          <span className="text-[11px] text-text-tertiary">{formatDate(msg.created_at)}</span>
                        </div>
                      </div>
                      <p className="text-text-secondary text-[13px] leading-relaxed">{msg.message}</p>
                    </div>
                    <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity" style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.15)" }}>
                      <Headphones size={14} className="text-info" />
                    </div>
                  </div>
                </div>
              );
            })}
            {supportMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}>
                  <Headphones size={32} className="text-text-disabled opacity-40" />
                </div>
                <div className="text-center">
                  <p className="text-text-secondary font-semibold">{t("messages.support.noMessages")}</p>
                  <p className="text-text-tertiary text-sm mt-1">{t("messages.support.noMessagesDesc")}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TRIP MESSAGES TAB ── */}
        {tab === "trip" && (
          <>
            {/* Trip ID filter */}
            <form className="flex items-center gap-3">
              <input type="hidden" name="tab" value="trip" />
              <input
                name="trip_id"
                defaultValue={tripIdFilter}
                placeholder={t("messages.trip.searchPlaceholder")}
                className="flex-1 max-w-xs px-4 py-2.5 rounded-xl text-[13px] outline-none"
                style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
              />
              <button type="submit" className="btn btn-primary px-4 py-2.5 rounded-xl text-[13px] font-medium">{t("messages.trip.search")}</button>
              {tripIdFilter && (
                <Link href="/dashboard/messages?tab=trip" className="px-3 py-2.5 rounded-xl text-[12px] text-text-tertiary hover:text-text-secondary" style={{ border: "1px solid var(--divider)" }}>
                  {t("messages.trip.clear")}
                </Link>
              )}
            </form>

            <div className="dash-table-card">
              <div className="dash-section-header justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-[3px] h-5 rounded-full" style={{ background: "linear-gradient(to bottom, var(--primary-light), var(--primary))", boxShadow: "0 0 8px var(--primary-surface)" }} />
                  <h3 className="text-[13px] font-bold text-text-primary">{t("messages.trip.title")}</h3>
                  <span className="text-text-disabled text-[11px]">({tripMsgCount})</span>
                </div>
                {tripIdFilter && (
                  <span className="text-[11px] text-amber-400 px-2.5 py-1 rounded-lg" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    {t("messages.trip.filter")}: {tripIdFilter.substring(0, 8)}...
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="dash-table-head">
                      {[t("messages.trip.table.sender"), t("messages.trip.table.receiver"), t("messages.trip.table.message"), t("messages.trip.table.trip"), t("messages.trip.table.read"), t("messages.trip.table.date")].map((h) => (
                        <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tripMessages.map((msg) => {
                      const sender = msg.sender as { name: string; role: string } | undefined;
                      const receiver = msg.receiver as { name: string; role: string } | undefined;
                      return (
                        <tr key={msg.id} className="group/row dash-table-row">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: sender?.role === "driver" ? "var(--success-surface)" : "var(--info-surface)", color: sender?.role === "driver" ? "var(--success)" : "var(--info)" }}>
                                {(sender?.name || "?")[0]}
                              </div>
                              <div>
                                <p className="text-[12px] font-bold text-text-primary">{sender?.name || "—"}</p>
                                <p className="text-[10px] text-text-disabled">{sender?.role === "driver" ? t("messages.trip.driver") : t("messages.trip.user")}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: receiver?.role === "driver" ? "var(--success-surface)" : "var(--info-surface)", color: receiver?.role === "driver" ? "var(--success)" : "var(--info)" }}>
                                {(receiver?.name || "?")[0]}
                              </div>
                              <p className="text-[12px] text-text-secondary">{receiver?.name || "—"}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 max-w-[220px]">
                            <p className="text-[12px] text-text-secondary truncate">{msg.message}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <Link
                              href={`/dashboard/trips/${msg.trip_id}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-all hover:opacity-80"
                              style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}
                            >
                              <MapPin size={9} />
                              {msg.trip_id?.substring(0, 8)}...
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: msg.is_read ? "var(--success)" : "var(--error)", boxShadow: msg.is_read ? "0 0 6px var(--success-surface)" : "0 0 6px var(--error-surface)" }} />
                          </td>
                          <td className="py-3.5 px-4 text-text-tertiary text-[11px] whitespace-nowrap">{formatDate(msg.created_at)}</td>
                        </tr>
                      );
                    })}
                    {tripMessages.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-text-disabled">
                          <MapPin size={32} className="mx-auto mb-3 opacity-30" />
                          <p className="text-text-secondary font-semibold">{t("messages.trip.noMessages")}</p>
                          <p className="text-text-tertiary text-sm mt-1">{t("messages.trip.noMessagesDesc")}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <a
              href={`/dashboard/messages?tab=${tab}&page=${page - 1}${tripIdFilter ? `&trip_id=${tripIdFilter}` : ""}`}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${page <= 1 ? "pointer-events-none opacity-30" : "hover:bg-surface-elevated"}`}
              style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
            >
              <ChevronRight size={14} />
            </a>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`/dashboard/messages?tab=${tab}&page=${p}${tripIdFilter ? `&trip_id=${tripIdFilter}` : ""}`}
                className="w-9 h-9 rounded-xl text-[13px] font-bold flex items-center justify-center transition-all"
                style={
                  p === page
                    ? { background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "white", boxShadow: `0 4px 12px rgba(var(--primary-rgb),0.28)`, border: "1px solid var(--primary)" }
                    : { background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }
                }
              >
                {p}
              </a>
            ))}

            <a
              href={`/dashboard/messages?tab=${tab}&page=${page + 1}${tripIdFilter ? `&trip_id=${tripIdFilter}` : ""}`}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${page >= totalPages ? "pointer-events-none opacity-30" : "hover:bg-surface-elevated"}`}
              style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={14} />
            </a>
          </div>
        )}
      </div>
    </>
  );
}
