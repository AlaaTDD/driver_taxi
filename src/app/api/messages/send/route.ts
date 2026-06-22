import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { nonEmptyString, safeHandler, parseRequest, uuidSchema, z } from "@/lib/api/validation";

const MAX_MESSAGE_LENGTH = 2000;
const SendMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("support"),
    message: nonEmptyString(MAX_MESSAGE_LENGTH),
    user_id: uuidSchema,
    ticket_id: uuidSchema.optional(),
  }),
  z.object({
    type: z.literal("trip"),
    message: nonEmptyString(MAX_MESSAGE_LENGTH),
    trip_id: uuidSchema,
    receiver_id: uuidSchema,
  }),
]);

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const adminUser = guard; // Contains admin user object

    const supabase = createAdminClient();
    const parsed = parseRequest(SendMessageSchema, await request.json());
    if (parsed.response) return parsed.response;
    const body = parsed.data;
    const { type, message } = body;

    if (type === "support") {
      const { user_id } = body;

      // If no ticket_id is provided, try to find an open ticket for this user
      let currentTicketId = body.ticket_id;
      if (!currentTicketId) {
        const { data: openTickets } = await supabase
          .from("support_tickets")
          .select("id")
          .eq("user_id", user_id)
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(1);
          
        if (openTickets && openTickets.length > 0) {
          currentTicketId = openTickets[0].id;
        } else {
          // Create a new open ticket
          const { data: newTicket, error: ticketError } = await supabase
            .from("support_tickets")
            .insert({ user_id, status: "open", subject: "تذكرة دعم جديدة" })
            .select("id")
            .single();
            
          if (ticketError) throw ticketError;
          currentTicketId = newTicket.id;
        }
      }

      const { error } = await supabase.from("support_messages").insert({
        user_id,
        message,
        sender_role: "admin",
        sender_id: adminUser.user.id,
        ticket_id: currentTicketId,
      });

      if (error) throw error;
    } else if (type === "trip") {
      const { trip_id, receiver_id } = body;

      const { error } = await supabase.from("messages").insert({
        trip_id,
        sender_id: adminUser.user.id,
        receiver_id,
        content: message,
        is_read: false,
      });

      if (error) throw error;
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
});
