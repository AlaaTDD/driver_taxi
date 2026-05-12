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

  const today = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "long", month: "long", day: "numeric",
  }).format(new Date());

  const isRtl = locale === "ar";

  return (
    <header
      className="dashboard-chrome flex-shrink-0 flex w-full z-40 sticky top-0"
      style={{ height: TOPBAR_H }}
    >
      {/* ── Sidebar Brand Zone: the only app mark in the dashboard chrome ── */}
      <div
        className="dashboard-brand-zone hidden lg:flex flex-shrink-0 items-center overflow-hidden transition-all duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: sidebarW,
          minWidth: sidebarW,
          paddingInlineStart: collapsed ? 0 : "20px",
          paddingInlineEnd: collapsed ? 0 : "12px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : "12px",
        }}
      >
        {/* Logo icon */}
        <div
          className="dashboard-brand-logo flex-shrink-0 flex items-center justify-center rounded-xl border sidebar-logo transition-all duration-300"
          style={{ width: 38, height: 38 }}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18 }}>
            <path d="M3 14h18v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3z" fill="rgba(255,255,255,0.95)" />
            <path d="M5.5 14l2-5h9l2 5" stroke="rgba(255,255,255,0.95)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.15)" />
            <rect x="9" y="6" width="6" height="3" rx="1" fill="rgba(255,255,255,0.9)" />
            <circle cx="7" cy="18" r="1.5" fill="rgba(255,255,255,0.9)" />
            <circle cx="17" cy="18" r="1.5" fill="rgba(255,255,255,0.9)" />
          </svg>
        </div>

        {/* Brand text */}
        <div
          className="flex flex-col gap-0.5 overflow-hidden"
          style={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : "auto",
            transition: "opacity 180ms ease, width 280ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <span className="sidebar-brand-name text-[15px] font-black leading-none tracking-tight whitespace-nowrap select-none">
            Taxi
          </span>
          <span className="sidebar-brand-sub text-[9px] font-bold tracking-[0.16em] uppercase whitespace-nowrap select-none">
            {t("common.dashboard")}
          </span>
        </div>
      </div>

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
          {/* Date chip */}
          <div
            className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] text-text-secondary font-semibold dashboard-date-chip"
          >
            <CalendarDays size={12} className="text-primary" />
            <span suppressHydrationWarning>{today}</span>
          </div>

          {/* Notification bell */}
          <Link
            href="/dashboard/notifications"
            aria-label={t("common.notifications")}
            className="group relative flex items-center justify-center rounded-xl transition-all duration-200 dashboard-icon-button"
            style={{ width: 38, height: 38 }}
          >
            <Bell size={15} className="group-hover:text-primary transition-colors" />
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
              style={{ background: "var(--error)", boxShadow: "0 0 0 2px var(--chrome-main-bg)" }}
            />
          </Link>

          {/* Theme toggle */}
          <div className="hidden md:block w-[134px]">
            <ThemeToggle />
          </div>
          <div className="md:hidden">
            <ThemeToggle collapsed />
          </div>

          {/* Language switcher */}
          <div className="hidden md:block w-[140px]">
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
