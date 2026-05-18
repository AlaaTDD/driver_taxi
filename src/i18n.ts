import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

function resolveLocale(rawLocale?: string): Locale {
  return locales.includes(rawLocale as Locale) ? (rawLocale as Locale) : "ar";
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const resolvedLocale = resolveLocale(cookieStore.get("NEXT_LOCALE")?.value);
  const messages = (await import(`../messages/${resolvedLocale}.json`)).default;
  return {
    locale: resolvedLocale,
    messages,
    timeZone: "Africa/Cairo",
    now: new Date(),
  };
});
