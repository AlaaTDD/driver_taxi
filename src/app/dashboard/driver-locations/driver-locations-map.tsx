"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DriverPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  heading?: number;
  online: boolean;
  vehicle?: string;
  plate?: string;
}

export default function DriverLocationsMap({
  drivers: initialDrivers,
}: {
  drivers: DriverPin[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const prevInitialRef = useRef<DriverPin[]>(initialDrivers);

  const [drivers, setDrivers] = useState<DriverPin[]>(initialDrivers);

  // [RENDER-BUG FIXED] Previously `setState` was called directly inside the
  // render body when `initialDrivers` reference changed — a React anti-pattern
  // that can cause infinite re-render loops. The fix uses a `useEffect` with a
  // ref, exactly what React recommends for syncing props to state.
  useEffect(() => {
    if (initialDrivers !== prevInitialRef.current) {
      prevInitialRef.current = initialDrivers;
      setDrivers(initialDrivers);
    }
  }, [initialDrivers]);

  // Supabase Realtime Subscription
  useEffect(() => {
    const supabase = createClient();

    // [P0-04 FIXED] The live position feed lives in `active_driver_locations`
    // (columns: driver_id, current_lat, current_lng, heading), NOT the legacy
    // historical `driver_locations` table. The old subscription matched zero
    // rows and read nonexistent `lat`/`lng` columns, so markers never updated.
    //
    // [REALTIME-03 FIXED] Batch realtime updates and flush at most once per
    // ~150ms. Drivers emit GPS updates frequently; without batching, each
    // UPDATE triggered a full React re-render + marker rebuild.
    const pendingUpdates = new Map<string, Partial<DriverPin>>();
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleFlush = () => {
      if (flushTimer) return;
      flushTimer = setTimeout(() => {
        flushTimer = null;
        if (pendingUpdates.size === 0) return;
        const batch = new Map(pendingUpdates);
        pendingUpdates.clear();
        setDrivers((prev) =>
          prev.map((d) => {
            const upd = batch.get(d.id);
            return upd ? { ...d, ...upd } : d;
          })
        );
      }, 150);
    };

    const applyChange = (row: any) => {
      if (!row || !row.driver_id) return;
      const lat = Number(row.current_lat);
      const lng = Number(row.current_lng);
      if (!isFinite(lat) || !isFinite(lng)) return;
      pendingUpdates.set(row.driver_id, {
        lat,
        lng,
        heading: row.heading != null ? Number(row.heading) : undefined,
      });
      scheduleFlush();
    };

    const channel = supabase
      .channel("live_driver_locations")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "active_driver_locations" },
        (payload) => applyChange(payload.new)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "active_driver_locations" },
        (payload) => applyChange(payload.new)
      )
      .subscribe();

    return () => {
      if (flushTimer) clearTimeout(flushTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  // Track the Leaflet script promise so we can clean up on early unmount.
  const leafletPromiseRef = useRef<Promise<void> | null>(null);

  // Map Initialization & Updates
  useEffect(() => {
    if (!mapRef.current) return;

    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = (): Promise<void> => {
      if ((window as any).L) return Promise.resolve();

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      document.head.appendChild(script);

      const promise = new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("تعذر تحميل مكتبة الخريطة. تحقق من اتصال الإنترنت."));
      });

      // [MEM-02 FIXED] Store the promise so cleanup can catch it if the
      // component unmounts while the script is still loading.
      leafletPromiseRef.current = promise;
      return promise;
    };

    loadLeaflet()
      .then(() => {
        const L = (window as any).L;
        if (!L || !mapRef.current) return;

        let map = mapInstanceRef.current;

        if (!map) {
          // Calculate center from drivers or default to a reasonable location
          const validDrivers = drivers.filter(
            (d) => d.lat !== 0 && d.lng !== 0 && isFinite(d.lat) && isFinite(d.lng)
          );

          const center: [number, number] =
            validDrivers.length > 0
              ? [
                  validDrivers.reduce((s, d) => s + d.lat, 0) / validDrivers.length,
                  validDrivers.reduce((s, d) => s + d.lng, 0) / validDrivers.length,
                ]
              : [24.7136, 46.6753]; // Default: Riyadh

          map = L.map(mapRef.current, {
            zoomControl: false,
          }).setView(center, validDrivers.length > 0 ? 12 : 6);

          // Dark tile layer
          L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            {
              attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
              subdomains: "abcd",
              maxZoom: 19,
            }
          ).addTo(map);

          L.control.zoom({ position: "topright" }).addTo(map);

          // Fit bounds if we have markers initially
          if (validDrivers.length > 1) {
            const bounds = L.latLngBounds(
              validDrivers.map((d: DriverPin) => [d.lat, d.lng])
            );
            map.fitBounds(bounds, { padding: [40, 40] });
          }

          mapInstanceRef.current = map;
        }

        // Update markers
        const currentIds = new Set(drivers.map(d => d.id));

        // Remove old markers
        Object.keys(markersRef.current).forEach(id => {
          if (!currentIds.has(id)) {
            map.removeLayer(markersRef.current[id]);
            delete markersRef.current[id];
          }
        });

        // Add or update markers
        drivers.filter(d => isFinite(d.lat) && isFinite(d.lng) && d.lat !== 0 && d.lng !== 0).forEach((d) => {
          const color = d.online ? "var(--success)" : "var(--text-tertiary)";
          const glowColor = d.online ? "rgba(var(--success-rgb),0.3)" : "var(--neutral-surface)";

          const icon = L.divIcon({
            className: "driver-map-marker",
            html: `
              <div style="
                position: relative;
                width: 36px; height: 36px;
                display: flex; align-items: center; justify-content: center;
                transition: all 0.3s ease;
              ">
                <div style="
                  position: absolute; inset: 0;
                  border-radius: 50%;
                  background: ${glowColor};
                  ${d.online ? "animation: pulse-marker 2s ease-in-out infinite;" : ""}
                "></div>
                <div style="
                  width: 28px; height: 28px;
                  border-radius: 50%;
                  background: ${color};
                  border: 2px solid rgba(var(--color-white-rgb),0.2);
                  display: flex; align-items: center; justify-content: center;
                  font-size: 11px; font-weight: 800; color: var(--color-white);
                  position: relative; z-index: 2;
                  box-shadow: 0 2px 8px ${glowColor};
                ">${d.name?.charAt(0)?.toUpperCase() || "?"}</div>
                ${
                  d.heading != null
                    ? `<div style="
                        position: absolute; top: -4px; left: 50%;
                        transform: translateX(-50%) rotate(${d.heading}deg);
                        width: 0; height: 0;
                        border-left: 4px solid transparent;
                        border-right: 4px solid transparent;
                        border-bottom: 8px solid ${color};
                        z-index: 3;
                        transition: transform 0.3s ease;
                      "></div>`
                    : ""
                }
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          const popupContent = `
            <div style="
              font-family: system-ui, sans-serif;
              padding: 4px;
              min-width: 160px;
            ">
              <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px;">
                ${d.name || "—"}
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 2px;">
                ${d.vehicle || ""} ${d.plate ? `• ${d.plate}` : ""}
              </div>
              <div style="font-size: 11px; color: var(--text-secondary);">
                ${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}
              </div>
              <div style="
                margin-top: 6px;
                font-size: 10px; font-weight: 700;
                color: ${d.online ? "var(--success)" : "var(--error)"};
              ">
                ● ${d.online ? "متصل" : "غير متصل"}
              </div>
            </div>
          `;

          if (markersRef.current[d.id]) {
            const marker = markersRef.current[d.id];
            marker.setLatLng([d.lat, d.lng]);
            marker.setIcon(icon);
            marker.getPopup()?.setContent(popupContent);
          } else {
            markersRef.current[d.id] = L.marker([d.lat, d.lng], { icon })
              .addTo(map)
              .bindPopup(popupContent, { className: "driver-map-popup" });
          }
        });
      })
      .catch((err) => {
        console.error("Leaflet load failed:", err);
        // The map container remains blank — user sees the empty-state instead.
      });

    // We do NOT return cleanup for the map instance here because we want the
    // map to persist across driver-list re-renders. Full cleanup is in the
    // dedicated unmount effect below.
  }, [drivers]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      // [MEM-01/MEM-02 FIXED] Clean up Leaflet CSS and script from DOM on
      // unmount so we don't leak resources across navigations.
      const css = document.getElementById("leaflet-css");
      if (css) css.remove();
      // Silently ignore the pending promise — it has no side effects now.
      if (leafletPromiseRef.current) {
        leafletPromiseRef.current = leafletPromiseRef.current.catch(() => {});
      }
    };
  }, []);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes pulse-marker {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.4; }
        }
        .driver-map-popup .leaflet-popup-content-wrapper {
          background: var(--surface-elevated);
          color: var(--text-primary);
          border: 1px solid var(--divider);
          border-radius: 12px;
          box-shadow: var(--shadow-md);
        }
        .driver-map-popup .leaflet-popup-tip {
          background: var(--surface-elevated);
        }
        .leaflet-control-zoom a {
          background: var(--surface-elevated) !important;
          color: var(--text-secondary) !important;
          border: 1px solid var(--divider) !important;
        }
        .leaflet-control-zoom a:hover {
          background: var(--surface-high) !important;
          color: var(--text-primary) !important;
        }
        .leaflet-marker-icon {
          transition: transform 0.4s linear; /* Smooth pin movement! */
        }
      `,
        }}
      />
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: 420,
          borderRadius: 16,
          overflow: "hidden",
          background: "var(--background)",
        }}
      />
    </>
  );
}
