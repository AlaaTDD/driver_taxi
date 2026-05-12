import { DashboardShell } from "@/components/dashboard-shell";
import { getTranslations } from "next-intl/server";
import { Settings, Shield } from "lucide-react";

export default async function SettingsPage() {
  const t = await getTranslations();

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(59,130,246,0.12)",
              border: "1px solid rgba(59,130,246,0.2)",
            }}
          >
            <Shield size={18} style={{ color: "#3B82F6" }} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">
              الإعدادات العامة
            </h1>
            <p className="text-sm mt-0.5 text-text-secondary">
              إدارة وتخصيص إعدادات النظام
            </p>
          </div>
        </div>

        {/* Settings content placeholder */}
        <div
          className="dash-card p-8 flex flex-col items-center justify-center gap-4"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
          >
            <Settings size={28} className="text-text-disabled opacity-40" />
          </div>
          <div className="text-center">
            <p className="text-text-secondary font-semibold">صفحة الإعدادات</p>
            <p className="text-text-tertiary text-sm mt-1">سيتم إضافة خيارات الإعدادات قريباً</p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
