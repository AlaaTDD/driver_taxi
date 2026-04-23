"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCoupon(formData: FormData) {
  const supabase = createAdminClient();

  const data: Record<string, unknown> = {
    code: (formData.get("code") as string).toUpperCase(),
    discount_type: formData.get("discount_type") as string,
    discount_value: Number(formData.get("discount_value")),
    is_active: true,
  };

  const minTripPrice = formData.get("min_trip_price") as string;
  const maxUses = formData.get("max_uses") as string;
  const expiresAt = formData.get("expires_at") as string;

  if (minTripPrice) data.min_trip_price = Number(minTripPrice);
  if (maxUses) data.max_uses = Number(maxUses);
  if (expiresAt) data.expires_at = new Date(expiresAt).toISOString();

  const { error } = await supabase.from("coupons").insert(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/coupons");
  return { success: true };
}
