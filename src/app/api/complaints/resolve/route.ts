import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { complaintStatusSchema, nonEmptyString, safeHandler, parseRequest, uuidSchema, z } from "@/lib/api/validation";

const ResolveComplaintSchema = z.object({
  complaint_id: uuidSchema,
  reply: nonEmptyString(2000),
  status: complaintStatusSchema.default("resolved"),
});

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const parsed = parseRequest(ResolveComplaintSchema, await request.json());
    if (parsed.response) return parsed.response;
    const { complaint_id, reply, status } = parsed.data;

    const supabase = createAdminClient();

    const { error } = await supabase.rpc("resolve_complaint", {
      p_complaint_id: complaint_id,
      p_reply: reply,
      p_status: status,
    });

    if (error) throw error;

    revalidatePath("/dashboard/complaints");
    revalidatePath(`/dashboard/complaints/${complaint_id}`);
    return NextResponse.json({ success: true });
  // [WEB-H-05 FIXED] catch removed — safeHandler handles uncaught errors
});
