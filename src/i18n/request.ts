/**
 * i18n request config (server-side).
 *
 * next-intl calls this on every request to determine the active locale and load
 * the corresponding messages JSON. Wired up via plugin in next.config.ts.
 */

import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Read the locale from the URL's [locale] segment. If the URL doesn't
  // contain a known locale (e.g. someone forced an unknown one), fall back
  // to the default locale so we never crash.
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Dynamic import keeps each locale's JSON in its own bundle chunk —
  // Danish strings don't ship to English users.
  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
