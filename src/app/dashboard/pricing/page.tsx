import { createAdminClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { getTranslations } from "next-intl/server";
import PricingClient from "./pricing-client";

export default async function PricingPage() {
  const t = await getTranslations();
  const supabase = createAdminClient();

  const { data: pricingConfigs } = await supabase
    .from("vehicle_types")
    .select("id, name, display_name, icon, base_fare, price_per_km, is_active, sort_order")
    .order("sort_order");

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("pricing.title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("pricing.subtitle")}</p>
        </div>
        <PricingClient configs={pricingConfigs || []} />
      </div>
    </DashboardShell>
  );
}
