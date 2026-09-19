import type { PayPalOrder } from "./paypal";
import type { PricingTier } from "./pricing-parity";
import type { PaidXAdsPurchase } from "./stripe-course-purchase";
import { getXAdsPrice, getXAdsRegularPrice, xAdsPresaleEndsAt } from "./x-ads-offer.ts";

export const paypalCourseReferenceId = "tomzaragoza_x_ads_course";

export function isPayPalId(value: string): boolean {
  return /^[A-Z0-9]{10,32}$/.test(value);
}

export function amountValue(cents: number) {
  return (cents / 100).toFixed(2);
}

export function validatedPayPalCoursePurchase(order: PayPalOrder): (PaidXAdsPurchase & { paypalCaptureId: string }) | null {
  if (!isPayPalId(order.id || "") || order.intent !== "CAPTURE" || order.status !== "COMPLETED") return null;
  if (order.purchase_units?.length !== 1) return null;
  const unit = order.purchase_units[0];
  const match = /^x-ads-(course|pro)-(\d+)$/.exec(unit.custom_id || "");
  if (unit.reference_id !== paypalCourseReferenceId || !match || unit.payments?.captures?.length !== 1) return null;
  const tier = match[1] as PricingTier;
  const cents = Number(match[2]);
  const validPrices = new Set<number>([getXAdsPrice(tier, xAdsPresaleEndsAt - 1), getXAdsRegularPrice(tier)]);
  const capture = unit.payments.captures[0];
  if (
    !validPrices.has(cents) || !isPayPalId(capture.id || "") || capture.status !== "COMPLETED" ||
    capture.final_capture === false || unit.amount?.currency_code !== "USD" ||
    capture.amount?.currency_code !== "USD" || unit.amount.value !== amountValue(cents) ||
    capture.amount.value !== amountValue(cents)
  ) return null;
  const email = order.payer?.email_address?.trim().toLowerCase() || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const purchasedAt = new Date(capture.create_time || order.create_time || "");
  if (Number.isNaN(purchasedAt.getTime())) return null;
  return {
    checkoutSessionId: order.id!,
    paypalCaptureId: capture.id!,
    userId: null,
    email,
    tier,
    stripeCustomerId: null,
    amountTotal: cents,
    currency: "usd",
    purchasedAt
  };
}
