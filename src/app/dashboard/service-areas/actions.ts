"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { revalidatePath } from "next/cache";
import { safeErrorMessage } from "@/lib/api/validation";

// CODE-14 FIX: Basic geohash character set validation (base32 chars only)
const GEOHASH_RE = /^[0-9b-hjkmnp-z]+$/i;

export async function createServiceArea(formData: FormData) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return { error: "غير مصرح لك بإجراء هذا العمل" };

  const name = formData.get("name")?.toString() || "";
  const name_ar = formData.get("name_ar")?.toString() || "";
  const code = formData.get("code")?.toString() || "";
  const prefixesStr = formData.get("geohash_prefixes")?.toString() || "";
  const is_active = formData.get("is_active") === "true";

  if (!name || !code || !prefixesStr) {
    return { error: "يرجى تعبئة الحقول الأساسية" };
  }

  const geohash_prefixes = prefixesStr.split(",").map(s => s.trim()).filter(Boolean);

  // Reject any prefix that isn’t valid geohash base32 characters
  const invalidPrefixes = geohash_prefixes.filter(p => !GEOHASH_RE.test(p));
  if (invalidPrefixes.length > 0) {
    return { error: `بادئات geohash غير صالحة: ${invalidPrefixes.join(", ")}` };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("service_areas").insert({
    name,
    name_ar,
    code,
    geohash_prefixes,
    is_active,
  });

  if (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/dashboard/service-areas");
  return { success: true };
}

export async function toggleServiceArea(id: string, is_active: boolean) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return { error: "غير مصرح لك بإجراء هذا العمل" };

  const supabase = createAdminClient();
  const { error } = await supabase.from("service_areas").update({ is_active }).eq("id", id);

  if (error) return { error: safeErrorMessage(error) };

  revalidatePath("/dashboard/service-areas");
  return { success: true };
}

export async function testServiceAreaCoverage(lat: number, lng: number) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return { error: "غير مصرح" };

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("resolve_service_area", {
    p_lat: lat,
    p_lng: lng
  });

  if (error) return { error: safeErrorMessage(error) };
  return { data };
}
