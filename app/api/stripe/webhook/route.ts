import type Stripe from "stripe";
import { fulfillPaidXAdsCheckout } from "@/lib/stripe-course-fulfillment";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get("stripe-signature");

  if (!stripe || !webhookSecret) {
    return new Response("Stripe webhook is not configured.", { status: 503 });
  }

  if (!signature) {
    return new Response("Missing Stripe signature.", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret
    );
  } catch {
    return new Response("Invalid Stripe webhook.", { status: 400 });
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await fulfillPaidXAdsCheckout(event.data.object);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Could not process Stripe webhook.", error);
    return new Response("Could not process Stripe webhook.", { status: 500 });
  }
}
