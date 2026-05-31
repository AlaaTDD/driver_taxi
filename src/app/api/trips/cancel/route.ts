import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { logAdminAction, getIpFromRequest } from "@/lib/admin-logger";
import { NextResponse } from "next/server";
import { formDataToObject, optionalString, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";

const CancelTripSchema = z.object({
  trip_id: uuidSchema,
  cancel_reason: optionalString(500),
});

// [WEB-C-03 FIXED] Wrapped with safeHandler for consistent error handling.
// [WEB-H-02 FIXED] Moved admin-logger to static import (was dynamic inside handler).
export const POST = safeHandler(async (req: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const contentType = req.headers.get("content-type") || "";
  const rawBody = contentType.includes("application/json")
    ? await req.json()
    : formDataToObject(await req.formData());
  const parsed = parseRequest(CancelTripSchema, rawBody);
  if (parsed.response) return parsed.response;
  const { trip_id, cancel_reason } = parsed.data;

  const supabase = createAdminClient();

  // [INT-C-02 FIXED] Fetch trip status before cancel so audit log has old_data.
  const { data: oldTrip } = await supabase
    .from("trips")
    .select("id, status, driver_id")
    .eq("id", trip_id)
    .maybeSingle();

  const { error } = await supabase.rpc("cancel_trip", {
    p_trip_id: trip_id,
    p_reason: cancel_reason || "تم الإلغاء بواسطة الأدمن",
  });

  if (error) {
    console.error("Cancel trip RPC error:", error);
    const message = "الرحلة غير موجودة أو لا يمكن إلغاؤها";
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.redirect(new URL(`/dashboard/trips/${trip_id}?error=not_cancellable`, req.url));
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: "update",
    table_name: "trips",
    record_id: trip_id,
    old_data: oldTrip ?? undefined,
    new_data: { status: "cancelled", cancel_reason },
    ip_address: getIpFromRequest(req),
  });

  if (contentType.includes("application/json")) {
    return NextResponse.json({ success: true, id: trip_id });
  }
  return NextResponse.redirect(new URL(`/dashboard/trips/${trip_id}`, req.url));
});
