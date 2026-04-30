import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { DashboardShell } from "@/components/dashboard-shell";
import { getTranslations } from "next-intl/server";
import { MessageSquare, User, Clock, ChevronLeft, ChevronRight } from "lucide-react";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; trip_id?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = 20;

  const t = await getTranslations();
  const supabase = createAdminClient();

  const query = supabase
    .from("support_messages")
    .select("*, users!support_messages_user_id_fkey(id, name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data: messages, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  const AVATAR_COLORS = [
    "linear-gradient(135deg, #3B82F6, #6366F1)",
    "linear-gradient(135deg, #8B5CF6, #EC4899)",
    "linear-gradient(135deg, #06B6D4, #3B82F6)",
    "linear-gradient(135deg, #10B981, #06B6D4)",
    "linear-gradient(135deg, #F59E0B, #EF4444)",
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">

        {/* ===== PAGE HEADER ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("messages.title")}</h1>
            <p className="text-sm text-text-secondary mt-1">{t("messages.subtitle")}</p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/5 border border-cyan-500/20 text-cyan-500">
            <MessageSquare size={11} />
            {count || 0} {t("messages.title")}
          </div>
        </div>

      {/* ===== MESSAGES LIST ===== */}
      <div className="space-y-3">
        {(messages || []).map((msg, index) => {
          const user = msg.users as unknown as { id: string; name: string } | null;
          const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];
          const initial = user?.name?.charAt(0) || "؟";

          return (
            <div
              key={msg.id}
              className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
                border: "1px solid rgba(255,255,255,0.04)",
                boxShadow: "0 1px 6px rgba(0,0,0,0.2)",
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: "0 0 30px rgba(6,182,212,0.04) inset" }}
              />

              {/* Top accent */}
              <div
                className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(to left, transparent, rgba(6,182,212,0.4), transparent)" }}
              />

              <div className="relative flex items-start gap-4 p-5">
                {/* Avatar */}
                <div className="shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-[13px] border border-white/10"
                    style={{ background: avatarBg, boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}
                  >
                    {initial}
                  </div>
                </div>

                {/* Message content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <User size={11} className="text-text-disabled" />
                      <span className="text-[13px] font-bold text-text-primary">
                        {user?.name || "مستخدم غير معروف"}
                      </span>
                    </div>
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ background: "var(--text-disabled)" }}
                    />
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} className="text-text-disabled" />
                      <span className="text-[11px] text-text-tertiary">{formatDate(msg.created_at)}</span>
                    </div>
                  </div>

                  <p className="text-text-secondary text-[13px] leading-relaxed">
                    {msg.message}
                  </p>
                </div>

                {/* Message bubble decoration */}
                <div
                  className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity"
                  style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.15)" }}
                >
                  <MessageSquare size={14} className="text-info" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {(!messages || messages.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
            >
              <MessageSquare size={32} className="text-text-disabled opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-text-secondary font-semibold">لا توجد رسائل</p>
              <p className="text-text-tertiary text-sm mt-1">ستظهر رسائل الدعم هنا</p>
            </div>
          </div>
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <a
            href={`/dashboard/messages?page=${page - 1}`}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${page <= 1 ? "pointer-events-none opacity-30" : "hover:bg-surface-elevated"}`}
            style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
          >
            <ChevronRight size={14} />
          </a>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/dashboard/messages?page=${p}`}
              className="w-9 h-9 rounded-xl text-[13px] font-bold flex items-center justify-center transition-all"
              style={
                p === page
                  ? { background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "white", boxShadow: "0 4px 12px rgba(59,130,246,0.3)", border: "1px solid rgba(59,130,246,0.3)" }
                  : { background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }
              }
            >
              {p}
            </a>
          ))}

          <a
            href={`/dashboard/messages?page=${page + 1}`}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${page >= totalPages ? "pointer-events-none opacity-30" : "hover:bg-surface-elevated"}`}
            style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={14} />
          </a>
        </div>
      )}
      </div>
    </DashboardShell>
  );
}
