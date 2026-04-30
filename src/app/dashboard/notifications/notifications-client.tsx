"use client";

import { SlidersHorizontal, ChevronLeft, ChevronRight, Send, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

interface NotificationsClientProps {
  currentPage: number;
  totalPages: number;
  currentType: string;
}

const selectStyle = {
  background: "var(--surface-glass)",
  border: "1px solid var(--divider)",
  color: "var(--text-primary)",
};

export default function NotificationsClient({
  currentPage,
  totalPages,
  currentType,
}: NotificationsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "general" });

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (currentType) params.set("type", currentType);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSend = async () => {
    if (!form.title || !form.message) return;
    setSending(true);
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSendSuccess(true);
        setTimeout(() => {
          setShowSendModal(false);
          setSendSuccess(false);
          setForm({ title: "", message: "", type: "general" });
          router.refresh();
        }, 1500);
      }
    } finally {
      setSending(false);
    }
  };

  const typeOptions = [
    { value: "", label: "كل الأنواع" },
    { value: "general", label: "عام" },
    { value: "trip", label: "رحلة" },
    { value: "promo", label: "عرض" },
    { value: "system", label: "نظام" },
    { value: "trip_offer", label: "عرض رحلة" },
    { value: "trip_completed", label: "مكتملة" },
    { value: "trip_cancelled", label: "ملغية" },
    { value: "account_verified", label: "اعتماد" },
  ];

  return (
    <>
      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Type Filter */}
        <div className="relative">
          <SlidersHorizontal size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
          <select
            value={currentType}
            onChange={(e) => updateParams("type", e.target.value)}
            id="notifications-type-filter"
            className="appearance-none pr-9 pl-8 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer"
            style={selectStyle}
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronLeft size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
        </div>

        {/* Send Broadcast Button */}
        <button
          id="send-notification-btn"
          onClick={() => setShowSendModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 hover:-translate-y-0.5 mr-auto"
          style={{
            background: "linear-gradient(135deg, #3B82F6, #6366F1)",
            color: "white",
            boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
            border: "1px solid rgba(59,130,246,0.3)",
          }}
        >
          <Send size={14} />
          إرسال إشعار جماعي
        </button>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => currentPage > 1 && updateParams("page", String(currentPage - 1))}
              disabled={currentPage <= 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ ...selectStyle, cursor: currentPage <= 1 ? "not-allowed" : "pointer", color: currentPage <= 1 ? "var(--text-disabled)" : "var(--text-secondary)" }}
            >
              <ChevronRight size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => updateParams("page", String(p))}
                className="w-9 h-9 rounded-xl text-[13px] font-bold"
                style={
                  p === currentPage
                    ? { background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "white", boxShadow: "0 4px 12px rgba(59,130,246,0.3)", border: "1px solid rgba(59,130,246,0.3)" }
                    : { ...selectStyle, color: "var(--text-secondary)" }
                }
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => currentPage < totalPages && updateParams("page", String(currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ ...selectStyle, cursor: currentPage >= totalPages ? "not-allowed" : "pointer", color: currentPage >= totalPages ? "var(--text-disabled)" : "var(--text-secondary)" }}
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))",
              border: "1px solid rgba(59,130,246,0.2)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
            }}
          >
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: "linear-gradient(to left, transparent, #3B82F6, transparent)" }} />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[16px] font-black text-text-primary">إرسال إشعار جماعي</h3>
                  <p className="text-text-tertiary text-[12px] mt-0.5">سيُرسَل لجميع المستخدمين النشطين</p>
                </div>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
                  style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Type */}
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">نوع الإشعار</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                    style={selectStyle}
                  >
                    <option value="general">عام</option>
                    <option value="promo">عرض / خصم</option>
                    <option value="system">نظام</option>
                    <option value="trip">رحلة</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">عنوان الإشعار</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="اكتب العنوان..."
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none transition-all"
                    style={selectStyle}
                    maxLength={100}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">نص الرسالة</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="اكتب نص الإشعار..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none transition-all"
                    style={selectStyle}
                    maxLength={500}
                  />
                  <div className="text-[10px] text-text-disabled text-left mt-1">{form.message.length}/500</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 py-3 rounded-xl text-[13px] font-bold text-text-secondary transition-all hover:text-text-primary"
                  style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSend}
                  disabled={!form.title || !form.message || sending}
                  id="confirm-send-notification"
                  className="flex-1 py-3 rounded-xl text-[13px] font-black text-white flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: sendSuccess
                      ? "linear-gradient(135deg, #10B981, #059669)"
                      : "linear-gradient(135deg, #3B82F6, #6366F1)",
                    opacity: (!form.title || !form.message || sending) ? 0.6 : 1,
                    boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
                  }}
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      جاري الإرسال...
                    </>
                  ) : sendSuccess ? (
                    "✓ تم الإرسال!"
                  ) : (
                    <>
                      <Send size={14} />
                      إرسال للجميع
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
