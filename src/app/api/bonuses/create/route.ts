import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const supabase = await createAdminClient();
    const body = await req.json();
    const {
      name,
      name_ar,
      trigger_type,
      threshold,
      bonus_amount,
      vehicle_types,
      is_active,
      valid_from,
      valid_until,
    } = body;

    if (!name || !trigger_type || !threshold || !bonus_amount) {
      return NextResponse.json(
        { error: "name, trigger_type, threshold, and bonus_amount are required" },
        { status: 400 }
      );
    }

    const insertData: Record<string, any> = {
      name,
      name_ar: name_ar || name,
      trigger_type,
      threshold,
      bonus_amount,
      is_active: is_active ?? true,
    };
    if (vehicle_types?.length) insertData.vehicle_types = vehicle_types;
    if (valid_from) insertData.valid_from = valid_from;
    if (valid_until) insertData.valid_until = valid_until;

    const { data, error } = await supabase
      .from("bonus_rules")
      .insert(insertData)
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
