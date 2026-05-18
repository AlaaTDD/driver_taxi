import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // ── Auth Guard ──────────────────────────────────────────────────────────────
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const couponId = formData.get("coupon_id") as string;
  const isActive = formData.get("is_active") === "true";

  if (!couponId) {
    return NextResponse.redirect(new URL("/dashboard/coupons?error=missing_id", request.url));
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("coupons")
    .update({ is_active: isActive })
    .eq("id", couponId);

  if (error) {
    console.error("Toggle coupon error:", error);
    return NextResponse.redirect(new URL("/dashboard/coupons?error=toggle_failed", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard/coupons", request.url));
}
