import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID مطلوب" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check if this type is used in any trips
    const { data: tripsUsingType } = await supabase
      .from("trips")
      .select("id", { count: "exact" })
      .eq("vehicle_type", id)
      .limit(1);

    if (tripsUsingType && tripsUsingType.length > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف هذا النوع لأنه مستخدم في رحلات سابقة" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("vehicle_types")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete vehicle type error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete vehicle type error:", error);
    return NextResponse.json(
      { error: "فشل حذف نوع المركبة" },
      { status: 500 }
    );
  }
}
