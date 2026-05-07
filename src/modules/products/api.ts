/**
 * Products API — typed, validated, Result-returning.
 *
 * Each function:
 *   1. Calls Shopify via shopifyRequest()
 *   2. Validates the response with Zod
 *   3. Unwraps the Relay edges/node shape into a flat array
 *   4. Returns Result<T, AppError>
 *
 * Callers should always check `result.ok` before using `result.value`.
 */

import { shopifyRequest } from "@/lib/api/shopify-client";
import { appError, err, ok, type Result } from "@/lib/api/result";
import {
  ALL_PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
} from "@/modules/products/queries";
import {
  allProductsResponseSchema,
  productByHandleResponseSchema,
  type ProductCard,
  type ProductDetail,
} from "@/modules/products/schema";

/**
 * Fetch the most recently created N products.
 *
 * @param first - how many to fetch. Default 20, max 250 (Storefront API limit).
 * @returns Result containing flat array of ProductCard, or AppError.
 */
export async function getAllProducts(
  first: number = 20,
): Promise<Result<ProductCard[]>> {
  // 1. Call Shopify. Returns Result<unknown>.
  const response = await shopifyRequest<unknown>(ALL_PRODUCTS_QUERY, { first });
  if (!response.ok) {
    return response;
  }

  // 2. Validate the response shape. If Shopify returns something unexpected,
  //    this fails here with a clear "schema mismatch" error rather than
  //    crashing in the UI when we try to read `.title` on undefined.
  const parsed = allProductsResponseSchema.safeParse(response.value);
  if (!parsed.success) {
    return err(
      appError(
        "validation_error",
        `Shopify returned an unexpected response shape: ${parsed.error.message}`,
        parsed.error,
      ),
    );
  }

  // 3. Unwrap Relay edges/node into a flat array.
  const products = parsed.data.products.edges.map((edge) => edge.node);

  return ok(products);
}

/**
 * Fetch a single product by its URL handle.
 *
 * @param handle - Shopify product handle (URL slug)
 * @returns Result containing ProductDetail with images flattened, or:
 *           - "not_found" AppError if Shopify returned product: null
 *           - "validation_error" if the response shape is unexpected
 *           - "shopify_error" if the network call failed
 *
 * Caller pattern:
 *   const r = await getProductByHandle(handle);
 *   if (!r.ok) {
 *     if (r.error.code === "not_found") return notFound();
 *     return showError(r.error);
 *   }
 *   const product = r.value;
 */
export async function getProductByHandle(
  handle: string,
): Promise<Result<ProductDetail>> {
  const response = await shopifyRequest<unknown>(PRODUCT_BY_HANDLE_QUERY, {
    handle,
  });
  if (!response.ok) return response;

  const parsed = productByHandleResponseSchema.safeParse(response.value);
  if (!parsed.success) {
    return err(
      appError(
        "validation_error",
        `Shopify returned an unexpected product detail shape: ${parsed.error.message}`,
        parsed.error,
      ),
    );
  }

  // Shopify returns null when the handle doesn't match an active product.
  if (!parsed.data.product) {
    return err(
      appError("not_found", `No active product with handle "${handle}".`),
    );
  }

  return ok(parsed.data.product);
}
