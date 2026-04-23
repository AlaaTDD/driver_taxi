"use client";

import { useRouter, usePathname } from "next/navigation";
import { Filter } from "lucide-react";

interface TripsClientProps {
  currentPage: number;
  totalPages: number;
  currentStatus: string;
  currentVehicle: string;
  totalCount: number;
}

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
    <div className="flex flex-col sm:flex-row gap-3 items-start">
      <div className="text-text-secondary text-[13px] py-2">
        إجمالي الرحلات: <span className="text-text-primary font-bold">{totalCount}</span>
      </div>

      <div className="flex gap-3 flex-1 justify-end">
        <div className="relative">
          <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled" />
          <select
            value={currentStatus}
            onChange={(e) => updateParams("status", e.target.value)}
            className="appearance-none pr-10 pl-8 py-2.5 rounded-xl border border-divider bg-surface-elevated text-text-primary focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none text-[13px] transition-all"
          >
            <option value="">كل الحالات</option>
            <option value="searching">جاري البحث</option>
            <option value="accepted">تم القبول</option>
            <option value="driver_arriving">السائق قادم</option>
            <option value="in_progress">جارية</option>
            <option value="completed">مكتملة</option>
            <option value="cancelled">ملغية</option>
            <option value="no_drivers">لا سائقين</option>
            <option value="problem">مشكلة</option>
          </select>
        </div>

        <div className="relative">
          <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled" />
          <select
            value={currentVehicle}
            onChange={(e) => updateParams("vehicle", e.target.value)}
            className="appearance-none pr-10 pl-8 py-2.5 rounded-xl border border-divider bg-surface-elevated text-text-primary focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none text-[13px] transition-all"
          >
            <option value="">كل الأنواع</option>
            <option value="car">عربية</option>
            <option value="motorcycle">مكنة</option>
          </select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
            (p) => (
              <button
                key={p}
                onClick={() => updateParams("page", String(p))}
                className={`w-8 h-8 rounded-lg text-sm ${
                  p === currentPage
                    ? "bg-primary text-white shadow-sm shadow-primary/25"
                    : "bg-surface/80 border border-divider/60 text-text-secondary hover:border-primary/30"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
