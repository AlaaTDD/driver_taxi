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
  LogOut,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/dashboard/users", label: "المستخدمين", icon: Users },
  { href: "/dashboard/drivers", label: "السائقين", icon: Car },
  { href: "/dashboard/trips", label: "الرحلات", icon: MapPin },
  { href: "/dashboard/coupons", label: "الكوبونات", icon: Tag },
  { href: "/dashboard/pricing", label: "التسعير", icon: DollarSign },
  { href: "/dashboard/notifications", label: "الإشعارات", icon: Bell },
  { href: "/dashboard/messages", label: "الرسائل", icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo / Branding */}
      <div className="p-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-bl from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary tracking-tight">تاكسي</h1>
            <p className="text-[11px] text-text-secondary -mt-0.5">لوحة تحكم الأدمن</p>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-gradient-to-l from-transparent via-divider to-transparent" />

      <nav className="flex-1 p-3 space-y-1 mt-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20 shadow-sm shadow-primary/10"
                  : "text-text-secondary hover:bg-surface-elevated/60 hover:text-text-primary border border-transparent"
              )}
            >
              <item.icon size={17} className={cn(isActive && "drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]")} />
              <span>{item.label}</span>
              {isActive && <ChevronRight size={13} className="mr-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mt-auto">
        <div className="h-px bg-gradient-to-l from-transparent via-divider to-transparent mb-3" />
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-text-secondary hover:bg-error/10 hover:text-error w-full transition-all duration-200 border border-transparent hover:border-error/20"
          >
            <LogOut size={17} />
            <span>تسجيل الخروج</span>
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 bg-surface-elevated rounded-xl border border-divider shadow-lg"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 right-0 z-40 w-72 bg-surface/95 backdrop-blur-xl border-l border-divider flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      <aside className="hidden lg:flex w-72 bg-surface/50 backdrop-blur-sm border-l border-divider flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
