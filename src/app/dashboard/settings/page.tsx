import { getTranslations } from "next-intl/server";
import {
  Settings as SettingsIcon,
  Globe, Palette, Database,
  CreditCard, Mail, Shield, Plug, Layers,
  Layout, AppWindow,
} from "lucide-react";
import { ThemeToggle }    from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { createAdminClient } from "@/lib/supabase/server";
import { AppConfigRow }   from "./app-config-form";

// ─── Category meta ────────────────────────────────────────────────────────────

const CAT_ICONS: Record<string, React.ReactNode> = {
  general:       <Database   size={16} />,
  payments:      <CreditCard size={16} />,
  notifications: <Mail       size={16} />,
  security:      <Shield     size={16} />,
  integrations:  <Plug       size={16} />,
  ui:            <AppWindow  size={16} />,
};

const CAT_LABELS: Record<string, string> = {
  general: "عام",
  payments: "المدفوعات",
  notifications: "الإشعارات",
  security: "الأمان",
  integrations: "الربط",
  ui: "الواجهة",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SettingsPage() {
  const t = await getTranslations();
  let supabase, appConfig, error;
  try {
    supabase = createAdminClient();

    const result = await supabase
      .from("app_config")
      .select("*")
      .order("category")
      .order("key");
      
    appConfig = result.data;
    error = result.error;

    if (error) {
      throw error;
    }
  } catch (err: any) {
    if (err && (err.digest === 'DYNAMIC_SERVER_USAGE' || err.message?.includes('dynamic-server-error') || err.message?.includes('Dynamic server usage'))) {
      throw err;
    }
    console.error("Settings Page Error:", err);
    return (
      <div className="p-8 text-center rounded-2xl bg-error/10 border border-error/20 text-error max-w-2xl mx-auto my-12">
        <h2 className="text-xl font-bold mb-2">حدث خطأ (Server Error)</h2>
        <p className="text-sm font-semibold mb-4">
          {process.env.NODE_ENV === "development" ? (err?.message || String(err)) : "حدث خطأ غير متوقع أثناء تحميل الإعدادات. يرجى المحاولة لاحقاً."}
        </p>
        <p className="text-[11px] text-text-secondary mb-4 text-right">
          يرجى التحقق من إعدادات مفاتيح البيئة (Environment Variables) وجداول قاعدة البيانات (app_config).
        </p>
        {process.env.NODE_ENV === "development" && err?.stack && (
          <pre className="p-4 rounded bg-black/80 text-white text-xs text-left overflow-auto max-h-60 font-mono dir-ltr">
            {err.stack}
          </pre>
        )}
      </div>
    );
  }

  const configItems = appConfig || [];
  const categories  = Array.from(
    new Set(configItems.map((c) => c.category || "general"))
  );
  const grouped = Object.fromEntries(
    categories.map((cat) => [
      cat,
      configItems.filter((c) => (c.category || "general") === cat),
    ])
  );

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24 px-2">
      {/* ── Page Header ── */}
      <div className="flex items-start gap-5 pb-8 border-b border-divider">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm">
          <SettingsIcon size={28} className="text-primary" />
        </div>
        <div className="flex-1 mt-1.5">
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
            {t("settings.title") || "الإعدادات العامة"}
          </h1>
          <p className="text-sm text-text-secondary mt-2 max-w-2xl leading-relaxed">
            {t("settings.subtitle") || "تحكم في كافة خصائص النظام، التفضيلات الشخصية، ومتغيرات التطبيق من مكان واحد بشكل سهل ومنظم."}
          </p>
        </div>
      </div>

      {/* ── Section: Personal Preferences ── */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 px-1">
          <Layout size={20} className="text-text-primary" />
          <h2 className="text-xl font-bold text-text-primary">تفضيلات الواجهة</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Theme Card */}
          <div className="bg-surface border border-divider rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-colors shadow-sm group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-divider flex items-center justify-center text-text-secondary group-hover:text-primary transition-colors flex-shrink-0">
                <Palette size={20} />
              </div>
              <div>
                <p className="text-base font-bold text-text-primary">{t("settings.appearance") || "المظهر"}</p>
                <p className="text-xs text-text-tertiary mt-1">اختر النمط الفاتح أو الداكن</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Language Card */}
          <div className="bg-surface border border-divider rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-colors shadow-sm group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-divider flex items-center justify-center text-text-secondary group-hover:text-primary transition-colors flex-shrink-0">
                <Globe size={20} />
              </div>
              <div>
                <p className="text-base font-bold text-text-primary">{t("settings.language") || "اللغة"}</p>
                <p className="text-xs text-text-tertiary mt-1">تغيير لغة لوحة التحكم</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </section>

      {/* ── Section: System Variables ── */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between px-1 pb-4 border-b border-divider">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-text-primary">إعدادات النظام (Database)</h2>
          </div>
          <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
            {configItems.length} متغير
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-3xl bg-surface border border-dashed border-divider py-24 flex flex-col items-center justify-center text-text-disabled gap-4">
            <div className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center">
              <Database size={32} className="opacity-40" />
            </div>
            <p className="text-base font-bold text-text-secondary">لا توجد إعدادات مسجلة في قاعدة البيانات حالياً</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 relative items-start">
            
            {/* Sticky Sidebar Navigation */}
            <div className="md:w-56 lg:w-64 flex-shrink-0 sticky top-24">
              <div className="space-y-1 bg-surface border border-divider p-2 rounded-2xl shadow-sm">
                <p className="px-4 py-3 text-xs font-bold text-text-tertiary uppercase tracking-wider">
                  تصنيفات الإعدادات
                </p>
                {categories.map((cat) => (
                  <a
                    key={cat}
                    href={`#cat-${cat}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-text-tertiary group-hover:text-primary transition-colors border border-divider">
                      {CAT_ICONS[cat] ?? <Layers size={14} />}
                    </span>
                    <span className="flex-1">{CAT_LABELS[cat] || cat}</span>
                    <span className="text-[10px] font-mono font-bold bg-surface text-text-tertiary group-hover:bg-primary/10 group-hover:text-primary px-2 py-1 rounded-md border border-divider transition-colors">
                      {grouped[cat].length}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Content List */}
            <div className="flex-1 space-y-12 min-w-0">
              {categories.map((cat) => (
                <div key={cat} id={`cat-${cat}`} className="scroll-mt-28 space-y-5">
                  <div className="flex items-center gap-2.5 px-1">
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {CAT_ICONS[cat] ?? <Layers size={14} />}
                    </span>
                    <h3 className="text-lg font-bold text-text-primary">{CAT_LABELS[cat] || cat}</h3>
                  </div>
                  
                  <div className="bg-surface border border-divider rounded-2xl shadow-sm overflow-hidden divide-y divide-divider">
                    {grouped[cat].map((config: any) => (
                      <AppConfigRow key={config.key} config={config} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        )}
      </section>
    </div>
  );
}
const _SettingsPageDummy = () => {
  return (
    <div></div>
  );
}