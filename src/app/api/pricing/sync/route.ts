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

  // Fetch all vehicle types
  const { data: vehicleTypes, error: fetchError } = await supabase
    .from("vehicle_types")
    .select("name, base_fare, price_per_km");

  if (fetchError) {
    console.error("Pricing Sync Fetch Error:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (vehicleTypes && vehicleTypes.length > 0) {
    // Upsert into pricing_config
    const upsertData = vehicleTypes.map((vt) => ({
      vehicle_type: vt.name,
      base_fare: vt.base_fare,
      price_per_km: vt.price_per_km,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from("pricing_config")
      .upsert(upsertData, { onConflict: "vehicle_type" });

    if (upsertError) {
      console.error("Pricing Sync Upsert Error:", upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
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
