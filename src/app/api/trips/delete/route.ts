import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { logAdminAction, getIpFromRequest, getUserAgentFromRequest } from "@/lib/admin-logger";
import { NextResponse } from "next/server";
import { parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";

const DeleteTripSchema = z.object({
  trip_id: uuidSchema,
});

export const POST = safeHandler(async (req: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const parsed = parseRequest(DeleteTripSchema, await req.json());
  if (parsed.response) return parsed.response;
  const { trip_id } = parsed.data;

  const supabase = createAdminClient();

  const { data: trip, error: lookupError } = await supabase
    .from("trips")
    .select("id, status, user_id, driver_id, price, pickup_address, destination_address")
    .eq("id", trip_id)
    .maybeSingle();

  if (lookupError) {
    // [WEB-H-05 FIXED] Never expose internal DB error messages to client
    console.error("Trip lookup error:", lookupError);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }

  if (!trip) {
    return NextResponse.json({ error: "الرحلة غير موجودة" }, { status: 404 });
  }

  if (trip.status !== "cancelled") {
    return NextResponse.json(
      { error: "لا يمكن حذف رحلة غير ملغاة" },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", trip_id)
    .eq("status", "cancelled");

  if (error) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: "delete",
    table_name: "trips",
    record_id: trip_id,
    // [INT-C-02 FIXED] old_data: the full trip snapshot before deletion
    old_data: trip,
    ip_address: getIpFromRequest(req),
    user_agent: getUserAgentFromRequest(req),
  });

  return NextResponse.json({ success: true });
});
