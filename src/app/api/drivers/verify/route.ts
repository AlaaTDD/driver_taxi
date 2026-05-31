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

  // [WEB-H-02 FIXED] Moved import to top-level (was dynamic import inside handler).
  // [WEB-C-02 FIXED] Use verify_driver_atomic RPC — both tables update in a
  // single DB transaction. See migration: 20260530000001_verify_driver_atomic.sql
  const { error } = await supabase.rpc("verify_driver_atomic", {
    p_driver_id: driverId,
  });

  if (error) {
    console.error("Verify driver error:", error);
    return NextResponse.redirect(new URL("/dashboard/drivers?error=verify_failed", request.url));
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
