import { createAdminClient } from "@/lib/supabase/server";
import VehicleTypesClient from "./vehicle-types-client";

export default async function VehicleTypesPage() {
  const supabase = createAdminClient();

  const { data: vehicleTypes } = await supabase
    .from("vehicle_types")
    .select("*")
    .order("sort_order");

  return <VehicleTypesClient vehicleTypes={vehicleTypes || []} />;
}
