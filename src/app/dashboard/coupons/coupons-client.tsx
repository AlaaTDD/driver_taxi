"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createCoupon } from "./actions";

export default function CouponsClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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

      if (result.error) {
        alert("حدث خطأ: " + result.error);
        return;
      }

      setIsOpen(false);
      setForm({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        min_trip_price: "",
        max_uses: "",
        expires_at: "",
      });
    } catch {
      alert("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-l from-primary to-primary-dark text-white rounded-xl text-[13px] font-medium transition-all hover:shadow-lg hover:shadow-primary/25"
      >
        <Plus size={16} />
        إضافة كوبون
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-surface/95 backdrop-blur-xl rounded-2xl border border-divider/60 w-full max-w-md p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">إضافة كوبون جديد</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1.5">كود الكوبون</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-divider bg-surface-elevated text-text-primary placeholder:text-text-disabled focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none text-[13px] transition-all uppercase"
                  placeholder="SAVE20"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1.5">نوع الخصم</label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-divider bg-surface-elevated text-text-primary focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none text-[13px] transition-all"
                >
                  <option value="percentage">نسبة مئوية</option>
                  <option value="fixed">مبلغ ثابت</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1.5">قيمة الخصم</label>
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-xl border border-divider bg-surface-elevated text-text-primary placeholder:text-text-disabled focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none text-[13px] transition-all"
                  placeholder="20"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
                  حد أدنى لسعر الرحلة (اختياري)
                </label>
                <input
                  type="number"
                  value={form.min_trip_price}
                  onChange={(e) => setForm({ ...form, min_trip_price: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-xl border border-divider bg-surface-elevated text-text-primary placeholder:text-text-disabled focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none text-[13px] transition-all"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
                  أقصى عدد استخدامات (اختياري)
                </label>
                <input
                  type="number"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  min="1"
                  className="w-full px-4 py-2.5 rounded-xl border border-divider bg-surface-elevated text-text-primary placeholder:text-text-disabled focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none text-[13px] transition-all"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
                  تاريخ الانتهاء (اختياري)
                </label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-divider bg-surface-elevated text-text-primary focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none text-[13px] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-linear-to-l from-primary to-primary-dark text-white rounded-xl font-bold text-[14px] transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? "جاري الإضافة..." : "إضافة الكوبون"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
