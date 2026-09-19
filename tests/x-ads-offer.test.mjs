import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getXAdsPrice,
  getXAdsRegularPrice,
  isXAdsPresaleActive,
  xAdsPresaleEndsAt
} from "../lib/x-ads-offer.ts";

test("both plans change from presale to regular price at midnight ET on September 30", () => {
  assert.equal(xAdsPresaleEndsAt, Date.parse("2026-09-30T04:00:00.000Z"));
  assert.equal(isXAdsPresaleActive(xAdsPresaleEndsAt - 1), true);
  assert.equal(getXAdsPrice("course", xAdsPresaleEndsAt - 1), 2000);
  assert.equal(getXAdsPrice("pro", xAdsPresaleEndsAt - 1), 9900);

  assert.equal(isXAdsPresaleActive(xAdsPresaleEndsAt), false);
  assert.equal(getXAdsPrice("course", xAdsPresaleEndsAt), 4900);
  assert.equal(getXAdsPrice("pro", xAdsPresaleEndsAt), 19800);
  assert.equal(getXAdsRegularPrice("course"), 4900);
  assert.equal(getXAdsRegularPrice("pro"), 19800);
});
