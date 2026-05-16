import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    let trip_id, cancel_reason;
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      const body = await req.json();
      trip_id = body.trip_id;
      cancel_reason = body.cancel_reason;
    } else {
      const formData = await req.formData();
      trip_id = formData.get("trip_id");
      cancel_reason = formData.get("cancel_reason");
    }

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

    if (contentType.includes("application/json")) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.redirect(new URL(`/dashboard/trips/${trip_id}`, req.url));
    }
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
