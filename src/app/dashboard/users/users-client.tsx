"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search, ShieldBan, Shield, UserCheck, UserX,
  ChevronLeft, ChevronRight, SlidersHorizontal, X,
  Lock, Unlock, Crown, AlertTriangle, Filter,
  MoreVertical, CheckCircle2
} from "lucide-react";
import { UserBlockModal, UserRoleModal } from "./user-modals";
import { toast } from "sonner";
import { Badge } from "@/components/badge";
import { ActionsMenu } from "../drivers/_components/actions-menu";
import type { CSSProperties } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_admin: boolean;
  is_active: boolean;
  is_blocked: boolean;
  blocked_reason?: string;
  rating?: number;
  total_trips?: number;
  is_verified?: boolean;
  national_id?: string;
}

interface UsersClientProps {
  users: User[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  filterRole: string;
  filterStatus: string;
  currentUserId: string;
}

/* ─── tiny helpers ───────────────────────────────────────── */
// Status -> avatar color, mirroring the drivers page's getAvatarStyle/getDriverStatus
// pattern (src/app/dashboard/drivers/_lib/status-style.ts) for visual parity.
type UserAccountStatus = "blocked" | "admin" | "supervisor" | "active" | "inactive";

const USER_STATUS_COLORS: Record<UserAccountStatus, { bg: string; fg: string; border: string }> = {
  blocked: { bg: "var(--error-surface)", fg: "var(--error)", border: "var(--error-border)" },
  admin: { bg: "var(--accent-surface)", fg: "var(--primary)", border: "var(--accent-border)" },
  supervisor: { bg: "rgba(var(--color-purple-rgb), 0.12)", fg: "var(--color-purple)", border: "rgba(var(--color-purple-rgb), 0.22)" },
  active: { bg: "var(--success-surface)", fg: "var(--success)", border: "var(--success-border)" },
  inactive: { bg: "var(--neutral-surface)", fg: "var(--text-tertiary)", border: "var(--neutral-border)" },
};

const getUserAccountStatus = (user: User): UserAccountStatus =>
  user.is_blocked ? "blocked"
  : user.is_admin ? "admin"
  : user.role === "supervisor" ? "supervisor"
  : user.is_active ? "active"
  : "inactive";

const avatarGrad = (user: User): CSSProperties => {
  const c = USER_STATUS_COLORS[getUserAccountStatus(user)];
  return { background: c.bg, color: c.fg, border: `1px solid ${c.border}` };
};

const roleLabel = (user: User, t: any) =>
  user.is_admin ? { label: t("users.roles.admin"), className: "variant-primary-strong" }
  : user.role === "driver" ? { label: t("users.roles.driver"), className: "variant-info" }
  : user.role === "supervisor" ? { label: t("users.roles.supervisor"), className: "variant-purple" }
  : { label: t("users.roles.user"), className: "variant-neutral" };



/* ─── main component ─────────────────────────────────────── */
export default function UsersClient({
  users, totalCount, currentPage, totalPages,
  searchQuery, filterRole, filterStatus, currentUserId,
}: UsersClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchQuery);
  const [blockModal, setBlockModal] = useState<{ user: User; action: "block" | "unblock" } | null>(null);
  const [roleModal, setRoleModal] = useState<{ user: User; role: string } | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const ts = (key: string, fallback: string) => {
    try {
      return t(key);
    } catch {
      return fallback;
    }
  };

