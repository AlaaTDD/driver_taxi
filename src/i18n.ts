import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const resolvedLocale = cookieStore.get("NEXT_LOCALE")?.value || "ar";
  const messages = (await import(`../messages/${resolvedLocale}.json`)).default;
  return {
    locale: resolvedLocale,
    messages,
    timeZone: "Africa/Cairo",
    now: new Date(),
  };
});
