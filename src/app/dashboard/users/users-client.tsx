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
const glassCard: React.CSSProperties = {
  background: "var(--surface-glass)",
  border: "1px solid var(--divider)",
  color: "var(--text-primary)",
};

const avatarGrad = (user: User) =>
  user.is_blocked
    ? { bg: "rgba(239,68,68,0.15)", color: "#F87171", border: "rgba(239,68,68,0.25)" }
    : user.is_admin
    ? { bg: "linear-gradient(135deg,rgba(245,158,11,0.28),rgba(245,158,11,0.08))", color: "#FCD34D", border: "rgba(245,158,11,0.25)" }
    : user.role === "supervisor"
    ? { bg: "linear-gradient(135deg,rgba(139,92,246,0.28),rgba(139,92,246,0.08))", color: "#C4B5FD", border: "rgba(139,92,246,0.25)" }
    : user.role === "driver"
    ? { bg: "linear-gradient(135deg,rgba(16,185,129,0.22),rgba(16,185,129,0.06))", color: "#34D399", border: "rgba(16,185,129,0.2)" }
    : { bg: "linear-gradient(135deg,rgba(59,130,246,0.22),rgba(59,130,246,0.06))", color: "#93C5FD", border: "rgba(59,130,246,0.2)" };

const roleLabel = (user: User, t: any) =>
  user.is_admin ? { label: t("users.roles.admin"), bg: "rgba(245,158,11,0.12)", color: "#FCD34D", border: "rgba(245,158,11,0.22)" }
  : user.role === "driver" ? { label: t("users.roles.driver"), bg: "rgba(16,185,129,0.12)", color: "#34D399", border: "rgba(16,185,129,0.22)" }
  : user.role === "supervisor" ? { label: t("users.roles.supervisor"), bg: "rgba(139,92,246,0.12)", color: "#C4B5FD", border: "rgba(139,92,246,0.22)" }
  : { label: t("users.roles.user"), bg: "rgba(59,130,246,0.12)", color: "#93C5FD", border: "rgba(59,130,246,0.22)" };

