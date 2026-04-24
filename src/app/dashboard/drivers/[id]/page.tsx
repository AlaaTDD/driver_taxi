import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/badge";
import { Car, CheckCircle, ShieldBan, AlertCircle, Star, Phone, Mail, Calendar, User, FileText, ArrowRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch driver profile and user data
  const { data: driver } = await supabase
    .from("drivers_profile")
    .select(`
      id, national_id, national_id_image_url,
      license_number, license_image_url,
      criminal_record_url, vehicle_type, vehicle_brand,
      vehicle_model, vehicle_year, vehicle_color, vehicle_plate,
      vehicle_image_url, is_verified, is_available,
      users!inner(id, name, phone, email, rating, total_trips, is_active, is_blocked, created_at)
    `)
    .eq("id", id)
    .single();

  if (!driver) return notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = driver.users as any;

  return (
    <div className="space-y-6">
      {/* Header & Back button */}
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/drivers" className="inline-flex items-center gap-2 text-text-disabled hover:text-text-primary transition-colors text-sm font-medium w-fit">
          <ArrowRight size={16} />
          العودة للقائمة
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-text-primary mb-2 flex items-center gap-3">
              {user.name}
              <Badge variant={user.is_blocked ? "error" : driver.is_verified ? "success" : "warning"} dot>
                {user.is_blocked ? "محظور" : driver.is_verified ? "معتمد" : "بانتظار الاعتماد"}
              </Badge>
            </h1>
            <p className="text-text-secondary text-sm">التسجيل: {formatDate(user.created_at)}</p>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <Link
              href={`/dashboard/messages?user_id=${user.id}`}
              className="px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 transition-opacity hover:opacity-80"
              style={{ background: "rgba(56,189,248,0.1)", color: "#7DD3FC", border: "1px solid rgba(56,189,248,0.2)" }}
            >
              <MessageSquare size={14} />
              مراسلة
            </Link>

            <Link
              href={`/dashboard/drivers/revision?driver_id=${driver.id}&name=${encodeURIComponent(user.name)}`}
              className="px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 transition-opacity hover:opacity-80"
              style={{ background: "rgba(139,92,246,0.1)", color: "#C4B5FD", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              <AlertCircle size={14} />
              طلب مراجعة
            </Link>

            <form action="/api/users/block" method="POST">
              <input type="hidden" name="user_id" value={user.id} />
              <input type="hidden" name="action" value={user.is_blocked ? "unblock" : "block"} />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 transition-opacity hover:opacity-80"
                style={{
                  background: user.is_blocked ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  color: user.is_blocked ? "#34D399" : "#F87171",
                  border: `1px solid ${user.is_blocked ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`
                }}
              >
                <ShieldBan size={14} />
                {user.is_blocked ? "فك الحظر" : "حظر السائق"}
              </button>
            </form>

            {!driver.is_verified && !user.is_blocked && (
              <form action="/api/drivers/verify" method="POST">
                <input type="hidden" name="driver_id" value={driver.id} />
                <button type="submit"
                  className="px-4 py-2 rounded-xl text-[12px] font-bold text-white flex items-center gap-2 transition-opacity hover:opacity-80"
                  style={{ background: "linear-gradient(135deg,#10B981,#059669)", boxShadow: "0 3px 8px rgba(16,185,129,0.3)" }}>
                  <CheckCircle size={14} />
                  اعتماد كـ سائق
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="rounded-2xl p-6" style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
            <User size={18} className="text-violet-400" />
            المعلومات الشخصية
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: "1px dashed rgba(255,255,255,0.05)" }}>
              <span className="text-text-disabled text-sm">الاسم</span>
              <span className="text-text-primary font-bold">{user.name}</span>
            </div>
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: "1px dashed rgba(255,255,255,0.05)" }}>
              <span className="text-text-disabled text-sm">رقم الهاتف</span>
              <span className="text-text-primary font-bold num flex items-center gap-1"><Phone size={12} className="text-text-tertiary" /> {user.phone}</span>
            </div>
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: "1px dashed rgba(255,255,255,0.05)" }}>
              <span className="text-text-disabled text-sm">البريد الإلكتروني</span>
              <span className="text-text-primary font-bold flex items-center gap-1">{user.email ? <><Mail size={12} className="text-text-tertiary" /> {user.email}</> : "—"}</span>
            </div>
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: "1px dashed rgba(255,255,255,0.05)" }}>
              <span className="text-text-disabled text-sm">الرقم القومي</span>
              <span className="text-text-primary font-bold num">{driver.national_id || "—"}</span>
            </div>
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: "1px dashed rgba(255,255,255,0.05)" }}>
              <span className="text-text-disabled text-sm">رقم الرخصة</span>
              <span className="text-text-primary font-bold num">{driver.license_number || "—"}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="rounded-2xl p-6" style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
            <Car size={18} className="text-cyan-400" />
            تفاصيل المركبة
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: "1px dashed rgba(255,255,255,0.05)" }}>
              <span className="text-text-disabled text-sm">نوع المركبة</span>
              <span className="text-text-primary font-bold">{driver.vehicle_type === "car" ? "سيارة 🚗" : "دراجة نارية 🏍"}</span>
            </div>
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: "1px dashed rgba(255,255,255,0.05)" }}>
              <span className="text-text-disabled text-sm">الماركة والموديل</span>
              <span className="text-text-primary font-bold">{driver.vehicle_brand} - {driver.vehicle_model}</span>
            </div>
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: "1px dashed rgba(255,255,255,0.05)" }}>
              <span className="text-text-disabled text-sm">سنة الصنع</span>
              <span className="text-text-primary font-bold num">{driver.vehicle_year || "—"}</span>
            </div>
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: "1px dashed rgba(255,255,255,0.05)" }}>
              <span className="text-text-disabled text-sm">لون المركبة</span>
              <span className="text-text-primary font-bold">{driver.vehicle_color || "—"}</span>
            </div>
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: "1px dashed rgba(255,255,255,0.05)" }}>
              <span className="text-text-disabled text-sm">رقم اللوحة</span>
              <span className="text-text-primary font-bold num" style={{ background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "4px" }}>{driver.vehicle_plate || "—"}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="md:col-span-2 rounded-2xl p-6" style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
            <Star size={18} className="text-amber-400" />
            الأداء والإحصائيات
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl text-center" style={{ background: "rgba(15,30,53,0.5)" }}>
              <p className="text-text-disabled text-sm mb-1">التقييم</p>
              <p className="text-2xl font-black num text-amber-400">{user.rating?.toFixed(1) || "0.0"}</p>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: "rgba(15,30,53,0.5)" }}>
              <p className="text-text-disabled text-sm mb-1">إجمالي الرحلات</p>
              <p className="text-2xl font-black num text-blue-400">{user.total_trips || 0}</p>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: "rgba(15,30,53,0.5)" }}>
              <p className="text-text-disabled text-sm mb-1">حالة التوفر</p>
              <p className="text-lg font-bold mt-2" style={{ color: driver.is_available ? "#34D399" : "#64748B" }}>
                {driver.is_available ? "متاح للطلبات" : "غير متاح"}
              </p>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: "rgba(15,30,53,0.5)" }}>
              <p className="text-text-disabled text-sm mb-1">نشاط التطبيق</p>
              <p className="text-lg font-bold mt-2" style={{ color: user.is_active ? "#10B981" : "#F87171" }}>
                {user.is_active ? "نشط" : "غير نشط"}
              </p>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="md:col-span-2 rounded-2xl p-6" style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
            <FileText size={18} className="text-emerald-400" />
            الوثائق والمستندات
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "صورة الهوية الوطنية", url: driver.national_id_image_url },
              { label: "صورة رخصة القيادة", url: driver.license_image_url },
              { label: "صحيفة الحالة الجنائية", url: driver.criminal_record_url },
              { label: "صورة المركبة", url: driver.vehicle_image_url },
            ].map((doc, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <span className="text-text-secondary text-sm font-bold">{doc.label}</span>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="relative group block rounded-xl overflow-hidden aspect-[4/3] bg-black/50 border border-divider">
                    <img src={doc.url} alt={doc.label} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="px-3 py-1.5 rounded-lg text-white font-bold text-[12px]" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}>
                        عرض الصورة
                      </span>
                    </div>
                  </a>
                ) : (
                  <div className="rounded-xl aspect-[4/3] flex items-center justify-center text-text-disabled text-[12px] bg-black/20 border border-divider border-dashed">
                    لم يتم الرفع
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
