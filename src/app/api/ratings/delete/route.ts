import { createAdminClient } from "@/lib/supabase/server";
import { logAdminAction, getIpFromRequest } from "@/lib/admin-logger";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { formDataToObject, safeHandler, parseRequest, uuidSchema, z } from "@/lib/api/validation";

const DeleteRatingSchema = z.object({
  rating_id: uuidSchema,
});

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const formData = await request.formData();
    const parsed = parseRequest(DeleteRatingSchema, formDataToObject(formData));
    if (parsed.response) return parsed.response;
    const { rating_id } = parsed.data;

    const supabase = createAdminClient();

    // [INT-C-02 FIXED] Fetch rating before deletion so audit log has old_data.
    const { data: oldRating } = await supabase
      .from("ratings")
      .select("id, user_id, driver_id, trip_id, rating, comment")
      .eq("id", rating_id)
      .maybeSingle();

    const { error } = await supabase
      .from("ratings")
      .delete()
      .eq("id", rating_id);

    if (error) {
      console.error("Delete rating error:", error);
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }

    await logAdminAction({
      admin_id: guard.user.id,
      action: "delete",
      table_name: "ratings",
      record_id: rating_id,
      old_data: oldRating ?? undefined,
      ip_address: getIpFromRequest(request),
    });

    revalidatePath("/dashboard/ratings");
    return NextResponse.redirect(new URL("/dashboard/ratings", request.url));
});
