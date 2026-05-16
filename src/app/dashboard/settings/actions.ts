"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { revalidatePath } from "next/cache";

export async function updateAppConfig(formData: FormData) {
  const guard = await requireAdmin();
  if (guard instanceof Response)
    return { error: "غير مصرح لك بإجراء هذا العمل" };

  const id = formData.get("id")?.toString();
  const value = formData.get("value")?.toString();

  if (!id || value === undefined) {
    return { error: "بيانات غير صالحة" };
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
    .update({ value: parsedValue })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}