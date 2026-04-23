"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePricing(formData: FormData) {
  const supabase = createAdminClient();

  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("pricing_config")
    .update({
      base_fare: Number(formData.get("base_fare")),
      price_per_km: Number(formData.get("price_per_km")),
      minimum_fare: Number(formData.get("minimum_fare")),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/pricing");
  return { success: true };
}
