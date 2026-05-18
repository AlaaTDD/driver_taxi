import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID مطلوب" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: vehicleType, error: vehicleTypeError } = await supabase
      .from("vehicle_types")
      .select("name")
      .eq("id", id)
      .single();

    if (vehicleTypeError || !vehicleType) {
      return NextResponse.json(
        { error: "نوع المركبة غير موجود" },
        { status: 404 }
      );
    }

    const { count: tripsUsingType, error: tripsError } = await supabase
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("vehicle_type", vehicleType.name);

    if (tripsError) {
      console.error("Check vehicle type usage error:", tripsError);
      return NextResponse.json({ error: tripsError.message }, { status: 500 });
    }

    if ((tripsUsingType ?? 0) > 0) {
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
