import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; trip_id?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = 20;

  const supabase = createAdminClient();

  const query = supabase
    .from("support_messages")
    .select("*, users!support_messages_user_id_fkey(id, name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data: messages, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">الرسائل</h1>
        <p className="text-text-secondary text-[13px] mt-0.5">عرض رسائل المحادثات بين المستخدمين والسائقين</p>
      </div>

      {/* Messages Table */}
      <div className="bg-surface/80 backdrop-blur-sm rounded-2xl border border-divider/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider/60">
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">المستخدم</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">الرسالة</th>
                <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {(messages || []).map((msg) => {
                const user = msg.users as unknown as { name: string } | null;
                return (
                  <tr
                    key={msg.id}
                    className="border-b border-divider/30 hover:bg-surface-elevated/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-text-primary text-[13px]">{user?.name || "—"}</td>
                    <td className="py-3 px-4 text-text-primary max-w-[300px] truncate text-[13px]">
                      {msg.message}
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-[11px]">
                      {formatDate(msg.created_at)}
                    </td>
                  </tr>
                );
              })}
              {(!messages || messages.length === 0) && (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-text-disabled">
                    لا توجد رسائل
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/dashboard/messages?page=${p}`}
              className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center ${
                p === page
                  ? "bg-primary text-white shadow-sm shadow-primary/25"
                  : "bg-surface/80 border border-divider/60 text-text-secondary hover:border-primary/30"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
