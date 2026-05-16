"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createBonusRule, toggleBonusRule } from "./actions";

export default function BonusesClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createBonusRule(formData);
    setLoading(false);
    if (res.error) {
      alert(res.error);
    } else {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 rounded-xl text-[12px] font-bold text-white flex items-center gap-2 transition-opacity hover:opacity-80"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", boxShadow: "0 4px 12px var(--primary-surface)" }}
      >
        <Plus size={14} /> إضافة قاعدة مكافآت
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-surface-elevated p-6 shadow-2xl border border-divider max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-text-primary">إضافة قاعدة مكافآت جديدة</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-tertiary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">الاسم (إنجليزي)</label>
                  <input name="name" required className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none" placeholder="e.g. 10 Daily Trips" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">الاسم (عربي)</label>
                  <input name="name_ar" required className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none" placeholder="مثال: 10 رحلات يومية" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">نوع المحفز</label>
                  <select name="trigger_type" className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none text-text-primary">
                    <option value="daily_trips">رحلات يومية (Daily Trips)</option>
                    <option value="weekly_trips">رحلات أسبوعية (Weekly Trips)</option>
                    <option value="rating_threshold">التقييم (Rating)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">الحد المطلوب (الهدف)</label>
                  <input type="number" step="0.01" name="threshold" required className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none" placeholder="مثال: 10" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">مبلغ المكافأة</label>
                  <input type="number" step="0.01" name="bonus_amount" required className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none" placeholder="مثال: 50.00" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">أنواع المركبات</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['car', 'motorcycle', 'truck'].map((vt) => (
                      <label key={vt} className="flex items-center gap-1 text-[12px] text-text-secondary">
                        <input type="checkbox" name="vehicle_types" value={vt} defaultChecked={vt === 'car'} className="rounded border-divider text-primary focus:ring-primary" />
                        {vt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">تاريخ البدء (اختياري)</label>
                  <input type="date" name="starts_at" className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none text-text-primary" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">تاريخ الانتهاء (اختياري)</label>
                  <input type="date" name="expires_at" className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none text-text-primary" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" name="is_active" id="is_active" value="true" defaultChecked className="w-4 h-4 rounded border-divider text-primary focus:ring-primary" />
                <label htmlFor="is_active" className="text-[12px] font-bold text-text-primary">تفعيل القاعدة فوراً</label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-text-secondary hover:bg-surface border border-divider transition-colors">إلغاء</button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50">
                  {loading ? "جاري الحفظ..." : "حفظ القاعدة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function ToggleRuleStatus({ id, is_active }: { id: string; is_active: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    await toggleBonusRule(id, !is_active);
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1 rounded-lg text-[10px] font-bold flex justify-center items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50 ${is_active ? 'bg-error/10 text-error border border-error/20' : 'bg-success/10 text-success border border-success/20'}`}
    >
      {is_active ? 'تعطيل' : 'تفعيل'}
    </button>
  );
}
