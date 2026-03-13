export type TeamPlan = "basic" | "pro";

export const GIBIBYTE = 1024 ** 3;
export const TEAM_TRIAL_DAYS = 7;
export const BILLING_REFRESH_STALE_MS = 60_000;
export const TEAM_PLAN_IDS = ["basic", "pro"] as const satisfies readonly TeamPlan[];
export const TEAM_PLAN_MONTHLY_PRICE_USD = {
  basic: 5,
  pro: 25,
} as const satisfies Record<TeamPlan, number>;
export const TEAM_PLAN_STORAGE_LIMIT_BYTES = {
  basic: 100 * GIBIBYTE,
  pro: 1024 * GIBIBYTE,
} as const satisfies Record<TeamPlan, number>;
export const TEAM_PLAN_LABELS = {
  basic: "Basic",
  pro: "Pro",
} as const satisfies Record<TeamPlan, string>;
export const TEAM_PLAN_SEATS = "Unlimited";
export const TEAM_ACTIVE_BILLING_STATUSES = [
  "active",
  "trialing",
  "past_due",
] as const;

export function normalizeTeamPlan(plan: string): TeamPlan {
  if (plan === "pro" || plan === "team") return "pro";
  return "basic";
}

export function hasActiveBillingStatus(status: string | null | undefined) {
  return (
    typeof status === "string" &&
    TEAM_ACTIVE_BILLING_STATUSES.includes(
      status as (typeof TEAM_ACTIVE_BILLING_STATUSES)[number],
    )
  );
}

export function getDashboardBillingLabel(
  plan: string,
  billingStatus: string | null | undefined,
) {
  if (!hasActiveBillingStatus(billingStatus)) return "Unpaid";
  return TEAM_PLAN_LABELS[normalizeTeamPlan(plan)];
}

export function shouldRefreshBilling(
  billingLastSyncedAt: number | null | undefined,
  forceRefresh: boolean,
  now = Date.now(),
) {
  if (forceRefresh) return true;
  if (typeof billingLastSyncedAt !== "number") return true;
  return now - billingLastSyncedAt > BILLING_REFRESH_STALE_MS;
}
