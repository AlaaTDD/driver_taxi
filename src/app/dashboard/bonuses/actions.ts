"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { logAdminAction } from "@/lib/admin-logger";
import { revalidatePath } from "next/cache";

export async function createBonusRule(formData: FormData) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return { error: "غير مصرح لك بإجراء هذا العمل" };

  const name = formData.get("name")?.toString() || "";
  const name_ar = formData.get("name_ar")?.toString() || "";
  const trigger_type = formData.get("trigger_type")?.toString() || "daily_trips";
  const threshold = Number(formData.get("threshold")) || 0;
  const bonus_amount = Number(formData.get("bonus_amount")) || 0;
  const is_active = formData.get("is_active") === "true";
  
  const vehicleTypesStr = formData.getAll("vehicle_types").map(s => s.toString());
  const vehicle_types = vehicleTypesStr.length > 0 ? vehicleTypesStr : ["car"];

  const starts_at = formData.get("starts_at")?.toString() || null;
  const expires_at = formData.get("expires_at")?.toString() || null;

  if (!name || threshold <= 0 || bonus_amount <= 0) {
    return { error: "يرجى تعبئة الحقول الأساسية بشكل صحيح" };
  }

  const supabase = createAdminClient();
  const data = {
    name,
    name_ar,
    trigger_type,
    threshold,
    bonus_amount,
    vehicle_types,
    is_active,
    starts_at: starts_at ? new Date(starts_at).toISOString() : null,
    expires_at: expires_at ? new Date(expires_at).toISOString() : null,
  };

  const { error } = await supabase.from("bonus_rules").insert(data);
  if (error) return { error: error.message };

  await logAdminAction({
    admin_id: guard.id,
    action: "create",
    table_name: "bonus_rules",
    details: { name: data.name, trigger_type: data.trigger_type, threshold: data.threshold, amount: data.bonus_amount },
  });

  revalidatePath("/dashboard/bonuses");
  return { success: true };
}

export async function toggleBonusRule(id: string, is_active: boolean) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bonus_rules")
    .update({ is_active })
    .eq("id", id);

  if (error) {
    console.error("Failed to toggle bonus rule:", error);
    return;
  }

  await logAdminAction({
    admin_id: guard.id,
    action: "update",
    table_name: "bonus_rules",
    record_id: id,
    details: { is_active },
  });

  revalidatePath("/dashboard/bonuses");
  return { success: true };
}
