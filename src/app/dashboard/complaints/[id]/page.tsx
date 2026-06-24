import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ComplaintDetailClient from "./complaint-detail-client";
import {
  MessageSquareWarning, ArrowRight, Car, User, Phone, Mail,
  MapPin, DollarSign, Calendar, Clock, Link2, Route, CheckCircle2,
  AlertTriangle, Loader, ShieldCheck, Flag, Lock,
} from "lucide-react";
import Link from "next/link";
import { getAppCurrency } from "@/lib/currency";

interface ThreadMessage {
  id: string;
  senderType: "user" | "admin";
  message: string;
  createdAt: string | null;
  isOriginal?: boolean;
}

function buildThread(
  description: string,
  createdAt: string,
  adminReply: string | null,
  adminNotes: string | null,
  repliedAt: string | null,
): ThreadMessage[] {
  const thread: ThreadMessage[] = [];

  thread.push({
    id: "original",
    senderType: "user",
    message: description,
    createdAt,
    isOriginal: true,
  });

  if (adminNotes) {
    try {
      const parsed = JSON.parse(adminNotes);
      if (Array.isArray(parsed)) {
        for (const msg of parsed) {
          thread.push({
            id: msg.id || crypto.randomUUID(),
            senderType: msg.sender_type || "admin",
            message: msg.message || "",
            createdAt: msg.created_at || null,
          });
        }
      }
    } catch {
      // Legacy plain-text — skip
    }
  }

  const hasAdminInNotes = thread.some((m) => m.senderType === "admin");
  if (adminReply && !hasAdminInNotes) {
    thread.push({
      id: "legacy-admin",
      senderType: "admin",
      message: adminReply,
      createdAt: repliedAt || null,
    });
  }

  thread.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });

  return thread;
}

function getCairoDateString(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", { timeZone: "Africa/Cairo" });
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ar-EG", {
      timeZone: "Africa/Cairo",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch { return ""; }
}

function formatDayLabel(iso: string | null) {
  if (!iso) return "";
  try {
    const dateStr = getCairoDateString(iso);
    const todayStr = getCairoDateString(new Date());

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getCairoDateString(yesterday);

    if (dateStr === todayStr) return "اليوم";
    if (dateStr === yesterdayStr) return "أمس";

    return new Date(iso).toLocaleDateString("ar-EG", {
      timeZone: "Africa/Cairo",
      day: "numeric",
      month: "long",
    });
  } catch { return ""; }
}

function isSameDay(a: string | null, b: string | null) {
  if (!a || !b) return false;
  return getCairoDateString(a) === getCairoDateString(b);
}

