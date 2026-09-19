import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const checkoutSessionId = requestUrl.searchParams.get("session_id");
  if (!checkoutSessionId?.startsWith("cs_") || checkoutSessionId.length > 255) {
    return NextResponse.redirect(new URL("/x-ads", requestUrl), 303);
  }

  const destination = new URL("/x-ads/checkout-complete", requestUrl);
  const response = NextResponse.redirect(destination, 303);
  response.cookies.set("x_ads_checkout_session", checkoutSessionId, {
    httpOnly: true,
    secure: requestUrl.protocol === "https:",
    sameSite: "lax",
    path: "/x-ads/checkout-complete",
    maxAge: 10 * 60
  });
  return response;
}
