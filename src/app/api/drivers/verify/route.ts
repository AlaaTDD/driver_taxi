import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // ── Auth Guard ──────────────────────────────────────────────────────────────
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const driverId = formData.get("driver_id") as string;

  if (!driverId) {
    return NextResponse.redirect(new URL("/dashboard/drivers?error=missing_id", request.url));
  }

  const supabase = createAdminClient();

  const [{ error: profileError }, { error: userError }] = await Promise.all([
    supabase
    .from("drivers_profile")
    .update({ is_verified: true })
      .eq("id", driverId),
    supabase
      .from("users")
      .update({ is_active: true })
      .eq("id", driverId),
  ]);

  if (profileError || userError) {
    console.error("Verify driver error:", profileError || userError);
    return NextResponse.redirect(new URL("/dashboard/drivers?error=verify_failed", request.url));
  }

  const { logAdminAction, getIpFromRequest } = await import("@/lib/admin-logger");
  await logAdminAction({
    admin_id: guard.user.id,
    action: "verify",
    table_name: "drivers_profile",
    record_id: driverId,
    new_data: { is_verified: true, is_active: true },
    ip_address: getIpFromRequest(request),
  });

  return NextResponse.redirect(new URL("/dashboard/drivers", request.url));
}
