"use client";

import { useState } from "react";
import { Pencil, X, Check } from "lucide-react";
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

export default function PricingClient({ config }: PricingClientProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    base_fare: String(config.base_fare),
    price_per_km: String(config.price_per_km),
    minimum_fare: String(config.minimum_fare),
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("id", config.id);
      formData.set("base_fare", form.base_fare);
      formData.set("price_per_km", form.price_per_km);
      formData.set("minimum_fare", form.minimum_fare);

      const result = await updatePricing(formData);

      if (result.error) {
        alert("حدث خطأ: " + result.error);
        return;
      }

      setEditing(false);
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
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-divider/60 rounded-xl text-text-secondary hover:border-primary/40 hover:text-primary transition-colors text-[13px]"
      >
        <Pencil size={14} />
        تعديل الأسعار
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-3 border-t border-divider/40 pt-4">
      <div>
        <label className="block text-[12px] font-medium text-text-secondary mb-1">الأجرة الأساسية</label>
        <input
          type="number"
          value={form.base_fare}
          onChange={(e) => setForm({ ...form, base_fare: e.target.value })}
          min="0"
          step="0.5"
          className="w-full px-3 py-2 rounded-lg border border-divider bg-surface-elevated text-text-primary text-[13px] focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none transition-all"
        />
      </div>
      <div>
        <label className="block text-[12px] font-medium text-text-secondary mb-1">السعر لكل كم</label>
        <input
          type="number"
          value={form.price_per_km}
          onChange={(e) => setForm({ ...form, price_per_km: e.target.value })}
          min="0"
          step="0.5"
          className="w-full px-3 py-2 rounded-lg border border-divider bg-surface-elevated text-text-primary text-[13px] focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none transition-all"
        />
      </div>
      <div>
        <label className="block text-[12px] font-medium text-text-secondary mb-1">الحد الأدنى للأجرة</label>
        <input
          type="number"
          value={form.minimum_fare}
          onChange={(e) => setForm({ ...form, minimum_fare: e.target.value })}
          min="0"
          step="0.5"
          className="w-full px-3 py-2 rounded-lg border border-divider bg-surface-elevated text-text-primary text-[13px] focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none transition-all"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-linear-to-l from-primary to-primary-dark text-white rounded-lg text-[13px] font-medium transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:shadow-none"
        >
          <Check size={14} />
          {loading ? "جاري الحفظ..." : "حفظ"}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-divider/60 rounded-lg text-text-secondary hover:border-primary/40 transition-colors text-[13px]"
        >
          <X size={14} />
          إلغاء
        </button>
      </div>
    </div>
  );
}
