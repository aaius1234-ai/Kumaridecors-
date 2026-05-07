/**
 * Shopify Storefront API client.
 *
 * Single source of truth for talking to Shopify. Wraps graphql-request so every
 * caller gets the same headers, the same auth token, the same API version, and
 * the same error shape via Result<T, E>.
 *
 * USAGE:
 *   import { shopifyRequest } from "@/lib/api/shopify-client";
 *   import { ALL_PRODUCTS_QUERY } from "@/modules/products/queries";
 *
 *   const result = await shopifyRequest(ALL_PRODUCTS_QUERY, { first: 20 });
 *   if (!result.ok) return handleError(result.error);
 *   return result.value.products.edges;
 */

import { GraphQLClient } from "graphql-request";
import { env } from "@/lib/env";
import { appError, err, ok, type Result } from "@/lib/api/result";

// Pin a stable Storefront API version. Bump this deliberately, after testing —
// don't track "latest" because Shopify deprecates fields and you want predictability.
const STOREFRONT_API_VERSION = "2025-04";

const STOREFRONT_ENDPOINT = `https://${env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/${STOREFRONT_API_VERSION}/graphql.json`;

const client = new GraphQLClient(STOREFRONT_ENDPOINT, {
  headers: {
    "X-Shopify-Storefront-Access-Token": env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    "Content-Type": "application/json",
  },
});

/**
 * Send a GraphQL request to Shopify. Returns Result<T, AppError> instead of
 * throwing — all callers must handle both branches.
 *
 * The generic T is the expected response shape. We intentionally do NOT validate
 * with Zod here — that's the caller's job, after this function returns. This keeps
 * the client thin and lets each module own its own response schema.
 */
export async function shopifyRequest<TResponse>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<Result<TResponse>> {
  try {
    const data = await client.request<TResponse>(query, variables);
    return ok(data);
  } catch (cause) {
    // graphql-request throws on HTTP errors AND on GraphQL `errors` arrays.
    // We could distinguish them here for richer error codes; for sandbox v1 we
    // just lump them together as "shopify_error" and capture the cause.
    const message = cause instanceof Error ? cause.message : "Unknown Shopify error";
    return err(appError("shopify_error", message, cause));
  }
}
