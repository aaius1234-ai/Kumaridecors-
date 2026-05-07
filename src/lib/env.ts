/**
 * Environment variable loader.
 *
 * Reads from process.env and validates with Zod. If any required value is
 * missing or malformed, throws at boot — better to crash on `bun dev` startup
 * than to ship a broken page to a user.
 *
 * USAGE:
 *   import { env } from "@/lib/env";
 *   console.log(env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN);
 *
 * NEVER:
 *   - Read process.env directly anywhere else in the codebase.
 *   - Add a server-only secret with a NEXT_PUBLIC_ prefix (it would leak to the browser).
 */

import { z } from "zod";

const envSchema = z.object({
  // Shopify dev store, e.g. "kumari-decors.myshopify.com".
  // PUBLIC: it's just a URL, exposed to the browser by design.
  NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: z
    .string()
    .min(1, "NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is required")
    .regex(/\.myshopify\.com$/, "Must end with .myshopify.com"),

  // Storefront API access token from the dev store custom app.
  // PUBLIC: Shopify Storefront tokens are designed to be exposed in client JS.
  NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: z
    .string()
    .min(20, "NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN looks too short"),

  // Stripe publishable key (test mode). PUBLIC by design.
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith("pk_test_", "Must be a Stripe TEST mode publishable key"),

  // Stripe secret key (test mode). SERVER-ONLY — no NEXT_PUBLIC_ prefix.
  // Used in Weekend 4+ when we wire Stripe webhooks. Optional for now.
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith("sk_test_", "Must be a Stripe TEST mode secret key")
    .optional(),

  // Site URL for canonical links and OG metadata.
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

/**
 * Parse process.env once at module load. If validation fails, this throws.
 * The thrown error message lists every missing/malformed variable.
 */
function loadEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
    NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN:
      process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!parsed.success) {
    // Build a human-readable error so the developer sees exactly what's wrong.
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment variables. Check your .env.local file:\n${issues}`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();
