import { createAdminClient } from "@/lib/supabase/server";

export function getIpFromRequest(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

// NEW-03 FIX: Extract User-Agent header for admin log attribution.
// Previously the column was 100% NULL because nothing populated it.
export function getUserAgentFromRequest(request: Request): string | undefined {
  return request.headers.get("user-agent") ?? undefined;
}

export async function logAdminAction({
  admin_id,
  action,
  table_name,
  record_id,
  old_data,
  new_data,
  ip_address = "system",
  user_agent,
}: {
  admin_id: string;
  action:
    | "create"
    | "update"
    | "delete"
    | "verify"
    | "revoke"
    | "block"
    | "unblock"
    | "send_notification"
    | "export"
    | "set_role";
  table_name: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
}) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("admin_logs").insert({
      admin_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      ip_address,
      ...(user_agent ? { user_agent } : {}),
    });

    if (error) {
      console.error("Failed to insert admin_log:", error);
    }
  } catch (err) {
    console.error("Admin Logger Exception:", err);
  }
}
