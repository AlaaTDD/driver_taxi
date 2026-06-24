"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface DriversClientProps {
  tab: string;
  currentPage: number;
  totalPages: number;
  searchQuery: string;
}

export default function DriversClient({ tab, currentPage, totalPages, searchQuery }: DriversClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();
  const [search, setSearch] = useState(searchQuery);

  // ── Toast on ?success= / ?error= (redirect feedback from API routes) ─────
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      const map: Record<string, string> = {
        driver_verified: t("drivers.toast.verified"),
        driver_revoked: t("drivers.toast.revoked"),
        driver_blocked: t("drivers.toast.blocked"),
        driver_unblocked: t("drivers.toast.unblocked"),
        revision_sent: t("drivers.toast.revisionSent"),
      };
      toast.success(map[success] ?? t("common.success"));
    }

    if (error) {
      const errMap: Record<string, string> = {
        missing_id: t("common.error"),
        verify_failed: t("common.error"),
        revoke_failed: t("common.error"),
        toggle_failed: t("common.error"),
        block_failed: t("common.error"),
        unblock_failed: t("common.error"),
      };
      toast.error(errMap[error] ?? t("common.error"));
    }

    if (success || error) {
      // Clean the toast param so refresh/back doesn't re-fire it, but keep tab.
      const params = new URLSearchParams(searchParams.toString());
      params.delete("success");
      params.delete("error");
      const qs = params.toString();
      const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      window.history.replaceState(null, "", url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const updateSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("q", search);
    else params.delete("q");
    params.delete("page");
    startTransition(() => router.push(`/dashboard/drivers?${params.toString()}`));
  };

  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    startTransition(() => router.push(`/dashboard/drivers?${params.toString()}`));
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
         SEARCH + PAGINATION BAR
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 flex-wrap p-2.5 rounded-2xl bg-surface-elevated border border-divider">
        {/* Search input */}
        <div className="relative flex items-center flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateSearch()}
            placeholder={t("common.search")}
            id="drivers-search-input"
            className="input-field !py-2.5 !pr-9 !pl-9 !text-[12px] !font-bold !rounded-xl"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                const p = new URLSearchParams(searchParams.toString());
                p.delete("q");
                startTransition(() => router.push(`/dashboard/drivers?${p.toString()}`));
              }}
              aria-label="مسح البحث"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-primary transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Search button */}
        <button
          onClick={updateSearch}
          disabled={isPending}
          id="drivers-search-btn"
          className="btn btn-primary !px-4 !py-2.5 !text-[11px] disabled:opacity-60 disabled:cursor-wait"
        >
          {isPending
            ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : t("common.search")}
        </button>

        {/* Pagination — pushed to the left */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 mr-auto" style={{ opacity: isPending ? 0.6 : 1 }}>
            <button
              onClick={() => goPage(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              aria-label={t("common.previous")}
              className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-25 transition-all bg-surface border border-divider text-text-secondary"
            >
              <ChevronRight size={13} />
            </button>
            <div className="px-3 py-1 rounded-lg text-[12px] font-bold num bg-primary/10 border border-primary/20 text-primary">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => goPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
              aria-label={t("common.next")}
              className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-25 transition-all bg-surface border border-divider text-text-secondary"
            >
              <ChevronLeft size={13} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
