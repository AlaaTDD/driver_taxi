import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { booleanFromRequest, formDataToObject, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";

const ToggleCouponSchema = z.object({
  coupon_id: uuidSchema,
  is_active: booleanFromRequest,
});

export const POST = safeHandler(async (request: Request) => {
  // ── Auth Guard ──────────────────────────────────────────────────────────────
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const parsed = parseRequest(ToggleCouponSchema, formDataToObject(formData));
  if (parsed.response) {
    return NextResponse.redirect(new URL("/dashboard/coupons?error=missing_id", request.url));
  }
  const { coupon_id: couponId, is_active: isActive } = parsed.data;

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
});
