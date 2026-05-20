"use client";

import { useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReplyModalProps {
  type: "support" | "trip";
  targetUserId?: string;
  targetUserName?: string;
  tripId?: string;
}

export function ReplyButton({ props }: { props: ReplyModalProps }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: props.type,
          message,
          user_id: props.type === "support" ? props.targetUserId : undefined,
          trip_id: props.type === "trip" ? props.tripId : undefined,
          receiver_id: props.type === "trip" ? props.targetUserId : undefined,
        }),
      });

      if (res.ok) {
        setIsOpen(false);
        setMessage("");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "فشل إرسال الرسالة");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-primary/10 hover:text-primary text-text-tertiary"
        title="رد"
      >
        <MessageSquare size={14} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-elevated rounded-2xl p-6 border border-divider shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">
                الرد على {props.targetUserName || "المستخدم"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-text-tertiary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSend}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-[13px] bg-surface border border-divider outline-none focus:border-primary resize-none mb-4 text-text-primary"
                required
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-text-secondary border border-divider hover:bg-surface transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? "جاري الإرسال..." : (
                    <>
                      <Send size={14} />
                      إرسال الرد
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
