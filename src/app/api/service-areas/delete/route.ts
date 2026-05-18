import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const supabase = createAdminClient();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("service_areas")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "حدث خطأ غير متوقع";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
