import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { safeHandler, parseRequest, uuidSchema, z } from "@/lib/api/validation";

const DeleteVehicleTypeSchema = z.object({
  id: uuidSchema,
});

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const parsed = parseRequest(DeleteVehicleTypeSchema, await request.json());
    if (parsed.response) return parsed.response;
    const { id } = parsed.data;

    const supabase = createAdminClient();

    const { data: vehicleType, error: vehicleTypeError } = await supabase
      .from("vehicle_types")
      .select("name")
      .eq("id", id)
      .single();

    if (vehicleTypeError || !vehicleType) {
      return NextResponse.json(
        { error: "نوع المركبة غير موجود" },
        { status: 404 }
      );
    }

    const { count: tripsUsingType, error: tripsError } = await supabase
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("vehicle_type", vehicleType.name);

    if (tripsError) {
      console.error("Check vehicle type usage error:", tripsError);
      // [WEB-H-05 FIXED] Never expose internal DB error messages to client
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }

    if ((tripsUsingType ?? 0) > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف هذا النوع لأنه مستخدم في رحلات سابقة" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("vehicle_types")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete vehicle type error:", error);
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
});
