/**
 * i18n routing config.
 *
 * Single source of truth for which locales the sandbox supports and which
 * locale-aware navigation primitives are available throughout the app.
 *
 * USAGE:
 *   import { Link, useRouter, redirect } from "@/i18n/routing";
 *
 * Why we re-export from "@/i18n/routing":
 *   next-intl's locale-aware Link/useRouter automatically prefix paths with
 *   the active locale. Use these instead of next/link and next/navigation
 *   anywhere a path is locale-dependent.
 */

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Add a locale to this array to make it available app-wide.
  // Order is irrelevant; pickers should sort by display name in UI.
  locales: ["en", "da"],

  // The default locale used when the URL has no prefix.
  // Visiting "/" (no prefix) redirects to "/en".
  defaultLocale: "en",

  // "as-needed" — default locale URLs do NOT show the prefix in the address bar.
  //   /              -> /en homepage (no /en prefix shown)
  //   /da            -> /da homepage (prefix shown for non-default)
  // "always" would force /en/... for every locale. We pick "as-needed" because
  // it produces cleaner default-locale URLs.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
