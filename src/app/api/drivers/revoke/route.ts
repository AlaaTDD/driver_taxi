import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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
      .update({ is_verified: false, is_available: false })
      .eq("id", driverId),
    supabase
      .from("users")
      .update({ is_active: false })
      .eq("id", driverId),
  ]);

  if (profileError || userError) {
    console.error("Revoke driver error:", profileError || userError);
    return NextResponse.redirect(new URL("/dashboard/drivers?error=revoke_failed", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard/drivers", request.url));
}
