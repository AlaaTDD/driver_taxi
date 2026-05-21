import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const { id, is_active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID مطلوب" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("vehicle_types")
      .update({ is_active: !!is_active })
      .eq("id", id);

    if (error) {
      console.error("Toggle vehicle type error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Toggle vehicle type error:", error);
    return NextResponse.json(
      { error: "فشل تبديل حالة نوع المركبة" },
      { status: 500 }
    );
  }
}
