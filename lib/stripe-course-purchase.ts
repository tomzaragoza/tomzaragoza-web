import type Stripe from "stripe";

export type PaidXAdsPurchase = {
  checkoutSessionId: string;
  userId: string | null;
  email: string;
  tier: "course" | "pro";
  stripeCustomerId: string | null;
  amountTotal: number | null;
  currency: string | null;
  purchasedAt: Date;
};

function isPricingTier(value: string | undefined): value is PaidXAdsPurchase["tier"] {
  return value === "course" || value === "pro";
}

function stripeCustomerId(customer: Stripe.Checkout.Session["customer"]) {
  if (typeof customer === "string") return customer;
  return customer?.id ?? null;
}

export function paidXAdsPurchaseFromCheckout(
  checkoutSession: Stripe.Checkout.Session,
  expectedUserId?: string
): PaidXAdsPurchase | null {
  if (checkoutSession.mode !== "payment" || checkoutSession.payment_status !== "paid") {
    return null;
  }

  const tier = checkoutSession.metadata?.course_tier;
  const userId = checkoutSession.client_reference_id || checkoutSession.metadata?.user_id || null;

  if (
    !isPricingTier(tier) ||
    checkoutSession.metadata?.purchase !== `x-ads-${tier}`
  ) {
    return null;
  }

  if (expectedUserId && userId !== expectedUserId) {
    throw new Error("Checkout Session belongs to a different account.");
  }

  const email = (checkoutSession.customer_details?.email || checkoutSession.customer_email || "")
    .trim()
    .toLowerCase();
  if (!email) {
    throw new Error("Paid Checkout Session has no customer email.");
  }

  return {
    checkoutSessionId: checkoutSession.id,
    userId,
    email,
    tier,
    stripeCustomerId: stripeCustomerId(checkoutSession.customer),
    amountTotal: checkoutSession.amount_total,
    currency: checkoutSession.currency,
    purchasedAt: new Date(checkoutSession.created * 1000)
  };
}
