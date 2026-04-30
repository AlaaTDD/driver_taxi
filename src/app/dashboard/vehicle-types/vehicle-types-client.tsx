"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  GripVertical,
  DollarSign,
  Gauge,
} from "lucide-react";
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
  created_at: string;
}

export default function VehicleTypesClient({
  vehicleTypes,
}: {
  vehicleTypes: VehicleType[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    display_name: "",
    icon: "directions_car",
    base_fare: "",
    price_per_km: "",
    sort_order: "0",
  });

  const resetForm = () => {
    setForm({ name: "", display_name: "", icon: "directions_car", base_fare: "", price_per_km: "", sort_order: "0" });
    setShowForm(false);
    setEditId(null);
  };

  const startEdit = (vt: VehicleType) => {
    setForm({
      name: vt.name,
      display_name: vt.display_name,
      icon: vt.icon,
      base_fare: String(vt.base_fare),
      price_per_km: String(vt.price_per_km),
      sort_order: String(vt.sort_order),
    });
    setEditId(vt.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("submit");
    try {
      const url = editId ? "/api/vehicle-types/update" : "/api/vehicle-types/create";
      const body = editId
        ? { id: editId, ...form, base_fare: Number(form.base_fare), price_per_km: Number(form.price_per_km), sort_order: Number(form.sort_order) }
        : { ...form, base_fare: Number(form.base_fare), price_per_km: Number(form.price_per_km), sort_order: Number(form.sort_order) };

      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); alert(d.error || "حدث خطأ"); return; }
      resetForm();
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    setLoading(id);
    try {
      const res = await fetch("/api/vehicle-types/toggle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, is_active: !is_active }) });
      if (!res.ok) { const d = await res.json(); alert(d.error || "حدث خطأ"); }
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    setLoading(id);
    try {
      const res = await fetch("/api/vehicle-types/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) { const d = await res.json(); alert(d.error || "حدث خطأ"); }
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-7">
      {/* ===== PAGE HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">إدارة</span>
            <span className="w-1 h-1 rounded-full bg-teal-500/60" />
            <span className="text-[11px] text-text-disabled">أنواع المركبات</span>
          </div>
          <h1 className="page-title">أنواع المركبات</h1>
          <p className="page-subtitle">إدارة أنواع المركبات والتسعير الخاص بكل نوع</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:opacity-80"
          style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", color: "#fff", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}
        >
          <Plus size={14} />
          إضافة نوع جديد
        </button>
      </div>

      {/* ===== ADD/EDIT FORM ===== */}
      {showForm && (
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{
            background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
            border: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-text-primary">
              {editId ? "تعديل النوع" : "إضافة نوع جديد"}
            </h3>
            <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-white/5 text-text-tertiary">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">الاسم (فريد)</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={!!editId}
                placeholder="مثال: car, truck"
                className="w-full px-4 py-2.5 rounded-xl text-[13px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">الاسم المعروض</label>
              <input
                type="text"
                required
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="مثال: سيارة"
                className="w-full px-4 py-2.5 rounded-xl text-[13px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">الأيقونة</label>
              <input
                type="text"
                required
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="directions_car"
                className="w-full px-4 py-2.5 rounded-xl text-[13px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">أجرة البدء</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.base_fare}
                onChange={(e) => setForm({ ...form, base_fare: e.target.value })}
                placeholder="10.00"
                className="w-full px-4 py-2.5 rounded-xl text-[13px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">سعر الكيلو</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.price_per_km}
                onChange={(e) => setForm({ ...form, price_per_km: e.target.value })}
                placeholder="3.50"
                className="w-full px-4 py-2.5 rounded-xl text-[13px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">الترتيب</label>
              <input
                type="number"
                required
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl text-[13px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-2">
              <button type="button" onClick={resetForm} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-text-secondary hover:text-text-primary transition-colors" style={{ border: "1px solid var(--divider)" }}>
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading === "submit"}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}
              >
                <Save size={13} />
                {loading === "submit" ? "جاري الحفظ..." : editId ? "تحديث" : "إضافة"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== VEHICLE TYPES LIST ===== */}
      <div className="grid gap-4">
        {vehicleTypes.map((vt) => (
          <div
            key={vt.id}
            className="group rounded-2xl p-5 transition-all hover:scale-[1.005]"
            style={{
              background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
              border: `1px solid ${vt.is_active ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)"}`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
              opacity: vt.is_active ? 1 : 0.6,
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Icon + Name */}
              <div className="flex items-center gap-4 flex-1">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{
                    background: vt.is_active ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))" : "var(--surface-glass)",
                    border: `1px solid ${vt.is_active ? "rgba(59,130,246,0.2)" : "var(--divider)"}`,
                  }}
                >
                  {vt.name === "car" ? "🚗" : vt.name === "truck" ? "🚛" : vt.name === "motorcycle" ? "🏍" : "🚕"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-text-primary">{vt.display_name}</h3>
                    <span
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                      style={{
                        background: vt.is_active ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                        color: vt.is_active ? "#34D399" : "#F87171",
                        border: `1px solid ${vt.is_active ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                      }}
                    >
                      {vt.is_active ? "فعال" : "معطل"}
                    </span>
                  </div>
                  <p className="text-[12px] text-text-tertiary mt-0.5 font-mono">{vt.name} • ترتيب: {vt.sort_order}</p>
                </div>
              </div>

              {/* Pricing */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider mb-1">أجرة البدء</div>
                  <div className="text-[16px] font-black text-emerald-400 num">{formatCurrency(Number(vt.base_fare))}</div>
                </div>
                <div className="w-px h-10 bg-divider" />
                <div className="text-center">
                  <div className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider mb-1">سعر الكيلو</div>
                  <div className="text-[16px] font-black text-blue-400 num">{formatCurrency(Number(vt.price_per_km))}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(vt.id, vt.is_active)}
                  disabled={loading === vt.id}
                  className="p-2.5 rounded-xl transition-all hover:bg-white/5 disabled:opacity-50"
                  title={vt.is_active ? "تعطيل" : "تفعيل"}
                  style={{ border: "1px solid var(--divider)" }}
                >
                  {vt.is_active ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} className="text-text-tertiary" />}
                </button>
                <button
                  onClick={() => startEdit(vt)}
                  className="p-2.5 rounded-xl transition-all hover:bg-white/5"
                  title="تعديل"
                  style={{ border: "1px solid var(--divider)" }}
                >
                  <Pencil size={14} className="text-blue-400" />
                </button>
                <button
                  onClick={() => handleDelete(vt.id, vt.display_name)}
                  disabled={loading === vt.id}
                  className="p-2.5 rounded-xl transition-all hover:bg-red-500/10 disabled:opacity-50"
                  title="حذف"
                  style={{ border: "1px solid var(--divider)" }}
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {vehicleTypes.length === 0 && (
          <div className="py-20 text-center">
            <div className="flex flex-col items-center gap-3 text-text-disabled">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}>
                <Car size={24} className="opacity-40" />
              </div>
              <div>
                <p className="text-text-secondary font-semibold">لا توجد أنواع مركبات</p>
                <p className="text-text-tertiary text-sm mt-1">أضف نوع مركبة جديد للبدء</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
