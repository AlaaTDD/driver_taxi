"use client";

import { useRouter, usePathname } from "next/navigation";
import { Filter } from "lucide-react";

interface NotificationsClientProps {
  currentPage: number;
  totalPages: number;
  currentType: string;
}

export default function NotificationsClient({
  totalPages,
  currentPage,
  currentType,
}: NotificationsClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (currentType) params.set("type", currentType);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-3 items-center">
      <div className="relative">
        <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled" />
        <select
          value={currentType}
          onChange={(e) => updateParams("type", e.target.value)}
          className="appearance-none pr-10 pl-8 py-2.5 rounded-xl border border-divider bg-surface-elevated text-text-primary focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none text-[13px] transition-all"
        >
          <option value="">كل الأنواع</option>
          <option value="trip_offer">عرض رحلة</option>
          <option value="offer_accepted">قبول عرض</option>
          <option value="driver_arriving">سائق قادم</option>
          <option value="trip_started">بدء الرحلة</option>
          <option value="trip_completed">رحلة مكتملة</option>
          <option value="trip_cancelled">رحلة ملغية</option>
          <option value="no_drivers">لا سائقين</option>
          <option value="new_message">رسالة جديدة</option>
          <option value="account_verified">حساب معتمد</option>
        </select>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
