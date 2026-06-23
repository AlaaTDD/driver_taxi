import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { logAdminAction, getIpFromRequest, getUserAgentFromRequest } from "@/lib/admin-logger";
import { formDataToObject, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";

const ApproveSchema = z.object({
  request_id: uuidSchema,
});

function redirect(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const parsed = parseRequest(ApproveSchema, formDataToObject(formData));
  if (parsed.response) {
    return redirect(request, "/dashboard/withdrawals?error=missing_id");
  }
  const { request_id: requestId } = parsed.data;

  // approve_withdrawal checks public.is_admin_user(), which depends on
  // auth.uid(); call it with the admin session, not the service role key.
  const supabase = await createClient();

  const { error } = await supabase.rpc("approve_withdrawal", {
    p_withdrawal_id: requestId,
    p_admin_id: guard.user.id
  });

  if (error) {
    console.error("Approve withdrawal error:", error);
    const msg = String(error.message || "");
    const code = msg.includes("unauthorized")
      ? "unauthorized"
      : msg.includes("not pending")
        ? "not_pending"
        : "approve_failed";
    return redirect(request, `/dashboard/withdrawals?error=${code}`);
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: "update",
    table_name: "withdrawal_requests",
    record_id: requestId,
    // [INT-C-02 FIXED] old_data: approve_withdrawal RPC only runs on pending requests
    old_data: { status: "pending" },
    new_data: { status: "approved", approved_by: guard.email },
    ip_address: getIpFromRequest(request),
    user_agent: getUserAgentFromRequest(request),
  });

  return redirect(request, "/dashboard/withdrawals?success=withdrawal_approved");
});
