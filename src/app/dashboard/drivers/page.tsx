import { createAdminClient } from "@/lib/supabase/server";
import { Badge } from "@/components/badge";
import DriversClient from "./drivers-client";

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const statusFilter = params.status || "";
  const pageSize = 10;

  const supabase = createAdminClient();

  let query = supabase
    .from("drivers_profile")
    .select(
      "id, national_id, vehicle_type, vehicle_brand, vehicle_model, vehicle_year, vehicle_color, vehicle_plate, is_verified, is_available, current_lat, current_lng, updated_at, users(id, name, phone, email, rating, total_trips, is_active, avatar_url)",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(`vehicle_plate.ilike.%${search}%`);
  }

  const { data: drivers, count } = await query;

  // Filter by status in memory since we need to join with users
  let filteredDrivers = drivers || [];
  if (search) {
    filteredDrivers = filteredDrivers.filter((d) => {
      const u = d.users as unknown as Record<string, unknown> | null;
      const name = (u?.name as string) || "";
      const phone = (u?.phone as string) || "";
      return (
        name.toLowerCase().includes(search.toLowerCase()) ||
        phone.includes(search) ||
        (d.vehicle_plate || "").toLowerCase().includes(search.toLowerCase())
      );
    });
  }
  if (statusFilter === "verified") {
    filteredDrivers = filteredDrivers.filter((d) => d.is_verified);
  } else if (statusFilter === "pending") {
    filteredDrivers = filteredDrivers.filter((d) => !d.is_verified);
  } else if (statusFilter === "available") {
    filteredDrivers = filteredDrivers.filter((d) => d.is_available && d.is_verified);
  }

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">السائقين</h1>
        <p className="text-text-secondary text-[13px] mt-0.5">إدارة حسابات السائقين والتحقق منهم</p>
      </div>

      <DriversClient
        currentPage={page}
        totalPages={totalPages}
        currentSearch={search}
        currentStatus={statusFilter}
      />

      {/* Drivers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDrivers.map((driver) => {
          const user = driver.users as unknown as {
            name: string;
            phone: string;
            email: string;
            rating: number;
            total_trips: number;
            is_active: boolean;
            avatar_url: string | null;
          } | null;

          return (
            <div
              key={driver.id}
              className="bg-surface/80 backdrop-blur-sm rounded-2xl border border-divider/60 p-5 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {user?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div className="text-text-primary font-semibold text-[13px]">
                      {user?.name || "غير معروف"}
                    </div>
                    <div className="text-text-disabled text-[11px]">{user?.phone}</div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Badge variant={driver.is_verified ? "success" : "warning"}>
                    {driver.is_verified ? "معتمد" : "في الانتظار"}
                  </Badge>
                  {driver.is_available && (
                    <Badge variant="info">متاح</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[12px] mb-4">
                <div>
                  <span className="text-text-disabled">المركبة:</span>
                  <span className="text-text-secondary mr-1">
                    {driver.vehicle_type === "car" ? "عربية" : "مكنة"}
                  </span>
                </div>
                <div>
                  <span className="text-text-disabled">الماركة:</span>
                  <span className="text-text-secondary mr-1">
                    {driver.vehicle_brand} {driver.vehicle_model}
                  </span>
                </div>
                <div>
                  <span className="text-text-disabled">اللون:</span>
                  <span className="text-text-secondary mr-1">{driver.vehicle_color}</span>
                </div>
                <div>
                  <span className="text-text-disabled">اللوحة:</span>
                  <span className="text-text-secondary mr-1 font-mono">{driver.vehicle_plate}</span>
                </div>
                <div>
                  <span className="text-text-disabled">التقييم:</span>
                  <span className="text-text-secondary mr-1">
                    {Number(user?.rating || 5).toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-text-disabled">الرحلات:</span>
                  <span className="text-text-secondary mr-1">{user?.total_trips || 0}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {!driver.is_verified && (
                  <form action={`/api/drivers/verify`} method="POST">
                    <input type="hidden" name="driver_id" value={driver.id} />
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-success/15 text-success rounded-xl text-[12px] font-medium hover:bg-success/25 border border-success/20 transition-colors"
                    >
                      اعتماد السائق
                    </button>
                  </form>
                )}
                {driver.is_verified && (
                  <form action={`/api/drivers/revoke`} method="POST">
                    <input type="hidden" name="driver_id" value={driver.id} />
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-error/15 text-error rounded-xl text-[12px] font-medium hover:bg-error/25 border border-error/20 transition-colors"
                    >
                      إلغاء الاعتماد
                    </button>
                  </form>
                )}
                <form action={`/api/drivers/toggle-active`} method="POST">
                  <input type="hidden" name="driver_id" value={driver.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={user?.is_active ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className={`flex-1 py-2 rounded-xl text-[12px] font-medium transition-colors border ${
                      user?.is_active
                        ? "bg-warning/15 text-warning hover:bg-warning/25 border-warning/20"
                        : "bg-success/15 text-success hover:bg-success/25 border-success/20"
                    }`}
                  >
                    {user?.is_active ? "تعطيل الحساب" : "تفعيل الحساب"}
                  </button>
                </form>
              </div>
            </div>
          );
        })}

        {filteredDrivers.length === 0 && (
          <div className="col-span-2 text-center py-12 text-text-disabled">
            لا توجد نتائج
          </div>
        )}
      </div>
    </div>
  );
}
