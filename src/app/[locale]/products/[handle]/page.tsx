/**
 * Product detail page (Server Component, locale-aware).
 *
 * URL: /products/[handle] (English default) or /da/products/[handle] (Danish).
 *
 * Editorial layout:
 *   - Two columns at lg breakpoint: image gallery on the left, content on the right.
 *   - Stacks single-column on mobile.
 *   - Description rendered from Shopify's pre-sanitized descriptionHtml.
 *
 * Note (Next 16):
 *   `params` is a Promise. Both `locale` and `handle` come from it.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductByHandle } from "@/modules/products/api";
import { formatMoney } from "@/lib/money";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ locale: Locale; handle: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, handle } = await params;
  setRequestLocale(locale);

  const tBanner = await getTranslations({ locale, namespace: "SandboxBanner" });
  const tProduct = await getTranslations({ locale, namespace: "ProductDetail" });

  const result = await getProductByHandle(handle);

  // Shopify said this handle is not an active product → 404 cleanly.
  if (!result.ok && result.error.code === "not_found") {
    notFound();
  }

  // Other failures (network / validation) — show an error UI rather than crash.
  if (!result.ok) {
    return (
      <div className="min-h-screen bg-stone-50 px-6 py-24 text-stone-900">
        <div className="mx-auto max-w-3xl">
          <div className="rounded border border-red-200 bg-red-50 p-6 text-sm text-red-900">
            <p className="font-medium">Failed to load product.</p>
            <p className="mt-2 text-red-800">
              {result.error.code}: {result.error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const product = result.value;
  const galleryImages = product.images.edges.map((edge) => edge.node);
  // De-dupe: featuredImage is usually the first image already, but if the
  // store's gallery doesn't include the featuredImage URL, prepend it.
  const images = product.featuredImage
    ? galleryImages.some((img) => img.url === product.featuredImage?.url)
      ? galleryImages
      : [product.featuredImage, ...galleryImages]
    : galleryImages;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="border-b border-stone-200 bg-amber-50 px-6 py-2 text-center text-[0.6875rem] uppercase tracking-[0.25em] text-amber-900">
        {tBanner("label")}
      </div>

      <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        {/* Top bar: back link + locale switcher */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-[0.6875rem] uppercase tracking-[0.25em] text-stone-500 hover:text-stone-900"
          >
            ← {tProduct("back")}
          </Link>
          <LocaleSwitcher />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          {/* Image gallery — stacked on mobile, full column on desktop */}
          <section aria-label="Product images" className="flex flex-col gap-4">
            {images.length === 0 && (
              <div className="flex aspect-square w-full items-center justify-center bg-stone-100 text-xs uppercase tracking-widest text-stone-400">
                No image
              </div>
            )}
            {images.map((image, index) => (
              <div
                key={`${image.url}-${index}`}
                className="relative aspect-square w-full overflow-hidden bg-stone-100"
              >
                <Image
                  src={image.url}
                  alt={image.altText ?? product.title}
                  fill
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  priority={index === 0}
                  className="object-cover"
                />
              </div>
            ))}
          </section>

          {/* Right column: title, price, vendor, description, CTA */}
          <aside className="flex flex-col gap-8 lg:sticky lg:top-12 lg:h-fit">
            <header className="flex flex-col gap-3">
              {product.productType && (
                <p className="text-[0.6875rem] uppercase tracking-[0.3em] text-stone-500">
                  {product.productType}
                </p>
              )}
              <h1 className="font-serif text-4xl leading-[1.1] tracking-tight text-stone-900 sm:text-5xl">
                {product.title}
              </h1>
              <p className="text-lg tabular-nums text-stone-700">
                {formatMoney(product.priceRange.minVariantPrice, locale)}
              </p>
              {!product.availableForSale && (
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  {tProduct("soldOut")}
                </p>
              )}
            </header>

            {product.descriptionHtml && (
              <div
                className="prose prose-stone max-w-none text-base leading-relaxed text-stone-700 [&_a]:text-stone-900 [&_a]:underline [&_p]:mb-4 [&_strong]:font-medium"
                // Shopify sanitizes descriptionHtml on its side; safe to inject.
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            )}

            {/* Add-to-cart placeholder — Weekend 3 wires this to Shopify cart. */}
            <button
              type="button"
              disabled={!product.availableForSale}
              className="rounded-full bg-stone-900 px-8 py-4 text-sm uppercase tracking-[0.2em] text-stone-50 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {product.availableForSale
                ? tProduct("addToCart")
                : tProduct("soldOut")}
            </button>

            {product.vendor && (
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                {product.vendor}
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
