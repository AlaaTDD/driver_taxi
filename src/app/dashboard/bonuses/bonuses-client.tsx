"use client";

import { useState, useEffect } from "react";
import { Plus, X, Pencil, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { createBonusRule, toggleBonusRule, updateBonusRule, deleteBonusRule } from "./actions";
import { useRouter } from "next/navigation";

type RuleData = {
  id: string;
  name: string;
  name_ar: string;
  trigger_type: string;
  threshold: number;
  bonus_amount: number;
  vehicle_types: string[] | null;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
};

function toFormDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function BonusesClient() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<RuleData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RuleData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Listen for edit/delete events fired by RuleActions in the server-rendered
  // table rows. Using a CustomEvent bus keeps the modal + router state in a
  // single place (this component instance).
  useEffect(() => {
    const onEdit = (e: Event) => {
      setEditTarget((e as CustomEvent<RuleData>).detail);
      setIsModalOpen(true);
    };
    const onDelete = (e: Event) => {
      setDeleteTarget((e as CustomEvent<RuleData>).detail);
    };
    window.addEventListener("bonuses:edit", onEdit as EventListener);
    window.addEventListener("bonuses:delete", onDelete as EventListener);
    return () => {
      window.removeEventListener("bonuses:edit", onEdit as EventListener);
      window.removeEventListener("bonuses:delete", onDelete as EventListener);
    };
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      let res;
      if (editTarget) {
        res = await updateBonusRule(editTarget.id, formData);
      } else {
        res = await createBonusRule(formData);
      }
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(editTarget ? "تم تحديث القاعدة بنجاح" : "تم إضافة القاعدة بنجاح");
        setIsModalOpen(false);
        setEditTarget(null);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteBonusRule(deleteTarget.id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("تم حذف القاعدة بنجاح");
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={openCreate}
        className="px-4 py-2 rounded-xl text-[12px] font-bold text-white flex items-center gap-2 transition-opacity hover:opacity-80"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", boxShadow: "0 4px 12px var(--primary-surface)" }}
      >
        <Plus size={14} /> إضافة قاعدة مكافآت
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-surface-elevated p-6 shadow-2xl border border-divider max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-text-primary">
                {editTarget ? "تعديل قاعدة المكافآت" : "إضافة قاعدة مكافآت جديدة"}
              </h2>
              <button
                onClick={() => { setIsModalOpen(false); setEditTarget(null); }}
                className="text-text-tertiary hover:text-primary"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">الاسم (إنجليزي)</label>
                  <input
                    name="name" required
                    defaultValue={editTarget?.name || ""}
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none"
                    placeholder="e.g. 10 Daily Trips"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">الاسم (عربي)</label>
                  <input
                    name="name_ar" required
                    defaultValue={editTarget?.name_ar || ""}
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none"
                    placeholder="مثال: 10 رحلات يومية"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">نوع المحفز</label>
                  <select
                    name="trigger_type"
                    defaultValue={editTarget?.trigger_type || "daily_trips"}
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none text-text-primary"
                  >
                    <option value="daily_trips">رحلات يومية (Daily Trips)</option>
                    <option value="weekly_trips">رحلات أسبوعية (Weekly Trips)</option>
                    <option value="rating_threshold">التقييم (Rating)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">الحد المطلوب (الهدف)</label>
                  <input
                    type="number" step="0.01" name="threshold" required
                    defaultValue={editTarget?.threshold ?? ""}
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none"
                    placeholder="مثال: 10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">مبلغ المكافأة</label>
                  <input
                    type="number" step="0.01" name="bonus_amount" required
                    defaultValue={editTarget?.bonus_amount ?? ""}
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none"
                    placeholder="مثال: 50.00"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">أنواع المركبات</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["car", "motorcycle", "truck"].map((vt) => (
                      <label key={vt} className="flex items-center gap-1 text-[12px] text-text-secondary">
                        <input
                          type="checkbox" name="vehicle_types" value={vt}
                          defaultChecked={editTarget?.vehicle_types?.includes(vt) ?? vt === "car"}
                          className="rounded border-divider text-primary focus:ring-primary"
                        />
                        {vt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">تاريخ البدء (اختياري)</label>
                  <input
                    type="date" name="starts_at"
                    defaultValue={editTarget ? toFormDate(editTarget.starts_at) : ""}
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">تاريخ الانتهاء (اختياري)</label>
                  <input
                    type="date" name="expires_at"
                    defaultValue={editTarget ? toFormDate(editTarget.expires_at) : ""}
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none text-text-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox" name="is_active" id="is_active" value="true"
                  defaultChecked={editTarget?.is_active ?? true}
                  className="w-4 h-4 rounded border-divider text-primary focus:ring-primary"
                />
                <label htmlFor="is_active" className="text-[12px] font-bold text-text-primary">تفعيل القاعدة فوراً</label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditTarget(null); }}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-text-secondary hover:bg-surface border border-divider transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit" disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? "جاري الحفظ..." : (<><Save size={14} /> {editTarget ? "حفظ التعديلات" : "حفظ القاعدة"}</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-elevated p-6 shadow-2xl border border-error/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-error/10 border border-error/20">
                <Trash2 size={18} className="text-error" />
              </div>
              <h2 className="text-lg font-black text-text-primary">تأكيد الحذف</h2>
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
              هل أنت متأكد من حذف قاعدة المكافآت
              <span className="font-bold text-text-primary"> &quot;{deleteTarget.name_ar || deleteTarget.name}&quot; </span>؟
              لا يمكن التراجع عن هذا الإجراء، وسيتم حذف القاعدة نهائياً.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-text-secondary hover:bg-surface border border-divider transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete} disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-error hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? "جاري الحذف..." : (<><Trash2 size={14} /> حذف نهائي</>)}
              </button>
            </div>
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
    try {
      await toggleBonusRule(id, !is_active);
      toast.success(is_active ? "تم تعطيل القاعدة" : "تم تفعيل القاعدة");
    } catch {
      toast.error("حدث خطأ أثناء التحديث");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1 rounded-lg text-[10px] font-bold flex justify-center items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50 ${is_active ? "bg-error/10 text-error border border-error/20" : "bg-success/10 text-success border border-success/20"}`}
    >
      {is_active ? "تعطيل" : "تفعيل"}
    </button>
  );
}

/**
 * Edit + Delete action buttons rendered per rule row in the bonuses table.
 * Fires CustomEvents picked up by the BonusesClient instance, which owns the
 * modal and router state.
 */
export function RuleActions({ rule }: { rule: RuleData }) {
  const triggerEdit = () => {
    window.dispatchEvent(new CustomEvent("bonuses:edit", { detail: rule }));
  };
  const triggerDelete = () => {
    window.dispatchEvent(new CustomEvent("bonuses:delete", { detail: rule }));
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={triggerEdit}
        title="تعديل"
        className="p-1.5 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
      >
        <Pencil size={13} />
      </button>
      <button
        type="button"
        onClick={triggerDelete}
        title="حذف"
        className="p-1.5 rounded-lg text-text-tertiary hover:text-error hover:bg-error/10 transition-colors border border-transparent hover:border-error/20"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