/* ─── ActionMenu (three-dot dropdown) ───────────────────── */
function ActionMenu({
  user,
  onBlock,
  onRole,
}: {
  user: User;
  onBlock: () => void;
  onRole: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{
          background: open ? "var(--surface-glass)" : "transparent",
          border: open ? "1px solid var(--divider)" : "1px solid transparent",
          color: "var(--text-tertiary)",
        }}
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-10 z-30 w-44 rounded-xl overflow-hidden"
          style={{
            background: "var(--surface-elevated)",
            border: "1px solid var(--divider)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            animation: "fadeSlideDown 0.15s ease",
          }}
        >
          <button
            onClick={() => { setOpen(false); onBlock(); }}
            id={`${user.is_blocked ? "unblock" : "block"}-user-${user.id}`}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-bold text-right transition-all hover:brightness-110"
            style={{
              background: "transparent",
              color: user.is_blocked ? "#34D399" : "#F87171",
              borderBottom: "1px solid var(--divider)",
            }}
          >
            {user.is_blocked ? <Unlock size={13} /> : <Lock size={13} />}
            {user.is_blocked ? "رفع الحظر" : "حظر المستخدم"}
          </button>

          {user.role !== "driver" && (
            <button
              onClick={() => { setOpen(false); onRole(); }}
              id={`set-role-${user.id}`}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-bold text-right transition-all hover:brightness-110"
              style={{ background: "transparent", color: "#C4B5FD" }}
            >
              <Shield size={13} />
              {user.role === "supervisor" ? "إلغاء مشرف" : "تعيين مشرف"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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
      await fetch("/api/users/block", { method: "POST", body: fd });
      setBlockModal(null); setBlockReason("");
      router.refresh();
    } finally { setActionLoading(false); }
  };

  const handleSetRole = async () => {
    if (!roleModal) return;
    setActionLoading(true);
    try {
      const fd = new FormData();
      fd.set("user_id", roleModal.user.id);
      fd.set("role", roleModal.role);
      await fetch("/api/users/set-role", { method: "POST", body: fd });
      setRoleModal(null);
      router.refresh();
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
        .focus-ring:focus-within { outline: 2px solid rgba(59,130,246,0.4); outline-offset: 0; border-radius: 14px; }
      `}</style>

      {/* ── Search + Filters bar ─────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row gap-3 flex-wrap items-center p-3 rounded-2xl"
        style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
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
              <button type="button" onClick={() => { setSearch(""); updateParams({ q: "" }); }}
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
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", boxShadow: "0 4px 12px rgba(59,130,246,0.3)" }}
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
                background: filterRole ? "rgba(139,92,246,0.12)" : "var(--surface)",
                border: filterRole ? "1px solid rgba(139,92,246,0.3)" : "1px solid var(--divider)",
                color: filterRole ? "#C4B5FD" : "var(--text-secondary)",
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
                background: filterStatus === "blocked" ? "rgba(239,68,68,0.12)" : filterStatus === "active" ? "rgba(16,185,129,0.12)" : "var(--surface)",
                border: filterStatus === "blocked" ? "1px solid rgba(239,68,68,0.3)" : filterStatus === "active" ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--divider)",
                color: filterStatus === "blocked" ? "#F87171" : filterStatus === "active" ? "#34D399" : "var(--text-secondary)",
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
              style={{ background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}
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
            <span className="text-[11px] font-semibold px-2 py-1 rounded-lg"
              style={{ background: "rgba(59,130,246,0.1)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.15)" }}>
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
              <tr className="dash-table-head">
                {[
                  { label: t("common.name"), w: "w-[30%]" },
                  { label: t("common.phone"), w: "w-[14%]" },
                  { label: t("common.role"), w: "w-[11%]" },
                  { label: t("common.trips"), w: "w-[10%]" },
                  { label: t("common.status"), w: "w-[13%]" },
                  { label: t("common.actions"), w: "w-[10%]" },
                ].map((h) => (
                  <th key={h.label} className={`${h.w} text-right py-3 px-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap`}
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
                return (
                  <tr
                    key={user.id}
                    className="row-animate group/row dash-table-row hover-lift"
                    style={{
                      animationDelay: `${i * 28}ms`,
                    }}
                  >
                    {/* Avatar + name */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black flex-shrink-0 transition-transform group-hover/row:scale-105"
                          style={{ background: av.bg, color: av.color, border: `1px solid ${av.border}` }}
                        >
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                          {user.is_blocked && (
                            <span className="absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                              style={{ background: "var(--surface-elevated)", border: "1.5px solid var(--divider)" }}>
                              <Lock size={7} style={{ color: "#F87171" }} />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-text-primary font-bold text-[13px] truncate">{user.name}</span>
                            {user.is_admin && <Crown size={10} style={{ color: "#FCD34D", flexShrink: 0 }} />}
                            {user.role === "supervisor" && !user.is_admin && <Shield size={10} style={{ color: "#C4B5FD", flexShrink: 0 }} />}
                          </div>
                          <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-disabled)" }}>{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-5">
                      <span className="text-[12px] font-mono tracking-wide" style={{ color: "var(--text-secondary)" }}>{user.phone}</span>
                    </td>

                    {/* Role badge */}
                    <td className="py-3.5 px-5">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap"
                        style={{ background: rl.bg, color: rl.color, border: `1px solid ${rl.border}` }}
                      >
                        {rl.label}
                      </span>
                    </td>

                    {/* Trips */}
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-black num" style={{ color: "var(--text-primary)" }}>{user.total_trips ?? 0}</span>
                        <span className="text-[10px]" style={{ color: "var(--text-disabled)" }}>{t("common.trips")}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      {user.is_blocked ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                            style={{ background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <Lock size={9} /> {t("common.blocked")}
                          </span>
                          {user.blocked_reason && (
                            <span className="text-[10px] px-1 truncate max-w-[110px]" style={{ color: "var(--text-disabled)" }} title={user.blocked_reason}>
                              {user.blocked_reason}
                            </span>
                          )}
                        </div>
                      ) : user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                          style={{ background: "rgba(16,185,129,0.12)", color: "#34D399", border: "1px solid rgba(16,185,129,0.2)" }}>
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
                          {t("common.active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                          style={{ background: "rgba(100,116,139,0.14)", color: "#94A3B8", border: "1px solid rgba(100,116,139,0.2)" }}>
                          {t("common.inactive")}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5">
                      {canAct && (
                        <div className="flex items-center gap-1.5">
                          {/* quick block toggle */}
                          <button
                            onClick={() => setBlockModal({ user, action: user.is_blocked ? "unblock" : "block" })}
                            id={`${user.is_blocked ? "unblock" : "block"}-user-${user.id}`}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold btn-action"
                            style={{
                              background: user.is_blocked ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                              color: user.is_blocked ? "#34D399" : "#F87171",
                              border: `1px solid ${user.is_blocked ? "rgba(16,185,129,0.22)" : "rgba(239,68,68,0.22)"}`,
                            }}
                          >
                            {user.is_blocked ? <><Unlock size={10} /> رفع</> : <><Lock size={10} /> حظر</>}
                          </button>

                          {/* three-dot for role */}
                          <ActionMenu
                            user={user}
                            onBlock={() => setBlockModal({ user, action: user.is_blocked ? "unblock" : "block" })}
                            onRole={() => setRoleModal({ user, role: user.role === "supervisor" ? "user" : "supervisor" })}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.15)" }}>
                        <UserX size={26} style={{ color: "var(--text-disabled)", opacity: 0.5 }} />
                      </div>
                      <div>
                        <p className="font-bold text-[14px]" style={{ color: "var(--text-secondary)" }}>{t("common.noData")}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: "var(--text-disabled)" }}>-</p>
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
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-[14px] font-black flex-shrink-0"
                      style={{ background: av.bg, color: av.color, border: `1px solid ${av.border}` }}
                    >
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[14px] truncate" style={{ color: "var(--text-primary)" }}>{user.name}</span>
                        {user.is_admin && <Crown size={11} style={{ color: "#FCD34D", flexShrink: 0 }} />}
                      </div>
                      <p className="text-[11px] font-mono" style={{ color: "var(--text-disabled)" }}>{user.phone}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: rl.bg, color: rl.color, border: `1px solid ${rl.border}` }}>
                      {rl.label}
                    </span>
                    {user.is_blocked && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                        {t("common.blocked")}
                      </span>
                    )}
                  </div>
                </div>

                {/* stats row */}
                <div className="flex items-center gap-4 py-2 px-3 rounded-xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}>
                  <div className="flex flex-col items-center">
                    <span className="text-[14px] font-black num" style={{ color: "var(--text-primary)" }}>{user.total_trips ?? 0}</span>
                    <span className="text-[10px]" style={{ color: "var(--text-disabled)" }}>{t("common.trips")}</span>
                  </div>
                  <div className="w-px h-6" style={{ background: "var(--divider)" }} />
                  <div>
                    {user.is_blocked ? (
                      <span className="text-[11px] font-bold" style={{ color: "#F87171" }}>{t("common.blocked")}</span>
                    ) : user.is_active ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "#34D399" }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
                        {t("common.active")}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold" style={{ color: "#94A3B8" }}>{t("common.inactive")}</span>
                    )}
                  </div>
                </div>

                {canAct && (
                  <div className="flex gap-2 pt-0.5">
                    <button
                      onClick={() => setBlockModal({ user, action: user.is_blocked ? "unblock" : "block" })}
                      className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 btn-action"
                      style={{
                        background: user.is_blocked ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        color: user.is_blocked ? "#34D399" : "#F87171",
                        border: `1px solid ${user.is_blocked ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                      }}
                    >
                      {user.is_blocked ? <><Unlock size={12} /> رفع الحظر</> : <><Lock size={12} /> حظر</>}
                    </button>
                    {user.role !== "driver" && (
                      <button
                        onClick={() => setRoleModal({ user, role: user.role === "supervisor" ? "user" : "supervisor" })}
                        className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 btn-action"
                        style={{ background: "rgba(139,92,246,0.1)", color: "#C4B5FD", border: "1px solid rgba(139,92,246,0.25)" }}
                      >
                        <Shield size={12} />
                        {user.role === "supervisor" ? "إلغاء مشرف" : "مشرف"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {users.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.15)" }}>
                <UserX size={22} style={{ color: "var(--text-disabled)", opacity: 0.5 }} />
              </div>
              <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>{t("common.noData")}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Pagination ─────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <button
            onClick={() => goPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="w-9 h-9 rounded-xl flex items-center justify-center btn-action disabled:opacity-30"
            style={glassCard}
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
                  ? { background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "#fff", boxShadow: "0 4px 14px rgba(59,130,246,0.3)", border: "1px solid rgba(59,130,246,0.3)" }
                  : { ...glassCard, color: "var(--text-secondary)" }}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => goPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="w-9 h-9 rounded-xl flex items-center justify-center btn-action disabled:opacity-30"
            style={glassCard}
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      )}

      {/* ══ Block / Unblock Modal ══════════════════════════════ */}
      {blockModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setBlockModal(null); setBlockReason(""); } }}
        >
          <div
            className="relative w-full sm:max-w-[400px] rounded-t-3xl sm:rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg, var(--surface-elevated), var(--surface))",
              border: `1px solid ${blockModal.action === "block" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
              boxShadow: "0 32px 64px rgba(0,0,0,0.65)",
              animation: "fadeSlideDown 0.2s ease",
            }}
          >
            {/* top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(to left, transparent, ${blockModal.action === "block" ? "#EF4444" : "#10B981"}, transparent)` }} />

            {/* drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--divider)" }} />
            </div>

            <div className="p-6 pt-4 sm:pt-6">
              {/* header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: blockModal.action === "block" ? "rgba(239,68,68,0.14)" : "rgba(16,185,129,0.14)" }}
                  >
                    {blockModal.action === "block"
                      ? <ShieldBan size={20} style={{ color: "#F87171" }} />
                      : <UserCheck size={20} style={{ color: "#34D399" }} />
                    }
                  </div>
                  <div>
                    <h3 className="font-black text-[15px]" style={{ color: "var(--text-primary)" }}>
                      {blockModal.action === "block" ? t("users.blockUser") : t("users.unblockUser")}
                    </h3>
                    <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>{blockModal.user.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setBlockModal(null); setBlockReason(""); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center btn-action"
                  style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-tertiary)" }}
                >
                  <X size={13} />
                </button>
              </div>

              {blockModal.action === "block" && (
                <div className="mb-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>
                    {t("users.blockReason")}
                  </label>
                  <textarea
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="اكتب سبب الحظر..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none transition-all"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--divider)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              )}

              {blockModal.action === "unblock" && (
                <div
                  className="flex items-start gap-2.5 p-3.5 rounded-xl mb-4"
                  style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}
                >
                  <CheckCircle2 size={15} style={{ color: "#34D399", flexShrink: 0, marginTop: 1 }} />
                  <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    سيتم استعادة وصول المستخدم للتطبيق فوراً بعد رفع الحظر.
                  </p>
                </div>
              )}

              <div className="flex gap-2.5">
                <button
                  onClick={() => { setBlockModal(null); setBlockReason(""); }}
                  className="flex-1 py-3 rounded-xl text-[13px] font-bold btn-action"
                  style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleBlock}
                  disabled={actionLoading}
                  id="confirm-block-action"
                  className="flex-1 py-3 rounded-xl text-[13px] font-black text-white disabled:opacity-50 btn-action"
                  style={{
                    background: blockModal.action === "block"
                      ? "linear-gradient(135deg, #EF4444, #DC2626)"
                      : "linear-gradient(135deg, #10B981, #059669)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  }}
                >
                  {actionLoading
                    ? <span className="flex items-center justify-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> {t("common.loading")}...</span>
                    : blockModal.action === "block" ? t("users.confirmBlock") : t("users.confirmUnblock")
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Role Modal ════════════════════════════════════════ */}
      {roleModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setRoleModal(null); }}
        >
          <div
            className="relative w-full sm:max-w-[400px] rounded-t-3xl sm:rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg, var(--surface-elevated), var(--surface))",
              border: "1px solid rgba(139,92,246,0.22)",
              boxShadow: "0 32px 64px rgba(0,0,0,0.65)",
              animation: "fadeSlideDown 0.2s ease",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: "linear-gradient(to left, transparent, #8B5CF6, transparent)" }} />

            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--divider)" }} />
            </div>

            <div className="p-6 pt-4 sm:pt-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(139,92,246,0.14)" }}>
                    <Shield size={20} style={{ color: "#C4B5FD" }} />
                  </div>
                  <div>
                    <h3 className="font-black text-[15px]" style={{ color: "var(--text-primary)" }}>
                      {t("users.setRole")}
                    </h3>
                    <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>{roleModal.user.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setRoleModal(null)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center btn-action"
                  style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-tertiary)" }}
                >
                  <X size={13} />
                </button>
              </div>

              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5"
                style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)" }}
              >
                <AlertTriangle size={14} style={{ color: "#FCD34D", flexShrink: 0, marginTop: 1 }} />
                <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  {roleModal.role === "supervisor"
                    ? t("users.roleSupervisorWarning")
                    : t("users.roleUserWarning")}
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setRoleModal(null)}
                  className="flex-1 py-3 rounded-xl text-[13px] font-bold btn-action"
                  style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-secondary)" }}
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSetRole}
                  disabled={actionLoading}
                  id="confirm-role-action"
                  className="flex-1 py-3 rounded-xl text-[13px] font-black text-white disabled:opacity-50 btn-action"
                  style={{
                    background: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
                    boxShadow: "0 4px 16px rgba(139,92,246,0.35)",
                  }}
                >
                  {actionLoading
                    ? <span className="flex items-center justify-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> {t("common.loading")}...</span>
                    : t("common.confirm")
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}