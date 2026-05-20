import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-logger";

export async function POST(request: Request) {
  // ── Auth Guard ──────────────────────────────────────────────────────────────
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;
  const adminUser = guard;

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("_fn_sync_pricing_from_vehicle_types");

  if (error) {
    console.error("Pricing Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log admin action
  await logAdminAction({
    admin_id: adminUser.user.id,
    action: "update",
    table_name: "pricing",
    details: { sync_triggered: true },
    ip_address: request.headers.get("x-forwarded-for") || undefined,
  });

  return NextResponse.json({ success: true });
}
