import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { booleanFromRequest, formDataToObject, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";
// [WEB-H-02 FIXED] Static import — dynamic `await import()` inside handlers
// adds module-loading latency on every request.
import { logAdminAction, getIpFromRequest } from "@/lib/admin-logger";

const ToggleDriverSchema = z.object({
  driver_id: uuidSchema,
  is_active: booleanFromRequest,
});

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const parsed = parseRequest(ToggleDriverSchema, formDataToObject(formData));
  if (parsed.response) {
    return NextResponse.redirect(new URL("/dashboard/drivers?error=missing_id", request.url));
  }
  const { driver_id: driverId, is_active: isActive } = parsed.data;

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("toggle_driver_active", {
    p_driver_id: driverId,
    p_is_active: isActive,
  });

  if (error) {
    console.error("Toggle active error:", error);
    return NextResponse.redirect(new URL("/dashboard/drivers?error=toggle_failed", request.url));
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: "update",
    table_name: "users",
    record_id: driverId,
    // [INT-C-02 FIXED] old_data: state before toggle (inverse of the new value)
    old_data: { is_active: !isActive },
    new_data: { is_active: isActive },
    ip_address: getIpFromRequest(request),
  });

  return NextResponse.redirect(new URL("/dashboard/drivers", request.url));
});
