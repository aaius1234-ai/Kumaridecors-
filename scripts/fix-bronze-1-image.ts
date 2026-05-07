/**
 * Re-upload the missing image for Sacred Bronze I.
 *
 * The original seed run failed silently to attach God1.jpg (11.28MB) — likely a
 * size quirk in Shopify's REST attachment endpoint with very large base64 payloads.
 * This script uses Shopify's GraphQL stagedUploadsCreate flow, which is more
 * resilient for large files than base64 attach.
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
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  const body = (await r.json()) as { data?: T; errors?: unknown };
  if (body.errors) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  return body.data as T;
}

(async () => {
  const imagePath = path.resolve(
    __dirname,
    "..",
    "..",
    "Photoshoot images-20260507T070457Z-3-001",
    "Photoshoot images",
    "Gods-20251217T121012Z-1-001",
    "Gods",
    "God1.jpg",
  );

  if (!fs.existsSync(imagePath)) {
    console.error(`Image not found: ${imagePath}`);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(imagePath);
  const fileSize = fileBuffer.length;
  console.log(`Image: ${path.basename(imagePath)} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

  // 1. Find the product
  const productData = await gql<{
    products: { edges: Array<{ node: { id: string; title: string } }> };
  }>(`{ products(first: 1, query: "handle:sacred-bronze-i") { edges { node { id title } } } }`);

  const product = productData.products.edges[0]?.node;
  if (!product) {
    console.error("Product 'sacred-bronze-i' not found");
    process.exit(1);
  }
  console.log(`Found product: "${product.title}" (${product.id})`);

  // 2. Create a staged upload target
  const stagedUploadData = await gql<{
    stagedUploadsCreate: {
      stagedTargets: Array<{
        url: string;
        resourceUrl: string;
        parameters: Array<{ name: string; value: string }>;
      }>;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(
    `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters { name value }
        }
        userErrors { field message }
      }
    }`,
    {
      input: [
        {
          filename: "God1.jpg",
          mimeType: "image/jpeg",
          httpMethod: "POST",
          resource: "IMAGE",
          fileSize: fileSize.toString(),
        },
      ],
    },
  );

  if (stagedUploadData.stagedUploadsCreate.userErrors.length) {
    console.error("Staged upload errors:", stagedUploadData.stagedUploadsCreate.userErrors);
    process.exit(1);
  }

  const target = stagedUploadData.stagedUploadsCreate.stagedTargets[0];
  console.log(`Staged target: ${target.url}`);

  // 3. POST the file to the staged target via multipart/form-data
  const form = new FormData();
  for (const param of target.parameters) {
    form.append(param.name, param.value);
  }
  form.append("file", new Blob([fileBuffer], { type: "image/jpeg" }), "God1.jpg");

  const uploadResponse = await fetch(target.url, {
    method: "POST",
    body: form,
  });
  if (!uploadResponse.ok) {
    console.error(`Upload failed: HTTP ${uploadResponse.status}`);
    console.error(await uploadResponse.text().catch(() => ""));
    process.exit(1);
  }
  console.log(`Uploaded to staged target.`);

  // 4. Attach the staged image to the product as media
  const createMediaData = await gql<{
    productCreateMedia: {
      media: Array<{ id: string; status: string }>;
      mediaUserErrors: Array<{ field: string[]; message: string }>;
    };
  }>(
    `mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media { ... on MediaImage { id status } }
        mediaUserErrors { field message }
      }
    }`,
    {
      productId: product.id,
      media: [
        {
          alt: "Vajrapani Sacred Bronze",
          mediaContentType: "IMAGE",
          originalSource: target.resourceUrl,
        },
      ],
    },
  );

  if (createMediaData.productCreateMedia.mediaUserErrors.length) {
    console.error("Create media errors:", createMediaData.productCreateMedia.mediaUserErrors);
    process.exit(1);
  }

  const media = createMediaData.productCreateMedia.media[0];
  console.log(`Attached image to product. Media id: ${media.id}, status: ${media.status}`);
  console.log("\nDone. Refresh http://localhost:3000 in ~30 seconds (Shopify processes large images async).");
})();
