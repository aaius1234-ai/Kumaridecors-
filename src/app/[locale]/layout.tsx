/**
 * Locale-aware root layout.
 *
 * Receives the active locale from the URL via the [locale] dynamic segment,
 * sets <html lang={locale}>, and wraps everything in NextIntlClientProvider
 * so client components can call useTranslations() without re-loading messages.
 *
 * Note (Next 16 breaking change):
 *   `params` is now a Promise. Must await before destructuring.
 *
 * Note (next-intl):
 *   setRequestLocale() inside the layout is what makes Server Components
 *   pick up the right locale via getTranslations(). Without this call, every
 *   useTranslations() in a Server Component would throw.
 */

import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pre-generate the static params for both locales at build time. Without this,
// Next would render every locale on demand. With it, /en and /da are both
// statically known routes.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Defensive: if someone hits /xx (unknown locale), 404 cleanly.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Tell next-intl which locale to use for getTranslations() in Server Components
  // rendered below this layout.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
