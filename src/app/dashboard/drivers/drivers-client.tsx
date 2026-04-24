"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";

interface DriversClientProps {
  tab: string;
  currentPage: number;
  totalPages: number;
  searchQuery: string;
}

const selectStyle: React.CSSProperties = {
  background: "rgba(15,30,53,0.6)",
  border: "1px solid var(--divider)",
  color: "var(--text-primary)",
};

export default function DriversClient({ tab, currentPage, totalPages, searchQuery }: DriversClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(searchQuery);

  const updateSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("q", search); else params.delete("q");
    params.delete("page");
    startTransition(() => router.push(`/dashboard/drivers?${params.toString()}`));
  };

  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/dashboard/drivers?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative flex items-center">
        <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateSearch()}
          placeholder="بحث بالاسم أو اللوحة أو الهوية..."
          id="drivers-search-input"
          className="pr-8 pl-8 py-2 rounded-xl text-[12px] outline-none w-48 sm:w-60"
          style={selectStyle}
        />
        {search && (
          <button onClick={() => { setSearch(""); const p = new URLSearchParams(searchParams.toString()); p.delete("q"); router.push(`/dashboard/drivers?${p.toString()}`); }}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary">
            <X size={11} />
          </button>
        )}
      </div>
      <button onClick={updateSearch} id="drivers-search-btn"
        className="px-3 py-2 rounded-xl text-[11px] font-bold text-white"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}>
        بحث
      </button>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 mr-auto">
          <button onClick={() => goPage(currentPage - 1)} disabled={currentPage <= 1}
            className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-30"
            style={selectStyle}>
            <ChevronRight size={13} />
          </button>
          <span className="text-[12px] text-text-secondary px-1">{currentPage}/{totalPages}</span>
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
