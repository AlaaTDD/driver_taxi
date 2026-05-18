import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  try {
    const formData = await request.formData();
    const rating_id = formData.get("rating_id") as string;

    if (!rating_id) {
      return NextResponse.json({ error: "معرف التقييم مطلوب" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("ratings")
      .delete()
      .eq("id", rating_id);

    if (error) {
      console.error("Delete rating error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.redirect(new URL("/dashboard/ratings", request.url));
  } catch (error) {
    console.error("Delete rating error:", error);
    return NextResponse.json(
      { error: "فشل حذف التقييم" },
      { status: 500 }
    );
  }
}
