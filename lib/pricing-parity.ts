export const pricingParityFlagKey = "x-ads-pricing-region";

export const pricingRegions = [
  "global",
  "region-1",
  "region-2",
  "region-3"
] as const;

export type PricingRegion = (typeof pricingRegions)[number];

export type PricingLabels = Readonly<Record<PricingRegion, string>>;

export const pricingTiers = ["course", "pro"] as const;

export type PricingTier = (typeof pricingTiers)[number];

export type TieredPricingLabels = Readonly<Record<PricingTier, PricingLabels>>;

export function parsePricingRegion(value: unknown): PricingRegion {
  return typeof value === "string" && pricingRegions.includes(value as PricingRegion)
    ? (value as PricingRegion)
    : "global";
}

export function parsePricingTier(value: unknown): PricingTier {
  return typeof value === "string" && pricingTiers.includes(value as PricingTier)
    ? (value as PricingTier)
    : "course";
}
