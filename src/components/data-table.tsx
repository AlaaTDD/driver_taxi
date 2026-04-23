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
          <tr className="border-b border-divider/60">
            {headers.map((h) => (
              <th
                key={h.key}
                className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium"
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {!children && (
        <div className="text-center py-12 text-text-disabled">
          {emptyMessage}
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

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-lg bg-surface/80 border border-divider/60 disabled:opacity-30 hover:border-primary/40 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        const page = i + 1;
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "w-8 h-8 rounded-lg text-sm transition-colors",
              page === currentPage
                ? "bg-primary text-white shadow-sm shadow-primary/25"
                : "bg-surface/80 border border-divider/60 text-text-secondary hover:border-primary/30"
            )}
          >
            {page}
          </button>
        );
      })}
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
