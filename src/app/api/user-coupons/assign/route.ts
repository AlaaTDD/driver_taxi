import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const { user_id, coupon_id } = await req.json();
    if (!user_id || !coupon_id) {
      return NextResponse.json({ error: "user_id و coupon_id مطلوبين" }, { status: 400 });
    }

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
