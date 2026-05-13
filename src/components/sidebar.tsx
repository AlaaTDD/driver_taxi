"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Users, Car, MapPin, Tag, DollarSign,
  Bell, MessageSquare, MessageSquareWarning, LogOut, Menu,
  X, Star, Shield, Truck, ArrowLeftRight, Ticket,
  Navigation, Wallet, Banknote, PanelRightClose, PanelRightOpen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar, SIDEBAR_EXPANDED_W, SIDEBAR_COLLAPSED_W } from "./sidebar-context";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES & DATA
───────────────────────────────────────────────────────────────────────────── */

type NavItem = {
  href:   string;
  label:  string;
  icon:   LucideIcon;
  rgb:    string;
  badge?: number;
};

type NavGroup = {
  id:     string;
  label?: string;
  items:  NavItem[];
};

const PRIMARY_RGB = "var(--primary-rgb)";

const getNavGroups = (t: any): NavGroup[] => [
  {
    id: "overview",
    items: [
      { href: "/dashboard",                  label: t("dashboard.overview"),          icon: LayoutDashboard,      rgb: PRIMARY_RGB },
    ],
  },
  {
    id: "people",
    label: t("sidebar.sections.people"),
    items: [
      { href: "/dashboard/users",            label: t("common.users"),          icon: Users,                rgb: PRIMARY_RGB },
      { href: "/dashboard/drivers",          label: t("common.drivers"),            icon: Car,                  rgb: PRIMARY_RGB },
      { href: "/dashboard/driver-locations", label: t("common.driverLocations"),      icon: Navigation,           rgb: PRIMARY_RGB },
    ],
  },
  {
    id: "operations",
    label: t("sidebar.sections.operations"),
    items: [
      { href: "/dashboard/trips",            label: t("common.trips"),             icon: MapPin,               rgb: PRIMARY_RGB },
      { href: "/dashboard/trip-offers",      label: t("common.tripOffers"),        icon: ArrowLeftRight,       rgb: PRIMARY_RGB },
      { href: "/dashboard/ratings",          label: t("common.ratings"),           icon: Star,                 rgb: PRIMARY_RGB },
      { href: "/dashboard/complaints",       label: t("common.complaints"),             icon: MessageSquareWarning, rgb: PRIMARY_RGB },
    ],
  },
  {
    id: "financial",
    label: t("sidebar.sections.financial"),
    items: [
      { href: "/dashboard/pricing",          label: t("common.pricing"),             icon: DollarSign,           rgb: PRIMARY_RGB },
      { href: "/dashboard/coupons",          label: t("common.coupons"),           icon: Tag,                  rgb: PRIMARY_RGB },
      { href: "/dashboard/user-coupons",     label: t("common.userCoupons"),  icon: Ticket,               rgb: PRIMARY_RGB },
      { href: "/dashboard/wallets",          label: t("wallets.title"),     icon: Wallet,               rgb: PRIMARY_RGB },
      { href: "/dashboard/withdrawals",      label: t("withdrawals.title"),         icon: Banknote,             rgb: PRIMARY_RGB },
    ],
  },
  {
    id: "system",
    label: t("sidebar.sections.system"),
    items: [
      { href: "/dashboard/vehicle-types",    label: t("common.vehicleTypes"),      icon: Truck,                rgb: PRIMARY_RGB },
      { href: "/dashboard/notifications",    label: t("common.notifications"),           icon: Bell,                 rgb: PRIMARY_RGB },
      { href: "/dashboard/messages",         label: t("common.messages"),             icon: MessageSquare,        rgb: PRIMARY_RGB },
      { href: "/dashboard/admin-logs",       label: t("common.adminLogs"),          icon: Shield,               rgb: PRIMARY_RGB },
    ],
  },
  {
    id: "settings",
    label: t("sidebar.sections.settings"),
    items: [
      { href: "/dashboard/settings",         label: t("common.settings"),    icon: Settings,             rgb: PRIMARY_RGB },
    ],
  },
];

