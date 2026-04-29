import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { MapPin, Navigation, Clock, Wifi, WifiOff, Hash } from "lucide-react";

export default async function DriverLocationsPage() {
  const supabase = createAdminClient();

  // Fetch driver locations with driver profiles
  const { data: locations } = await supabase
    .from("driver_locations")
    .select("id, driver_id, lat, lng, heading, geohash, created_at, updated_at")
    .order("updated_at", { ascending: false });

  // Fetch driver names
  const driverIds = [...new Set((locations || []).map((l) => l.driver_id).filter(Boolean))];
  const { data: drivers } = driverIds.length
    ? await supabase.from("users").select("id, name, phone").in("id", driverIds)
    : { data: [] };

  const { data: profiles } = driverIds.length
    ? await supabase.from("drivers_profile").select("id, vehicle_type, vehicle_brand, vehicle_model, vehicle_color, vehicle_plate, is_available, is_verified").in("id", driverIds)
    : { data: [] };

  const driverMap = new Map((drivers || []).map((d) => [d.id, d]));
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  // Fetch user_presence for online status
  const { data: presenceData } = await supabase
    .from("user_presence")
    .select("user_id, lat, lng, last_seen");

  const presenceMap = new Map((presenceData || []).map((p) => [p.user_id, p]));

  const now = new Date();
  const isOnline = (userId: string) => {
    const p = presenceMap.get(userId);
    if (!p) return false;
    const diff = now.getTime() - new Date(p.last_seen).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  const onlineCount = (locations || []).filter((l) => isOnline(l.driver_id)).length;
  const totalCount = locations?.length || 0;

  return (
    <div className="space-y-7">
      {/* ===== PAGE HEADER ===== */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">مراقبة</span>
          <span className="w-1 h-1 rounded-full bg-cyan-500/60" />
          <span className="text-[11px] text-text-disabled">مواقع السائقين</span>
        </div>
        <h1 className="page-title">مواقع السائقين</h1>
        <p className="page-subtitle">تتبع مواقع السائقين في الوقت الفعلي</p>
      </div>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "إجمالي المواقع", value: totalCount, color: "#60A5FA", icon: MapPin },
          { label: "متصل الآن", value: onlineCount, color: "#34D399", icon: Wifi },
          { label: "غير متصل", value: totalCount - onlineCount, color: "#F87171", icon: WifiOff },
          { label: "مستخدمين أونلاين", value: presenceData?.length || 0, color: "#A78BFA", icon: Navigation },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl px-4 py-3"
            style={{ background: `${s.color}11`, border: `1px solid ${s.color}22` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={13} style={{ color: s.color }} />
              <span className="text-[10px] text-text-tertiary font-semibold">{s.label}</span>
            </div>
            <div className="text-[22px] font-black num" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ===== DRIVER LOCATIONS TABLE ===== */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--divider)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-[3px] h-5 rounded-full" style={{ background: "linear-gradient(to bottom, #06B6D4, #0891B2)", boxShadow: "0 0 8px rgba(6,182,212,0.5)" }} />
            <h3 className="text-[13px] font-bold text-text-primary">مواقع السائقين المسجلة</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(15,30,53,0.4)", borderBottom: "1px solid var(--divider)" }}>
                {["الحالة", "السائق", "الهاتف", "المركبة", "اللوحة", "الإحداثيات", "الاتجاه", "Geohash", "آخر تحديث"].map((h) => (
                  <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(locations || []).map((loc) => {
                const driver = driverMap.get(loc.driver_id);
                const profile = profileMap.get(loc.driver_id);
                const online = isOnline(loc.driver_id);
                return (
                  <tr key={loc.id} className="group/row table-row-hover" style={{ borderBottom: "1px solid rgba(26,45,71,0.5)" }}>
                    <td className="py-3.5 px-4">
                      <span className="relative flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            background: online ? "#34D399" : "#6B7280",
                            boxShadow: online ? "0 0 8px rgba(52,211,153,0.6)" : "none",
                          }}
                        />
                        <span className="text-[11px] font-semibold" style={{ color: online ? "#34D399" : "#6B7280" }}>
                          {online ? "متصل" : "غير متصل"}
                        </span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[12px] text-text-primary font-medium">{driver?.name || "—"}</td>
                    <td className="py-3.5 px-4 text-[12px] text-text-tertiary num">{driver?.phone || "—"}</td>
                    <td className="py-3.5 px-4 text-[12px] text-text-secondary">
                      {profile ? `${profile.vehicle_brand} ${profile.vehicle_model} - ${profile.vehicle_color}` : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {profile?.vehicle_plate ? (
                        <span className="inline-flex px-2 py-0.5 rounded-lg text-[11px] font-bold font-mono" style={{ background: "rgba(15,30,53,0.8)", color: "#FBBF24", border: "1px solid rgba(245,158,11,0.2)" }}>
                          {profile.vehicle_plate}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-text-tertiary num whitespace-nowrap">
                      {Number(loc.lat).toFixed(4)}, {Number(loc.lng).toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-text-tertiary num">
                      {loc.heading ? `${Number(loc.heading).toFixed(0)}°` : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono text-cyan-400" style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
                        <Hash size={9} />
                        {loc.geohash || "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-tertiary text-[11px] font-medium whitespace-nowrap">
                      {loc.updated_at ? formatDate(loc.updated_at) : "—"}
                    </td>
                  </tr>
                );
              })}

              {(!locations || locations.length === 0) && (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-text-disabled">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(15,30,53,0.8)", border: "1px solid var(--divider)" }}>
                        <MapPin size={24} className="opacity-40" />
                      </div>
                      <p className="text-text-secondary font-semibold">لا توجد مواقع مسجلة</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== USER PRESENCE TABLE ===== */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--divider)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-[3px] h-5 rounded-full" style={{ background: "linear-gradient(to bottom, #A78BFA, #7C3AED)", boxShadow: "0 0 8px rgba(167,139,250,0.5)" }} />
            <div>
              <h3 className="text-[13px] font-bold text-text-primary">المستخدمين المتصلين (User Presence)</h3>
              <p className="text-[10px] text-text-tertiary">{presenceData?.length || 0} مستخدم نشط</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(15,30,53,0.4)", borderBottom: "1px solid var(--divider)" }}>
                {["الحالة", "المستخدم", "الإحداثيات", "آخر ظهور"].map((h) => (
                  <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(presenceData || []).map((p) => {
                const online = (now.getTime() - new Date(p.last_seen).getTime()) < 5 * 60 * 1000;
                const user = driverMap.get(p.user_id);
                return (
                  <tr key={p.user_id} className="group/row table-row-hover" style={{ borderBottom: "1px solid rgba(26,45,71,0.5)" }}>
                    <td className="py-3.5 px-4">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: online ? "#34D399" : "#6B7280", boxShadow: online ? "0 0 8px rgba(52,211,153,0.6)" : "none" }} />
                    </td>
                    <td className="py-3.5 px-4 text-[12px] text-text-primary font-medium">{user?.name || p.user_id.substring(0, 8) + "..."}</td>
                    <td className="py-3.5 px-4 text-[11px] text-text-tertiary num whitespace-nowrap">
                      {Number(p.lat).toFixed(4)}, {Number(p.lng).toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-text-tertiary text-[11px] font-medium whitespace-nowrap">
                      {formatDate(p.last_seen)}
                    </td>
                  </tr>
                );
              })}
              {(!presenceData || presenceData.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-text-disabled text-[13px]">لا توجد بيانات حضور</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
