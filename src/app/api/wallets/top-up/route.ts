import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

const MAX_TOP_UP_AMOUNT = 100_000;

export async function POST(request: Request) {
  // ── Auth Guard ──────────────────────────────────────────────────────────────
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const walletId = formData.get("wallet_id") as string;
  const amount = Number(formData.get("amount"));
  const description = (formData.get("description") as string) || "شحن يدوي من الأدمن";

  if (
    !walletId ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > MAX_TOP_UP_AMOUNT
  ) {
    return NextResponse.redirect(new URL("/dashboard/wallets?tab=user_wallets&error=invalid_params", request.url));
  }

  const supabase = createAdminClient();

  const { error: updateError } = await supabase.rpc("admin_wallet_top_up", {
    p_wallet_id: walletId,
    p_amount: amount,
    p_description: `${description} (بواسطة: ${guard.email})`,
    p_admin_email: guard.email,
  });

  if (updateError) {
    console.error("Top-up RPC error:", updateError);
    const errorCode = updateError.code === "42883" ? "wallet_rpc_missing" : "update_failed";
    return NextResponse.redirect(new URL(`/dashboard/wallets?tab=user_wallets&error=${errorCode}`, request.url));
  }

  return NextResponse.redirect(new URL("/dashboard/wallets?tab=user_wallets", request.url));
}
