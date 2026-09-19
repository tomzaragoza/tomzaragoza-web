import { NextResponse } from "next/server";
import { isPayPalId } from "@/lib/paypal";
import { capturePayPalCourseOrder, fulfillPayPalCourseOrder } from "@/lib/paypal-course";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("token") || "";
  if (!isPayPalId(orderId)) return NextResponse.redirect(new URL("/x-ads?checkout=error", url), 303);
  try {
    const order = await capturePayPalCourseOrder(orderId);
    if (order.status !== "COMPLETED") throw new Error("PayPal payment is not complete.");
    try {
      await fulfillPayPalCourseOrder(order);
    } catch (error) {
      console.error("PayPal payment was captured but course access is pending.", error);
    }
    const response = NextResponse.redirect(new URL("/x-ads/checkout-complete", url), 303);
    response.cookies.set("x_ads_paypal_order", orderId, {
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "lax",
      path: "/x-ads/checkout-complete",
      maxAge: 10 * 60
    });
    return response;
  } catch (error) {
    console.error("Could not capture PayPal checkout.", error);
    return NextResponse.redirect(new URL("/x-ads?checkout=error", url), 303);
  }
}
