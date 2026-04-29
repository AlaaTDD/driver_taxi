"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, X, Trash2, Power, PowerOff, Car, Bike, Truck, Zap, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface VehicleType {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  base_fare: number;
  price_per_km: number;
  is_active: boolean;
  sort_order: number;
}

interface PricingClientProps {
  configs: VehicleType[];
}

const ICON_OPTIONS = [
  { value: "directions_car", label: "سيارة", icon: Car },
  { value: "two_wheeler", label: "موتوسيكل", icon: Bike },
  { value: "local_shipping", label: "شاحنة", icon: Truck },
  { value: "electric_car", label: "كهربائي", icon: Zap },
  { value: "star", label: "مميز", icon: Star },
];

const COLORS = [
  { name: "أزرق", value: "#3B82F6" },
  { name: "أخضر", value: "#10B981" },
  { name: "أحمر", value: "#EF4444" },
  { name: "أصفر", value: "#F59E0B" },
  { name: "بنفسجي", value: "#8B5CF6" },
  { name: "وردي", value: "#EC4899" },
  { name: "سماوي", value: "#06B6D4" },
  { name: "برتقالي", value: "#F97316" },
];

export default function PricingClient({ configs }: PricingClientProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);

  const [form, setForm] = useState({
    name: "",
    display_name: "",
    icon: "directions_car",
    base_fare: "",
    price_per_km: "",
    sort_order: "0",
  });

  const activeCount = configs.filter((c) => c.is_active).length;
  const inactiveCount = configs.filter((c) => !c.is_active).length;

  const resetForm = () => {
    setForm({
      name: "",
      display_name: "",
      icon: "directions_car",
      base_fare: "",
      price_per_km: "",
      sort_order: String(configs.length),
    });
    setEditingId(null);
    setSelectedColor(COLORS[0].value);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (config: VehicleType) => {
    setForm({
      name: config.name,
      display_name: config.display_name,
      icon: config.icon,
      base_fare: String(config.base_fare),
      price_per_km: String(config.price_per_km),
      sort_order: String(config.sort_order),
    });
    setEditingId(config.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.display_name || !form.base_fare || !form.price_per_km) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("display_name", form.display_name);
      fd.append("icon", form.icon);
      fd.append("base_fare", form.base_fare);
      fd.append("price_per_km", form.price_per_km);
      fd.append("sort_order", form.sort_order);
      fd.append("color", selectedColor);
      if (editingId) fd.append("id", editingId);

      const action = editingId ? "update" : "create";
      const res = await fetch(`/api/vehicle-types/${action}`, {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "فشل الحفظ");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("id", id);
      fd.append("is_active", String(!current));

      const res = await fetch("/api/vehicle-types/toggle", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("فشل التبديل");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteType = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا النوع؟")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/vehicle-types/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("فشل الحذف - قد يكون النوع مستخدماً في رحلات");
      }
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const found = ICON_OPTIONS.find((i) => i.value === iconName);
    return found ? found.icon : Car;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">إدارة</span>
            <span className="w-1 h-1 rounded-full bg-green-500/60" />
            <span className="text-[11px] text-text-disabled">أنواع المركبات</span>
          </div>
          <h1 className="page-title">أنواع المركبات والتسعير</h1>
          <p className="page-subtitle">إضافة وتعديل أنواع المركبات وأسعارها</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="px-2 py-1 rounded-lg bg-success/10 text-success">{activeCount} نشط</span>
            {inactiveCount > 0 && (
              <span className="px-2 py-1 rounded-lg bg-text-disabled/10 text-text-disabled">{inactiveCount} معطل</span>
            )}
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #10B981, #059669)",
              boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
            }}
          >
            <Plus size={16} />
            إضافة نوع جديد
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((config) => {
          const IconComponent = getIconComponent(config.icon);
          const isActive = config.is_active;

          return (
            <div
              key={config.id}
              className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                !isActive ? "opacity-60" : ""
              }`}
              style={{
                background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
                border: `1px solid ${isActive ? "rgba(255,255,255,0.08)" : "var(--divider)"}`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
              }}
            >
              {/* Status Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: isActive
                    ? "linear-gradient(to left, transparent, #10B981, transparent)"
                    : "linear-gradient(to left, transparent, var(--text-disabled), transparent)",
                  opacity: 0.6,
                }}
              />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: isActive ? "rgba(16,185,129,0.15)" : "rgba(15,30,53,0.6)",
                        border: `1px solid ${isActive ? "rgba(16,185,129,0.3)" : "var(--divider)"}`,
                      }}
                    >
                      <IconComponent
                        size={22}
                        style={{ color: isActive ? "#10B981" : "var(--text-disabled)" }}
                      />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-bold text-text-primary">{config.display_name}</h3>
                      <p className="text-[12px] text-text-tertiary">{config.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(config)}
                      className="p-2 rounded-lg hover:bg-surface-elevated text-text-tertiary hover:text-text-primary transition-colors"
                      title="تعديل"
                    >
                      <Save size={14} />
                    </button>
                    <button
                      onClick={() => toggleActive(config.id, config.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        isActive
                          ? "hover:bg-success/10 text-success"
                          : "hover:bg-text-disabled/10 text-text-disabled"
                      }`}
                      title={isActive ? "تعطيل" : "تفعيل"}
                    >
                      {isActive ? <Power size={14} /> : <PowerOff size={14} />}
                    </button>
                    <button
                      onClick={() => deleteType(config.id)}
                      className="p-2 rounded-lg hover:bg-error/10 text-text-tertiary hover:text-error transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Pricing Info */}
                <div className="space-y-2">
                  <div
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: "rgba(15,30,53,0.5)" }}
                  >
                    <span className="text-[12px] text-text-secondary">الأجرة الأساسية</span>
                    <span className="text-[14px] font-bold text-success">
                      {formatCurrency(Number(config.base_fare))}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: "rgba(15,30,53,0.5)" }}
                  >
                    <span className="text-[12px] text-text-secondary">السعر/كم</span>
                    <span className="text-[14px] font-bold text-success">
                      {formatCurrency(Number(config.price_per_km))}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className="px-2 py-1 rounded-lg text-[10px] font-bold"
                    style={{
                      background: isActive ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)",
                      color: isActive ? "#10B981" : "var(--text-disabled)",
                    }}
                  >
                    {isActive ? "✓ نشط" : "✗ معطل"}
                  </span>
                  <span className="text-[10px] text-text-disabled">ترتيب: {config.sort_order}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {configs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(15,30,53,0.8)", border: "1px solid var(--divider)" }}
          >
            <Car size={28} className="text-text-disabled opacity-40" />
          </div>
          <p className="text-text-secondary font-semibold">لا توجد أنواع مركبات</p>
          <p className="text-text-tertiary text-sm">اضغط &quot;إضافة نوع جديد&quot; لإنشاء أول نوع</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))",
              border: "1px solid rgba(16,185,129,0.2)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--divider)" }}
            >
              <div>
                <h3 className="text-[16px] font-black text-text-primary">
                  {editingId ? "تعديل نوع المركبة" : "إضافة نوع مركبة جديد"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-surface-elevated text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name (internal) */}
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                  الاسم التقني (بالإنجليزية)
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s/g, "_") })}
                  placeholder="مثال: luxury_car"
                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                  style={{
                    background: "rgba(15,30,53,0.6)",
                    border: "1px solid var(--divider)",
                    color: "var(--text-primary)",
                  }}
                  required
                  disabled={!!editingId}
                  dir="ltr"
                />
                <p className="text-[10px] text-text-disabled mt-1">يُستخدم في الكود، لا مسافات</p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                  الاسم المعروض (بالعربية)
                </label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  placeholder="مثال: سيارة فاخرة"
                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                  style={{
                    background: "rgba(15,30,53,0.6)",
                    border: "1px solid var(--divider)",
                    color: "var(--text-primary)",
                  }}
                  required
                />
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                  الأيقونة
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((iconOpt) => {
                    const Icon = iconOpt.icon;
                    const isSelected = form.icon === iconOpt.value;
                    return (
                      <button
                        key={iconOpt.value}
                        type="button"
                        onClick={() => setForm({ ...form, icon: iconOpt.value })}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
                        style={{
                          background: isSelected ? "rgba(16,185,129,0.15)" : "rgba(15,30,53,0.6)",
                          border: isSelected ? "1px solid rgba(16,185,129,0.4)" : "1px solid var(--divider)",
                          color: isSelected ? "#10B981" : "var(--text-secondary)",
                          minWidth: "60px",
                        }}
                      >
                        <Icon size={18} />
                        <span className="text-[10px]">{iconOpt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                  اللون
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                      style={{
                        background: selectedColor === color.value ? "rgba(15,30,53,0.8)" : "rgba(15,30,53,0.6)",
                        border: `1px solid ${selectedColor === color.value ? color.value : "var(--divider)"}`,
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ background: color.value }}
                      />
                      <span className="text-[11px] text-text-secondary">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                    الأجرة الأساسية
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.base_fare}
                    onChange={(e) => setForm({ ...form, base_fare: e.target.value })}
                    placeholder="15.00"
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                    style={{
                      background: "rgba(15,30,53,0.6)",
                      border: "1px solid var(--divider)",
                      color: "var(--text-primary)",
                    }}
                    required
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                    السعر لكل كم
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price_per_km}
                    onChange={(e) => setForm({ ...form, price_per_km: e.target.value })}
                    placeholder="5.00"
                    className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                    style={{
                      background: "rgba(15,30,53,0.6)",
                      border: "1px solid var(--divider)",
                      color: "var(--text-primary)",
                    }}
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                  الترتيب
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                  style={{
                    background: "rgba(15,30,53,0.6)",
                    border: "1px solid var(--divider)",
                    color: "var(--text-primary)",
                  }}
                  dir="ltr"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl text-[13px] font-bold text-text-secondary transition-all hover:text-text-primary"
                  style={{ background: "rgba(15,30,53,0.8)", border: "1px solid var(--divider)" }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-[13px] font-black text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #10B981, #059669)",
                    boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
                  }}
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingId ? "حفظ التعديلات" : "إضافة النوع"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
