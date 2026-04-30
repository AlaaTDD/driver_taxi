"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard, Users, Car, Route,
  MessageSquareWarning, Star, Ticket, TicketCheck,
  Bell, Truck, ScrollText, MessageCircle,
  ClipboardList, MapPin, LogOut, Menu, X,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { useState } from "react";

type NavSection = { titleKey?: string; items: { href: string; icon: React.ComponentType<{ size?: number; className?: string }>; labelKey: string }[] };

const navSections: NavSection[] = [
  {
    items: [
      { href: "/dashboard", icon: LayoutDashboard, labelKey: "common.dashboard" },
    ],
  },
  {
    titleKey: "sidebar.sections.operations",
    items: [
      { href: "/dashboard/users", icon: Users, labelKey: "common.users" },
      { href: "/dashboard/drivers", icon: Car, labelKey: "common.drivers" },
      { href: "/dashboard/trips", icon: Route, labelKey: "common.trips" },
      { href: "/dashboard/complaints", icon: MessageSquareWarning, labelKey: "common.complaints" },
      { href: "/dashboard/ratings", icon: Star, labelKey: "common.ratings" },
    ],
  },
  {
    titleKey: "sidebar.sections.marketing",
    items: [
      { href: "/dashboard/coupons", icon: Ticket, labelKey: "common.coupons" },
      { href: "/dashboard/user-coupons", icon: TicketCheck, labelKey: "common.userCoupons" },
      { href: "/dashboard/notifications", icon: Bell, labelKey: "common.notifications" },
      { href: "/dashboard/messages", icon: MessageCircle, labelKey: "common.messages" },
    ],
  },
  {
    titleKey: "sidebar.sections.system",
    items: [
      { href: "/dashboard/vehicle-types", icon: Truck, labelKey: "common.vehicleTypes" },
      { href: "/dashboard/trip-offers", icon: ClipboardList, labelKey: "common.tripOffers" },
      { href: "/dashboard/driver-locations", icon: MapPin, labelKey: "common.driverLocations" },
      { href: "/dashboard/admin-logs", icon: ScrollText, labelKey: "common.adminLogs" },
    ],
  },
];

function SidebarItem({ href, icon: Icon, labelKey, active, onClick }: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  labelKey: string;
  active: boolean;
  onClick?: () => void;
}) {
  const t = useTranslations();
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
        active
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent"
      }`}
    >
      <Icon
        size={18}
        className={`shrink-0 transition-colors ${
          active ? "text-primary" : "text-text-tertiary group-hover:text-text-secondary"
        }`}
      />
      <span className="truncate">{t(labelKey)}</span>
      {active && (
        <span className="mr-auto w-1 h-8 rounded-full bg-primary shrink-0 shadow-sm" />
      )}
    </Link>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[260px] flex-col border-l border-divider bg-surface fixed inset-y-0 right-0 z-40">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-divider">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
              T
            </div>
            <span className="font-bold text-text-primary text-sm">
              {t("metadata.title")}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto hide-scrollbar py-3 px-2.5">
          {navSections.map((section, si) => (
            <div key={si} className={si > 0 ? "mt-4" : ""}>
              {section.titleKey && (
                <p className="px-3.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary/70">
                  {t(section.titleKey)}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isHome = item.href === "/dashboard";
                  const active = isHome
                    ? pathname === "/dashboard"
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                  return <SidebarItem key={item.href} {...item} active={active} />;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-divider space-y-2">
          <div className="flex items-center gap-2 px-1">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-error/80 hover:text-error hover:bg-error/5 transition-colors"
            >
              <LogOut size={18} className="shrink-0" />
              <span>{t("common.logout")}</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-divider z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-white font-bold text-xs">
            T
          </div>
          <span className="font-bold text-text-primary text-sm">{t("metadata.title")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <LanguageSwitcher />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <aside
            className="absolute top-14 right-0 bottom-0 w-[260px] bg-surface border-l border-divider overflow-y-auto hide-scrollbar shadow-2xl"
            style={{ animation: "slide-in-right 0.2s cubic-bezier(0.16,1,0.3,1) forwards" }}
          >
            <nav className="py-3 px-2.5">
              {navSections.map((section, si) => (
                <div key={si} className={si > 0 ? "mt-4" : ""}>
                  {section.titleKey && (
                    <p className="px-3.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary/70">
                      {t(section.titleKey)}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isHome = item.href === "/dashboard";
                      const active = isHome
                        ? pathname === "/dashboard"
                        : pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <SidebarItem
                          key={item.href}
                          {...item}
                          active={active}
                          onClick={() => setMobileMenuOpen(false)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <div className="p-3 border-t border-divider">
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-error/80 hover:text-error hover:bg-error/5 transition-colors"
                >
                  <LogOut size={18} className="shrink-0" />
                  <span>{t("common.logout")}</span>
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:mr-[260px] min-h-dvh w-full overflow-x-hidden">
        <div className="pt-14 lg:pt-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
