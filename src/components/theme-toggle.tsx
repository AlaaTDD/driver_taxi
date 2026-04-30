"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useSyncExternalStore } from "react";

function getServerSnapshot() {
  return false;
}

function getSnapshot() {
  return true;
}

function subscribe() {
  return () => {};
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <div className="flex items-center gap-1 rounded-xl p-1 border border-divider bg-surface-elevated">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-lg transition-all ${theme === "light" ? "bg-primary text-white shadow-sm" : "text-text-tertiary hover:text-text-secondary"}`}
        title="Light"
      >
        <Sun size={14} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-lg transition-all ${theme === "dark" ? "bg-primary text-white shadow-sm" : "text-text-tertiary hover:text-text-secondary"}`}
        title="Dark"
      >
        <Moon size={14} />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-lg transition-all ${theme === "system" ? "bg-primary text-white shadow-sm" : "text-text-tertiary hover:text-text-secondary"}`}
        title="System"
      >
        <Monitor size={14} />
      </button>
    </div>
  );
}
