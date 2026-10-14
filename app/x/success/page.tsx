import type { Metadata } from "next";
import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import { paidXAdsPurchaseFromCheckout, type PaidXAdsPurchase } from "@/lib/stripe-course-purchase";
import { getXAdsPurchasePixelData } from "@/lib/x-ads-purchase-pixel";
import { PurchasePixelEvent } from "@/app/x-ads/checkout-complete/purchase-pixel-event";
import styles from "@/app/x-ads/x-ads.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Thank you | X Ads Course",
  robots: { index: false, follow: false },
  referrer: "no-referrer"
};

export default async function XAdsSuccessPage({ searchParams }: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const { session_id } = await searchParams;
  let purchase: PaidXAdsPurchase | null = null;
  if (typeof session_id === "string" && /^cs_[a-zA-Z0-9_]+$/.test(session_id) && session_id.length <= 255) {
    try {
      const stripe = getStripe();
      if (stripe) {
        // Read the email from Stripe only after verifying the actual payment.
        // The signed webhook records course access independently of this page.
        purchase = paidXAdsPurchaseFromCheckout(await stripe.checkout.sessions.retrieve(session_id));
      }
    } catch {
      console.error("Could not verify the X Ads payment confirmation.");
    }
  }

  return (
    <main className={styles.checkoutCompletePage}>
      <section className={styles.checkoutCompleteCard}>
        <h1>{purchase ? "Thank you! You’re in." : "We could not confirm your payment yet"}</h1>
        {purchase ? (
          <>
            <PurchasePixelEvent data={getXAdsPurchasePixelData(purchase)} />
            <p>Your X Ads Course presale purchase is confirmed.</p>
            <p>When you sign in to access the course, use the same email address you entered at checkout.</p>
          </>
        ) : (
          <p>Your payment may still be processing. Return from your Stripe checkout or refresh this page to check again.</p>
        )}
        <Link className={styles.presaleButton} href="/x-ads">Back to the course →</Link>
      </section>
    </main>
  );
}
