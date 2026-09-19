import type { PricingTier } from "./pricing-parity";

// September 30, 2026 at 12:00 a.m. in Toronto (EDT).
export const xAdsPresaleEndsAt = Date.parse("2026-09-30T04:00:00.000Z");

const prices = {
  course: { presale: 2000, regular: 4900 },
  pro: { presale: 9900, regular: 19800 }
} as const;

export function isXAdsPresaleActive(now: number) {
  return now < xAdsPresaleEndsAt;
}

export function getXAdsPrice(tier: PricingTier, now: number) {
  return prices[tier][isXAdsPresaleActive(now) ? "presale" : "regular"];
}

export function getXAdsRegularPrice(tier: PricingTier) {
  return prices[tier].regular;
}

export function formatXAdsPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}
