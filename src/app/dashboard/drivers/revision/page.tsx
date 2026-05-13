"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Check, Send } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";


function DriverRevisionForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const driverId = searchParams.get("driver_id");
  const driverName = searchParams.get("name");

  const [fields, setFields] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const fieldOptions = [
    { key: "national_id_image_url", label: "صورة الهوية الوطنية" },
    { key: "license_image_url", label: "صورة رخصة القيادة" },
    { key: "criminal_record_url", label: "صحيفة الحالة الجنائية" },
    { key: "vehicle_image_url", label: "صورة المركبة" },
    { key: "vehicle_plate", label: "رقم اللوحة" },
    { key: "national_id", label: "الرقم القومي" },
    { key: "license_number", label: "رقم الرخصة" },
  ];

  const toggleField = (key: string) => {
    setFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId || fields.length === 0 || !message.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/drivers/request-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: driverId, fields, message }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => router.push("/dashboard/drivers"), 1200);
      } else {
        const data = await res.json().catch(() => ({}));
        alert("حدث خطأ: " + (data.error || "فشل إرسال الطلب"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      
      <Link
        href="/dashboard/drivers"
        className="inline-flex items-center gap-2 text-text-tertiary hover:text-text-primary text-[13px] transition-colors"
      >
        <ArrowRight size={14} />
        العودة للسائقين
      </Link>

      
      <div>
        <h1 className="page-title">طلب مراجعة</h1>
        <p className="page-subtitle">
          طلب مراجعة الوثائق للسائق: <span className="text-text-primary font-bold">{driverName || "—"}</span>
        </p>
      </div>

      {!driverId ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--divider)" }}>
          <p className="text-text-tertiary">لم يتم تحديد سائق. يرجى الاختيار من قائمة السائقين.</p>
        </div>
      ) : (
        
        <form
          onSubmit={handleSubmit}
          className="dash-card overflow-hidden"
          style={{ border: "1px solid var(--accent-border)" }}
        >
          <div className="dash-section-header">
            <div
              className="w-[3px] h-5 rounded-full"
              style={{
                background: "linear-gradient(to bottom, var(--primary-light), var(--primary))",
                boxShadow: "0 0 8px var(--primary-surface)",
              }}
            />
            <h3 className="text-[13px] font-bold text-text-primary">بيانات الطلب</h3>
          </div>

          <div className="p-6 space-y-5">
            
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-3">
                الحقول المطلوبة
              </label>
              <div className="flex flex-wrap gap-2">
                {fieldOptions.map((opt) => {
                  const active = fields.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => toggleField(opt.key)}
                      className="px-3 py-2 rounded-xl text-[12px] font-bold transition-all"
                      style={{
                        background: active ? "var(--accent-surface)" : "var(--surface-glass)",
                        border: active ? "1px solid var(--accent-border)" : "1px solid var(--divider)",
                        color: active ? "var(--primary)" : "var(--text-secondary)",
                        boxShadow: active ? `0 0 12px var(--accent-shadow)` : "none",
                      }}
                    >
                      {active && <Check size={10} className="inline ml-1" />}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                رسالة للسائق
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="اكتب تفاصيل طلب المراجعة..."
                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none transition-all leading-relaxed"
                style={{
                  background: "var(--surface-glass)",
                  border: "1px solid var(--divider)",
                  color: "var(--text-primary)",
                }}
              />
              <div className="text-[10px] text-text-disabled mt-1 text-left">
                {message.length} حرف
              </div>
            </div>

            
            <button
              type="submit"
              disabled={loading || fields.length === 0 || !message.trim()}
              className="w-full py-3.5 rounded-xl text-[14px] font-black text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                background: saved
                  ? "linear-gradient(135deg, var(--success), var(--success-light))"
                  : "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                boxShadow: `0 6px 20px var(--accent-shadow)`,
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جاري الإرسال...
                </>
              ) : saved ? (
                <>
                  <Check size={15} />تم الإرسال بنجاح!
                </>
              ) : (
                <>
                  <Send size={15} />
                  إرسال طلب المراجعة
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


function Loading() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--divider)" }}>
        <p className="text-text-tertiary">جاري التحميل...</p>
      </div>
    </div>
  );
}


export default function DriverRevisionPage() {
  return (
    <DashboardShell>
      <Suspense fallback={<Loading />}>
        <DriverRevisionForm />
      </Suspense>
    </DashboardShell>
  );
}