// ── Conversation Panel ───────────────────────────────────────────────────────
function ConversationPanel({
  messages, adminName, complaintId, currentStatus,
}: {
  messages: ThreadMessage[];
  adminName: string | null;
  complaintId: string;
  currentStatus: string;
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl"
      style={{
        background: "var(--surface-glass)",
        border: "1px solid var(--divider)",
        height: "100%",
        minHeight: "500px",
      }}
    >
      {/* Chat header */}
      <div
        className="flex items-center gap-3 px-5 py-4 shrink-0"
        style={{
          background: "var(--surface-elevated)",
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
        >
          <MessageSquareWarning size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-black text-text-primary">سجل المحادثة</p>
          <p className="text-[11px] text-text-disabled">{messages.length} رسائل</p>
        </div>
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: "var(--success)", boxShadow: "0 0 6px var(--success)" }}
        />
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4 space-y-1"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(var(--primary-rgb),0.03) 0%, transparent 60%),
                            radial-gradient(circle at 80% 20%, rgba(var(--info-rgb),0.03) 0%, transparent 50%)`,
        }}
      >
        {messages.map((msg, i) => {
          const isAdmin = msg.senderType === "admin";
          const isOriginal = msg.isOriginal;
          const showDateSep = i === 0 || !isSameDay(msg.createdAt, messages[i - 1].createdAt);
          const showAvatar = i === 0 || messages[i - 1].senderType !== msg.senderType || showDateSep;
          const timeStr = formatTime(msg.createdAt);

          return (
            <div key={msg.id}>
              {/* Date separator */}
              {showDateSep && (
                <div className="flex justify-center py-3 w-full" dir="rtl">
                  <span
                    className="text-[10.5px] font-bold px-3.5 py-1.5 rounded-full"
                    style={{
                      background: "var(--surface-elevated)",
                      color: "var(--text-tertiary)",
                      border: "1px solid var(--divider)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                  >
                    {formatDayLabel(msg.createdAt)}
                  </span>
                </div>
              )}

              {/* Original complaint special card */}
              {isOriginal ? (
                <div className="mb-5 mt-2">
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      border: "1.5px solid rgba(var(--warning-rgb),0.35)",
                      background: "rgba(var(--warning-rgb),0.05)",
                    }}
                  >
                    <div
                      className="flex items-center gap-2 px-4 py-3"
                      style={{
                        background: "rgba(var(--warning-rgb),0.1)",
                        borderBottom: "1px solid rgba(var(--warning-rgb),0.2)",
                      }}
                    >
                      <Flag size={13} style={{ color: "var(--warning)" }} />
                      <span className="text-[11px] font-black" style={{ color: "var(--warning)" }}>
                        الشكوى الأصلية
                      </span>
                      <div className="flex-1" />
                      {timeStr && (
                        <span className="text-[10px]" style={{ color: "var(--text-disabled)" }}>{timeStr}</span>
                      )}
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words"
                        style={{ color: "var(--text-primary)" }}>
                        {msg.message}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular chat bubble */
                <div
                  className="flex items-end gap-2.5 mb-2"
                  style={{ flexDirection: isAdmin ? "row" : "row-reverse" }}
                >
                  {/* Avatar */}
                  {showAvatar ? (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1"
                      style={{
                        background: isAdmin
                          ? "linear-gradient(135deg, var(--success), var(--success-dark, #16a34a))"
                          : "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                        boxShadow: isAdmin
                          ? "0 2px 8px rgba(var(--success-rgb),0.3)"
                          : "0 2px 8px rgba(var(--primary-rgb),0.3)",
                      }}
                    >
                      {isAdmin
                        ? <ShieldCheck size={14} className="text-white" />
                        : <User size={14} className="text-white" />
                      }
                    </div>
                  ) : (
                    <div className="w-8 shrink-0" />
                  )}

                  {/* Bubble */}
                  <div style={{ maxWidth: "72%" }}>
                    {/* Sender name (shown only when avatar shows) */}
                    {showAvatar && (
                      <div
                        className="text-[10px] font-black mb-1 px-1"
                        style={{
                          color: isAdmin ? "var(--success)" : "var(--primary)",
                          // text aligns physically: admin label to the left, user label to the right
                          textAlign: isAdmin ? "left" : "right",
                          direction: "rtl",
                        }}
                      >
                        {isAdmin ? `🛡️ الدعم${adminName ? ` — ${adminName}` : ""}` : "👤 المستخدم"}
                      </div>
                    )}
                    <div
                      className="px-4 py-2.5 relative"
                      dir="rtl"
                      style={{
                        background: isAdmin
                          ? "linear-gradient(135deg, rgba(var(--success-rgb),0.12), rgba(var(--success-rgb),0.08))"
                          : "var(--surface-elevated)",
                        border: isAdmin
                          ? "1px solid rgba(var(--success-rgb),0.2)"
                          : "1px solid var(--divider)",
                        // Admin (Me) on right  → sharp bottom-right corner
                        // User (Them) on left → sharp bottom-left corner
                        borderRadius: isAdmin
                          ? "18px 18px 4px 18px"
                          : "18px 18px 18px 4px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      }}
                    >
                      <p
                        className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {msg.message}
                      </p>
                      {timeStr && (
                        <div
                          className="flex items-center gap-1 mt-1.5"
                          style={{
                            justifyContent: isAdmin ? "flex-start" : "flex-end",
                          }}
                        >
                          <span className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
                            {timeStr}
                          </span>
                          <CheckCircle2 size={9} style={{ color: "var(--text-disabled)" }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reply box */}
      {currentStatus !== "closed" && (
        <div style={{ borderTop: "1px solid var(--divider)", background: "var(--surface-elevated)" }}>
          <ComplaintDetailClient complaintId={complaintId} currentStatus={currentStatus} />
        </div>
      )}
      {currentStatus === "closed" && (
        <div
          className="flex items-center justify-center gap-2 py-4"
          style={{ borderTop: "1px solid var(--divider)", background: "var(--surface-elevated)" }}
        >
          <Lock size={13} style={{ color: "var(--text-disabled)" }} />
          <span className="text-[12px] font-semibold" style={{ color: "var(--text-disabled)" }}>
            هذه الشكوى مغلقة
          </span>
        </div>
      )}
    </div>
  );
}

// ── Info Panel ───────────────────────────────────────────────────────────────
function InfoPanel({
  complaint, user, trip, driver, adminName, currency,
}: {
  complaint: any;
  user: any;
  trip: any;
  driver: any;
  adminName: string | null;
  currency: string;
}) {
  const categoryLabel: Record<string, string> = {
    general: "عام", driver: "سائق", trip: "رحلة", payment: "دفع", app: "تطبيق", other: "أخرى",
  };
  const priorityColor: Record<string, string> = {
    urgent: "var(--error)", high: "var(--warning)", normal: "var(--info)", low: "var(--text-disabled)",
  };
  const priorityLabel: Record<string, string> = {
    urgent: "⚡ عاجل", high: "↑ مرتفع", normal: "— عادي", low: "↓ منخفض",
  };
  const followUpConfig: Record<string, { label: string; color: string; bg: string }> = {
    open: { label: "مفتوحة", color: "var(--warning)", bg: "rgba(var(--warning-rgb),0.1)" },
    in_progress: { label: "قيد المعالجة", color: "var(--info)", bg: "rgba(var(--info-rgb),0.1)" },
    resolved: { label: "تم الحل", color: "var(--success)", bg: "rgba(var(--success-rgb),0.1)" },
    closed: { label: "مغلقة", color: "var(--text-disabled)", bg: "var(--surface-elevated)" },
  };
  const followUp = followUpConfig[complaint.status] || { label: complaint.status, color: "var(--text-tertiary)", bg: "var(--surface-elevated)" };

  const tripStatusConfig: Record<string, { label: string; color: string }> = {
    completed: { label: "مكتملة", color: "var(--success)" },
    in_progress: { label: "قيد التنفيذ", color: "var(--info)" },
    cancelled: { label: "ملغاة", color: "var(--error)" },
    accepted: { label: "مقبولة", color: "var(--info)" },
  };
  const tripStatus = trip ? (tripStatusConfig[trip.status] || { label: trip.status, color: "var(--text-tertiary)" }) : null;

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-2xl"
        style={{
          background: followUp.bg,
          border: `1px solid ${followUp.color}33`,
        }}
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: followUp.color, boxShadow: `0 0 6px ${followUp.color}` }}
        />
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-disabled)" }}>حالة الشكوى</p>
          <p className="text-[13px] font-black" style={{ color: followUp.color }}>{followUp.label}</p>
        </div>
        <Clock size={14} style={{ color: followUp.color }} />
      </div>

      {/* Complaint info */}
      <div className="dash-card p-4 space-y-3">
        <p className="text-[10px] font-black text-text-disabled uppercase tracking-wider">تفاصيل الشكوى</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-tertiary">التصنيف</span>
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
            style={{ background: "var(--info-surface)", color: "var(--info)" }}
          >
            {categoryLabel[complaint.category] || complaint.category}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-tertiary">الأولوية</span>
          <span className="text-[11px] font-black" style={{ color: priorityColor[complaint.priority] }}>
            {priorityLabel[complaint.priority] || complaint.priority}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-tertiary">التاريخ</span>
          <span className="text-[11px] text-text-secondary num">{formatDate(complaint.created_at)}</span>
        </div>
      </div>

      {/* User card */}
      <div className="dash-card p-4">
        <p className="text-[10px] font-black text-text-disabled uppercase tracking-wider mb-3">المستخدم</p>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[15px] shrink-0"
            style={{ background: "var(--primary-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}
          >
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-text-primary text-[13px] break-words">{user?.name}</p>
            {user?.phone && (
              <p className="text-[11px] text-text-tertiary flex items-center gap-1 num mt-0.5">
                <Phone size={10} /> {user.phone}
              </p>
            )}
            {user?.email && (
              <p className="text-[11px] text-text-disabled truncate flex items-center gap-1 mt-0.5">
                <Mail size={10} /> <span className="truncate">{user.email}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Trip card */}
      {trip && (
        <div className="dash-card overflow-hidden">
          <div className="dash-section-header">
            <div className="flex items-center gap-2">
              <Link2 size={13} className="text-text-tertiary" />
              <p className="text-[12px] font-bold text-text-primary">الرحلة المرتبطة</p>
            </div>
            <Link
              href={`/dashboard/trips/${trip.id}`}
              className="text-[11px] font-bold hover:opacity-70 transition-opacity"
              style={{ color: "var(--primary)" }}
            >
              عرض
            </Link>
          </div>

          <div className="px-4 py-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-tertiary">الحالة</span>
              {tripStatus && (
                <span className="text-[11px] font-bold" style={{ color: tripStatus.color }}>{tripStatus.label}</span>
              )}
            </div>

            {(trip.pickup_address || trip.destination_address) && (
              <div className="space-y-1.5 pt-1">
                {trip.pickup_address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={11} className="text-success mt-0.5 shrink-0" />
                    <p className="text-[11px] text-text-secondary break-words leading-snug">{trip.pickup_address}</p>
                  </div>
                )}
                {trip.destination_address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={11} className="text-primary mt-0.5 shrink-0" />
                    <p className="text-[11px] text-text-secondary break-words leading-snug">{trip.destination_address}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: "var(--divider)" }}>
              <span className="text-[11px] text-text-tertiary">السعر النهائي</span>
              <span className="text-[13px] font-black num" style={{ color: "var(--success)" }}>
                {formatCurrency(Number(trip.final_price ?? trip.price ?? 0), currency)}
              </span>
            </div>

            {trip.payment_method && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-tertiary">طريقة الدفع</span>
                <span className="text-[11px] font-bold text-text-secondary">
                  {trip.payment_method === "cash" ? "💵 نقدي" : trip.payment_method === "wallet" ? "👛 محفظة" : trip.payment_method}
                </span>
              </div>
            )}
          </div>

          {/* Driver */}
          {driver && (
            <div className="px-4 py-3 border-t" style={{ borderColor: "var(--divider)" }}>
              <p className="text-[10px] font-black text-text-disabled uppercase tracking-wider mb-2">السائق</p>
              <Link
                href={`/dashboard/drivers/${driver.id}`}
                className="flex items-center gap-2.5 hover:bg-surface-elevated rounded-xl p-1.5 -m-1.5 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-[12px] shrink-0"
                  style={{ background: "var(--success-surface)", color: "var(--success)" }}
                >
                  {driver.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-text-primary text-[12px] break-words">{driver.name}</p>
                  {driver.phone && (
                    <p className="text-[10px] text-text-tertiary num flex items-center gap-1">
                      <Phone size={9} /> {driver.phone}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations();
  const supabase = createAdminClient();
  const currency = await getAppCurrency();

  const { data: complaint } = await supabase
    .from("complaints")
    .select(`
      id, title, description, category, status, priority,
      admin_reply, admin_notes, replied_at, resolved_at, created_at,
      trip_id,
      users!user_id(id, name, phone, email),
      admin:users!admin_id(name),
      trips!complaints_trip_id_fkey(
        id, status, vehicle_type, price, final_price, payment_method,
        pickup_address, destination_address, distance_km,
        created_at, completed_at, cancelled_at,
        driver_id,
        users!trips_driver_id_fkey(id, name, phone)
      )
    `)
    .eq("id", id)
    .single();

  if (!complaint) notFound();

  const user = (complaint as any).users;
  const admin = (complaint as any).admin;
  const trip = (complaint as any).trips as {
    id: string; status: string; vehicle_type: string;
    price: number | null; final_price: number | null; payment_method: string | null;
    pickup_address: string | null; destination_address: string | null; distance_km: number | null;
    created_at: string | null; completed_at: string | null; cancelled_at: string | null;
    driver_id: string | null;
    users?: { id: string; name: string; phone: string } | null;
  } | null;

  const driver = trip?.users ?? null;
  const messages = buildThread(
    complaint.description as string,
    complaint.created_at as string,
    complaint.admin_reply as string | null,
    complaint.admin_notes as string | null,
    complaint.replied_at as string | null,
  );

  return (
    <div className="space-y-4 h-full">
      {/* Back link + title */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/dashboard/complaints"
          className="inline-flex items-center gap-1.5 text-text-tertiary hover:text-text-primary text-sm transition-colors"
        >
          <ArrowRight size={14} />
          {t("complaints.backToList")}
        </Link>
        <div className="w-px h-4" style={{ background: "var(--divider)" }} />
        <h1 className="text-[16px] font-black text-text-primary truncate">{complaint.title}</h1>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
        {/* Left: Info panel */}
        <div className="space-y-0">
          <InfoPanel
            complaint={complaint}
            user={user}
            trip={trip}
            driver={driver}
            adminName={admin?.name ?? null}
            currency={currency}
          />
        </div>

        {/* Right: Chat panel */}
        <ConversationPanel
          messages={messages}
          adminName={admin?.name ?? null}
          complaintId={complaint.id}
          currentStatus={complaint.status}
        />
      </div>
    </div>
  );
}
