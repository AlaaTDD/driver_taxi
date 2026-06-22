"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { revalidatePath } from "next/cache";
import { safeErrorMessage } from "@/lib/api/validation";

export async function updateAppConfig(formData: FormData) {
  const guard = await requireAdmin();
  if (guard instanceof Response)
    return { error: "غير مصرح لك بإجراء هذا العمل" };

  const key = formData.get("key")?.toString();
  const value = formData.get("value")?.toString();

  const ALLOWED_KEYS = [
    "currency", "max_search_radius_km", "max_search_duration_sec",
    "maintenance_mode", "min_app_version", "multi_route_enabled",
    "referral_system_enabled", "scheduled_rides_enabled"
  ];

  if (!key || !ALLOWED_KEYS.includes(key) || value === undefined) {
    return { error: "بيانات غير صالحة أو مفتاح الإعداد غير مسموح بتعديله" };
  }

  // Parse the value: if it's valid JSON store as jsonb, else as plain text
  let parsedValue: unknown = value;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    // not JSON, keep as string
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("app_config")
    .upsert({ key, value: parsedValue }, { onConflict: "key" });

  if (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}