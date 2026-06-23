import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { integerRange, moneyAmount, nonEmptyString, optionalString, safeHandler, parseRequest, z } from "@/lib/api/validation";

const VehicleTypeNameSchema = z.string().trim().regex(/^[a-z][a-z0-9_]{1,39}$/);
const CreateVehicleTypeSchema = z.object({
  name: VehicleTypeNameSchema,
  display_name: nonEmptyString(80),
  icon: optionalString(80),
  base_fare: moneyAmount(100_000),
  price_per_km: moneyAmount(100_000),
  sort_order: integerRange(0, 10_000).default(0),
});

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const parsed = parseRequest(CreateVehicleTypeSchema, await request.json());
    if (parsed.response) return parsed.response;
    const { name, display_name, icon, base_fare, price_per_km, sort_order } = parsed.data;

    const supabase = createAdminClient();

    // [P0-12 FIXED] Dropped the SELECT-then-INSERT race. Two concurrent
    // requests could both pass the `existing` check and then both attempt
    // INSERT. We now rely on the DB unique constraint on vehicle_types.name:
    // 23505 → 409 conflict; everything else → 500. This is both faster
    // (one query instead of two) and race-free.
    const { error } = await supabase.from("vehicle_types").insert({
      name,
      display_name,
      icon: icon || "directions_car",
      base_fare,
      price_per_km,
      sort_order,
      is_active: true,
    });

    if (error) {
      console.error("Create vehicle type error:", error);
      // 23505 = unique_violation. PostgREST exposes the code on the error obj.
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "هذا الاسم التقني مستخدم بالفعل" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
});
