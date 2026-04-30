import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Bell, Settings, ChevronDown } from "lucide-react";
import { TopBarSearch } from "@/components/topbar-search";

export async function TopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName = "الأدمن";
  let userInitial = "أ";
  let unreadCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();
    if (profile?.name) {
      userName = profile.name;
      userInitial = profile.name.charAt(0);
    }

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);
    unreadCount = count || 0;
  }

  const today = new Date().toLocaleDateString("ar-EG", {
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
      <div className="flex items-center justify-between h-16 px-4 lg:px-7">

        {/* Search Bar */}
        <TopBarSearch />

        {/* Right-side Actions */}
        <div className="flex items-center gap-2 mr-auto">

          {/* Date Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-text-tertiary font-medium"
            style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}>
            {today}
          </div>

          {/* Notifications Bell */}
          <Link
            href="/dashboard/notifications"
            id="topbar-notifications"
            className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 group hover:border-primary/40 hover:bg-primary/10"
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--divider)",
            }}
          >
            <Bell size={16} className="text-text-secondary group-hover:text-primary transition-colors" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-white text-[9px] font-bold rounded-full px-1"
                style={{
                  background: "var(--error)",
                  border: "2px solid var(--background)",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Settings */}
          <Link
            href="/dashboard"
            id="topbar-settings"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-text-secondary hover:text-primary transition-all duration-200"
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--divider)",
            }}
          >
            <Settings size={15} />
          </Link>

          {/* Divider */}
          <div className="w-px h-6 bg-divider mx-1" />

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-1 cursor-pointer group">
            {/* Avatar */}
            <div className="relative">
              <div
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-[13px] border border-divider"
                style={{
                  background: "var(--primary)",
                }}
              >
                {userInitial}
              </div>
            </div>

            {/* Info */}
            <div className="hidden md:block">
              <div className="text-[13px] font-bold text-text-primary leading-none group-hover:text-primary transition-colors">
                {userName}
              </div>
              <div className="text-[10px] text-text-tertiary mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                مدير النظام
              </div>
            </div>

            <ChevronDown size={12} className="text-text-disabled hidden md:block" />
          </div>
        </div>
      </div>
    </header>
  );
}
