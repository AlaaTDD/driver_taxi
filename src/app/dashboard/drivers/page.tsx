import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/badge";
import DriversClient from "./drivers-client";
import { getTranslations } from "next-intl/server";
import { Car, CheckCircle, Clock, ShieldBan, AlertCircle, Star } from "lucide-react";
import Link from "next/link";

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

  const t = await getTranslations();
  const supabase = createAdminClient();

  
  const [pendingRes, approvedRes, blockedRes, revisionRes] = await Promise.all([
    supabase.from("drivers_profile").select("id", { count: "exact", head: true }).eq("is_verified", false),
    supabase.from("drivers_profile").select("id", { count: "exact", head: true }).eq("is_verified", true),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "driver").eq("is_blocked", true),
    supabase.from("driver_revision_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  
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
    { key: "pending", label: t("drivers.tabs.pending"), count: pendingRes.count || 0, icon: <Clock size={14} /> },
    { key: "approved", label: t("drivers.tabs.approved"), count: approvedRes.count || 0, icon: <CheckCircle size={14} /> },
    { key: "blocked", label: t("drivers.tabs.blocked"), count: blockedRes.count || 0, icon: <ShieldBan size={14} /> },
    { key: "revision", label: t("drivers.tabs.revision"), count: revisionRes.count || 0, icon: <AlertCircle size={14} /> },
  ];

  return (
    <>
      <div className="space-y-6">
        
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("drivers.title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("drivers.subtitle")}</p>
        </div>

      
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/dashboard/drivers?tab=${t.key}`}
            id={`drivers-tab-${t.key}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200"
            style={tab === t.key ? {
              background: "var(--accent-surface)",
              border: "1px solid var(--accent-border)",
              color: "var(--primary)",
              boxShadow: "0 4px 12px rgba(var(--primary-rgb),0.14)",
            } : {
              background: "var(--surface-elevated)",
              border: "1px solid var(--divider)",
              color: "var(--text-tertiary)",
            }}
          >
            {t.icon}
            {t.label}
            {t.count > 0 && (
              <span className="min-w-[20px] h-5 rounded-full text-[10px] font-black flex items-center justify-center px-1.5"
                style={{
                  background: tab === t.key ? "var(--primary)" : "var(--surface-elevated)",
                  color: tab === t.key ? "white" : "var(--text-tertiary)",
                  border: tab === t.key ? "none" : "1px solid var(--divider)",
                }}>
                {t.count}
              </span>
            )}
          </a>
        ))}
      </div>

      
      {tab !== "revision" ? (
        <div className="dash-table-card">

          
          <div className="dash-section-header justify-between">
            <div className="flex items-center gap-2.5 flex-1">
              <div className="w-[3px] h-5 rounded-full"
                style={{ background: "linear-gradient(to bottom, var(--primary), transparent)", boxShadow: "0 0 8px rgba(var(--primary-rgb),0.35)" }} />
              <h3 className="text-[13px] font-bold text-text-primary">{tabs.find(t => t.key === tab)?.label}</h3>
              <span className="text-text-disabled text-[11px]">({driversCount || 0})</span>
            </div>
            <DriversClient tab={tab} currentPage={page} totalPages={totalPages} searchQuery={searchQuery} />
          </div>

          
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="dash-table-head">
                  {[t("common.driver"), t("common.vehicle"), t("drivers.documents"), t("common.trips"), t("drivers.rating"), t("common.status"), t("common.actions")].map(h => (
                    <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(driversRaw || []).map((driver) => {
                  
                  const user = (driver as any).users;
                  return (
                    <tr key={driver.id} className="group/row dash-table-row">
                      
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black shrink-0"
                            style={{
                              background: driver.is_verified ? "var(--success-surface)" : "var(--warning-surface)",
                              color: driver.is_verified ? "var(--success)" : "var(--warning)",
                              border: "1px solid var(--divider)",
                            }}>
                            {user?.name?.charAt(0)?.toUpperCase() || "D"}
                          </div>
                          <div>
                            <p className="font-bold text-text-primary text-[13px]">{user?.name}</p>
                            <p className="text-text-disabled text-[11px] num">{user?.phone}</p>
                          </div>
                        </div>
                      </td>

                      
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Car size={11} className="text-text-disabled shrink-0" />
                          <span className="text-text-secondary text-[12px]">
                            {driver.vehicle_brand} {driver.vehicle_model} — {driver.vehicle_type === "car" ? "🚗" : "🏍"}
                          </span>
                        </div>
                        <p className="text-text-disabled text-[11px] mt-0.5 num">{driver.vehicle_plate}</p>
                      </td>

                      
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {[
                            { label: t("drivers.docs.id"), url: driver.national_id_image_url },
                            { label: t("drivers.docs.license"), url: driver.license_image_url },
                            { label: t("drivers.docs.record"), url: driver.criminal_record_url },
                            { label: t("drivers.docs.vehicle"), url: driver.vehicle_image_url },
                          ].map((doc) => (
                            <a key={doc.label} href={doc.url} target="_blank" rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                              style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}>
                              {doc.label}
                            </a>
                          ))}
                        </div>
                      </td>

                      
                      <td className="py-3 px-4 text-text-secondary font-bold text-[13px] num">{user?.total_trips ?? 0}</td>

                      
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Star size={11} style={{ color: "var(--warning)" }} />
                          <span className="font-bold text-[13px] num" style={{ color: "var(--warning)" }}>{user?.rating ?? "—"}</span>
                        </div>
                      </td>

                      
                      <td className="py-3 px-4">
                        <Badge variant={driver.is_verified ? "success" : "warning"} dot>
                          {driver.is_verified ? t("drivers.verified") : t("drivers.pending")}
                        </Badge>
                      </td>

                      
                      <td className="py-3 px-4">
                        <div className="flex gap-2 items-center transition-opacity">
                          {!driver.is_verified && (
                            <form action="/api/drivers/verify" method="POST">
                              <input type="hidden" name="driver_id" value={driver.id} />
                              <button type="submit" id={`verify-driver-${driver.id}`}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white"
                                style={{ background: "linear-gradient(135deg,var(--primary),var(--primary-dark))", boxShadow: "0 3px 8px rgba(var(--primary-rgb),0.3)" }}>
                                {t("drivers.verify")}
                              </button>
                            </form>
                          )}
                          {driver.is_verified && (
                            <form action="/api/drivers/revoke" method="POST">
                              <input type="hidden" name="driver_id" value={driver.id} />
                              <button type="submit" id={`revoke-driver-${driver.id}`}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
                                style={{ background: "var(--error-surface)", color: "var(--error)", border: "1px solid var(--error-border)" }}>
                                {t("common.cancel")}
                              </button>
                            </form>
                          )}
                          <Link href={`/dashboard/drivers/${driver.id}`}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-opacity hover:opacity-80"
                            style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}>
                            {t("common.details")}
                          </Link>
                          <DriversRevisionButton driverId={driver.id} driverName={user?.name} label={t("drivers.requestRevision")} />
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {(!driversRaw || driversRaw.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-text-disabled">
                      <Car size={32} className="mx-auto mb-3 opacity-30" />
                      <p>{t("drivers.noDrivers")}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          
          <div className="md:hidden divide-y" style={{ borderColor: "var(--divider)" }}>
            {(driversRaw || []).map((driver) => {
              
              const user = (driver as any).users;
              return (
                <div key={driver.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black"
                        style={{ background: driver.is_verified ? "var(--success-surface)" : "var(--warning-surface)", color: driver.is_verified ? "var(--success)" : "var(--warning)" }}>
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
                      { label: t("drivers.docs.id"), url: driver.national_id_image_url },
                      { label: t("drivers.docs.license"), url: driver.license_image_url },
                      { label: t("drivers.docs.record"), url: driver.criminal_record_url },
                      { label: t("drivers.docs.vehicle"), url: driver.vehicle_image_url },
                    ].map((doc) => (
                      <a key={doc.label} href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="px-2 py-1 rounded-lg text-[10px] font-bold"
                        style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}>
                        {doc.label}
                      </a>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {!driver.is_verified && (
                      <form action="/api/drivers/verify" method="POST" className="flex-1">
                        <input type="hidden" name="driver_id" value={driver.id} />
                        <button className="w-full py-2 rounded-xl text-[12px] font-bold text-white"
                          style={{ background: "linear-gradient(135deg,var(--primary),var(--primary-dark))" }}>اعتماد</button>
                      </form>
                    )}
                    {driver.is_verified && (
                      <form action="/api/drivers/revoke" method="POST" className="flex-1">
                        <input type="hidden" name="driver_id" value={driver.id} />
                        <button className="w-full py-2 rounded-xl text-[12px] font-bold"
                          style={{ background: "var(--error-surface)", color: "var(--error)", border: "1px solid var(--error-border)" }}>إلغاء الاعتماد</button>
                      </form>
                    )}
                    <div className="flex-1">
                      <DriversRevisionButton driverId={driver.id} driverName={user?.name} label={t("drivers.requestRevision")} mobile />
                    </div>
                    <div className="flex-1">
                      <Link href={`/dashboard/drivers/${driver.id}`}
                        className="flex items-center justify-center w-full py-2 rounded-xl text-[12px] font-bold transition-opacity hover:opacity-80"
                        style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}>
                        التفاصيل
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        
        <div className="dash-card">
          <div className="dash-section-header">
            <h3 className="text-[13px] font-bold text-text-primary">{t("drivers.revisionRequests")}</h3>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
            {revisionDrivers.map((rev: unknown) => {
              
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

                  <div className="p-3 rounded-xl" style={{ background: "var(--accent-surface)", border: "1px solid var(--accent-border)" }}>
                    <p className="text-[12px] font-bold text-primary mb-1">{t("drivers.requestedFields")}:</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {(r.fields_requested || []).map((f: string) => (
                        <span key={f} className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                          style={{ background: "var(--accent-surface-strong)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}>
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
                        style={{ background: "linear-gradient(135deg,var(--primary),var(--primary-dark))" }}>
                        قبول وتأكيد
                      </button>
                    </form>
                    <form action="/api/drivers/revoke" method="POST">
                      <input type="hidden" name="driver_id" value={user?.id} />
                      <button type="submit" className="px-4 py-2 rounded-xl text-[12px] font-bold"
                        style={{ background: "var(--error-surface)", color: "var(--error)", border: "1px solid var(--error-border)" }}>
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
                <p>{t("drivers.noRevisionRequests")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}


function DriversRevisionButton({ driverId, driverName, label, mobile }: { driverId: string; driverName: string; label: string; mobile?: boolean }) {
  return (
    <a
      href={`/dashboard/drivers/revision?driver_id=${driverId}&name=${encodeURIComponent(driverName)}`}
      id={`request-revision-${driverId}`}
      className={`flex items-center justify-center gap-1 rounded-lg text-[11px] font-bold transition-all hover:opacity-80 ${mobile ? "w-full py-2" : "px-3 py-1.5"}`}
      style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}
    >
      <AlertCircle size={10} />
      {label}
    </a>
  );
}
