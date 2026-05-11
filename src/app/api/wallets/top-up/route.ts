import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const walletId = formData.get("wallet_id") as string;
  const amount = Number(formData.get("amount"));
  const description = (formData.get("description") as string) || "شحن يدوي من الأدمن";

  if (!walletId || !amount || isNaN(amount) || amount <= 0) {
    return NextResponse.redirect(new URL("/dashboard/wallets?tab=user_wallets&error=invalid_params", request.url));
  }

  const supabase = createAdminClient();
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  // Get current balance
  const { data: wallet } = await supabase.from("user_wallets").select("balance, total_topped_up").eq("id", walletId).single();

  if (!wallet) {
    return NextResponse.redirect(new URL("/dashboard/wallets?tab=user_wallets&error=wallet_not_found", request.url));
  }

  const currentBalance = Number(wallet.balance);
  const newBalance = currentBalance + amount;
  const newTotalToppedUp = Number(wallet.total_topped_up) + amount;

  // Update wallet
  const { error: updateError } = await supabase
    .from("user_wallets")
    .update({
      balance: newBalance,
      total_topped_up: newTotalToppedUp,
      updated_at: new Date().toISOString(),
    })
    .eq("id", walletId);

  if (updateError) {
    console.error("Top-up wallet error:", updateError);
    return NextResponse.redirect(new URL("/dashboard/wallets?tab=user_wallets&error=update_failed", request.url));
  }

  // Create transaction record
  await supabase.from("wallet_transactions").insert({
    wallet_id: walletId,
    wallet_type: "user",
    type: "top_up",
    amount,
    balance_before: currentBalance,
    balance_after: newBalance,
    description: `${description} (بواسطة: ${user?.email || "admin"})`,
    status: "completed",
  });

  return NextResponse.redirect(new URL("/dashboard/wallets?tab=user_wallets", request.url));
}
