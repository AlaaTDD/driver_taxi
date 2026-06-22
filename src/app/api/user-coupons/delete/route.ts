import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { safeHandler, parseRequest, uuidSchema, z } from "@/lib/api/validation";

const DeleteUserCouponSchema = z.object({
  id: uuidSchema,
});

export const POST = safeHandler(async (req: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const parsed = parseRequest(DeleteUserCouponSchema, await req.json());
    if (parsed.response) return parsed.response;
    const { id } = parsed.data;

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("user_coupons")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  // [WEB-H-05 FIXED] catch removed — safeHandler handles uncaught errors
});
