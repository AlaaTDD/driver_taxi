import { createAdminClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { getTranslations } from "next-intl/server";
import VehicleTypesClient from "./vehicle-types-client";

export default async function VehicleTypesPage() {
  const t = await getTranslations();
  const supabase = createAdminClient();

  const { data: vehicleTypes } = await supabase
    .from("vehicle_types")
    .select("*")
    .order("sort_order");

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">{t("vehicleTypes.title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("vehicleTypes.subtitle")}</p>
        </div>
        <VehicleTypesClient vehicleTypes={vehicleTypes || []} />
      </div>
    </DashboardShell>
  );
}
