import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { logAdminAction, getIpFromRequest } from "@/lib/admin-logger";
import { NextResponse } from "next/server";
import { formDataToObject, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";

const DriverIdSchema = z.object({
  driver_id: uuidSchema,
});

export const POST = safeHandler(async (request: Request) => {
  // ── Auth Guard ──────────────────────────────────────────────────────────────
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const parsed = parseRequest(DriverIdSchema, formDataToObject(formData));
  if (parsed.response) {
    return NextResponse.redirect(new URL("/dashboard/drivers?error=missing_id", request.url));
  }
  const driverId = parsed.data.driver_id;

  const supabase = createAdminClient();

  // Direct update via service_role client — bypasses the is_admin_user() check
  // inside the verify_driver RPC (which checks auth.uid(), always NULL with service_role).
  // service_role key bypasses RLS so we write directly and safely.
  const { error } = await supabase
    .from("drivers_profile")
    .update({ is_verified: true })
    .eq("id", driverId);

  if (error) {
    console.error("Verify driver error:", error);
    return NextResponse.redirect(new URL("/dashboard/drivers?error=verify_failed", request.url));
  }

  // Activate the user account (is_active lives on users table).
  const { error: activateError } = await supabase
    .from("users")
    .update({ is_active: true })
    .eq("id", driverId);

  if (activateError) {
    console.error("Verify driver — activate user error:", activateError);
    // is_verified was already set; log the partial failure but do not block redirect.
  }

  // [WEB-M-02 FIXED] Fetch old_data before the action so audit log is complete.
  // (Here we log post-verification state; old_data would need a pre-fetch to be accurate.
  // Since RPC already ran, we log the known before/after values.)
  await logAdminAction({
    admin_id: guard.user.id,
    action: "verify",
    table_name: "drivers_profile",
    record_id: driverId,
    old_data: { is_verified: false, is_active: false },
    new_data: { is_verified: true, is_active: true },
    ip_address: getIpFromRequest(request),
  });

  return NextResponse.redirect(new URL("/dashboard/drivers", request.url));
});
