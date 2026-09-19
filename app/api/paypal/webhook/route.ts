import { revokePayPalCoursePurchase } from "@/lib/course-entitlements";
import { isPayPalId, paypalRequest } from "@/lib/paypal";
import { fulfillPayPalCourseOrder, getPayPalCourseOrder } from "@/lib/paypal-course";

export const runtime = "nodejs";

type Event = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    supplementary_data?: { related_ids?: { order_id?: string; capture_id?: string } };
    disputed_transactions?: Array<{ seller_transaction_id?: string }>;
  };
};

const revocations = new Set([
  "PAYMENT.CAPTURE.DENIED",
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED"
]);

export async function POST(request: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) return new Response("PayPal webhook is not configured.", { status: 503 });
  let event: Event;
  try {
    event = JSON.parse(await request.text()) as Event;
    const headers = request.headers;
    const auth_algo = headers.get("paypal-auth-algo");
    const cert_url = headers.get("paypal-cert-url");
    const transmission_id = headers.get("paypal-transmission-id");
    const transmission_sig = headers.get("paypal-transmission-sig");
    const transmission_time = headers.get("paypal-transmission-time");
    if (!event.id || !event.event_type || !auth_algo || !cert_url || !transmission_id || !transmission_sig || !transmission_time) {
      return new Response("Invalid PayPal webhook.", { status: 400 });
    }
    const verification = await paypalRequest<{ verification_status?: string }>("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: JSON.stringify({
        auth_algo, cert_url, transmission_id, transmission_sig, transmission_time,
        webhook_event: event, webhook_id: webhookId
      })
    });
    if (verification.verification_status !== "SUCCESS") return new Response("Invalid PayPal webhook.", { status: 400 });
  } catch {
    return new Response("Invalid PayPal webhook.", { status: 400 });
  }
  try {
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id || "";
      if (isPayPalId(orderId)) await fulfillPayPalCourseOrder(await getPayPalCourseOrder(orderId));
    } else if (revocations.has(event.event_type || "")) {
      const captureId = event.resource?.supplementary_data?.related_ids?.capture_id || event.resource?.id || "";
      if (isPayPalId(captureId)) await revokePayPalCoursePurchase(captureId);
    } else if (event.event_type === "CUSTOMER.DISPUTE.CREATED") {
      for (const item of event.resource?.disputed_transactions || []) {
        if (isPayPalId(item.seller_transaction_id || "")) {
          await revokePayPalCoursePurchase(item.seller_transaction_id!);
        }
      }
    }
  } catch (error) {
    console.error("Could not process PayPal webhook.", error);
    return new Response("Could not process PayPal webhook.", { status: 500 });
  }
  return Response.json({ received: true });
}
