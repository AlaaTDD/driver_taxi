import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRight, MapPin, Car, User, Navigation, DollarSign, 
  Clock, AlertTriangle, ShieldAlert, CheckCircle, XCircle 
} from "lucide-react";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  // 1. Fetch Trip Data
  const { data: trip, error } = await supabase
    .from("trips")
    .select(`
      *,
      user:users!user_id(id, name, phone, email, rating, total_trips, is_blocked),
      driver:users!driver_id(
        id, name, phone, email, rating, total_trips, is_blocked,
        drivers_profile(vehicle_type, vehicle_brand, vehicle_model, vehicle_plate)
      )
    `)
    .eq("id", id)
    .single();

  if (error) console.error("Trip detail fetch error:", error);
  if (!trip) notFound();

  // 2. Fetch Complaints associated with this trip
  const { data: complaints } = await supabase
    .from("complaints")
    .select("id, subject, message, status, priority, created_at, admin_reply")
    .eq("trip_id", id)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = trip.user as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const driver = trip.driver as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const driverProfile = driver?.drivers_profile as any;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1.5">
          <Link href="/dashboard/trips"
            className="inline-flex items-center gap-2 text-text-tertiary hover:text-text-primary text-[12px] font-bold transition-colors">
            <ArrowRight size={14} /> العودة لقائمة الرحلات
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-black text-text-primary">تفاصيل الرحلة</h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold ${getStatusColor(trip.status)}`}>
              {getStatusLabel(trip.status)}
            </span>
          </div>
          <p className="text-text-disabled text-[12px] num font-mono">{trip.id}</p>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(15,30,53,0.5)", border: "1px solid var(--divider)" }}>
          <div>
            <p className="text-text-tertiary text-[11px] font-bold uppercase tracking-wider mb-1">تاريخ الطلب</p>
            <div className="flex items-center gap-1.5 text-text-secondary text-[13px] font-medium">
              <Clock size={13} className="text-blue-400" />
              {formatDate(trip.created_at)}
            </div>
          </div>
          {(trip.completed_at || trip.cancelled_at) && (
            <>
              <div className="w-px h-8 bg-[var(--divider)]" />
              <div>
                <p className="text-text-tertiary text-[11px] font-bold uppercase tracking-wider mb-1">
                  {trip.completed_at ? "تاريخ الاكتمال" : "تاريخ الإلغاء"}
                </p>
                <div className="flex items-center gap-1.5 text-text-secondary text-[13px] font-medium">
                  {trip.completed_at ? <CheckCircle size={13} className="text-emerald-400" /> : <XCircle size={13} className="text-red-400" />}
                  {formatDate(trip.completed_at || trip.cancelled_at)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== LOCATIONS & FINANCIALS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Route Details */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2 mb-6">
            <Navigation size={16} className="text-blue-400" />
            مسار الرحلة
          </h3>
          
          <div className="relative pl-6 space-y-8">
            <div className="absolute top-1 bottom-1 left-2 w-[2px]" style={{ background: "linear-gradient(to bottom, #10B981, #3B82F6)", opacity: 0.5 }} />
            
            <div className="relative">
              <div className="absolute -left-8 top-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-background" style={{ border: "2px solid #10B981" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-text-tertiary text-[11px] font-bold uppercase tracking-wider mb-1">نقطة الانطلاق</p>
              <p className="text-text-primary text-[14px] font-medium">{trip.pickup_address}</p>
            </div>

            <div className="relative">
              <div className="absolute -left-8 top-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-background" style={{ border: "2px solid #3B82F6" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>
              <p className="text-text-tertiary text-[11px] font-bold uppercase tracking-wider mb-1">الوجهة</p>
              <p className="text-text-primary text-[14px] font-medium">{trip.destination_address}</p>
            </div>
          </div>

          {trip.cancel_reason && (
            <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-red-400 text-[11px] font-bold uppercase tracking-wider mb-1">سبب الإلغاء</p>
              <p className="text-text-secondary text-[13px]">{trip.cancel_reason}</p>
            </div>
          )}
        </div>

        {/* Financial Details */}
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2 mb-6">
            <DollarSign size={16} className="text-emerald-400" />
            التفاصيل المالية
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4" style={{ borderBottom: "1px solid var(--divider)" }}>
              <span className="text-text-tertiary text-[13px] font-medium">التكلفة</span>
              <span className="text-[18px] font-black num text-emerald-400">{formatCurrency(trip.price)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-tertiary text-[13px] font-medium">المسافة المقدرة</span>
              <span className="text-[14px] font-bold num text-text-secondary">{Number(trip.distance_km).toFixed(1)} كم</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-tertiary text-[13px] font-medium">طريقة الدفع</span>
              <span className="text-[13px] font-bold text-text-secondary px-2.5 py-1 rounded-lg" style={{ background: "rgba(15,30,53,0.8)" }}>
                {trip.payment_method === 'cash' ? 'كاش' : 'محفظة'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== USER & DRIVER INFO ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* User Card */}
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2">
              <User size={16} className="text-blue-400" />
              المستخدم (العميل)
            </h3>
            {user?.is_blocked && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">محظور</span>}
          </div>
          
          {user ? (
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[18px]" style={{ background: "rgba(59,130,246,0.15)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.2)" }}>
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="space-y-1">
                <p className="font-bold text-text-primary text-[15px]">{user.name}</p>
                <p className="text-text-tertiary text-[12px] num">{user.phone} • {user.email}</p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="text-[12px]"><span className="text-amber-400 font-bold">⭐ {user.rating}</span></div>
                  <div className="text-[12px] text-text-secondary font-bold"><span className="text-text-tertiary font-medium">الرحلات:</span> {user.total_trips}</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-text-disabled text-center py-4">بيانات المستخدم غير متوفرة</p>
          )}
        </div>

        {/* Driver Card */}
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2">
              <Car size={16} className="text-emerald-400" />
              السائق
            </h3>
            {driver?.is_blocked && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">محظور</span>}
          </div>
          
          {driver ? (
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[18px]" style={{ background: "rgba(16,185,129,0.15)", color: "#6EE7B7", border: "1px solid rgba(16,185,129,0.2)" }}>
                {driver.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-bold text-text-primary text-[15px]">{driver.name}</p>
                <p className="text-text-tertiary text-[12px] num">{driver.phone}</p>
                <div className="flex items-center gap-4 pt-2 pb-2">
                  <div className="text-[12px]"><span className="text-amber-400 font-bold">⭐ {driver.rating}</span></div>
                  <div className="text-[12px] text-text-secondary font-bold"><span className="text-text-tertiary font-medium">الرحلات:</span> {driver.total_trips}</div>
                </div>
                {driverProfile && (
                  <div className="p-2.5 rounded-xl text-[11px] font-medium flex items-center justify-between" style={{ background: "rgba(15,30,53,0.5)", border: "1px solid var(--divider)" }}>
                    <span className="text-text-secondary">
                      {driverProfile.vehicle_brand} {driverProfile.vehicle_model} {driverProfile.vehicle_type === "car" ? "🚗" : "🏍"}
                    </span>
                    <span className="font-bold text-text-primary num bg-black/30 px-2 py-0.5 rounded">{driverProfile.vehicle_plate}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-text-disabled text-center py-4">لم يتم تعيين سائق أو تم الإلغاء قبل التعيين</p>
          )}
        </div>

      </div>

      {/* ===== COMPLAINTS SECTION ===== */}
      {complaints && complaints.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))", border: "1px solid rgba(239,68,68,0.15)", boxShadow: "0 4px 20px rgba(239,68,68,0.05)" }}>
          <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2 mb-6">
            <ShieldAlert size={16} className="text-red-400" />
            الشكاوي المرتبطة بهذه الرحلة ({complaints.length})
          </h3>

          <div className="space-y-4">
            {complaints.map(comp => (
              <div key={comp.id} className="p-4 rounded-xl border" style={{ borderColor: "var(--divider)", background: "rgba(15,30,53,0.3)" }}>
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h4 className="font-bold text-[14px] text-text-primary">{comp.subject}</h4>
                  <div className="flex gap-2">
                    {comp.priority === "urgent" && <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">عاجل</span>}
                    <span className="text-[10px] font-bold text-text-secondary bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      {comp.status === "resolved" ? "محلولة" : comp.status === "closed" ? "مغلقة" : "مفتوحة"}
                    </span>
                  </div>
                </div>
                <p className="text-[13px] text-text-secondary mb-3">{comp.message}</p>
                {comp.admin_reply && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[11px] font-bold text-emerald-400 mb-1">رد الإدارة:</p>
                    <p className="text-[12px] text-emerald-100/80">{comp.admin_reply}</p>
                  </div>
                )}
                <div className="mt-3 text-left">
                  <Link href={`/dashboard/complaints/${comp.id}`} className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors">
                    عرض تفاصيل الشكوى والرد ←
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
