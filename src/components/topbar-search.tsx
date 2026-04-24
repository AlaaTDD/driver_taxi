"use client";

import { Search } from "lucide-react";

export function TopBarSearch() {
  return (
    <div className="hidden md:flex items-center flex-1 max-w-sm">
      <div className="relative w-full group">
        <Search
          size={14}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-disabled group-focus-within:text-primary transition-colors duration-200 pointer-events-none"
        />
        <input
          type="text"
          placeholder="بحث سريع..."
          className="w-full pr-10 pl-4 py-2.5 rounded-xl text-[13px] outline-none transition-all duration-200 focus:ring-[3px] focus:ring-primary/15 focus:border-primary"
          style={{
            background: "rgba(15, 30, 53, 0.6)",
            border: "1px solid var(--divider)",
            color: "var(--text-primary)",
          }}
        />
      </div>
    </div>
  );
}
