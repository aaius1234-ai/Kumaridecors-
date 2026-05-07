/**
 * Locale routing middleware.
 *
 * On every incoming request, next-intl's middleware:
 *   1. Reads the URL.
 *   2. Detects the locale from the path prefix (/da/...) or browser Accept-Language.
 *   3. Redirects /products to /en/products (or whatever the default locale is)
 *      when the visitor's first request has no prefix.
 *
 * The matcher below excludes static assets, API routes, and the Next.js
 * internals so the middleware doesn't run on every CSS file request.
 */

import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all paths except:
  //   - /api/*       (API routes don't need locale prefix)
  //   - /_next/*     (Next.js internals)
  //   - static files (anything with a file extension like .png, .ico, .svg)
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
