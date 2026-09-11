import { defineRouting } from "next-intl/routing";

// Arabic is the primary language for this consumer product; English is the
// secondary, verified-after-the-fact layout per frontend-CLAUDE.md.
export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  // Arabic-first is a product decision, not a browser negotiation: visiting
  // "/" must always land on Arabic rather than following the visitor's
  // Accept-Language header.
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
