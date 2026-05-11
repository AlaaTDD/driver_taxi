import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const requestId = formData.get("request_id") as string;
  const reason = (formData.get("reason") as string) || "تم الرفض من قبل الإدارة";

  if (!requestId) {
    return NextResponse.redirect(new URL("/dashboard/withdrawals?error=missing_id", request.url));
  }

  const supabase = createAdminClient();
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  const { error } = await supabase
    .from("withdrawal_requests")
    .update({
      status: "rejected",
      admin_id: user?.id || null,
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) {
    console.error("Reject withdrawal error:", error);
  }

  return NextResponse.redirect(new URL("/dashboard/withdrawals", request.url));
}
