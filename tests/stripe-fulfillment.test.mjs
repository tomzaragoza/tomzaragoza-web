import assert from "node:assert/strict";
import { test } from "node:test";
import { paidXAdsPurchaseFromCheckout } from "../lib/stripe-course-purchase.ts";

function checkoutSession(overrides = {}) {
  return {
    id: "cs_test_paid",
    mode: "payment",
    payment_status: "paid",
    client_reference_id: "user_123",
    customer: "cus_123",
    customer_details: { email: "buyer@example.com" },
    customer_email: null,
    amount_total: 9900,
    currency: "usd",
    created: 1_800_000_000,
    metadata: {
      purchase: "x-ads-pro",
      course_tier: "pro",
      user_id: "user_123"
    },
    ...overrides
  };
}

test("paid Checkout Sessions produce a Pro entitlement", () => {
  const purchase = paidXAdsPurchaseFromCheckout(checkoutSession(), "user_123");
  assert.equal(purchase?.tier, "pro");
  assert.equal(purchase?.userId, "user_123");
  assert.equal(purchase?.checkoutSessionId, "cs_test_paid");
  assert.equal(purchase?.amountTotal, 9900);
});

test("guest Checkout Sessions record a paid purchase by email", () => {
  const purchase = paidXAdsPurchaseFromCheckout(checkoutSession({
    client_reference_id: null,
    customer_details: { email: " Guest@Example.com " },
    metadata: { purchase: "x-ads-pro", course_tier: "pro" }
  }));

  assert.equal(purchase?.userId, null);
  assert.equal(purchase?.email, "guest@example.com");
  assert.equal(purchase?.tier, "pro");
});

test("a paid guest Checkout Session must include an email", () => {
  assert.throws(
    () => paidXAdsPurchaseFromCheckout(checkoutSession({
      client_reference_id: null,
      customer_details: { email: null },
      metadata: { purchase: "x-ads-pro", course_tier: "pro" }
    })),
    /no customer email/
  );
});

test("unpaid or malformed Checkout Sessions do not grant access", () => {
  assert.equal(paidXAdsPurchaseFromCheckout(checkoutSession({ payment_status: "unpaid" })), null);
  assert.equal(paidXAdsPurchaseFromCheckout(checkoutSession({
    metadata: { purchase: "x-ads-pro", course_tier: "premium" }
  })), null);
});

test("a Checkout Session cannot grant access to another account", () => {
  assert.throws(
    () => paidXAdsPurchaseFromCheckout(checkoutSession(), "user_456"),
    /different account/
  );
});
