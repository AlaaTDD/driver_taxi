"use client";

import { useState } from "react";
import { Pencil, X, Check, DollarSign } from "lucide-react";
import { updatePricing } from "./actions";

interface PricingClientProps {
  config: {
    id: string;
    vehicle_type: string;
    base_fare: number;
    price_per_km: number;
    minimum_fare: number;
  };
}

const inputStyle = {
  background: "rgba(15,30,53,0.7)",
  border: "1px solid var(--divider)",
  color: "var(--text-primary)",
};

export default function PricingClient({ config }: PricingClientProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    base_fare: String(config.base_fare),
    price_per_km: String(config.price_per_km),
    minimum_fare: String(config.minimum_fare),
  });

  const accentColor = config.vehicle_type === "car" ? "#3B82F6" : "#10B981";

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("id", config.id);
      formData.set("base_fare", form.base_fare);
      formData.set("price_per_km", form.price_per_km);
      formData.set("minimum_fare", form.minimum_fare);

      const result = await updatePricing(formData);

      if (result?.error) {
        alert("حدث خطأ: " + result.error);
        return;
      }

      setSaved(true);
      setTimeout(() => {
        setEditing(false);
        setSaved(false);
      }, 1000);
    } catch {
      alert("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        id={`edit-pricing-${config.vehicle_type}`}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
          border: `1px solid ${accentColor}30`,
          color: accentColor,
        }}
      >
        <Pencil size={14} />
        تعديل الأسعار
      </button>
    );
  }

  return (
    <div
      className="mt-2 rounded-xl overflow-hidden"
      style={{
        background: "rgba(15,30,53,0.6)",
        border: `1px solid ${accentColor}25`,
        boxShadow: `0 0 20px ${accentColor}08 inset`,
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${accentColor}15` }}>
        <DollarSign size={13} style={{ color: accentColor }} />
        <span className="text-[12px] font-bold text-text-secondary">تعديل الأسعار</span>
      </div>

      <div className="p-4 space-y-3">
        {[
          { key: "base_fare", label: "الأجرة الأساسية", placeholder: "مثال: 15" },
          { key: "price_per_km", label: "السعر لكل كيلومتر", placeholder: "مثال: 5" },
          { key: "minimum_fare", label: "الحد الأدنى للأجرة", placeholder: "مثال: 20" },
        ].map((field) => (
          <div key={field.key}>
            <label className="block text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">
              {field.label}
            </label>
            <div className="relative">
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold"
                style={{ color: accentColor }}
              >
                ج.م
              </span>
              <input
                type="number"
                value={form[field.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                min="0"
                step="0.5"
                placeholder={field.placeholder}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl text-[13px] font-bold outline-none transition-all num"
                style={inputStyle}
                id={`${config.vehicle_type}-${field.key}`}
              />
            </div>
          </div>
        ))}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={loading}
            id={`save-pricing-${config.vehicle_type}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-black text-white transition-all disabled:opacity-50"
            style={{
              background: saved
                ? "linear-gradient(135deg, #10B981, #059669)"
                : `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
              boxShadow: `0 4px 14px ${accentColor}35`,
            }}
          >
            <Check size={14} />
            {loading ? "جاري الحفظ..." : saved ? "✓ تم الحفظ" : "حفظ"}
          </button>
          <button
            onClick={() => { setEditing(false); setSaved(false); }}
            className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-text-secondary transition-all hover:text-text-primary"
            style={{ background: "rgba(15,30,53,0.8)", border: "1px solid var(--divider)" }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
