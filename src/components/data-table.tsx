"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps {
  headers: { label: string; key: string }[];
  children: React.ReactNode;
  emptyMessage?: string;
}

export function DataTable({ headers, children, emptyMessage = "لا توجد بيانات" }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--divider-strong)" }}>
            {headers.map((h) => (
              <th
                key={h.key}
                className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                style={{ color: "var(--text-tertiary)" }}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {!children && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--bg-secondary)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            {emptyMessage}
          </p>
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
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-lg bg-surface/80 border border-divider/60 disabled:opacity-30 hover:border-primary/40 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
      {pages.map((page, i) => (
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-sm text-text-disabled">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={cn(
              "w-8 h-8 rounded-lg text-sm transition-colors",
              page === currentPage
                ? "bg-primary text-white shadow-sm shadow-primary/25"
                : "bg-surface/80 border border-divider/60 text-text-secondary hover:border-primary/30"
            )}
          >
            {page}
          </button>
        )
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-lg bg-surface/80 border border-divider/60 disabled:opacity-30 hover:border-primary/40 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
    </div>
  );
}
