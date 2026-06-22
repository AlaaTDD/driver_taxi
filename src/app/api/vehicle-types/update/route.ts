import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { integerRange, moneyAmount, nonEmptyString, optionalString, safeHandler, parseRequest, uuidSchema, z } from "@/lib/api/validation";

const UpdateVehicleTypeSchema = z.object({
  id: uuidSchema,
  display_name: nonEmptyString(80),
  icon: optionalString(80),
  base_fare: moneyAmount(100_000),
  price_per_km: moneyAmount(100_000),
  sort_order: integerRange(0, 10_000).default(0),
});

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const parsed = parseRequest(UpdateVehicleTypeSchema, await request.json());
    if (parsed.response) return parsed.response;
    const { id, display_name, icon, base_fare, price_per_km, sort_order } = parsed.data;

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("vehicle_types")
      .update({
        display_name,
        icon: icon || "directions_car",
        base_fare,
        price_per_km,
        sort_order,
      })
      .eq("id", id);

    if (error) {
      console.error("Update vehicle type error:", error);
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
});
