import { createHash } from "node:crypto";
import type { PaidXAdsPurchase } from "./stripe-course-purchase";

export function getXAdsPurchasePixelData(purchase: PaidXAdsPurchase) {
  return {
    email_address: purchase.email,
    value: purchase.amountTotal === null ? null : purchase.amountTotal / 100,
    currency: purchase.currency?.toUpperCase() ?? null,
    conversion_id: createHash("sha256").update(purchase.checkoutSessionId).digest("hex")
  };
}

export type XAdsPurchasePixelData = ReturnType<typeof getXAdsPurchasePixelData>;
