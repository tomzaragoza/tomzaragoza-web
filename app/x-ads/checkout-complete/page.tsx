import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import { PurchasePixelEvent } from "./purchase-pixel-event";
import styles from "../x-ads.module.css";

export const dynamic = "force-dynamic";

export default async function CheckoutCompletePage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: checkoutSessionId } = await searchParams;
  let isPaid = false;

  if (checkoutSessionId?.startsWith("cs_") && checkoutSessionId.length <= 255) {
    try {
      const session = await getStripe()?.checkout.sessions.retrieve(checkoutSessionId);
      isPaid = session?.mode === "payment" &&
        session.payment_status === "paid" &&
        session.metadata?.purchase === "x-ads-course-presale";
    } catch (error) {
      console.error("Could not confirm X Ads checkout.", error);
    }
  }

  return (
    <main className={styles.checkoutCompletePage}>
      <section className={styles.checkoutCompleteCard}>
        <h1>{isPaid ? "Your purchase is confirmed" : "We could not confirm your payment yet"}</h1>
        {isPaid ? (
          <>
            <PurchasePixelEvent />
            <p>Thank you for purchasing the X Ads course.</p>
          </>
        ) : (
          <p>Your payment may still be processing. Check your Stripe receipt, then return to this page to try again.</p>
        )}
        <Link className={styles.presaleButton} href="/x-ads">Back to the course →</Link>
      </section>
    </main>
  );
}
