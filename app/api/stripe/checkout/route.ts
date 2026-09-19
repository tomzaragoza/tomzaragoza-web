import { NextResponse } from "next/server";
import { getStripe, xAdsPresalePriceId } from "@/lib/stripe";

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

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      line_items: [{ price: xAdsPresalePriceId, quantity: 1 }],
      success_url: `${requestUrl.origin}/x-ads/checkout-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${requestUrl.origin}${returnPath}`,
      integration_identifier: "x_ads_presale_kxvtrmqa",
      metadata: {
        purchase: "x-ads-course-presale"
      }
    });

    if (!session.url) {
      return new Response("Checkout is temporarily unavailable.", { status: 502 });
    }

    return wantsJson
      ? NextResponse.json({ url: session.url })
      : NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("Could not create Stripe Checkout Session.", error);
    return new Response("Checkout is temporarily unavailable.", { status: 502 });
  }
}
