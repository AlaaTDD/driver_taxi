"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Check, ChevronDown } from "lucide-react";

interface ComplaintDetailClientProps {
  complaintId: string;
  currentStatus: string;
}

const STATUS_OPTIONS = [
  { value: "in_progress", label: "قيد المعالجة", color: "var(--info)", rgb: "var(--info-rgb)" },
  { value: "resolved", label: "محلول", color: "var(--success)", rgb: "var(--success-rgb)" },
  { value: "closed", label: "مغلق", color: "var(--text-disabled)", rgb: "150,150,150" },
];

export default function ComplaintDetailClient({ complaintId, currentStatus }: ComplaintDetailClientProps) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState(currentStatus === "open" ? "in_progress" : currentStatus);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedStatus = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];

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
        setReply("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReply(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap">
        {/* Status selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStatus(!showStatus)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
            style={{
              background: `rgba(${selectedStatus.rgb}, 0.12)`,
              color: selectedStatus.color,
              border: `1px solid rgba(${selectedStatus.rgb}, 0.3)`,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: selectedStatus.color }}
            />
            {selectedStatus.label}
            <ChevronDown size={11} style={{ opacity: 0.7 }} />
          </button>

          {showStatus && (
            <div
              className="absolute bottom-full left-0 mb-1.5 rounded-xl overflow-hidden z-20"
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--divider)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                minWidth: "140px",
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setStatus(opt.value); setShowStatus(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-bold text-right transition-colors hover:bg-surface-glass"
                  style={{ color: opt.color }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.color }} />
                  {opt.label}
                  {status === opt.value && (
                    <Check size={11} className="mr-auto" style={{ color: opt.color }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-[10px] text-text-disabled mr-auto hidden sm:block">
          Ctrl+Enter للإرسال
        </span>
      </div>

      {/* Input row */}
      <div className="px-3 pb-3 flex items-end gap-2">
        <div
          className="flex-1 rounded-2xl overflow-hidden transition-all"
          style={{
            background: "var(--bg-primary)",
            border: reply.trim()
              ? "1px solid rgba(var(--primary-rgb),0.4)"
              : "1px solid var(--divider)",
            boxShadow: reply.trim() ? "0 0 0 3px rgba(var(--primary-rgb),0.06)" : "none",
          }}
        >
          <textarea
            ref={textareaRef}
            value={reply}
            onChange={autoResize}
            onKeyDown={handleKeyDown}
            placeholder="اكتب ردك على المستخدم..."
            id="complaint-reply-text"
            rows={1}
            className="w-full px-4 py-3 text-[13.5px] outline-none resize-none leading-relaxed bg-transparent"
            style={{
              color: "var(--text-primary)",
              maxHeight: "140px",
              overflow: "auto",
            }}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          id="submit-complaint-reply"
          disabled={loading || !reply.trim()}
          className="flex items-center justify-center w-11 h-11 rounded-full transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: saved
              ? "linear-gradient(135deg, var(--success), #16a34a)"
              : reply.trim()
              ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
              : "var(--surface-glass)",
            border: reply.trim() ? "none" : "1px solid var(--divider)",
            boxShadow: reply.trim() && !saved ? "0 4px 14px rgba(var(--primary-rgb),0.35)" : "none",
            color: reply.trim() ? "white" : "var(--text-disabled)",
          }}
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : saved ? (
            <Check size={17} />
          ) : (
            <Send size={16} style={{ transform: "scaleX(-1)" }} />
          )}
        </button>
      </div>
    </form>
  );
}
