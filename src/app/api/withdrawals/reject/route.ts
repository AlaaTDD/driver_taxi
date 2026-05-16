import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // ── Auth Guard ──────────────────────────────────────────────────────────────
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const requestId = formData.get("request_id") as string;
  const reason = (formData.get("reason") as string) || "تم الرفض من قبل الإدارة";

  if (!requestId) {
    return NextResponse.redirect(new URL("/dashboard/withdrawals?error=missing_id", request.url));
  }

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("reject_withdrawal", {
    p_withdrawal_id: requestId,
    p_admin_id: guard.user.id,
    p_rejection_reason: reason
  });

  if (error) {
    console.error("Reject withdrawal error:", error);
  }

  return NextResponse.redirect(new URL("/dashboard/withdrawals", request.url));
}
