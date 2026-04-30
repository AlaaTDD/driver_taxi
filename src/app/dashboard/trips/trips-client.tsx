"use client";

import { useRouter, usePathname } from "next/navigation";
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
      {/* Total count label */}
      <div
        className="px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap"
        style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
      >
        إجمالي: <span className="text-text-primary font-black num">{totalCount}</span>
      </div>

      <div className="flex gap-3 flex-1 justify-end flex-wrap">
        {/* Status Filter */}
        <div className="relative">
          <SlidersHorizontal size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
          <select
            value={currentStatus}
            onChange={(e) => updateParams("status", e.target.value)}
            id="trips-status-filter"
            className="appearance-none pr-9 pl-8 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer"
            style={selectStyle}
          >
            <option value="">كل الحالات</option>
            <option value="searching">جاري البحث</option>
            <option value="accepted">تم القبول</option>
            <option value="driver_arriving">السائق قادم</option>
            <option value="in_progress">جارية</option>
            <option value="completed">مكتملة</option>
            <option value="cancelled">ملغية</option>
          </select>
          <ChevronLeft size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
        </div>

        {/* Vehicle Filter */}
        <div className="relative">
          <select
            value={currentVehicle}
            onChange={(e) => updateParams("vehicle", e.target.value)}
            id="trips-vehicle-filter"
            className="appearance-none px-4 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer"
            style={selectStyle}
          >
            <option value="">كل الأنواع</option>
            <option value="car">عربية 🚗</option>
            <option value="motorcycle">مكنة 🏍</option>
          </select>
        </div>
      </div>

      {/* Pagination */}
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
