import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { driver_id, fields, message } = body;

    if (!driver_id || !fields?.length || !message) {
      return NextResponse.json(
        { error: "driver_id, fields[], and message are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("request_driver_revision", {
      p_driver_id: driver_id,
      p_fields: fields,
      p_message: message,
    });

    if (error) throw error;

    revalidatePath("/dashboard/drivers");
    return NextResponse.json({ success: true, revision_id: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Request revision error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
