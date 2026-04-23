import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/badge";
import UsersClient from "./users-client";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; role?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const roleFilter = params.role || "";
  const pageSize = 10;

  const supabase = createAdminClient();

  let query = supabase
    .from("users")
    .select("id, name, phone, email, role, rating, total_trips, is_active, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (roleFilter) {
    query = query.eq("role", roleFilter);
  }

  const { data: users, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">المستخدمين</h1>
        <p className="text-text-secondary text-[13px] mt-0.5">إدارة حسابات المستخدمين والسائقين</p>
      </div>

      <UsersClient
        users={users || []}
        totalPages={totalPages}
        currentPage={page}
        currentSearch={search}
        currentRole={roleFilter}
      />

      {/* Users Table */}
      <div className="bg-surface/80 backdrop-blur-sm rounded-2xl border border-divider/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider/60">
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">الاسم</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">الهاتف</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">الإيميل</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">الدور</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">التقييم</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">الرحلات</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">الحالة</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map((user) => (
                <tr key={user.id} className="border-b border-divider/30 hover:bg-surface-elevated/30 transition-colors">
                  <td className="py-3 px-4 text-text-primary font-medium text-[13px]">{user.name}</td>
                  <td className="py-3 px-4 text-text-secondary text-[13px]">{user.phone}</td>
                  <td className="py-3 px-4 text-text-secondary text-[13px]">{user.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant={user.role === "driver" ? "info" : "default"}>
                      {user.role === "driver" ? "سائق" : "مستخدم"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-text-primary text-[13px]">{Number(user.rating).toFixed(1)}</td>
                  <td className="py-3 px-4 text-text-secondary text-[13px]">{user.total_trips}</td>
                  <td className="py-3 px-4">
                    <Badge variant={user.is_active ? "success" : "error"}>
                      {user.is_active ? "نشط" : "معطّل"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-[11px]">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-text-disabled">
                    لا توجد نتائج
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
