import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userId = formData.get("user_id") as string;
    const role = formData.get("role") as string;

    if (!userId || !role) {
      return NextResponse.json({ error: "user_id and role required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase.rpc("set_user_role", {
      p_user_id: userId,
      p_role: role,
    });

    if (error) throw error;

    revalidatePath("/dashboard/users");
    return NextResponse.redirect(new URL("/dashboard/users", request.url));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Set role error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
