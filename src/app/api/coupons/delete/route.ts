import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { formDataToObject, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";

const CouponIdSchema = z.object({
  coupon_id: uuidSchema,
});

export const POST = safeHandler(async (request: Request) => {
  // ── Auth Guard ──────────────────────────────────────────────────────────────
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const parsed = parseRequest(CouponIdSchema, formDataToObject(formData));
  if (parsed.response) {
    return NextResponse.redirect(new URL("/dashboard/coupons?error=missing_id", request.url));
  }
  const couponId = parsed.data.coupon_id;

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", couponId);

  if (error) {
    console.error("Delete coupon error:", error);
    return NextResponse.redirect(new URL("/dashboard/coupons?error=delete_failed", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard/coupons", request.url));
});
