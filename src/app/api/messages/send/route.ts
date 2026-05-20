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

      const { error } = await supabase.from("support_messages").insert({
        user_id,
        message,
        sender_role: "admin",
        sender_id: adminUser.user.id,
      });

      if (error) throw error;
    } else if (type === "trip") {
      if (!trip_id || !receiver_id) return NextResponse.json({ error: "Missing trip_id or receiver_id for trip message" }, { status: 400 });

      const { error } = await supabase.from("messages").insert({
        trip_id,
        sender_id: adminUser.user.id,
        receiver_id,
        message,
        is_read: false,
      });

      if (error) throw error;
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Messages Send Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}
