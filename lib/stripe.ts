import "server-only";

import Stripe from "stripe";

const stripeApiVersion = "2026-07-29.dahlia" as const;

export const xAdsPresalePriceId =
  process.env.STRIPE_X_ADS_PRESALE_PRICE_ID?.trim() ||
  "price_1UFOvSLq4cPFl2NmY2t53bzB";

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
