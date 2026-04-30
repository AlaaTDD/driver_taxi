"use client";

import { useLocale } from "next-intl";

export function LanguageSwitcher() {
  const locale = useLocale();

  const toggleLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-divider bg-surface-elevated text-text-secondary hover:text-text-primary hover:border-primary/50"
    >
      <span className="uppercase tracking-wider">{locale === "ar" ? "EN" : "AR"}</span>
      <span className="text-text-tertiary">|</span>
      <span className="text-[11px]">{locale === "ar" ? "English" : "العربية"}</span>
    </button>
  );
}
