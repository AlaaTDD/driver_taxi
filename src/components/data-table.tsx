"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Children } from "react";

interface DataTableProps {
  headers: { label: string; key: string }[];
  children: React.ReactNode;
  emptyMessage?: string;
  emptyDescription?: string;
  caption?: string;
}

export function DataTable({ headers, children, emptyMessage, emptyDescription, caption }: DataTableProps) {
  const t = useTranslations("common");
  const hasRows = Children.count(children) > 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="dash-table-head">
            {headers.map((h) => (
              <th
                key={h.key}
                scope="col"
                className="text-right py-3.5 px-4 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap text-text-tertiary"
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {!hasRows && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-surface-glass border border-divider">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-disabled opacity-40">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-text-secondary font-semibold">{emptyMessage ?? t("noData")}</p>
            <p className="text-text-tertiary text-sm mt-1">{emptyDescription ?? t("tryChangeFilters")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const t = useTranslations("common");

  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label={t("previous")}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-glass border border-divider text-text-secondary disabled:opacity-30 hover:bg-surface-elevated hover:text-text-primary transition-all"
      >
        <ChevronRight size={14} />
      </button>
      {pages.map((page, i) => (
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-text-disabled">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              "w-9 h-9 rounded-xl text-[13px] font-bold flex items-center justify-center transition-all",
              page === currentPage
                ? "btn-primary"
                : "bg-surface-glass border border-divider text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            )}
          >
            {page}
          </button>
        )
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label={t("next")}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-glass border border-divider text-text-secondary disabled:opacity-30 hover:bg-surface-elevated hover:text-text-primary transition-all"
      >
        <ChevronLeft size={14} />
      </button>
    </div>
  );
}
