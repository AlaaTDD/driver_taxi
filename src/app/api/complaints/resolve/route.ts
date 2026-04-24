import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { complaint_id, reply, status = "resolved" } = body;

    if (!complaint_id || !reply) {
      return NextResponse.json({ error: "complaint_id and reply required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase.rpc("resolve_complaint", {
      p_complaint_id: complaint_id,
      p_reply: reply,
      p_status: status,
    });

    if (error) throw error;

    revalidatePath("/dashboard/complaints");
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
