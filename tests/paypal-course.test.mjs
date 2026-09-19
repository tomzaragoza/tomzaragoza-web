import assert from "node:assert/strict";
import test from "node:test";
import { validatedPayPalCoursePurchase } from "../lib/paypal-course-validation.ts";

function order(tier = "course", cents = 2000) {
  const value = (cents / 100).toFixed(2);
  return {
    id: "4RN12345678901234",
    intent: "CAPTURE",
    status: "COMPLETED",
    create_time: "2026-09-19T12:00:00Z",
    payer: { email_address: "Buyer@Example.com" },
    purchase_units: [{
      reference_id: "tomzaragoza_x_ads_course",
      custom_id: `x-ads-${tier}-${cents}`,
      amount: { currency_code: "USD", value },
      payments: { captures: [{
        id: "7AB12345678901234",
        status: "COMPLETED",
        final_capture: true,
        amount: { currency_code: "USD", value },
        create_time: "2026-09-19T12:01:00Z"
      }] }
    }]
  };
}

test("PayPal purchase grants the paid course tier and normalized email", () => {
  const course = validatedPayPalCoursePurchase(order());
  assert.equal(course?.tier, "course");
  assert.equal(course?.amountTotal, 2000);
  assert.equal(course?.email, "buyer@example.com");
  assert.equal(course?.paypalCaptureId, "7AB12345678901234");
  assert.equal(validatedPayPalCoursePurchase(order("pro", 9900))?.tier, "pro");
  assert.equal(validatedPayPalCoursePurchase(order("course", 4900))?.amountTotal, 4900);
  assert.equal(validatedPayPalCoursePurchase(order("pro", 19800))?.amountTotal, 19800);
});

test("PayPal purchase rejects incomplete, underpaid, or different product orders", () => {
  const approved = order();
  approved.status = "APPROVED";
  assert.equal(validatedPayPalCoursePurchase(approved), null);

  const underpaid = order("pro", 2000);
  assert.equal(validatedPayPalCoursePurchase(underpaid), null);

  const alteredAmount = order();
  alteredAmount.purchase_units[0].payments.captures[0].amount.value = "1.00";
  assert.equal(validatedPayPalCoursePurchase(alteredAmount), null);

  const differentProduct = order();
  differentProduct.purchase_units[0].reference_id = "other_product";
  assert.equal(validatedPayPalCoursePurchase(differentProduct), null);

  const incompleteCapture = order();
  incompleteCapture.purchase_units[0].payments.captures[0].status = "PENDING";
  assert.equal(validatedPayPalCoursePurchase(incompleteCapture), null);
});
