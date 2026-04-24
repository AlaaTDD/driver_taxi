import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import PricingClient from "./pricing-client";
import { DollarSign, Car, Zap, Calculator, TrendingUp } from "lucide-react";

export default async function PricingPage() {
  const supabase = createAdminClient();

  const { data: pricingConfigs } = await supabase
    .from("pricing_config")
    .select("*")
    .order("vehicle_type");

  return (
    <div className="space-y-7">

      {/* ===== PAGE HEADER ===== */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">إعدادات</span>
          <span className="w-1 h-1 rounded-full bg-green-500/60" />
          <span className="text-[11px] text-text-disabled">التسعير</span>
        </div>
        <h1 className="page-title">التسعير</h1>
        <p className="page-subtitle">إعداد وضبط أسعار الرحلات حسب نوع المركبة</p>
      </div>

      {/* ===== PRICING CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(pricingConfigs || []).map((config) => {
          const isCar = config.vehicle_type === "car";
          const accentColor = isCar ? "#3B82F6" : "#10B981";
          const accentGlow = isCar ? "rgba(59,130,246,0.25)" : "rgba(16,185,129,0.25)";

          return (
            <div
              key={config.id}
              className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
                border: "1px solid rgba(255,255,255,0.05)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              {/* Top accent */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(to left, transparent, ${accentColor}, transparent)`, opacity: 0.6 }}
              />

              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: `0 0 50px ${accentGlow} inset` }}
              />

              <div className="relative p-6">
                {/* Vehicle Icon + Title */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div
                      className="absolute inset-0 rounded-2xl blur-xl scale-110 opacity-50"
                      style={{ background: accentColor }}
                    />
                    <div
                      className="relative w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}11)`,
                        boxShadow: `0 6px 20px ${accentGlow}`,
                      }}
                    >
                      {isCar ? (
                        <Car size={24} style={{ color: accentColor, filter: `drop-shadow(0 0 8px ${accentColor}80)` }} />
                      ) : (
                        <Zap size={24} style={{ color: accentColor, filter: `drop-shadow(0 0 8px ${accentColor}80)` }} />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-primary">
                      {isCar ? "عربية 🚗" : "مكنة 🏍"}
                    </h3>
                    <p className="text-text-tertiary text-[12px] mt-0.5">
                      آخر تحديث: {new Date(config.updated_at).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>

                {/* Pricing Fields */}
                <div className="space-y-3 mb-5">
                  {[
                    { label: "الأجرة الأساسية", value: formatCurrency(Number(config.base_fare)), icon: <DollarSign size={13} /> },
                    { label: "السعر لكل كيلومتر", value: formatCurrency(Number(config.price_per_km)), icon: <TrendingUp size={13} /> },
                    { label: "الحد الأدنى للأجرة", value: formatCurrency(Number(config.minimum_fare)), icon: <Calculator size={13} /> },
                  ].map((field, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3.5 rounded-xl"
                      style={{
                        background: "rgba(15,30,53,0.5)",
                        border: "1px solid var(--divider)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: accentColor }}>{field.icon}</span>
                        <span className="text-text-secondary text-[13px] font-medium">{field.label}</span>
                      </div>
                      <span
                        className="text-[15px] font-black num"
                        style={{ color: accentColor }}
                      >
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Edit Form */}
                <PricingClient config={config} />
              </div>
            </div>
          );
        })}

        {(!pricingConfigs || pricingConfigs.length === 0) && (
          <div className="col-span-2 flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(15,30,53,0.8)", border: "1px solid var(--divider)" }}
            >
              <DollarSign size={24} className="text-text-disabled opacity-40" />
            </div>
            <p className="text-text-secondary font-semibold">لا توجد إعدادات تسعير</p>
          </div>
        )}
      </div>

      {/* ===== PRICE CALCULATOR ===== */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        <div
          className="flex items-center gap-2.5 px-6 py-4"
          style={{ borderBottom: "1px solid var(--divider)" }}
        >
          <div
            className="w-[3px] h-5 rounded-full"
            style={{ background: "linear-gradient(to bottom, #10B981, #059669)", boxShadow: "0 0 8px rgba(16,185,129,0.5)" }}
          />
          <div>
            <h3 className="text-[13px] font-bold text-text-primary">حاسبة الأسعار</h3>
            <p className="text-[10px] text-text-tertiary">سعر الرحلة تبعاً للمسافة ونوع المركبة</p>
          </div>
          <Calculator size={16} className="mr-auto text-text-tertiary" />
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(pricingConfigs || []).map((config) => {
              const isCar = config.vehicle_type === "car";
              const accentColor = isCar ? "#60A5FA" : "#34D399";
              const baseFare = Number(config.base_fare);
              const pricePerKm = Number(config.price_per_km);
              const minFare = Number(config.minimum_fare);
              const distances = [5, 10, 15, 20, 30];

              return (
                <div key={config.id as string}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[13px] font-bold" style={{ color: accentColor }}>
                      {isCar ? "🚗 عربية" : "🏍 مكنة"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {distances.map((km) => {
                      const price = Math.max(baseFare + pricePerKm * km, minFare);
                      const barWidth = Math.min((price / (baseFare + pricePerKm * 30)) * 100, 100);

                      return (
                        <div key={km} className="flex items-center gap-3">
                          <span className="text-text-tertiary text-[12px] w-12 text-left num flex-shrink-0">
                            {km} كم
                          </span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                            style={{ background: "rgba(15,30,53,0.8)", border: "1px solid var(--divider)" }}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${barWidth}%`,
                                background: `linear-gradient(to left, ${accentColor}, ${accentColor}66)`,
                                boxShadow: `0 0 6px ${accentColor}40`,
                              }}
                            />
                          </div>
                          <span className="font-black num text-[13px] w-20 text-left flex-shrink-0" style={{ color: accentColor }}>
                            {formatCurrency(price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
