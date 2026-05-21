import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-logger";

const WALLET_TYPES = new Set(["driver", "user"]);
const TX_TYPES = new Set(["bonus", "penalty", "adjustment"]);
const MAX_MANUAL_ADJUSTMENT = 100_000;

export async function POST(request: Request) {
  // ── Auth Guard ──────────────────────────────────────────────────────────────
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const walletId = formData.get("wallet_id") as string;
  const walletType = formData.get("wallet_type") as string; // "driver" | "user"
  const amount = Number(formData.get("amount"));
  const description = (formData.get("description") as string) || "تعديل يدوي من الأدمن";
  const txType = (formData.get("type") as string) || "adjustment"; // bonus, penalty, adjustment

  if (
    !walletId ||
    !WALLET_TYPES.has(walletType) ||
    !TX_TYPES.has(txType) ||
    !Number.isFinite(amount) ||
    amount === 0 ||
    Math.abs(amount) > MAX_MANUAL_ADJUSTMENT
  ) {
    return NextResponse.redirect(new URL("/dashboard/wallets?error=invalid_params", request.url));
  }

  const supabase = createAdminClient();

  const { error: updateError } = await supabase.rpc("admin_wallet_adjust", {
    p_wallet_id: walletId,
    p_wallet_type: walletType,
    p_amount: amount,
    p_tx_type: txType,
    p_description: `${description} (بواسطة: ${guard.email})`,
    p_admin_email: guard.email,
  });

  if (updateError) {
    console.error("Wallet adjust error:", updateError);
    const errorCode = updateError.code === "42883" ? "wallet_rpc_missing" : "update_failed";
    return NextResponse.redirect(new URL(`/dashboard/wallets?error=${errorCode}`, request.url));
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: "update",
    table_name: "wallets",
    record_id: walletId,
    new_data: { amount, txType, description },
    ip_address: request.headers.get("x-forwarded-for") || undefined,
  });

  return NextResponse.redirect(new URL(`/dashboard/wallets?tab=${walletType}_wallets`, request.url));
}
