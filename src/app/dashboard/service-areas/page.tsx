import { createAdminClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/utils";
import { MapPin, Globe, CheckCircle, XCircle } from "lucide-react";
import ServiceAreasClient, { ToggleAreaStatus, TestCoverageComponent } from "./service-areas-client";

export default async function ServiceAreasPage() {
  const t = await getTranslations();
  const supabase = createAdminClient();

  const { data: serviceAreas } = await supabase
    .from("service_areas")
    .select("*, driver_service_areas(count)")
    .order("created_at", { ascending: false });

  const areas = serviceAreas || [];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-[28px] font-black tracking-tight text-text-primary leading-tight">
              {t("serviceAreas.title")}
            </h1>
            <p className="text-[14px] text-text-tertiary leading-relaxed">
              {t("serviceAreas.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/15 bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary">
              <Globe size={13} />
              {areas.length} {t("serviceAreas.totalAreas")}
            </span>
            <ServiceAreasClient />
          </div>
        </div>

        {/* Areas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area: any) => {
            const driverCount = area.driver_service_areas?.[0]?.count ?? 0;
            const prefixes = (area.geohash_prefixes || []) as string[];
            return (
              <div
                key={area.id}
                className="group rounded-2xl border border-divider bg-surface-elevated p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                      <MapPin size={18} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-black text-text-primary leading-tight">
                        {area.name_ar || area.name}
                      </h3>
                      <p className="text-[12px] text-text-tertiary font-medium mt-0.5">
                        {area.code}
                      </p>
                    </div>
                  </div>
                  {area.is_active ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-success/10 border border-success/20 px-2 py-1 text-[10px] font-bold text-success">
                      <CheckCircle size={10} />
                      {t("common.active")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-error/10 border border-error/20 px-2 py-1 text-[10px] font-bold text-error">
                      <XCircle size={10} />
                      {t("common.inactive")}
                    </span>
                  )}
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text-tertiary font-medium">{t("serviceAreas.driversAssigned")}</span>
                    <span className="text-text-primary font-bold">{driverCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text-tertiary font-medium">{t("serviceAreas.geohashPrefixes")}</span>
                    <span className="text-text-primary font-bold">{prefixes.length}</span>
                  </div>
                  {prefixes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {prefixes.slice(0, 5).map((p: string, i: number) => (
                        <span
                          key={i}
                          className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-mono font-bold text-text-secondary border border-divider"
                        >
                          {p}
                        </span>
                      ))}
                      {prefixes.length > 5 && (
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                          +{prefixes.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-divider flex flex-col gap-2">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] text-text-disabled font-medium">
                      {formatDate(area.created_at)}
                    </span>
                  </div>
                  <ToggleAreaStatus id={area.id} is_active={area.is_active} />
                </div>
              </div>
            );
          })}

          {areas.length === 0 && (
            <div className="col-span-full py-16 text-center flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated border border-divider shadow-sm">
                <MapPin size={24} className="text-text-disabled" />
              </div>
              <p className="text-sm font-bold text-text-disabled">{t("common.noData")}</p>
            </div>
          )}
        </div>

        {/* Test Coverage Tool */}
        <TestCoverageComponent />
      </div>
    </>
  );
}
