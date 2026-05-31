import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-logger";
import { formDataToObject, moneyAmount, optionalString, parseRequest, safeHandler, uuidSchema, walletTxTypeSchema, walletTypeSchema, z } from "@/lib/api/validation";

const MAX_MANUAL_ADJUSTMENT = 100_000;

const WalletAdjustSchema = z.object({
  wallet_id: uuidSchema,
  wallet_type: walletTypeSchema,
  amount: z.coerce.number().finite().refine((v) => v !== 0, "Amount must not be zero").refine((v) => Math.abs(v) <= MAX_MANUAL_ADJUSTMENT, `Amount must not exceed ${MAX_MANUAL_ADJUSTMENT}`),
  description: optionalString(500),
  type: walletTxTypeSchema.default("adjustment"),
});

function redirect(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const parsed = parseRequest(WalletAdjustSchema, formDataToObject(formData));
  if (parsed.response) {
    const walletType = String(formData.get("wallet_type") || "driver");
    const tab = walletType === "user" ? "user_wallets" : "driver_wallets";
    return redirect(request, `/dashboard/wallets?tab=${tab}&error=invalid_params`);
  }
  const { wallet_id: walletId, wallet_type: walletType, amount, type: txType } = parsed.data;
  const description = parsed.data.description || "تعديل يدوي من الأدمن";
  const tab = `${walletType}_wallets`;

  // Use the authenticated admin session for RPCs. These SECURITY DEFINER
  // functions check auth.uid()/auth.role(), which a service-role client does
  // not represent as the current admin.
  const supabase = await createClient();

  // [INT-C-02 FIXED] Snapshot the wallet balance before adjustment for audit log.
  const walletTable = walletType === "user" ? "user_wallets" : "driver_wallets";
  const { data: walletBefore } = await createAdminClient()
    .from(walletTable)
    .select("id, balance")
    .eq("id", walletId)
    .maybeSingle();

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
    const errorMessage = String(updateError.message || "");
    const errorCode = updateError.code === "42883"
      ? "wallet_rpc_missing"
      : errorMessage.includes("insufficient_balance")
        ? "insufficient_balance"
        : errorMessage.includes("unauthorized")
          ? "unauthorized"
          : "update_failed";
    return redirect(request, `/dashboard/wallets?tab=${tab}&error=${errorCode}`);
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: "update",
    table_name: "wallets",
    record_id: walletId,
    old_data: walletBefore ? { balance: walletBefore.balance } : undefined,
    new_data: { amount, txType, description },
    ip_address: request.headers.get("x-forwarded-for") || undefined,
  });

  return redirect(request, `/dashboard/wallets?tab=${walletType}_wallets&success=wallet_updated`);
});
