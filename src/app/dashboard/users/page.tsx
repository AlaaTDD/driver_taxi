import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import UsersClient from "./users-client";
import { getTranslations } from "next-intl/server";
import { Users, ShieldBan, Shield, Crown } from "lucide-react";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; role?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = 15;
  const searchQuery = params.q || "";
  const filterRole = params.role || "";
  const filterStatus = params.status || "";

  const t = await getTranslations();
  const supabase = createAdminClient();
  const authClient = await createClient();
  const { data: { user: currentUser } } = await authClient.auth.getUser();

  // Build query
  let query = supabase
    .from("users")
    .select("id, name, email, phone, role, is_admin, is_active, is_blocked, blocked_reason, blocked_at, rating, total_trips, avatar_url, created_at", { count: "exact" });

  // Search: name, phone, national_id (via drivers_profile join is hard in supabase client, search name+phone only here)
  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
  }

  if (filterRole) query = query.eq("role", filterRole);

  if (filterStatus === "active") query = query.eq("is_active", true).eq("is_blocked", false);
  else if (filterStatus === "blocked") query = query.eq("is_blocked", true);
  else if (filterStatus === "inactive") query = query.eq("is_active", false);

  query = query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data: users, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  // Stats
  const [totalRes, blockedRes, adminsRes, supervisorRes] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("is_blocked", true),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("is_admin", true),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "supervisor"),
  ]);

  const stats = [
    { label: t("dashboard.stats.totalUsers"), value: totalRes.count || 0, icon: <Users size={18} />, color: "#3B82F6" },
    { label: t("common.blocked"), value: blockedRes.count || 0, icon: <ShieldBan size={18} />, color: "#EF4444" },
    { label: t("users.roles.supervisor"), value: supervisorRes.count || 0, icon: <Shield size={18} />, color: "#8B5CF6" },
    { label: t("users.roles.admin"), value: adminsRes.count || 0, icon: <Crown size={18} />, color: "#F59E0B" },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("users.title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("users.subtitle")}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="group relative rounded-xl overflow-hidden p-4 bg-surface border border-divider hover:border-divider-strong hover:-translate-y-0.5 transition-all duration-300 shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(to left, transparent, ${stat.color}, transparent)`, opacity: 0.6 }} />
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}18`, border: `1px solid ${stat.color}25`, color: stat.color }}>
                  {stat.icon}
                </div>
                <span className="text-2xl font-black num" style={{ color: stat.color }}>{stat.value}</span>
              </div>
              <p className="text-text-tertiary text-xs mt-2 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Client */}
        <UsersClient
          users={(users || []).map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            is_admin: u.is_admin,
            is_active: u.is_active,
            is_blocked: u.is_blocked ?? false,
            blocked_reason: u.blocked_reason,
            rating: u.rating,
            total_trips: u.total_trips,
          }))}
          totalCount={count || 0}
          currentPage={page}
          totalPages={totalPages}
          searchQuery={searchQuery}
          filterRole={filterRole}
          filterStatus={filterStatus}
          currentUserId={currentUser?.id || ""}
        />
      </div>
    </DashboardShell>
  );
}
