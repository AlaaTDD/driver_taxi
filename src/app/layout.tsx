import type { Metadata } from "next";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

import { Cairo, Inter, IBM_Plex_Mono } from "next/font/google";

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ['latin'], 
  weight: ['400', '500', '700'],
  variable: '--font-mono'
});

export async function generateMetadata(): Promise<Metadata> {
  const messages = await getMessages();
  const t = messages.metadata as Record<string, string>;
  return {
    title: t?.title || "Taxi - Admin Dashboard",
    description: t?.description || "Taxi App Admin Management Dashboard",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const isRTL = locale === "ar";

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${cairo.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className={`min-h-dvh flex flex-col bg-background text-foreground overflow-x-hidden ${isRTL ? "font-(family-name:--font-cairo)" : "font-(family-name:--font-inter)"}`} suppressHydrationWarning>
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
            <Toaster position="top-center" richColors closeButton />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
