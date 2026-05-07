/**
 * Homepage (Server Component, locale-aware).
 *
 * Reads translated strings via getTranslations() from src/messages/{en,da}.json
 * based on the active [locale] segment in the URL.
 *
 * Architecture notes:
 *   - SERVER component, no "use client" directive.
 *   - getAllProducts() and getTranslations() both run on the Node side.
 *   - Currency formatting uses the active locale (en: "DKK 8,000.00", da: "8.000,00 kr.").
 *   - force-dynamic so adding a product in Shopify admin shows up on refresh.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllProducts } from "@/modules/products/api";
import { formatMoney } from "@/lib/money";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { Link } from "@/i18n/navigation";
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
      {/* Sandbox banner */}
      <div className="border-b border-stone-200 bg-amber-50 px-6 py-2 text-center text-xs uppercase tracking-widest text-amber-900">
        {tBanner("label")}
      </div>

      <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-24">
        <header className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
              {tHome("tagline")}
            </p>
            <LocaleSwitcher />
          </div>
          <h1 className="font-serif text-5xl leading-tight tracking-tight text-stone-900 sm:text-6xl">
            {tHome("title")}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-stone-600">
            {tHome("intro")}
          </p>
        </header>

        <section className="flex flex-col gap-6 border-t border-stone-200 pt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl tracking-tight">
              {tHome("productsHeading")}
            </h2>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
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
            <div className="rounded border border-stone-200 bg-white p-10 text-center">
              <p className="font-serif text-xl text-stone-700">
                {tHome("emptyTitle")}
              </p>
              <p className="mt-3 text-sm text-stone-500">{tHome("emptyHint")}</p>
            </div>
          )}

          {result.ok && result.value.length > 0 && (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.value.map((product) => (
                <li
                  key={product.id}
                  className="flex flex-col gap-3 rounded border border-stone-200 bg-white p-5"
                >
                  {product.featuredImage && (
                    <Link
                      href={`/products/${product.handle}`}
                      className="block"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-stone-100">
                        {/* Plain <img> for v1; Weekend 2 next commit swaps to next/image. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.featuredImage.url}
                          alt={product.featuredImage.altText ?? product.title}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                        />
                      </div>
                    </Link>
                  )}
                  <div className="flex flex-col gap-1">
                    <h3 className="font-serif text-lg leading-tight tracking-tight">
                      <Link
                        href={`/products/${product.handle}`}
                        className="hover:underline"
                      >
                        {product.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-stone-600">
                      {formatMoney(product.priceRange.minVariantPrice, locale)}
                    </p>
                    {!product.availableForSale && (
                      <p className="text-xs uppercase tracking-wider text-stone-400">
                        {tHome("soldOut")}
                      </p>
                    )}
                  </div>
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
