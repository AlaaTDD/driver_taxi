"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Check } from "lucide-react";

interface ComplaintDetailClientProps {
  complaintId: string;
  currentStatus: string;
}

export default function ComplaintDetailClient({ complaintId, currentStatus }: ComplaintDetailClientProps) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState(currentStatus === "open" ? "in_progress" : currentStatus);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/complaints/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint_id: complaintId, reply, status }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          router.push("/dashboard/complaints");
          router.refresh();
        }, 1200);
      }
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))",
        border: "1px solid rgba(59,130,246,0.15)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      }}>
      <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid var(--divider)" }}>
        <div className="w-[3px] h-5 rounded-full"
          style={{ background: "linear-gradient(to bottom, #3B82F6, #6366F1)", boxShadow: "0 0 8px rgba(59,130,246,0.5)" }} />
        <h3 className="text-[13px] font-bold text-text-primary">الرد على الشكوى</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Status selector */}
        <div>
          <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">تغيير الحالة</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "in_progress", label: "قيد المعالجة", color: "#3B82F6" },
              { value: "resolved", label: "محلول", color: "#10B981" },
              { value: "closed", label: "مغلق", color: "#64748B" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className="px-3 py-2 rounded-xl text-[12px] font-bold transition-all"
                style={status === opt.value ? {
                  background: `${opt.color}22`,
                  color: opt.color,
                  border: `1px solid ${opt.color}40`,
                  boxShadow: `0 0 12px ${opt.color}15`,
                } : {
                  background: "rgba(15,30,53,0.6)",
                  border: "1px solid var(--divider)",
                  color: "var(--text-tertiary)",
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reply textarea */}
        <div>
          <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">نص الرد</label>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            required
            rows={5}
            placeholder="اكتب ردك على المستخدم هنا..."
            id="complaint-reply-text"
            className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none transition-all leading-relaxed"
            style={{
              background: "rgba(15,30,53,0.7)",
              border: "1px solid var(--divider)",
              color: "var(--text-primary)",
            }}
          />
          <div className="text-[10px] text-text-disabled mt-1 text-left">{reply.length} حرف</div>
        </div>

        <button
          type="submit"
          disabled={loading || !reply.trim()}
          id="submit-complaint-reply"
          className="w-full py-3.5 rounded-xl text-[14px] font-black text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{
            background: saved
              ? "linear-gradient(135deg, #10B981, #059669)"
              : "linear-gradient(135deg, #3B82F6, #6366F1)",
            boxShadow: "0 6px 20px rgba(59,130,246,0.3)",
          }}>
          {loading ? (
            <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>جاري الإرسال...</>
          ) : saved ? (
            <><Check size={15} />تم الإرسال بنجاح!</>
          ) : (
            <><Send size={15} />إرسال الرد</>
          )}
        </button>
      </div>
    </form>
  );
}
