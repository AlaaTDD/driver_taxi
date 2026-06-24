import { createAdminClient, createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { formDataToObject, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";
// [WEB-H-02 FIXED] Static import — dynamic `await import()` inside handlers
// adds module-loading latency on every request.
import { logAdminAction, getIpFromRequest, getUserAgentFromRequest } from "@/lib/admin-logger";

const DriverIdSchema = z.object({
  driver_id: uuidSchema,
});

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();

  // Optional redirect_back — validated to be a same-origin /dashboard/* path
  // to prevent open-redirect attacks. Lets the driver detail page send the admin
  // back to the detail view instead of the drivers list after revoking.
  const rawRedirectBack = formData.get("redirect_back")?.toString() ?? "";
  const safeRedirectBack = rawRedirectBack.startsWith("/dashboard/") ? rawRedirectBack : null;

  const parsed = parseRequest(DriverIdSchema, formDataToObject(formData));
  if (parsed.response) {
    return NextResponse.redirect(new URL("/dashboard/drivers?error=missing_id", request.url));
  }
  const driverId = parsed.data.driver_id;

  // [P0-01 FIXED] Same fix as verify/route.ts: admin_revoke_driver checks
  // is_admin_user() -> auth.uid(), so it MUST be called via the session client.
  const admin = createAdminClient();

  // Fetch true old_data BEFORE the mutation for an accurate audit log.
  const { data: oldProfile } = await admin
    .from("drivers_profile")
    .select("is_verified, is_available")
    .eq("id", driverId)
    .maybeSingle();
  const { data: oldUser } = await admin
    .from("users")
    .select("is_active")
    .eq("id", driverId)
    .maybeSingle();

  const supabase = await createClient();

  const { error: rpcError } = await supabase.rpc("admin_revoke_driver", {
    p_driver_id: driverId,
  });

  if (rpcError) {
    console.error("Revoke driver error:", rpcError);
    return NextResponse.redirect(new URL("/dashboard/drivers?error=revoke_failed", request.url));
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: "revoke",
    table_name: "drivers_profile",
    record_id: driverId,
    old_data: {
      is_verified: oldProfile?.is_verified ?? true,
      is_available: oldProfile?.is_available ?? true,
      is_active: oldUser?.is_active ?? true,
    },
    new_data: { is_verified: false, is_available: false, is_active: false },
    ip_address: getIpFromRequest(request),
    user_agent: getUserAgentFromRequest(request),
  });

  revalidatePath("/dashboard/drivers");
  revalidatePath("/dashboard/drivers/" + driverId);

  if (safeRedirectBack) {
    revalidatePath(safeRedirectBack);
    const sep = safeRedirectBack.includes("?") ? "&" : "?";
    return NextResponse.redirect(new URL(safeRedirectBack + sep + "success=driver_revoked", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard/drivers?success=driver_revoked&tab=pending", request.url));
});
