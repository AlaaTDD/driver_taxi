import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/badge";
import ComplaintsClient from "./complaints-client";
import { MessageSquareWarning, CheckCircle, Clock, AlertTriangle, Zap } from "lucide-react";

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; priority?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = 10;
  const filterStatus = params.status || "";
  const filterPriority = params.priority || "";
  const filterCategory = params.category || "";

  const supabase = createAdminClient();

  let query = supabase
    .from("complaints")
    .select(`
      id, subject, message, category, status, priority,
      admin_reply, replied_at, resolved_at, created_at,
      users!user_id(id, name, phone),
      admin:users!admin_id(name)
    `, { count: "exact" });

  if (filterStatus) query = query.eq("status", filterStatus);
  if (filterPriority) query = query.eq("priority", filterPriority);
  if (filterCategory) query = query.eq("category", filterCategory);

  const { data: complaints, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const totalPages = Math.ceil((count || 0) / pageSize);

  // Stats
  const [openRes, inProgressRes, resolvedRes, urgentRes] = await Promise.all([
    supabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "resolved"),
    supabase.from("complaints").select("id", { count: "exact", head: true }).eq("priority", "urgent"),
  ]);

  const stats = [
    { label: "مفتوحة", value: openRes.count || 0, icon: <Clock size={18} />, color: "#F59E0B" },
    { label: "قيد المعالجة", value: inProgressRes.count || 0, icon: <AlertTriangle size={18} />, color: "#3B82F6" },
    { label: "محلولة", value: resolvedRes.count || 0, icon: <CheckCircle size={18} />, color: "#10B981" },
    { label: "عاجلة", value: urgentRes.count || 0, icon: <Zap size={18} />, color: "#EF4444" },
  ];

  const statusVariant = (s: string) => {
    if (s === "open") return "warning";
    if (s === "in_progress") return "primary";
    if (s === "resolved") return "success";
    return "default";
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { open: "مفتوح", in_progress: "قيد المعالجة", resolved: "محلول", closed: "مغلق" };
    return map[s] || s;
  };

  const categoryLabel = (c: string) => {
    const map: Record<string, string> = { general: "عام", driver: "سائق", trip: "رحلة", payment: "دفع", app: "تطبيق", other: "أخرى" };
    return map[c] || c;
  };

  const priorityColor = (p: string) => {
    if (p === "urgent") return "#EF4444";
    if (p === "high") return "#F59E0B";
    if (p === "normal") return "#3B82F6";
    return "#64748B";
  };

  return (
    <div className="space-y-6">

      {/* ===== HEADER ===== */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">إدارة</span>
          <span className="w-1 h-1 rounded-full bg-red-500/60" />
          <span className="text-[11px] text-text-disabled">الشكاوي</span>
        </div>
        <h1 className="page-title">الشكاوي</h1>
        <p className="page-subtitle">عرض وإدارة الرد على شكاوي المستخدمين</p>
      </div>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="group relative rounded-xl overflow-hidden p-4 transition-all duration-300 hover:-translate-y-1"
            style={{
              background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))",
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(to left, transparent, ${stat.color}, transparent)`, opacity: 0.6 }} />
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}18`, border: `1px solid ${stat.color}25`, color: stat.color }}>
                {stat.icon}
              </div>
              <span className="text-2xl font-black num" style={{ color: stat.color }}>{stat.value}</span>
            </div>
            <p className="text-text-tertiary text-[12px] mt-2 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ===== TABLE ===== */}
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        }}>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--divider)" }}>
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-[3px] h-5 rounded-full"
              style={{ background: "linear-gradient(to bottom, #EF4444, #DC2626)", boxShadow: "0 0 8px rgba(239,68,68,0.5)" }} />
            <h3 className="text-[13px] font-bold text-text-primary">قائمة الشكاوي</h3>
            <span className="text-text-disabled text-[11px]">({count || 0})</span>
          </div>
          <ComplaintsClient
            filterStatus={filterStatus}
            filterPriority={filterPriority}
            filterCategory={filterCategory}
            currentPage={page}
            totalPages={totalPages}
          />
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(15,30,53,0.4)", borderBottom: "1px solid var(--divider)" }}>
                {["المستخدم", "الموضوع", "التصنيف", "الأولوية", "الحالة", "التاريخ", "إجراء"].map(h => (
                  <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(complaints || []).map((complaint) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const user = (complaint as any).users;
                return (
                  <tr key={complaint.id} className="group/row table-row-hover" style={{ borderBottom: "1px solid rgba(26,45,71,0.5)" }}>
                    <td className="py-3 px-4">
                      <p className="font-bold text-text-primary text-[13px]">{user?.name}</p>
                      <p className="text-text-disabled text-[11px] num">{user?.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-text-secondary text-[13px] max-w-[200px] truncate">{complaint.subject}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-lg text-[11px] font-bold"
                        style={{ background: "rgba(59,130,246,0.1)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.2)" }}>
                        {categoryLabel(complaint.category)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[12px] font-bold"
                        style={{ color: priorityColor(complaint.priority) }}>
                        {complaint.priority === "urgent" ? "⚡ عاجل" : complaint.priority === "high" ? "↑ مرتفع" : complaint.priority === "normal" ? "— عادي" : "↓ منخفض"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={statusVariant(complaint.status) as "success" | "warning" | "primary" | "error" | "default"} dot>
                        {statusLabel(complaint.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-text-tertiary text-[12px] whitespace-nowrap">{formatDate(complaint.created_at)}</td>
                    <td className="py-3 px-4">
                      <ComplaintReplyButton complaint={complaint} />
                    </td>
                  </tr>
                );
              })}
              {(!complaints || complaints.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-text-disabled">
                    <MessageSquareWarning size={32} className="mx-auto mb-3 opacity-30" />
                    <p>لا توجد شكاوي</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y" style={{ borderColor: "var(--divider)" }}>
          {(complaints || []).map((complaint) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const user = (complaint as any).users;
            return (
              <div key={complaint.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-text-primary text-[14px]">{user?.name}</p>
                    <p className="text-text-tertiary text-[12px]">{complaint.subject}</p>
                  </div>
                  <Badge variant={statusVariant(complaint.status) as "success" | "warning" | "primary" | "error" | "default"} dot>
                    {statusLabel(complaint.status)}
                  </Badge>
                </div>
                <p className="text-text-secondary text-[12px] line-clamp-2">{complaint.message}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: priorityColor(complaint.priority) }}>
                    {complaint.priority === "urgent" ? "⚡ عاجل" : "— " + complaint.priority}
                  </span>
                  <span className="text-text-disabled text-[11px]">{formatDate(complaint.created_at)}</span>
                </div>
                <ComplaintReplyButton complaint={complaint} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ComplaintReplyButton({ complaint }: { complaint: { id: string; subject: string; status: string; message: string } }) {
  if (complaint.status === "closed") return null;
  return (
    <a href={`/dashboard/complaints/${complaint.id}`}
      id={`reply-complaint-${complaint.id}`}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80"
      style={{ background: "rgba(59,130,246,0.1)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.2)" }}>
      <MessageSquareWarning size={11} /> رد
    </a>
  );
}
