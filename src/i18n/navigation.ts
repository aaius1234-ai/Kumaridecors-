/**
 * Locale-aware navigation primitives.
 *
 * These wrap next/link, next/navigation, etc. and automatically prefix paths
 * with the active locale. Always import from here, not from next/link directly,
 * for any link or programmatic navigation that should respect locale.
 */

import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
