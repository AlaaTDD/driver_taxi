import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/pricing/update
// Body: { vehicle_type, base_fare, price_per_km, minimum_fare }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vehicle_type, base_fare, price_per_km, minimum_fare } = body;

    if (!vehicle_type || base_fare == null || price_per_km == null || minimum_fare == null) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    if (!["car", "motorcycle"].includes(vehicle_type)) {
      return NextResponse.json(
        { error: "نوع المركبة غير صحيح" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("pricing_config")
      .update({
        base_fare: Number(base_fare),
        price_per_km: Number(price_per_km),
        minimum_fare: Number(minimum_fare),
        updated_at: new Date().toISOString(),
      })
      .eq("vehicle_type", vehicle_type);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update pricing error:", error);
    return NextResponse.json(
      { error: "فشل تحديث التسعير" },
      { status: 500 }
    );
  }
}

// GET /api/pricing/update?vehicle_type=car&distance_km=10
// Returns calculated price
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicle_type = searchParams.get("vehicle_type");
    const distance_km = searchParams.get("distance_km");

    if (!vehicle_type || !distance_km) {
      return NextResponse.json(
        { error: "vehicle_type and distance_km required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("calculate_trip_price", {
      p_vehicle_type: vehicle_type,
      p_distance_km: Number(distance_km),
    });

    if (error) throw error;

    return NextResponse.json({ price: data });
  } catch (error) {
    console.error("Calculate price error:", error);
    return NextResponse.json({ error: "فشل حساب السعر" }, { status: 500 });
  }
}
