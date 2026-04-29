import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { user_id, coupon_id } = await req.json();
    if (!user_id || !coupon_id) {
      return NextResponse.json({ error: "user_id و coupon_id مطلوبين" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check if coupon exists and is active
    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .select("id, is_active, max_uses, used_count")
      .eq("id", coupon_id)
      .single();

    if (couponError || !coupon) {
      return NextResponse.json({ error: "الكوبون غير موجود" }, { status: 404 });
    }
    if (!coupon.is_active) {
      return NextResponse.json({ error: "الكوبون معطل" }, { status: 400 });
    }
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ error: "الكوبون وصل الحد الأقصى للاستخدام" }, { status: 400 });
    }

    // Assign coupon to user
    const { error } = await supabase
      .from("user_coupons")
      .insert({ user_id, coupon_id, is_used: false });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "الكوبون معين بالفعل لهذا المستخدم" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
