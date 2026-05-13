import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/badge";
import ComplaintsClient from "@/app/dashboard/complaints/complaints-client";
import { getTranslations } from "next-intl/server";
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

  const t = await getTranslations();
  const supabase = createAdminClient();

  let query = supabase
    .from("complaints")
    .select(`
      id, title, description, category, status, priority,
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

  
  const [openRes, inProgressRes, resolvedRes, urgentRes] = await Promise.all([
    supabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "resolved"),
    supabase.from("complaints").select("id", { count: "exact", head: true }).eq("priority", "urgent"),
  ]);

  const stats = [
    { label: t("complaints.statuses.open"), value: openRes.count || 0, icon: <Clock size={18} />, color: "var(--warning)", colorRaw: "217,119,6" },
    { label: t("complaints.statuses.in_progress"), value: inProgressRes.count || 0, icon: <AlertTriangle size={18} />, color: "var(--info)", colorRaw: "37,99,235" },
    { label: t("complaints.statuses.resolved"), value: resolvedRes.count || 0, icon: <CheckCircle size={18} />, color: "var(--success)", colorRaw: "16,185,129" },
    { label: t("complaints.priority.urgent"), value: urgentRes.count || 0, icon: <Zap size={18} />, color: "var(--error)", colorRaw: "220,38,38" },
  ];

  const statusVariant = (s: string) => {
    if (s === "open") return "warning";
    if (s === "in_progress") return "info";
    if (s === "resolved") return "success";
    return "default";
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { open: t("complaints.statuses.open"), in_progress: t("complaints.statuses.in_progress"), resolved: t("complaints.statuses.resolved"), closed: t("complaints.statuses.closed") };
    return map[s] || s;
  };

  const categoryLabel = (c: string) => {
    const map: Record<string, string> = { general: t("complaints.categories.general"), driver: t("complaints.categories.driver"), trip: t("complaints.categories.trip"), payment: t("complaints.categories.payment"), app: t("complaints.categories.app"), other: t("complaints.categories.other") };
    return map[c] || c;
  };

  const priorityColor = (p: string) => {
    if (p === "urgent") return "var(--error)";
    if (p === "high") return "var(--warning)";
    if (p === "normal") return "var(--info)";
    return "var(--text-disabled)";
  };

  return (
    <>
      <div className="space-y-6">
        
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("complaints.title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("complaints.subtitle")}</p>
        </div>

      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="group relative dash-stat overflow-hidden p-4 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `rgba(${stat.colorRaw},0.10)`, border: `1px solid rgba(${stat.colorRaw},0.22)`, color: stat.color }}>
                {stat.icon}
              </div>
              <span className="text-2xl font-black num" style={{ color: stat.color }}>{stat.value}</span>
            </div>
            <p className="text-text-tertiary text-[12px] mt-2 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      
      <div className="dash-table-card">
        
        <div className="dash-section-header justify-between">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-[3px] h-5 rounded-full"
              style={{ background: "linear-gradient(to bottom, var(--error), var(--error-light))", boxShadow: "0 0 8px var(--error-surface)" }} />
            <h3 className="text-[13px] font-bold text-text-primary">{t("complaints.complaintList")}</h3>
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

        
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="dash-table-head">
                {[t("common.user"), t("complaints.subject"), t("complaints.category"), t("complaints.priority.label"), t("common.status"), t("common.date"), t("common.actions")].map(h => (
                  <th key={h} className="text-right py-3 px-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(complaints || []).map((complaint) => {
                
                const user = (complaint as any).users;
                return (
                  <tr key={complaint.id} className="group/row dash-table-row">
                    <td className="py-3 px-4">
                      <p className="font-bold text-text-primary text-[13px]">{user?.name}</p>
                      <p className="text-text-disabled text-[11px] num">{user?.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-text-secondary text-[13px] max-w-[200px] truncate">{complaint.title}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-lg text-[11px] font-bold"
                        style={{ background: "var(--info-surface)", color: "var(--info)", border: "1px solid var(--info-surface)" }}>
                        {categoryLabel(complaint.category)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[12px] font-bold"
                        style={{ color: priorityColor(complaint.priority) }}>
                        {complaint.priority === "urgent" ? `⚡ ${t("complaints.priority.urgent")}` : complaint.priority === "high" ? `↑ ${t("complaints.priority.high")}` : complaint.priority === "normal" ? `— ${t("complaints.priority.normal")}` : `↓ ${t("complaints.priority.low")}`}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={statusVariant(complaint.status) as "success" | "warning" | "info" | "error" | "default"} dot>
                        {statusLabel(complaint.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-text-tertiary text-[12px] whitespace-nowrap">{formatDate(complaint.created_at)}</td>
                    <td className="py-3 px-4">
                      <ComplaintReplyButton complaint={complaint} label={t("common.reply")} />
                    </td>
                  </tr>
                );
              })}
              {(!complaints || complaints.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-text-disabled">
                    <MessageSquareWarning size={32} className="mx-auto mb-3 opacity-30" />
                    <p>{t("complaints.noComplaints")}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        
        <div className="md:hidden divide-y" style={{ borderColor: "var(--divider)" }}>
          {(complaints || []).map((complaint) => {
            
            const user = (complaint as any).users;
            return (
              <div key={complaint.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-text-primary text-[14px]">{user?.name}</p>
                    <p className="text-text-tertiary text-[12px]">{complaint.title}</p>
                  </div>
                  <Badge variant={statusVariant(complaint.status) as "success" | "warning" | "info" | "error" | "default"} dot>
                    {statusLabel(complaint.status)}
                  </Badge>
                </div>
                <p className="text-text-secondary text-[12px] line-clamp-2">{complaint.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: priorityColor(complaint.priority) }}>
                    {complaint.priority === "urgent" ? `⚡ ${t("complaints.priority.urgent")}` : "— " + complaint.priority}
                  </span>
                  <span className="text-text-disabled text-[11px]">{formatDate(complaint.created_at)}</span>
                </div>
                <ComplaintReplyButton complaint={complaint} label={t("common.reply")} />
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </>
  );
}

function ComplaintReplyButton({ complaint, label }: { complaint: { id: string; title: string; status: string; description: string }, label: string }) {
  if (complaint.status === "closed") return null;
  return (
    <a href={`/dashboard/complaints/${complaint.id}`}
      id={`reply-complaint-${complaint.id}`}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80"
      style={{ background: "var(--info-surface)", color: "var(--info)", border: "1px solid var(--accent-border)" }}>
      <MessageSquareWarning size={11} /> {label}
    </a>
  );
}
