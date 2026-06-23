import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { logAdminAction, getIpFromRequest, getUserAgentFromRequest } from "@/lib/admin-logger";
import { formDataToObject, moneyAmount, optionalString, parseRequest, safeHandler, uuidSchema, z } from "@/lib/api/validation";

const MAX_TOP_UP_AMOUNT = 100_000;

const TopUpSchema = z.object({
  wallet_id: uuidSchema,
  amount: moneyAmount(MAX_TOP_UP_AMOUNT),
  description: optionalString(500),
});

function redirect(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export const POST = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const formData = await request.formData();
  const parsed = parseRequest(TopUpSchema, formDataToObject(formData));
  if (parsed.response) {
    return redirect(request, "/dashboard/wallets?tab=user_wallets&error=invalid_params");
  }
  const { wallet_id: walletId, amount } = parsed.data;
  const description = parsed.data.description || "شحن يدوي من الأدمن";

  // The RPC verifies the current admin via auth.uid(), so it must be called
  // with the authenticated session rather than a service-role-only client.
  const supabase = await createClient();

  // [INT-C-02 FIXED] Snapshot user wallet balance before top-up for audit log.
  const { data: walletBefore } = await createAdminClient()
    .from("user_wallets")
    .select("id, balance")
    .eq("id", walletId)
    .maybeSingle();

  const { error: updateError } = await supabase.rpc("admin_wallet_top_up", {
    p_wallet_id: walletId,
    p_amount: amount,
    p_description: `${description} (بواسطة: ${guard.email})`,
    p_admin_email: guard.email,
  });

  if (updateError) {
    console.error("Top-up RPC error:", updateError);
    const errorMessage = String(updateError.message || "");
    const errorCode = updateError.code === "42883"
      ? "wallet_rpc_missing"
      : errorMessage.includes("unauthorized")
        ? "unauthorized"
        : "update_failed";
    return redirect(request, `/dashboard/wallets?tab=user_wallets&error=${errorCode}`);
  }

  await logAdminAction({
    admin_id: guard.user.id,
    action: "update",
    table_name: "user_wallets",
    record_id: walletId,
    old_data: walletBefore ? { balance: walletBefore.balance } : undefined,
    new_data: { amount, description, operation: "top_up" },
    ip_address: getIpFromRequest(request),
    user_agent: getUserAgentFromRequest(request),
  });

  return redirect(request, "/dashboard/wallets?tab=user_wallets&success=wallet_topped_up");
});
