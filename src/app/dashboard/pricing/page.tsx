import { createAdminClient } from "@/lib/supabase/server";
import PricingClient from "./pricing-client";

export default async function PricingPage() {
  const supabase = createAdminClient();

  const { data: pricingConfigs } = await supabase
    .from("vehicle_types")
    .select("id, name, display_name, icon, base_fare, price_per_km, is_active, sort_order")
    .order("sort_order");

  return <PricingClient configs={pricingConfigs || []} />;
}
