"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

export const SIDEBAR_EXPANDED_W = 260;
export const SIDEBAR_COLLAPSED_W = 64;

type SidebarCtx = {
  collapsed: boolean;
  toggle: () => void;
};

const Ctx = createContext<SidebarCtx>({ collapsed: false, toggle: () => {} });

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      try {
        const stored = localStorage.getItem("sidebar-collapsed");
        if (!cancelled && stored !== null) setCollapsed(stored === "true");
      } catch { /* SSR / private mode */ }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  const toggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem("sidebar-collapsed", String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ collapsed, toggle }}>{children}</Ctx.Provider>;
}

export const useSidebar = () => useContext(Ctx);
