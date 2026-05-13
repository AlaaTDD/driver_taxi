"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useSidebar, SIDEBAR_EXPANDED_W, SIDEBAR_COLLAPSED_W } from "./sidebar-context";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import {
  Bell, CalendarDays, Car, DollarSign, LayoutDashboard,
  MapPin, MessageSquare, MessageSquareWarning, Navigation,
  Shield, Star, Tag, Ticket, Truck, Users, Wallet, Banknote,
  Settings, ArrowLeftRight, ChevronLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TOPBAR_H = 72;

export function UnifiedTopBar() {
  const { collapsed } = useSidebar();
  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W;
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();

  const routes: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/dashboard/driver-locations", label: t("common.driverLocations"), icon: Navigation },
    { href: "/dashboard/trip-offers",      label: t("common.tripOffers"),       icon: ArrowLeftRight },
    { href: "/dashboard/user-coupons",     label: t("common.userCoupons"),      icon: Ticket },
    { href: "/dashboard/vehicle-types",    label: t("common.vehicleTypes"),     icon: Truck },
    { href: "/dashboard/notifications",    label: t("common.notifications"),    icon: Bell },
    { href: "/dashboard/withdrawals",      label: t("withdrawals.title"),       icon: Banknote },
    { href: "/dashboard/admin-logs",       label: t("common.adminLogs"),        icon: Shield },
    { href: "/dashboard/complaints",       label: t("common.complaints"),       icon: MessageSquareWarning },
    { href: "/dashboard/messages",         label: t("common.messages"),         icon: MessageSquare },
    { href: "/dashboard/settings",         label: t("common.settings"),         icon: Settings },
    { href: "/dashboard/pricing",          label: t("common.pricing"),          icon: DollarSign },
    { href: "/dashboard/coupons",          label: t("common.coupons"),          icon: Tag },
    { href: "/dashboard/wallets",          label: t("wallets.title"),           icon: Wallet },
    { href: "/dashboard/ratings",          label: t("common.ratings"),          icon: Star },
    { href: "/dashboard/drivers",          label: t("common.drivers"),          icon: Car },
    { href: "/dashboard/trips",            label: t("common.trips"),            icon: MapPin },
    { href: "/dashboard/users",            label: t("common.users"),            icon: Users },
    { href: "/dashboard",                  label: t("dashboard.overview"),      icon: LayoutDashboard },
  ];

  const current =
    routes.find(r => pathname === r.href || (r.href !== "/dashboard" && pathname.startsWith(r.href))) ??
    routes[routes.length - 1];
  const CurrentIcon = current.icon;



  const isRtl = locale === "ar";

  return (
    <header
      className="dashboard-chrome flex-shrink-0 flex w-full z-40 sticky top-0"
      style={{ height: TOPBAR_H }}
    >


      {/* ── Main topbar area ─────────────────────────────────── */}
      <div
        className="dashboard-main-topbar flex flex-1 items-center justify-between gap-3 px-4 sm:px-6"
      >
        {/* Page breadcrumb */}
        <div className="dashboard-route-chip flex items-center gap-2.5 min-w-0">
          <div
            className="hidden sm:flex items-center justify-center rounded-xl border flex-shrink-0 dashboard-route-icon"
            style={{ width: 36, height: 36 }}
          >
            <CurrentIcon size={16} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-black text-text-primary leading-tight truncate">
              {current.label}
            </span>
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-text-disabled font-medium">
              <span>{t("common.dashboard")}</span>
              <ChevronLeft size={9} className={isRtl ? "rotate-180" : ""} />
              <span className="text-text-tertiary">{current.label}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="dashboard-topbar-actions flex items-center gap-2">



          {/* Theme toggle */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <div className="md:hidden">
            <ThemeToggle collapsed />
          </div>

          {/* Language switcher */}
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <div className="md:hidden">
            <LanguageSwitcher collapsed />
          </div>
        </div>
      </div>
    </header>
  );
}
