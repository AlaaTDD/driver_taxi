import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { booleanFromRequest, safeHandler, parseRequest, uuidSchema, z } from "@/lib/api/validation";

const ToggleBonusSchema = z.object({
  id: uuidSchema,
  is_active: booleanFromRequest,
});

export const POST = safeHandler(async (req: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const supabase = createAdminClient();
    const parsed = parseRequest(ToggleBonusSchema, await req.json());
    if (parsed.response) return parsed.response;
    const { id, is_active } = parsed.data;

    const { error } = await supabase
      .from("bonus_rules")
      .update({ is_active: !!is_active })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  // [WEB-H-05 FIXED] catch removed — safeHandler catches & logs all uncaught errors
});
