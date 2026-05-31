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

  // [WEB-revoke FIXED] Use revoke_driver_atomic RPC — both tables (drivers_profile
  // + users) update inside a single DB transaction. Previously Promise.all() ran
  // two independent queries; if the second failed the driver would be unverified
  // but their account would remain active.
  // See migration: 20260530000003_revoke_driver_atomic.sql
  const { error } = await supabase.rpc("revoke_driver_atomic", {
    p_driver_id: driverId,
  });

  if (error) {
    console.error("Revoke driver error:", error);
    return NextResponse.redirect(new URL("/dashboard/drivers?error=revoke_failed", request.url));
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
