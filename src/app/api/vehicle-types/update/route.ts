import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const display_name = formData.get("display_name") as string;
    const icon = formData.get("icon") as string;
    const base_fare = Number(formData.get("base_fare"));
    const price_per_km = Number(formData.get("price_per_km"));
    const sort_order = Number(formData.get("sort_order") || 0);

    if (!id || !display_name || !base_fare || !price_per_km) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("vehicle_types")
      .update({
        display_name,
        icon: icon || "directions_car",
        base_fare,
        price_per_km,
        sort_order,
      })
      .eq("id", id);

    if (error) {
      console.error("Update vehicle type error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update vehicle type error:", error);
    return NextResponse.json(
      { error: "فشل تحديث نوع المركبة" },
      { status: 500 }
    );
  }
}
