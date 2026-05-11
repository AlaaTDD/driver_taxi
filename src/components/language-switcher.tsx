"use client";

import { useLocale } from "next-intl";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const locale = useLocale();

  const toggleLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  const isAr = locale === "ar";
  const currentLabel = isAr ? "العربية" : "English";
  const nextLabel = isAr ? "English" : "العربية";

  /* ━━ COLLAPSED: compact globe button ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  if (collapsed) {
    return (
      <button
        onClick={toggleLocale}
        className="group relative w-[40px] h-[40px] rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90"
        style={{
          background: "rgba(56,189,248,0.08)",
          border: "1px solid rgba(56,189,248,0.15)",
        }}
      >
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: "rgba(56,189,248,0.06)" }}
        />
        <Globe
          size={16}
          className="relative transition-all duration-200 group-hover:scale-110"
          style={{
            color: "rgb(56,189,248)",
            filter: "drop-shadow(0 0 4px rgba(56,189,248,0.4))",
          }}
        />
      </button>
    );
  }

  /* ━━ EXPANDED: inside settings card — clean row ━━━━━━━━━━━━━━━━━━━ */
  return (
    <button
      onClick={toggleLocale}
      className="group relative flex items-center justify-between w-full rounded-lg overflow-hidden transition-all duration-200 active:scale-[0.98]"
      style={{ padding: "7px 10px" }}
    >
      {/* hover fill */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "rgba(56,189,248,0.06)" }}
      />

      {/* left: icon + current language */}
      <div className="relative flex items-center gap-2">
        <Globe
          size={13}
          className="flex-shrink-0 transition-all duration-200 group-hover:scale-110"
          style={{
            color: "rgb(56,189,248)",
            filter: "drop-shadow(0 0 3px rgba(56,189,248,0.35))",
          }}
        />
        <span
          className="text-[11px] font-semibold"
          style={{ color: "var(--sb-nav-text)" }}
        >
          {currentLabel}
        </span>
      </div>

      {/* right: switch-to badge */}
      <span
        className="relative text-[9px] font-black px-2 py-0.5 rounded-md transition-all duration-200"
        style={{
          background: "rgba(56,189,248,0.1)",
          color: "rgb(56,189,248)",
          border: "1px solid rgba(56,189,248,0.18)",
        }}
      >
        {nextLabel}
      </span>
    </button>
  );
}
