"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useSyncExternalStore, useCallback, useRef, useEffect, useState } from "react";

function getServerSnapshot() { return false; }
function getSnapshot() { return true; }
function subscribe() { return () => {}; }

const MODES = [
  { key: "light",  Icon: Sun,     label: "فاتح",  rgb: "250,204,21" },
  { key: "dark",   Icon: Moon,    label: "داكن",   rgb: "129,140,248" },
  { key: "system", Icon: Monitor, label: "تلقائي", rgb: "148,163,184" },
] as const;

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const pillRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  const activeIdx = MODES.findIndex((m) => m.key === theme);
  const current = MODES[activeIdx >= 0 ? activeIdx : 2];

  /* sliding indicator position */
  useEffect(() => {
    if (!pillRef.current || collapsed) return;
    const btns = pillRef.current.querySelectorAll<HTMLButtonElement>("[data-theme-btn]");
    const idx = activeIdx >= 0 ? activeIdx : 2;
    const activeBtn = btns[idx];
    if (!activeBtn) return;
    const parentRect = pillRef.current.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    setIndicatorStyle({
      width: btnRect.width,
      height: btnRect.height,
      transform: `translateX(${btnRect.left - parentRect.left}px)`,
      transition: "transform 280ms cubic-bezier(0.16, 1, 0.3, 1), width 280ms ease",
    });
  }, [activeIdx, collapsed, mounted]);

  const cycleTheme = useCallback(() => {
    const order = ["light", "dark", "system"] as const;
    const i = order.indexOf(theme as any);
    setTheme(order[(i + 1) % 3]);
  }, [theme, setTheme]);

  if (!mounted) return <div className={collapsed ? "w-[40px] h-[40px]" : "h-[32px]"} />;

  /* ━━ COLLAPSED: single cycling icon ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  if (collapsed) {
    const Icon = current.Icon;
    return (
      <button
        onClick={cycleTheme}
        className="group relative w-[40px] h-[40px] rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90"
        style={{
          background: `rgba(${current.rgb}, 0.08)`,
          border: `1px solid rgba(${current.rgb}, 0.15)`,
        }}
      >
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: `rgba(${current.rgb}, 0.06)` }}
        />
        <Icon
          size={16}
          className="relative transition-all duration-200 group-hover:scale-110"
          style={{
            color: `rgb(${current.rgb})`,
            filter: `drop-shadow(0 0 4px rgba(${current.rgb}, 0.4))`,
          }}
        />
      </button>
    );
  }

  /* ━━ EXPANDED: segmented control with sliding indicator ━━━━━━━━━━━ */
  return (
    <div
      ref={pillRef}
      className="relative flex items-center rounded-lg overflow-hidden"
      style={{ padding: 2 }}
    >
      {/* sliding active indicator */}
      <div
        className="absolute top-[2px] left-0 rounded-lg pointer-events-none z-0"
        style={{
          ...indicatorStyle,
          background: `rgba(${current.rgb}, 0.14)`,
          boxShadow: `inset 0 0 0 1px rgba(${current.rgb}, 0.2), 0 0 10px rgba(${current.rgb}, 0.06)`,
        }}
      />

      {MODES.map((mode) => {
        const isActive = theme === mode.key;
        const Icon = mode.Icon;
        return (
          <button
            key={mode.key}
            data-theme-btn
            onClick={() => setTheme(mode.key)}
            className="relative z-10 flex-1 flex items-center justify-center gap-1 py-[6px] px-1.5 rounded-lg transition-all duration-200 active:scale-95"
            style={{
              color: isActive ? `rgb(${mode.rgb})` : "var(--sb-footer-text)",
            }}
          >
            <Icon
              size={12}
              style={{
                filter: isActive ? `drop-shadow(0 0 4px rgba(${mode.rgb}, 0.5))` : "none",
                transition: "filter 200ms ease, color 200ms ease",
              }}
            />
            <span className="text-[9px] font-bold leading-none whitespace-nowrap">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
