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
import { useTranslations } from "next-intl";

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
  const t = useTranslations();
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
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">{t("vehicleTypes.manage")}</span>
            <span className="w-1 h-1 rounded-full" style={{ background: "rgba(var(--success-rgb), 0.6)" }} />
            <span className="text-[11px] text-text-disabled">{t("vehicleTypes.title")}</span>
          </div>
          <h1 className="page-title">{t("vehicleTypes.title")}</h1>
          <p className="page-subtitle">{t("vehicleTypes.subtitle")}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all"
        >
          <Plus size={14} />
          {t("vehicleTypes.addType")}
        </button>
      </div>

      
      {showForm && (
        <div className="dash-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-text-primary">
              {editId ? t("vehicleTypes.editType") : t("vehicleTypes.addType")}
            </h3>
            <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-[rgba(var(--color-white-rgb),0.05)] text-text-tertiary">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">{t("vehicleTypes.form.name")}</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={!!editId}
                placeholder="مثال: car, truck"
                className="input-field w-full px-4 py-2.5 rounded-xl text-[13px] disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">{t("vehicleTypes.form.displayName")}</label>
              <input
                type="text"
                required
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="مثال: سيارة"
                className="input-field w-full px-4 py-2.5 rounded-xl text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">{t("vehicleTypes.form.icon")}</label>
              <input
                type="text"
                required
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="directions_car"
                className="input-field w-full px-4 py-2.5 rounded-xl text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">{t("vehicleTypes.form.baseFare")}</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.base_fare}
                onChange={(e) => setForm({ ...form, base_fare: e.target.value })}
                placeholder="10.00"
                className="input-field w-full px-4 py-2.5 rounded-xl text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">{t("vehicleTypes.form.pricePerKm")}</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.price_per_km}
                onChange={(e) => setForm({ ...form, price_per_km: e.target.value })}
                placeholder="3.50"
                className="input-field w-full px-4 py-2.5 rounded-xl text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">{t("vehicleTypes.form.sortOrder")}</label>
              <input
                type="number"
                required
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                placeholder="0"
                className="input-field w-full px-4 py-2.5 rounded-xl text-[13px]"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-2">
              <button type="button" onClick={resetForm} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-text-secondary hover:text-text-primary transition-colors" style={{ border: "1px solid var(--divider)" }}>
                {t("common.cancel") || "إلغاء"}
              </button>
              <button
                type="submit"
                disabled={loading === "submit"}
                className="btn btn-primary inline-flex items-center gap-2 px-6 py-2 rounded-xl text-[13px] font-bold disabled:opacity-50"
              >
                <Save size={13} />
                {loading === "submit" ? t("vehicleTypes.form.saving") : editId ? t("vehicleTypes.form.update") : t("vehicleTypes.form.add")}
              </button>
            </div>
          </form>
        </div>
      )}

      
      <div className="grid gap-3">
        {vehicleTypes.map((vt) => (
          <div
            key={vt.id}
            className="dash-stat p-5 transition-all"
            style={{ opacity: vt.is_active ? 1 : 0.55 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Icon + Info */}
              <div className="flex items-center gap-4 flex-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{
                    background: vt.is_active ? "var(--accent-surface)" : "var(--surface-elevated)",
                    border: `1px solid ${vt.is_active ? "var(--accent-border)" : "var(--divider)"}`,
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
                        background: vt.is_active ? "var(--success-surface)" : "var(--error-surface)",
                        color: vt.is_active ? "var(--success)" : "var(--error)",
                        border: `1px solid ${vt.is_active ? "var(--success-border)" : "var(--error-border)"}`,
                      }}
                    >
                      {vt.is_active ? t("vehicleTypes.status.active") : t("vehicleTypes.status.inactive")}
                    </span>
                  </div>
                  <p className="text-[12px] text-text-tertiary mt-0.5 font-mono">{vt.name} · {t("vehicleTypes.form.sortOrder")}: {vt.sort_order}</p>
                </div>
              </div>

              {/* Pricing */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <div className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider mb-1">{t("vehicleTypes.form.baseFare")}</div>
                  <div className="text-[16px] font-black num" style={{ color: "var(--success)" }}>{formatCurrency(Number(vt.base_fare))}</div>
                </div>
                <div className="w-px h-10 bg-divider" />
                <div className="text-center">
                  <div className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider mb-1">{t("vehicleTypes.form.pricePerKm")}</div>
                  <div className="text-[16px] font-black num" style={{ color: "var(--primary)" }}>{formatCurrency(Number(vt.price_per_km))}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(vt.id, vt.is_active)}
                  disabled={loading === vt.id}
                  className="p-2 rounded-xl transition-all border border-divider hover:bg-surface-elevated disabled:opacity-50"
                  title={vt.is_active ? "تعطيل" : "تفعيل"}
                >
                  {vt.is_active
                    ? <ToggleRight size={16} style={{ color: "var(--success)" }} />
                    : <ToggleLeft size={16} className="text-text-disabled" />}
                </button>
                <button
                  onClick={() => startEdit(vt)}
                  className="p-2 rounded-xl transition-all border border-divider hover:bg-surface-elevated"
                  title="تعديل"
                >
                  <Pencil size={14} style={{ color: "var(--primary)" }} />
                </button>
                <button
                  onClick={() => handleDelete(vt.id, vt.display_name)}
                  disabled={loading === vt.id}
                  className="p-2 rounded-xl transition-all border border-divider hover:bg-error/8 hover:border-error/25 disabled:opacity-50"
                  title="حذف"
                >
                  <Trash2 size={14} style={{ color: "var(--error)" }} />
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
                <p className="text-text-secondary font-semibold">{t("vehicleTypes.noTypes")}</p>
                <p className="text-text-tertiary text-sm mt-1">{t("vehicleTypes.noTypesDesc")}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