const EXPANDED_W  = SIDEBAR_EXPANDED_W;
const COLLAPSED_W = SIDEBAR_COLLAPSED_W;

/* ─────────────────────────────────────────────────────────────────────────────
   FLOATING TOOLTIP
───────────────────────────────────────────────────────────────────────────── */

type TooltipState = { label: string; y: number } | null;

function FloatingTooltip({ tip }: { tip: TooltipState }) {
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none fixed z-[9999] flex items-center"
      style={{ top: tip.y, right: COLLAPSED_W + 8, transform: "translateY(-50%)" }}
    >
      <div
        className="w-0 h-0"
        style={{
          borderTop:    "5px solid transparent",
          borderBottom: "5px solid transparent",
          borderLeft:   "5px solid var(--tooltip-bg, rgba(20,32,52,0.97))",
        }}
      />
      <div
        className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-semibold sidebar-tooltip"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {tip.label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   NAV LINK
───────────────────────────────────────────────────────────────────────────── */

function NavLink({
  item,
  isActive,
  collapsed,
  animDelay,
  onClose,
  onTooltip,
}: {
  item:      NavItem;
  isActive:  boolean;
  collapsed: boolean;
  animDelay: number;
  onClose?:  () => void;
  onTooltip: (tip: TooltipState) => void;
}) {
  const { rgb } = item;
  const ref = useRef<HTMLAnchorElement>(null);

  const showTip = useCallback(() => {
    if (!collapsed) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    onTooltip({ label: item.label, y: r.top + r.height / 2 });
  }, [collapsed, item.label, onTooltip]);

  const hideTip = useCallback(() => onTooltip(null), [onTooltip]);

  return (
    <Link
      ref={ref}
      href={item.href}
      scroll={false}
      onClick={() => { hideTip(); onClose?.(); }}
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
      className={cn(
        "sidebar-nav-link group relative flex items-center rounded-xl text-[13px] font-bold",
        "transition-all duration-300 overflow-hidden animate-fade-in",
        collapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5",
        isActive ? "sidebar-nav-active" : "sidebar-nav-inactive"
      )}
      style={{
        animationDelay:    `${animDelay}s`,
        animationFillMode: "both",
      }}
    >
      {/* active fill */}
      {isActive && (
        <>
          <div
            className="absolute inset-0 rounded-xl backdrop-blur-md"
            style={{
              background: `rgba(${rgb}, 0.15)`,
              border:     `1px solid rgba(${rgb}, 0.3)`,
              boxShadow:  "inset 0 1px 1px rgba(255,255,255,0.05)",
            }}
          />
          {/* top specular glint */}
          <div
            className="absolute inset-x-3 top-0 h-px"
            style={{
              background: `linear-gradient(to right, transparent, rgba(${rgb},0.5), transparent)`,
            }}
          />
        </>
      )}

      {/* hover fill — inactive only */}
      {!isActive && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 sidebar-nav-hover-fill"
        />
      )}

      {/* right accent bar */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 rounded-l-full"
        style={{
          width:      "3px",
          height:     isActive ? "24px" : "0px",
          background: `linear-gradient(to bottom, rgba(${rgb},1), rgba(${rgb},0.4))`,
          boxShadow:  isActive ? `0 0 16px rgba(${rgb},0.8), 0 0 6px rgba(${rgb},1)` : "none",
          transition: "height 250ms cubic-bezier(0.16,1,0.3,1), box-shadow 250ms ease",
        }}
      />

      {/* icon container */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-200"
        style={{
          width:      collapsed ? 36 : 28,
          height:     collapsed ? 36 : 28,
          background: isActive
            ? `rgba(${rgb}, 0.14)`
            : "var(--sidebar-icon-bg)",
          border: isActive
            ? `1px solid rgba(${rgb}, 0.24)`
            : "1px solid var(--sidebar-icon-border)",
        }}
      >
        <item.icon
          size={collapsed ? 16 : 14}
          style={{
            color:      `rgb(${rgb})`,
            opacity:    isActive ? 1 : 0.5,
            filter:     isActive ? `drop-shadow(0 0 5px rgba(${rgb},0.75))` : undefined,
            transition: "all 0.2s ease",
          }}
          className="group-hover:opacity-75"
        />
        {/* pulse ring on active */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-lg animate-pulse"
            style={{
              background:        `rgba(${rgb}, 0.15)`,
              animationDuration: "3s",
            }}
          />
        )}
      </div>

      {/* label */}
      {!collapsed && (
        <>
          <span className="relative flex-1 truncate transition-colors duration-150 group-hover:sidebar-nav-label-hover">
            {item.label}
          </span>
          {item.badge != null && item.badge > 0 && (
            <span
              className="relative flex-shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold leading-none"
              style={{
                background: `rgba(${rgb}, 0.16)`,
                color:      `rgb(${rgb})`,
                border:     `1px solid rgba(${rgb}, 0.26)`,
              }}
            >
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SIDEBAR CONTENT
───────────────────────────────────────────────────────────────────────────── */

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onClose,
}: {
  collapsed:        boolean;
  onToggleCollapse: () => void;
  onClose?:         () => void;
}) {
  const pathname = usePathname();
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const t = useTranslations();
  
  const navGroups = getNavGroups(t);

  let idx = 0;
  const nextDelay = () => { const d = idx * 0.027; idx++; return d; };

  return (
    <div className="relative flex flex-col h-full overflow-hidden sidebar-root dashboard-sidebar-root">

      {/* ── noise texture (dark only) ────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 sidebar-noise"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize:  "180px 180px",
        }}
      />

      {/* ── top ambient glow ─────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-36 z-0 sidebar-top-glow" />

      {/* ══ BRAND HEADER ══════════════════════════════════════════════════ */}
      <div
        className="relative z-10 flex-shrink-0 overflow-hidden"
        style={{
          padding: collapsed ? "20px 8px 16px" : "22px 20px 16px",
        }}
      >
        <div
          className="flex items-center"
          style={{
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? 0 : "14px",
          }}
        >
          {/* Logo */}
          <div
            className="sidebar-brand-logo-wrap flex-shrink-0 flex items-center justify-center transition-all duration-300"
            style={{
              width: collapsed ? 42 : 44,
              height: collapsed ? 42 : 44,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28 }}>
              <path d="M3 14h18v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3z" fill="var(--primary)" />
              <path d="M5.5 14l2-5h9l2 5" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="var(--primary-surface)" />
              <rect x="9" y="6" width="6" height="3" rx="1" fill="var(--primary-dark)" />
              <circle cx="7" cy="18" r="1.5" fill="var(--primary)" />
              <circle cx="17" cy="18" r="1.5" fill="var(--primary)" />
            </svg>
          </div>

          {/* Brand text */}
          <div
            className="flex flex-col gap-1 overflow-hidden"
            style={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
              transition: "opacity 180ms ease, width 280ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <span className="sidebar-brand-name text-[18px] font-black leading-none tracking-tight whitespace-nowrap select-none">
              Taxi
            </span>
            <span className="sidebar-brand-sub text-[10px] font-bold tracking-[0.14em] uppercase whitespace-nowrap select-none">
              {t("common.dashboard")}
            </span>
          </div>
        </div>

        {/* Brand divider */}
        <div
          className="mt-4 h-px sidebar-divider"
          style={{ marginInline: collapsed ? 0 : "4px" }}
        />
      </div>

      {/* ══ NAVIGATION ════════════════════════════════════════════════════ */}
      <nav
        className={cn(
          "relative z-10 flex-1 overflow-y-auto pb-3 hide-scrollbar",
          collapsed ? "px-2 space-y-0.5" : "px-3 space-y-0.5"
        )}
      >
        {navGroups.map((group, gi) => (
          <div key={group.id} className={cn(gi > 0 && "pt-4")}>
            {group.label && !collapsed && (
              <div className="flex items-center gap-2 px-3 pb-1.5">
                <span className="sidebar-group-label text-[9px] font-bold tracking-[0.16em] uppercase whitespace-nowrap">
                  {group.label}
                </span>
                <div className="flex-1 h-px sidebar-group-line" />
              </div>
            )}

            {group.label && collapsed && gi > 0 && (
              <div className="flex justify-center mb-1">
                <div className="w-1 h-1 rounded-full sidebar-group-dot" />
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <NavLink
                    key={item.href}
                    item={item}
                    isActive={isActive}
                    collapsed={collapsed}
                    animDelay={nextDelay()}
                    onClose={onClose}
                    onTooltip={setTooltip}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      <div className={cn("relative z-10 flex-shrink-0 pb-4", collapsed ? "px-2" : "px-3")}>
        <div className={cn("mb-3 h-px sidebar-divider", collapsed ? "mx-0" : "mx-1")} />

        {/* Logout */}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            onMouseEnter={(e) => {
              if (!collapsed) return;
              const r = e.currentTarget.getBoundingClientRect();
              setTooltip({ label: t("sidebar.logout"), y: r.top + r.height / 2 });
            }}
            onMouseLeave={() => setTooltip(null)}
            className={cn(
              "sidebar-logout-btn group relative flex w-full items-center rounded-xl text-[13px] font-semibold",
              "transition-all duration-200 overflow-hidden",
              collapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5"
            )}
          >
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 sidebar-logout-hover-fill" />
            <div
              className="relative flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-200 sidebar-logout-icon-wrap"
              style={{ width: collapsed ? 36 : 28, height: collapsed ? 36 : 28 }}
            >
              <LogOut
                size={14}
                className="transition-colors duration-200 group-hover:text-red-400 sidebar-logout-icon"
              />
            </div>
            {!collapsed && (
              <span className="relative sidebar-logout-text transition-colors duration-200" style={{ color: "var(--error)" }}>
                {t("sidebar.logout")}
              </span>
            )}
          </button>
        </form>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          onMouseEnter={(e) => {
            if (!collapsed) return;
            const r = e.currentTarget.getBoundingClientRect();
            setTooltip({ label: t("sidebar.expand"), y: r.top + r.height / 2 });
          }}
          onMouseLeave={() => setTooltip(null)}
          className={cn(
            "sidebar-footer-btn group relative flex w-full items-center rounded-xl text-[12px] font-semibold",
            "transition-all duration-200 overflow-hidden mt-1",
            collapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
          )}
        >
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 sidebar-nav-hover-fill" />
          <div
            className="relative flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-200"
            style={{ width: collapsed ? 36 : 28, height: collapsed ? 36 : 28 }}
          >
            {collapsed
              ? <PanelRightClose size={13} className="sidebar-footer-icon transition-colors" />
              : <PanelRightOpen  size={13} className="sidebar-footer-icon transition-colors" />
            }
          </div>
          {!collapsed && (
            <span className="relative sidebar-footer-text transition-colors">
              {t("sidebar.collapse")}
            </span>
          )}
        </button>

      </div>

      <FloatingTooltip tip={tooltip} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────────────────────── */

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle: toggleCollapse } = useSidebar();

  return (
    <>
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 rounded-xl sidebar-mobile-toggle"
        aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
      >
        {mobileOpen ? <X size={17} /> : <Menu size={17} />}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 sidebar-backdrop backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 right-0 z-40 flex flex-col",
          "sidebar-panel border-l transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          width:     EXPANDED_W,
          boxShadow: mobileOpen ? "-28px 0 64px rgba(0,0,0,0.35)" : "none",
        }}
      >
        <SidebarContent
          collapsed={false}
          onToggleCollapse={toggleCollapse}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      <aside
        className="hidden lg:flex flex-col h-full sidebar-panel dashboard-sidebar-panel border-l"
        style={{
          width:      collapsed ? COLLAPSED_W : EXPANDED_W,
          minWidth:   collapsed ? COLLAPSED_W : EXPANDED_W,
          transition: "width 280ms cubic-bezier(0.16,1,0.3,1), min-width 280ms cubic-bezier(0.16,1,0.3,1)",
          overflow:   "visible",
          boxShadow:  "var(--sidebar-chrome-shadow)",
        }}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>
    </>
  );
}
