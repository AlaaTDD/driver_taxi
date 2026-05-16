"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Save, X, Trash2, Power, PowerOff, Car, Bike, Truck, Zap, Star, Pencil, GripVertical } from "lucide-react";
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

export default function PricingClient({ configs }: PricingClientProps) {
  const t = useTranslations();
  const router = useRouter();

  const ICON_OPTIONS = [
    { value: "directions_car", label: t("pricing.icons.car"), icon: Car },
    { value: "two_wheeler", label: t("pricing.icons.bike"), icon: Bike },
    { value: "local_shipping", label: t("pricing.icons.truck"), icon: Truck },
    { value: "electric_car", label: t("pricing.icons.electric"), icon: Zap },
    { value: "star", label: t("pricing.icons.premium"), icon: Star },
  ];

  const COLORS = [
    { name: t("pricing.colors.blue"), value: "var(--info)" },
    { name: t("pricing.colors.green"), value: "var(--success)" },
    { name: t("pricing.colors.red"), value: "var(--error)" },
    { name: t("pricing.colors.yellow"), value: "var(--warning)" },
    { name: t("pricing.colors.purple"), value: "var(--color-purple)" },
    { name: t("pricing.colors.pink"), value: "var(--color-pink)" },
    { name: t("pricing.colors.cyan"), value: "var(--color-cyan)" },
    { name: t("pricing.colors.orange"), value: "var(--warning)" },
  ];
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
        alert(data.error || t("pricing.messages.saveFailed"));
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
        alert(t("pricing.messages.toggleFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteType = async (id: string) => {
    if (!confirm(t("pricing.messages.confirmDelete"))) return;

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
        alert(t("pricing.messages.deleteFailed"));
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">{t("pricing.manage")}</span>
            <span className="w-1 h-1 rounded-full bg-success/60" />
            <span className="text-[11px] text-text-disabled">{t("pricing.vehicleTypes")}</span>
          </div>

        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="px-2 py-1 rounded-lg bg-success/10 text-success">{activeCount} {t("pricing.active")}</span>
            {inactiveCount > 0 && (
              <span className="px-2 py-1 rounded-lg bg-text-disabled/10 text-text-disabled">{inactiveCount} {t("pricing.inactive")}</span>
            )}
          </div>
          <button
            onClick={openAddModal}
            className="btn btn-primary px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all"
          >
            <Plus size={16} />
            {t("pricing.addType")}
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((config) => {
          const IconComponent = getIconComponent(config.icon);
          const isActive = config.is_active;

          return (
            <div
              key={config.id}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 dash-card ${!isActive ? "opacity-60" : ""
                }`}
            >
              <div className="p-5 flex flex-col h-full">

                {/* Header: Icon & Titles */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: isActive ? "rgba(var(--success-rgb),0.12)" : "var(--surface-glass)",
                        border: `1px solid ${isActive ? "rgba(var(--success-rgb),0.25)" : "var(--divider)"}`,
                      }}
                    >
                      <IconComponent
                        size={22}
                        style={{ color: isActive ? "var(--success)" : "var(--text-disabled)" }}
                      />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-bold text-text-primary mb-0.5 leading-tight">{config.display_name}</h3>
                      <p className="text-[12px] text-text-tertiary">{config.name}</p>
                    </div>
                  </div>

                  {/* Actions (visible on hover) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => openEditModal(config)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-text-tertiary hover:text-primary transition-colors"
                      title={t("pricing.edit")}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => toggleActive(config.id, config.is_active)}
                      className={`p-1.5 rounded-lg transition-colors ${isActive
                          ? "hover:bg-warning/10 text-text-tertiary hover:text-warning"
                          : "hover:bg-success/10 text-text-disabled hover:text-success"
                        }`}
                      title={isActive ? t("pricing.disable") : t("pricing.enable")}
                    >
                      {isActive ? <PowerOff size={14} /> : <Power size={14} />}
                    </button>
                    <button
                      onClick={() => deleteType(config.id)}
                      className="p-1.5 rounded-lg hover:bg-error/10 text-text-tertiary hover:text-error transition-colors"
                      title={t("pricing.delete")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  {/* Fallback for touch devices (always visible on small screens) */}
                  <div className="sm:hidden flex items-center gap-1">
                     <button onClick={() => openEditModal(config)} className="p-1.5 text-text-tertiary"><Pencil size={14} /></button>
                  </div>
                </div>

                {/* Pricing Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                  <div className="p-3 rounded-xl" style={{ background: "var(--surface-muted)", border: "1px solid var(--divider)" }}>
                    <span className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
                      {t("pricing.baseFare")}
                    </span>
                    <span className="block text-[15px] font-black text-text-primary">
                      {formatCurrency(Number(config.base_fare))}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "var(--surface-muted)", border: "1px solid var(--divider)" }}>
                    <span className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
                      {t("pricing.pricePerKm")}
                    </span>
                    <span className="block text-[15px] font-black text-text-primary">
                      {formatCurrency(Number(config.price_per_km))}
                    </span>
                  </div>
                </div>

                {/* Footer: Status & Sort Order */}
                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--divider)" }}>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-success' : 'bg-text-disabled'}`}></span>
                    </span>
                    <span className={`text-[12px] font-bold ${isActive ? 'text-success' : 'text-text-disabled'}`}>
                      {isActive ? t("pricing.active") : t("pricing.inactive")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-text-tertiary">
                    <GripVertical size={12} className="opacity-50" />
                    {t("pricing.sortOrder").replace("{order}", String(config.sort_order))}
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>


      {configs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
          >
            <Car size={28} className="text-text-disabled opacity-40" />
          </div>
          <p className="text-text-secondary font-semibold">{t("pricing.noTypes")}</p>
          <p className="text-text-tertiary text-sm">{t("pricing.noTypesDesc")}</p>
        </div>
      )}


      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "var(--overlay)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden bg-surface shadow-xl border border-divider"
          >

            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--divider)" }}
            >
              <div>
                <h3 className="text-[16px] font-black text-text-primary">
                  {editingId ? t("pricing.modal.editTitle") : t("pricing.modal.addTitle")}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-surface-elevated text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>


            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                  {t("pricing.modal.techName")}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s/g, "_") })}
                  placeholder={t("pricing.modal.techNamePlaceholder")}
                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                  style={{
                    background: "var(--surface-glass)",
                    border: "1px solid var(--divider)",
                    color: "var(--text-primary)",
                  }}
                  required
                  disabled={!!editingId}
                  dir="ltr"
                />
                <p className="text-[10px] text-text-disabled mt-1">{t("pricing.modal.techNameDesc")}</p>
              </div>


              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                  {t("pricing.modal.displayName")}
                </label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  placeholder={t("pricing.modal.displayNamePlaceholder")}
                  className="input-field w-full px-4 py-3 rounded-xl text-[13px]"
                  required
                />
              </div>


              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                  {t("pricing.modal.icon")}
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
                          background: isSelected ? "rgba(var(--success-rgb),0.15)" : "var(--surface-glass)",
                          border: isSelected ? "1px solid rgba(var(--success-rgb),0.4)" : "1px solid var(--divider)",
                          color: isSelected ? "var(--success)" : "var(--text-secondary)",
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


              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                  {t("pricing.modal.color")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                      style={{
                        background: selectedColor === color.value ? "var(--surface-glass)" : "var(--surface-glass)",
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


              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                    {t("pricing.baseFare")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.base_fare}
                    onChange={(e) => setForm({ ...form, base_fare: e.target.value })}
                    placeholder="15.00"
                    className="input-field w-full px-4 py-3 rounded-xl text-[13px]"
                    required
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                    {t("pricing.pricePerKm")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price_per_km}
                    onChange={(e) => setForm({ ...form, price_per_km: e.target.value })}
                    placeholder="5.00"
                    className="input-field w-full px-4 py-3 rounded-xl text-[13px]"
                    required
                    dir="ltr"
                  />
                </div>
              </div>


              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                  {t("pricing.sortOrder").split(":")[0]}
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  className="input-field w-full px-4 py-3 rounded-xl text-[13px]"
                  dir="ltr"
                />
              </div>


              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl text-[13px] font-bold text-text-secondary transition-all hover:text-text-primary"
                  style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
                >
                  {t("common.cancel") || "إلغاء"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1 py-3 rounded-xl text-[13px] font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingId ? t("pricing.modal.saveChanges") : t("pricing.modal.add")}
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
