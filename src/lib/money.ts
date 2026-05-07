/**
 * Money formatting helpers.
 *
 * Shopify returns prices as `{ amount: "8000.00", currencyCode: "DKK" }`.
 * Render them with Intl.NumberFormat — the standards-compliant, locale-aware way.
 *
 * USAGE:
 *   formatMoney({ amount: "8000.00", currencyCode: "DKK" }, "da")
 *     -> "8.000,00 kr."
 *   formatMoney({ amount: "8000.00", currencyCode: "DKK" }, "en")
 *     -> "DKK 8,000.00"
 */

import type { Locale } from "@/i18n/routing";
import type { Money } from "@/modules/products/schema";

export function formatMoney(money: Money, locale: Locale = "en"): string {
  const amount = Number(money.amount);

  // Defensive: Shopify can in theory return a non-numeric string.
  if (Number.isNaN(amount)) {
    return `${money.currencyCode} ${money.amount}`;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currencyCode,
  }).format(amount);
}
