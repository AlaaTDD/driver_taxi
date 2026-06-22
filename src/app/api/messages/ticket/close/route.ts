import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { safeHandler, parseRequest, uuidSchema, z } from "@/lib/api/validation";

const CloseTicketSchema = z.object({
  ticket_id: uuidSchema,
});

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const supabase = createAdminClient();
    const parsed = parseRequest(CloseTicketSchema, await request.json());
    if (parsed.response) return parsed.response;
    const { ticket_id } = parsed.data;

    const { error } = await supabase
      .from("support_tickets")
      .update({ status: "closed" })
      .eq("id", ticket_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
});
