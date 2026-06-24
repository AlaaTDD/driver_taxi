"use client";

// Compact dropdown-style tab switcher for the drivers page header.
// Replaces the previous full-width pill row with a single button that opens
// a floating menu — keeps the header clean while still showing counts.

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export interface DriverTabDef {
  key: "pending" | "approved" | "blocked" | "revision";
  label: string;
  count: number;
  icon: React.ReactNode;
}

const TAB_COLORS: Record<DriverTabDef["key"], string> = {
  pending:  "var(--warning)",
  approved: "var(--success)",
  blocked:  "var(--error)",
  revision: "var(--primary)",
};

const TAB_BG: Record<DriverTabDef["key"], string> = {
  pending:  "var(--warning-surface)",
  approved: "var(--success-surface)",
  blocked:  "var(--error-surface)",
  revision: "var(--accent-surface)",
};

const TAB_BORDER: Record<DriverTabDef["key"], string> = {
  pending:  "var(--warning-border)",
  approved: "var(--success-border)",
  blocked:  "var(--error-border)",
  revision: "var(--accent-border)",
};

export function DriversTabs({ tabs, activeTab }: { tabs: DriverTabDef[]; activeTab: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const active = tabs.find((t) => t.key === activeTab) ?? tabs[0];

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6 + window.scrollY, left: rect.left + window.scrollX });
  }, []);

  useLayoutEffect(() => { if (open) calcPos(); }, [open, calcPos]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [open, calcPos]);

  const goTab = (key: string) => {
    setOpen(false);
    if (key === activeTab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    params.delete("page");
    startTransition(() => router.push(`/dashboard/drivers?${params.toString()}`));
  };

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        minWidth: 220,
        zIndex: 9999,
        background: "var(--surface)",
        border: "1px solid var(--divider)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 16px 48px rgba(0,0,0,0.24), 0 2px 8px rgba(0,0,0,0.1)",
        animation: "scale-in 130ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            role="menuitem"
            type="button"
            onClick={() => goTab(tab.key)}
            disabled={isPending}
            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold transition-colors disabled:opacity-50"
            style={{
              background: isActive ? TAB_BG[tab.key] : "transparent",
              color: isActive ? TAB_COLORS[tab.key] : "var(--text-secondary)",
              borderBottom: "1px solid var(--divider)",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = "var(--accent-surface)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isActive ? TAB_BG[tab.key] : "transparent";
            }}
          >
            <span style={{ color: isActive ? TAB_COLORS[tab.key] : "var(--text-tertiary)" }}>
              {tab.icon}
            </span>
            <span className="flex-1 text-right">{tab.label}</span>
            {tab.count > 0 && (
              <span
                className="min-w-[22px] h-[22px] rounded-full text-[10px] font-black flex items-center justify-center px-1.5"
                style={{
                  background: isActive ? TAB_COLORS[tab.key] : "var(--neutral-surface)",
                  color: isActive ? "white" : "var(--text-tertiary)",
                  border: isActive ? "none" : "1px solid var(--divider)",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all disabled:cursor-wait shrink-0"
        style={{
          background: open ? TAB_BG[active?.key ?? "pending"] : "var(--surface-elevated)",
          border: `1px solid ${open ? TAB_BORDER[active?.key ?? "pending"] : "var(--divider)"}`,
          color: open ? TAB_COLORS[active?.key ?? "pending"] : "var(--text-secondary)",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        <span style={{ color: open ? TAB_COLORS[active?.key ?? "pending"] : "var(--text-tertiary)" }}>
          {active?.icon}
        </span>
        <span>{active?.label}</span>
        {active?.count != null && active.count > 0 && (
          <span
            className="min-w-[20px] h-[20px] rounded-full text-[10px] font-black flex items-center justify-center px-1"
            style={{
              background: TAB_COLORS[active.key],
              color: "white",
            }}
          >
            {active.count}
          </span>
        )}
        <ChevronDown
          size={14}
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {typeof document !== "undefined" && menu && createPortal(menu, document.body)}
    </>
  );
}
