import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";



export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const body = await request.json();
    const { title, message, type = "general", user_id } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "title and message are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    if (user_id) {
      
      const { error } = await supabase.from("notifications").insert({
        user_id,
        title,
        message,
        type,
      });
      if (error) throw error;
      return NextResponse.json({ success: true, sent: 1 });
    } else {
      
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id")
        .eq("is_active", true);

      if (usersError) throw usersError;

      const notifications = (users || []).map((u) => ({
        user_id: u.id,
        title,
        message,
        type,
      }));

      if (notifications.length === 0) {
        return NextResponse.json({ success: true, sent: 0 });
      }

      
      const batchSize = 500;
      let totalSent = 0;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        const { error } = await supabase.from("notifications").insert(batch);
        if (error) throw error;
        totalSent += batch.length;
      }

      return NextResponse.json({ success: true, sent: totalSent });
    }
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json(
      { error: "فشل إرسال الإشعار" },
      { status: 500 }
    );
  }
}
