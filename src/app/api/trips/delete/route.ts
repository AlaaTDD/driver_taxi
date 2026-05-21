import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const { trip_id } = await req.json();
    if (!trip_id) {
      return NextResponse.json({ error: "trip_id مطلوب" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("id", trip_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { logAdminAction, getIpFromRequest } = await import("@/lib/admin-logger");
    await logAdminAction({
      admin_id: guard.user.id,
      action: "delete",
      table_name: "trips",
      record_id: trip_id,
      ip_address: getIpFromRequest(req),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
