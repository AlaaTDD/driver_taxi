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
  let messages;
  if (resolvedLocale === "ar") {
    messages = (await import("../messages/ar.json")).default;
  } else {
    messages = (await import("../messages/en.json")).default;
  }
  return {
    locale: resolvedLocale,
    messages,
    timeZone: "Africa/Cairo",
    now: new Date(),
  };
});
