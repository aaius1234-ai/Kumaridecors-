/**
 * Homepage (Server Component).
 *
 * Fetches products from Shopify on the server, renders them in a simple list.
 * This is intentionally minimal — Weekend 2 introduces real editorial layouts.
 * Today's goal: prove the wiring works end-to-end.
 *
 * Architecture notes:
 *   - This is a SERVER component (no "use client" directive).
 *   - getAllProducts() runs on the Node side, so the API call to Shopify
 *     happens server-to-server, never browser-to-Shopify.
 *   - No useState, no useEffect, no client JS. The HTML arrives ready-rendered.
 */

import { getAllProducts } from "@/modules/products/api";
import { formatMoney } from "@/lib/money";

// Re-fetch from Shopify on every request. Add a product in admin, refresh,
// you see it. Without this, Next.js would cache the response indefinitely.
// In production you'd use ISR (e.g. `export const revalidate = 60`); for the
// sandbox, full dynamic is more educational and the traffic doesn't matter.
export const dynamic = "force-dynamic";

export default async function Home() {
  const result = await getAllProducts(20);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Sandbox banner — visible reminder this is not production */}
      <div className="border-b border-stone-200 bg-amber-50 px-6 py-2 text-center text-xs uppercase tracking-widest text-amber-900">
        Sandbox · learning project · not kumaridecors.com
      </div>

      <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-24">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
            Hand-crafted in Nepal · Carried to Copenhagen
          </p>
          <h1 className="font-serif text-5xl leading-tight tracking-tight text-stone-900 sm:text-6xl">
            Kumari Decors
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-stone-600">
            Live data from a Shopify development store. This page is a Server
            Component — products are fetched at request time on the server.
          </p>
        </header>

        <section className="flex flex-col gap-6 border-t border-stone-200 pt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl tracking-tight">
              Products
            </h2>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
              {result.ok ? `${result.value.length} live` : "fetch failed"}
            </p>
          </div>

          {/* THREE BRANCHES, ALL HANDLED EXPLICITLY:
              1. Fetch failed -> show the error with cause for debugging.
              2. Fetch succeeded but no products -> show empty state.
              3. Fetch succeeded with products -> render the list. */}

          {!result.ok && (
            <div className="rounded border border-red-200 bg-red-50 p-6 text-sm text-red-900">
              <p className="font-medium">Could not load products from Shopify.</p>
              <p className="mt-2 text-red-800">
                {result.error.code}: {result.error.message}
              </p>
              <p className="mt-4 text-xs text-red-700">
                Check that NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and
                NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN are correct in
                .env.local, and that your dev store is running.
              </p>
            </div>
          )}

          {result.ok && result.value.length === 0 && (
            <div className="rounded border border-stone-200 bg-white p-10 text-center">
              <p className="font-serif text-xl text-stone-700">
                No products yet.
              </p>
              <p className="mt-3 text-sm text-stone-500">
                Add a product in your Shopify admin (status = Active), then
                refresh this page. It will appear here automatically.
              </p>
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
                    <div className="aspect-square w-full overflow-hidden bg-stone-100">
                      {/* Plain <img> for simplicity in v1; Weekend 2 swaps to next/image. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText ?? product.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <h3 className="font-serif text-lg leading-tight tracking-tight">
                      {product.title}
                    </h3>
                    <p className="text-sm text-stone-600">
                      {formatMoney(product.priceRange.minVariantPrice, "en")}
                    </p>
                    {!product.availableForSale && (
                      <p className="text-xs uppercase tracking-wider text-stone-400">
                        Sold out
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="flex flex-col gap-1 border-t border-stone-200 pt-10 text-sm text-stone-500">
          <p>Weekend 1 of 6. Next: editorial product detail pages + Danish locale.</p>
          <p>See ../DESIGN.md and ../SANDBOX_PLAN.md for context.</p>
        </footer>
      </main>
    </div>
  );
}
