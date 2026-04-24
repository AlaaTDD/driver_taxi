"use client";

import { useState } from "react";
import { Plus, X, Tag, Check } from "lucide-react";
import { createCoupon } from "./actions";
import { useRouter } from "next/navigation";

const inputStyle = {
  background: "rgba(15,30,53,0.7)",
  border: "1px solid var(--divider)",
  color: "var(--text-primary)",
};

export default function CouponsClient() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_trip_price: "",
    max_uses: "",
    expires_at: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("code", form.code.toUpperCase());
      formData.set("discount_type", form.discount_type);
      formData.set("discount_value", form.discount_value);
      if (form.min_trip_price) formData.set("min_trip_price", form.min_trip_price);
      if (form.max_uses) formData.set("max_uses", form.max_uses);
      if (form.expires_at) formData.set("expires_at", form.expires_at);

      const result = await createCoupon(formData);
      if (result.error) { alert("حدث خطأ: " + result.error); return; }

      setSaved(true);
      setTimeout(() => {
        setIsOpen(false);
        setSaved(false);
        setForm({ code: "", discount_type: "percentage", discount_value: "", min_trip_price: "", max_uses: "", expires_at: "" });
        router.refresh();
      }, 1000);
    } catch { alert("حدث خطأ غير متوقع"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <button
        id="add-coupon-btn"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(135deg, #F59E0B, #D97706)",
          color: "white",
          boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
          border: "1px solid rgba(245,158,11,0.3)",
        }}
      >
        <Plus size={15} />
        كوبون جديد
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))",
              border: "1px solid rgba(245,158,11,0.2)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: "linear-gradient(to left, transparent, #F59E0B, transparent)" }} />

            {/* Backdrop close */}
            <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)} />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)" }}>
                    <Tag size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-text-primary">كوبون جديد</h3>
                    <p className="text-text-tertiary text-[11px] mt-0.5">أضف كوبون خصم للمستخدمين</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
                  style={{ background: "rgba(15,30,53,0.8)", border: "1px solid var(--divider)" }}
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" id="create-coupon-form">
                {/* Code */}
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">كود الكوبون</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    required
                    placeholder="SAVE20"
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-xl text-[14px] font-bold outline-none transition-all uppercase mono"
                    style={inputStyle}
                  />
                </div>

                {/* Type + Value (2 cols) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">نوع الخصم</label>
                    <select
                      value={form.discount_type}
                      onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                      className="w-full px-3 py-3 rounded-xl text-[13px] outline-none cursor-pointer"
                      style={inputStyle}
                    >
                      <option value="percentage">نسبة %</option>
                      <option value="fixed">مبلغ ثابت</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                      القيمة {form.discount_type === "percentage" ? "(%)" : "(ج.م)"}
                    </label>
                    <input
                      type="number"
                      value={form.discount_value}
                      onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                      required min="0" step="0.01"
                      placeholder={form.discount_type === "percentage" ? "20" : "10"}
                      className="w-full px-3 py-3 rounded-xl text-[13px] num font-bold outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Min price + Max uses (2 cols) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">حد أدنى (ج.م)</label>
                    <input
                      type="number" value={form.min_trip_price}
                      onChange={(e) => setForm({ ...form, min_trip_price: e.target.value })}
                      min="0" step="0.01" placeholder="50 (اختياري)"
                      className="w-full px-3 py-3 rounded-xl text-[13px] outline-none num"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">أقصى استخدام</label>
                    <input
                      type="number" value={form.max_uses}
                      onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                      min="1" placeholder="∞ (اختياري)"
                      className="w-full px-3 py-3 rounded-xl text-[13px] outline-none num"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Expiry */}
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">تاريخ الانتهاء (اختياري)</label>
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none transition-all"
                    style={inputStyle}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-3 rounded-xl text-[13px] font-bold text-text-secondary transition-all hover:text-text-primary"
                    style={{ background: "rgba(15,30,53,0.8)", border: "1px solid var(--divider)" }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    id="submit-coupon"
                    className="flex-1 py-3 rounded-xl text-[13px] font-black text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{
                      background: saved
                        ? "linear-gradient(135deg, #10B981, #059669)"
                        : "linear-gradient(135deg, #F59E0B, #D97706)",
                      boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
                    }}
                  >
                    {loading ? (
                      <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>جاري الإضافة...</>
                    ) : saved ? (
                      <><Check size={14} />✓ تم الإضافة</>
                    ) : (
                      <><Tag size={14} />إضافة الكوبون</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
