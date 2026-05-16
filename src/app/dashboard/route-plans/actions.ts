"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/supabase/auth-guard";

export async function updateRoutePlanStatus(id: string, status: "draft" | "active" | "inactive" | "archived") {
  const guard = await requireAdmin();
  if (guard instanceof Response) return { success: false, error: "Unauthorized" };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("trip_route_plans")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/route-plans");
  return { success: true };
}
