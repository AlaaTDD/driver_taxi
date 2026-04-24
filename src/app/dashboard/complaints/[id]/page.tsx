import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import ComplaintDetailClient from "./complaint-detail-client";
import { MessageSquareWarning, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: complaint } = await supabase
    .from("complaints")
    .select(`
      id, subject, message, category, status, priority,
      admin_reply, replied_at, resolved_at, created_at,
      trip_id,
      users!user_id(id, name, phone, email),
      admin:users!admin_id(name)
    `)
    .eq("id", id)
    .single();

  if (!complaint) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (complaint as any).users;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (complaint as any).admin;

  const categoryLabel: Record<string, string> = { general: "عام", driver: "سائق", trip: "رحلة", payment: "دفع", app: "تطبيق", other: "أخرى" };
  const priorityColor: Record<string, string> = { urgent: "#EF4444", high: "#F59E0B", normal: "#3B82F6", low: "#64748B" };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link href="/dashboard/complaints"
        className="inline-flex items-center gap-2 text-text-tertiary hover:text-text-primary text-[13px] transition-colors">
        <ArrowRight size={14} />
        العودة للشكاوي
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-black text-text-primary">{complaint.subject}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
              style={{ background: "rgba(59,130,246,0.1)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.2)" }}>
              {categoryLabel[complaint.category]}
            </span>
            <span className="text-[12px] font-bold" style={{ color: priorityColor[complaint.priority] }}>
              {complaint.priority === "urgent" ? "⚡ عاجل" : complaint.priority === "high" ? "↑ مرتفع" : "— عادي"}
            </span>
            <span className="text-text-disabled text-[12px]">{formatDate(complaint.created_at)}</span>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="rounded-2xl p-5" style={{
        background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))",
        border: "1px solid rgba(255,255,255,0.05)",
      }}>
        <h3 className="text-[12px] font-bold text-text-tertiary uppercase tracking-wider mb-3">المستخدم</h3>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-[15px]"
            style={{ background: "rgba(59,130,246,0.15)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.2)" }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-text-primary">{user?.name}</p>
            <p className="text-text-tertiary text-[12px] num">{user?.phone} · {user?.email}</p>
          </div>
        </div>
      </div>

      {/* Complaint Message */}
      <div className="rounded-2xl p-5" style={{
        background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))",
        border: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquareWarning size={14} className="text-text-tertiary" />
          <h3 className="text-[12px] font-bold text-text-tertiary uppercase tracking-wider">نص الشكوى</h3>
        </div>
        <p className="text-text-secondary leading-relaxed">{complaint.message}</p>
      </div>

      {/* Existing Reply */}
      {complaint.admin_reply && (
        <div className="rounded-2xl p-5" style={{
          background: "rgba(16,185,129,0.06)",
          border: "1px solid rgba(16,185,129,0.15)",
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

      {/* Reply Form */}
      {complaint.status !== "closed" && (
        <ComplaintDetailClient complaintId={complaint.id} currentStatus={complaint.status} />
      )}
    </div>
  );
}
