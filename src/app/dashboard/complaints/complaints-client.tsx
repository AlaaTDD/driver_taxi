"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useTransition } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations();

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
        <option value="">{t("common.allStatuses")}</option>
        <option value="open">{t("complaints.statuses.open")}</option>
        <option value="in_progress">{t("complaints.statuses.in_progress")}</option>
        <option value="resolved">{t("complaints.statuses.resolved")}</option>
        <option value="closed">{t("complaints.statuses.closed")}</option>
      </select>

      <select value={filterPriority} onChange={(e) => updateParams("priority", e.target.value)}
        className="appearance-none px-3 py-2 rounded-xl text-[12px] outline-none cursor-pointer"
        style={selectStyle} id="complaints-priority-filter">
        <option value="">{t("common.all")} {t("complaints.priority.label")}</option>
        <option value="urgent">{t("complaints.priority.urgent")}</option>
        <option value="high">{t("complaints.priority.high")}</option>
        <option value="normal">{t("complaints.priority.normal")}</option>
        <option value="low">{t("complaints.priority.low")}</option>
      </select>

      <select value={filterCategory} onChange={(e) => updateParams("category", e.target.value)}
        className="appearance-none px-3 py-2 rounded-xl text-[12px] outline-none cursor-pointer"
        style={selectStyle} id="complaints-category-filter">
        <option value="">{t("common.all")} {t("complaints.category")}</option>
        <option value="general">{t("complaints.categories.general")}</option>
        <option value="driver">{t("complaints.categories.driver")}</option>
        <option value="trip">{t("complaints.categories.trip")}</option>
        <option value="payment">{t("complaints.categories.payment")}</option>
        <option value="app">{t("complaints.categories.app")}</option>
        <option value="other">{t("complaints.categories.other")}</option>
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
