import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import {
  Activity,
  Car,
  Clock,
  Compass,
  Hash,
  MapPin,
  Navigation,
  Phone,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import DriverLocationsMap from "./driver-locations-map";

function initials(name?: string | null, fallback = "?") {
  return name?.trim()?.charAt(0)?.toUpperCase() || fallback;
}

function formatCoord(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(4) : "—";
}

function vehicleTitle(profile: any) {
  if (!profile) return "—";
  return [profile.vehicle_brand, profile.vehicle_model].filter(Boolean).join(" ") || profile.vehicle_type || "—";
}

function vehicleMeta(profile: any) {
  if (!profile) return "";
  return [profile.vehicle_color, profile.vehicle_type].filter(Boolean).join(" · ");
}

export default async function DriverLocationsPage() {
  const t = await getTranslations();
  const supabase = createAdminClient();

  const { data: locations } = await supabase
    .from("driver_locations")
    .select("id, driver_id, lat, lng, heading, geohash, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);

  const locationRows = locations || [];
  const driverIds = [...new Set(locationRows.map((l) => l.driver_id).filter(Boolean))];

  const { data: drivers } = driverIds.length
    ? await supabase.from("users").select("id, name, phone").in("id", driverIds)
    : { data: [] };

  const { data: profiles } = driverIds.length
    ? await supabase
        .from("drivers_profile")
        .select("id, vehicle_type, vehicle_brand, vehicle_model, vehicle_color, vehicle_plate, is_available, is_verified")
        .in("id", driverIds)
    : { data: [] };

  const driverMap = new Map((drivers || []).map((d) => [d.id, d]));
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const { data: presenceData } = await supabase
    .from("user_presence")
    .select("user_id, lat, lng, last_seen")
    .order("last_seen", { ascending: false })
    .limit(500);

  const presenceRows = presenceData || [];
  const presenceMap = new Map(presenceRows.map((p) => [p.user_id, p]));

  const now = new Date();
  const isOnline = (userId: string) => {
    const p = presenceMap.get(userId);
    if (!p) return false;
    return now.getTime() - new Date(p.last_seen).getTime() < 5 * 60 * 1000;
  };

  const onlineCount = locationRows.filter((l) => isOnline(l.driver_id)).length;
  const totalCount = locationRows.length;
  const offlineCount = totalCount - onlineCount;
  const presenceCount = presenceRows.length;

  const stats = [
    { label: t("driverLocations.stats.total"), value: totalCount, icon: MapPin, tone: "blue" },
    { label: t("driverLocations.stats.online"), value: onlineCount, icon: Wifi, tone: "green" },
    { label: t("driverLocations.stats.offline"), value: offlineCount, icon: WifiOff, tone: "red" },
    { label: t("driverLocations.stats.activeUsers"), value: presenceCount, icon: Users, tone: "violet" },
  ];

  return (
    <>
      <div className="driver-locations-page space-y-5">
        <section className="driver-command-panel">
          <div className="driver-command-copy">
            <div className="driver-command-kicker">
              <Navigation size={15} />
              <span>{t("driverLocations.title")}</span>
            </div>
            <h1>{t("driverLocations.subtitle")}</h1>
            <div className="driver-command-pills">
              <span className="driver-status-pill driver-status-online">
                <span className="driver-status-dot" />
                {onlineCount} {t("driverLocations.online")}
              </span>
              <span className="driver-status-pill driver-status-offline">
                <span className="driver-status-dot" />
                {offlineCount} {t("driverLocations.offline")}
              </span>
            </div>
          </div>

          <div className="driver-radar" aria-hidden="true">
            <div className="driver-radar-sweep" />
            <span className="driver-radar-marker driver-radar-marker-a" />
            <span className="driver-radar-marker driver-radar-marker-b" />
            <span className="driver-radar-marker driver-radar-marker-c" />
            <div className="driver-radar-core">
              <Activity size={18} />
            </div>
          </div>
        </section>

        <div className="driver-stats-grid">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`driver-stat-card driver-stat-${s.tone}`}
              style={{ animationDelay: `${i * 0.045}s` }}
            >
              <div className="driver-stat-icon">
                <s.icon size={17} />
              </div>
              <div className="driver-stat-content">
                <div className="driver-stat-value num">{s.value}</div>
                <div className="driver-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Live Map (Phase 2 Finding #3) ── */}
        <div className="driver-table-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="driver-table-toolbar" style={{ padding: "16px 20px" }}>
            <div className="driver-table-title">
              <span className="driver-table-icon driver-table-icon-cyan">
                <Navigation size={16} />
              </span>
              <div>
                <h2>خريطة المواقع الحية</h2>
                <p>{onlineCount} متصل من {totalCount} سائق</p>
              </div>
            </div>
          </div>
          <div style={{ height: 460 }}>
            <DriverLocationsMap
              drivers={locationRows.map((loc) => {
                const d = driverMap.get(loc.driver_id);
                const p = profileMap.get(loc.driver_id);
                return {
                  id: loc.driver_id,
                  name: d?.name || "—",
                  lat: Number(loc.lat),
                  lng: Number(loc.lng),
                  heading: loc.heading != null ? Number(loc.heading) : undefined,
                  online: isOnline(loc.driver_id),
                  vehicle: p ? `${p.vehicle_brand || ""} ${p.vehicle_model || ""}`.trim() : undefined,
                  plate: p?.vehicle_plate || undefined,
                };
              })}
            />
          </div>
        </div>

        <div className="driver-table-card">
          <div className="driver-table-toolbar">
            <div className="driver-table-title">
              <span className="driver-table-icon driver-table-icon-cyan">
                <MapPin size={16} />
              </span>
              <div>
                <h2>{t("driverLocations.registeredLocations")}</h2>
                <p>{totalCount} {t("driverLocations.stats.total")}</p>
              </div>
            </div>
            <div className="driver-table-pills">
              <span className="driver-status-pill driver-status-online">
                <span className="driver-status-dot" />
                {onlineCount} {t("driverLocations.online")}
              </span>
              <span className="driver-status-pill driver-status-offline">
                <span className="driver-status-dot" />
                {offlineCount} {t("driverLocations.offline")}
              </span>
            </div>
          </div>

          <div className="driver-table-scroll">
            <table className="driver-table">
              <thead>
                <tr>
                  {[
                    t("driverLocations.table.status"),
                    t("driverLocations.table.driver"),
                    t("driverLocations.table.phone"),
                    t("driverLocations.table.vehicle"),
                    t("driverLocations.table.plate"),
                    t("driverLocations.table.coordinates"),
                    t("driverLocations.table.heading"),
                    t("driverLocations.table.geohash"),
                    t("driverLocations.table.lastUpdate"),
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {locationRows.map((loc) => {
                  const driver = driverMap.get(loc.driver_id);
                  const profile = profileMap.get(loc.driver_id);
                  const online = isOnline(loc.driver_id);
                  const meta = vehicleMeta(profile);

                  return (
                    <tr key={loc.id} className={online ? "is-online" : undefined}>
                      <td>
                        <span className={`driver-status-pill ${online ? "driver-status-online" : "driver-status-offline"}`}>
                          <span className="driver-status-dot" />
                          {online ? t("driverLocations.online") : t("driverLocations.offline")}
                        </span>
                      </td>
                      <td>
                        <div className="driver-person-cell">
                          <div className="driver-avatar">{initials(driver?.name)}</div>
                          <span>{driver?.name || "—"}</span>
                        </div>
                      </td>
                      <td>
                        <span className="driver-muted-cell num">
                          <Phone size={12} />
                          {driver?.phone || "—"}
                        </span>
                      </td>
                      <td>
                        <div className="driver-vehicle-cell">
                          <span>
                            <Car size={13} />
                            {vehicleTitle(profile)}
                          </span>
                          {meta && <small>{meta}</small>}
                        </div>
                      </td>
                      <td>
                        {profile?.vehicle_plate ? (
                          <span className="driver-plate num">{profile.vehicle_plate}</span>
                        ) : "—"}
                      </td>
                      <td>
                        <span className="driver-code-chip driver-code-blue num">
                          <MapPin size={11} />
                          {formatCoord(loc.lat)}, {formatCoord(loc.lng)}
                        </span>
                      </td>
                      <td>
                        {loc.heading ? (
                          <span className="driver-heading num">
                            <Compass size={12} style={{ transform: `rotate(${loc.heading}deg)` }} />
                            {Number(loc.heading).toFixed(0)}°
                          </span>
                        ) : "—"}
                      </td>
                      <td>
                        <span className="driver-code-chip driver-code-cyan mono">
                          <Hash size={10} />
                          {loc.geohash || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="driver-muted-cell">
                          <Clock size={12} />
                          {loc.updated_at ? formatDate(loc.updated_at) : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {locationRows.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <div className="driver-empty-state">
                        <div className="driver-empty-icon">
                          <MapPin size={24} />
                        </div>
                        <p>{t("driverLocations.noLocations")}</p>
                        <span>{t("driverLocations.subtitle")}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="driver-table-card">
          <div className="driver-table-toolbar">
            <div className="driver-table-title">
              <span className="driver-table-icon driver-table-icon-violet">
                <Activity size={16} />
              </span>
              <div>
                <h2>{t("driverLocations.userPresence")}</h2>
                <p>{presenceCount} {t("driverLocations.activeUser")}</p>
              </div>
            </div>
            <span className="driver-status-pill driver-status-live">
              <Activity size={11} />
              {t("driverLocations.stats.activeUsers")}
            </span>
          </div>

          <div className="driver-table-scroll">
            <table className="driver-table driver-presence-table">
              <thead>
                <tr>
                  {[
                    t("driverLocations.table.status"),
                    t("driverLocations.table.user"),
                    t("driverLocations.table.coordinates"),
                    t("driverLocations.table.lastSeen"),
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {presenceRows.map((p) => {
                  const online = now.getTime() - new Date(p.last_seen).getTime() < 5 * 60 * 1000;
                  const user = driverMap.get(p.user_id);

                  return (
                    <tr key={p.user_id} className={online ? "is-online" : undefined}>
                      <td>
                        <span className={`driver-status-pill ${online ? "driver-status-online" : "driver-status-offline"}`}>
                          <span className="driver-status-dot" />
                          {online ? t("driverLocations.online") : t("driverLocations.offline")}
                        </span>
                      </td>
                      <td>
                        <div className="driver-person-cell">
                          <div className="driver-avatar driver-avatar-violet">{initials(user?.name, "#")}</div>
                          <span>{user?.name || `${p.user_id.substring(0, 8)}...`}</span>
                        </div>
                      </td>
                      <td>
                        <span className="driver-code-chip driver-code-violet num">
                          <MapPin size={11} />
                          {formatCoord(p.lat)}, {formatCoord(p.lng)}
                        </span>
                      </td>
                      <td>
                        <span className="driver-muted-cell">
                          <Clock size={12} />
                          {formatDate(p.last_seen)}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {presenceRows.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="driver-empty-state driver-empty-compact">
                        <div className="driver-empty-icon">
                          <Users size={22} />
                        </div>
                        <p>{t("driverLocations.noPresenceData")}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
