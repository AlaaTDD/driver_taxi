import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const { name, display_name, icon, base_fare, price_per_km, sort_order = 0 } = await request.json();

    if (!name || !display_name || !base_fare || !price_per_km) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      return NextResponse.json(
        { error: "الاسم التقني يجب أن يبدأ بحرف صغير ويحتوي على حروف وأرقام وشرطات سفلية فقط" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    
    const { data: existing } = await supabase
      .from("vehicle_types")
      .select("id")
      .eq("name", name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "هذا الاسم التقني مستخدم بالفعل" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("vehicle_types").insert({
      name,
      display_name,
      icon: icon || "directions_car",
      base_fare,
      price_per_km,
      sort_order,
      is_active: true,
    });

    if (error) {
      console.error("Create vehicle type error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create vehicle type error:", error);
    return NextResponse.json(
      { error: "فشل إنشاء نوع المركبة" },
      { status: 500 }
    );
  }
}
