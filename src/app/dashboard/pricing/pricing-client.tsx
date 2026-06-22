"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Save, X, Trash2, Power, PowerOff, Car, Bike, Truck, Zap, Star, Pencil, GripVertical, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";

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
  currency: string;
}

export default function PricingClient({ configs, currency }: PricingClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const { confirm } = useConfirm();

  const ICON_OPTIONS = [
    { value: "directions_car", label: t("pricing.icons.car"), icon: Car },
    { value: "two_wheeler", label: t("pricing.icons.bike"), icon: Bike },
    { value: "local_shipping", label: t("pricing.icons.truck"), icon: Truck },
    { value: "electric_car", label: t("pricing.icons.electric"), icon: Zap },
    { value: "star", label: t("pricing.icons.premium"), icon: Star },
  ];

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const payload: any = {
        name: form.name,
        display_name: form.display_name,
        icon: form.icon,
        base_fare: parseFloat(form.base_fare),
        price_per_km: parseFloat(form.price_per_km),
        sort_order: parseInt(form.sort_order, 10) || 0,
      };
      if (editingId) payload.id = editingId;

      const action = editingId ? "update" : "create";
      const res = await fetch(`/api/vehicle-types/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        router.refresh();
        toast.success(editingId ? t("pricing.messages.updateSuccess") || "تم التحديث بنجاح" : t("pricing.messages.addSuccess") || "تمت الإضافة بنجاح");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || t("pricing.messages.saveFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    setLoading(true);
    try {
      const res = await fetch("/api/vehicle-types/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !current }),
      });

      if (res.ok) {
        router.refresh();
        toast.success(current ? t("pricing.messages.deactivated") || "تم الإيقاف" : t("pricing.messages.activated") || "تم التفعيل");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || t("pricing.messages.toggleFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteType = async (id: string) => {
    const confirmed = await confirm({
      title: "تأكيد الحذف",
      message: t("pricing.messages.confirmDelete"),
      isDestructive: true
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/vehicle-types/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        router.refresh();
        toast.success(t("pricing.messages.deleteSuccess") || "تم الحذف بنجاح");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || t("pricing.messages.deleteFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const syncPricing = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pricing/sync", {
        method: "POST",
      });

      if (res.ok) {
        toast.success("تم مزامنة التسعير بنجاح");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "فشل مزامنة التسعير");
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

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="px-3 py-1.5 rounded-xl bg-success/10 text-success font-bold flex items-center gap-1.5 border border-success/20">
              <ShieldCheck size={14} />
              {activeCount} {t("pricing.active")}
            </span>
            {inactiveCount > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-text-disabled/10 text-text-disabled font-bold flex items-center gap-1.5 border border-divider">
                <PowerOff size={14} />
                {inactiveCount} {t("pricing.inactive")}
              </span>
            )}
          </div>
          <button
            onClick={syncPricing}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            style={{ background: "var(--info-surface)", color: "var(--info)", border: "1px solid var(--info-border)" }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            مزامنة التسعير
          </button>
          <button
            onClick={openAddModal}
            className="btn btn-primary px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg"
          >
            <Plus size={16} />
            {t("pricing.addType")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {configs.map((config) => {
          const IconComponent = getIconComponent(config.icon);
          const isActive = config.is_active;

          return (
            <div
              key={config.id}
              className={`group relative rounded-xl transition-all duration-200 bg-surface border ${
                isActive ? "border-divider hover:border-divider-strong hover:shadow-sm" : "border-divider/50 opacity-50 hover:opacity-100 bg-surface-muted"
              }`}
            >
              <div className="p-5 flex flex-col h-full">
                 {/* Top: Icon + Name + Actions */}
                 <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-elevated border border-divider text-text-secondary">
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold text-text-primary leading-tight">{config.display_name}</h3>
                        <p className="text-[12px] text-text-tertiary font-mono mt-0.5">{config.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(config)} className="p-1.5 rounded-md hover:bg-surface-elevated text-text-tertiary hover:text-text-primary transition-colors" title={t("pricing.edit")}><Pencil size={14} /></button>
                      <button onClick={() => toggleActive(config.id, config.is_active)} className="p-1.5 rounded-md hover:bg-surface-elevated text-text-tertiary hover:text-text-primary transition-colors" title={isActive ? t("pricing.disable") : t("pricing.enable")}>
                        {isActive ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                      <button onClick={() => deleteType(config.id)} className="p-1.5 rounded-md hover:bg-surface-elevated text-text-tertiary hover:text-error transition-colors" title={t("pricing.delete")}><Trash2 size={14} /></button>
                    </div>
                 </div>

                 {/* Middle: Pricing List */}
                 <div className="flex-1 flex flex-col gap-1 mb-5">
                   <div className="flex items-center justify-between py-2 border-b border-divider/40">
                     <span className="text-[13px] text-text-secondary">{t("pricing.baseFare")}</span>
                     <span className="text-[14px] font-bold text-text-primary num">{formatCurrency(Number(config.base_fare), currency)}</span>
                   </div>
                   <div className="flex items-center justify-between py-2 border-b border-divider/40">
                     <span className="text-[13px] text-text-secondary">{t("pricing.pricePerKm")}</span>
                     <span className="text-[14px] font-bold text-text-primary num">{formatCurrency(Number(config.price_per_km), currency)}</span>
                   </div>
                 </div>

                 {/* Bottom: Meta */}
                 <div className="flex items-center justify-between mt-auto">
                   <span className="text-[12px] text-text-secondary flex items-center gap-1.5">
                     <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-text-primary" : "bg-text-disabled"}`} />
                     {isActive ? t("pricing.active") : t("pricing.inactive")}
                   </span>
                   <span className="text-[12px] text-text-tertiary font-mono flex items-center gap-1">
                     <GripVertical size={12} className="opacity-50" />
                     {config.sort_order}
                   </span>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {configs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-surface border border-divider border-dashed rounded-3xl">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-surface-elevated border border-divider shadow-sm">
            <Car size={32} className="text-text-disabled opacity-50" />
          </div>
          <div className="text-center">
            <p className="text-[16px] text-text-primary font-black mb-1">{t("pricing.noTypes")}</p>
            <p className="text-text-tertiary text-[13px] max-w-sm">{t("pricing.noTypesDesc")}</p>
          </div>
          <button
            onClick={openAddModal}
            className="mt-2 btn btn-primary px-6 py-3 rounded-xl text-[13px] font-black flex items-center gap-2 transition-all hover:scale-105 shadow-xl shadow-primary/20"
          >
            <Plus size={18} />
            {t("pricing.addType")}
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md rounded-[24px] overflow-hidden bg-surface shadow-2xl border border-divider/50 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-b from-surface-elevated/50 to-transparent border-b border-divider/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  {editingId ? <Pencil size={18} className="text-primary" /> : <Plus size={18} className="text-primary" />}
                </div>
                <h3 className="text-[18px] font-black text-text-primary">
                  {editingId ? t("pricing.modal.editTitle") : t("pricing.modal.addTitle")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-elevated text-text-tertiary hover:text-error transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-info" />
                  {t("pricing.modal.techName")}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s/g, "_") })}
                  placeholder={t("pricing.modal.techNamePlaceholder")}
                  className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none font-mono transition-all focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:bg-surface-muted"
                  style={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--divider)",
                    color: "var(--text-primary)",
                  }}
                  required
                  disabled={!!editingId}
                  dir="ltr"
                />
                <p className="flex items-center gap-1.5 text-[10px] font-medium text-warning mt-2 bg-warning/10 p-2 rounded-lg border border-warning/20">
                  <AlertTriangle size={12} />
                  {t("pricing.modal.techNameDesc")}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  {t("pricing.modal.displayName")}
                </label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  placeholder={t("pricing.modal.displayNamePlaceholder")}
                  className="input-field w-full px-4 py-3.5 rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-color-purple" />
                  {t("pricing.modal.icon")}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {ICON_OPTIONS.map((iconOpt) => {
                    const Icon = iconOpt.icon;
                    const isSelected = form.icon === iconOpt.value;
                    return (
                      <button
                        key={iconOpt.value}
                        type="button"
                        onClick={() => setForm({ ...form, icon: iconOpt.value })}
                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
                        style={{
                          background: isSelected ? "rgba(var(--primary-rgb),0.12)" : "var(--surface-elevated)",
                          border: isSelected ? "2px solid var(--primary)" : "1px solid var(--divider)",
                          color: isSelected ? "var(--primary)" : "var(--text-secondary)",
                        }}
                      >
                        <Icon size={22} strokeWidth={isSelected ? 2 : 1.5} />
                        <span className={`text-[10px] ${isSelected ? "font-bold" : "font-medium"}`}>{iconOpt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                    {t("pricing.baseFare")}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-text-tertiary pointer-events-none">
                      {currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.base_fare}
                      onChange={(e) => setForm({ ...form, base_fare: e.target.value })}
                      placeholder="15.00"
                      className="input-field w-full pl-12 pr-4 py-3.5 rounded-xl text-[15px] font-black num focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                    {t("pricing.pricePerKm")}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-text-tertiary pointer-events-none">
                      {currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price_per_km}
                      onChange={(e) => setForm({ ...form, price_per_km: e.target.value })}
                      placeholder="5.00"
                      className="input-field w-full pl-12 pr-4 py-3.5 rounded-xl text-[15px] font-black num focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                  {t("pricing.sortOrder").split(":")[0]}
                </label>
                <div className="relative">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-disabled">
                    <GripVertical size={16} />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                    className="input-field w-full pr-12 pl-4 py-3.5 rounded-xl text-[14px] font-bold num focus:ring-2 focus:ring-primary/20 transition-all"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-divider/60">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 rounded-xl text-[13px] font-bold text-text-secondary transition-all hover:bg-surface-elevated border border-divider hover:text-text-primary"
                >
                  {t("common.cancel") || "إلغاء"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1 py-3.5 rounded-xl text-[14px] font-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-primary/20"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      <Save size={18} />
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
