import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { booleanFromRequest, moneyAmount, nonEmptyString, optionalString, safeHandler, parseRequest, triggerTypeSchema, z } from "@/lib/api/validation";

const BonusRuleSchema = z.object({
  name: nonEmptyString(100),
  name_ar: optionalString(100),
  trigger_type: triggerTypeSchema,
  threshold: z.coerce.number().int().positive().max(100_000),
  bonus_amount: moneyAmount(100_000),
  vehicle_types: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  is_active: booleanFromRequest.default(true),
  starts_at: optionalString(40),
  valid_from: optionalString(40),
  expires_at: optionalString(40),
  valid_until: optionalString(40),
});

export const POST = safeHandler(async (req: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const supabase = createAdminClient();
    const parsed = parseRequest(BonusRuleSchema, await req.json());
    if (parsed.response) return parsed.response;
    const {
      name,
      name_ar,
      trigger_type,
      threshold,
      bonus_amount,
      vehicle_types,
      is_active,
      starts_at,
      valid_from,
      expires_at,
      valid_until,
    } = parsed.data;

    const insertData: Record<string, unknown> = {
      name: name.trim(),
      name_ar: name_ar || name,
      trigger_type,
      threshold,
      bonus_amount,
      is_active,
    };
    if (vehicle_types?.length) insertData.vehicle_types = vehicle_types;
    const effective_start = starts_at || valid_from;
    const effective_expire = expires_at || valid_until;
    if (effective_start) insertData.starts_at = effective_start;
    if (effective_expire) insertData.expires_at = effective_expire;

    const { data, error } = await supabase
      .from("bonus_rules")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }

    return NextResponse.json({ data });
  // [WEB-H-05 FIXED] catch removed — safeHandler catches & logs all uncaught errors
});
