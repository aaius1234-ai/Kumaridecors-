/**
 * GraphQL queries for the products module.
 *
 * Why string literals (not generated SDK)?
 *   - Dependency-free, easy to read alongside Shopify's docs.
 *   - When you grow into Shopify Codegen later, you replace these one at a time.
 *   - For sandbox learning, you should READ each query and understand exactly
 *     what data Shopify returns. Generated code hides that.
 *
 * Reference: https://shopify.dev/docs/api/storefront/2025-04/queries/products
 *           https://shopify.dev/docs/api/storefront/2025-04/queries/product
 */

/**
 * Fetch the first N active products. Used on the homepage and the catalog page.
 *
 * Returns: products list with basic fields needed for product cards.
 *   - id, handle, title, description (truncated)
 *   - one featured image
 *   - price range (min and max — used when a product has variants)
 *   - availability flag (true if at least one variant is in stock)
 *
 * Variables:
 *   - first: how many products to fetch (max 250 per Storefront API limits)
 */
export const ALL_PRODUCTS_QUERY = /* GraphQL */ `
  query AllProducts($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          handle
          title
          description
          availableForSale
          featuredImage {
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetch a single product by its handle (URL slug).
 *
 * Used on the product detail page (/products/[handle]). Returns richer data
 * than ALL_PRODUCTS_QUERY: full description (HTML), all images, vendor, type,
 * variants for in-stock state, and selected metafields for the maker story
 * (Weekend 2 commit 4 wires those through).
 *
 * Variables:
 *   - handle: the URL-safe product slug (e.g. "vajrapani-sacred-bronze")
 */
export const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      availableForSale
      vendor
      productType
      featuredImage {
        url
        altText
        width
        height
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;
