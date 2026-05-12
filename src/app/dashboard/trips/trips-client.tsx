"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

interface TripsClientProps {
  currentPage: number;
  totalPages: number;
  currentStatus: string;
  currentVehicle: string;
  totalCount: number;
}

const selectStyle = {
  background: "var(--surface-glass)",
  border: "1px solid var(--divider)",
  color: "var(--text-primary)",
};

export default function TripsClient({
  totalPages,
  currentPage,
  currentStatus,
  currentVehicle,
  totalCount,
}: TripsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (currentStatus) params.set("status", currentStatus);
    if (currentVehicle) params.set("vehicle", currentVehicle);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center">
      
      <div
        className="px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap"
        style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
      >
        {t("common.total")}: <span className="text-text-primary font-black num">{totalCount}</span>
      </div>

      <div className="flex gap-3 flex-1 justify-end flex-wrap">
        
        <div className="relative">
          <SlidersHorizontal size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
          <select
            value={currentStatus}
            onChange={(e) => updateParams("status", e.target.value)}
            id="trips-status-filter"
            className="appearance-none pr-9 pl-8 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer"
            style={selectStyle}
          >
            <option value="">{t("common.allStatuses")}</option>
            <option value="searching">{t("trips.statuses.searching")}</option>
            <option value="accepted">{t("trips.statuses.accepted")}</option>
            <option value="driver_arriving">{t("trips.statuses.driver_arriving")}</option>
            <option value="in_progress">{t("trips.statuses.in_progress")}</option>
            <option value="completed">{t("trips.statuses.completed")}</option>
            <option value="cancelled">{t("trips.statuses.cancelled")}</option>
          </select>
          <ChevronLeft size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
        </div>

        
        <div className="relative">
          <select
            value={currentVehicle}
            onChange={(e) => updateParams("vehicle", e.target.value)}
            id="trips-vehicle-filter"
            className="appearance-none px-4 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer"
            style={selectStyle}
          >
            <option value="">{t("common.allTypes")}</option>
            <option value="car">{t("dashboard.charts.car")} 🚗</option>
            <option value="motorcycle">{t("dashboard.charts.motorcycle")} 🏍</option>
          </select>
        </div>
      </div>

      
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => currentPage > 1 && updateParams("page", String(currentPage - 1))}
            disabled={currentPage <= 1}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              ...selectStyle,
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              color: currentPage <= 1 ? "var(--text-disabled)" : "var(--text-secondary)",
            }}
          >
            <ChevronRight size={14} />
          </button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateParams("page", String(p))}
              className="w-9 h-9 rounded-xl text-[13px] font-bold transition-all"
              style={
                p === currentPage
                  ? { background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "white", boxShadow: "0 4px 12px rgba(59,130,246,0.3)", border: "1px solid rgba(59,130,246,0.3)" }
                  : { ...selectStyle, color: "var(--text-secondary)" }
              }
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => currentPage < totalPages && updateParams("page", String(currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              ...selectStyle,
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              color: currentPage >= totalPages ? "var(--text-disabled)" : "var(--text-secondary)",
            }}
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
