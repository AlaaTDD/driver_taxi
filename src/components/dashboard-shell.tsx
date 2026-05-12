"use client";

import Sidebar from "./sidebar";
import { UnifiedTopBar } from "./unified-topbar";
import { SidebarProvider } from "./sidebar-context";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="dashboard-shell h-dvh flex flex-col bg-background overflow-hidden">
        {/* Full-width dashboard chrome: brand, navigation rail, and page controls */}
        <UnifiedTopBar />

        <div className="dashboard-body flex flex-1 min-h-0 overflow-hidden">
          <Sidebar />

          <main className="dashboard-main flex-1 min-w-0 overflow-y-auto">
            <div className="p-4 sm:p-5 lg:p-6 max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
