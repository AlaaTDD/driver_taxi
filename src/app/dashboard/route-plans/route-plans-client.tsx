"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { updateRoutePlanStatus } from "./actions";
import { Navigation, MapPin, AlertCircle, Clock } from "lucide-react";
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
      <div className="rounded-xl border border-error/20 bg-error/5 p-5 flex items-start gap-3">
        <AlertCircle size={20} className="text-error mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-error">حدث خطأ أثناء جلب المسارات</h3>
          <p className="text-xs text-error/80 mt-1">{error}</p>
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "border-success/30 bg-success/10 text-success";
      case "draft":
        return "border-warning/30 bg-warning/10 text-warning";
      case "inactive":
        return "border-text-disabled/30 bg-text-disabled/10 text-text-secondary";
      case "archived":
        return "border-error/30 bg-error/10 text-error";
      default:
        return "border-divider bg-surface text-text-primary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "نشط";
      case "draft": return "مسودة";
      case "inactive": return "غير نشط";
      case "archived": return "مؤرشف";
      default: return status;
    }
  };

  return (
    <div className="rounded-2xl border border-divider bg-surface flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-divider flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Navigation size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-[15px] font-black text-text-primary leading-none">قائمة المسارات</h3>
            <p className="mt-1 text-[12px] font-medium text-text-tertiary">
              إجمالي {totalCount} مسار
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            className="rounded-lg border border-divider bg-surface px-3 py-1.5 text-[12px] font-bold text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer hover:bg-surface-elevated"
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
      </div>

      {initialData.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-divider">
            <Navigation size={24} className="text-text-disabled" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-secondary">لا توجد مسارات لعرضها</p>
            <p className="text-text-tertiary text-xs mt-1">لم يتم العثور على أي مسارات تطابق البحث</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-surface-elevated border-b border-divider">
              <tr>
                <th className="px-5 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">التعريف</th>
                <th className="px-5 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">الحالة</th>
                <th className="px-5 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">السائق</th>
                <th className="px-5 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">المسافة / الوقت</th>
                <th className="px-5 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">النقاط</th>
                <th className="px-5 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">تاريخ الإنشاء</th>
                <th className="px-5 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {initialData.map((plan) => {
                const driverName = plan.trips?.users?.name || "غير معروف";
                const waypointsCount = plan.trip_route_waypoints?.length || 0;
                
                return (
                  <tr key={plan.id} className="group hover:bg-primary/5 transition-colors duration-200">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-black text-text-primary">
                          {plan.label || `مسار ${plan.id.substring(0, 8)}`}
                        </span>
                        {plan.is_system_generated && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                            تلقائي
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusStyle(plan.status)}`}>
                        {getStatusLabel(plan.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[12px] font-semibold text-text-secondary">{driverName}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary">
                        <span className="text-primary">{plan.total_distance_km} كم</span>
                        <span className="text-divider-strong">•</span>
                        <span>{plan.total_duration_min} دقيقة</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary">
                        <MapPin size={13} className="text-text-tertiary" />
                        <span>{waypointsCount} نقطة</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-tertiary">
                        <Clock size={12} />
                        {formatDate(plan.created_at)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center">
                        <select 
                          className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${statusLoading === plan.id ? 'opacity-50 pointer-events-none' : 'hover:border-primary/50 border-divider bg-surface text-text-secondary'}`}
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
