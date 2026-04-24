import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/badge";
import DriversClient from "./drivers-client";
import { Car, CheckCircle, Clock, ShieldBan, AlertCircle, Star } from "lucide-react";

type TabType = "pending" | "approved" | "blocked" | "revision";

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const tab = (params.tab as TabType) || "pending";
  const page = Number(params.page) || 1;
  const pageSize = 10;
  const searchQuery = params.q || "";

  const supabase = createAdminClient();

  // Stats counts
  const [pendingRes, approvedRes, blockedRes, revisionRes] = await Promise.all([
    supabase.from("drivers_profile").select("id", { count: "exact", head: true }).eq("is_verified", false),
    supabase.from("drivers_profile").select("id", { count: "exact", head: true }).eq("is_verified", true),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "driver").eq("is_blocked", true),
    supabase.from("driver_revision_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  // Fetch drivers based on tab
  let driversQuery = supabase
    .from("drivers_profile")
    .select(`
      id, national_id, national_id_image_url,
      license_number, license_image_url,
      criminal_record_url, vehicle_type, vehicle_brand,
      vehicle_model, vehicle_year, vehicle_color, vehicle_plate,
      vehicle_image_url, is_verified, is_available,
      users!inner(id, name, phone, email, rating, total_trips, is_active, is_blocked, created_at)
    `, { count: "exact" });

  if (searchQuery) {
    driversQuery = driversQuery.or(`national_id.ilike.%${searchQuery}%,license_number.ilike.%${searchQuery}%,vehicle_plate.ilike.%${searchQuery}%,users.name.ilike.%${searchQuery}%,users.phone.ilike.%${searchQuery}%`);
  }

  if (tab === "approved") {
    driversQuery = driversQuery.eq("is_verified", true);
  } else if (tab === "pending") {
    driversQuery = driversQuery.eq("is_verified", false);
  } else if (tab === "blocked") {
    driversQuery = driversQuery.eq("users.is_blocked", true);
  }

  const { data: driversRaw, count: driversCount } = await driversQuery
    .order("users(created_at)", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  // For revision tab, fetch revision requests separately
  let revisionDrivers: unknown[] = [];
  if (tab === "revision") {
    const { data } = await supabase
      .from("driver_revision_requests")
      .select(`
        id, fields_requested, message, status, created_at,
        users!driver_id(id, name, phone, email),
        drivers_profile!driver_id(national_id, vehicle_type, vehicle_brand, vehicle_plate, national_id_image_url, license_image_url)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    revisionDrivers = data || [];
  }

  const totalPages = Math.ceil(((tab === "revision" ? revisionRes.count : driversCount) || 0) / pageSize);

  const tabs = [
    { key: "pending", label: "بانتظار الاعتماد", count: pendingRes.count || 0, icon: <Clock size={14} />, color: "#F59E0B" },
    { key: "approved", label: "معتمدون", count: approvedRes.count || 0, icon: <CheckCircle size={14} />, color: "#10B981" },
    { key: "blocked", label: "محظورون", count: blockedRes.count || 0, icon: <ShieldBan size={14} />, color: "#EF4444" },
    { key: "revision", label: "يحتاج مراجعة", count: revisionRes.count || 0, icon: <AlertCircle size={14} />, color: "#8B5CF6" },
  ];

  return (
    <div className="space-y-6">

      {/* ===== PAGE HEADER ===== */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">إدارة</span>
          <span className="w-1 h-1 rounded-full bg-green-500/60" />
          <span className="text-[11px] text-text-disabled">السائقون</span>
        </div>
        <h1 className="page-title">إدارة السائقين</h1>
        <p className="page-subtitle">اعتماد السائقين وإدارة ملفاتهم وطلب مراجعة الوثائق</p>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/dashboard/drivers?tab=${t.key}`}
            id={`drivers-tab-${t.key}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200"
            style={tab === t.key ? {
              background: `linear-gradient(135deg, ${t.color}25, ${t.color}12)`,
              border: `1px solid ${t.color}35`,
              color: t.color,
              boxShadow: `0 4px 12px ${t.color}15`,
            } : {
              background: "rgba(15,30,53,0.5)",
              border: "1px solid var(--divider)",
              color: "var(--text-tertiary)",
            }}
          >
            {t.icon}
            {t.label}
            {t.count > 0 && (
              <span className="min-w-[20px] h-5 rounded-full text-[10px] font-black flex items-center justify-center px-1.5"
                style={{
                  background: tab === t.key ? t.color : "rgba(15,30,53,0.8)",
                  color: tab === t.key ? "white" : "var(--text-tertiary)",
                  border: tab === t.key ? "none" : "1px solid var(--divider)",
                }}>
                {t.count}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* ===== DRIVERS TABLE ===== */}
      {tab !== "revision" ? (
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
            border: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
          }}>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
            style={{ borderBottom: "1px solid var(--divider)" }}>
            <div className="flex items-center gap-2.5 flex-1">
              <div className="w-[3px] h-5 rounded-full"
                style={{ background: `linear-gradient(to bottom, ${tabs.find(t => t.key === tab)?.color || "#3B82F6"}, transparent)`, boxShadow: `0 0 8px ${tabs.find(t => t.key === tab)?.color || "#3B82F6"}50` }} />
              <h3 className="text-[13px] font-bold text-text-primary">{tabs.find(t => t.key === tab)?.label}</h3>
              <span className="text-text-disabled text-[11px]">({driversCount || 0})</span>
            </div>
            <DriversClient tab={tab} currentPage={page} totalPages={totalPages} searchQuery={searchQuery} />
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(15,30,53,0.4)", borderBottom: "1px solid var(--divider)" }}>
                  {["السائق", "المركبة", "الوثائق", "الرحلات", "التقييم", "الحالة", "إجراءات"].map(h => (
                    <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(driversRaw || []).map((driver) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const user = (driver as any).users;
                  return (
                    <tr key={driver.id} className="group/row table-row-hover" style={{ borderBottom: "1px solid rgba(26,45,71,0.5)" }}>
                      {/* Driver info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black flex-shrink-0"
                            style={{
                              background: driver.is_verified ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.12)",
                              color: driver.is_verified ? "#34D399" : "#FCD34D",
                              border: "1px solid rgba(255,255,255,0.05)",
                            }}>
                            {user?.name?.charAt(0)?.toUpperCase() || "D"}
                          </div>
                          <div>
                            <p className="font-bold text-text-primary text-[13px]">{user?.name}</p>
                            <p className="text-text-disabled text-[11px] num">{user?.phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Car size={11} className="text-text-disabled flex-shrink-0" />
                          <span className="text-text-secondary text-[12px]">
                            {driver.vehicle_brand} {driver.vehicle_model} — {driver.vehicle_type === "car" ? "🚗" : "🏍"}
                          </span>
                        </div>
                        <p className="text-text-disabled text-[11px] mt-0.5 num">{driver.vehicle_plate}</p>
                      </td>

                      {/* Documents */}
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {[
                            { label: "هوية", url: driver.national_id_image_url },
                            { label: "رخصة", url: driver.license_image_url },
                            { label: "سجل", url: driver.criminal_record_url },
                            { label: "مركبة", url: driver.vehicle_image_url },
                          ].map((doc) => (
                            <a key={doc.label} href={doc.url} target="_blank" rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                              style={{ background: "rgba(59,130,246,0.12)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.2)" }}>
                              {doc.label}
                            </a>
                          ))}
                        </div>
                      </td>

                      {/* Trips */}
                      <td className="py-3 px-4 text-text-secondary font-bold text-[13px] num">{user?.total_trips ?? 0}</td>

                      {/* Rating */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Star size={11} className="text-amber-400" />
                          <span className="font-bold text-[13px] num" style={{ color: "#FCD34D" }}>{user?.rating ?? "—"}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <Badge variant={driver.is_verified ? "success" : "warning"} dot>
                          {driver.is_verified ? "معتمد" : "بانتظار"}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex gap-2 items-center transition-opacity">
                          {!driver.is_verified && (
                            <form action="/api/drivers/verify" method="POST">
                              <input type="hidden" name="driver_id" value={driver.id} />
                              <button type="submit" id={`verify-driver-${driver.id}`}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white"
                                style={{ background: "linear-gradient(135deg,#10B981,#059669)", boxShadow: "0 3px 8px rgba(16,185,129,0.3)" }}>
                                اعتماد
                              </button>
                            </form>
                          )}
                          {driver.is_verified && (
                            <form action="/api/drivers/revoke" method="POST">
                              <input type="hidden" name="driver_id" value={driver.id} />
                              <button type="submit" id={`revoke-driver-${driver.id}`}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
                                style={{ background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                                إلغاء
                              </button>
                            </form>
                          )}
                          <DriversRevisionButton driverId={driver.id} driverName={user?.name} />
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {(!driversRaw || driversRaw.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-text-disabled">
                      <Car size={32} className="mx-auto mb-3 opacity-30" />
                      <p>لا توجد سائقون في هذه الفئة</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y" style={{ borderColor: "var(--divider)" }}>
            {(driversRaw || []).map((driver) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const user = (driver as any).users;
              return (
                <div key={driver.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black"
                        style={{ background: driver.is_verified ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.12)", color: driver.is_verified ? "#34D399" : "#FCD34D" }}>
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-text-primary">{user?.name}</p>
                        <p className="text-text-disabled text-[11px] num">{user?.phone}</p>
                      </div>
                    </div>
                    <Badge variant={driver.is_verified ? "success" : "warning"} dot>
                      {driver.is_verified ? "معتمد" : "بانتظار"}
                    </Badge>
                  </div>
                  <p className="text-text-tertiary text-[12px]">
                    {driver.vehicle_brand} {driver.vehicle_model} — {driver.vehicle_plate}
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { label: "هوية", url: driver.national_id_image_url },
                      { label: "رخصة", url: driver.license_image_url },
                      { label: "سجل", url: driver.criminal_record_url },
                      { label: "مركبة", url: driver.vehicle_image_url },
                    ].map((doc) => (
                      <a key={doc.label} href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="px-2 py-1 rounded-lg text-[10px] font-bold"
                        style={{ background: "rgba(59,130,246,0.12)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.2)" }}>
                        {doc.label}
                      </a>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {!driver.is_verified && (
                      <form action="/api/drivers/verify" method="POST" className="flex-1">
                        <input type="hidden" name="driver_id" value={driver.id} />
                        <button className="w-full py-2 rounded-xl text-[12px] font-bold text-white"
                          style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>اعتماد</button>
                      </form>
                    )}
                    {driver.is_verified && (
                      <form action="/api/drivers/revoke" method="POST" className="flex-1">
                        <input type="hidden" name="driver_id" value={driver.id} />
                        <button className="w-full py-2 rounded-xl text-[12px] font-bold"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>إلغاء الاعتماد</button>
                      </form>
                    )}
                    <div className="flex-1">
                      <DriversRevisionButton driverId={driver.id} driverName={user?.name} mobile />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* REVISION TAB */
        <div className="rounded-2xl overflow-hidden" style={{
          background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--divider)" }}>
            <h3 className="text-[13px] font-bold text-text-primary">طلبات المراجعة المعلقة</h3>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
            {revisionDrivers.map((rev: unknown) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const r = rev as any;
              const user = r.users;
              const dp = r.drivers_profile;
              return (
                <div key={r.id} className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-text-primary">{user?.name}</span>
                        <span className="text-[11px] text-text-disabled num">{user?.phone}</span>
                      </div>
                      <p className="text-text-tertiary text-[12px]">{dp?.vehicle_type === "car" ? "🚗" : "🏍"} {dp?.vehicle_brand} — {dp?.vehicle_plate}</p>
                    </div>
                    <span className="text-[11px] text-text-disabled">{formatDate(r.created_at)}</span>
                  </div>

                  <div className="p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                    <p className="text-[12px] font-bold text-purple-300 mb-1">الحقول المطلوبة:</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {(r.fields_requested || []).map((f: string) => (
                        <span key={f} className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                          style={{ background: "rgba(139,92,246,0.15)", color: "#C4B5FD", border: "1px solid rgba(139,92,246,0.2)" }}>
                          {f}
                        </span>
                      ))}
                    </div>
                    <p className="text-text-secondary text-[12px] mt-2">{r.message}</p>
                  </div>

                  <div className="flex gap-2">
                    <form action="/api/drivers/verify" method="POST">
                      <input type="hidden" name="driver_id" value={user?.id} />
                      <button type="submit" className="px-4 py-2 rounded-xl text-[12px] font-bold text-white"
                        style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
                        قبول وتأكيد
                      </button>
                    </form>
                    <form action="/api/drivers/revoke" method="POST">
                      <input type="hidden" name="driver_id" value={user?.id} />
                      <button type="submit" className="px-4 py-2 rounded-xl text-[12px] font-bold"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                        رفض
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
            {revisionDrivers.length === 0 && (
              <div className="py-16 text-center text-text-disabled">
                <CheckCircle size={32} className="mx-auto mb-3 opacity-30" />
                <p>لا توجد طلبات مراجعة معلقة</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Mini component for revision request button
function DriversRevisionButton({ driverId, driverName, mobile }: { driverId: string; driverName: string; mobile?: boolean }) {
  return (
    <a
      href={`/dashboard/drivers/revision?driver_id=${driverId}&name=${encodeURIComponent(driverName)}`}
      id={`request-revision-${driverId}`}
      className={`flex items-center justify-center gap-1 rounded-lg text-[11px] font-bold transition-all hover:opacity-80 ${mobile ? "w-full py-2" : "px-3 py-1.5"}`}
      style={{ background: "rgba(139,92,246,0.1)", color: "#C4B5FD", border: "1px solid rgba(139,92,246,0.2)" }}
    >
      <AlertCircle size={10} />
      طلب مراجعة
    </a>
  );
}
