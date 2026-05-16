"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { updateRoutePlanStatus } from "./actions";
import { Navigation, MapPin, AlertCircle, Clock, CheckCircle2, MoreHorizontal } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function RoutePlansClient({
  initialData,
  totalCount,
  currentPage,
  error
}: {
  initialData: any[];
  totalCount: number;
  currentPage: number;
  error?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  if (error) {
    return (
      <div className="rounded-lg border border-error-border bg-error-surface p-4">
        <div className="flex items-center gap-2 text-error-dark">
          <AlertCircle size={16} />
          <p>حدث خطأ أثناء جلب المسارات: {error}</p>
        </div>
      </div>
    );
  }

  const handleStatusChange = async (id: string, newStatus: "draft" | "active" | "inactive" | "archived") => {
    setStatusLoading(id);
    startTransition(async () => {
      const res = await updateRoutePlanStatus(id, newStatus);
      if (!res.success) {
        alert("فشل تحديث الحالة: " + res.error);
      }
      setStatusLoading(null);
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="inline-flex items-center rounded-full bg-success-surface px-2.5 py-0.5 text-xs font-semibold text-success-dark"><CheckCircle2 size={12} className="mr-1" /> نشط</span>;
      case "draft":
        return <span className="inline-flex items-center rounded-full bg-warning-surface px-2.5 py-0.5 text-xs font-semibold text-warning-dark">مسودة</span>;
      case "inactive":
        return <span className="inline-flex items-center rounded-full bg-surface-elevated px-2.5 py-0.5 text-xs font-semibold text-text-primary">غير نشط</span>;
      case "archived":
        return <span className="inline-flex items-center rounded-full bg-error-surface px-2.5 py-0.5 text-xs font-semibold text-error-dark">مؤرشف</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info-surface text-info-dark">
            <Navigation size={16} />
          </span>
          <span className="font-semibold">{totalCount} مسار</span>
        </div>
        <select 
          className="rounded-md border p-1.5 text-sm"
          value={searchParams.get("status") || ""}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams);
            if (e.target.value) params.set("status", e.target.value);
            else params.delete("status");
            params.set("page", "1");
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="draft">مسودة</option>
          <option value="inactive">غير نشط</option>
          <option value="archived">مؤرشف</option>
        </select>
      </div>

      {initialData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
          <MapPin size={32} className="mb-2 text-text-disabled" />
          <p>لا توجد مسارات لعرضها</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-surface-elevated text-text-secondary">
              <tr>
                <th className="p-4 font-medium">التعريف (Label)</th>
                <th className="p-4 font-medium">الحالة</th>
                <th className="p-4 font-medium">السائق</th>
                <th className="p-4 font-medium">المسافة / الوقت</th>
                <th className="p-4 font-medium">محطات التوقف</th>
                <th className="p-4 font-medium">تاريخ الإنشاء</th>
                <th className="p-4 font-medium text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialData.map((plan) => {
                const driverName = plan.trips?.users?.name || "غير معروف";
                const waypointsCount = plan.trip_route_waypoints?.length || 0;
                
                return (
                  <tr key={plan.id} className="hover:bg-surface-elevated transition-colors">
                    <td className="p-4 font-medium">
                      {plan.label || `مسار ${plan.id.substring(0, 8)}`}
                      {plan.is_system_generated && <span className="mr-2 text-[10px] bg-surface-elevated px-1 rounded text-text-tertiary">تلقائي</span>}
                    </td>
                    <td className="p-4">{getStatusBadge(plan.status)}</td>
                    <td className="p-4 text-text-secondary">{driverName}</td>
                    <td className="p-4 text-text-secondary">
                      <div className="flex items-center gap-1">
                        <span>{plan.total_distance_km} كم</span>
                        <span className="text-divider-strong">|</span>
                        <span>{plan.total_duration_min} دقيقة</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-text-secondary">
                        <MapPin size={14} />
                        <span>{waypointsCount} نقطة</span>
                      </div>
                    </td>
                    <td className="p-4 text-text-tertiary text-xs">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(plan.created_at)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <select 
                          className="rounded border p-1 text-xs"
                          disabled={statusLoading === plan.id}
                          value={plan.status}
                          onChange={(e) => handleStatusChange(plan.id, e.target.value as any)}
                        >
                          <option value="active">تفعيل</option>
                          <option value="draft">مسودة</option>
                          <option value="inactive">تعطيل</option>
                          <option value="archived">أرشيف</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
