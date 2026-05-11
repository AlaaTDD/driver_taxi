"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Users, Car, MapPin, Tag, DollarSign,
  Bell, MessageSquare, MessageSquareWarning, LogOut, Menu,
  X, Zap, Star, Shield, Truck, ArrowLeftRight, Ticket,
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
  /** "r,g,b" — used to build rgba() cleanly */
  rgb:    string;
  badge?: number;
};

type NavGroup = {
  id:     string;
  label?: string;
  items:  NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    items: [
      { href: "/dashboard",                  label: "لوحة التحكم",         icon: LayoutDashboard,      rgb: "96,165,250"  },
    ],
  },
  {
    id: "people",
    label: "الأشخاص",
    items: [
      { href: "/dashboard/users",            label: "المستخدمين",          icon: Users,                rgb: "167,139,250" },
      { href: "/dashboard/drivers",          label: "السائقين",            icon: Car,                  rgb: "34,211,238"  },
      { href: "/dashboard/driver-locations", label: "مواقع السائقين",      icon: Navigation,           rgb: "99,179,237"  },
    ],
  },
  {
    id: "operations",
    label: "العمليات",
    items: [
      { href: "/dashboard/trips",            label: "الرحلات",             icon: MapPin,               rgb: "52,211,153"  },
      { href: "/dashboard/trip-offers",      label: "عروض الرحلات",        icon: ArrowLeftRight,       rgb: "192,132,252" },
      { href: "/dashboard/ratings",          label: "التقييمات",           icon: Star,                 rgb: "234,179,8"   },
      { href: "/dashboard/complaints",       label: "الشكاوي",             icon: MessageSquareWarning, rgb: "248,113,113" },
    ],
  },
  {
    id: "financial",
    label: "المالية",
    items: [
      { href: "/dashboard/pricing",          label: "التسعير",             icon: DollarSign,           rgb: "74,222,128"  },
      { href: "/dashboard/coupons",          label: "الكوبونات",           icon: Tag,                  rgb: "251,191,36"  },
      { href: "/dashboard/user-coupons",     label: "كوبونات المستخدمين",  icon: Ticket,               rgb: "244,114,182" },
      { href: "/dashboard/wallets",          label: "المحافظ المالية",     icon: Wallet,               rgb: "163,230,53"  },
      { href: "/dashboard/withdrawals",      label: "طلبات السحب",         icon: Banknote,             rgb: "232,121,249" },
    ],
  },
  {
    id: "system",
    label: "النظام",
    items: [
      { href: "/dashboard/vehicle-types",    label: "أنواع المركبات",      icon: Truck,                rgb: "45,212,191"  },
      { href: "/dashboard/notifications",    label: "الإشعارات",           icon: Bell,                 rgb: "251,113,133" },
      { href: "/dashboard/messages",         label: "الرسائل",             icon: MessageSquare,        rgb: "56,189,248"  },
      { href: "/dashboard/admin-logs",       label: "سجل الأدمن",          icon: Shield,               rgb: "251,146,60"  },
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
      {/* arrow pointing right toward sidebar */}
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
   NAV LINK — theme-aware active/hover states
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

      {/* right accent bar */}
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
        {/* logomark */}
        <div className="relative flex-shrink-0">
          {/* glow behind logo */}
          <div
            className="absolute inset-0 rounded-xl blur-md scale-125 opacity-40 sidebar-logo-glow"
          />
          <div
            className="relative flex items-center justify-center rounded-xl border sidebar-logo"
            style={{
              width:  collapsed ? 38 : 40,
              height: collapsed ? 38 : 40,
            }}
          >
            <Zap
              size={18}
              className="text-white"
              style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.6))" }}
            />
          </div>
          {/* live status dot */}
          <span className="absolute -bottom-[3px] -left-[3px] flex h-3 w-3">
            <span
              className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-55 animate-ping"
              style={{ animationDuration: "2.5s" }}
            />
            <span
              className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 sidebar-status-dot"
            />
          </span>
        </div>

        {/* brand text */}
        <div
          className="flex flex-col gap-0.5 overflow-hidden"
          style={{
            width:      collapsed ? 0 : "auto",
            opacity:    collapsed ? 0 : 1,
            transition: "opacity 200ms ease, width 280ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <span
            className="sidebar-brand-name text-[16px] font-black leading-none tracking-tight whitespace-nowrap select-none"
          >
            تاكسي
          </span>
          <span
            className="sidebar-brand-sub text-[9.5px] font-bold tracking-[0.15em] uppercase whitespace-nowrap select-none"
          >
            Admin Panel
          </span>
        </div>
      </div>

      {/* divider */}
      <div className={cn("relative z-10 flex-shrink-0", collapsed ? "mx-2" : "mx-4")}>
        <div className="sidebar-divider h-px" />
      </div>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
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
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.id} className={cn(gi > 0 && "pt-4")}>

            {/* group label — expanded */}
            {group.label && !collapsed && (
              <div className="flex items-center gap-2 px-3 pb-1.5">
                <span className="sidebar-group-label text-[9px] font-bold tracking-[0.16em] uppercase whitespace-nowrap">
                  {group.label}
                </span>
                <div className="flex-1 h-px sidebar-group-line" />
              </div>
            )}

            {/* collapsed group dot */}
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

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <div className={cn("relative z-10 flex-shrink-0 pb-4", collapsed ? "px-2" : "px-3")}>
        <div className={cn("mb-3 h-px sidebar-divider", collapsed ? "mx-0" : "mx-1")} />

        {collapsed ? (
          /* ━━ COLLAPSED: vertical stack of icon buttons ━━━━━━━━━━━━━━━ */
          <div className="flex flex-col items-center gap-1.5 mb-2">
            <div
              onMouseEnter={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setTooltip({ label: "تغيير المظهر", y: r.top + r.height / 2 });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <ThemeToggle collapsed />
            </div>
            <div
              onMouseEnter={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setTooltip({ label: "تغيير اللغة", y: r.top + r.height / 2 });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <LanguageSwitcher collapsed />
            </div>
          </div>
        ) : (
          /* ━━ EXPANDED: settings card ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
          <div
            className="rounded-xl overflow-hidden mb-3"
            style={{
              background: "var(--sb-icon-bg)",
              border: "1px solid var(--sb-nav-hover-border)",
            }}
          >
            {/* theme toggle row */}
            <div className="p-1.5">
              <ThemeToggle collapsed={false} />
            </div>

            {/* divider */}
            <div className="mx-2 h-px" style={{ background: "var(--sb-nav-hover-border)" }} />

            {/* bottom row: language */}
            <div className="p-1.5">
              <LanguageSwitcher collapsed={false} />
            </div>
          </div>
        )}

        {/* collapse toggle */}
        <button
          onClick={onToggleCollapse}
          onMouseEnter={(e) => {
            if (!collapsed) return;
            const r = e.currentTarget.getBoundingClientRect();
            setTooltip({ label: "توسيع القائمة", y: r.top + r.height / 2 });
          }}
          onMouseLeave={() => setTooltip(null)}
          className={cn(
            "sidebar-footer-btn group relative flex w-full items-center rounded-xl text-[12px] font-semibold",
            "transition-all duration-200 overflow-hidden mb-0.5",
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
              تصغير القائمة
            </span>
          )}
        </button>

        {/* logout */}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            onMouseEnter={(e) => {
              if (!collapsed) return;
              const r = e.currentTarget.getBoundingClientRect();
              setTooltip({ label: "تسجيل الخروج", y: r.top + r.height / 2 });
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
              <span className="relative sidebar-logout-text transition-colors duration-200">
                تسجيل الخروج
              </span>
            )}
          </button>
        </form>

        {/* version stamp */}
        {!collapsed && (
          <p className="sidebar-version text-center text-[9px] font-bold tracking-[0.15em] uppercase mt-3">
            v2.0 · نظام إدارة تاكسي
          </p>
        )}
      </div>

      {/* floating tooltip — outside overflow clipping */}
      <FloatingTooltip tip={tooltip} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────────────────────── */

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);

  /* hydrate collapse preference */
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
      {/* ── mobile toggle ─────────────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 rounded-xl sidebar-mobile-toggle"
        aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
      >
        {mobileOpen ? <X size={17} /> : <Menu size={17} />}
      </button>

      {/* ── mobile backdrop ───────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 sidebar-backdrop backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── mobile drawer ─────────────────────────────────────────── */}
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

      {/* ── desktop sidebar ───────────────────────────────────────── */}
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