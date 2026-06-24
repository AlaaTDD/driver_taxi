"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

export interface ActionsMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger" | "success";
  disabled?: boolean;
}

interface ActionsMenuProps {
  items: ActionsMenuItem[];
  /** Label on the trigger button — defaults to the ⋯ icon */
  triggerLabel?: string;
  triggerIcon?: React.ReactNode;
  /** Accessible name for the trigger button. Falls back to triggerLabel, then a generic default. */
  ariaLabel?: string;
}

// Portal-based dropdown so the menu always renders in <body> and NEVER causes
// the table to scroll or clip. Position is calculated from the trigger's bounding
// rect each time the menu opens.
export function ActionsMenu({ items, triggerLabel, triggerIcon, ariaLabel }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate position relative to viewport each time we open
  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuW = 190;
    const viewW = window.innerWidth;
    // prefer opening to the left of the trigger (RTL-friendly)
    const left = rect.right - menuW < 0 ? rect.left : rect.right - menuW;
    setPos({
      top: rect.bottom + 6 + window.scrollY,
      left: Math.min(left, viewW - menuW - 8) + window.scrollX,
    });
  }, []);

  useLayoutEffect(() => {
    if (open) calcPos();
  }, [open, calcPos]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const rePos = () => calcPos();
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", rePos, true);
    window.addEventListener("resize", rePos);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", rePos, true);
      window.removeEventListener("resize", rePos);
    };
  }, [open, calcPos]);

  if (items.length === 0) return null;

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        width: 190,
        zIndex: 9999,
        background: "var(--surface)",
        border: "1px solid var(--divider)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 12px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
        animation: "scale-in 120ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const color =
          item.variant === "danger"
            ? "var(--error)"
            : item.variant === "success"
            ? "var(--success)"
            : "var(--text-secondary)";
        return (
          <button
            key={item.key}
            role="menuitem"
            type="button"
            disabled={item.disabled}
            onClick={() => { setOpen(false); item.onClick(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-bold transition-colors disabled:opacity-40"
            style={{
              color,
              borderBottom: isLast ? "none" : "1px solid var(--divider)",
              textAlign: "right",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                item.variant === "danger" ? "var(--error-surface)" :
                item.variant === "success" ? "var(--success-surface)" :
                "var(--accent-surface)";
            }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            {item.label}
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
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel ?? triggerLabel ?? "More actions"}
        className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-bold transition-all"
        style={{
          background: open ? "var(--accent-surface)" : "var(--surface-elevated)",
          border: `1px solid ${open ? "var(--accent-border)" : "var(--divider)"}`,
          color: open ? "var(--primary)" : "var(--text-tertiary)",
        }}
      >
        {triggerIcon ?? <MoreVertical size={14} />}
        {triggerLabel && <span>{triggerLabel}</span>}
      </button>
      {typeof document !== "undefined" && menu && createPortal(menu, document.body)}
    </>
  );
}
