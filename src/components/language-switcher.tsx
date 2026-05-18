"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";



export function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pillRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  const setLanguage = (newLocale: string) => {
    if (newLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    router.refresh();
  };

  const isAr = locale === "ar";
  const activeIdx = isAr ? 0 : 1;

  useEffect(() => {
    if (!pillRef.current || collapsed) return;
    const btns = pillRef.current.querySelectorAll<HTMLButtonElement>("[data-lang-btn]");
    const activeBtn = btns[activeIdx];
    if (!activeBtn) return;
    
    // Slight delay to ensure DOM is fully rendered before measuring
    requestAnimationFrame(() => {
      const activeBtn = btns[activeIdx];
      if (!pillRef.current || !activeBtn) return;
      const parentRect = pillRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      
      // Calculate position relative to parent (RTL-aware)
      const offsetLeft = btnRect.left - parentRect.left;
      
      setIndicatorStyle({
        width: btnRect.width,
        height: btnRect.height,
        transform: `translateX(${offsetLeft}px)`,
        transition: "transform 280ms cubic-bezier(0.16, 1, 0.3, 1), width 280ms ease",
      });
    });
  }, [activeIdx, collapsed]);

  /* ━━ COLLAPSED: compact globe button ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  if (collapsed) {
    return (
      <button
        onClick={() => setLanguage(isAr ? "en" : "ar")}
        aria-label={t("language")}
        title={t("language")}
        className="group relative w-[40px] h-[40px] rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 bg-primary/10 border border-primary/20"
      >
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary/5" />
        <Globe
          size={16}
          className="relative transition-all duration-200 group-hover:scale-110 text-primary drop-shadow-[0_0_4px_rgba(var(--primary-rgb),0.4)]"
        />
      </button>
    );
  }

  /* ━━ EXPANDED: two-button toggle matching the theme design ━━ */
  return (
    <div className="flex items-center justify-end w-full" style={{ padding: "4px 6px" }}>
      <div
        ref={pillRef}
        className="relative flex items-center rounded-lg overflow-hidden"
        style={{
          background: "var(--primary-surface)",
          border: "1px solid var(--accent-border)",
          padding: 2,
        }}
      >
        {/* sliding active indicator */}
        <div
          className="absolute top-[2px] left-0 rounded-md pointer-events-none z-0 bg-primary/20 shadow-[0_0_8px_rgba(var(--primary-rgb),0.08)]"
          style={indicatorStyle}
        />

        {/* Arabic button */}
        <button
          data-lang-btn
          onClick={() => setLanguage("ar")}
          aria-label="العربية"
          className={`relative z-10 flex items-center justify-center px-2 py-1.5 rounded-md transition-all duration-200 text-[11px] font-bold ${isAr ? 'text-primary drop-shadow-[0_0_4px_rgba(var(--primary-rgb),0.5)]' : 'text-[var(--text-disabled)]'}`}
        >
          عربي
        </button>

        {/* English button */}
        <button
          data-lang-btn
          onClick={() => setLanguage("en")}
          aria-label="English"
          className={`relative z-10 flex items-center justify-center px-2 py-1.5 rounded-md transition-all duration-200 text-[11px] font-bold tracking-wider ${!isAr ? 'text-primary drop-shadow-[0_0_4px_rgba(var(--primary-rgb),0.5)]' : 'text-[var(--text-disabled)]'}`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
