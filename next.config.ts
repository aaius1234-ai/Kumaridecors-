import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Wires next-intl into the Next.js compiler. The argument points at the
// request-config file we created at src/i18n/request.ts. next-intl reads it
// per-request to pick the active locale and load the right messages JSON.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Allow Next.js Image to load product photography from Shopify's CDN.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
