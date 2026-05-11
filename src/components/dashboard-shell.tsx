"use client";

import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import Sidebar from "./sidebar";


export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh flex bg-background">
      <Sidebar />

      <main className="flex-1 w-full overflow-x-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-divider z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-white font-bold text-xs">
              T
            </div>
            <span className="font-bold text-text-primary text-sm">Taxi Admin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <LanguageSwitcher />
            {/* The mobile menu toggle is now handled inside Sidebar component */}
          </div>
        </header>

        {/* Main Content */}
        <div className="pt-14 lg:pt-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
