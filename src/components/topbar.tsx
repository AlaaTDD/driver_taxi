import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import { Bell, Calendar, ChevronDown } from "lucide-react";

export async function TopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let unreadCount = 0;

  if (user) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);
    unreadCount = count || 0;
  }

  const locale = await getLocale();
  const today = new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "var(--topbar-bg)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid var(--topbar-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">

        {/* Right side spacer */}
        <div className="flex-1" />

        {/* Left side: date + notification bell */}
        <div className="flex items-center gap-3 mr-auto">

          {/* Date chip - matching the design exactly */}
          <div
            className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] text-text-secondary font-medium cursor-pointer hover:border-primary/30 transition-all"
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--divider)",
            }}
          >
            <Calendar size={14} className="text-text-tertiary" />
            <span>{today}</span>
            <ChevronDown size={12} className="text-text-disabled" />
          </div>

          {/* Notification bell */}
          <Link
            href="/dashboard/notifications"
            id="topbar-notifications"
            className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group hover:border-primary/40 hover:bg-primary/10"
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--divider)",
            }}
          >
            <Bell size={17} className="text-text-secondary group-hover:text-primary transition-colors" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-white text-[9px] font-bold rounded-full px-1"
                style={{
                  background: "var(--error)",
                  border: "2px solid var(--topbar-bg)",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
