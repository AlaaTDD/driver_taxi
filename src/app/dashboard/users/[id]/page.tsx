import { createAdminClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils";
import { User, Phone, Mail, Star, MapPin, Clock } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserDetailsPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations();
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (!user) {
    notFound();
  }

  const { data: trips } = await supabase
    .from("trips")
    .select("id, status, created_at, pickup_address, destination_address, price")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
          <User size={32} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary leading-tight">
            {user.name || "مستخدم غير معروف"}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-text-secondary mt-2">
            <span className="flex items-center gap-1.5"><Phone size={14} /> {user.phone}</span>
            {user.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {user.email}</span>}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="dash-card p-5">
          <h3 className="text-base font-bold text-text-primary mb-4">معلومات الحساب</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-divider pb-3">
              <span className="text-text-tertiary">الدور</span>
              <span className="font-semibold text-text-primary">{user.role}</span>
            </div>
            <div className="flex justify-between border-b border-divider pb-3">
              <span className="text-text-tertiary">الحالة</span>
              <span className={`font-bold ${user.is_blocked ? "text-error" : "text-success"}`}>
                {user.is_blocked ? "محظور" : "نشط"}
              </span>
            </div>
            {user.is_blocked && (
              <div className="flex flex-col border-b border-divider pb-3 gap-1">
                <span className="text-text-tertiary">سبب الحظر</span>
                <span className="font-semibold text-error text-xs">{user.blocked_reason || "غير محدد"}</span>
                <span className="text-[11px] text-text-tertiary">{user.blocked_at ? formatDate(user.blocked_at) : ""}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-divider pb-3">
              <span className="text-text-tertiary">تاريخ التسجيل</span>
              <span className="font-semibold text-text-primary">{formatDate(user.created_at)}</span>
            </div>
            <div className="flex justify-between border-b border-divider pb-3">
              <span className="text-text-tertiary">التقييم</span>
              <span className="font-semibold flex items-center gap-1 text-text-primary">
                {user.rating} <Star size={14} className="text-warning fill-warning" />
              </span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-text-tertiary">إجمالي الرحلات</span>
              <span className="font-semibold text-text-primary">{user.total_trips}</span>
            </div>
          </div>
        </div>

        <div className="dash-card flex flex-col">
          <div className="p-5 border-b border-divider">
            <h3 className="text-base font-bold text-text-primary">آخر الرحلات</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {trips && trips.length > 0 ? (
              <div className="space-y-3">
                {trips.map((trip) => (
                  <Link 
                    href={`/dashboard/trips/${trip.id}`} 
                    key={trip.id}
                    className="block group p-3 rounded-xl border border-divider hover:border-primary/30 hover:bg-surface-elevated transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(trip.status)}`}>
                        {getStatusLabel(trip.status, t)}
                      </span>
                      <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(trip.created_at)}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 mt-2">
                      <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                      <div className="text-xs text-text-secondary truncate">
                        <span className="font-semibold">من:</span> {trip.pickup_address || "-"}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 mt-1">
                      <MapPin size={14} className="text-success shrink-0 mt-0.5" />
                      <div className="text-xs text-text-secondary truncate">
                        <span className="font-semibold">إلى:</span> {trip.destination_address || "-"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-disabled gap-2 py-10">
                <MapPin size={32} />
                <p className="text-sm font-semibold">لا توجد رحلات للمستخدم</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
