/**
 * Zod schemas for product API responses.
 *
 * These are the SAFETY NET. Shopify can change response shapes, deprecate fields,
 * or return unexpected nulls. Without validation, malformed data crashes the UI in
 * unpredictable places. With Zod, we crash here, with a clear error, before the
 * UI ever touches bad data.
 *
 * The TypeScript types below are INFERRED from the schemas via z.infer<>. This
 * means the schema is the single source of truth: change the schema, the types
 * update automatically.
 */

import { z } from "zod";

/**
 * Shopify Money — amount is a string (decimal-safe), currencyCode is ISO 4217.
 */
export const moneySchema = z.object({
  amount: z.string(),
  currencyCode: z.string().length(3),
});
export type Money = z.infer<typeof moneySchema>;

/**
 * Shopify Image — URL is required; altText, width, height may be null.
 */
export const imageSchema = z.object({
  url: z.string().url(),
  altText: z.string().nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});
export type ProductImage = z.infer<typeof imageSchema>;

/**
 * A product card — the shape used by ALL_PRODUCTS_QUERY.
 * Field-by-field this maps to the GraphQL response in queries.ts.
 */
export const productCardSchema = z.object({
  id: z.string(),
  handle: z.string(),
  title: z.string(),
  description: z.string(),
  availableForSale: z.boolean(),
  featuredImage: imageSchema.nullable(),
  priceRange: z.object({
    minVariantPrice: moneySchema,
    maxVariantPrice: moneySchema,
  }),
});
export type ProductCard = z.infer<typeof productCardSchema>;

/**
 * The top-level shape of the AllProducts query response.
 * GraphQL wraps everything in `products.edges[].node`, which is Relay's
 * pagination convention. We unwrap it on the way out (see api.ts).
 */
export const allProductsResponseSchema = z.object({
  products: z.object({
    edges: z.array(
      z.object({
        node: productCardSchema,
      }),
    ),
  }),
});
export type AllProductsResponse = z.infer<typeof allProductsResponseSchema>;
