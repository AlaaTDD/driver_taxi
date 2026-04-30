import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale || "ar";
  const messages = (await import(`../messages/${resolvedLocale}.json`)).default;
  return {
    locale: resolvedLocale,
    messages,
    timeZone: "Africa/Cairo",
    now: new Date(),
  };
});
