/**
 * One-time seed script: populate the Shopify dev store with Kumari Decors products
 * from the local photoshoot folder.
 *
 * USAGE:
 *   bun run seed                  # creates 20 products from photoshoot images
 *   bun run seed -- --delete-samples   # also deletes the snowboard sample products first
 *   bun run seed -- --dry-run     # logs what it would do without calling Shopify
 *
 * REQUIREMENTS:
 *   - SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local (Admin API token, write_products scope)
 *   - NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN in .env.local
 *   - Photoshoot images at ../Photoshoot images-*\/Photoshoot images/{Carpet,Gods,Masks,Pashmina}/
 *
 * SAFETY:
 *   - Idempotency-by-handle: if a product with the same handle already exists,
 *     skip it (no duplicate). Re-running is safe.
 *   - --delete-samples is OFF by default. Must be explicitly passed.
 *   - --dry-run logs everything without modifying anything.
 *
 * WHY REST INSTEAD OF GRAPHQL:
 *   REST Admin API supports `image.attachment` (base64) which lets us upload local
 *   product photos in a single request. GraphQL would require staged-upload
 *   plumbing (3 calls per image). For a one-time script, REST is simpler.
 */

import fs from "node:fs";
import path from "node:path";

// Tiny .env.local parser. Avoiding dotenv as a dep — the file format is simple.
function loadDotEnv(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`.env.local not found at ${filePath}`);
  }
  const env: Record<string, string> = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    env[key] = value;
  }
  return env;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SANDBOX_ROOT = path.resolve(__dirname, "..");
const env = loadDotEnv(path.join(SANDBOX_ROOT, ".env.local"));

const SHOP_DOMAIN = env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const ADMIN_TOKEN = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION = "2025-04";

if (!SHOP_DOMAIN) {
  console.error("ERROR: NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN missing in .env.local");
  process.exit(1);
}
if (!ADMIN_TOKEN) {
  console.error("ERROR: SHOPIFY_ADMIN_ACCESS_TOKEN missing in .env.local");
  console.error("  Generate one at:");
  console.error(`  https://admin.shopify.com/store/${SHOP_DOMAIN.replace(".myshopify.com", "")}/settings/apps/development`);
  console.error("  Configuration tab -> Admin API integration -> enable write_products, read_products, write_files, read_files");
  process.exit(1);
}

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const DELETE_SAMPLES = argv.includes("--delete-samples");

// Photoshoot folder path (one level above the sandbox).
const PROJECT_ROOT = path.resolve(SANDBOX_ROOT, "..");
const PHOTOSHOOT_BASE = path.join(
  PROJECT_ROOT,
  "Photoshoot images-20260507T070457Z-3-001",
  "Photoshoot images",
);

// ---------------------------------------------------------------------------
// Catalog definition — what to seed
// ---------------------------------------------------------------------------

interface SeedProduct {
  title: string;
  body_html: string;
  product_type: string;
  vendor: string;
  tags: string[];
  price_dkk: number;
  image_path: string;
}

