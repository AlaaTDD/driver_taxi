import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ComplaintDetailClient from "./complaint-detail-client";
import {
  MessageSquareWarning, ArrowRight, Car, User, Phone, Mail,
  MapPin, DollarSign, Calendar, Clock, Link2, Route, CheckCircle2,
  AlertTriangle, Loader,
} from "lucide-react";
import Link from "next/link";
import { getAppCurrency } from "@/lib/currency";

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations();
  const supabase = createAdminClient();
  const currency = await getAppCurrency();

  const { data: complaint } = await supabase
    .from("complaints")
    .select(`
      id, title, description, category, status, priority,
      admin_reply, replied_at, resolved_at, created_at, updated_at,
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

  const categoryLabel: Record<string, string> = { general: "عام", driver: "سائق", trip: "رحلة", payment: "دفع", app: "تطبيق", other: "أخرى" };
  const priorityColor: Record<string, string> = { urgent: "var(--error)", high: "var(--warning)", normal: "var(--info)", low: "var(--text-disabled)" };

  // Trip status display config
  const tripStatusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
    completed: { label: "مكتملة", color: "var(--success)", bg: "var(--success-surface)", icon: CheckCircle2 },
    in_progress: { label: "قيد التنفيذ", color: "var(--info)", bg: "var(--info-surface)", icon: Loader },
    cancelled: { label: "ملغاة", color: "var(--error)", bg: "var(--error-surface)", icon: AlertTriangle },
    accepted: { label: "مقبولة", color: "var(--info)", bg: "var(--info-surface)", icon: Car },
  };
  const tripStatus = trip ? (tripStatusConfig[trip.status] || { label: trip.status, color: "var(--text-tertiary)", bg: "var(--surface-elevated)", icon: AlertTriangle }) : null;

  // Complaint follow-up status
  const followUpConfig: Record<string, { label: string; color: string; bg: string }> = {
    open: { label: "مفتوحة — بانتظار الرد", color: "var(--warning)", bg: "var(--warning-surface)" },
    in_progress: { label: "قيد المعالجة", color: "var(--info)", bg: "var(--info-surface)" },
    resolved: { label: "تم الحل", color: "var(--success)", bg: "var(--success-surface)" },
    closed: { label: "مغلقة", color: "var(--text-disabled)", bg: "var(--surface-elevated)" },
  };
  const followUp = followUpConfig[complaint.status] || { label: complaint.status, color: "var(--text-tertiary)", bg: "var(--surface-elevated)" };

  return (
    <>
    <div className="space-y-6 max-w-3xl mx-auto">

      <Link href="/dashboard/complaints"
        className="inline-flex items-center gap-2 text-text-tertiary hover:text-text-primary text-sm transition-colors">
        <ArrowRight size={14} />
        {t("complaints.backToList")}
      </Link>


      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-black text-text-primary break-words">{complaint.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
              style={{ background: "var(--info-surface)", color: "var(--info)", border: "1px solid var(--info-surface)" }}>
              {categoryLabel[complaint.category]}
            </span>
            <span className="text-[12px] font-bold" style={{ color: priorityColor[complaint.priority] }}>
              {complaint.priority === "urgent" ? "⚡ عاجل" : complaint.priority === "high" ? "↑ مرتفع" : "— عادي"}
            </span>
            <span className="flex items-center gap-1 text-text-disabled text-[12px]">
              <Calendar size={11} />
              {formatDate(complaint.created_at)}
            </span>
          </div>
        </div>
        {/* Follow-up status badge */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold whitespace-nowrap self-start"
          style={{ background: followUp.bg, color: followUp.color, border: `1px solid ${followUp.color}33` }}
        >
          <Clock size={12} />
          {followUp.label}
        </span>
      </div>


      <div className="dash-card p-5">
        <h3 className="text-[12px] font-bold text-text-tertiary uppercase tracking-wider mb-3">المستخدم</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-[15px] shrink-0"
            style={{ background: "var(--primary-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-text-primary break-words">{user?.name}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-[12px] text-text-tertiary">
              {user?.phone && (
                <span className="flex items-center gap-1 num">
                  <Phone size={11} /> {user.phone}
                </span>
              )}
              {user?.email && (
                <span className="flex items-center gap-1 truncate">
                  <Mail size={11} /> <span className="truncate">{user.email}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>


      <div className="dash-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquareWarning size={14} className="text-text-tertiary" />
          <h3 className="text-[12px] font-bold text-text-tertiary uppercase tracking-wider">نص الشكوى</h3>
        </div>
        <p className="text-text-secondary leading-relaxed whitespace-pre-wrap break-words">{complaint.description}</p>
      </div>


      {/* ── TRIP + DRIVER + FINANCIAL DETAILS ────────────────────────── */}
      {trip && (
        <div className="dash-card overflow-hidden">
          <div className="dash-section-header">
            <div className="flex items-center gap-2.5">
              <div className="w-[3px] h-5 rounded-full" style={{ background: "linear-gradient(to bottom, var(--primary), var(--primary-dark))" }} />
              <Link2 size={14} className="text-text-tertiary" />
              <h3 className="text-[13px] font-bold text-text-primary">الرحلة المرتبطة بالشكوى</h3>
            </div>
            <Link
              href={`/dashboard/trips/${trip.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80"
              style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}
            >
              <MapPin size={11} />
              عرض الرحلة
            </Link>
          </div>

          {/* Trip ID + status row */}
          <div className="px-5 py-4 border-b border-divider grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-tertiary font-bold">رقم الرحلة:</span>
              <code className="text-[11px] font-mono font-bold text-text-primary bg-surface-elevated px-2 py-0.5 rounded">
                {trip.id.substring(0, 8)}
              </code>
            </div>
            {tripStatus && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-tertiary font-bold">حالة الرحلة:</span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold"
                  style={{ background: tripStatus.bg, color: tripStatus.color }}
                >
                  <tripStatus.icon size={10} />
                  {tripStatus.label}
                </span>
              </div>
            )}
          </div>

          {/* Route info */}
          {(trip.pickup_address || trip.destination_address) && (
            <div className="px-5 py-4 border-b border-divider">
              <div className="flex items-center gap-2 mb-3">
                <Route size={13} className="text-text-tertiary" />
                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">المسار</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin size={12} className="text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-text-tertiary font-bold">الانطلاق</p>
                    <p className="text-[13px] text-text-primary break-words">{trip.pickup_address || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={12} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-text-tertiary font-bold">الوجهة</p>
                    <p className="text-[13px] text-text-primary break-words">{trip.destination_address || "—"}</p>
                  </div>
                </div>
                {trip.distance_km != null && (
                  <div className="flex items-center gap-2 mt-2">
                    <Car size={11} className="text-text-tertiary" />
                    <span className="text-[12px] text-text-secondary num">
                      {Number(trip.distance_km).toFixed(1)} كم · {trip.vehicle_type === "car" ? "🚗 سيارة" : "🏍 دراجة"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Driver info */}
          {driver && (
            <div className="px-5 py-4 border-b border-divider">
              <div className="flex items-center gap-2 mb-3">
                <User size={13} className="text-text-tertiary" />
                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">السائق</span>
              </div>
              <Link
                href={`/dashboard/drivers/${driver.id}`}
                className="flex items-center gap-3 hover:bg-surface-elevated rounded-xl p-2 -m-2 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[14px] shrink-0"
                  style={{ background: "var(--success-surface)", color: "var(--success)" }}>
                  {driver.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-text-primary text-[13px] break-words">{driver.name}</p>
                  {driver.phone && (
                    <p className="text-[11px] text-text-tertiary num flex items-center gap-1">
                      <Phone size={10} /> {driver.phone}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          )}

          {/* Financial details */}
          <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign size={11} className="text-text-tertiary" />
                <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">السعر الأصلي</span>
              </div>
              <p className="text-[15px] font-black num text-text-primary">
                {formatCurrency(Number(trip.price ?? 0), currency)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign size={11} className="text-success" />
                <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">السعر النهائي</span>
              </div>
              <p className="text-[15px] font-black num text-success">
                {formatCurrency(Number(trip.final_price ?? trip.price ?? 0), currency)}
              </p>
            </div>
            {trip.payment_method && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign size={11} className="text-text-tertiary" />
                  <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">طريقة الدفع</span>
                </div>
                <p className="text-[13px] font-bold text-text-secondary">
                  {trip.payment_method === "cash" ? "نقدي" :
                   trip.payment_method === "wallet" ? "محفظة" :
                   trip.payment_method === "card" ? "بطاقة" : trip.payment_method}
                </p>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="px-5 py-4 border-t border-divider grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
            <div className="flex items-center gap-1.5 text-text-tertiary">
              <Calendar size={10} />
              <span>طلب: {trip.created_at ? formatDate(trip.created_at) : "—"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-text-tertiary">
              <CheckCircle2 size={10} />
              <span>إتمام: {trip.completed_at ? formatDate(trip.completed_at) : "—"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-text-tertiary">
              <AlertTriangle size={10} />
              <span>إلغاء: {trip.cancelled_at ? formatDate(trip.cancelled_at) : "—"}</span>
            </div>
          </div>
        </div>
      )}


      {complaint.admin_reply && (
        <div className="rounded-2xl p-5" style={{
          background: "rgba(var(--success-rgb),0.06)",
          border: "1px solid rgba(var(--success-rgb),0.15)",
        }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-[12px] font-bold text-success uppercase tracking-wider">الرد السابق</h3>
            {admin?.name && <span className="text-text-disabled text-[11px]">بواسطة: {admin.name}</span>}
          </div>
          <p className="text-text-secondary leading-relaxed whitespace-pre-wrap break-words">{complaint.admin_reply}</p>
          {complaint.replied_at && (
            <p className="text-text-disabled text-[11px] mt-3 flex items-center gap-1">
              <Calendar size={10} /> {formatDate(complaint.replied_at)}
            </p>
          )}
        </div>
      )}


      {complaint.status !== "closed" && (
        <ComplaintDetailClient complaintId={complaint.id} currentStatus={complaint.status} />
      )}
    </div>
    </>
  );
}
