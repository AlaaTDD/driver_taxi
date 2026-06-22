import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { booleanFromRequest, safeHandler, parseRequest, uuidSchema, z } from "@/lib/api/validation";

const ToggleVehicleTypeSchema = z.object({
  id: uuidSchema,
  is_active: booleanFromRequest,
});

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const parsed = parseRequest(ToggleVehicleTypeSchema, await request.json());
    if (parsed.response) return parsed.response;
    const { id, is_active } = parsed.data;

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("vehicle_types")
      .update({ is_active: !!is_active })
      .eq("id", id);

    if (error) {
      console.error("Toggle vehicle type error:", error);
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
});
