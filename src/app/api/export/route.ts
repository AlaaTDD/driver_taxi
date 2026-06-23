import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { logAdminAction, getIpFromRequest, getUserAgentFromRequest } from "@/lib/admin-logger";
import { safeHandler } from "@/lib/api/validation";

const MAX_EXPORT_ROWS = 5000;

type ExportTable = "users" | "drivers" | "trips" | "wallets" | "ratings";

const TABLE_CONFIGS: Record<ExportTable, { table: string; select: string; order: string }> = {
  users: {
    table: "users",
    select: "id, name, role, is_active, is_blocked, created_at",
    order: "created_at",
  },
  drivers: {
    table: "drivers_profile",
    select: "id, vehicle_type, vehicle_brand, vehicle_model, vehicle_plate, vehicle_color, is_verified, is_available, rating, total_trips, created_at",
    order: "created_at",
  },
  trips: {
    table: "trips",
    // [P0-06 FIXED] Add final_price, coupon_discount, payment_method, completed_at.
    // Exporting only `price` shipped the estimate, not the actually-charged
    // amount, which broke revenue reconciliation downstream.
    select: "id, user_id, driver_id, status, price, final_price, coupon_discount, payment_method, vehicle_type, pickup_address, destination_address, distance_km, duration_min, created_at, completed_at",
    order: "created_at",
  },
  wallets: {
    table: "driver_wallets",
    select: "id, balance, total_earned, total_withdrawn, pending_withdrawal, commission_rate",
    order: "id",
  },
  ratings: {
    table: "ratings",
    select: "id, user_id, driver_id, trip_id, rating, comment, created_at",
    order: "created_at",
  },
};

function toCsv(data: Record<string, unknown>[]): string {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export const GET = safeHandler(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const url = new URL(request.url);
    const table = url.searchParams.get("table") as ExportTable | null;

    if (!table || !TABLE_CONFIGS[table]) {
      return NextResponse.json(
        { error: "Invalid table. Must be one of: users, drivers, trips, wallets, ratings" },
        { status: 400 }
      );
    }

    const config = TABLE_CONFIGS[table];
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from(config.table)
      .select(config.select)
      .order(config.order, { ascending: false })
      .limit(MAX_EXPORT_ROWS);

    if (error) {
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }

    const rows = (data as any[]) || [];
    // CODE-11 FIX: Prepend UTF-8 BOM (\uFEFF) so Excel on Windows renders
    // Arabic characters correctly instead of showing mojibake.
    const csv = "\uFEFF" + toCsv(rows);
    const filename = `${table}_export_${new Date().toISOString().split("T")[0]}.csv`;

    await logAdminAction({
      admin_id: guard.user.id,
      action: "export",
      table_name: table,
      new_data: { rows_exported: rows.length, format: "csv" },
      ip_address: getIpFromRequest(request),
      user_agent: getUserAgentFromRequest(request),
    });

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
});
