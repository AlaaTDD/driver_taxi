// Route-level loading skeleton for /dashboard/users.
// Mirrors drivers/loading.tsx's technique (neutral surface/divider tokens +
// animate-pulse only — no new colors) but follows the users page's actual
// layout: header + stats grid + search/filter bar + table, no tabs.

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="dash-page-header">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl shrink-0 animate-pulse" style={{ background: "var(--surface-elevated)" }} />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded-md animate-pulse" style={{ background: "var(--surface-elevated)" }} />
            <div className="h-3 w-56 rounded-md animate-pulse" style={{ background: "var(--surface-elevated)" }} />
          </div>
        </div>
        <div className="h-7 w-32 rounded-xl animate-pulse" style={{ background: "var(--surface-elevated)" }} />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="dash-stat p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl animate-pulse" style={{ background: "var(--surface-elevated)" }} />
              <div className="h-7 w-10 rounded-md animate-pulse" style={{ background: "var(--surface-elevated)" }} />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-20 rounded-md animate-pulse" style={{ background: "var(--surface-elevated)" }} />
              <div className="h-2.5 w-24 rounded-md animate-pulse" style={{ background: "var(--surface-elevated)", opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Search + filters bar skeleton */}
      <div
        className="flex items-center gap-3 flex-wrap p-3 rounded-2xl"
        style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}
      >
        <div className="h-10 flex-1 min-w-[240px] max-w-md rounded-xl animate-pulse" style={{ background: "var(--surface)" }} />
        <div className="h-10 w-20 rounded-xl animate-pulse" style={{ background: "var(--surface)" }} />
        <div className="hidden sm:block w-px h-8" style={{ background: "var(--divider)" }} />
        <div className="h-9 w-24 rounded-xl animate-pulse" style={{ background: "var(--surface)" }} />
        <div className="h-9 w-24 rounded-xl animate-pulse" style={{ background: "var(--surface)" }} />
      </div>

      {/* Table skeleton */}
      <div className="dash-table-card">
        <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-xl shrink-0 animate-pulse" style={{ background: "var(--surface-elevated)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 rounded-md animate-pulse" style={{ background: "var(--surface-elevated)" }} />
                <div className="h-3 w-40 rounded-md animate-pulse" style={{ background: "var(--surface-elevated)", opacity: 0.7 }} />
              </div>
              <div className="h-3 w-20 rounded-md animate-pulse hidden sm:block" style={{ background: "var(--surface-elevated)" }} />
              <div className="h-6 w-16 rounded-full animate-pulse hidden md:block" style={{ background: "var(--surface-elevated)" }} />
              <div className="h-6 w-16 rounded-full animate-pulse hidden lg:block" style={{ background: "var(--surface-elevated)" }} />
              <div className="h-8 w-8 rounded-lg animate-pulse" style={{ background: "var(--surface-elevated)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
