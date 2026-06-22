import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { booleanFromRequest, nonEmptyString, optionalString, safeHandler, parseRequest, z } from "@/lib/api/validation";

const ServiceAreaSchema = z.object({
  name: nonEmptyString(100),
  name_ar: optionalString(100),
  code: z.string().trim().regex(/^[a-z0-9_-]{2,40}$/i),
  geohash_prefixes: z.array(z.string().trim().regex(/^[0-9b-hjkmnp-z]{1,12}$/i)).min(1).max(200),
  is_active: booleanFromRequest.default(true),
});

export const POST = safeHandler(async (req: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const supabase = createAdminClient();
    const parsed = parseRequest(ServiceAreaSchema, await req.json());
    if (parsed.response) return parsed.response;
    const { name, name_ar, code, geohash_prefixes, is_active } = parsed.data;

    const { data, error } = await supabase
      .from("service_areas")
      .insert({
        name,
        name_ar,
        code,
        geohash_prefixes,
        is_active,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }

    return NextResponse.json({ data });
  // [WEB-H-05 FIXED] catch removed — safeHandler catches & logs all uncaught errors
  // and returns a generic "Internal server error" without leaking internals.
});
