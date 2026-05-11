import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const offerId = formData.get("offer_id") as string;

  if (!offerId) {
    return NextResponse.redirect(new URL("/dashboard/trip-offers?error=missing_id", request.url));
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("trip_offers")
    .update({
      status: "expired",
      responded_at: new Date().toISOString(),
    })
    .eq("id", offerId)
    .eq("status", "pending");

  if (error) {
    console.error("Cancel trip offer error:", error);
  }

  return NextResponse.redirect(new URL("/dashboard/trip-offers", request.url));
}
