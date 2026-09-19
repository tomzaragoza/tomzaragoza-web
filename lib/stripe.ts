import "server-only";

import Stripe from "stripe";
import type {
  PricingLabels,
  PricingRegion,
  PricingTier,
  TieredPricingLabels
} from "@/lib/pricing-parity";

const stripeApiVersion = "2026-07-29.dahlia" as const;

const defaultXAdsCoursePriceId =
  process.env.STRIPE_X_ADS_PRESALE_PRICE_ID?.trim() ||
  "price_1UFOvSLq4cPFl2NmY2t53bzB";

export const xAdsProPresalePrice = {
  unitAmount: 9900,
  label: "$99 USD"
} as const;

const xAdsPriceIds: Record<PricingTier, Record<PricingRegion, string | null>> = {
  course: {
    global: defaultXAdsCoursePriceId,
    "region-1": process.env.STRIPE_X_ADS_PRICE_REGION_1_ID?.trim() || defaultXAdsCoursePriceId,
    "region-2": process.env.STRIPE_X_ADS_PRICE_REGION_2_ID?.trim() || defaultXAdsCoursePriceId,
    "region-3": process.env.STRIPE_X_ADS_PRICE_REGION_3_ID?.trim() || defaultXAdsCoursePriceId
  },
  pro: {
    global: null,
    "region-1": null,
    "region-2": null,
    "region-3": null
  }
};

export function getXAdsPriceId(tier: PricingTier, region: PricingRegion) {
  return xAdsPriceIds[tier][region];
}

function getRegionalLabels(prefix: string, defaultLabel: string): PricingLabels {
  return {
    global: defaultLabel,
    "region-1": process.env[`${prefix}_REGION_1_LABEL`]?.trim() || defaultLabel,
    "region-2": process.env[`${prefix}_REGION_2_LABEL`]?.trim() || defaultLabel,
    "region-3": process.env[`${prefix}_REGION_3_LABEL`]?.trim() || defaultLabel
  };
}

export function getXAdsPricingLabels(): TieredPricingLabels {
  const courseLabel = process.env.X_ADS_PRICE_GLOBAL_LABEL?.trim() || "$20";
  const proLabel = xAdsProPresalePrice.label;

  return {
    course: getRegionalLabels("X_ADS_PRICE", courseLabel),
    pro: {
      global: proLabel,
      "region-1": proLabel,
      "region-2": proLabel,
      "region-3": proLabel
    }
  };
}

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: stripeApiVersion,
    appInfo: {
      name: "Tom Zaragoza X Ads Course",
      version: "1.0.0"
    }
  });
}
