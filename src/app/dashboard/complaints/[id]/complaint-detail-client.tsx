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
    <form onSubmit={handleSubmit} className="dash-card overflow-hidden"
      style={{
        border: "1px solid var(--accent-border)",
      }}>
      <div className="dash-section-header">
        <div className="w-[3px] h-5 rounded-full"
          style={{ background: "linear-gradient(to bottom, var(--primary-light), var(--primary))", boxShadow: "0 0 8px var(--primary-surface)" }} />
        <h3 className="text-[13px] font-bold text-text-primary">الرد على الشكوى</h3>
      </div>

      <div className="p-5 space-y-4">
        
        <div>
          <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">تغيير الحالة</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "in_progress", label: "قيد المعالجة", color: "var(--info)", colorRaw: "var(--info-rgb)" },
              { value: "resolved", label: "محلول", color: "var(--success)", colorRaw: "var(--success-rgb)" },
              { value: "closed", label: "مغلق", color: "var(--text-disabled)", colorRaw: "var(--text-disabled-rgb)" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className="px-3 py-2 rounded-xl text-[12px] font-bold transition-all"
                style={status === opt.value ? {
                  background: `rgba(${(opt as any).colorRaw},0.12)`,
                  color: opt.color,
                  border: `1px solid rgba(${(opt as any).colorRaw},0.28)`,
                  boxShadow: `0 0 12px rgba(${(opt as any).colorRaw},0.12)`,
                } : {
                  background: "var(--surface-glass)",
                  border: "1px solid var(--divider)",
                  color: "var(--text-tertiary)",
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        
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
              background: "var(--surface-glass)",
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
              ? "linear-gradient(135deg, var(--success), var(--success-light))"
              : "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            boxShadow: `0 6px 20px var(--accent-shadow)`,
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
