"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare, Send, X, Loader2, CheckCircle2,
  Car, User, Headphones, Shield, Clock, Hash, AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/** Lock body scroll when modal is open and compensate for scrollbar width to prevent layout shift */
function useLockBodyScroll(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const original = document.body.style.overflow;
    const originalPad = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = original;
      document.body.style.paddingRight = originalPad;
    };
  }, [isOpen]);
}

interface ChatModalProps {
  type: "support" | "trip";
  id: string;
  targetUserId?: string;
  targetUserName?: string;
  ticketStatus?: "open" | "closed";
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" });
}

function formatTimeShort(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name?: string) {
  if (!name) return "؟";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return parts[0][0];
}

function Avatar({ name, role, size = "md" }: { name?: string; role?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "w-7 h-7 text-[10px]", md: "w-9 h-9 text-[12px]", lg: "w-11 h-11 text-[14px]" };
  const bg =
    role === "admin" ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
    : role === "driver" ? "linear-gradient(135deg, #10b981, #059669)"
    : "linear-gradient(135deg, #3b82f6, #2563eb)";
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-black shrink-0`}
      style={{ background: bg, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
    >
      {getInitials(name)}
    </div>
  );
}

function MessageBubble({ msg, type, isAdmin }: { msg: any; type: "support" | "trip"; isAdmin: boolean }) {
  const senderName = type === "support"
    ? (isAdmin ? "أنت (الأدمن)" : msg.users?.name || "المستخدم")
    : (msg.sender?.name || "—");
  const senderRole = type === "support"
    ? (isAdmin ? "admin" : "user")
    : (msg.sender?.role || "user");

  return (
    <div className={`flex gap-2.5 w-full ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar name={senderName} role={senderRole} size="sm" />
      <div className={`flex flex-col gap-1 max-w-[72%] ${isAdmin ? "items-end" : "items-start"}`}>
        <span className="text-[10px] font-semibold text-text-tertiary px-1">
          {senderName}
          {senderRole === "driver" && " (سائق)"}
          {senderRole === "user" && type === "trip" && " (راكب)"}
        </span>
        <div
          className={`relative px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
            isAdmin
              ? "text-white rounded-2xl rounded-tr-sm"
              : "text-text-primary rounded-2xl rounded-tl-sm"
          }`}
          style={{
            background: isAdmin
              ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
              : "var(--surface-elevated)",
            border: isAdmin ? "none" : "1px solid var(--divider)",
          }}
        >
          {msg.message || msg.content}
        </div>
        <span className="text-[10px] text-text-disabled px-1">
          {formatTimeShort(msg.created_at)}
        </span>
      </div>
    </div>
  );
}

function DateDivider({ date }: { date: string }) {
  const d = new Date(date);
  const label = d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px" style={{ background: "var(--divider)" }} />
      <span className="text-[10px] font-semibold px-3 py-1 rounded-full text-text-tertiary" style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--divider)" }} />
    </div>
  );
}

