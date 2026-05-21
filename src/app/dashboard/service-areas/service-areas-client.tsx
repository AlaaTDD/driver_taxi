"use client";

import { useState } from "react";
import { Plus, X, Search, MapPin } from "lucide-react";
import { toast } from "sonner";
import { createServiceArea, toggleServiceArea, testServiceAreaCoverage } from "./actions";

export default function ServiceAreasClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createServiceArea(formData);
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("تم إضافة المنطقة بنجاح");
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 rounded-xl text-[12px] font-bold text-white flex items-center gap-2 transition-opacity hover:opacity-80"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", boxShadow: "0 4px 12px var(--primary-surface)" }}
      >
        <Plus size={14} /> إضافة منطقة خدمة
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-elevated p-6 shadow-2xl border border-divider">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-text-primary">إضافة منطقة خدمة جديدة</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-tertiary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">الاسم (إنجليزي)</label>
                  <input name="name" required className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none" placeholder="e.g. Cairo" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">الاسم (عربي)</label>
                  <input name="name_ar" className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none" placeholder="مثال: القاهرة" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">رمز المنطقة (Code)</label>
                <input name="code" required className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none" placeholder="e.g. CAI" />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Geohash Prefixes</label>
                <textarea name="geohash_prefixes" required rows={3} className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-surface border border-divider outline-none resize-none" placeholder="stq, str, stw (افصل بينها بفاصلة)"></textarea>
                <p className="text-[10px] text-text-tertiary mt-1">يجب إدخال البادئات لتحديد التغطية الجغرافية.</p>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" name="is_active" id="is_active" value="true" defaultChecked className="w-4 h-4 rounded border-divider text-primary focus:ring-primary" />
                <label htmlFor="is_active" className="text-[12px] font-bold text-text-primary">تفعيل المنطقة فوراً</label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-text-secondary hover:bg-surface border border-divider transition-colors">إلغاء</button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50">
                  {loading ? "جاري الحفظ..." : "حفظ المنطقة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function ToggleAreaStatus({ id, is_active }: { id: string; is_active: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await toggleServiceArea(id, !is_active);
      toast.success(is_active ? "تم تعطيل المنطقة" : "تم تفعيل المنطقة");
    } catch {
      toast.error("حدث خطأ أثناء التحديث");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`mt-3 w-full py-2 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50 ${is_active ? 'bg-error/10 text-error border border-error/20' : 'bg-success/10 text-success border border-success/20'}`}
    >
      {is_active ? 'تعطيل المنطقة' : 'تفعيل المنطقة'}
    </button>
  );
}

export function TestCoverageComponent() {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!lat || !lng) return;
    setLoading(true);
    const res = await testServiceAreaCoverage(Number(lat), Number(lng));
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-divider bg-surface-elevated p-5 mt-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Search size={18} className="text-primary" />
        <h3 className="text-sm font-bold text-text-primary">اختبار التغطية الجغرافية (resolve_service_area)</h3>
      </div>
      <div className="flex items-center gap-3">
        <input 
          type="number" 
          step="any" 
          placeholder="خط العرض (Lat)" 
          value={lat} 
          onChange={(e) => setLat(e.target.value)}
          className="w-1/3 px-3 py-2 rounded-lg border border-divider text-sm bg-surface outline-none" 
        />
        <input 
          type="number" 
          step="any" 
          placeholder="خط الطول (Lng)" 
          value={lng} 
          onChange={(e) => setLng(e.target.value)}
          className="w-1/3 px-3 py-2 rounded-lg border border-divider text-sm bg-surface outline-none" 
        />
        <button 
          onClick={handleTest} 
          disabled={loading || !lat || !lng}
          className="w-1/3 px-4 py-2 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? "جاري الفحص..." : <><MapPin size={14}/> فحص المنطقة</>}
        </button>
      </div>
      {result && (
        <div className="mt-4 p-3 rounded-lg bg-surface border border-divider">
          {result.error ? (
            <p className="text-sm text-error">{result.error}</p>
          ) : result.data ? (
            <p className="text-sm text-success font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              يقع ضمن المنطقة: {result.data}
            </p>
          ) : (
            <p className="text-sm text-warning font-bold">لا توجد تغطية في هذه الإحداثيات</p>
          )}
        </div>
      )}
    </div>
  );
}

