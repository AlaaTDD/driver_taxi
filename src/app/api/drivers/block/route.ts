import { createAdminClient, createClient, createAuthAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { logAdminAction, getIpFromRequest, getUserAgentFromRequest } from "@/lib/admin-logger";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { formDataToObject, optionalString, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";

const BlockDriverSchema = z.object({
  driver_id: uuidSchema,
  action: z.enum(["block", "unblock"]),
  reason: optionalString(500),
});

/**
 * Blocks / unblocks a driver from the drivers dashboard.
 *
 * This is a thin wrapper around the existing `block_user` / `unblock_user`
 * RPCs (the same ones the users page uses) — it does NOT introduce a new
 * mutation path. It mirrors the app_metadata sync done in
 * /api/users/block so requireAdmin()'s JWT pre-check stays accurate, and
 * redirects back to the drivers page so it works with plain HTML forms.
 *
 * The `driver_id` field is the users.id (= drivers_profile.id, shared PK),
 * which is exactly what block_user / unblock_user expect.
 *
 * Optional `redirect_back` form field: if present and starts with /dashboard/,
 * the response redirects there instead of the default drivers list. Used by
 * the driver detail page (/dashboard/drivers/[id]) so the admin stays on the
 * detail view after blocking/unblocking.
 */
export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();

  // Optional redirect_back — validated to be a same-origin /dashboard/* path
  // to prevent open-redirect attacks.
  const rawRedirectBack = formData.get("redirect_back")?.toString() ?? "";
  const safeRedirectBack = rawRedirectBack.startsWith("/dashboard/") ? rawRedirectBack : null;

  const parsed = parseRequest(BlockDriverSchema, formDataToObject(formData));
  if (parsed.response) {
    return NextResponse.redirect(
      new URL("/dashboard/drivers?error=missing_id", request.url),
    );
  }
  const { driver_id: driverId, action, reason } = parsed.data;

  // An admin must not block themselves (would lock them out).
  if (guard.user.id === driverId) {
    return NextResponse.redirect(
      new URL("/dashboard/drivers?error=block_failed", request.url),
    );
  }

  const admin = createAdminClient();

  // Capture true old_data before mutation.
  const { data: oldUser } = await admin
    .from("users")
    .select("is_blocked, role")
    .eq("id", driverId)
    .maybeSingle();

  const supabase = await createClient();

  if (action === "block") {
    const { error } = await supabase.rpc("block_user", {
      p_user_id: driverId,
      p_reason: reason || null,
    });
    if (error) {
      console.error("Block driver error:", error);
      return NextResponse.redirect(
        new URL("/dashboard/drivers?error=block_failed", request.url),
      );
    }
  } else {
    // unblock_user raises 'admin_only' if auth.uid() is missing — it must run on
    // the session client (same as block_user above and /api/users/block), not the
    // service-role client, which has no cookies/session so auth.uid() is NULL there.
    const { error } = await supabase.rpc("unblock_user", { p_user_id: driverId });
    if (error) {
      console.error("Unblock driver error:", error);
      return NextResponse.redirect(
        new URL("/dashboard/drivers?error=unblock_failed", request.url),
      );
    }
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: action === "block" ? "block" : "unblock",
    table_name: "users",
    record_id: driverId,
    old_data: { is_blocked: oldUser?.is_blocked ?? false },
    new_data: { is_blocked: action === "block", reason },
    ip_address: getIpFromRequest(request),
    user_agent: getUserAgentFromRequest(request),
  });

  // Best-effort sync of is_blocked into app_metadata (matches /api/users/block).
  try {
    const authAdmin = createAuthAdminClient();
    await authAdmin.auth.admin.updateUserById(driverId, {
      app_metadata: { is_blocked: action === "block" },
    });
  } catch (metaErr) {
    console.warn("drivers/block: app_metadata sync failed (non-fatal):", metaErr);
  }

  revalidatePath("/dashboard/drivers");
  revalidatePath("/dashboard/drivers/" + driverId);

  const successParam = action === "block" ? "driver_blocked" : "driver_unblocked";

  if (safeRedirectBack) {
    revalidatePath(safeRedirectBack);
    const sep = safeRedirectBack.includes("?") ? "&" : "?";
    return NextResponse.redirect(new URL(safeRedirectBack + sep + "success=" + successParam, request.url));
  }

  return NextResponse.redirect(
    new URL("/dashboard/drivers?success=" + successParam, request.url),
  );
});
