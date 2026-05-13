import { getTranslations } from "next-intl/server";
import { Settings, Shield, Globe, Palette } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function SettingsPage() {
  const t = await getTranslations();

  return (
    <>
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
            <Shield size={18} style={{ color: "var(--info)" }} />
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

        {/* Settings options */}
        <div className="dash-card p-6 flex flex-col gap-6">
          
          <div className="flex items-center justify-between pb-6 border-b border-divider">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-divider flex items-center justify-center flex-shrink-0 text-text-secondary">
                <Palette size={20} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-text-primary">المظهر</h3>
                <p className="text-[12px] text-text-tertiary mt-0.5">تغيير مظهر لوحة التحكم (فاتح / داكن)</p>
              </div>
            </div>
            <div className="w-[140px]">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-divider flex items-center justify-center flex-shrink-0 text-text-secondary">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-text-primary">اللغة</h3>
                <p className="text-[12px] text-text-tertiary mt-0.5">تغيير لغة لوحة التحكم</p>
              </div>
            </div>
            <div className="w-[140px]">
              <LanguageSwitcher />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
