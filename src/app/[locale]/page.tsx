/**
 * Homepage (Server Component, locale-aware).
 *
 * Renders editorial product cards in a 3-column grid on large screens.
 * Per-card translation, currency, and Link routing all derive from the active
 * [locale] segment.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllProducts } from "@/modules/products/api";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { ProductCard } from "@/features/products/components/ProductCard";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tBanner = await getTranslations({ locale, namespace: "SandboxBanner" });
  const tHome = await getTranslations({ locale, namespace: "Home" });

  const result = await getAllProducts(20);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Sandbox identity banner — present on every page so the project is
          never confused with the production site. */}
      <div className="border-b border-stone-200 bg-amber-50 px-6 py-2 text-center text-[0.6875rem] uppercase tracking-[0.25em] text-amber-900">
        {tBanner("label")}
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-20 sm:py-28">
        <header className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[0.6875rem] uppercase tracking-[0.3em] text-stone-500">
              {tHome("tagline")}
            </p>
            <LocaleSwitcher />
          </div>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
            {tHome("title")}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
            {tHome("intro")}
          </p>
        </header>

        <section className="flex flex-col gap-10 border-t border-stone-200 pt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl tracking-tight sm:text-3xl">
              {tHome("productsHeading")}
            </h2>
            <p className="text-[0.6875rem] uppercase tracking-[0.25em] text-stone-500">
              {result.ok
                ? tHome("productsCount", { count: result.value.length })
                : "fetch failed"}
            </p>
          </div>

          {!result.ok && (
            <div className="rounded border border-red-200 bg-red-50 p-6 text-sm text-red-900">
              <p className="font-medium">{tHome("fetchFailedTitle")}</p>
              <p className="mt-2 text-red-800">
                {result.error.code}: {result.error.message}
              </p>
              <p className="mt-4 text-xs text-red-700">{tHome("fetchFailedHint")}</p>
            </div>
          )}

          {result.ok && result.value.length === 0 && (
            <div className="rounded border border-stone-200 bg-white p-12 text-center">
              <p className="font-serif text-xl text-stone-700">
                {tHome("emptyTitle")}
              </p>
              <p className="mt-3 text-sm text-stone-500">{tHome("emptyHint")}</p>
            </div>
          )}

          {result.ok && result.value.length > 0 && (
            <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {result.value.map((product, index) => (
                <li key={product.id}>
                  <ProductCard
                    product={product}
                    locale={locale}
                    priority={index < 3}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="flex flex-col gap-1 border-t border-stone-200 pt-10 text-sm text-stone-500">
          <p>{tHome("footer")}</p>
          <p>{tHome("footerSub")}</p>
        </footer>
      </main>
    </div>
  );
}
