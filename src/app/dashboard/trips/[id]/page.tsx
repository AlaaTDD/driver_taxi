import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  ArrowRight, Car, User, Navigation, DollarSign,
  Clock, CheckCircle, XCircle, Star, Tag, MapPin,
  ShieldAlert, Phone, Mail, Route, Banknote, Wallet,
  CircleDot, Flag, AlertTriangle, MessageSquare, Hash,
  Timer, Ruler, CreditCard, TrendingUp, Zap, Shield,
  ArrowUpRight, Activity, ChevronRight, Info, ExternalLink
} from "lucide-react";
import { getAppCurrency } from "@/lib/currency";

/* ═══════════════════════════════════════════════════════════════════════
   Trip Detail Page — Ultra-Premium Admin Dashboard UI v2
   ═══════════════════════════════════════════════════════════════════ */

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations();
  const supabase = createAdminClient();
  const currency = await getAppCurrency();

  // [PERF-02 FIXED] Run the 4 queries in parallel instead of serially.
  // Previously: trip → complaints → routePlans → waypoints (4 round-trips = 4 × latency).
  const [
    tripResult,
    complaintsResult,
    routePlansResult,
  ] = await Promise.all([
    supabase
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
      .single(),
    supabase
      .from("complaints")
      .select("id, title, description, status, priority, created_at, admin_reply")
      .eq("trip_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("trip_route_plans")
      .select("id, status, total_distance_km, total_duration_min, created_at")
      .eq("trip_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const { data: trip, error } = tripResult;

  if (error) console.error("Trip detail fetch error:", error);
  if (!trip) notFound();

  const complaints = complaintsResult.data || [];
  const routePlans = routePlansResult.data || [];

  const activeRoutePlan = routePlans[0];
  let waypoints: Array<{
    id: string;
    seq_order: number;
    role: string;
    address: string;
    lat: number | null;
    lng: number | null;
    actual_arrived_at: string | null;
    actual_departed_at: string | null;
  }> = [];
  if (activeRoutePlan) {
    const { data: wp } = await supabase
      .from("trip_route_waypoints")
      .select("id, seq_order, role, address, lat, lng, actual_arrived_at, actual_departed_at")
      .eq("route_plan_id", activeRoutePlan.id)
      .order("seq_order", { ascending: true });
    waypoints = wp || [];
  }

  const user = trip.user as any;
  const driver = trip.driver as any;
  const driverProfile = driver?.drivers_profile as any;

  const statusConfig: Record<string, {
    icon: any;
    gradient: string;
    glow: string;
    ringColor: string;
    label: string;
    dotColor: string;
    badgeClass: string;
  }> = {
    searching:       { icon: Timer,       gradient: "from-warning/25 via-warning/8 to-transparent", glow: "shadow-[0_0_60px_rgba(var(--warning-rgb),0.18)]",  ringColor: "ring-warning/30",  label: "جاري البحث عن سائق", dotColor: "bg-warning",   badgeClass: "bg-warning/10 text-warning border-warning/25" },
    accepted:        { icon: CheckCircle, gradient: "from-primary/25 via-primary/8 to-transparent", glow: "shadow-[0_0_60px_rgba(var(--primary-rgb),0.18)]",  ringColor: "ring-primary/30",  label: "تم قبول الرحلة",     dotColor: "bg-primary",   badgeClass: "bg-primary/10 text-primary border-primary/25" },
    driver_arriving: { icon: Car,         gradient: "from-info/25 via-info/8 to-transparent",       glow: "shadow-[0_0_60px_rgba(var(--info-rgb),0.18)]",     ringColor: "ring-info/30",     label: "السائق في الطريق",   dotColor: "bg-info",      badgeClass: "bg-info/10 text-info border-info/25" },
    in_progress:     { icon: Navigation,  gradient: "from-info/25 via-primary/8 to-transparent",   glow: "shadow-[0_0_60px_rgba(var(--info-rgb),0.18)]",     ringColor: "ring-info/30",     label: "الرحلة جارية الآن", dotColor: "bg-info",      badgeClass: "bg-info/10 text-info border-info/25" },
    completed:       { icon: CheckCircle, gradient: "from-success/25 via-success/8 to-transparent", glow: "shadow-[0_0_60px_rgba(var(--success-rgb),0.18)]",  ringColor: "ring-success/30",  label: "رحلة مكتملة بنجاح", dotColor: "bg-success",   badgeClass: "bg-success/10 text-success border-success/25" },
    cancelled:       { icon: XCircle,     gradient: "from-error/25 via-error/8 to-transparent",     glow: "shadow-[0_0_60px_rgba(var(--error-rgb),0.18)]",    ringColor: "ring-error/30",    label: "رحلة ملغية",         dotColor: "bg-error",     badgeClass: "bg-error/10 text-error border-error/25" },
  };

  const sc = statusConfig[trip.status] || statusConfig.searching;
  const StatusIcon = sc.icon;
  const isCompleted = trip.status === "completed";
  const isCancelled = trip.status === "cancelled";

  // Build quick-stat metrics
  const quickStats = [
    {
      label: "المسافة",
      value: `${Number(trip.distance_km || 0).toFixed(1)}`,
      unit: "كم",
      icon: Ruler,
      color: "info",
    },
    {
      label: "المدة",
      value: trip.duration_min ? `${Number(trip.duration_min).toFixed(0)}` : "—",
      unit: trip.duration_min ? "دقيقة" : "",
      icon: Timer,
      color: "warning",
    },
    {
      label: "تقييم العميل",
      value: trip.user_rating_to_driver != null ? Number(trip.user_rating_to_driver).toFixed(1) : "—",
      unit: trip.user_rating_to_driver != null ? "/5" : "",
      icon: Star,
      color: "warning",
    },
    {
      label: "الشكاوي",
      value: String(complaints?.length || 0),
      unit: "",
      icon: ShieldAlert,
      color: (complaints?.length || 0) > 0 ? "error" : "success",
    },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ═══════════ CINEMATIC HERO HEADER ═══════════ */}
      <div className={`relative overflow-hidden rounded-2xl border border-divider ${sc.glow} ring-1 ${sc.ringColor}`}>
        {/* Layered gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${sc.gradient} pointer-events-none`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.04),transparent_60%)] pointer-events-none" />
        
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(var(--divider-strong) 1px, transparent 1px), linear-gradient(90deg, var(--divider-strong) 1px, transparent 1px)",
            backgroundSize: "32px 32px"
          }}
        />

        <div className="relative p-6 md:p-8">
          {/* Top row */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div className="flex flex-col gap-3">
              {/* Back link */}
              <Link
                href="/dashboard/trips"
                className="inline-flex items-center gap-2 text-text-tertiary hover:text-text-primary text-[12px] font-bold transition-colors group w-fit"
              >
                <span className="w-6 h-6 rounded-lg bg-surface/60 border border-divider flex items-center justify-center group-hover:bg-surface transition-colors">
                  <ArrowRight size={12} />
                </span>
                {t("trips.backToList")}
              </Link>

              <div className="flex items-center gap-4">
                {/* Status icon bubble */}
                <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center bg-surface/80 border border-divider backdrop-blur-sm shadow-lg`}>
                  <StatusIcon size={22} className="text-text-secondary" />
                  {/* Live pulse dot for active statuses */}
                  {['searching', 'in_progress', 'driver_arriving'].includes(trip.status) && (
                    <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${sc.dotColor} border-2 border-surface`}>
                      <span className={`absolute inset-0 rounded-full ${sc.dotColor} animate-ping opacity-60`} />
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-black text-text-primary tracking-tight">{t("trips.tripDetails")}</h1>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${sc.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dotColor}`} />
                      {getStatusLabel(trip.status, t)}
                    </span>
                  </div>
                  <p className="text-text-tertiary text-[13px] font-medium mt-1">{sc.label}</p>
                </div>
              </div>
            </div>

            {/* Right actions + timestamps */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Timestamps */}
              <div className="px-4 py-3 rounded-xl bg-surface/70 backdrop-blur-sm border border-divider">
                <p className="text-text-disabled text-[10px] font-bold uppercase tracking-wider mb-1">تاريخ الطلب</p>
                <div className="flex items-center gap-1.5 text-text-secondary text-[13px] font-semibold">
                  <Clock size={13} className="text-info shrink-0" />
                  <span className="num">{formatDate(trip.created_at)}</span>
                </div>
              </div>

              {(trip.completed_at || trip.cancelled_at) && (
                <div className="px-4 py-3 rounded-xl bg-surface/70 backdrop-blur-sm border border-divider">
                  <p className="text-text-disabled text-[10px] font-bold uppercase tracking-wider mb-1">
                    {trip.completed_at ? "تاريخ الاكتمال" : "تاريخ الإلغاء"}
                  </p>
                  <div className="flex items-center gap-1.5 text-text-secondary text-[13px] font-semibold">
                    {trip.completed_at
                      ? <CheckCircle size={13} className="text-success shrink-0" />
                      : <XCircle size={13} className="text-error shrink-0" />
                    }
                    <span className="num">{formatDate(trip.completed_at || trip.cancelled_at)}</span>
                  </div>
                </div>
              )}

              {/* Cancel button */}
              {['searching', 'accepted', 'in_progress'].includes(trip.status) && (
                <form action="/api/trips/cancel" method="POST">
                  <input type="hidden" name="trip_id" value={trip.id} />
                  <button
                    type="submit"
                    className="px-4 py-3 rounded-xl text-[12px] font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] bg-error/10 text-error border border-error/25 hover:bg-error/18 hover:border-error/35 hover:shadow-lg"
                  >
                    <XCircle size={14} /> إلغاء الرحلة
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Trip ID row */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/50 border border-divider/60 w-fit">
            <Hash size={11} className="text-text-disabled shrink-0" />
            <span className="text-text-disabled text-[11px] font-mono select-all">{trip.id}</span>
          </div>
        </div>
      </div>

      {/* ═══════════ QUICK STATS ROW ═══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => {
          const Icon = stat.icon;
          const colorMap: Record<string, string> = {
            info: "text-info bg-info/10 border-info/20",
            warning: "text-warning bg-warning/10 border-warning/20",
            error: "text-error bg-error/10 border-error/20",
            success: "text-success bg-success/10 border-success/20",
          };
          const textColorMap: Record<string, string> = {
            info: "text-info",
            warning: "text-warning",
            error: "text-error",
            success: "text-success",
          };
          return (
            <div key={i} className="dash-card p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${colorMap[stat.color]} shrink-0`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-text-tertiary text-[10px] font-bold uppercase tracking-wider mb-0.5">{stat.label}</p>
                <p className={`text-[20px] font-black num leading-none ${textColorMap[stat.color]}`}>
                  {stat.value}
                  {stat.unit && <span className="text-[12px] text-text-tertiary font-semibold mr-1">{stat.unit}</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══════════ MAIN GRID: Route + Financial ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── ROUTE TIMELINE (spans 3 cols) ── */}
        <div className="lg:col-span-3 dash-card overflow-hidden">
          <div className="px-6 py-4 border-b border-divider flex items-center justify-between">
            <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-info/10 border border-info/20">
                <Route size={15} className="text-info" />
              </div>
              مسار الرحلة
            </h3>
            {waypoints.length > 0 && (
              <span className="text-[10px] font-bold bg-info/10 text-info px-2.5 py-1 rounded-lg border border-info/20 flex items-center gap-1">
                <MapPin size={10} />
                متعددة المحطات ({waypoints.length})
              </span>
            )}
          </div>

          <div className="p-6 space-y-3">

            {/* ── ORIGIN CARD ── */}
            <div className="relative group">
              <div className="flex items-stretch gap-4">
                {/* Icon column */}
                <div className="flex flex-col items-center gap-0 shrink-0">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-success/12 border-2 border-success shadow-[0_0_16px_rgba(var(--success-rgb),0.18)] z-10">
                    <CircleDot size={17} className="text-success" />
                  </div>
                  {/* connector */}
                  <div className="w-[2px] flex-1 mt-1" style={{ background: "linear-gradient(to bottom, var(--success), var(--warning))", minHeight: "32px" }} />
                </div>

                {/* Address card */}
                <div className="flex-1 pb-2">
                  <div className="rounded-2xl border border-success/20 bg-gradient-to-br from-success/8 via-success/4 to-transparent p-4 group-hover:border-success/35 transition-all group-hover:shadow-[0_4px_20px_rgba(var(--success-rgb),0.1)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-success uppercase tracking-widest mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />
                          نقطة الانطلاق
                        </span>
                        <p className="text-text-primary text-[14px] font-bold leading-snug">{trip.pickup_address}</p>
                      </div>
                    </div>
                    {trip.created_at && (
                      <div className="mt-3 pt-3 border-t border-success/10 flex items-center gap-1.5 text-[11px] text-text-disabled">
                        <Clock size={11} className="text-success/60" />
                        <span className="num">{formatDate(trip.created_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── DISTANCE / DURATION CONNECTOR CHIP (between origin and first stop/dest) ── */}
            {(trip.distance_km || trip.duration_min) && waypoints.length === 0 && (
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-11 flex justify-center">
                  <div className="w-[2px] h-full" style={{ background: "linear-gradient(to bottom, var(--warning), var(--info))" }} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {trip.distance_km && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-info bg-info/8 border border-info/20 px-3 py-1.5 rounded-full">
                      <Ruler size={11} />
                      {Number(trip.distance_km).toFixed(1)} كم
                    </span>
                  )}
                  {trip.duration_min && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-warning bg-warning/8 border border-warning/20 px-3 py-1.5 rounded-full">
                      <Timer size={11} />
                      {Number(trip.duration_min).toFixed(0)} دقيقة
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ── WAYPOINTS ── */}
            {waypoints.map((wp: any, idx: number) => (
              <div key={wp.id} className="relative group">
                <div className="flex items-stretch gap-4">
                  <div className="flex flex-col items-center gap-0 shrink-0">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-warning/12 border-2 border-warning shadow-[0_0_14px_rgba(var(--warning-rgb),0.15)] z-10">
                      <MapPin size={16} className="text-warning" />
                    </div>
                    <div className="w-[2px] flex-1 mt-1" style={{ background: "linear-gradient(to bottom, var(--warning), var(--info))", minHeight: "32px" }} />
                  </div>

                  <div className="flex-1 pb-2">
                    <div className="rounded-2xl border border-warning/20 bg-gradient-to-br from-warning/8 via-warning/3 to-transparent p-4 group-hover:border-warning/35 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-warning uppercase tracking-widest">
                              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                              محطة {wp.seq_order}{wp.role ? ` — ${wp.role}` : ""}
                            </span>
                            {wp.actual_arrived_at && (
                              <span className="text-[9px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-md border border-success/20 flex items-center gap-0.5">
                                <CheckCircle size={8} /> وصل
                              </span>
                            )}
                          </div>
                          <p className="text-text-primary text-[14px] font-bold leading-snug">
                            {wp.address || `${Number(wp.lat).toFixed(4)}, ${Number(wp.lng).toFixed(4)}`}
                          </p>
                        </div>
                      </div>
                      {wp.actual_arrived_at && (
                        <div className="mt-3 pt-3 border-t border-warning/10 flex items-center gap-1.5 text-[11px] text-text-disabled">
                          <Clock size={11} className="text-warning/60" />
                          <span className="num">{formatDate(wp.actual_arrived_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* ── DESTINATION CARD ── */}
            <div className="relative group">
              <div className="flex items-stretch gap-4">
                <div className="flex flex-col items-center gap-0 shrink-0">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-info/12 border-2 border-info shadow-[0_0_16px_rgba(var(--info-rgb),0.18)] z-10">
                    <Flag size={16} className="text-info" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="rounded-2xl border border-info/20 bg-gradient-to-br from-info/8 via-info/4 to-transparent p-4 group-hover:border-info/35 transition-all group-hover:shadow-[0_4px_20px_rgba(var(--info-rgb),0.1)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-info uppercase tracking-widest mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-info" />
                          الوجهة النهائية
                        </span>
                        <p className="text-text-primary text-[14px] font-bold leading-snug">{trip.destination_address}</p>
                      </div>
                      {trip.status === "completed" && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2 py-1 rounded-lg">
                          <CheckCircle size={10} /> مكتملة
                        </span>
                      )}
                    </div>
                    {trip.completed_at && (
                      <div className="mt-3 pt-3 border-t border-info/10 flex items-center gap-1.5 text-[11px] text-success">
                        <CheckCircle size={11} />
                        <span className="num">{formatDate(trip.completed_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Rating section ── */}
            {trip.user_rating_to_driver != null && (
              <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border border-warning/20">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-text-tertiary text-[10px] font-bold uppercase tracking-wider mb-3">تقييم العميل للسائق</p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          size={22}
                          className={i <= Number(trip.user_rating_to_driver) ? "text-warning" : "text-divider-strong"}
                          fill={i <= Number(trip.user_rating_to_driver) ? "currentColor" : "none"}
                          strokeWidth={i <= Number(trip.user_rating_to_driver) ? 0 : 1.5}
                        />
                      ))}
                      <span className="text-text-primary text-[22px] font-black num mr-1 leading-none">
                        {Number(trip.user_rating_to_driver).toFixed(1)}
                      </span>
                      <span className="text-text-tertiary text-[13px]">/ 5</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-warning/10 border border-warning/25 shrink-0">
                    <Star size={28} className="text-warning" fill="currentColor" strokeWidth={0} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Cancellation Info ── */}
            {(trip.cancel_reason || trip.cancel_reason_category) && (
              <div className="mt-2 p-5 rounded-2xl bg-error/5 border border-error/20">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-error/10 border border-error/25 shrink-0 mt-0.5">
                    <AlertTriangle size={15} className="text-error" />
                  </div>
                  <div className="flex-1">
                    <p className="text-error text-[11px] font-bold uppercase tracking-wider mb-2">سبب الإلغاء</p>
                    {trip.cancel_reason_category && (
                      <span className="inline-block text-[11px] font-bold text-error/80 bg-error/10 px-2.5 py-1 rounded-lg border border-error/20 mb-2">
                        {trip.cancel_reason_category}
                      </span>
                    )}
                    {trip.cancel_reason && (
                      <p className="text-text-secondary text-[13px] leading-relaxed">{trip.cancel_reason}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── FINANCIAL DETAILS (spans 2 cols) ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Main Financial Card */}
          <div className="dash-card flex-1">
            <div className="px-6 py-4 border-b border-divider flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-success/10 border border-success/20">
                <DollarSign size={15} className="text-success" />
              </div>
              <h3 className="text-[14px] font-black text-text-primary">التفاصيل المالية</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Hero total price */}
              <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-success/15 via-success/8 to-transparent border border-success/20">
                <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-success/10 -translate-x-8 -translate-y-8 pointer-events-none" />
                <p className="text-text-tertiary text-[10px] font-bold uppercase tracking-wider mb-1 relative">التكلفة الإجمالية</p>
                <p className="text-[32px] font-black num text-success leading-none relative">{formatCurrency(trip.final_price ?? trip.price, currency)}</p>
                {isCompleted && (
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                    <CheckCircle size={9} /> تم الدفع
                  </span>
                )}
              </div>

              {/* Coupon Discount */}
              {Number(trip.coupon_discount) > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-success/5 border border-success/15">
                  <span className="text-success text-[13px] font-semibold flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
                      <Tag size={13} />
                    </div>
                    خصم الكوبون
                  </span>
                  <span className="text-[16px] font-black num text-success">-{formatCurrency(trip.coupon_discount, currency)}</span>
                </div>
              )}

              {/* Divider row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Distance */}
                <div className="p-4 rounded-xl bg-surface-elevated border border-divider hover:border-divider-strong transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler size={13} className="text-info" />
                    <p className="text-text-tertiary text-[10px] font-bold uppercase tracking-wider">المسافة</p>
                  </div>
                  <p className="text-[20px] font-black num text-text-primary leading-none">
                    {Number(trip.distance_km || 0).toFixed(1)}
                    <span className="text-[11px] text-text-tertiary font-semibold mr-1">كم</span>
                  </p>
                </div>

                {/* Duration */}
                {trip.duration_min && (
                  <div className="p-4 rounded-xl bg-surface-elevated border border-divider hover:border-divider-strong transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer size={13} className="text-warning" />
                      <p className="text-text-tertiary text-[10px] font-bold uppercase tracking-wider">المدة</p>
                    </div>
                    <p className="text-[20px] font-black num text-text-primary leading-none">
                      {Number(trip.duration_min).toFixed(0)}
                      <span className="text-[11px] text-text-tertiary font-semibold mr-1">دقيقة</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-divider">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={13} className="text-color-purple" />
                  <p className="text-text-tertiary text-[10px] font-bold uppercase tracking-wider">طريقة الدفع</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-text-secondary px-3 py-2 rounded-xl bg-surface border border-divider shadow-sm">
                    {trip.payment_method === 'cash'
                      ? <Banknote size={14} className="text-success" />
                      : <Wallet size={14} className="text-info" />
                    }
                    {trip.payment_method === 'cash' ? 'كاش' : 'محفظة'}
                  </span>
                  {trip.payment_source && trip.payment_source !== trip.payment_method && (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-text-secondary px-3 py-2 rounded-xl bg-surface border border-divider shadow-sm">
                      {trip.payment_source === 'wallet'
                        ? <Wallet size={14} className="text-info" />
                        : <Banknote size={14} className="text-success" />
                      }
                      {trip.payment_source === 'wallet' ? 'من المحفظة' : 'نقدي'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Route Plan Summary (if exists) */}
          {activeRoutePlan && (
            <div className="dash-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
                  <Activity size={15} className="text-primary" />
                </div>
                <h4 className="text-[13px] font-black text-text-primary">ملخص خطة المسار</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {activeRoutePlan.total_distance_km && (
                  <div className="text-center p-3 rounded-xl bg-surface-elevated border border-divider">
                    <p className="text-[18px] font-black num text-info">{Number(activeRoutePlan.total_distance_km).toFixed(1)}</p>
                    <p className="text-text-disabled text-[10px] font-bold mt-0.5">إجمالي المسافة (كم)</p>
                  </div>
                )}
                {activeRoutePlan.total_duration_min && (
                  <div className="text-center p-3 rounded-xl bg-surface-elevated border border-divider">
                    <p className="text-[18px] font-black num text-warning">{Number(activeRoutePlan.total_duration_min).toFixed(0)}</p>
                    <p className="text-text-disabled text-[10px] font-bold mt-0.5">إجمالي المدة (دقيقة)</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ PEOPLE CARDS: User + Driver ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── USER (RIDER) CARD ── */}
        <div className="dash-card overflow-hidden">
          <div className="px-6 py-4 border-b border-divider flex items-center justify-between bg-gradient-to-l from-info/5 to-transparent">
            <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-info/10 border border-info/20">
                <User size={15} className="text-info" />
              </div>
              المستخدم (العميل)
            </h3>
            <div className="flex items-center gap-2">
              {user?.is_blocked && (
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-error/10 text-error border border-error/20 flex items-center gap-1">
                  <XCircle size={10} /> محظور
                </span>
              )}
              {user && (
                <Link
                  href={`/dashboard/users/${user.id}`}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-info/8 text-info border border-info/15 flex items-center gap-1 hover:bg-info/15 transition-colors"
                >
                  عرض الملف <ExternalLink size={9} />
                </Link>
              )}
            </div>
          </div>

          {user ? (
            <div className="p-6">
              <div className="flex gap-4 items-start">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-[20px] bg-gradient-to-br from-info/25 to-info/10 text-info border border-info/20">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  {!user.is_blocked && (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-surface flex items-center justify-center">
                      <CheckCircle size={9} className="text-white" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-primary text-[16px] truncate">{user.name}</p>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex items-center gap-2 text-text-tertiary text-[12px]">
                      <Phone size={11} className="shrink-0 text-info" />
                      <span className="num">{user.phone}</span>
                    </div>
                    {user.email && (
                      <div className="flex items-center gap-2 text-text-tertiary text-[12px]">
                        <Mail size={11} className="shrink-0 text-info" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-divider">
                <div className="text-center p-3 rounded-xl bg-surface-elevated border border-divider">
                  <p className="text-warning text-[20px] font-black num flex items-center justify-center gap-1 leading-none">
                    <Star size={14} fill="currentColor" strokeWidth={0} />
                    {Number(user.rating || 0).toFixed(1)}
                  </p>
                  <p className="text-text-disabled text-[10px] font-bold mt-1.5">التقييم</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-surface-elevated border border-divider">
                  <p className="text-text-primary text-[20px] font-black num leading-none">{user.total_trips || 0}</p>
                  <p className="text-text-disabled text-[10px] font-bold mt-1.5">إجمالي الرحلات</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-surface-elevated border border-divider mx-auto mb-3">
                <User size={22} className="text-text-disabled" />
              </div>
              <p className="text-text-disabled text-[13px] font-medium">بيانات المستخدم غير متوفرة</p>
            </div>
          )}
        </div>

        {/* ── DRIVER CARD ── */}
        <div className="dash-card overflow-hidden">
          <div className="px-6 py-4 border-b border-divider flex items-center justify-between bg-gradient-to-l from-success/5 to-transparent">
            <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-success/10 border border-success/20">
                <Car size={15} className="text-success" />
              </div>
              السائق
            </h3>
            <div className="flex items-center gap-2">
              {driver?.is_blocked && (
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-error/10 text-error border border-error/20 flex items-center gap-1">
                  <XCircle size={10} /> محظور
                </span>
              )}
              {driver && (
                <Link
                  href={`/dashboard/drivers/${driver.id}`}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-success/8 text-success border border-success/15 flex items-center gap-1 hover:bg-success/15 transition-colors"
                >
                  عرض الملف <ExternalLink size={9} />
                </Link>
              )}
            </div>
          </div>

          {driver ? (
            <div className="p-6">
              <div className="flex gap-4 items-start">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-[20px] bg-gradient-to-br from-success/25 to-success/10 text-success border border-success/20">
                    {driver.name?.charAt(0)?.toUpperCase()}
                  </div>
                  {!driver.is_blocked && (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-surface flex items-center justify-center">
                      <CheckCircle size={9} className="text-white" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-primary text-[16px] truncate">{driver.name}</p>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex items-center gap-2 text-text-tertiary text-[12px]">
                      <Phone size={11} className="shrink-0 text-success" />
                      <span className="num">{driver.phone}</span>
                    </div>
                    {driver.email && (
                      <div className="flex items-center gap-2 text-text-tertiary text-[12px]">
                        <Mail size={11} className="shrink-0 text-success" />
                        <span className="truncate">{driver.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              {driverProfile && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-l from-warning/8 to-surface-elevated border border-divider flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[24px] shrink-0">{driverProfile.vehicle_type === "car" ? "🚗" : "🏍"}</span>
                    <div className="min-w-0">
                      <p className="text-text-tertiary text-[10px] font-bold uppercase tracking-wider">المركبة</p>
                      <p className="text-text-primary text-[13px] font-semibold truncate">{driverProfile.vehicle_brand} {driverProfile.vehicle_model}</p>
                    </div>
                  </div>
                  <span className="shrink-0 font-black text-[13px] num bg-warning/10 text-warning px-3 py-2 rounded-xl border border-warning/25 tracking-widest">
                    {driverProfile.vehicle_plate}
                  </span>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-divider">
                <div className="text-center p-3 rounded-xl bg-surface-elevated border border-divider">
                  <p className="text-warning text-[20px] font-black num flex items-center justify-center gap-1 leading-none">
                    <Star size={14} fill="currentColor" strokeWidth={0} />
                    {Number(driver.rating || 0).toFixed(1)}
                  </p>
                  <p className="text-text-disabled text-[10px] font-bold mt-1.5">التقييم</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-surface-elevated border border-divider">
                  <p className="text-text-primary text-[20px] font-black num leading-none">{driver.total_trips || 0}</p>
                  <p className="text-text-disabled text-[10px] font-bold mt-1.5">إجمالي الرحلات</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-surface-elevated border border-divider mx-auto mb-3">
                <Car size={22} className="text-text-disabled" />
              </div>
              <p className="text-text-disabled text-[13px] font-medium">لم يتم تعيين سائق أو تم الإلغاء قبل التعيين</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ COMPLAINTS SECTION ═══════════ */}
      {complaints && complaints.length > 0 && (
        <div className="dash-card overflow-hidden border-error/20">
          <div className="px-6 py-4 border-b border-error/12 bg-gradient-to-l from-error/8 to-transparent flex items-center justify-between">
            <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-error/10 border border-error/20">
                <ShieldAlert size={15} className="text-error" />
              </div>
              الشكاوي المرتبطة بهذه الرحلة
            </h3>
            <span className="text-[12px] font-bold text-error bg-error/10 px-3 py-1.5 rounded-xl border border-error/20">
              {complaints.length} شكوى
            </span>
          </div>

          <div className="p-6 space-y-4">
            {complaints.map(comp => (
              <div key={comp.id} className="group relative p-5 rounded-2xl border border-divider bg-surface-elevated/50 hover:border-divider-strong hover:bg-surface-elevated transition-all hover:shadow-md">
                {/* Priority badge (urgent) */}
                {comp.priority === "urgent" && (
                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] font-bold text-error bg-error/10 px-2 py-1 rounded-lg border border-error/20 flex items-center gap-1 animate-pulse">
                      <AlertTriangle size={9} /> عاجل
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start gap-4 mb-3">
                  <h4 className="font-bold text-[14px] text-text-primary flex items-center gap-2">
                    <MessageSquare size={14} className="text-error shrink-0" />
                    {comp.title}
                  </h4>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                    comp.status === "resolved"
                      ? "text-success bg-success/10 border-success/20"
                      : comp.status === "closed"
                      ? "text-text-tertiary bg-surface-muted border-divider"
                      : "text-warning bg-warning/10 border-warning/20"
                  }`}>
                    {comp.status === "resolved" ? "✓ محلولة" : comp.status === "closed" ? "مغلقة" : "● مفتوحة"}
                  </span>
                </div>

                <p className="text-[13px] text-text-secondary leading-relaxed mb-3">{comp.description}</p>

                {comp.admin_reply && (
                  <div className="p-4 rounded-xl bg-success/5 border border-success/15 mb-3">
                    <p className="text-[10px] font-bold text-success uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <CheckCircle size={10} /> رد الإدارة
                    </p>
                    <p className="text-[12px] text-text-secondary leading-relaxed">{comp.admin_reply}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-divider">
                  <span className="text-text-disabled text-[11px] num flex items-center gap-1">
                    <Clock size={10} />
                    {formatDate(comp.created_at)}
                  </span>
                  <Link
                    href={`/dashboard/complaints/${comp.id}`}
                    className="text-[11px] font-bold text-info hover:text-info-light transition-colors flex items-center gap-1.5 group-hover:underline"
                  >
                    عرض تفاصيل الشكوى
                    <ChevronRight size={12} />
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
