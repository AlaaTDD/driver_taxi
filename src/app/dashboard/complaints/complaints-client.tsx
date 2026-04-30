"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useTransition } from "react";

interface ComplaintsClientProps {
  filterStatus: string;
  filterPriority: string;
  filterCategory: string;
  currentPage: number;
  totalPages: number;
}

const selectStyle: React.CSSProperties = {
  background: "var(--surface-glass)",
  border: "1px solid var(--divider)",
  color: "var(--text-primary)",
};

export default function ComplaintsClient({
  filterStatus, filterPriority, filterCategory, currentPage, totalPages,
}: ComplaintsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`/dashboard/complaints?${params.toString()}`));
  };

  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/dashboard/complaints?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <SlidersHorizontal size={12} className="text-text-disabled flex-shrink-0" />

      <select value={filterStatus} onChange={(e) => updateParams("status", e.target.value)}
        className="appearance-none px-3 py-2 rounded-xl text-[12px] outline-none cursor-pointer"
        style={selectStyle} id="complaints-status-filter">
        <option value="">كل الحالات</option>
        <option value="open">مفتوح</option>
        <option value="in_progress">قيد المعالجة</option>
        <option value="resolved">محلول</option>
        <option value="closed">مغلق</option>
      </select>

      <select value={filterPriority} onChange={(e) => updateParams("priority", e.target.value)}
        className="appearance-none px-3 py-2 rounded-xl text-[12px] outline-none cursor-pointer"
        style={selectStyle} id="complaints-priority-filter">
        <option value="">كل الأولويات</option>
        <option value="urgent">عاجل</option>
        <option value="high">مرتفع</option>
        <option value="normal">عادي</option>
        <option value="low">منخفض</option>
      </select>

      <select value={filterCategory} onChange={(e) => updateParams("category", e.target.value)}
        className="appearance-none px-3 py-2 rounded-xl text-[12px] outline-none cursor-pointer"
        style={selectStyle} id="complaints-category-filter">
        <option value="">كل التصنيفات</option>
        <option value="general">عام</option>
        <option value="driver">سائق</option>
        <option value="trip">رحلة</option>
        <option value="payment">دفع</option>
        <option value="app">تطبيق</option>
        <option value="other">أخرى</option>
      </select>

      {totalPages > 1 && (
        <div className="flex items-center gap-1 mr-auto">
          <button onClick={() => goPage(currentPage - 1)} disabled={currentPage <= 1}
            className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-30"
            style={selectStyle}>
            <ChevronRight size={13} />
          </button>
          <span className="text-[12px] text-text-secondary px-2">
            {currentPage} / {totalPages}
          </span>
          <button onClick={() => goPage(currentPage + 1)} disabled={currentPage >= totalPages}
            className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-30"
            style={selectStyle}>
            <ChevronLeft size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
