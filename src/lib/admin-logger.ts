import { createAdminClient } from "@/lib/supabase/server";

export function getIpFromRequest(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export async function logAdminAction({
  admin_id,
  action,
  table_name,
  record_id,
  old_data,
  new_data,
  ip_address = "system",
}: {
  admin_id: string;
  action: "create" | "update" | "delete" | "verify" | "revoke" | "block" | "unblock" | "send_notification";
  table_name: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
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
    });

    if (error) {
      console.error("Failed to insert admin_log:", error);
    }
  } catch (err) {
    console.error("Admin Logger Exception:", err);
  }
}
