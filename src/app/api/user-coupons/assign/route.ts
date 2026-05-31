import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { safeHandler, parseRequest, uuidSchema, z } from "@/lib/api/validation";

const AssignUserCouponSchema = z.object({
  user_id: uuidSchema,
  coupon_id: uuidSchema,
});

export const POST = safeHandler(async (req: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const parsed = parseRequest(AssignUserCouponSchema, await req.json());
    if (parsed.response) return parsed.response;
    const { user_id, coupon_id } = parsed.data;

    const supabase = createAdminClient();

    const { error } = await supabase.rpc("admin_assign_user_coupon", {
      p_user_id: user_id,
      p_coupon_id: coupon_id,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "الكوبون معين بالفعل لهذا المستخدم" }, { status: 409 });
      }
      if (error.code === "42883") {
        return NextResponse.json({ error: "دالة تعيين الكوبون الآمنة غير مثبتة" }, { status: 500 });
      }
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  // [WEB-H-05 FIXED] catch removed — safeHandler handles uncaught errors
});
