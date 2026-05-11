import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const walletId = formData.get("wallet_id") as string;
  const walletType = formData.get("wallet_type") as string; // "driver" | "user"
  const amount = Number(formData.get("amount"));
  const description = (formData.get("description") as string) || "تعديل يدوي من الأدمن";
  const txType = (formData.get("type") as string) || "adjustment"; // bonus, penalty, adjustment

  if (!walletId || !walletType || !amount || isNaN(amount)) {
    return NextResponse.redirect(new URL("/dashboard/wallets?error=invalid_params", request.url));
  }

  const supabase = createAdminClient();
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  const table = walletType === "driver" ? "driver_wallets" : "user_wallets";

  // Get current balance
  const { data: wallet } = await supabase.from(table).select("balance").eq("id", walletId).single();

  if (!wallet) {
    return NextResponse.redirect(new URL("/dashboard/wallets?error=wallet_not_found", request.url));
  }

  const currentBalance = Number(wallet.balance);
  const newBalance = currentBalance + amount;

  // Update wallet balance
  const { error: updateError } = await supabase
    .from(table)
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", walletId);

  if (updateError) {
    console.error("Wallet adjust error:", updateError);
    return NextResponse.redirect(new URL("/dashboard/wallets?error=update_failed", request.url));
  }

  // Create transaction record
  await supabase.from("wallet_transactions").insert({
    wallet_id: walletId,
    wallet_type: walletType,
    type: txType,
    amount,
    balance_before: currentBalance,
    balance_after: newBalance,
    description: `${description} (بواسطة: ${user?.email || "admin"})`,
    status: "completed",
  });

  return NextResponse.redirect(new URL(`/dashboard/wallets?tab=${walletType}_wallets`, request.url));
}
