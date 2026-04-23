"use client";

import { useRouter, usePathname } from "next/navigation";
import { Search, Filter } from "lucide-react";

interface DriversClientProps {
  currentPage: number;
  totalPages: number;
  currentSearch: string;
  currentStatus: string;
}

export default function DriversClient({
  totalPages,
  currentPage,
  currentSearch,
  currentStatus,
}: DriversClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (currentSearch) params.set("search", currentSearch);
    if (currentStatus) params.set("status", currentStatus);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled"
        />
        <input
          type="text"
          placeholder="بحث بالاسم أو الهاتف أو رقم اللوحة..."
          defaultValue={currentSearch}
          onChange={(e) => updateParams("search", e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-divider bg-surface-elevated text-text-primary placeholder:text-text-disabled focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none text-[13px] transition-all"
        />
      </div>

      <div className="relative">
        <Filter
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled"
        />
        <select
          value={currentStatus}
          onChange={(e) => updateParams("status", e.target.value)}
          className="appearance-none pr-10 pl-8 py-2.5 rounded-xl border border-divider bg-surface-elevated text-text-primary focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none text-[13px] transition-all"
        >
          <option value="">الكل</option>
          <option value="pending">في الانتظار</option>
          <option value="verified">معتمدين</option>
          <option value="available">متاحين</option>
        </select>
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
