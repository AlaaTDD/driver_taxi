"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Sun, Moon } from "lucide-react";
import { useSyncExternalStore, useCallback, useRef, useEffect, useState } from "react";

function getServerSnapshot() { return false; }
function getSnapshot() { return true; }
function subscribe() { return () => {}; }



export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { setTheme, resolvedTheme } = useTheme();
  const t = useTranslations("common");
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const pillRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  const isDark = resolvedTheme === "dark";
  const activeIdx = isDark ? 1 : 0;

  useEffect(() => {
    if (!pillRef.current || collapsed) return;
    const btns = pillRef.current.querySelectorAll<HTMLButtonElement>("[data-theme-btn]");
    const activeBtn = btns[activeIdx];
    if (!pillRef.current || !activeBtn) return;
    const parentRect = pillRef.current.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    setIndicatorStyle({
      width: btnRect.width,
      height: btnRect.height,
      transform: `translateX(${btnRect.left - parentRect.left}px)`,
      transition: "transform 280ms cubic-bezier(0.16, 1, 0.3, 1), width 280ms ease",
    });
  }, [activeIdx, collapsed, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  if (!mounted) return <div className={collapsed ? "w-[40px] h-[40px]" : "h-[32px]"} />;

  /* ━━ COLLAPSED: single cycling icon ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  if (collapsed) {
    const Icon = isDark ? Moon : Sun;
    return (
      <button
        onClick={toggleTheme}
        aria-label={t("theme")}
        title={t("theme")}
        className="group relative w-[40px] h-[40px] rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 bg-primary/10 border border-primary/20"
      >
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary/5" />
        <Icon
          size={16}
          className="relative transition-all duration-200 group-hover:scale-110 theme-toggle-icon"
        />
      </button>
    );
  }

  /* ━━ EXPANDED: two-button toggle matching the design ━━━━━━━━━━━━━ */
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
          className="absolute top-[2px] left-0 rounded-md pointer-events-none z-0 theme-toggle-indicator"
          style={indicatorStyle}
        />

        {/* Light button */}
        <button
          data-theme-btn
          onClick={() => setTheme("light")}
          aria-label={t("light")}
          className={`relative z-10 flex items-center justify-center p-1.5 rounded-md transition-all duration-200 ${!isDark ? 'theme-toggle-icon-active' : 'text-[var(--text-disabled)]'}`}
        >
          <Sun size={13} className="transition-all duration-200" />
        </button>

        {/* Dark button */}
        <button
          data-theme-btn
          onClick={() => setTheme("dark")}
          aria-label={t("dark")}
          className={`relative z-10 flex items-center justify-center p-1.5 rounded-md transition-all duration-200 ${isDark ? 'theme-toggle-icon-active' : 'text-[var(--text-disabled)]'}`}
        >
          <Moon size={13} className="transition-all duration-200" />
        </button>
      </div>
    </div>
  );
}
