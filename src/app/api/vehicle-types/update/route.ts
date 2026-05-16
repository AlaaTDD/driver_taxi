import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const { id, display_name, icon, base_fare, price_per_km, sort_order = 0 } = await request.json();

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
