import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const adminUser = guard; // Contains admin user object

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { type, message, user_id, trip_id, receiver_id } = body;

    if (!message || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (type === "support") {
      if (!user_id) return NextResponse.json({ error: "Missing user_id for support message" }, { status: 400 });

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
      if (!trip_id || !receiver_id) return NextResponse.json({ error: "Missing trip_id or receiver_id for trip message" }, { status: 400 });

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
  } catch (error: unknown) {
    console.error("Messages Send Error:", error);
    const msg = error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
