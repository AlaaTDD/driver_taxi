import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userId = formData.get("user_id") as string;
    const action = formData.get("action") as string; // block | unblock
    const reason = formData.get("reason") as string | null;

    if (!userId || !action) {
      return NextResponse.json({ error: "user_id and action required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (action === "block") {
      const { error } = await supabase.rpc("block_user", {
        p_user_id: userId,
        p_reason: reason || null,
      });
      if (error) throw error;
    } else if (action === "unblock") {
      const { error } = await supabase.rpc("unblock_user", { p_user_id: userId });
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
