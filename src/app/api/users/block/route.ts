import { createClient, createAuthAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { logAdminAction, getIpFromRequest, getUserAgentFromRequest } from "@/lib/admin-logger";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { formDataToObject, optionalString, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";

const BlockUserSchema = z.object({
  user_id: uuidSchema,
  action: z.enum(["block", "unblock"]),
  reason: optionalString(500),
});

export const POST = safeHandler(async (request: Request) => {
  // ── Auth Guard ──────────────────────────────────────────────────────────────
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const parsed = parseRequest(BlockUserSchema, formDataToObject(formData));
  if (parsed.response) return parsed.response;
  const { user_id: userId, action, reason } = parsed.data;

  // M-05 FIX: An admin must not block themselves – that would immediately
  // lock them out of all admin endpoints (requireAdmin checks is_blocked).
  if (guard.user.id === userId) {
    return NextResponse.json({ error: "لا يمكن حجب حسابك بنفسك" }, { status: 403 });
  }

  const supabase = await createClient();

  if (action === "block") {
    const { error } = await supabase.rpc("block_user", {
      p_user_id: userId,
      p_reason: reason || null,
    });
    if (error) throw error;
  } else if (action === "unblock") {
    const { error } = await supabase.rpc("unblock_user", {
      p_user_id: userId,
    });
    if (error) throw error;
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: action === "block" ? "block" : "unblock",
    table_name: "users",
    record_id: userId,
    // [INT-C-02 FIXED] old_data: the state before this admin action
    old_data: { is_blocked: action !== "block" },
    new_data: { is_blocked: action === "block", reason },
    ip_address: getIpFromRequest(request),
    user_agent: getUserAgentFromRequest(request),
  });

  // [WEB-H-03 FIXED] Sync is_blocked to app_metadata so requireAdmin() can
  // trust the JWT claim without a second DB round-trip.
  try {
    const authAdmin = createAuthAdminClient();
    await authAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { is_blocked: action === "block" },
    });
  } catch (metaErr) {
    console.warn("block: app_metadata sync failed (non-fatal):", metaErr);
  }

  revalidatePath("/dashboard/users");
  return NextResponse.json({ success: true });
});
