"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Users, Car, MapPin, Tag, DollarSign,
  Bell, MessageSquare, MessageSquareWarning, LogOut, Menu,
  X, Star, Shield, Truck, ArrowLeftRight, Ticket,
  Navigation, Wallet, Banknote, PanelRightClose, PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES & DATA
───────────────────────────────────────────────────────────────────────────── */

type NavItem = {
  href:   string;
  label:  string;
  icon:   LucideIcon;
  /** "r,g,b" — الآن موحد على لون الـ Primary فقط */
  rgb:    string;
  badge?: number;
};

type NavGroup = {
  id:     string;
  label?: string;
  items:  NavItem[];
};

/* ────── تم توحيد الألوان كلها على أزرق الكوبالت (#1b4ec0 = 27,78,192) ────── */
const PRIMARY_RGB = "27,78,192";

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
      { href: "/dashboard/settings",         label: t("common.settings"),    icon: Shield,               rgb: PRIMARY_RGB },
    ],
  },
];

const EXPANDED_W  = 260;
const COLLAPSED_W = 64;

/* ─────────────────────────────────────────────────────────────────────────────
   FLOATING TOOLTIP
   Fixed positioning so it never clips on overflow:hidden sidebar.
   Fully theme-aware via CSS variables.
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
   NAV LINK — theme-aware active/hover states (الآن كل الألوان موحدة)
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
  const { rgb } = item; // الآن دائماً سيأخذ PRIMARY_RGB
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
      onClick={() => { hideTip(); onClose?.(); }}
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
      className={cn(
        "sidebar-nav-link group relative flex items-center rounded-xl text-[13px] font-semibold",
        "transition-all duration-200 overflow-hidden animate-fade-in",
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
            className="absolute inset-0 rounded-xl"
            style={{
              background: `rgba(${rgb}, 0.12)`,
              border:     `1px solid rgba(${rgb}, 0.22)`,
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

      {/* right accent bar — بنفس اللون الموحد */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 rounded-l-full"
        style={{
          width:      "2.5px",
          height:     isActive ? "22px" : "0px",
          background: `linear-gradient(to bottom, rgba(${rgb},0.95), rgba(${rgb},0.35))`,
          boxShadow:  isActive ? `0 0 12px rgba(${rgb},0.6), 0 0 4px rgba(${rgb},0.9)` : "none",
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
   SIDEBAR CONTENT (بدون تعديلات كبيرة، بس الألوان موحدة دلوقتي)
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
    <div className="relative flex flex-col h-full overflow-hidden sidebar-root">

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

      {/* ── BRAND ───────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative z-10 flex flex-shrink-0 items-center transition-all duration-300",
          collapsed ? "justify-center px-2 py-5" : "gap-3.5 px-5 pt-6 pb-5"
        )}
      >
        <div className="relative flex-shrink-0">
          <div
            className="relative flex items-center justify-center rounded-xl border sidebar-logo"
            style={{
              width:  collapsed ? 38 : 42,
              height: collapsed ? 38 : 42,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: collapsed ? 18 : 20, height: collapsed ? 18 : 20 }}
            >
              <path d="M3 14h18v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3z" fill="rgba(255,255,255,0.95)" />
              <path d="M5.5 14l2-5h9l2 5" stroke="rgba(255,255,255,0.95)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.15)" />
              <rect x="9" y="6" width="6" height="3" rx="1" fill="#FBBF24" />
              <rect x="10.5" y="6.7" width="3" height="1.5" rx="0.5" fill="#F59E0B" opacity="0.6" />
              <circle cx="7" cy="18" r="1.5" fill="rgba(255,255,255,0.9)" />
              <circle cx="17" cy="18" r="1.5" fill="rgba(255,255,255,0.9)" />
              <rect x="19" y="14.5" width="1.5" height="1" rx="0.5" fill="#FBBF24" opacity="0.8" />
              <rect x="3.5" y="14.5" width="1.5" height="1" rx="0.5" fill="#FCA5A5" opacity="0.7" />
            </svg>
          </div>
        </div>

        <div
          className="flex flex-col gap-0.5 overflow-hidden"
          style={{
            width: collapsed ? 0 : "auto",
            opacity: collapsed ? 0 : 1,
            transition: "opacity 200ms ease, width 280ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <span className="sidebar-brand-name text-[16px] font-black leading-none tracking-tight whitespace-nowrap select-none">
            Taxi
          </span>
          <span className="sidebar-brand-sub text-[9.5px] font-bold tracking-[0.15em] whitespace-nowrap select-none">
            {t("common.dashboard")}
          </span>
        </div>
      </div>

      <div className={cn("relative z-10 flex-shrink-0", collapsed ? "mx-2" : "mx-4")}>
        <div className="sidebar-divider h-px" />
      </div>

      <nav
        className={cn(
          "relative z-10 flex-1 overflow-y-auto py-3 hide-scrollbar",
          collapsed ? "px-2 space-y-0.5" : "px-3 space-y-0.5"
        )}
        style={{
          maskImage:       "linear-gradient(to bottom, black 86%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 86%, transparent 100%)",
        }}
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

      <div className={cn("relative z-10 flex-shrink-0 pb-4", collapsed ? "px-2" : "px-3")}>
        <div className={cn("mb-3 h-px sidebar-divider", collapsed ? "mx-0" : "mx-1")} />

        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5 mb-2">
            <div
              onMouseEnter={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setTooltip({ label: t("sidebar.theme") || "تغيير المظهر", y: r.top + r.height / 2 });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <ThemeToggle collapsed />
            </div>
            <div
              onMouseEnter={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setTooltip({ label: t("sidebar.language") || "تغيير اللغة", y: r.top + r.height / 2 });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <LanguageSwitcher collapsed />
            </div>
          </div>
        ) : (
          <div className="mb-3 space-y-0.5">
            <ThemeToggle collapsed={false} />
            <LanguageSwitcher collapsed={false} />
          </div>
        )}

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

        {!collapsed && (
          <p className="sidebar-version text-center text-[9px] font-bold tracking-[0.15em] uppercase mt-3">
            v2.0 · {t("metadata.title")}
          </p>
        )}
      </div>

      <FloatingTooltip tip={tooltip} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN EXPORT (بدون تغيير)
───────────────────────────────────────────────────────────────────────────── */

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);

  useEffect(() => {
    setTimeout(() => {
      try {
        const stored = localStorage.getItem("sidebar-collapsed");
        if (stored !== null) setCollapsed(stored === "true");
      } catch { /* SSR / private mode */ }
    }, 0);
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem("sidebar-collapsed", String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

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
        className="hidden lg:flex flex-col sticky top-0 h-screen sidebar-panel border-l"
        style={{
          width:      collapsed ? COLLAPSED_W : EXPANDED_W,
          minWidth:   collapsed ? COLLAPSED_W : EXPANDED_W,
          transition: "width 280ms cubic-bezier(0.16,1,0.3,1), min-width 280ms cubic-bezier(0.16,1,0.3,1)",
          overflow:   "visible",
          boxShadow:  "inset -1px 0 0 var(--sidebar-border), 8px 0 32px rgba(0,0,0,0.12)",
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