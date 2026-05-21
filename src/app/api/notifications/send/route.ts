import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-logger";

const MAX_TITLE_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 1000;
const BATCH_SIZE = 500;

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const body = await request.json();
    const { title, message, type = "general", user_id } = body;

    if (
      typeof title !== "string" ||
      typeof message !== "string" ||
      title.trim().length === 0 ||
      message.trim().length === 0 ||
      title.length > MAX_TITLE_LENGTH ||
      message.length > MAX_MESSAGE_LENGTH
    ) {
      return NextResponse.json(
        { error: "بيانات الإشعار غير صالحة" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    if (user_id) {
      
      const { error } = await supabase.from("notifications").insert({
        user_id,
        title: title.trim(),
        message: message.trim(),
        type,
      });
      if (error) throw error;
      const { logAdminAction, getIpFromRequest } = await import("@/lib/admin-logger");
      await logAdminAction({
        admin_id: guard.user.id,
        action: "send_notification",
        table_name: "notifications",
        record_id: user_id,
        new_data: { title, type },
        ip_address: getIpFromRequest(request),
      });
      return NextResponse.json({ success: true, sent: 1 });
    } else {
      let totalSent = 0;
      let from = 0;

      while (true) {
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id")
          .eq("is_active", true)
          .range(from, from + BATCH_SIZE - 1);

        if (usersError) throw usersError;
        if (!users?.length) break;

        const batch = users.map((u) => ({
          user_id: u.id,
          title: title.trim(),
          message: message.trim(),
          type,
        }));

        const { error } = await supabase.from("notifications").insert(batch);
        if (error) throw error;

        totalSent += batch.length;
        if (users.length < BATCH_SIZE) break;
        from += BATCH_SIZE;
      }

      await logAdminAction({
        admin_id: guard.user.id,
        action: "send_notification",
        table_name: "notifications",
        new_data: { title, type, count: totalSent },
        ip_address: request.headers.get("x-forwarded-for") || undefined,
      });

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
