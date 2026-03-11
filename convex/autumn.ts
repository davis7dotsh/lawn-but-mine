import { Autumn, type Customer, type CustomerProduct } from "autumn-js";
import { Id } from "./_generated/dataModel";
import {
  TEAM_PLAN_IDS,
  hasActiveBillingStatus,
  normalizeTeamPlan,
  type TeamPlan,
} from "../src/shared/billingPlans";

type AutumnCustomerMethods = typeof Autumn.customers;

type AutumnClient = Autumn & {
  customers: AutumnCustomerMethods;
};

type AutumnBillingSnapshot = {
  plan: TeamPlan;
  billingStatus: string;
  billingProductId?: string;
  billingCurrentPeriodEnd?: number;
  hasActiveSubscription: boolean;
};

let autumn: AutumnClient | null = null;

const PRODUCT_STATUS_PRIORITY = {
  active: 0,
  trialing: 1,
  past_due: 2,
  scheduled: 3,
} as const;

function isTeamPlanProduct(product: CustomerProduct) {
  return TEAM_PLAN_IDS.includes(product.id as TeamPlan);
}

function getProductPriority(status: string) {
  return PRODUCT_STATUS_PRIORITY[
    status as keyof typeof PRODUCT_STATUS_PRIORITY
  ] ?? Number.MAX_SAFE_INTEGER;
}

function compareTeamProducts(a: CustomerProduct, b: CustomerProduct) {
  const priorityDiff = getProductPriority(a.status) - getProductPriority(b.status);
  if (priorityDiff !== 0) return priorityDiff;
  return (b.started_at ?? 0) - (a.started_at ?? 0);
}

export function getAutumn() {
  if (autumn) return autumn;

  const secretKey = process.env.AUTUMN_SECRET_KEY;
  if (!secretKey) {
    throw new Error("AUTUMN_SECRET_KEY is not configured");
  }

  autumn = new Autumn({
    secretKey,
    ...(process.env.AUTUMN_URL ? { url: process.env.AUTUMN_URL } : {}),
  }) as AutumnClient;

  return autumn;
}

export function getTeamCustomerId(teamId: Id<"teams">) {
  return teamId;
}

export function isActiveBillingStatus(status: string | null | undefined) {
  return hasActiveBillingStatus(status);
}

export function normalizeAutumnTeamBilling(
  customer: Pick<Customer, "products"> | null | undefined,
  fallbackPlan: string,
): AutumnBillingSnapshot {
  const normalizedFallbackPlan = normalizeTeamPlan(fallbackPlan);
  const product = customer?.products
    ?.filter(isTeamPlanProduct)
    .sort(compareTeamProducts)[0];

  if (!product) {
    return {
      plan: normalizedFallbackPlan,
      billingStatus: "not_subscribed",
      hasActiveSubscription: false,
    };
  }

  const billingCurrentPeriodEnd =
    product.current_period_end ?? product.trial_ends_at;

  return {
    plan: normalizeTeamPlan(product.id),
    billingStatus: product.status,
    billingProductId: product.id,
    ...(typeof billingCurrentPeriodEnd === "number"
      ? { billingCurrentPeriodEnd }
      : {}),
    hasActiveSubscription: isActiveBillingStatus(product.status),
  };
}
