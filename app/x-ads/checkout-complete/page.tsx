import { cookies } from "next/headers";
import Link from "next/link";
import { fulfillXAdsCheckoutSession } from "@/lib/stripe-course-fulfillment";
import { fulfillPayPalCourseOrder, getPayPalCourseOrder } from "@/lib/paypal-course";
import type { PaidXAdsPurchase } from "@/lib/stripe-course-purchase";
import { getXAdsPurchasePixelData } from "@/lib/x-ads-purchase-pixel";
import { PurchasePixelEvent } from "./purchase-pixel-event";
import styles from "../x-ads.module.css";

export const dynamic = "force-dynamic";

export default async function CheckoutCompletePage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const checkoutSessionId = session_id || (await cookies()).get("x_ads_checkout_session")?.value;
  const paypalOrderId = (await cookies()).get("x_ads_paypal_order")?.value;
  let purchase: PaidXAdsPurchase | null = null;

  if (checkoutSessionId) {
    try {
      purchase = await fulfillXAdsCheckoutSession(checkoutSessionId);
    } catch (error) {
      console.error("Could not confirm X Ads checkout.", error);
    }
  }
  if (!purchase && paypalOrderId) {
    try {
      purchase = await fulfillPayPalCourseOrder(await getPayPalCourseOrder(paypalOrderId));
    } catch (error) {
      console.error("Could not confirm PayPal checkout.", error);
    }
  }

  return (
    <main className={styles.checkoutCompletePage}>
      <section className={styles.checkoutCompleteCard}>
        <h1>{purchase ? "Your purchase is confirmed" : "We could not confirm your payment yet"}</h1>
        {purchase ? (
          <>
            <PurchasePixelEvent data={getXAdsPurchasePixelData(purchase)} />
            <p>
              Your {purchase.tier === "pro" ? "Pro" : "Course"} purchase is recorded.
              The lessons will open when the course launches.
            </p>
            <p>
              When you sign in to access the course, use the same email address
              you entered at checkout.
            </p>
          </>
        ) : (
          <p>
            Your payment may still be processing. Check your payment receipt,
            then return to this page to try again.
          </p>
        )}
        <Link className={styles.presaleButton} href="/x-ads">
          Back to the course →
        </Link>
      </section>
    </main>
  );
}
