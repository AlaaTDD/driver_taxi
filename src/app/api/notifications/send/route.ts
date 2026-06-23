import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { logAdminAction, getIpFromRequest, getUserAgentFromRequest } from "@/lib/admin-logger";
import { nonEmptyString, optionalString, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";

const MAX_TITLE_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 1000;
const BATCH_SIZE = 500;
// [WEB-M-01 FIX] Timeout guard: at 100k users / 500 per batch = 200 iterations.
// Each batch ~100ms → total ≈ 20s. We abort gracefully at 55s (under Vercel's 60s limit).
const MAX_RUNTIME_MS = 55_000;

const SendNotificationSchema = z.object({
  title: nonEmptyString(MAX_TITLE_LENGTH),
  message: nonEmptyString(MAX_MESSAGE_LENGTH),
  type: optionalString(50).default("general"),
  user_id: uuidSchema.optional(),
});

// [WEB-C-04 FIXED] Partial delivery is now handled:
//   - Single-user path: unchanged (atomic by nature).
//   - Broadcast path: if a batch fails, we return 207 Partial with counts so the
//     caller knows how many went through and can resume or alert. We do NOT throw
//     on batch failure — already-sent batches cannot be rolled back at DB level;
//     we acknowledge that and make the failure observable instead of silent.
// [WEB-H-02 FIXED] Moved getIpFromRequest to static import.
export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const parsed = parseRequest(SendNotificationSchema, await request.json());
  if (parsed.response) return parsed.response;
  const { title, message, type, user_id } = parsed.data;

  const supabase = createAdminClient();

  // ── Single-user notification ─────────────────────────────────────────────
  if (user_id) {
    const { error } = await supabase.from("notifications").insert({
      user_id,
      title: title.trim(),
      message: message.trim(),
      type,
    });
    if (error) throw error;

    await logAdminAction({
      admin_id: guard.user.id,
      action: "send_notification",
      table_name: "notifications",
      record_id: user_id,
      new_data: { title, type },
      ip_address: getIpFromRequest(request),
      user_agent: getUserAgentFromRequest(request),
    });
    return NextResponse.json({ success: true, sent: 1 });
  }

  // ── Broadcast to all active users ────────────────────────────────────────
  const startedAt = Date.now();
  let totalSent = 0;
  let totalFailed = 0;
  let from = 0;

  while (true) {
    // Timeout guard — abort before the serverless function is killed
    if (Date.now() - startedAt > MAX_RUNTIME_MS) {
      console.warn(`send_notification: timeout guard hit after ${totalSent} sent`);
      break;
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id")
      .eq("is_active", true)
      // CODE-15 FIX: Also exclude blocked users – they should not receive
      // broadcast notifications. Previously only is_active was checked.
      .eq("is_blocked", false)
      .order("id", { ascending: true })  // Stable ordering prevents gaps/dups
      .range(from, from + BATCH_SIZE - 1);

    if (usersError) {
      console.error("send_notification: failed to fetch user batch:", usersError);
      break;
    }
    if (!users?.length) break;

    const batch = users.map((u) => ({
      user_id: u.id,
      title: title.trim(),
      message: message.trim(),
      type,
    }));

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(batch);

    if (insertError) {
      // [WEB-C-04] Don't throw — previous batches are already committed.
      // Record the failure count and continue to next batch so we deliver as
      // many notifications as possible rather than aborting silently.
      console.error(
        `send_notification: batch ${from}–${from + batch.length - 1} failed:`,
        insertError
      );
      totalFailed += batch.length;
    } else {
      totalSent += batch.length;
    }

    if (users.length < BATCH_SIZE) break;
    from += BATCH_SIZE;
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: "send_notification",
    table_name: "notifications",
    new_data: { title, type, sent: totalSent, failed: totalFailed },
    ip_address: getIpFromRequest(request),
    user_agent: getUserAgentFromRequest(request),
  });

  // 207 Multi-Status when some batches failed, 200 when all succeeded
  const status = totalFailed > 0 ? 207 : 200;
  return NextResponse.json(
    { success: totalFailed === 0, sent: totalSent, failed: totalFailed },
    { status }
  );
});
