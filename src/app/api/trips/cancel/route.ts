import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { trip_id, cancel_reason } = await req.json();
    if (!trip_id) {
      return NextResponse.json({ error: "trip_id مطلوب" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("trips")
      .update({
        status: "cancelled",
        cancel_reason: cancel_reason || "تم الإلغاء بواسطة الأدمن",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", trip_id)
      .in("status", ["searching", "accepted", "in_progress"]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
