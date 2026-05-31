import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { nonEmptyString, safeHandler, parseRequest, uuidSchema, z } from "@/lib/api/validation";

const RequestRevisionSchema = z.object({
  driver_id: uuidSchema,
  fields: z.array(nonEmptyString(80)).min(1).max(20),
  message: nonEmptyString(1000),
});

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const parsed = parseRequest(RequestRevisionSchema, await request.json());
    if (parsed.response) return parsed.response;
    const { driver_id, fields, message } = parsed.data;

    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("request_driver_revision", {
      p_driver_id: driver_id,
      p_fields: fields,
      p_message: message,
    });

    if (error) throw error;

    revalidatePath("/dashboard/drivers");
    return NextResponse.json({ success: true, revision_id: data });
  // [WEB-H-05 FIXED] catch removed — safeHandler handles uncaught errors
});
