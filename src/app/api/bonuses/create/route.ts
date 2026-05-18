import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const supabase = createAdminClient();
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

    const thresholdNumber = Number(threshold);
    const bonusAmountNumber = Number(bonus_amount);
    const validTriggerTypes = new Set(["daily_trips", "weekly_trips", "rating_threshold"]);

    if (
      typeof name !== "string" ||
      typeof trigger_type !== "string" ||
      !validTriggerTypes.has(trigger_type) ||
      !Number.isFinite(thresholdNumber) ||
      thresholdNumber <= 0 ||
      !Number.isFinite(bonusAmountNumber) ||
      bonusAmountNumber <= 0
    ) {
      return NextResponse.json(
        { error: "بيانات قاعدة المكافأة غير صالحة" },
        { status: 400 }
      );
    }

    const insertData: Record<string, unknown> = {
      name: name.trim(),
      name_ar: name_ar || name,
      trigger_type,
      threshold: thresholdNumber,
      bonus_amount: bonusAmountNumber,
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
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "حدث خطأ غير متوقع";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