function seedProductsFromFolder(
  folder: string,
  category: string,
  productType: string,
  baseTitle: string,
  prices: number[],
  description: string,
): SeedProduct[] {
  const dir = path.join(PHOTOSHOOT_BASE, folder);
  if (!fs.existsSync(dir)) {
    console.warn(`WARN: folder not found: ${dir}`);
    return [];
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort();

  return files.map((file, index) => ({
    title: `${baseTitle} ${romanNumeral(index + 1)}`,
    body_html: description,
    product_type: productType,
    vendor: "Kumari Decors",
    tags: [category, "Nepal", "Hand-crafted", "Heritage"],
    price_dkk: prices[index] ?? prices[prices.length - 1] ?? 1000,
    image_path: path.join(dir, file),
  }));
}

function romanNumeral(n: number): string {
  const numerals = [
    "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
    "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
  ];
  return numerals[n - 1] ?? `${n}`;
}

const SACRED_SCULPTURES = seedProductsFromFolder(
  "Gods-20251217T121012Z-1-001/Gods",
  "Sacred Sculpture",
  "Sacred Sculpture",
  "Sacred Bronze",
  [8000, 6500, 9500, 11000, 13500, 15000, 7500],
  `<p>Hand-cast in Patan, Nepal by master artisans. Following an unbroken 800-year lineage of Tibetan-Newari sacred sculpture, each piece is poured, chased, and gilded by hand.</p>
<p>Materials: Copper alloy with mercury gilding and hand-painted polychrome details. Mandorla, base, and figure are cast separately and joined by traditional methods.</p>`,
);

const RITUAL_MASKS = seedProductsFromFolder(
  "Masks-20251217T121015Z-1-001/Masks",
  "Ritual Mask",
  "Ritual Mask",
  "Bhairav Mask",
  [1500, 2200, 2800, 3200, 3800, 4500],
  `<p>Carved from sustainably sourced Nepali poplar, then layered with traditional pigments and hand-painted following Newari iconographic conventions.</p>
<p>Wall-mounted. Each mask is a unique piece, hand-finished by a single artisan over several weeks.</p>`,
);

const TIBETAN_RUGS = seedProductsFromFolder(
  "Carpet-20251217T121001Z-1-001/Carpet",
  "Tibetan Rug",
  "Tibetan Rug",
  "Tibetan Tiger Rug",
  [4500, 6000, 8500, 12000],
  `<p>Hand-knotted in the Tibetan tradition by Nepali master weavers. Wool sourced from Tibetan Plateau highland sheep, hand-spun and naturally dyed.</p>
<p>The tiger rug is among the most iconic motifs in Himalayan textile art, traditionally used in tantric meditation practice.</p>`,
);

const PASHMINA = seedProductsFromFolder(
  "Pashmina-20251217T121031Z-1-001/Pashmina",
  "Pashmina",
  "Pashmina",
  "Pashmina Shawl",
  [1500, 2400, 3500],
  `<p>Pure cashmere from the Changthang highlands, hand-loomed in Kathmandu. Each shawl is the work of a single weaver over multiple days.</p>
<p>Care: dry clean only. Light, warm, and breathable.</p>`,
);

const ALL_SEED_PRODUCTS: SeedProduct[] = [
  ...SACRED_SCULPTURES,
  ...RITUAL_MASKS,
  ...TIBETAN_RUGS,
  ...PASHMINA,
];

// ---------------------------------------------------------------------------
// Shopify Admin REST helpers
// ---------------------------------------------------------------------------

const ADMIN_BASE = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}`;

async function adminFetch<T>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${ADMIN_BASE}/${endpoint}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "X-Shopify-Access-Token": ADMIN_TOKEN,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Shopify ${init.method ?? "GET"} ${endpoint} -> ${response.status} ${response.statusText}: ${text}`,
    );
  }

  return (await response.json()) as T;
}

interface ShopifyProductSummary {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  status: string;
}

async function listAllProducts(): Promise<ShopifyProductSummary[]> {
  const collected: ShopifyProductSummary[] = [];
  let pageInfoEndpoint = "products.json?limit=250";

  // Shopify uses cursor-based pagination via Link header. For a sandbox with
  // a few dozen products, one page is enough — but handle the edge case.
  for (let safety = 0; safety < 10; safety++) {
    const response = await fetch(`${ADMIN_BASE}/${pageInfoEndpoint}`, {
      headers: { "X-Shopify-Access-Token": ADMIN_TOKEN },
    });
    if (!response.ok) {
      throw new Error(`Failed to list products: ${response.status}`);
    }
    const body = (await response.json()) as { products: ShopifyProductSummary[] };
    collected.push(...body.products);

    const linkHeader = response.headers.get("Link") ?? "";
    const nextMatch = /<([^>]+)>;\s*rel="next"/.exec(linkHeader);
    if (!nextMatch) break;
    const nextUrl = nextMatch[1];
    const nextEndpoint = nextUrl.split(`/admin/api/${API_VERSION}/`)[1];
    if (!nextEndpoint) break;
    pageInfoEndpoint = nextEndpoint;
  }

  return collected;
}

interface CreateProductInput {
  product: {
    title: string;
    body_html: string;
    vendor: string;
    product_type: string;
    status: "active" | "draft" | "archived";
    tags: string;
    variants: Array<{ price: string; inventory_quantity?: number }>;
    images: Array<{ attachment: string; filename: string; alt?: string }>;
  };
}

interface CreateProductResponse {
  product: { id: number; handle: string; title: string };
}