  const hasFilters = filterRole || filterStatus || searchQuery;

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    params.delete("page");
    startTransition(() => router.push(`/dashboard/users?${params.toString()}`));
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); updateParams({ q: search }); };

  const clearAll = () => {
    setSearch("");
    startTransition(() => router.push("/dashboard/users"));
  };

  const handleBlock = async () => {
    if (!blockModal) return;
    setActionLoading(true);
    try {
      const fd = new FormData();
      fd.set("user_id", blockModal.user.id);
      fd.set("action", blockModal.action);
      if (blockModal.action === "block" && blockReason) fd.set("reason", blockReason);
      const res = await fetch("/api/users/block", { method: "POST", body: fd });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || ts("users.statusUpdateFailed", "فشل تحديث حالة المستخدم."));
      }
      toast.success(ts("users.statusUpdated", "تم تحديث حالة المستخدم بنجاح."));
      setBlockModal(null); setBlockReason("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || ts("users.statusUpdateFailed", "فشل تحديث حالة المستخدم."));
    } finally { setActionLoading(false); }
  };

  const handleSetRole = async () => {
    if (!roleModal) return;
    setActionLoading(true);
    try {
      const fd = new FormData();
      fd.set("user_id", roleModal.user.id);
      fd.set("role", roleModal.role);
      const res = await fetch("/api/users/set-role", { method: "POST", body: fd });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || ts("users.roleUpdateFailed", "فشل تحديث دور المستخدم."));
      }
      toast.success(ts("users.roleUpdated", "تم تحديث دور المستخدم بنجاح."));
      setRoleModal(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || ts("users.roleUpdateFailed", "فشل تحديث دور المستخدم."));
    } finally { setActionLoading(false); }
  };

  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/dashboard/users?${params.toString()}`);
  };

  /* pagination window */
  const pageWindow = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const w: (number | "…")[] = [1];
    if (currentPage > 3) w.push("…");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) w.push(i);
    if (currentPage < totalPages - 2) w.push("…");
    w.push(totalPages);
    return w;
  };

  return (
    <>
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .row-animate { animation: rowIn 0.25s ease both; }
        .hover-lift { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .hover-lift:hover { transform: translateY(-1px); }
        .btn-action { transition: transform 0.15s ease, filter 0.15s ease; }
        .btn-action:hover { transform: scale(1.04); filter: brightness(1.12); }
        .btn-action:active { transform: scale(0.96); }
        .focus-ring:focus-within { outline: 2px solid var(--accent-border); outline-offset: 0; border-radius: 14px; }
        .users-th { position: sticky; top: 0; z-index: 2; }
        .trips-bar { height: 3px; border-radius: 2px; background: var(--accent-border); overflow: hidden; }
        .trips-bar-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--primary), var(--primary-dark)); transition: width 0.4s ease; }
      `}</style>

      {/* ── Search + Filters bar ─────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row gap-3 flex-wrap items-center px-4 py-3.5 rounded-2xl"
        style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)", boxShadow: "var(--shadow-sm)" }}
      >
        {/* search */}
        <form onSubmit={handleSearch} className="flex items-center flex-1 min-w-[240px] max-w-md gap-2 focus-ring">
          <div className="relative w-full">
            <Search size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-disabled)" }} />
            <input
              id="users-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search")}
              className="w-full pr-9 pl-9 py-2.5 rounded-xl text-[13px] outline-none transition-all"
              style={{ background: "var(--surface)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
            />
            {search && (
              <button type="button" aria-label={t("common.close")} onClick={() => { setSearch(""); updateParams({ q: "" }); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 transition-all hover:scale-110 active:scale-90"
                style={{ color: "var(--text-disabled)" }}>
                <X size={12} />
              </button>
            )}
          </div>
          <button
            type="submit"
            id="users-search-btn"
            className="px-4 py-2.5 rounded-xl text-[12px] font-bold text-white flex-shrink-0 btn-action"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", boxShadow: "0 8px 20px rgba(var(--primary-rgb),0.24)" }}
          >
            {t("common.search")}
          </button>
        </form>

        {/* divider */}
        <div className="hidden sm:block w-px h-8" style={{ background: "var(--divider)" }} />

        {/* filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            <Filter size={11} />
            <span className="font-semibold">{t("common.filter")}</span>
          </div>

          {/* role */}
          <div className="relative">
            <SlidersHorizontal size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-disabled)" }} />
            <select
              id="users-role-filter"
              value={filterRole}
              onChange={(e) => updateParams({ role: e.target.value })}
              className="appearance-none pr-7 pl-5 py-2 rounded-xl text-[12px] font-semibold outline-none cursor-pointer transition-all hover:brightness-110"
              style={{
                background: filterRole ? "var(--accent-surface)" : "var(--surface)",
                border: filterRole ? "1px solid var(--accent-border)" : "1px solid var(--divider)",
                color: filterRole ? "var(--primary)" : "var(--text-secondary)",
              }}
            >
              <option value="">{t("common.all")}</option>
              <option value="user">{t("users.roles.user")}</option>
              <option value="driver">{t("users.roles.driver")}</option>
              <option value="supervisor">{t("users.roles.supervisor")}</option>
            </select>
            <ChevronLeft size={10} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-disabled)" }} />
          </div>

          {/* status */}
          <div className="relative">
            <select
              id="users-status-filter"
              value={filterStatus}
              onChange={(e) => updateParams({ status: e.target.value })}
              className="appearance-none px-3 py-2 rounded-xl text-[12px] font-semibold outline-none cursor-pointer transition-all hover:brightness-110"
              style={{
                background: filterStatus === "blocked" ? "var(--error-surface)" : filterStatus === "active" ? "var(--accent-surface)" : "var(--surface)",
                border: filterStatus === "blocked" ? "1px solid var(--error-border)" : filterStatus === "active" ? "1px solid var(--accent-border)" : "1px solid var(--divider)",
                color: filterStatus === "blocked" ? "var(--error)" : filterStatus === "active" ? "var(--primary)" : "var(--text-secondary)",
              }}
            >
              <option value="">{t("common.all")}</option>
              <option value="active">{t("common.active")}</option>
              <option value="blocked">{t("common.blocked")}</option>
              <option value="inactive">{t("common.inactive")}</option>
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold btn-action"
              style={{ background: "var(--error-surface)", color: "var(--error)", border: "1px solid var(--error-border)" }}
            >
              <X size={10} /> مسح الكل
            </button>
          )}
        </div>

        {/* results + loading indicator */}
        <div className="sm:mr-auto flex items-center gap-2">
          {isPending ? (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--text-tertiary)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {t("common.loading")}...
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg"
              style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}>
              {totalCount} {t("common.users")}
            </span>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="dash-table-card">
        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="dash-table-head users-th">
                {[
                  { label: t("common.name"), w: "w-[32%]" },
                  { label: t("common.phone"), w: "w-[15%]" },
                  { label: t("common.role"), w: "w-[11%]" },
                  { label: t("common.trips"), w: "w-[10%]" },
                  { label: t("common.status"), w: "w-[15%]" },
                  { label: t("common.actions"), w: "w-[10%]" },
                ].map((h) => (
                  <th key={h.label} className={`${h.w} text-right py-3.5 px-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap`}
                    style={{ color: "var(--text-tertiary)" }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => {
                const av = avatarGrad(user);
                const rl = roleLabel(user, t);
                const canAct = user.id !== currentUserId && !user.is_admin;
                const tripsMax = 100;
                const tripsPercent = Math.min(100, ((user.total_trips ?? 0) / tripsMax) * 100);
                return (
                  <tr
                    key={user.id}
                    className="row-animate group/row dash-table-row hover-lift"
                    style={{
                      animationDelay: `${i * 28}ms`,
                    }}
                  >
                    {/* Avatar + name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <div
                          className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-[14px] font-black flex-shrink-0 transition-transform group-hover/row:scale-105"
                          style={av}
                        >
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                          {user.is_blocked && (
                            <span className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: "var(--surface-elevated)", border: "1.5px solid var(--divider)" }}>
                              <Lock size={8} style={{ color: "var(--error)" }} />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-text-primary font-bold text-[13.5px] truncate">{user.name}</span>
                            {user.is_admin && <Crown size={11} style={{ color: "var(--primary)", flexShrink: 0 }} />}
                            {user.role === "supervisor" && !user.is_admin && <Shield size={11} style={{ color: "var(--color-purple)", flexShrink: 0 }} />}
                          </div>
                          <p className="text-[11.5px] truncate" style={{ color: "var(--text-disabled)" }}>{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-5">
                      <span className="text-[12px] font-mono tracking-wide" style={{ color: "var(--text-secondary)" }}>{user.phone}</span>
                    </td>

                    {/* Role badge */}
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${rl.className}`}
                      >
                        {rl.label}
                      </span>
                    </td>

                    {/* Trips */}
                    <td className="py-4 px-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[15px] font-black num leading-none" style={{ color: "var(--text-primary)" }}>{user.total_trips ?? 0}</span>
                        <div className="trips-bar w-10">
                          <div className="trips-bar-fill" style={{ width: `${tripsPercent}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">
                      {user.is_blocked ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant="error" dot>{t("common.blocked")}</Badge>
                          {user.blocked_reason && (
                            <span className="text-[10.5px] px-1 truncate max-w-[120px]" style={{ color: "var(--text-disabled)" }} title={user.blocked_reason}>
                              {user.blocked_reason}
                            </span>
                          )}
                        </div>
                      ) : user.is_active ? (
                        <Badge variant="success" dot>{t("common.active")}</Badge>
                      ) : (
                        <Badge variant="default" dot>{t("common.inactive")}</Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5">
                      <div className="flex justify-center">
                        {canAct && (
                          <ActionsMenu
                            ariaLabel={t("common.actions")}
                            items={[
                              {
                                key: "block",
                                label: user.is_blocked ? t("drivers.unblock") : t("drivers.block"),
                                icon: user.is_blocked ? <Unlock size={13} /> : <Lock size={13} />,
                                variant: user.is_blocked ? "success" : "danger",
                                onClick: () => setBlockModal({ user, action: user.is_blocked ? "unblock" : "block" }),
                              },
                              ...(user.role !== "driver" ? [{
                                key: "role",
                                label: user.role === "supervisor" ? t("users.removeSupervisor") : t("users.makeSupervisor"),
                                icon: <Shield size={13} />,
                                onClick: () => setRoleModal({ user, role: user.role === "supervisor" ? "user" : "supervisor" }),
                              }] : []),
                            ]}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: "var(--neutral-surface)", border: "1px solid var(--neutral-border)" }}>
                        <UserX size={28} style={{ color: "var(--text-disabled)", opacity: 0.45 }} />
                      </div>
                      <div>
                        <p className="font-bold text-[15px]" style={{ color: "var(--text-secondary)" }}>{t("common.noData")}</p>
                        <p className="text-[12px] mt-1" style={{ color: "var(--text-disabled)" }}>جرّب تعديل الفلتر أو البحث</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y" style={{ borderColor: "var(--divider)" }}>
          {users.map((user, i) => {
            const av = avatarGrad(user);
            const rl = roleLabel(user, t);
            const canAct = user.id !== currentUserId && !user.is_admin;
            return (
              <div
                key={user.id}
                className="p-4 space-y-3 row-animate"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-[15px] font-black flex-shrink-0"
                      style={av}
                    >
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-bold text-[14px] truncate" style={{ color: "var(--text-primary)" }}>{user.name}</span>
                        {user.is_admin && <Crown size={11} style={{ color: "var(--primary)", flexShrink: 0 }} />}
                        {user.role === "supervisor" && !user.is_admin && <Shield size={11} style={{ color: "var(--color-purple)", flexShrink: 0 }} />}
                      </div>
                      <p className="text-[11px] font-mono" style={{ color: "var(--text-disabled)" }}>{user.phone}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${rl.className}`}>
                      {rl.label}
                    </span>
                    {user.is_blocked && (
                      <Badge variant="error" size="sm" dot>{t("common.blocked")}</Badge>
                    )}
                  </div>
                </div>

                {/* stats row */}
                <div className="flex items-center gap-4 py-2.5 px-4 rounded-xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-black num" style={{ color: "var(--text-primary)" }}>{user.total_trips ?? 0}</span>
                    <span className="text-[10px]" style={{ color: "var(--text-disabled)" }}>{t("common.trips")}</span>
                  </div>
                  <div className="w-px h-6" style={{ background: "var(--divider)" }} />
                  <div>
                    {user.is_blocked ? (
                      <span className="text-[11px] font-bold" style={{ color: "var(--error)" }}>{t("common.blocked")}</span>
                    ) : user.is_active ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: "var(--primary)" }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--primary)" }} />
                        {t("common.active")}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold" style={{ color: "var(--text-tertiary)" }}>{t("common.inactive")}</span>
                    )}
                  </div>
                </div>

                {canAct && (
                  <div className="flex gap-2 pt-0.5">
                    <button
                      onClick={() => setBlockModal({ user, action: user.is_blocked ? "unblock" : "block" })}
                      className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 btn-action"
                      style={user.is_blocked
                        ? { background: "var(--success-surface)", color: "var(--success)", border: "1px solid var(--success-border)" }
                        : { background: "var(--error-surface)", color: "var(--error)", border: "1px solid var(--error-border)" }}
                    >
                      {user.is_blocked ? <><Unlock size={12} /> {t("drivers.unblock")}</> : <><Lock size={12} /> {t("drivers.block")}</>}
                    </button>
                    {user.role !== "driver" && (
                      <button
                        onClick={() => setRoleModal({ user, role: user.role === "supervisor" ? "user" : "supervisor" })}
                        className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 btn-action"
                        style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}
                      >
                        <Shield size={12} />
                        {user.role === "supervisor" ? t("users.removeSupervisor") : t("users.makeSupervisor")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {users.length === 0 && (
            <div className="py-24 text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--neutral-surface)", border: "1px solid var(--neutral-border)" }}>
                <UserX size={24} style={{ color: "var(--text-disabled)", opacity: 0.45 }} />
              </div>
              <div>
                <p className="font-semibold text-[14px]" style={{ color: "var(--text-secondary)" }}>{t("common.noData")}</p>
                <p className="text-[12px] mt-1" style={{ color: "var(--text-disabled)" }}>جرّب تعديل الفلتر أو البحث</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Pagination ─────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => goPage(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label={t("common.previous")}
            className="w-9 h-9 rounded-xl flex items-center justify-center btn-action disabled:opacity-30 bg-surface border border-divider text-text-secondary"
          >
            <ChevronRight size={14} />
          </button>

          {pageWindow().map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-[12px]"
                style={{ color: "var(--text-disabled)" }}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => goPage(p as number)}
                className="w-9 h-9 rounded-xl text-[13px] font-bold btn-action"
                style={p === currentPage
                  ? { background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "var(--color-white)", boxShadow: "0 8px 20px rgba(var(--primary-rgb),0.26)", border: "1px solid var(--accent-border)" }
                  : { background: "var(--surface)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => goPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label={t("common.next")}
            className="w-9 h-9 rounded-xl flex items-center justify-center btn-action disabled:opacity-30 bg-surface border border-divider text-text-secondary"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      )}

      <UserBlockModal
        blockModal={blockModal}
        setBlockModal={setBlockModal}
        handleBlock={handleBlock}
        blockReason={blockReason}
        setBlockReason={setBlockReason}
        actionLoading={actionLoading}
      />

      <UserRoleModal
        roleModal={roleModal}
        setRoleModal={setRoleModal}
        handleSetRole={handleSetRole}
        actionLoading={actionLoading}
      />
    </>
  );
}
