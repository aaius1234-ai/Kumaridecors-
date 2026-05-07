/**
 * Root layout — intentionally a passthrough.
 *
 * The real <html> and <body> elements live in src/app/[locale]/layout.tsx so
 * the `lang` attribute can match the active locale. This file exists only
 * because Next.js requires app/layout.tsx to be present.
 *
 * Do not put anything here — every page is locale-aware, every page goes
 * through [locale]/layout.tsx.
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
