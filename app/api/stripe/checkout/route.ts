import { NextResponse } from "next/server";
import { getGoogleAuth } from "@/lib/google-auth";
import { parsePricingTier } from "@/lib/pricing-parity";
import { getStripe } from "@/lib/stripe";
import { getXAdsPrice, isXAdsPresaleActive } from "@/lib/x-ads-offer";

export const runtime = "nodejs";

function safeReturnPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "/x-ads";
  }

  return value === "/x-ads" || value.startsWith("/x-ads/")
    ? value
    : "/x-ads";
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const requestOrigin = request.headers.get("origin");
  const wantsJson = request.headers.get("accept")?.includes("application/json") ?? false;

  if (requestOrigin && requestOrigin !== requestUrl.origin) {
    return new Response("Invalid request origin.", { status: 403 });
  }

  const stripe = getStripe();

  if (!stripe) {
    return new Response("Checkout is temporarily unavailable.", { status: 503 });
  }

  const formData = await request.formData();
  const returnPath = safeReturnPath(formData.get("returnPath"));
  const auth = getGoogleAuth();
  const authSession = auth
    ? await auth.api.getSession({ headers: request.headers }).catch(() => null)
    : null;
  const userId = authSession?.user.id;

  const pricingTier = parsePricingTier(formData.get("pricingTier"));
  const now = Date.now();
  const presale = isXAdsPresaleActive(now);
  const unitAmount = getXAdsPrice(pricingTier, now);
  const productName = pricingTier === "pro"
    ? "X Ads Course — Pro with 30-minute consultation"
    : "X Ads Course";

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      client_reference_id: userId,
      customer_email: authSession?.user.email,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: productName },
          unit_amount: unitAmount
        },
        quantity: 1
      }],
      success_url: `${requestUrl.origin}/x-ads/checkout-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${requestUrl.origin}${returnPath}`,
      integration_identifier: "x_ads_presale_kxvtrmqa",
      metadata: {
        purchase: `x-ads-${pricingTier}`,
        course_tier: pricingTier,
        ...(userId ? { user_id: userId } : {}),
        offer: presale ? "presale" : "regular"
      }
    });

    if (!checkoutSession.url) {
      return new Response("Checkout is temporarily unavailable.", { status: 502 });
    }

    return wantsJson
      ? NextResponse.json({ url: checkoutSession.url, unitAmount, currency: "USD" })
      : NextResponse.redirect(checkoutSession.url, 303);
  } catch (error) {
    console.error("Could not create Stripe Checkout Session.", error);
    return new Response("Checkout is temporarily unavailable.", { status: 502 });
  }
}
