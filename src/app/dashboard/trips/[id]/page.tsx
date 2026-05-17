import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { 
  ArrowRight, Car, User, Navigation, DollarSign, 
  Clock, ShieldAlert, CheckCircle, XCircle, Star, Tag, MapPin 
} from "lucide-react";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations();
  const supabase = createAdminClient();

  
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

  
  const { data: complaints } = await supabase
    .from("complaints")
    .select("id, subject, message, status, priority, created_at, admin_reply")
    .eq("trip_id", id)
    .order("created_at", { ascending: false });

  // Fetch multi-route waypoints (Phase 2 Finding #4)
  const { data: routePlans } = await supabase
    .from("trip_route_plans")
    .select("id, status, total_distance_km, total_duration_min, created_at")
    .eq("trip_id", id)
    .order("created_at", { ascending: false })
    .limit(1);

  const activeRoutePlan = routePlans?.[0];
  let waypoints: any[] = [];
  if (activeRoutePlan) {
    const { data: wp } = await supabase
      .from("trip_route_waypoints")
      .select("id, sequence_order, label, address, lat, lng, status, arrived_at")
      .eq("route_plan_id", activeRoutePlan.id)
      .order("sequence_order", { ascending: true });
    waypoints = wp || [];
  }

  
  const user = trip.user as any;
  
  const driver = trip.driver as any;
  
  const driverProfile = driver?.drivers_profile as any;

  return (
    <>
    <div className="space-y-6 max-w-5xl mx-auto">
      
      
        <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1.5">
          <Link href="/dashboard/trips"
            className="inline-flex items-center gap-2 text-text-tertiary hover:text-text-primary text-[12px] font-bold transition-colors">
            <ArrowRight size={14} /> {t("trips.backToList")}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-text-primary">{t("trips.tripDetails")}</h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold ${getStatusColor(trip.status)}`}>
              {getStatusLabel(trip.status, t)}
            </span>
          </div>
          <p className="text-text-disabled text-[12px] num font-mono">{trip.id}</p>
        </div>

        <div className="flex items-center gap-4">
          {['searching', 'accepted', 'in_progress'].includes(trip.status) && (
            <form action="/api/trips/cancel" method="POST">
              <input type="hidden" name="trip_id" value={trip.id} />
              <button 
                type="submit" 
                className="px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 transition-opacity hover:opacity-80 bg-error/10 text-error border border-error/20"
                title="إلغاء الرحلة"
              >
                <XCircle size={14} /> إلغاء الرحلة
              </button>
            </form>
          )}

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-glass border border-divider">
          <div>
            <p className="text-text-tertiary text-[11px] font-bold uppercase tracking-wider mb-1">تاريخ الطلب</p>
            <div className="flex items-center gap-1.5 text-text-secondary text-[13px] font-medium">
              <Clock size={13} className="text-info" />
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
                  {trip.completed_at ? <CheckCircle size={13} className="text-success" /> : <XCircle size={13} className="text-error" />}
                  {formatDate(trip.completed_at || trip.cancelled_at)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        
        <div className="lg:col-span-2 dash-card p-6">
          <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2 mb-6">
            <Navigation size={16} className="text-info" />
            مسار الرحلة {waypoints.length > 0 && <span className="ml-2 text-[10px] bg-info/10 text-info px-2 py-0.5 rounded border border-info/20">متعددة المحطات</span>}
          </h3>
          
          <div className="relative pl-6 space-y-8">
            <div className="absolute top-1 bottom-1 left-2 w-[2px]" style={{ background: "linear-gradient(to bottom, var(--success), var(--info))", opacity: 0.5 }} />
            
            <div className="relative">
              <div className="absolute -left-8 top-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-background border-2 border-success">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
              </div>
              <p className="text-text-tertiary text-[11px] font-bold uppercase tracking-wider mb-1">نقطة الانطلاق</p>
              <p className="text-text-primary text-[14px] font-medium">{trip.pickup_address}</p>
            </div>

            {/* ── Multi-Route Waypoints (Phase 2 Finding #4) ── */}
            {waypoints.length > 0 && waypoints.map((wp: any) => (
              <div key={wp.id} className="relative">
                <div className="absolute -left-8 top-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-background border-2 border-warning">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-text-tertiary text-[11px] font-bold uppercase tracking-wider mb-1">
                    محطة {wp.sequence_order} {wp.label ? `— ${wp.label}` : ""}
                  </p>
                  {wp.status === "arrived" && (
                    <span className="text-[9px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">وصل</span>
                  )}
                  {wp.status === "skipped" && (
                    <span className="text-[9px] font-bold text-text-disabled bg-[rgba(var(--color-white-rgb),0.05)] px-1.5 py-0.5 rounded">تم تخطيها</span>
                  )}
                </div>
                <p className="text-text-primary text-[14px] font-medium">{wp.address || `${Number(wp.lat).toFixed(4)}, ${Number(wp.lng).toFixed(4)}`}</p>
              </div>
            ))}

            <div className="relative">
              <div className="absolute -left-8 top-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-background border-2 border-info">
                <div className="w-1.5 h-1.5 rounded-full bg-info" />
              </div>
              <p className="text-text-tertiary text-[11px] font-bold uppercase tracking-wider mb-1">الوجهة</p>
              <p className="text-text-primary text-[14px] font-medium">{trip.destination_address}</p>
            </div>
          </div>

          {/* ── Rating Display (Phase 2 Finding #5) ── */}
          {trip.user_rating_to_driver != null && (
            <div className="mt-6 p-4 rounded-xl flex items-center justify-between bg-warning/10 border border-warning/20">
              <div>
                <p className="text-warning text-[11px] font-bold uppercase tracking-wider mb-1">تقييم العميل للسائق</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      size={18}
                      className={i <= Number(trip.user_rating_to_driver) ? "text-warning" : "text-[rgba(var(--color-white-rgb),0.1)]"}
                      fill={i <= Number(trip.user_rating_to_driver) ? "currentColor" : "none"}
                    />
                  ))}
                  <span className="text-text-secondary text-[14px] font-bold num ml-2">{Number(trip.user_rating_to_driver).toFixed(1)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Cancellation Info (Phase 2 Finding #5) ── */}
          {(trip.cancel_reason || trip.cancel_reason_category) && (
            <div className="mt-6 p-4 rounded-xl bg-error/10 border border-error/20">

              {trip.cancel_reason && <p className="text-text-secondary text-[13px]">{trip.cancel_reason}</p>}
            </div>
          )}
        </div>

        
        <div className="dash-card p-6">
          <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2 mb-6">
            <DollarSign size={16} className="text-success" />
            التفاصيل المالية
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-divider">
              <span className="text-text-tertiary text-[13px] font-medium">التكلفة الإجمالية</span>
              <span className="text-[18px] font-black num text-success">{formatCurrency(trip.price)}</span>
            </div>
            
            {Number(trip.coupon_discount) > 0 && (
              <div className="flex justify-between items-center pb-2">
                <span className="text-success text-[13px] font-medium flex items-center gap-1"><Tag size={13}/> خصم الكوبون</span>
                <span className="text-[14px] font-bold num text-success">-{formatCurrency(trip.coupon_discount)}</span>
              </div>
            )}
            


            <div className="flex justify-between items-center">
              <span className="text-text-tertiary text-[13px] font-medium">المسافة المقدرة</span>
              <span className="text-[14px] font-bold num text-text-secondary">{Number(trip.distance_km).toFixed(1)} كم</span>
            </div>
            


            <div className="flex justify-between items-center pt-2">
              <span className="text-text-tertiary text-[13px] font-medium">طريقة ومصدر الدفع</span>
              <div className="flex gap-2">
                <span className="text-[11px] font-bold text-text-secondary px-2 py-0.5 rounded bg-surface-glass">
                  {trip.payment_source === 'wallet' ? 'محفظة' : 'نقدي'}
                </span>
                <span className="text-[11px] font-bold text-text-secondary px-2 py-0.5 rounded bg-surface-glass">
                  {trip.payment_method === 'cash' ? 'كاش' : 'محفظة'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        
        <div className="dash-card p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2">
              <User size={16} className="text-info" />
              المستخدم (العميل)
            </h3>
            {user?.is_blocked && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-error/10 text-error border border-error/20">محظور</span>}
          </div>
          
          {user ? (
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[18px] bg-info/10 text-info border border-info/10">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="space-y-1">
                <p className="font-bold text-text-primary text-[15px]">{user.name}</p>
                <p className="text-text-tertiary text-[12px] num">{user.phone} • {user.email}</p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="text-[12px]"><span className="text-warning font-bold">⭐ {user.rating}</span></div>
                  <div className="text-[12px] text-text-secondary font-bold"><span className="text-text-tertiary font-medium">الرحلات:</span> {user.total_trips}</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-text-disabled text-center py-4">بيانات المستخدم غير متوفرة</p>
          )}
        </div>

        
        <div className="dash-card p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2">
              <Car size={16} className="text-success" />
              السائق
            </h3>
            {driver?.is_blocked && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-error/10 text-error border border-error/20">محظور</span>}
          </div>
          
          {driver ? (
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[18px] bg-success/10 text-success border border-success/20">
                {driver.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-bold text-text-primary text-[15px]">{driver.name}</p>
                <p className="text-text-tertiary text-[12px] num">{driver.phone}</p>
                <div className="flex items-center gap-4 pt-2 pb-2">
                  <div className="text-[12px]"><span className="text-warning font-bold">⭐ {driver.rating}</span></div>
                  <div className="text-[12px] text-text-secondary font-bold"><span className="text-text-tertiary font-medium">الرحلات:</span> {driver.total_trips}</div>
                </div>
                {driverProfile && (
                  <div className="p-2.5 rounded-xl text-[11px] font-medium flex items-center justify-between bg-surface-glass border border-divider">
                    <span className="text-text-secondary">
                      {driverProfile.vehicle_brand} {driverProfile.vehicle_model} {driverProfile.vehicle_type === "car" ? "🚗" : "🏍"}
                    </span>
                    <span className="font-bold text-text-primary num bg-[rgba(var(--color-black-rgb),0.3)] px-2 py-0.5 rounded">{driverProfile.vehicle_plate}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-text-disabled text-center py-4">لم يتم تعيين سائق أو تم الإلغاء قبل التعيين</p>
          )}
        </div>

      </div>

      
      {complaints && complaints.length > 0 && (
        <div className="dash-card p-6 border border-error/15 shadow-[0_4px_20px_rgba(var(--error-rgb),0.05)]">
          <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2 mb-6">
            <ShieldAlert size={16} className="text-error" />
            الشكاوي المرتبطة بهذه الرحلة ({complaints.length})
          </h3>

          <div className="space-y-4">
            {complaints.map(comp => (
              <div key={comp.id} className="p-4 rounded-xl border border-divider bg-surface-glass">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h4 className="font-bold text-[14px] text-text-primary">{comp.subject}</h4>
                  <div className="flex gap-2">
                    {comp.priority === "urgent" && <span className="text-[10px] font-bold text-error bg-error/10 px-2 py-0.5 rounded">عاجل</span>}
                    <span className="text-[10px] font-bold text-text-secondary bg-[rgba(var(--color-white-rgb),0.05)] px-2 py-0.5 rounded border border-[rgba(var(--color-white-rgb),0.1)]">
                      {comp.status === "resolved" ? "محلولة" : comp.status === "closed" ? "مغلقة" : "مفتوحة"}
                    </span>
                  </div>
                </div>
                <p className="text-[13px] text-text-secondary mb-3">{comp.message}</p>
                {comp.admin_reply && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-[11px] font-bold text-success mb-1">رد الإدارة:</p>
                    <p className="text-[12px] text-success-surface/80">{comp.admin_reply}</p>
                  </div>
                )}
                <div className="mt-3 text-left">
                  <Link href={`/dashboard/complaints/${comp.id}`} className="text-[11px] font-bold text-info hover:text-info-light transition-colors">
                    عرض تفاصيل الشكوى والرد ←
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
    </>
  );
}
