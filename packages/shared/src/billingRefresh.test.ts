import assert from "node:assert/strict";
import test from "node:test";
import {
  refreshTeamBillingIfNeeded,
  withoutBillingSearchParam,
} from "./billingRefresh";

test("removes the billing param without disturbing the rest of the search string", () => {
  assert.equal(withoutBillingSearchParam("?billing=success"), "");
  assert.equal(withoutBillingSearchParam("?billing=cancel&tab=usage"), "?tab=usage");
  assert.equal(withoutBillingSearchParam("?tab=usage&billing=success"), "?tab=usage");
  assert.equal(withoutBillingSearchParam("?tab=usage"), "?tab=usage");
});

test("skips refreshes when billing is already fresh and not forced", async () => {
  let calls = 0;

  const refreshed = await refreshTeamBillingIfNeeded({
    teamId: "team_123",
    billingLastSyncedAt: 100_000,
    search: "",
    now: 100_500,
    refresh: async () => {
      calls += 1;
    },
  });

  assert.equal(refreshed, false);
  assert.equal(calls, 0);
});

test("dedupes concurrent refreshes for the same team", async () => {
  let calls = 0;
  let handled = 0;
  let releaseRefresh!: () => void;

  const refreshBlocker = new Promise<void>((resolve) => {
    releaseRefresh = resolve;
  });

  const refresh = async () => {
    calls += 1;
    await refreshBlocker;
  };

  const firstRefresh = refreshTeamBillingIfNeeded({
    teamId: "team_123",
    billingLastSyncedAt: undefined,
    search: "?billing=success",
    refresh,
    onForceRefreshHandled: () => {
      handled += 1;
    },
  });

  const secondRefresh = refreshTeamBillingIfNeeded({
    teamId: "team_123",
    billingLastSyncedAt: undefined,
    search: "?billing=success",
    refresh,
    onForceRefreshHandled: () => {
      handled += 1;
    },
  });

  releaseRefresh();

  const [firstResult, secondResult] = await Promise.all([
    firstRefresh,
    secondRefresh,
  ]);

  assert.equal(calls, 1);
  assert.equal(handled, 1);
  assert.equal(firstResult, true);
  assert.equal(secondResult, false);
});
