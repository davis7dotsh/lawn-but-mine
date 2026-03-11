import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAutumnTeamBilling } from "./autumn";

test("normalizeAutumnTeamBilling maps active Autumn products to local snapshots", () => {
  const trialing = normalizeAutumnTeamBilling(
    {
      products: [
        {
          id: "basic",
          status: "trialing",
          started_at: 10,
          current_period_end: 20,
        },
      ],
    } as never,
    "basic",
  );

  assert.equal(trialing.plan, "basic");
  assert.equal(trialing.billingStatus, "trialing");
  assert.equal(trialing.hasActiveSubscription, true);
  assert.equal(trialing.billingCurrentPeriodEnd, 20);

  const pastDue = normalizeAutumnTeamBilling(
    {
      products: [
        {
          id: "pro",
          status: "past_due",
          started_at: 30,
        },
      ],
    } as never,
    "basic",
  );

  assert.equal(pastDue.plan, "pro");
  assert.equal(pastDue.billingStatus, "past_due");
  assert.equal(pastDue.hasActiveSubscription, true);
});

test("normalizeAutumnTeamBilling treats missing customers as not subscribed", () => {
  const normalized = normalizeAutumnTeamBilling(null, "team");

  assert.equal(normalized.plan, "pro");
  assert.equal(normalized.billingStatus, "not_subscribed");
  assert.equal(normalized.hasActiveSubscription, false);
  assert.equal(normalized.billingProductId, undefined);
});
