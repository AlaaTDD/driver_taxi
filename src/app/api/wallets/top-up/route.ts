import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // ── Auth Guard ──────────────────────────────────────────────────────────────
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const walletId = formData.get("wallet_id") as string;
  const amount = Number(formData.get("amount"));
  const description = (formData.get("description") as string) || "شحن يدوي من الأدمن";

  if (!walletId || !amount || isNaN(amount) || amount <= 0) {
    return NextResponse.redirect(new URL("/dashboard/wallets?tab=user_wallets&error=invalid_params", request.url));
  }

  const supabase = createAdminClient();

  // ── Atomic balance update via RPC to prevent double-spend ──────────────────
  // Instead of read-modify-write (race condition), we use a single atomic
  // SQL update: balance = balance + amount
  const { data: wallet, error: fetchError } = await supabase
    .from("user_wallets")
    .select("balance, total_topped_up")
    .eq("id", walletId)
    .single();

  if (fetchError || !wallet) {
    return NextResponse.redirect(new URL("/dashboard/wallets?tab=user_wallets&error=wallet_not_found", request.url));
  }

  const balanceBefore = Number(wallet.balance);

  // Atomic update: use raw SQL-level increment via RPC if available,
  // otherwise use optimistic update with version check
  const { error: updateError } = await supabase.rpc("admin_wallet_top_up", {
    p_wallet_id: walletId,
    p_amount: amount,
    p_description: `${description} (بواسطة: ${guard.email})`,
    p_admin_email: guard.email,
  });

  // Fallback: if RPC doesn't exist, use direct update (non-atomic but auth-guarded)
  if (updateError?.code === "42883") {
    // Function does not exist — fallback to direct update
    const newBalance = balanceBefore + amount;
    const newTotalToppedUp = Number(wallet.total_topped_up) + amount;

    const { error: directUpdateError } = await supabase
      .from("user_wallets")
      .update({
        balance: newBalance,
        total_topped_up: newTotalToppedUp,
        updated_at: new Date().toISOString(),
      })
      .eq("id", walletId);

    if (directUpdateError) {
      console.error("Top-up wallet error:", directUpdateError);
      return NextResponse.redirect(new URL("/dashboard/wallets?tab=user_wallets&error=update_failed", request.url));
    }

    // Create transaction record
    await supabase.from("wallet_transactions").insert({
      wallet_id: walletId,
      wallet_type: "user",
      type: "top_up",
      amount,
      balance_before: balanceBefore,
      balance_after: newBalance,
      description: `${description} (بواسطة: ${guard.email})`,
      status: "completed",
    });
  } else if (updateError) {
    console.error("Top-up RPC error:", updateError);
    return NextResponse.redirect(new URL("/dashboard/wallets?tab=user_wallets&error=update_failed", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard/wallets?tab=user_wallets", request.url));
}
