import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { formDataToObject, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";
// [WEB-H-02 FIXED] Static import — dynamic `await import()` inside handlers
// adds module-loading latency on every request.
import { logAdminAction, getIpFromRequest } from "@/lib/admin-logger";

const DriverIdSchema = z.object({
  driver_id: uuidSchema,
});

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const parsed = parseRequest(DriverIdSchema, formDataToObject(formData));
  if (parsed.response) {
    return NextResponse.redirect(new URL("/dashboard/drivers?error=missing_id", request.url));
  }
  const driverId = parsed.data.driver_id;

  const supabase = createAdminClient();

  // Direct updates via service_role client — bypasses the is_admin_user() check
  // inside unverify_driver / toggle_driver_active RPCs (auth.uid() is NULL with service_role).
  const { error } = await supabase
    .from("drivers_profile")
    .update({ is_verified: false, is_available: false })
    .eq("id", driverId);

  if (error) {
    console.error("Revoke driver error:", error);
    return NextResponse.redirect(new URL("/dashboard/drivers?error=revoke_failed", request.url));
  }

  // Deactivate the user account (is_active lives on users table).
  const { error: deactivateError } = await supabase
    .from("users")
    .update({ is_active: false })
    .eq("id", driverId);

  if (deactivateError) {
    console.error("Revoke driver — deactivate user error:", deactivateError);
    // is_verified was already cleared; log the partial failure but do not block redirect.
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: "revoke",
    table_name: "drivers_profile",
    record_id: driverId,
    // [INT-C-02 FIXED] old_data: state before revocation (was verified & active)
    old_data: { is_verified: true, is_active: true },
    new_data: { is_verified: false, is_available: false, is_active: false },
    ip_address: getIpFromRequest(request),
  });

  return NextResponse.redirect(new URL("/dashboard/drivers", request.url));
});
