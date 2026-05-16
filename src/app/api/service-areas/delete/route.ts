import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const supabase = await createAdminClient();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("service_areas")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
