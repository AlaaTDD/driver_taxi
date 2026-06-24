import { createAdminClient, createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { logAdminAction, getIpFromRequest, getUserAgentFromRequest } from "@/lib/admin-logger";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { formDataToObject, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";

const DriverIdSchema = z.object({
  driver_id: uuidSchema,
});

export const POST = safeHandler(async (request: Request) => {
  // ── Auth Guard ──────────────────────────────────────────────────────────────
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();

  // Optional redirect_back — validated to be a same-origin /dashboard/* path
  // to prevent open-redirect attacks. Lets the driver detail page send the admin
  // back to the detail view instead of the drivers list after verifying.
  const rawRedirectBack = formData.get("redirect_back")?.toString() ?? "";
  const safeRedirectBack = rawRedirectBack.startsWith("/dashboard/") ? rawRedirectBack : null;

  const parsed = parseRequest(DriverIdSchema, formDataToObject(formData));
  if (parsed.response) {
    return NextResponse.redirect(new URL("/dashboard/drivers?error=missing_id", request.url));
  }
  const driverId = parsed.data.driver_id;

  // [P0-01 FIXED] The RPC `admin_verify_driver` checks `is_admin_user()`, which
  // relies on `auth.uid()`. `auth.uid()` returns NULL under the service-role
  // client, so the RPC always raised `42501 unauthorized`. We now call it via
  // the session-scoped client so the admin's identity is preserved.
  // The admin client is still used for the read-only pre-fetch of old_data,
  // since reads here are not identity-scoped.
  const admin = createAdminClient();

  // Fetch true old_data BEFORE the mutation so the audit log is accurate.
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

  const { error: rpcError } = await supabase.rpc("admin_verify_driver", {
    p_driver_id: driverId,
  });

  if (rpcError) {
    console.error("Verify driver error:", rpcError);
    return NextResponse.redirect(new URL("/dashboard/drivers?error=verify_failed", request.url));
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: "verify",
    table_name: "drivers_profile",
    record_id: driverId,
    old_data: {
      is_verified: oldProfile?.is_verified ?? false,
      is_available: oldProfile?.is_available ?? false,
      is_active: oldUser?.is_active ?? false,
    },
    new_data: { is_verified: true, is_active: true },
    ip_address: getIpFromRequest(request),
    user_agent: getUserAgentFromRequest(request),
  });

  revalidatePath("/dashboard/drivers");
  revalidatePath("/dashboard/drivers/" + driverId);

  if (safeRedirectBack) {
    revalidatePath(safeRedirectBack);
    const sep = safeRedirectBack.includes("?") ? "&" : "?";
    return NextResponse.redirect(new URL(safeRedirectBack + sep + "success=driver_verified", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard/drivers?success=driver_verified&tab=approved", request.url));
});
