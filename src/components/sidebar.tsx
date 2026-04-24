"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  MapPin,
  Tag,
  DollarSign,
  Bell,
  MessageSquare,
  MessageSquareWarning,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard, color: "text-blue-400", glow: "rgba(96,165,250,0.3)" },
  { href: "/dashboard/users", label: "المستخدمين", icon: Users, color: "text-violet-400", glow: "rgba(167,139,250,0.3)" },
  { href: "/dashboard/drivers", label: "السائقين", icon: Car, color: "text-cyan-400", glow: "rgba(34,211,238,0.3)" },
  { href: "/dashboard/trips", label: "الرحلات", icon: MapPin, color: "text-emerald-400", glow: "rgba(52,211,153,0.3)" },
  { href: "/dashboard/complaints", label: "الشكاوي", icon: MessageSquareWarning, color: "text-red-400", glow: "rgba(248,113,113,0.3)" },
  { href: "/dashboard/coupons", label: "الكوبونات", icon: Tag, color: "text-amber-400", glow: "rgba(251,191,36,0.3)" },
  { href: "/dashboard/pricing", label: "التسعير", icon: DollarSign, color: "text-green-400", glow: "rgba(74,222,128,0.3)" },
  { href: "/dashboard/notifications", label: "الإشعارات", icon: Bell, color: "text-rose-400", glow: "rgba(251,113,133,0.3)" },
  { href: "/dashboard/messages", label: "الرسائل", icon: MessageSquare, color: "text-sky-400", glow: "rgba(56,189,248,0.3)" },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* ===== LOGO ===== */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-3.5">
          <div className="relative flex-shrink-0">
            {/* Glow halo */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/50 to-violet-600/40 blur-lg opacity-70 scale-110" />
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-700 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/10">
              <Zap size={20} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
            </div>
          </div>
          <div>
            <div className="text-[17px] font-black text-transparent bg-clip-text bg-gradient-to-l from-blue-300 to-violet-300 tracking-tight leading-none">
              تاكسي
            </div>
            <div className="text-[11px] text-text-tertiary font-medium mt-0.5 tracking-wide">
              لوحة تحكم الأدمن
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 mb-4">
        <div className="h-px bg-gradient-to-l from-transparent via-divider to-transparent" />
      </div>

      {/* ===== NAV ITEMS ===== */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group relative flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 overflow-hidden",
                isActive
                  ? "text-white"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {/* Active background */}
              {isActive && (
                <>
                  <div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${item.glow.replace('0.3', '0.18')} 0%, rgba(59,130,246,0.08) 100%)`,
                      border: `1px solid ${item.glow.replace('0.3', '0.3')}`,
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-xl opacity-40"
                    style={{
                      boxShadow: `inset 0 1px 0 ${item.glow.replace('0.3', '0.2')}`,
                    }}
                  />
                </>
              )}

              {/* Hover background */}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl bg-surface-elevated/0 group-hover:bg-surface-elevated/70 transition-all duration-200 border border-transparent group-hover:border-divider/50" />
              )}

              {/* Icon */}
              <div
                className={cn(
                  "relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                  isActive
                    ? "bg-white/10"
                    : "bg-surface-elevated/0 group-hover:bg-surface-elevated"
                )}
              >
                <item.icon
                  size={15}
                  className={cn(
                    "transition-all duration-200",
                    isActive ? item.color : "text-text-tertiary group-hover:text-text-secondary"
                  )}
                  style={isActive ? { filter: `drop-shadow(0 0 6px ${item.glow})` } : {}}
                />
              </div>

              {/* Label */}
              <span className="relative flex-1 transition-all duration-200">{item.label}</span>

              {/* Active indicator arrow */}
              {isActive && (
                <ChevronLeft
                  size={12}
                  className={cn("relative opacity-60 flex-shrink-0", item.color)}
                />
              )}

              {/* Left active bar */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full"
                  style={{
                    background: `linear-gradient(to bottom, ${item.glow.replace('0.3', '0.9')}, ${item.glow.replace('0.3', '0.5')})`,
                    boxShadow: `0 0 8px ${item.glow}`,
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ===== LOGOUT ===== */}
      <div className="p-3 mt-2">
        <div className="h-px bg-gradient-to-l from-transparent via-divider to-transparent mb-3" />
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="group relative flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-text-tertiary hover:text-error w-full transition-all duration-200 overflow-hidden"
          >
            <div className="absolute inset-0 rounded-xl bg-error/0 group-hover:bg-error/8 border border-transparent group-hover:border-error/20 transition-all duration-200" />
            <div className="relative flex-shrink-0 w-8 h-8 rounded-lg bg-surface-elevated/0 group-hover:bg-error/10 flex items-center justify-center transition-all duration-200">
              <LogOut size={15} className="transition-all duration-200 group-hover:text-error" />
            </div>
            <span className="relative">تسجيل الخروج</span>
          </button>
        </form>

        {/* Version */}
        <div className="mt-3 px-4 text-[10px] text-text-disabled font-medium text-center tracking-wider">
          v2.0 — نظام إدارة تاكسي
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-surface-elevated/80 backdrop-blur-xl border border-divider shadow-lg shadow-black/30 text-text-secondary hover:text-text-primary transition-colors"
        id="sidebar-mobile-toggle"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 right-0 z-40 flex flex-col transition-transform duration-300 ease-out",
          "w-[280px] border-l border-divider",
          "bg-surface/95 backdrop-blur-2xl",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          boxShadow: mobileOpen ? "-20px 0 60px rgba(0,0,0,0.5)" : "none",
        }}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col sticky top-0 h-screen border-l border-divider"
        style={{
          width: "var(--sidebar-width)",
          background: "linear-gradient(180deg, rgba(10,22,40,0.95) 0%, rgba(7,15,28,0.98) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "-1px 0 0 rgba(255,255,255,0.02) inset, 4px 0 24px rgba(0,0,0,0.3)",
        }}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
