import "server-only";

import { recordPaidCoursePurchase } from "@/lib/course-entitlements";
import { paypalRequest, type PayPalOrder } from "@/lib/paypal";
import type { PricingTier } from "@/lib/pricing-parity";
import { amountValue, isPayPalId, paypalCourseReferenceId, validatedPayPalCoursePurchase } from "@/lib/paypal-course-validation";

export async function createPayPalCourseCheckout(input: {
  tier: PricingTier;
  unitAmount: number;
  returnPath: string;
  origin: string;
  requestId: string;
}) {
  const value = amountValue(input.unitAmount);
  const name = input.tier === "pro" ? "X Ads Course — Pro with 30-minute consultation" : "X Ads Course";
  const order = await paypalRequest<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    requestId: input.requestId,
    body: JSON.stringify({
      intent: "CAPTURE",
      payment_source: { paypal: { experience_context: {
        brand_name: "Tom Zaragoza",
        cancel_url: `${input.origin}${input.returnPath}`,
        return_url: `${input.origin}/api/paypal/checkout/capture`,
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW"
      } } },
      purchase_units: [{
        reference_id: paypalCourseReferenceId,
        custom_id: `x-ads-${input.tier}-${input.unitAmount}`,
        amount: {
          currency_code: "USD",
          value,
          breakdown: { item_total: { currency_code: "USD", value } }
        },
        items: [{ name, category: "DIGITAL_GOODS", quantity: "1", unit_amount: { currency_code: "USD", value } }]
      }]
    })
  });
  const approval = order.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href;
  if (!isPayPalId(order.id || "") || !approval) throw new Error("PayPal did not return a checkout URL.");
  const url = new URL(approval);
  if (url.protocol !== "https:" || !["www.paypal.com", "www.sandbox.paypal.com"].includes(url.hostname)) {
    throw new Error("PayPal returned an invalid checkout URL.");
  }
  return { url: url.toString(), unitAmount: input.unitAmount };
}

export async function getPayPalCourseOrder(orderId: string) {
  if (!isPayPalId(orderId)) throw new Error("Invalid PayPal order ID.");
  return paypalRequest<PayPalOrder>(`/v2/checkout/orders/${orderId}`);
}

export async function capturePayPalCourseOrder(orderId: string) {
  const current = await getPayPalCourseOrder(orderId);
  if (current.status === "COMPLETED") return current;
  if (current.status !== "APPROVED") throw new Error("PayPal order is not approved.");
  try {
    return await paypalRequest<PayPalOrder>(`/v2/checkout/orders/${orderId}/capture`, {
      method: "POST", body: "{}", requestId: `tom-x-ads-capture-${orderId}`
    });
  } catch (error) {
    const latest = await getPayPalCourseOrder(orderId);
    if (latest.status === "COMPLETED") return latest;
    throw error;
  }
}

export async function fulfillPayPalCourseOrder(order: PayPalOrder) {
  const purchase = validatedPayPalCoursePurchase(order);
  if (!purchase) return null;
  const capture = await paypalRequest<{ status?: string; amount?: { currency_code?: string; value?: string } }>(
    `/v2/payments/captures/${purchase.paypalCaptureId}`
  );
  if (capture.status !== "COMPLETED" || capture.amount?.currency_code !== "USD" ||
      capture.amount.value !== amountValue(purchase.amountTotal!)) return null;
  const tier = await recordPaidCoursePurchase({ ...purchase, provider: "paypal" });
  return tier ? purchase : null;
}
