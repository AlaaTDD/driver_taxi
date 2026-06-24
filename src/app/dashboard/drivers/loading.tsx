// Route-level loading skeleton for /dashboard/drivers.
// Next.js renders this automatically while the server component (page.tsx)
// is fetching data — covers the "no visual feedback while switching
// tabs/pages" gap, since the page is force-dynamic and always re-fetches.

export default function DriversLoading() {
  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="dash-page-header">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl shrink-0 animate-pulse" style={{ background: "var(--surface-elevated)" }} />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded-md animate-pulse" style={{ background: "var(--surface-elevated)" }} />
            <div className="h-3 w-56 rounded-md animate-pulse" style={{ background: "var(--surface-elevated)" }} />
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div
        className="flex gap-2 flex-wrap p-1.5 rounded-2xl"
        style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-28 rounded-xl animate-pulse" style={{ background: "var(--surface)", opacity: 0.6 }} />
        ))}
      </div>

      {/* Search bar skeleton */}
      <div className="flex items-center gap-3 p-2.5 rounded-2xl" style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}>
        <div className="h-10 flex-1 max-w-xs rounded-xl animate-pulse" style={{ background: "var(--surface)" }} />
        <div className="h-10 w-20 rounded-xl animate-pulse" style={{ background: "var(--surface)" }} />
      </div>

      {/* Table skeleton */}
      <div className="dash-table-card">
        <div className="dash-section-header">
          <div className="h-4 w-32 rounded-md animate-pulse" style={{ background: "var(--surface-elevated)" }} />
        </div>
        <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-xl shrink-0 animate-pulse" style={{ background: "var(--surface-elevated)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 rounded-md animate-pulse" style={{ background: "var(--surface-elevated)" }} />
                <div className="h-3 w-24 rounded-md animate-pulse" style={{ background: "var(--surface-elevated)", opacity: 0.7 }} />
              </div>
              <div className="h-8 w-20 rounded-lg animate-pulse hidden md:block" style={{ background: "var(--surface-elevated)" }} />
              <div className="h-8 w-24 rounded-lg animate-pulse hidden lg:block" style={{ background: "var(--surface-elevated)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
