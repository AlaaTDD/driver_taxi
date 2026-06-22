"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { revalidatePath } from "next/cache";
import { safeErrorMessage } from "@/lib/api/validation";

export async function getAppCurrency(): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "currency")
    .single();

  if (data?.value && typeof data.value === "string") {
    return data.value;
  }
  
  return "EGP"; // Default currency
}

export async function updateAppCurrency(newCurrency: string) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return { error: "غير مصرح لك بإجراء هذا العمل" };

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("app_config")
    .select("key")
    .eq("key", "currency")
    .single();

  if (existing) {
    const { error } = await supabase
      .from("app_config")
      .update({ value: newCurrency })
      .eq("key", "currency");

    if (error) return { error: safeErrorMessage(error) };
  } else {
    const { error } = await supabase.from("app_config").insert({
      key: "currency",
      value: newCurrency,
      label: "عملة التطبيق",
      category: "general",
    });

    if (error) return { error: safeErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
