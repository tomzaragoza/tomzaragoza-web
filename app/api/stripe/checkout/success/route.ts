import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const checkoutSessionId = requestUrl.searchParams.get("session_id");
  if (!checkoutSessionId) {
    return NextResponse.redirect(new URL("/x-ads", requestUrl), 303);
  }

  const destination = new URL("/x-ads/checkout-complete", requestUrl);
  destination.searchParams.set("session_id", checkoutSessionId);
  return NextResponse.redirect(destination, 303);
}
