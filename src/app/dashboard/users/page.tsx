import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import UsersClient from "./users-client";
import { getTranslations } from "next-intl/server";
import { Users, ShieldBan, Shield, Crown } from "lucide-react";

/* ─── stat colours ────────────────────────────────────────── */
const STAT_COLORS = {
  users:      { accent: "var(--primary)", glow: "rgba(var(--primary-rgb),0.14)", border: "rgba(var(--primary-rgb),0.2)" },
  blocked:    { accent: "var(--error)", glow: "rgba(var(--error-rgb),0.14)", border: "rgba(var(--error-rgb),0.2)" },
  supervisor: { accent: "var(--primary)", glow: "rgba(var(--primary-rgb),0.14)", border: "rgba(var(--primary-rgb),0.2)" },
  admin:      { accent: "var(--primary)", glow: "rgba(var(--primary-rgb),0.14)", border: "rgba(var(--primary-rgb),0.2)" },
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; role?: string; status?: string }>;
}) {
  const params    = await searchParams;
  const page      = Number(params.page) || 1;
  const pageSize  = 15;
  const searchQuery  = params.q      || "";
  const filterRole   = params.role   || "";
  const filterStatus = params.status || "";

  const t         = await getTranslations();
  const supabase  = createAdminClient();
  const authClient = await createClient();
  const { data: { user: currentUser } } = await authClient.auth.getUser();

  /* ── main paginated query ── */
  let query = supabase
    .from("users")
    .select(
      "id, name, email, phone, role, is_admin, is_active, is_blocked, blocked_reason, blocked_at, rating, total_trips, avatar_url, created_at",
      { count: "exact" }
    );

  if (searchQuery) {
    query = query.or(
      `name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
    );
  }
  if (filterRole)   query = query.eq("role", filterRole);
  if (filterStatus === "active")   query = query.eq("is_active", true).eq("is_blocked", false);
  else if (filterStatus === "blocked")  query = query.eq("is_blocked", true);
  else if (filterStatus === "inactive") query = query.eq("is_active", false);

  query = query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data: users, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  /* ── stats counters ── */
  const [totalRes, blockedRes, adminsRes, supervisorRes] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("is_blocked", true),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("is_admin", true),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "supervisor"),
  ]);

  const stats = [
    {
      key: "users" as const,
      label: t("dashboard.stats.totalUsers"),
      value: totalRes.count || 0,
      icon: <Users size={16} />,
      subLabel: t("users.stats.totalRegistered"),
    },
    {
      key: "blocked" as const,
      label: t("common.blocked"),
      value: blockedRes.count || 0,
      icon: <ShieldBan size={16} />,
      subLabel: t("users.stats.blockedAccounts"),
    },
    {
      key: "supervisor" as const,
      label: t("users.roles.supervisor"),
      value: supervisorRes.count || 0,
      icon: <Shield size={16} />,
      subLabel: t("users.stats.activeSupervisors"),
    },
    {
      key: "admin" as const,
      label: t("users.roles.admin"),
      value: adminsRes.count || 0,
      icon: <Crown size={16} />,
      subLabel: t("users.stats.fullAccess"),
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">

        {/* ── Page header ──────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* icon badge */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "var(--accent-surface)",
                border: "1px solid var(--accent-border)",
              }}
            >
              <Users size={18} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                {t("users.title")}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {t("users.subtitle")}
              </p>
            </div>
          </div>

          {/* breadcrumb / meta */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold self-start"
            style={{
              background: "var(--surface-glass)",
              border: "1px solid var(--divider)",
              color: "var(--text-tertiary)",
            }}
          >
            <span>{t("common.dashboard")}</span>
            <span style={{ color: "var(--text-disabled)" }}>/</span>
            <span style={{ color: "var(--text-secondary)" }}>{t("common.users")}</span>
          </div>
        </div>

        {/* ── Stats grid ───────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const c = STAT_COLORS[stat.key];
            return (
              <div
                key={stat.key}
                className="group relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-0.5 dash-stat"
              >
                {/* icon + value */}
                <div className="relative flex items-start justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: c.glow,
                      border: `1px solid ${c.border}`,
                      color: c.accent,
                    }}
                  >
                    {stat.icon}
                  </div>
                  <span
                    className="text-[28px] leading-none font-black num tabular-nums"
                    style={{ color: c.accent }}
                  >
                    {stat.value}
                  </span>
                </div>

                {/* labels */}
                <div>
                  <p className="text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>
                    {stat.label}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-disabled)" }}>
                    {stat.subLabel}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

        {/* ── Users table / client component ───────────────── */}
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
