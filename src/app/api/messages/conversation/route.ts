import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { messageTypeSchema, safeHandler, parseRequest, uuidSchema, z } from "@/lib/api/validation";

const ConversationQuerySchema = z.object({
  type: messageTypeSchema,
  id: uuidSchema,
});

export const GET = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const { searchParams } = new URL(request.url);
  const parsed = parseRequest(ConversationQuerySchema, {
    type: searchParams.get("type"),
    id: searchParams.get("id"),
  });
  if (parsed.response) return parsed.response;
  const { type, id } = parsed.data;

  const supabase = createAdminClient();

    if (type === "support") {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*, users!support_messages_user_id_fkey(name)")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return NextResponse.json({ messages: data });
    } else if (type === "trip") {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("trip_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch user info for sender/receiver
      const userIds = [...new Set(data.flatMap(m => [m.sender_id, m.receiver_id]).filter(Boolean))];
      let userMap = new Map();
      if (userIds.length > 0) {
        const { data: users } = await supabase.from("users").select("id, name, role").in("id", userIds);
        userMap = new Map((users || []).map(u => [u.id, u]));
      }

      const enrichedData = data.map(m => ({
        ...m,
        sender: userMap.get(m.sender_id),
        receiver: userMap.get(m.receiver_id),
      }));

      return NextResponse.json({ messages: enrichedData });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
});
