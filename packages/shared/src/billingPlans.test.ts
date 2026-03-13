import test from "node:test";
import assert from "node:assert/strict";
import {
  getDashboardBillingLabel,
  hasActiveBillingStatus,
  shouldRefreshBilling,
} from "./billingPlans";

test("only active billing states unlock paid behavior", () => {
  assert.equal(hasActiveBillingStatus("active"), true);
  assert.equal(hasActiveBillingStatus("trialing"), true);
  assert.equal(hasActiveBillingStatus("past_due"), true);
  assert.equal(hasActiveBillingStatus("scheduled"), false);
  assert.equal(hasActiveBillingStatus("not_subscribed"), false);
  assert.equal(hasActiveBillingStatus(null), false);
});

test("dashboard billing labels no longer depend on a subscription id", () => {
  assert.equal(getDashboardBillingLabel("basic", "active"), "Basic");
  assert.equal(getDashboardBillingLabel("team", "trialing"), "Pro");
  assert.equal(getDashboardBillingLabel("pro", "past_due"), "Pro");
  assert.equal(getDashboardBillingLabel("basic", "scheduled"), "Unpaid");
  assert.equal(getDashboardBillingLabel("basic", null), "Unpaid");
});

test("billing refreshes when stale or forced", () => {
  const now = 100_000;

  assert.equal(shouldRefreshBilling(undefined, false, now), true);
  assert.equal(shouldRefreshBilling(now - 59_000, false, now), false);
  assert.equal(shouldRefreshBilling(now - 61_000, false, now), true);
  assert.equal(shouldRefreshBilling(now, true, now), true);
});
