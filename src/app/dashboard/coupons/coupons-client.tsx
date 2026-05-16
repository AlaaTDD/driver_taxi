"use client";

import { useState } from "react";
import { Plus, X, Tag, Check, Edit3 } from "lucide-react";
import { createCoupon, updateCoupon } from "./actions";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type CouponData = {
  id?: string;
  code: string;
  title: string;
  discount_type: string;
  discount_value: string;
  max_discount: string;
  min_trip_price: string;
  max_uses: string;
  max_uses_per_user: string;
  expires_at: string;
  starts_at: string;
  budget_limit: string;
  funded_by: string;
  first_ride_only: boolean;
  new_users_only: boolean;
  auto_apply: boolean;
  description_ar: string;
  description_en: string;
};

const EMPTY_FORM: CouponData = {
  code: "",
  title: "",
  discount_type: "percentage",
  discount_value: "",
  max_discount: "",
  min_trip_price: "",
  max_uses: "",
  max_uses_per_user: "",
  expires_at: "",
  starts_at: "",
  budget_limit: "",
  funded_by: "platform",
  first_ride_only: false,
  new_users_only: false,
  auto_apply: false,
  description_ar: "",
  description_en: "",
};

export default function CouponsClient({ editData }: { editData?: CouponData & { id: string } }) {
  const router = useRouter();
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<CouponData>(EMPTY_FORM);

  const isEdit = !!editData;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setIsOpen(true);
  };

  const openEdit = (data: CouponData & { id: string }) => {
    setForm(data);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("code", form.code.toUpperCase());
      formData.set("discount_type", form.discount_type);
      formData.set("discount_value", form.discount_value);
      formData.set("funded_by", form.funded_by || "platform");
      formData.set("first_ride_only", form.first_ride_only ? "true" : "false");
      formData.set("new_users_only", form.new_users_only ? "true" : "false");
      formData.set("auto_apply", form.auto_apply ? "true" : "false");

      if (form.title) formData.set("title", form.title);
      if (form.min_trip_price) formData.set("min_trip_price", form.min_trip_price);
      if (form.max_uses) formData.set("max_uses", form.max_uses);
      if (form.max_uses_per_user) formData.set("max_uses_per_user", form.max_uses_per_user);
      if (form.max_discount) formData.set("max_discount", form.max_discount);
      if (form.budget_limit) formData.set("budget_limit", form.budget_limit);
      if (form.expires_at) formData.set("expires_at", form.expires_at);
      if (form.starts_at) formData.set("starts_at", form.starts_at);
      if (form.description_ar) formData.set("description_ar", form.description_ar);
      if (form.description_en) formData.set("description_en", form.description_en);

      let result;
      if (form.id) {
        result = await updateCoupon(form.id, formData);
      } else {
        result = await createCoupon(formData);
      }

      if (result.error) {
        alert(`${t("common.error")}: ${result.error}`);
        return;
      }

      setSaved(true);
      setTimeout(() => {
        setIsOpen(false);
        setSaved(false);
        setForm(EMPTY_FORM);
        router.refresh();
      }, 1000);
    } catch {
      alert(t("common.unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );

  return (
    <>
      {/* Trigger Button */}
      <button
        id="add-coupon-btn"
        onClick={openCreate}
        className="btn btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200"
      >
        <Plus size={15} />
        {t("coupons.newCoupon")}
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "var(--overlay)", backdropFilter: "blur(8px)" }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden bg-surface shadow-xl border border-divider flex flex-col">
            {/* Backdrop close */}
            <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)} />

            {/* Header */}
            <div className="p-6 pb-4 border-b border-divider flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary-surface border border-primary-surface-strong">
                    {form.id ? <Edit3 size={16} className="text-primary" /> : <Tag size={16} className="text-primary" />}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-text-primary">
                      {form.id ? t("coupons.editCoupon") : t("coupons.newCoupon")}
                    </h3>
                    <p className="text-text-tertiary text-[11px] mt-0.5">
                      {form.id ? t("coupons.editDiscount") : t("coupons.addDiscount")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
                  style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto flex-1 p-6">
              <form onSubmit={handleSubmit} className="space-y-5" id="create-coupon-form">

                {/* ── Section: Basic Info ── */}
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.15em]">
                    المعلومات الأساسية
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{t("coupons.fields.code")}</Label>
                      <input
                        type="text"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                        required
                        placeholder="SAVE20"
                        maxLength={30}
                        className="input-field w-full px-4 py-3 rounded-xl text-[14px] font-bold transition-all uppercase mono"
                      />
                    </div>
                    <div>
                      <Label>{t("coupons.fields.title")}</Label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="خصم الصيف"
                        className="input-field w-full px-4 py-3 rounded-xl text-[13px] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section: Discount Config ── */}
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.15em]">
                    إعدادات الخصم
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>{t("coupons.fields.discountType")}</Label>
                      <select
                        value={form.discount_type}
                        onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                        className="input-field w-full px-3 py-3 rounded-xl text-[13px] cursor-pointer"
                      >
                        <option value="percentage">{t("coupons.types.percentage")}</option>
                        <option value="fixed">{t("coupons.types.fixed")}</option>
                      </select>
                    </div>
                    <div>
                      <Label>
                        {t("coupons.fields.discountValue")} {form.discount_type === "percentage" ? "(%)" : "(ج.م)"}
                      </Label>
                      <input
                        type="number"
                        value={form.discount_value}
                        onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                        required min="0" step="0.01"
                        placeholder={form.discount_type === "percentage" ? "20" : "10"}
                        className="input-field w-full px-3 py-3 rounded-xl text-[13px] num font-bold"
                      />
                    </div>
                    <div>
                      <Label>{t("coupons.fields.maxDiscount")} (ج.م)</Label>
                      <input
                        type="number"
                        value={form.max_discount}
                        onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                        min="0" step="0.01"
                        placeholder={`50 (${t("common.optional")})`}
                        className="input-field w-full px-3 py-3 rounded-xl text-[13px] num"
                        disabled={form.discount_type === "fixed"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>{t("coupons.fields.minTripPrice")} (ج.م)</Label>
                      <input
                        type="number" value={form.min_trip_price}
                        onChange={(e) => setForm({ ...form, min_trip_price: e.target.value })}
                        min="0" step="0.01" placeholder={`50 (${t("common.optional")})`}
                        className="input-field w-full px-3 py-3 rounded-xl text-[13px] num"
                      />
                    </div>
                    <div>
                      <Label>{t("coupons.fields.maxUses")}</Label>
                      <input
                        type="number" value={form.max_uses}
                        onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                        min="1" placeholder={`∞ (${t("common.optional")})`}
                        className="input-field w-full px-3 py-3 rounded-xl text-[13px] num"
                      />
                    </div>
                    <div>
                      <Label>{t("coupons.fields.maxUsesPerUser")}</Label>
                      <input
                        type="number" value={form.max_uses_per_user}
                        onChange={(e) => setForm({ ...form, max_uses_per_user: e.target.value })}
                        min="1" placeholder={`1 (${t("common.optional")})`}
                        className="input-field w-full px-3 py-3 rounded-xl text-[13px] num"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section: Schedule & Budget ── */}
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.15em]">
                    الجدول الزمني والميزانية
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{t("coupons.fields.startsAt")} ({t("common.optional")})</Label>
                      <input
                        type="datetime-local"
                        value={form.starts_at}
                        onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                        className="input-field w-full px-4 py-3 rounded-xl text-[13px] transition-all"
                      />
                    </div>
                    <div>
                      <Label>{t("coupons.fields.expiresAt")} ({t("common.optional")})</Label>
                      <input
                        type="datetime-local"
                        value={form.expires_at}
                        onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                        className="input-field w-full px-4 py-3 rounded-xl text-[13px] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{t("coupons.fields.budgetLimit")} (ج.م) ({t("common.optional")})</Label>
                      <input
                        type="number" value={form.budget_limit}
                        onChange={(e) => setForm({ ...form, budget_limit: e.target.value })}
                        min="1" step="0.01" placeholder="5000"
                        className="input-field w-full px-3 py-3 rounded-xl text-[13px] num"
                      />
                    </div>
                    <div>
                      <Label>{t("coupons.fields.fundedBy")}</Label>
                      <select
                        value={form.funded_by}
                        onChange={(e) => setForm({ ...form, funded_by: e.target.value })}
                        className="input-field w-full px-3 py-3 rounded-xl text-[13px] cursor-pointer"
                      >
                        <option value="platform">{t("coupons.fundedByOptions.platform")}</option>
                        <option value="driver">{t("coupons.fundedByOptions.driver")}</option>
                        <option value="shared">{t("coupons.fundedByOptions.shared")}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ── Section: Rules & Flags ── */}
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.15em]">
                    القواعد والشروط
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {/* Toggle switches */}
                    {[
                      { key: "first_ride_only", label: t("coupons.fields.firstRideOnly") },
                      { key: "new_users_only", label: t("coupons.fields.newUsersOnly") },
                      { key: "auto_apply", label: t("coupons.fields.autoApply") },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer transition-all text-[13px] font-semibold"
                        style={{
                          background: (form as Record<string, unknown>)[item.key]
                            ? "var(--accent-surface)"
                            : "var(--surface-glass)",
                          border: `1px solid ${(form as Record<string, unknown>)[item.key] ? "var(--accent-border)" : "var(--divider)"}`,
                          color: (form as Record<string, unknown>)[item.key] ? "var(--primary)" : "var(--text-secondary)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!(form as Record<string, unknown>)[item.key]}
                          onChange={(e) =>
                            setForm({ ...form, [item.key]: e.target.checked })
                          }
                          className="sr-only"
                        />
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center transition-all"
                          style={{
                            background: (form as Record<string, unknown>)[item.key]
                              ? "var(--primary)"
                              : "var(--surface-elevated)",
                            border: (form as Record<string, unknown>)[item.key]
                              ? "none"
                              : "1px solid var(--divider-strong)",
                          }}
                        >
                          {Boolean((form as Record<string, unknown>)[item.key]) && (
                            <Check size={10} className="text-white" />
                          )}
                        </div>
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ── Section: Descriptions ── */}
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.15em]">
                    الوصف
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{t("coupons.fields.descriptionAr")}</Label>
                      <input
                        type="text"
                        value={form.description_ar}
                        onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                        placeholder="خصم على رحلتك الأولى"
                        className="input-field w-full px-3 py-3 rounded-xl text-[13px]"
                      />
                    </div>
                    <div>
                      <Label>{t("coupons.fields.descriptionEn")}</Label>
                      <input
                        type="text"
                        value={form.description_en}
                        onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                        placeholder="Discount on your first ride"
                        className="input-field w-full px-3 py-3 rounded-xl text-[13px]"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-3 rounded-xl text-[13px] font-bold text-text-secondary transition-all hover:text-text-primary"
                    style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    id="submit-coupon"
                    className={`flex-1 py-3 rounded-xl text-[13px] font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${saved ? "btn-solid border-success shadow-success/20 text-success" : "btn btn-primary"}`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t("common.saving")}
                      </>
                    ) : saved ? (
                      <>
                        <Check size={14} />✓ {t("common.saved")}
                      </>
                    ) : (
                      <>
                        <Tag size={14} />
                        {form.id ? t("common.save") : t("coupons.addCoupon")}
                      </>
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

// Export openEdit as a ref-based approach
export { type CouponData };
