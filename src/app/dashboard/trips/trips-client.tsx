"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  background: "var(--surface)",
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
  const searchParams = useSearchParams();
  const t = useTranslations();

  // [RENDER-01 FIXED] Previously `updateParams` started from an empty
  // URLSearchParams(), so any query param not explicitly copied here (e.g. a
  // future `q=` search) was silently dropped. We now build from the current
  // searchParams to preserve everything.
  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset page when filter changes
    if (key !== "page") params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  // Build page range: always show at most 5 pages, centered on current
  const buildPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const delta = 2;
    const range: (number | "...")[] = [];
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    range.push(1);
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("...");
    range.push(totalPages);
    return range;
  };

  const pages = totalPages > 1 ? buildPages() : [];

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center flex-wrap">
      {/* Total count */}
      <div
        className="px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap"
        style={{ background: "var(--surface)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
      >
        {t("common.total")}: <span className="text-text-primary font-black num">{totalCount}</span>
      </div>

      <div className="flex gap-2 flex-1 justify-end flex-wrap items-center">
        {/* Status filter */}
        <div className="relative">
          <SlidersHorizontal size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
          <select
            value={currentStatus}
            onChange={(e) => updateParams("status", e.target.value)}
            id="trips-status-filter"
            className="appearance-none pr-9 pl-8 py-2 rounded-xl text-[13px] outline-none cursor-pointer"
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

        {/* Vehicle filter */}
        <div className="relative">
          <select
            value={currentVehicle}
            onChange={(e) => updateParams("vehicle", e.target.value)}
            id="trips-vehicle-filter"
            className="appearance-none px-4 py-2 rounded-xl text-[13px] outline-none cursor-pointer"
            style={selectStyle}
          >
            <option value="">{t("common.allTypes")}</option>
            <option value="car">{t("dashboard.charts.car")} 🚗</option>
            <option value="motorcycle">{t("dashboard.charts.motorcycle")} 🏍</option>
          </select>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={() => currentPage > 1 && updateParams("page", String(currentPage - 1))}
              disabled={currentPage <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
              style={selectStyle}
            >
              <ChevronRight size={14} />
            </button>

            {/* Pages */}
            {pages.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-text-disabled text-[12px]">
                  ···
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => updateParams("page", String(p))}
                  className="w-8 h-8 rounded-lg text-[12px] font-bold transition-all"
                  style={
                    p === currentPage
                      ? {
                          background: "var(--primary)",
                          color: "var(--color-white)",
                          border: "1px solid var(--primary)",
                        }
                      : { ...selectStyle, color: "var(--text-secondary)" }
                  }
                >
                  {p}
                </button>
              )
            )}

            {/* Next */}
            <button
              onClick={() => currentPage < totalPages && updateParams("page", String(currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
              style={selectStyle}
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
