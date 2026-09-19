import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePricingRegion, parsePricingTier } from "../lib/pricing-parity.ts";
import { getXAdsPricingLabels, xAdsProPresalePrice } from "../lib/stripe.ts";

test("pricing regions accept only configured PostHog variants", () => {
  assert.equal(parsePricingRegion("global"), "global");
  assert.equal(parsePricingRegion("region-1"), "region-1");
  assert.equal(parsePricingRegion("region-2"), "region-2");
  assert.equal(parsePricingRegion("region-3"), "region-3");
  assert.equal(parsePricingRegion("unknown"), "global");
  assert.equal(parsePricingRegion(null), "global");
});

test("pricing tiers accept only the two checkout products", () => {
  assert.equal(parsePricingTier("course"), "course");
  assert.equal(parsePricingTier("pro"), "pro");
  assert.equal(parsePricingTier("premium"), "course");
  assert.equal(parsePricingTier(null), "course");
});

test("Pro presale display and charge use $99 USD", () => {
  assert.equal(xAdsProPresalePrice.unitAmount, 9900);
  assert.equal(getXAdsPricingLabels().pro.global, "$99 USD");
  assert.equal(getXAdsPricingLabels().pro["region-1"], "$99 USD");
});
