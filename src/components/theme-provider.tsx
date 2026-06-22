"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";

// CODE-07 FIX: Removed the global console.error override that suppressed
// "Encountered a script tag" warnings. While harmless in intent, globally
// monkey-patching console.error masked other legitimate runtime errors and
// is considered an anti-pattern. Next.js/React no longer emit this warning
// in recent versions, making the override unnecessary.

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
