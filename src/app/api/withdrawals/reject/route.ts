import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-logger";
import { formDataToObject, nonEmptyString, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";

const RejectSchema = z.object({
  request_id: uuidSchema,
  reason: nonEmptyString(500).refine((v) => v.length >= 3, "Reason must be at least 3 characters"),
});

function redirect(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const parsed = parseRequest(RejectSchema, formDataToObject(formData));
  if (parsed.response) {
    return redirect(request, "/dashboard/withdrawals?error=invalid_params");
  }
  const { request_id: requestId, reason } = parsed.data;

  // reject_withdrawal checks public.is_admin_user(), which depends on
  // auth.uid(); call it with the admin session, not the service role key.
  const supabase = await createClient();

  const { error } = await supabase.rpc("reject_withdrawal", {
    p_withdrawal_id: requestId,
    p_admin_id: guard.user.id,
    p_rejection_reason: reason
  });

  if (error) {
    console.error("Reject withdrawal error:", error);
    const msg = String(error.message || "");
    const code = msg.includes("unauthorized")
      ? "unauthorized"
      : msg.includes("not pending")
        ? "not_pending"
        : "reject_failed";
    return redirect(request, `/dashboard/withdrawals?error=${code}`);
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: "update",
    table_name: "withdrawal_requests",
    record_id: requestId,
    // [INT-C-02 FIXED] old_data: reject_withdrawal RPC only runs on pending requests
    old_data: { status: "pending" },
    new_data: { status: "rejected", rejected_by: guard.email, reason },
    ip_address: request.headers.get("x-forwarded-for") || undefined,
  });

  return redirect(request, "/dashboard/withdrawals?success=withdrawal_rejected");
});
