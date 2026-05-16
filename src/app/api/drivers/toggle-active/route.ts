import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const driverId = formData.get("driver_id") as string;
  const isActive = formData.get("is_active") === "true";

  if (!driverId) {
    return NextResponse.redirect(new URL("/dashboard/drivers?error=missing_id", request.url));
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("users")
    .update({ is_active: isActive })
    .eq("id", driverId);

  if (error) {
    console.error("Toggle active error:", error);
  }

  return NextResponse.redirect(new URL("/dashboard/drivers", request.url));
}
