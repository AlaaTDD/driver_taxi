"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { useRef, useEffect, useState } from "react";

/* ───── تم توحيد اللون على أزرق الكوبالت الأساسي ───── */
const PRIMARY_RGB = "27,78,192";

export function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const pillRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  const setLanguage = (newLocale: string) => {
    if (newLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
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
      const parentRect = pillRef.current!.getBoundingClientRect();
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
        className="group relative w-[40px] h-[40px] rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90"
        style={{
          background: `rgba(${PRIMARY_RGB}, 0.08)`,
          border: `1px solid rgba(${PRIMARY_RGB}, 0.15)`,
        }}
      >
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: `rgba(${PRIMARY_RGB}, 0.06)` }}
        />
        <Globe
          size={16}
          className="relative transition-all duration-200 group-hover:scale-110"
          style={{
            color: `rgb(${PRIMARY_RGB})`,
            filter: `drop-shadow(0 0 4px rgba(${PRIMARY_RGB}, 0.4))`,
          }}
        />
      </button>
    );
  }

  /* ━━ EXPANDED: two-button toggle matching the theme design ━━ */
  return (
    <div className="flex items-center gap-2 w-full" style={{ padding: "4px 6px" }}>
      <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: "var(--sb-footer-text)" }}>
        {t("language")}
      </span>
      <div
        ref={pillRef}
        className="relative flex items-center rounded-lg overflow-hidden ms-auto"
        style={{
          background: "var(--sb-icon-bg)",
          border: "1px solid var(--sb-nav-hover-border)",
          padding: 2,
        }}
      >
        {/* sliding active indicator */}
        <div
          className="absolute top-[2px] left-0 rounded-md pointer-events-none z-0"
          style={{
            ...indicatorStyle,
            background: `rgba(${PRIMARY_RGB}, 0.18)`,
            boxShadow: `0 0 8px rgba(${PRIMARY_RGB}, 0.08)`,
          }}
        />

        {/* Arabic button */}
        <button
          data-lang-btn
          onClick={() => setLanguage("ar")}
          className="relative z-10 flex items-center justify-center px-2 py-1.5 rounded-md transition-all duration-200 text-[11px] font-bold"
          style={{
            color: isAr ? `rgb(${PRIMARY_RGB})` : "var(--sb-footer-text)",
            filter: isAr ? `drop-shadow(0 0 4px rgba(${PRIMARY_RGB}, 0.5))` : "none",
          }}
        >
          عربي
        </button>

        {/* English button */}
        <button
          data-lang-btn
          onClick={() => setLanguage("en")}
          className="relative z-10 flex items-center justify-center px-2 py-1.5 rounded-md transition-all duration-200 text-[11px] font-bold tracking-wider"
          style={{
            color: !isAr ? `rgb(${PRIMARY_RGB})` : "var(--sb-footer-text)",
            filter: !isAr ? `drop-shadow(0 0 4px rgba(${PRIMARY_RGB}, 0.5))` : "none",
          }}
        >
          EN
        </button>
      </div>
    </div>
  );
}