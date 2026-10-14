import assert from "node:assert/strict";
import { test } from "node:test";
import { paidXAdsPurchaseFromCheckout } from "../lib/stripe-course-purchase.ts";
import { getXAdsPurchasePixelData } from "../lib/x-ads-purchase-pixel.ts";

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

test("a paid purchase supplies email and value to the X event without exposing its Stripe ID", () => {
  const purchase = paidXAdsPurchaseFromCheckout(checkoutSession());
  assert.ok(purchase);

  const data = getXAdsPurchasePixelData(purchase);
  assert.equal(data.email_address, "buyer@example.com");
  assert.equal(data.value, 99);
  assert.equal(data.currency, "USD");
  assert.match(data.conversion_id, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(data).includes(purchase.checkoutSessionId));
});

test("the X purchase event uses the email collected by Stripe instead of the prefilled email", () => {
  const purchase = paidXAdsPurchaseFromCheckout(checkoutSession({
    customer_details: { email: " StripeBuyer@Example.com " },
    customer_email: "prefilled@example.com"
  }));
  assert.ok(purchase);
  assert.equal(getXAdsPurchasePixelData(purchase).email_address, "stripebuyer@example.com");
});

test("the X purchase event falls back to Stripe customer_email when customer details have no email", () => {
  const purchase = paidXAdsPurchaseFromCheckout(checkoutSession({
    customer_details: null,
    customer_email: " StripeBuyer@Example.com "
  }));
  assert.ok(purchase);
  assert.equal(getXAdsPurchasePixelData(purchase).email_address, "stripebuyer@example.com");
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

test("the course Payment Link accepts paid sessions without course metadata", () => {
  const purchase = paidXAdsPurchaseFromCheckout(checkoutSession({
    payment_link: "plink_1ULCVcLq4cPFl2NmpDfdZMqk",
    metadata: {},
    client_reference_id: "publicly_supplied_user_id"
  }));
  assert.equal(purchase?.tier, "course");
  assert.equal(purchase?.email, "buyer@example.com");
  assert.equal(purchase?.userId, null);
});

test("expanded Payment Links are recognized and unpaid link sessions are rejected", () => {
  const payment_link = { id: "plink_1ULCVcLq4cPFl2NmpDfdZMqk" };
  assert.equal(paidXAdsPurchaseFromCheckout(checkoutSession({ payment_link, metadata: {} }))?.tier, "course");
  assert.equal(paidXAdsPurchaseFromCheckout(checkoutSession({ payment_link, metadata: {}, payment_status: "unpaid" })), null);
  assert.equal(paidXAdsPurchaseFromCheckout(checkoutSession({ payment_link: "plink_other", metadata: {} })), null);
});
