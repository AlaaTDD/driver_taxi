import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  // ── Auth Guard ──────────────────────────────────────────────────────────────
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const formData = await request.formData();
    const userId = formData.get("user_id") as string;
    const action = formData.get("action") as string; 
    const reason = formData.get("reason") as string | null;

    if (!userId || !action) {
      return NextResponse.json({ error: "user_id and action required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (action === "block") {
      // Bypassing buggy block_user RPC to correctly save blocked_reason and blocked_at
      const { error } = await supabase.from("users").update({
        is_blocked: true,
        blocked_reason: reason || null,
        blocked_at: new Date().toISOString(),
      }).eq("id", userId);
      
      if (error) throw error;
    } else if (action === "unblock") {
      const { error } = await supabase.from("users").update({
        is_blocked: false,
        blocked_reason: null,
        blocked_at: null,
      }).eq("id", userId);
      
      if (error) throw error;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    revalidatePath("/dashboard/users");
    return NextResponse.redirect(new URL("/dashboard/users", request.url));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Block user error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
