"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, ShieldBan, Shield, UserCheck, UserX,
  ChevronLeft, ChevronRight, SlidersHorizontal, X,
  Lock, Unlock, Crown, AlertTriangle
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

const selectStyle: React.CSSProperties = {
  background: "var(--surface-glass)",
  border: "1px solid var(--divider)",
  color: "var(--text-primary)",
};

export default function UsersClient({
  users, totalCount, currentPage, totalPages,
  searchQuery, filterRole, filterStatus, currentUserId,
}: UsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchQuery);
  const [blockModal, setBlockModal] = useState<{ user: User; action: "block" | "unblock" } | null>(null);
  const [roleModal, setRoleModal] = useState<{ user: User; role: string } | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    params.delete("page");
    startTransition(() => router.push(`/dashboard/users?${params.toString()}`));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: search });
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
      setBlockModal(null);
      setBlockReason("");
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

  return (
    <>
      {/* ===== CONTROLS ===== */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center flex-1 min-w-[220px] max-w-sm">
          <div className="relative w-full">
            <Search size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو التليفون أو الرقم القومي..."
              className="w-full pr-9 pl-10 py-2.5 rounded-xl text-[13px] outline-none"
              style={selectStyle}
              id="users-search-input"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(""); updateParams({ q: "" }); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary">
                <X size={12} />
              </button>
            )}
          </div>
          <button type="submit" id="users-search-btn"
            className="mr-2 px-3 py-2.5 rounded-xl text-[12px] font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", boxShadow: "0 4px 12px rgba(59,130,246,0.3)" }}>
            بحث
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {/* Role filter */}
          <div className="relative">
            <SlidersHorizontal size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
            <select value={filterRole} onChange={(e) => updateParams({ role: e.target.value })}
              className="appearance-none pr-8 pl-6 py-2.5 rounded-xl text-[12px] outline-none cursor-pointer"
              style={selectStyle} id="users-role-filter">
              <option value="">كل الأدوار</option>
              <option value="user">مستخدم</option>
              <option value="driver">سائق</option>
              <option value="supervisor">مشرف</option>
            </select>
            <ChevronLeft size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select value={filterStatus} onChange={(e) => updateParams({ status: e.target.value })}
              className="appearance-none px-3 py-2.5 rounded-xl text-[12px] outline-none cursor-pointer"
              style={selectStyle} id="users-status-filter">
              <option value="">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="blocked">محظور</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===== TABLE ===== */}
      {isPending && (
        <div className="text-center py-3 text-text-tertiary text-[12px]">جاري البحث...</div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{
        background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}>
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--surface-glass)", borderBottom: "1px solid var(--divider)" }}>
                {["المستخدم", "التليفون", "الدور", "الرحلات", "الحالة", "إجراءات"].map(h => (
                  <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="group/row table-row-hover" style={{ borderBottom: "1px solid rgba(26,45,71,0.5)" }}>
                  {/* User info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black flex-shrink-0"
                        style={{
                          background: user.is_blocked
                            ? "rgba(239,68,68,0.15)"
                            : user.is_admin
                            ? "linear-gradient(135deg,rgba(245,158,11,0.3),rgba(245,158,11,0.1))"
                            : user.role === "supervisor"
                            ? "linear-gradient(135deg,rgba(139,92,246,0.3),rgba(139,92,246,0.1))"
                            : "linear-gradient(135deg,rgba(59,130,246,0.25),rgba(59,130,246,0.1))",
                          border: "1px solid rgba(255,255,255,0.05)",
                          color: user.is_blocked ? "#F87171" : user.is_admin ? "#FCD34D" : user.role === "supervisor" ? "#C4B5FD" : "#93C5FD",
                        }}>
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-text-primary font-bold text-[13px]">{user.name}</span>
                          {user.is_admin && <Crown size={11} className="text-amber-400" />}
                          {user.role === "supervisor" && <Shield size={11} className="text-purple-400" />}
                        </div>
                        <p className="text-text-disabled text-[11px]">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="py-3 px-4 text-text-secondary text-[12px] num">{user.phone}</td>

                  {/* Role */}
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold`}
                      style={{
                        background: user.is_admin ? "rgba(245,158,11,0.12)" : user.role === "driver" ? "rgba(16,185,129,0.12)" : user.role === "supervisor" ? "rgba(139,92,246,0.12)" : "rgba(59,130,246,0.12)",
                        color: user.is_admin ? "#FCD34D" : user.role === "driver" ? "#34D399" : user.role === "supervisor" ? "#C4B5FD" : "#93C5FD",
                        border: `1px solid ${user.is_admin ? "rgba(245,158,11,0.2)" : user.role === "driver" ? "rgba(16,185,129,0.2)" : user.role === "supervisor" ? "rgba(139,92,246,0.2)" : "rgba(59,130,246,0.2)"}`,
                      }}>
                      {user.is_admin ? "أدمن" : user.role === "driver" ? "سائق" : user.role === "supervisor" ? "مشرف" : "مستخدم"}
                    </span>
                  </td>

                  {/* Trips */}
                  <td className="py-3 px-4 text-text-secondary text-[13px] num font-bold">{user.total_trips ?? 0}</td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {user.is_blocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                        style={{ background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <Lock size={10} /> محظور
                      </span>
                    ) : user.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                        style={{ background: "rgba(16,185,129,0.12)", color: "#34D399", border: "1px solid rgba(16,185,129,0.2)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-success" /> نشط
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                        style={{ background: "rgba(100,116,139,0.15)", color: "#94A3B8", border: "1px solid rgba(100,116,139,0.2)" }}>
                        غير نشط
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4">
                    {user.id !== currentUserId && !user.is_admin && (
                      <div className="flex items-center gap-2 transition-opacity">
                        {/* Block/Unblock */}
                        <button
                          onClick={() => setBlockModal({ user, action: user.is_blocked ? "unblock" : "block" })}
                          id={`${user.is_blocked ? "unblock" : "block"}-user-${user.id}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105"
                          style={{
                            background: user.is_blocked ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                            color: user.is_blocked ? "#34D399" : "#F87171",
                            border: `1px solid ${user.is_blocked ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                          }}>
                          {user.is_blocked ? <><Unlock size={10} />رفع الحظر</> : <><Lock size={10} />حظر</>}
                        </button>

                        {/* Role (only for non-drivers) */}
                        {user.role !== "driver" && (
                          <button
                            onClick={() => setRoleModal({ user, role: user.role === "supervisor" ? "user" : "supervisor" })}
                            id={`set-role-${user.id}`}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105"
                            style={{
                              background: "rgba(139,92,246,0.1)",
                              color: "#C4B5FD",
                              border: "1px solid rgba(139,92,246,0.2)",
                            }}>
                            <Shield size={10} />
                            {user.role === "supervisor" ? "إلغاء مشرف" : "مشرف"}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-text-disabled">
                    <UserX size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">لا توجد نتائج</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y" style={{ borderColor: "var(--divider)" }}>
          {users.map((user) => (
            <div key={user.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black"
                    style={{
                      background: user.is_admin ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.15)",
                      color: user.is_admin ? "#FCD34D" : "#93C5FD",
                    }}>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-text-primary text-[14px]">{user.name}</span>
                      {user.is_admin && <Crown size={12} className="text-amber-400" />}
                    </div>
                    <p className="text-text-disabled text-[11px]">{user.phone}</p>
                  </div>
                </div>
                {user.is_blocked && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
                    style={{ background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                    محظور
                  </span>
                )}
              </div>
              {user.id !== currentUserId && !user.is_admin && (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setBlockModal({ user, action: user.is_blocked ? "unblock" : "block" })}
                    className="flex-1 py-2 rounded-xl text-[12px] font-bold"
                    style={{
                      background: user.is_blocked ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: user.is_blocked ? "#34D399" : "#F87171",
                      border: `1px solid ${user.is_blocked ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                    }}>
                    {user.is_blocked ? "رفع الحظر" : "حظر"}
                  </button>
                  {user.role !== "driver" && (
                    <button onClick={() => setRoleModal({ user, role: user.role === "supervisor" ? "user" : "supervisor" })}
                      className="flex-1 py-2 rounded-xl text-[12px] font-bold"
                      style={{ background: "rgba(139,92,246,0.1)", color: "#C4B5FD", border: "1px solid rgba(139,92,246,0.25)" }}>
                      {user.role === "supervisor" ? "إلغاء مشرف" : "مشرف"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {users.length === 0 && (
            <div className="py-16 text-center text-text-disabled">
              <UserX size={32} className="mx-auto mb-3 opacity-30" />
              <p>لا توجد نتائج</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button onClick={() => goPage(currentPage - 1)} disabled={currentPage <= 1}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={selectStyle}>
            <ChevronRight size={14} />
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => goPage(p)}
              className="w-9 h-9 rounded-xl text-[13px] font-bold"
              style={p === currentPage
                ? { background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "white", boxShadow: "0 4px 12px rgba(59,130,246,0.3)", border: "1px solid rgba(59,130,246,0.3)" }
                : { ...selectStyle, color: "var(--text-secondary)" }}>
              {p}
            </button>
          ))}
          <button onClick={() => goPage(currentPage + 1)} disabled={currentPage >= totalPages}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={selectStyle}>
            <ChevronLeft size={14} />
          </button>
        </div>
      )}

      {/* ===== BLOCK MODAL ===== */}
      {blockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))",
              border: `1px solid ${blockModal.action === "block" ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(to left, transparent, ${blockModal.action === "block" ? "#EF4444" : "#10B981"}, transparent)` }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: blockModal.action === "block" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)" }}>
                  {blockModal.action === "block" ? <ShieldBan size={20} className="text-error" /> : <UserCheck size={20} className="text-success" />}
                </div>
                <div>
                  <h3 className="font-black text-text-primary text-[15px]">
                    {blockModal.action === "block" ? "حظر المستخدم" : "رفع الحظر"}
                  </h3>
                  <p className="text-text-tertiary text-[12px]">{blockModal.user.name}</p>
                </div>
              </div>

              {blockModal.action === "block" && (
                <div className="mb-4">
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">سبب الحظر (اختياري)</label>
                  <textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="اكتب سبب الحظر..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
                    style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)", color: "var(--text-primary)" }} />
                </div>
              )}

              {blockModal.action === "unblock" && (
                <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <AlertTriangle size={14} className="text-success flex-shrink-0" />
                  <p className="text-[12px] text-text-secondary">سيتم استعادة وصول المستخدم للتطبيق فوراً</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setBlockModal(null); setBlockReason(""); }}
                  className="flex-1 py-3 rounded-xl text-[13px] font-bold text-text-secondary"
                  style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}>
                  إلغاء
                </button>
                <button onClick={handleBlock} disabled={actionLoading}
                  id="confirm-block-action"
                  className="flex-1 py-3 rounded-xl text-[13px] font-black text-white disabled:opacity-50"
                  style={{
                    background: blockModal.action === "block"
                      ? "linear-gradient(135deg, #EF4444, #DC2626)"
                      : "linear-gradient(135deg, #10B981, #059669)",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                  }}>
                  {actionLoading ? "جاري..." : blockModal.action === "block" ? "تأكيد الحظر" : "رفع الحظر"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ROLE MODAL ===== */}
      {roleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))",
              border: "1px solid rgba(139,92,246,0.25)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: "linear-gradient(to left, transparent, #8B5CF6, transparent)" }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(139,92,246,0.15)" }}>
                  <Shield size={20} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="font-black text-text-primary text-[15px]">
                    {roleModal.role === "supervisor" ? "تعيين مشرف" : "إلغاء صلاحية المشرف"}
                  </h3>
                  <p className="text-text-tertiary text-[12px]">{roleModal.user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl mb-5"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                <p className="text-[12px] text-text-secondary">
                  {roleModal.role === "supervisor"
                    ? "سيتمكن المشرف من عرض الشكاوي والرد عليها وطلب مراجعة السائقين."
                    : "سيفقد المستخدم صلاحيات الإشراف فوراً."}
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setRoleModal(null)}
                  className="flex-1 py-3 rounded-xl text-[13px] font-bold text-text-secondary"
                  style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}>
                  إلغاء
                </button>
                <button onClick={handleSetRole} disabled={actionLoading}
                  id="confirm-role-action"
                  className="flex-1 py-3 rounded-xl text-[13px] font-black text-white disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
                    boxShadow: "0 4px 14px rgba(139,92,246,0.35)",
                  }}>
                  {actionLoading ? "جاري..." : "تأكيد"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
