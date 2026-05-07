/**
 * Locale switcher (Server Component, zero client JS).
 *
 * Renders a row of <Link>s — one per locale — to swap between English and Danish.
 * Active locale gets bolder styling and aria-current. Because this is a Server
 * Component using next-intl's locale-aware Link, no JavaScript ships to the browser
 * for this widget at all.
 *
 * For Weekend 2 v1: simple inline links. A dropdown variant (Radix Popover) can
 * land later if the locale list grows beyond 2.
 */

import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export async function LocaleSwitcher() {
  const activeLocale = (await getLocale()) as Locale;
  const t = await getTranslations("LocaleSwitcher");

  return (
    <nav
      aria-label={t("label")}
      className="flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-stone-500"
    >
      {routing.locales.map((locale, index) => {
        const isActive = locale === activeLocale;
        return (
          <span key={locale} className="flex items-center gap-1">
            {index > 0 && <span aria-hidden="true">·</span>}
            <Link
              href="/"
              locale={locale}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "font-medium text-stone-900"
                  : "transition-colors hover:text-stone-700"
              }
            >
              {t(locale)}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
