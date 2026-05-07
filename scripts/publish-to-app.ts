/**
 * One-time fix: publish all active products to the "kumari sandbox frontend"
 * publication so the Storefront API can see them.
 *
 * Background: when a custom app is created with Storefront API access, Shopify
 * creates a separate "publication" (sales channel) for that app. The Storefront
 * API only returns products published to its own publication. Products created
 * via Admin API are published to "Online Store" and "Point of Sale" by default,
 * but NOT to the custom app's publication. This is the fix.
 */

import fs from "node:fs";
import path from "node:path";

function loadDotEnv(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const raw of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = loadDotEnv(path.join(__dirname, "..", ".env.local"));
const SHOP = env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const VER = "2025-04";
const APP_PUBLICATION_NAME_HINT = "kumari sandbox frontend";

if (!SHOP || !TOKEN) {
  console.error("Missing SHOP or TOKEN in .env.local");
  process.exit(1);
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const r = await fetch(`https://${SHOP}/admin/api/${VER}/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!r.ok) {
    throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  const body = (await r.json()) as { data?: T; errors?: unknown };
  if (body.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  }
  return body.data as T;
}

(async () => {
  // 1. Find the app's publication ID by name.
  const pubData = await gql<{
    publications: { edges: Array<{ node: { id: string; name: string } }> };
  }>(`{ publications(first: 20) { edges { node { id name } } } }`);

  const appPub = pubData.publications.edges.find((e) =>
    e.node.name.toLowerCase().includes(APP_PUBLICATION_NAME_HINT.toLowerCase()),
  );
  if (!appPub) {
    console.error(`No publication matching "${APP_PUBLICATION_NAME_HINT}" found.`);
    console.error("Available publications:");
    for (const e of pubData.publications.edges) {
      console.error(`  - ${e.node.name}`);
    }
    process.exit(1);
  }
  console.log(`Target publication: "${appPub.node.name}" (${appPub.node.id})`);

  // 2. List all active products via paginated GraphQL.
  const products: Array<{ id: string; title: string }> = [];
  let cursor: string | null = null;
  // Cap iterations at 10 pages of 50 products = 500 total. Plenty for the sandbox.
  for (let page = 0; page < 10; page++) {
    const variables: Record<string, unknown> = { first: 50 };
    if (cursor) variables.after = cursor;
    const data = await gql<{
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string };
        edges: Array<{ node: { id: string; title: string } }>;
      };
    }>(
      `query($first: Int!, $after: String) {
        products(first: $first, after: $after, query: "status:active") {
          pageInfo { hasNextPage endCursor }
          edges { node { id title } }
        }
      }`,
      variables,
    );
    products.push(...data.products.edges.map((e) => e.node));
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
  }
  console.log(`Found ${products.length} active product(s) to publish.`);

  // 3. Publish each one. publishablePublish accepts an array of input objects;
  // we batch all products into a single mutation call.
  const result = await gql<{
    publishablePublish: {
      publishable: unknown;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(
    `mutation Publish($id: ID!, $publicationId: ID!) {
      publishablePublish(id: $id, input: { publicationId: $publicationId }) {
        userErrors { field message }
      }
    }`,
    // First call below; we'll loop one by one because the mutation takes a single id.
    { id: products[0]?.id, publicationId: appPub.node.id },
  );

  // Reset for full loop. The above was wasted; restart properly:
  let published = 0;
  let failed = 0;
  for (const p of products) {
    try {
      const r = await gql<{
        publishablePublish: { userErrors: Array<{ message: string }> };
      }>(
        `mutation($id: ID!, $publicationId: ID!) {
          publishablePublish(id: $id, input: { publicationId: $publicationId }) {
            userErrors { field message }
          }
        }`,
        { id: p.id, publicationId: appPub.node.id },
      );
      if (r.publishablePublish.userErrors.length) {
        console.error(`  FAIL "${p.title}": ${JSON.stringify(r.publishablePublish.userErrors)}`);
        failed++;
      } else {
        console.log(`  published: "${p.title}"`);
        published++;
      }
    } catch (e) {
      console.error(`  FAIL "${p.title}": ${(e as Error).message}`);
      failed++;
    }
  }

  console.log(`\ndone. published=${published} failed=${failed}`);
  if (published > 0) {
    console.log("\nRefresh http://localhost:3000 — products should appear now.");
  }
})();