export function ChatButton({ props }: { props: ChatModalProps }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [ticketStatus, setTicketStatus] = useState<"open" | "closed">(props.ticketStatus || "open");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Prevent page layout shift (trembling) when modal opens
  useLockBodyScroll(isOpen);


  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/conversation?type=${props.type}&id=${props.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else {
        toast.error("فشل في جلب المحادثة");
      }
    } catch {
      toast.error("حدث خطأ أثناء جلب المحادثة");
    } finally {
      setLoading(false);
    }
  }, [props.type, props.id]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMessages();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, fetchMessages]);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleScroll = () => {
    if (!chatAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 150);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim() && !sending) {
        handleSend();
      }
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      message: newMessage,
      content: newMessage,
      sender_role: "admin",
      sender: { role: "admin", name: "الأدمن" },
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: props.type,
          message: optimisticMsg.message,
          user_id: props.type === "support" ? props.targetUserId : undefined,
          ticket_id: props.type === "support" ? props.id : undefined,
          trip_id: props.type === "trip" ? props.id : undefined,
          receiver_id: props.type === "trip" ? props.targetUserId : undefined,
        }),
      });
      if (res.ok) {
        await fetchMessages();
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "فشل إرسال الرسالة");
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setNewMessage(optimisticMsg.message);
      }
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (props.type !== "support") return;
    setClosing(true);
    try {
      const res = await fetch("/api/messages/ticket/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: props.id }),
      });
      if (res.ok) {
        toast.success("تم إغلاق التذكرة بنجاح");
        setTicketStatus("closed");
        router.refresh();
      } else {
        toast.error("فشل إغلاق التذكرة");
      }
    } finally {
      setClosing(false);
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: any[] }[] = [];
  messages.forEach((msg) => {
    const date = new Date(msg.created_at).toDateString();
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date, msgs: [msg] });
    }
  });

  const isClosed = ticketStatus === "closed";

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        id={`chat-open-${props.id}`}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all hover:scale-105"
        style={{
          background: "var(--accent-surface)",
          border: "1px solid var(--accent-border)",
          color: "var(--primary)",
          boxShadow: "0 2px 8px rgba(var(--primary-rgb),0.1)",
        }}
        title="فتح المحادثة"
      >
        <MessageSquare size={13} />
        محادثة
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          {/* Chat Window */}
          <div
            className="w-full max-w-2xl flex flex-col overflow-hidden"
            style={{
              height: "min(85vh, 700px)",
              background: "var(--surface)",
              border: "1px solid var(--divider)",
              borderRadius: "20px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
            }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center gap-3 px-5 py-4 shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--surface-elevated), var(--surface))",
                borderBottom: "1px solid var(--divider)",
              }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: props.type === "support"
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "linear-gradient(135deg, #f59e0b, #d97706)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
              >
                {props.type === "support" ? <Headphones size={18} className="text-white" /> : <Car size={18} className="text-white" />}
              </div>

              {/* Title & Subtitle */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[15px] font-black text-text-primary leading-tight">
                    {props.type === "support" ? (props.targetUserName || "دعم فني") : "محادثة الرحلة"}
                  </h3>
                  {props.type === "support" && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        background: isClosed ? "var(--warning-surface)" : "var(--success-surface)",
                        color: isClosed ? "var(--warning)" : "var(--success)",
                        border: `1px solid ${isClosed ? "var(--warning-border, var(--warning))" : "var(--success-border, var(--success))"}`,
                      }}
                    >
                      {isClosed ? "مغلقة" : "مفتوحة"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Hash size={10} className="text-text-disabled" />
                  <span className="text-[10px] text-text-disabled font-mono truncate">{props.id}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {props.type === "support" && !isClosed && (
                  <button
                    onClick={handleCloseTicket}
                    disabled={closing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: "var(--error-surface)", color: "var(--error)", border: "1px solid var(--error-surface)" }}
                  >
                    {closing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    {closing ? "جاري..." : "إغلاق"}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-surface-glass"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Participants Bar ── */}
            <div
              className="flex items-center gap-3 px-5 py-2.5 shrink-0"
              style={{ background: "var(--surface-glass)", borderBottom: "1px solid var(--divider)" }}
            >
              <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                <Shield size={11} className="text-primary opacity-70" />
                <span className="font-semibold text-primary opacity-80">الأدمن</span>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-1 text-text-disabled">
                  <div className="w-8 h-px" style={{ background: "var(--divider)" }} />
                  <MessageSquare size={10} />
                  <div className="w-8 h-px" style={{ background: "var(--divider)" }} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                {props.type === "support"
                  ? <><User size={11} className="text-info opacity-70" /><span className="font-semibold text-info opacity-80">{props.targetUserName || "المستخدم"}</span></>
                  : <><Car size={11} className="text-warning opacity-70" /><span className="font-semibold text-warning opacity-80">السائق / الراكب</span></>
                }
              </div>
            </div>

            {/* ── Chat Area ── */}
            <div
              ref={chatAreaRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4"
              style={{ background: "var(--surface-glass)" }}
            >
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  </div>
                  <p className="text-text-tertiary text-[13px]">جاري تحميل المحادثة...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}
                  >
                    <MessageSquare size={28} className="text-text-disabled opacity-40" />
                  </div>
                  <div className="text-center">
                    <p className="text-text-secondary font-bold text-[14px]">لا توجد رسائل بعد</p>
                    <p className="text-text-tertiary text-[12px] mt-1">ابدأ المحادثة بكتابة رسالة أدناه</p>
                  </div>
                </div>
              ) : (
                groupedMessages.map((group) => (
                  <div key={group.date} className="flex flex-col gap-3">
                    <DateDivider date={group.msgs[0].created_at} />
                    {group.msgs.map((msg, idx) => {
                      const isAdmin = props.type === "support"
                        ? msg.sender_role === "admin"
                        : msg.sender?.role === "admin";
                      return (
                        <MessageBubble
                          key={msg.id || idx}
                          msg={msg}
                          type={props.type}
                          isAdmin={isAdmin}
                        />
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll-to-bottom button */}
            {showScrollBottom && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-lg transition-all hover:scale-105"
                style={{
                  background: "var(--primary)",
                  color: "white",
                  boxShadow: "0 4px 16px rgba(var(--primary-rgb),0.4)",
                }}
              >
                <ChevronDown size={14} />
                رسائل جديدة
              </button>
            )}

            {/* ── Input Area ── */}
            <div
              className="shrink-0 px-4 py-3"
              style={{ background: "var(--surface-elevated)", borderTop: "1px solid var(--divider)" }}
            >
              {isClosed ? (
                <div
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold"
                  style={{ background: "var(--warning-surface)", color: "var(--warning)", border: "1px solid var(--warning-surface)" }}
                >
                  <AlertCircle size={14} />
                  هذه التذكرة مغلقة — لا يمكن إرسال رسائل جديدة
                </div>
              ) : (
                <div
                  className="flex items-end gap-3 p-2 rounded-2xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}
                >
                  <Avatar name="الأدمن" role="admin" size="sm" />
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالتك... (Enter للإرسال، Shift+Enter لسطر جديد)"
                    rows={1}
                    className="flex-1 bg-transparent outline-none text-[13px] text-text-primary placeholder:text-text-disabled resize-none py-1.5 leading-relaxed"
                    style={{ maxHeight: "120px", minHeight: "36px" }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100 shrink-0 mb-0.5"
                    style={{
                      background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                      boxShadow: newMessage.trim() ? "0 4px 12px rgba(var(--primary-rgb),0.4)" : "none",
                    }}
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              )}
              {!isClosed && (
                <div className="flex items-center gap-1 mt-1.5 px-1">
                  <Clock size={9} className="text-text-disabled" />
                  <span className="text-[10px] text-text-disabled">Enter للإرسال السريع</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
