/**
 * ProductCard — editorial card used on the homepage and catalog list.
 *
 * Server Component. Displays one product with featured image, title, price,
 * and (optionally) a sold-out tag. Wraps in a locale-aware Link to the product
 * detail page at /products/[handle].
 *
 * Why next/image instead of plain <img>?
 *   - Automatic responsive `srcset` generation (Shopify CDN supports query-string
 *     resizing; Next.js Image runs through its own loader).
 *   - Lazy loading by default (saves bandwidth on long catalog pages).
 *   - Layout shift prevention via explicit width/height.
 *   - Format negotiation (AVIF/WebP) when the browser supports it.
 */

import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { formatMoney } from "@/lib/money";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ProductCard as ProductCardData } from "@/modules/products/schema";

interface ProductCardProps {
  product: ProductCardData;
  locale: Locale;
  // When true, hint to next/image to fetch with high priority (above-the-fold).
  // Use sparingly — typically only the first row of the catalog grid.
  priority?: boolean;
}

export async function ProductCard({
  product,
  locale,
  priority = false,
}: ProductCardProps) {
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <article className="group flex flex-col gap-4">
      <Link
        href={`/products/${product.handle}`}
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
          {product.featuredImage ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-stone-400">
              No image
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-1">
        <h3 className="font-serif text-base leading-snug tracking-tight text-stone-900">
          <Link
            href={`/products/${product.handle}`}
            className="hover:underline focus-visible:outline-none focus-visible:underline"
          >
            {product.title}
          </Link>
        </h3>
        <p className="text-sm tabular-nums text-stone-600">
          {formatMoney(product.priceRange.minVariantPrice, locale)}
        </p>
        {!product.availableForSale && (
          <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-stone-400">
            {t("soldOut")}
          </p>
        )}
      </div>
    </article>
  );
}
