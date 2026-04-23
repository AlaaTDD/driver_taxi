import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import PricingClient from "./pricing-client";

export default async function PricingPage() {
  const supabase = createAdminClient();

  const { data: pricingConfigs } = await supabase
    .from("pricing_config")
    .select("*")
    .order("vehicle_type");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">التسعير</h1>
        <p className="text-text-secondary text-[13px] mt-0.5">إعداد أسعار الرحلات حسب نوع المركبة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(pricingConfigs || []).map((config) => (
          <div
            key={config.id}
            className="bg-surface/80 backdrop-blur-sm rounded-2xl border border-divider/60 p-6 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shadow-primary/10">
                {config.vehicle_type === "car" ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.5L21 11M3 11h18M3 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-6" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-text-primary font-bold text-lg">
                  {config.vehicle_type === "car" ? "عربية" : "مكنة"}
                </h3>
                <p className="text-text-disabled text-xs">آخر تحديث: {new Date(config.updated_at).toLocaleDateString("ar-EG")}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-divider/40">
                <span className="text-text-secondary text-[13px]">الأجرة الأساسية</span>
                <span className="text-text-primary font-bold text-[13px]">{formatCurrency(Number(config.base_fare))}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-divider/40">
                <span className="text-text-secondary text-[13px]">السعر لكل كيلومتر</span>
                <span className="text-text-primary font-bold text-[13px]">{formatCurrency(Number(config.price_per_km))}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-text-secondary text-[13px]">الحد الأدنى للأجرة</span>
                <span className="text-text-primary font-bold text-[13px]">{formatCurrency(Number(config.minimum_fare))}</span>
              </div>
            </div>

            <PricingClient config={config} />
          </div>
        ))}

        {(!pricingConfigs || pricingConfigs.length === 0) && (
          <div className="col-span-2 text-center py-12 text-text-disabled">
            لا توجد إعدادات تسعير
          </div>
        )}
      </div>

      {/* Price Calculator Preview */}
      <div className="bg-surface/80 backdrop-blur-sm rounded-2xl border border-divider/60 p-6">
        <h3 className="text-text-primary font-bold text-[13px] mb-4">حاسبة الأسعار</h3>
        <p className="text-text-secondary text-[13px] mb-4">
          احسب سعر الرحلة بناءً على المسافة ونوع المركبة
        </p>
        <PriceCalculator configs={pricingConfigs || []} />
      </div>
    </div>
  );
}

function PriceCalculator({
  configs,
}: {
  configs: Record<string, unknown>[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {(configs || []).map((config) => {
        const baseFare = Number(config.base_fare);
        const pricePerKm = Number(config.price_per_km);
        const minFare = Number(config.minimum_fare);
        const distances = [5, 10, 15, 20, 30];

        return (
          <div key={config.id as string} className="space-y-2">
            <h4 className="text-text-primary font-semibold text-[13px]">
              {config.vehicle_type === "car" ? "عربية" : "مكنة"}
            </h4>
            {distances.map((km) => {
              const price = Math.max(baseFare + pricePerKm * km, minFare);
              return (
                <div key={km} className="flex justify-between text-[12px]">
                  <span className="text-text-secondary">{km} كم</span>
                  <span className="text-text-primary font-medium">{formatCurrency(price)}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
