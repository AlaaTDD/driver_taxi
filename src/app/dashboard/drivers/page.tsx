import { createAdminClient } from "@/lib/supabase/server";
import { Badge } from "@/components/badge";
import DriversClient from "./drivers-client";
import { getTranslations } from "next-intl/server";
import {
  Car, CheckCircle, Clock, ShieldBan, AlertCircle,
  Star, FileWarning, Search,
} from "lucide-react";
import Link from "next/link";
import { DriverActions, DriverCardActions } from "./_components/driver-actions";
import { RevisionActions } from "./_components/revision-actions";
import { DriversTabs } from "./_components/drivers-tabs";
import { getDriverStatus, getAvatarStyle } from "./_lib/status-style";

// Force fresh data on every navigation — driver state (verified/blocked)
// changes often and must never be served from a stale render.
export const dynamic = "force-dynamic";

type TabType = "pending" | "approved" | "blocked" | "revision";

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const tab = (params.tab as TabType) || "pending";
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 12;
  const searchQuery = (params.q || "").trim();

  const t = await getTranslations();
  const supabase = createAdminClient();

  /* ═══════════════════════════════════════════════════════════════════════
     DRIVERS WITH ACTIVE REVISION REQUESTS
     These drivers are "under review" and must be EXCLUDED from the pending,
     approved, and blocked counts AND list queries. Their status is distinct.
     ═══════════════════════════════════════════════════════════════════════ */
  const { data: revisionRows } = await supabase
    .from("driver_revision_requests")
    .select("driver_id")
    .eq("status", "pending");
  const revisionDriverIds = [...new Set((revisionRows || []).map((r: any) => r.driver_id))];
  const revisionExclusion = revisionDriverIds.length > 0 ? revisionDriverIds.join(",") : "00000000-0000-0000-0000-000000000000";

  /* ═══════════════════════════════════════════════════════════════════════
     ACCURATE TAB COUNTS
     Mutually exclusive by design:
       • pending   = not verified, not blocked, NOT in revision
       • approved  = verified,     not blocked, NOT in revision
       • blocked   = blocked (regardless of verified), NOT in revision
       • revision  = has an active revision request (pending status)
     A driver appears in exactly ONE tab — counts always add up.
     ═══════════════════════════════════════════════════════════════════════ */
  const [pendingRes, approvedRes, blockedRes, revisionRes] = await Promise.all([
    // pending: is_verified=false AND not blocked AND not in revision
    supabase
      .from("drivers_profile")
      .select("id, users!inner(is_blocked)", { count: "exact", head: true })
      .eq("is_verified", false)
      .eq("users.is_blocked", false)
      .not("id", "in", `(${revisionExclusion})`),
    // approved: is_verified=true AND not blocked AND not in revision
    supabase
      .from("drivers_profile")
      .select("id, users!inner(is_blocked)", { count: "exact", head: true })
      .eq("is_verified", true)
      .eq("users.is_blocked", false)
      .not("id", "in", `(${revisionExclusion})`),
    // blocked: is_blocked=true AND not in revision
    supabase
      .from("drivers_profile")
      .select("id, users!inner(is_blocked)", { count: "exact", head: true })
      .eq("users.is_blocked", true)
      .not("id", "in", `(${revisionExclusion})`),
    // revision: count of pending revision requests
    supabase
      .from("driver_revision_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const pendingCount = pendingRes.count ?? 0;
  const approvedCount = approvedRes.count ?? 0;
  const blockedCount = blockedRes.count ?? 0;
  const revisionCount = revisionRes.count ?? 0;

  /* ═══════════════════════════════════════════════════════════════════════
     DRIVERS LIST (non-revision tabs) — applies the SAME filters as the counts
     so the list length always matches the tab badge number.
     ═══════════════════════════════════════════════════════════════════════ */
  let driversQuery = supabase.from("drivers_profile").select(
    `id, national_id, national_id_image_url,
      license_number, license_image_url,
      criminal_record_url, vehicle_type, vehicle_brand,
      vehicle_model, vehicle_year, vehicle_color, vehicle_plate,
      vehicle_image_url, is_verified, is_available,
      users!inner(id, name, phone, email, rating, total_trips, is_active, is_blocked, role, created_at)`,
    { count: "exact" },
  );

  if (searchQuery) {
    const safeSearch = searchQuery.replace(/[%_\\]/g, "\\$&");
    driversQuery = driversQuery.or(
      `national_id.ilike.%${safeSearch}%,license_number.ilike.%${safeSearch}%,vehicle_plate.ilike.%${safeSearch}%,users.name.ilike.%${safeSearch}%,users.phone.ilike.%${safeSearch}%`,
    );
  }

  if (tab === "approved") {
    driversQuery = driversQuery.eq("is_verified", true).eq("users.is_blocked", false);
  } else if (tab === "pending") {
    driversQuery = driversQuery.eq("is_verified", false).eq("users.is_blocked", false);
  } else if (tab === "blocked") {
    driversQuery = driversQuery.eq("users.is_blocked", true);
  }

  // Exclude revision drivers from all non-revision tabs
  driversQuery = driversQuery.not("id", "in", `(${revisionExclusion})`);

  const { data: driversRaw, count: driversCount } = await driversQuery
    .order("is_verified", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  /* ═══════════════════════════════════════════════════════════════════════
     REVISION REQUESTS (revision tab)
     ═══════════════════════════════════════════════════════════════════════ */
  let revisionDrivers: Record<string, unknown>[] = [];
  if (tab === "revision") {
    let revQuery = supabase
      .from("driver_revision_requests")
      .select(
        `id, fields_requested, message, status, created_at, driver_id,
        users!driver_id(id, name, phone, email)`,
      )
      .eq("status", "pending");

    if (searchQuery) {
      const safeSearch = searchQuery.replace(/[%_\\]/g, "\\$&");
      revQuery = revQuery.or(
        `users.name.ilike.%${safeSearch}%,users.phone.ilike.%${safeSearch}%`,
      );
    }

    const { data: revData } = await revQuery
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (revData && revData.length > 0) {
      const driverIds = [...new Set(revData.map((r: any) => r.driver_id))];
      const { data: profiles } = await supabase
        .from("drivers_profile")
        .select(
          "id, national_id, vehicle_type, vehicle_brand, vehicle_plate, national_id_image_url, license_image_url, criminal_record_url, vehicle_image_url, is_verified",
        )
        .in("id", driverIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      revisionDrivers = revData.map((r: any) => ({
        ...r,
        drivers_profile: profileMap.get(r.driver_id) || null,
      })) as Record<string, unknown>[];
    }
  }

  const listCount = tab === "revision" ? revisionCount : driversCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(listCount / pageSize));

  const tabs = [
    { key: "pending" as const, label: t("drivers.tabs.pending"), count: pendingRes.count || 0, icon: <Clock size={14} /> },
    { key: "approved" as const, label: t("drivers.tabs.approved"), count: approvedRes.count || 0, icon: <CheckCircle size={14} /> },
    { key: "blocked" as const, label: t("drivers.tabs.blocked"), count: blockedRes.count || 0, icon: <ShieldBan size={14} /> },
    { key: "revision" as const, label: t("drivers.tabs.revision"), count: revisionRes.count || 0, icon: <AlertCircle size={14} /> },
  ];

  // Documents rendered as chips; missing URLs are rendered disabled.
  const docList = (driver: any) => [
    { label: t("drivers.docs.id"), url: driver.national_id_image_url },
    { label: t("drivers.docs.license"), url: driver.license_image_url },
    { label: t("drivers.docs.record"), url: driver.criminal_record_url },
    { label: t("drivers.docs.vehicle"), url: driver.vehicle_image_url },
  ];

  return (
    <div className="space-y-5">

      {/* ═══════════════════════════════════════════════════════════════════════
         PAGE HEADER — title + tab dropdown in one line
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="dash-page-header items-center">
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--accent-surface), var(--accent-surface-strong))",
              border: "1px solid var(--accent-border)",
              boxShadow: "0 4px 14px rgba(var(--primary-rgb), 0.18)",
            }}
          >
            <Car size={20} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <h1 className="text-[22px] font-black tracking-tight text-text-primary leading-tight">{t("drivers.title")}</h1>
            <p className="text-[13px] text-text-tertiary mt-0.5">{t("drivers.subtitle")}</p>
          </div>
        </div>
        {/* Tab dropdown — compact selector next to the title */}
        <DriversTabs tabs={tabs} activeTab={tab} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
         SEARCH + PAGINATION BAR (client component)
         ═══════════════════════════════════════════════════════════════════════ */}
      <DriversClient
        key={searchQuery}
        tab={tab}
        currentPage={page}
        totalPages={totalPages}
        searchQuery={searchQuery}
      />

      {tab !== "revision" ? (
        /* ═══════════════════════════════════════════════════════════════════════
           DRIVERS TABLE (desktop) + CARDS (mobile)
           ═══════════════════════════════════════════════════════════════════════ */
        <div className="dash-table-card animate-fade-in">
          {/* Section header */}
          <div className="dash-section-header justify-between">
            <div className="flex items-center gap-2.5 flex-1">
              <div
                className="w-1 h-5 rounded-full"
                style={{ background: `linear-gradient(to bottom, var(--primary), transparent)`, boxShadow: `0 0 8px rgba(var(--primary-rgb), 0.35)` }}
              />
              <h3 className="text-[13px] font-bold text-text-primary">
                {tabs.find((tb) => tb.key === tab)?.label}
              </h3>
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-bold num"
                style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}
              >
                {listCount}
              </span>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="dash-table-head">
                  {[
                    t("common.driver"),
                    t("common.vehicle"),
                    t("drivers.documents"),
                    t("common.trips"),
                    t("drivers.rating"),
                    t("common.status"),
                    t("common.actions"),
                  ].map((h) => (
                    <th key={h} className="text-right py-3 px-4 text-[10px] font-black text-text-tertiary uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(driversRaw || []).map((driver: any, i: number) => {
                  const user = driver.users as any;
                  const hasRevision = revisionDriverIds.includes(driver.id);
                  return (
                    <tr
                      key={driver.id}
                      className="group/row dash-table-row"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      {/* Driver */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black shrink-0 transition-all"
                            style={getAvatarStyle(getDriverStatus(user?.is_blocked ?? false, driver.is_verified, hasRevision))}
                          >
                            {user?.name?.charAt(0)?.toUpperCase() || "D"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-text-primary text-[13px] truncate">{user?.name}</p>
                            <p className="text-text-disabled text-[11px] num">{user?.phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Car size={12} className="text-text-disabled shrink-0" />
                          <div>
                            <span className="text-text-secondary text-[12px] font-bold">
                              {driver.vehicle_brand} {driver.vehicle_model}
                            </span>
                            <span className="text-text-disabled text-[12px] mx-1">—</span>
                            <span className="text-[13px]">{driver.vehicle_type === "car" ? "🚗" : "🏍"}</span>
                          </div>
                        </div>
                        <p
                          className="mt-1 px-2 py-0.5 rounded-md text-[10px] font-black num inline-flex"
                          style={{ background: "var(--warning-surface)", color: "var(--warning)", border: "1px solid var(--warning-border)" }}
                        >
                          {driver.vehicle_plate}
                        </p>
                      </td>

                      {/* Documents */}
                      <td className="py-3.5 px-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {docList(driver).map((doc) =>
                            doc.url ? (
                              <a
                                key={doc.label}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:shadow-sm"
                                style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}
                              >
                                {doc.label}
                              </a>
                            ) : (
                              <span
                                key={doc.label}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold opacity-60"
                                style={{ background: "var(--neutral-surface)", color: "var(--text-disabled)", border: "1px solid var(--divider)" }}
                              >
                                {doc.label}
                              </span>
                            ),
                          )}
                        </div>
                      </td>

                      {/* Trips */}
                      <td className="py-3.5 px-4">
                        <span className="text-text-secondary font-bold text-[13px] num">{user?.total_trips ?? 0}</span>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: "var(--warning-surface)", border: "1px solid var(--warning-border)" }}>
                          <Star size={11} style={{ color: "var(--warning)" }} fill="currentColor" />
                          <span className="font-bold text-[13px] num" style={{ color: "var(--warning)" }}>
                            {user?.rating ?? "—"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user?.is_blocked ? (
                          <Badge variant="error" dot>{t("drivers.status.blocked")}</Badge>
                        ) : hasRevision ? (
                          <Badge variant="warning" dot>
                            <span className="flex items-center gap-1">
                              <FileWarning size={11} />
                              {t("drivers.tabs.revision")}
                            </span>
                          </Badge>
                        ) : driver.is_verified ? (
                          <Badge variant="success" dot>{t("drivers.verified")}</Badge>
                        ) : (
                          <Badge variant="warning" dot>{t("drivers.pending")}</Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <DriverActions
                          driverId={driver.id}
                          driverName={user?.name ?? ""}
                          isVerified={driver.is_verified}
                          isBlocked={user?.is_blocked ?? false}
                        />
                      </td>
                    </tr>
                  );
                })}

                {(!driversRaw || driversRaw.length === 0) && (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-surface-elevated border border-divider">
                          <Search size={24} className="text-text-disabled" />
                        </div>
                        <p className="text-text-disabled text-sm font-bold">{t("drivers.noDrivers")}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ──────────────────────────────────────────────── */}
          <div className="lg:hidden divide-y" style={{ borderColor: "var(--divider)" }}>
            {(driversRaw || []).map((driver: any) => {
              const user = driver.users as any;
              const hasRevision = revisionDriverIds.includes(driver.id);
              return (
                <div key={driver.id} className="p-4 space-y-3">
                  {/* Top row: avatar + name + badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-[15px]"
                        style={getAvatarStyle(getDriverStatus(user?.is_blocked ?? false, driver.is_verified, hasRevision))}
                      >
                        {user?.name?.charAt(0)?.toUpperCase() || "D"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-text-primary text-[14px] truncate">{user?.name}</p>
                        <p className="text-text-disabled text-[11px] num">{user?.phone}</p>
                      </div>
                    </div>
                    {user?.is_blocked ? (
                      <Badge variant="error" dot>{t("drivers.status.blocked")}</Badge>
                    ) : hasRevision ? (
                      <Badge variant="warning" dot>{t("drivers.tabs.revision")}</Badge>
                    ) : driver.is_verified ? (
                      <Badge variant="success" dot>{t("drivers.verified")}</Badge>
                    ) : (
                      <Badge variant="warning" dot>{t("drivers.pending")}</Badge>
                    )}
                  </div>

                  {/* Vehicle info */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}
                  >
                    <Car size={14} className="text-text-tertiary shrink-0" />
                    <span className="text-text-secondary text-[13px] font-bold">
                      {driver.vehicle_brand} {driver.vehicle_model}
                    </span>
                    <span className="text-text-disabled">—</span>
                    <span>{driver.vehicle_type === "car" ? "🚗" : "🏍"}</span>
                    <span className="mr-auto" />
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-black num"
                      style={{ background: "var(--warning-surface)", color: "var(--warning)", border: "1px solid var(--warning-border)" }}
                    >
                      {driver.vehicle_plate}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: "var(--warning-surface)", border: "1px solid var(--warning-border)" }}>
                      <Star size={11} style={{ color: "var(--warning)" }} fill="currentColor" />
                      <span className="font-bold text-[12px] num" style={{ color: "var(--warning)" }}>{user?.rating ?? "—"}</span>
                    </div>
                    <span className="text-text-tertiary text-[12px] font-bold">
                      {user?.total_trips ?? 0} {t("common.trips")}
                    </span>
                  </div>

                  {/* Documents */}
                  <div className="flex gap-1.5 flex-wrap">
                    {docList(driver).map((doc) =>
                      doc.url ? (
                        <a
                          key={doc.label}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                          style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}
                        >
                          {doc.label}
                        </a>
                      ) : (
                        <span
                          key={doc.label}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold opacity-60"
                          style={{ background: "var(--neutral-surface)", color: "var(--text-disabled)", border: "1px solid var(--divider)" }}
                        >
                          {doc.label}
                        </span>
                      ),
                    )}
                  </div>

                  {/* Action buttons */}
                  <DriverCardActions
                    driverId={driver.id}
                    driverName={user?.name ?? ""}
                    isVerified={driver.is_verified}
                    isBlocked={user?.is_blocked ?? false}
                  />
                </div>
              );
            })}
            {(!driversRaw || driversRaw.length === 0) && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}
                >
                  <Search size={24} className="text-text-disabled" />
                </div>
                <p className="text-text-disabled text-sm font-bold">{t("drivers.noDrivers")}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════════
           REVISION REQUESTS
           ═══════════════════════════════════════════════════════════════════════ */
        <div className="dash-table-card animate-fade-in">
          <div className="dash-section-header justify-between">
            <div className="flex items-center gap-2.5 flex-1">
              <div
                className="w-1 h-5 rounded-full"
                style={{ background: "linear-gradient(to bottom, var(--warning), transparent)", boxShadow: "0 0 8px rgba(var(--warning-rgb), 0.35)" }}
              />
              <h3 className="text-[13px] font-bold text-text-primary">{t("drivers.revisionRequests")}</h3>
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-bold num"
                style={{ background: "var(--warning-surface)", color: "var(--warning)", border: "1px solid var(--warning-border)" }}
              >
                {revisionCount}
              </span>
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
            {revisionDrivers.map((rev: any) => {
              const user = rev.users;
              const dp = rev.drivers_profile;
              return (
                <div key={rev.id} className="p-5 space-y-4">
                  {/* Driver info header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[14px] bg-warning/10 text-warning border border-warning/20">
                      {user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-text-primary text-[14px]">{user?.name}</p>
                      <p className="text-text-disabled text-[11px] num">{user?.phone}</p>
                    </div>
                    <Badge variant="warning" dot>
                      <span className="flex items-center gap-1">
                        <FileWarning size={11} />
                        {t("drivers.tabs.revision")}
                      </span>
                    </Badge>
                  </div>

                  {/* Vehicle mini-row */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-elevated border border-divider">
                    <span>{dp?.vehicle_type === "car" ? "🚗" : "🏍"}</span>
                    <span className="text-text-secondary text-[12px] font-bold">{dp?.vehicle_brand}</span>
                    <span className="text-text-disabled">—</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black num bg-warning/10 text-warning border border-warning/20">
                      {dp?.vehicle_plate}
                    </span>
                  </div>

                  {/* Requested fields */}
                  <div className="p-3.5 rounded-xl space-y-2 bg-primary/10 border border-primary/20">
                    <p className="text-[11px] font-black text-primary uppercase tracking-wider">{t("drivers.requestedFields")}:</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {(rev.fields_requested || []).map((f: string) => (
                        <span key={f} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                          {f}
                        </span>
                      ))}
                    </div>
                    {rev.message && (
                      <p className="text-text-secondary text-[12px] mt-2 pt-2 border-t border-primary/20">{rev.message}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <RevisionActions
                    driverId={rev.driver_id}
                    driverName={(rev.users as any)?.name ?? ""}
                    revisionId={rev.id}
                    isVerified={(rev.drivers_profile as any)?.is_verified ?? false}
                  />
                </div>
              );
            })}
            {revisionDrivers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-surface-elevated border border-divider">
                  <CheckCircle size={24} className="text-text-disabled" />
                </div>
                <p className="text-text-disabled text-sm font-bold">{t("drivers.noRevisionRequests")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

