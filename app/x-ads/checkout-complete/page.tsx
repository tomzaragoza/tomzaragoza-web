import Link from "next/link";
import { fulfillXAdsCheckoutSession } from "@/lib/stripe-course-fulfillment";
import type { PaidXAdsPurchase } from "@/lib/stripe-course-purchase";
import { PurchasePixelEvent } from "./purchase-pixel-event";
import styles from "../x-ads.module.css";

export const dynamic = "force-dynamic";

export default async function CheckoutCompletePage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: checkoutSessionId } = await searchParams;
  let purchase: PaidXAdsPurchase | null = null;

  if (checkoutSessionId) {
    try {
      purchase = await fulfillXAdsCheckoutSession(checkoutSessionId);
    } catch (error) {
      console.error("Could not confirm X Ads checkout.", error);
    }
  }

  return (
    <main className={styles.checkoutCompletePage}>
      <section className={styles.checkoutCompleteCard}>
        <h1>{purchase ? "Your purchase is confirmed" : "We could not confirm your payment yet"}</h1>
        {purchase ? (
          <>
            <PurchasePixelEvent />
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
            Your payment may still be processing. Check your Stripe receipt,
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
