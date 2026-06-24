import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { logAdminAction, getIpFromRequest, getUserAgentFromRequest } from "@/lib/admin-logger";
import { nonEmptyString, optionalString, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";

const ResolveRevisionSchema = z.object({
  revision_id: uuidSchema,
  // Optional final outcome: "resolved" (accepted) or "rejected".
  status: z.enum(["resolved", "rejected"]).default("resolved"),
  note: optionalString(500),
});

/**
 * Closes a pending driver_revision_requests row.
 *
 * The table's RLS allows any admin (is_admin_user()) to UPDATE, and the
 * column `status` is a free varchar(20) defaulting to 'pending'. We set it to
 * 'resolved' (or 'rejected') and stamp `resolved_at`. This does NOT touch
 * drivers_profile / users — the calling admin uses the separate verify/revoke
 * buttons for that, so there is zero risk of conflicting mutations.
 */
export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const body = await request.json().catch(() => null);
  const parsed = parseRequest(ResolveRevisionSchema, body ?? {});
  if (parsed.response) return parsed.response;
  const { revision_id, status, note } = parsed.data;

  const admin = createAdminClient();

  // Capture the previous state for an accurate audit trail.
  const { data: oldRow } = await admin
    .from("driver_revision_requests")
    .select("id, driver_id, status")
    .eq("id", revision_id)
    .maybeSingle();

  if (!oldRow) {
    return NextResponse.json({ error: "Revision request not found" }, { status: 404 });
  }

  const { error } = await admin
    .from("driver_revision_requests")
    .update({
      status,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", revision_id);

  if (error) {
    console.error("Resolve revision error:", error);
    return NextResponse.json(
      { error: "Failed to resolve revision request" },
      { status: 500 },
    );
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: status === "rejected" ? "update" : "update",
    table_name: "driver_revision_requests",
    record_id: revision_id,
    old_data: { status: oldRow.status ?? "pending" },
    new_data: { status, note },
    ip_address: getIpFromRequest(request),
    user_agent: getUserAgentFromRequest(request),
  });

  revalidatePath("/dashboard/drivers");
  return NextResponse.json({ success: true });
});
