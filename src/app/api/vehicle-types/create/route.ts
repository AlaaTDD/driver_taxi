import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const display_name = formData.get("display_name") as string;
    const icon = formData.get("icon") as string;
    const base_fare = Number(formData.get("base_fare"));
    const price_per_km = Number(formData.get("price_per_km"));
    const sort_order = Number(formData.get("sort_order") || 0);

    if (!name || !display_name || !base_fare || !price_per_km) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    // Validate name format
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      return NextResponse.json(
        { error: "الاسم التقني يجب أن يبدأ بحرف صغير ويحتوي على حروف وأرقام وشرطات سفلية فقط" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if name already exists
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