async function createProduct(seed: SeedProduct): Promise<CreateProductResponse | null> {
  const filename = path.basename(seed.image_path);
  const imageBuffer = fs.readFileSync(seed.image_path);
  const attachment = imageBuffer.toString("base64");

  const payload: CreateProductInput = {
    product: {
      title: seed.title,
      body_html: seed.body_html,
      vendor: seed.vendor,
      product_type: seed.product_type,
      status: "active",
      tags: seed.tags.join(", "),
      variants: [
        {
          price: seed.price_dkk.toFixed(2),
          inventory_quantity: 1,
        },
      ],
      images: [{ attachment, filename, alt: seed.title }],
    },
  };

  if (DRY_RUN) {
    console.log(
      `  [dry-run] would create: "${seed.title}" (${seed.product_type}) at ${seed.price_dkk} DKK with image ${filename} (${(imageBuffer.length / 1024).toFixed(1)} KB)`,
    );
    return null;
  }

  return adminFetch<CreateProductResponse>("products.json", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function deleteProduct(id: number): Promise<void> {
  if (DRY_RUN) return;
  await adminFetch(`products/${id}.json`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\nKumari sandbox seed script`);
  console.log(`==========================`);
  console.log(`shop:           ${SHOP_DOMAIN}`);
  console.log(`api:            ${API_VERSION}`);
  console.log(`mode:           ${DRY_RUN ? "DRY RUN (no API calls)" : "LIVE"}`);
  console.log(`delete samples: ${DELETE_SAMPLES ? "yes" : "no"}`);
  console.log(`products:       ${ALL_SEED_PRODUCTS.length} from photoshoot folder`);
  console.log(`  Sacred:       ${SACRED_SCULPTURES.length}`);
  console.log(`  Masks:        ${RITUAL_MASKS.length}`);
  console.log(`  Rugs:         ${TIBETAN_RUGS.length}`);
  console.log(`  Pashmina:     ${PASHMINA.length}`);
  console.log();

  // Verify connection.
  console.log("[1/4] verifying admin token...");
  try {
    const shop = await adminFetch<{ shop: { name: string; primary_locale: string } }>(
      "shop.json",
    );
    console.log(`  OK. Connected to "${shop.shop.name}" (locale: ${shop.shop.primary_locale}).`);
  } catch (e) {
    console.error("  FAIL.", (e as Error).message);
    process.exit(1);
  }

  // List existing.
  console.log();
  console.log("[2/4] inventorying existing products...");
  const existing = await listAllProducts();
  console.log(`  found ${existing.length} existing product(s).`);
  const existingByHandle = new Map(existing.map((p) => [p.handle, p]));

  // Optionally delete sample products (anything from the default Snowboard catalog).
  if (DELETE_SAMPLES) {
    const samples = existing.filter(
      (p) =>
        p.vendor === "Snowboard Vendor" ||
        p.vendor === "Hydrogen Vendor" ||
        p.title.toLowerCase().includes("snowboard") ||
        p.title.toLowerCase().includes("ski wax") ||
        p.title.toLowerCase().includes("gift card"),
    );
    console.log();
    console.log(`[3/4] deleting ${samples.length} sample product(s)...`);
    for (const p of samples) {
      try {
        await deleteProduct(p.id);
        console.log(`  deleted: "${p.title}"`);
      } catch (e) {
        console.error(`  FAIL deleting "${p.title}":`, (e as Error).message);
      }
    }
  } else {
    console.log();
    console.log("[3/4] skipping sample deletion (re-run with --delete-samples to enable).");
  }

  // Create products.
  console.log();
  console.log(`[4/4] creating ${ALL_SEED_PRODUCTS.length} Kumari product(s)...`);
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const seed of ALL_SEED_PRODUCTS) {
    // Naive idempotency: handle is derived from title. If a product with a
    // similar handle exists, skip (creator's responsibility to clear before re-seeding).
    const expectedHandle = seed.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (existingByHandle.has(expectedHandle)) {
      console.log(`  SKIP (already exists): "${seed.title}"`);
      skipped++;
      continue;
    }

    try {
      const result = await createProduct(seed);
      if (result) {
        console.log(
          `  created: "${result.product.title}" (handle: ${result.product.handle}, id: ${result.product.id})`,
        );
      }
      created++;
    } catch (e) {
      console.error(`  FAIL creating "${seed.title}":`, (e as Error).message);
      failed++;
    }
  }

  console.log();
  console.log(`done. created=${created} skipped=${skipped} failed=${failed}`);
  if (DRY_RUN) {
    console.log();
    console.log("This was a dry run. To actually run:");
    console.log("  bun run seed");
    console.log("Or with sample deletion:");
    console.log("  bun run seed -- --delete-samples");
  } else {
    console.log();
    console.log("Refresh http://localhost:3000 to see the new catalog.");
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
