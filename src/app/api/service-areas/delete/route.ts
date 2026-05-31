import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { safeHandler, parseRequest, uuidSchema, z } from "@/lib/api/validation";

const DeleteServiceAreaSchema = z.object({
  id: uuidSchema,
});

export const DELETE = safeHandler(async (req: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const supabase = createAdminClient();
    const parsed = parseRequest(DeleteServiceAreaSchema, await req.json());
    if (parsed.response) return parsed.response;
    const { id } = parsed.data;

    const { error } = await supabase
      .from("service_areas")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  // [WEB-H-05 FIXED] catch removed — safeHandler catches & logs all uncaught errors
  // and returns a generic "Internal server error" without leaking internals.
});
