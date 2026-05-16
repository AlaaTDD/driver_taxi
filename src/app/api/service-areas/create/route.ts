import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const supabase = await createAdminClient();
    const body = await req.json();
    const { name, geohash_prefixes, is_active } = body;

    if (!name || !geohash_prefixes?.length) {
      return NextResponse.json(
        { error: "name and geohash_prefixes are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("service_areas")
      .insert({
        name,
        geohash_prefixes,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
