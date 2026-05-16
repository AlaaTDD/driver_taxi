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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">مسارات الرحلات</h1>
          <p className="text-muted-foreground">إدارة وعرض مسارات الرحلات ومحطات التوقف</p>
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
