import { createAdminClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import RoutePlansClient from "./route-plans-client";
import { Navigation } from "lucide-react";

export default async function RoutePlansPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const t = await getTranslations();
  const supabase = createAdminClient();

  const page = parseInt(searchParams.page || "1", 10);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("trip_route_plans")
    .select(
      `
      *,
      trips (
        driver_id,
        users!trips_driver_id_fkey (name, phone)
      ),
      trip_route_waypoints (*)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  const { data: routePlans, count, error } = await query.range(from, to);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">مسارات الرحلات</h1>
          <p className="text-sm text-text-secondary mt-1">إدارة وعرض مسارات الرحلات ومحطات التوقف</p>
        </div>
      </div>

      <RoutePlansClient 
        initialData={routePlans || []} 
        totalCount={count || 0}
        currentPage={page}
        error={error?.message}
      />
    </div>
  );
}
