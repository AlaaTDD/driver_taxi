import { createAdminClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import PricingClient from "./pricing-client";
import { getAppCurrency } from "@/lib/currency";
import { CurrencySettings } from "./currency-settings";

export default async function PricingPage() {
  const t = await getTranslations();
  const supabase = createAdminClient();

  const { data: pricingConfigs } = await supabase
    .from("vehicle_types")
    .select("id, name, display_name, icon, base_fare, price_per_km, is_active, sort_order")
    .order("sort_order");

  const currency = await getAppCurrency();

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("pricing.title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("pricing.subtitle")}</p>
        </div>
        
        <CurrencySettings currentCurrency={currency} />
        
        <PricingClient configs={pricingConfigs || []} currency={currency} />
      </div>
    </>
  );
}
