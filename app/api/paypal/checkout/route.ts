import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { paypalIsConfigured } from "@/lib/paypal";
import { createPayPalCourseCheckout } from "@/lib/paypal-course";
import { parsePricingTier } from "@/lib/pricing-parity";
import { getXAdsPrice } from "@/lib/x-ads-offer";

export const runtime = "nodejs";

function safeReturnPath(value: FormDataEntryValue | null) {
  return typeof value === "string" && (value === "/x-ads" || /^\/x-ads\/[a-z0-9/-]*$/.test(value))
    ? value : "/x-ads";
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const wantsJson = request.headers.get("accept")?.includes("application/json") ?? false;
  if (origin && origin !== requestUrl.origin) return new Response("Invalid request origin.", { status: 403 });
  if (!paypalIsConfigured()) return new Response("PayPal checkout is temporarily unavailable.", { status: 503 });
  const form = await request.formData();
  const tier = parsePricingTier(form.get("pricingTier"));
  try {
    const checkout = await createPayPalCourseCheckout({
      tier,
      unitAmount: getXAdsPrice(tier, Date.now()),
      returnPath: safeReturnPath(form.get("returnPath")),
      origin: requestUrl.origin,
      requestId: `tom-x-ads-${randomUUID()}`
    });
    return wantsJson
      ? NextResponse.json({ url: checkout.url, unitAmount: checkout.unitAmount, currency: "USD" })
      : NextResponse.redirect(checkout.url, 303);
  } catch (error) {
    console.error("Could not create PayPal checkout.", error);
    return new Response("PayPal checkout is temporarily unavailable.", { status: 502 });
  }
}
