import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ComplaintDetailClient from "./complaint-detail-client";
import { MessageSquareWarning, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations();
  const supabase = createAdminClient();

  const { data: complaint } = await supabase
    .from("complaints")
    .select(`
      id, title, description, category, status, priority,
      admin_reply, replied_at, resolved_at, created_at,
      trip_id,
      users!user_id(id, name, phone, email),
      admin:users!admin_id(name)
    `)
    .eq("id", id)
    .single();

  if (!complaint) notFound();

  
  const user = (complaint as any).users;
  
  const admin = (complaint as any).admin;

  const categoryLabel: Record<string, string> = { general: "عام", driver: "سائق", trip: "رحلة", payment: "دفع", app: "تطبيق", other: "أخرى" };
  const priorityColor: Record<string, string> = { urgent: "var(--error)", high: "var(--warning)", normal: "var(--info)", low: "var(--text-disabled)" };

  return (
    <>
    <div className="space-y-6 max-w-3xl mx-auto">
      
      <Link href="/dashboard/complaints"
        className="inline-flex items-center gap-2 text-text-tertiary hover:text-text-primary text-sm transition-colors">
        <ArrowRight size={14} />
        {t("complaints.backToList")}
      </Link>

      
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-text-primary">{complaint.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
              style={{ background: "var(--info-surface)", color: "var(--info)", border: "1px solid var(--info-surface)" }}>
              {categoryLabel[complaint.category]}
            </span>
            <span className="text-[12px] font-bold" style={{ color: priorityColor[complaint.priority] }}>
              {complaint.priority === "urgent" ? "⚡ عاجل" : complaint.priority === "high" ? "↑ مرتفع" : "— عادي"}
            </span>
            <span className="text-text-disabled text-[12px]">{formatDate(complaint.created_at)}</span>
          </div>
        </div>
      </div>

      
      <div className="dash-card p-5">
        <h3 className="text-[12px] font-bold text-text-tertiary uppercase tracking-wider mb-3">المستخدم</h3>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-[15px]"
            style={{ background: "var(--primary-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-text-primary">{user?.name}</p>
            <p className="text-text-tertiary text-[12px] num">{user?.phone} · {user?.email}</p>
          </div>
        </div>
      </div>

      
      <div className="dash-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquareWarning size={14} className="text-text-tertiary" />
          <h3 className="text-[12px] font-bold text-text-tertiary uppercase tracking-wider">نص الشكوى</h3>
        </div>
        <p className="text-text-secondary leading-relaxed">{complaint.description}</p>
      </div>

      
      {complaint.admin_reply && (
        <div className="rounded-2xl p-5" style={{
          background: "rgba(var(--success-rgb),0.06)",
          border: "1px solid rgba(var(--success-rgb),0.15)",
        }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] font-bold text-success uppercase tracking-wider">الرد السابق</h3>
            {admin?.name && <span className="text-text-disabled text-[11px]">بواسطة: {admin.name}</span>}
          </div>
          <p className="text-text-secondary leading-relaxed">{complaint.admin_reply}</p>
          {complaint.replied_at && (
            <p className="text-text-disabled text-[11px] mt-3">{formatDate(complaint.replied_at)}</p>
          )}
        </div>
      )}

      
      {complaint.status !== "closed" && (
        <ComplaintDetailClient complaintId={complaint.id} currentStatus={complaint.status} />
      )}
    </div>
    </>
  );
}
