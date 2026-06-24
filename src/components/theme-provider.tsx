"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";

// next-themes injects an inline <script> tag to set the theme class before
// hydration (avoiding flash-of-wrong-theme). Next.js 16.2+ / React 19 log a
// false-positive "Encountered a script tag while rendering React component"
// warning for this -- the script still runs correctly during SSR, it's just
// a noisy dev-console message. next-themes hasn't been updated since March
// 2025, so this isn't going to be fixed upstream. We filter only this exact
// message (not a blanket override) so other console.error calls still pass
// through untouched.
// Refs: https://github.com/pacocoursey/next-themes/issues/385
//       https://github.com/pacocoursey/next-themes/issues/387
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag while rendering React component")) {
      return;
    }
    originalConsoleError(...args);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
