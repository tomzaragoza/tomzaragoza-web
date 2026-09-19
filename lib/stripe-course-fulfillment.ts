import "server-only";

import type Stripe from "stripe";
import { recordPaidCoursePurchase } from "@/lib/course-entitlements";
import { paidXAdsPurchaseFromCheckout, type PaidXAdsPurchase } from "@/lib/stripe-course-purchase";
import { getStripe } from "@/lib/stripe";

export async function fulfillPaidXAdsCheckout(
  checkoutSession: Stripe.Checkout.Session,
  expectedUserId?: string
): Promise<PaidXAdsPurchase | null> {
  const purchase = paidXAdsPurchaseFromCheckout(checkoutSession, expectedUserId);
  if (!purchase) return null;

  await recordPaidCoursePurchase(purchase);
  return purchase;
}

export async function fulfillXAdsCheckoutSession(
  checkoutSessionId: string,
  expectedUserId?: string
): Promise<PaidXAdsPurchase | null> {
  if (!checkoutSessionId.startsWith("cs_") || checkoutSessionId.length > 255) {
    throw new Error("Invalid Checkout Session ID.");
  }

  const stripe = getStripe();
  if (!stripe) throw new Error("Checkout is temporarily unavailable.");

  const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);
  return fulfillPaidXAdsCheckout(checkoutSession, expectedUserId);
}
