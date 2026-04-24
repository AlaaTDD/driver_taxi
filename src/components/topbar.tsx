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
        background: "rgba(4, 8, 16, 0.85)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(26, 45, 71, 0.8)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.02) inset, 0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-7">

        {/* Search Bar */}
        <TopBarSearch />

        {/* Right-side Actions */}
        <div className="flex items-center gap-2 mr-auto">

          {/* Date Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-text-tertiary font-medium"
            style={{ background: "rgba(15, 30, 53, 0.5)", border: "1px solid var(--divider)" }}>
            {today}
          </div>

          {/* Notifications Bell */}
          <Link
            href="/dashboard/notifications"
            id="topbar-notifications"
            className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 group hover:border-primary/40 hover:bg-primary/10"
            style={{
              background: "rgba(15, 30, 53, 0.6)",
              border: "1px solid var(--divider)",
            }}
          >
            <Bell size={16} className="text-text-secondary group-hover:text-primary transition-colors" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-white text-[9px] font-bold rounded-full px-1"
                style={{
                  background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                  boxShadow: "0 0 10px rgba(239,68,68,0.5), 0 2px 4px rgba(0,0,0,0.3)",
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
              background: "rgba(15, 30, 53, 0.6)",
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
                className="absolute inset-0 rounded-full blur-md opacity-70 scale-110"
                style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.4), rgba(139,92,246,0.3))" }}
              />
              <div
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-[13px] border border-white/10"
                style={{
                  background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)",
                  boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
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
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" style={{ boxShadow: "0 0 6px rgba(16,185,129,0.6)" }} />
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
