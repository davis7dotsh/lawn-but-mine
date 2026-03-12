import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, query, type ActionCtx } from "./_generated/server";
import { getIdentity, requireTeamAccess } from "./auth";
import {
  getAutumn,
  getTeamCustomerId,
  isActiveBillingStatus,
  normalizeAutumnTeamBilling,
} from "./autumn";
import {
  TEAM_PLAN_MONTHLY_PRICE_USD,
  TEAM_PLAN_STORAGE_LIMIT_BYTES,
  normalizeTeamPlan,
  type TeamPlan,
} from "../src/shared/billingPlans";
import { getTeamStorageUsedBytes } from "./billingHelpers";

const teamPlanValidator = v.union(v.literal("basic"), v.literal("pro"));
const teamRoleValidator = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("member"),
  v.literal("viewer"),
);

type BillingTeam = {
  _id: Id<"teams">;
  name: string;
  plan: string;
  role: "owner" | "admin" | "member" | "viewer";
  billingStatus?: string;
  billingProductId?: string;
};

type RefreshedTeamBilling = {
  plan: TeamPlan;
  subscriptionStatus: string;
  hasActiveSubscription: boolean;
  currentPeriodEnd: number | null;
  billingLastSyncedAt: number;
};

function unwrapAutumnResult<T>(
  result: { data: T | null; error: { message: string } | null },
  fallbackMessage: string,
) {
  if (result.error) {
    throw new Error(result.error.message || fallbackMessage);
  }

  if (result.data === null) {
    throw new Error(fallbackMessage);
  }

  return result.data;
}

function isAutumnNotFoundResult(result: {
  error: { code?: string; message?: string } | null;
  statusCode?: number;
}) {
  if (result.statusCode === 404) return true;
  if (!result.error) return false;

  const code = result.error.code?.toLowerCase() ?? "";
  const message = result.error.message?.toLowerCase() ?? "";

  return code.includes("not_found") || code.includes("notfound") || message.includes("not found");
}

async function fetchTeamForBilling(
  ctx: ActionCtx,
  teamId: Id<"teams">,
): Promise<BillingTeam> {
  const team = await ctx.runQuery(api.teams.get, { teamId });

  if (!team) {
    throw new Error("Team not found");
  }

  return team;
}

async function syncTeamBillingSnapshot(
  ctx: ActionCtx,
  teamId: Id<"teams">,
): Promise<RefreshedTeamBilling> {
  const team = await ctx.runQuery(api.teams.get, { teamId });

  if (!team) {
    throw new Error("Team not found");
  }

  const autumn = getAutumn();
  const customerId = getTeamCustomerId(team._id);
  const customerResult = await autumn.customers.get(customerId);
  const billing = isAutumnNotFoundResult(customerResult)
    ? normalizeAutumnTeamBilling(null, team.plan)
    : normalizeAutumnTeamBilling(
        unwrapAutumnResult(customerResult as never, "Unable to load billing state."),
        team.plan,
      );

  const billingLastSyncedAt = Date.now();

  await ctx.runMutation(internal.billing.applyBillingSnapshot, {
    teamId: team._id,
    plan: billing.plan,
    billingStatus: billing.billingStatus,
    billingProductId: billing.billingProductId,
    billingCurrentPeriodEnd: billing.billingCurrentPeriodEnd,
    billingLastSyncedAt,
  });

  return {
    plan: billing.plan,
    subscriptionStatus: billing.billingStatus,
    hasActiveSubscription: billing.hasActiveSubscription,
    currentPeriodEnd: billing.billingCurrentPeriodEnd ?? null,
    billingLastSyncedAt,
  };
}

export const startCheckout = action({
  args: {
    teamId: v.id("teams"),
    plan: teamPlanValidator,
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  returns: v.object({
    url: v.union(v.string(), v.null()),
    applied: v.boolean(),
  }),
  handler: async (ctx, args): Promise<{ url: string | null; applied: boolean }> => {
    void args.cancelUrl;

    const identity = await getIdentity(ctx);
    const team = await fetchTeamForBilling(ctx, args.teamId);

    if (team.role !== "owner") {
      throw new Error("Only team owners can manage billing.");
    }

    const autumn = getAutumn();
    const customerId = getTeamCustomerId(team._id);
    const customerData = {
      name: team.name,
      ...(typeof identity.email === "string" && identity.email.length > 0
        ? { email: identity.email }
        : {}),
    };

    const checkoutResult = await autumn.checkout({
      customer_id: customerId,
      product_id: args.plan,
      success_url: args.successUrl,
      customer_data: customerData,
    });

    const checkout = unwrapAutumnResult<{ url?: string }>(
      checkoutResult as never,
      "Unable to start checkout.",
    );
    if (checkout.url) {
      return {
        url: checkout.url,
        applied: false,
      };
    }

    const attachResult = await autumn.attach({
      customer_id: customerId,
      product_id: args.plan,
      success_url: args.successUrl,
      customer_data: customerData,
    });
    const attached = unwrapAutumnResult<{ checkout_url?: string }>(
      attachResult as never,
      "Unable to apply billing.",
    );

    if (attached.checkout_url) {
      return {
        url: attached.checkout_url,
        applied: false,
      };
    }

    await syncTeamBillingSnapshot(ctx, team._id);

    return {
      url: null,
      applied: true,
    };
  },
});

export const openBillingPortal = action({
  args: {
    teamId: v.id("teams"),
    returnUrl: v.string(),
  },
  returns: v.object({
    url: v.string(),
  }),
  handler: async (ctx, args): Promise<{ url: string }> => {
    const team = await fetchTeamForBilling(ctx, args.teamId);

    if (team.role !== "owner") {
      throw new Error("Only team owners can manage billing.");
    }

    if (!team.billingProductId && !isActiveBillingStatus(team.billingStatus)) {
      throw new Error("No active billing setup exists for this team yet.");
    }

    const autumn = getAutumn();
    const portalResult = await autumn.customers.billingPortal(
      getTeamCustomerId(team._id),
      { return_url: args.returnUrl },
    );
    const portal = unwrapAutumnResult<{ url: string }>(
      portalResult as never,
      "Unable to open billing portal.",
    );

    return {
      url: portal.url,
    };
  },
});

export const refreshTeamBilling = action({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.object({
    plan: teamPlanValidator,
    subscriptionStatus: v.string(),
    hasActiveSubscription: v.boolean(),
    currentPeriodEnd: v.union(v.number(), v.null()),
    billingLastSyncedAt: v.number(),
  }),
  handler: async (ctx, args): Promise<RefreshedTeamBilling> => {
    await fetchTeamForBilling(ctx, args.teamId);
    return await syncTeamBillingSnapshot(ctx, args.teamId);
  },
});

export const getTeamBilling = query({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.object({
    plan: teamPlanValidator,
    monthlyPriceUsd: v.number(),
    storageLimitBytes: v.number(),
    storageUsedBytes: v.number(),
    hasActiveSubscription: v.boolean(),
    subscriptionStatus: v.union(v.string(), v.null()),
    currentPeriodEnd: v.union(v.number(), v.null()),
    role: teamRoleValidator,
    canManageBilling: v.boolean(),
    billingLastSyncedAt: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const { membership } = await requireTeamAccess(ctx, args.teamId);
    const team = await ctx.db.get(args.teamId);

    if (!team) {
      throw new Error("Team not found");
    }

    const plan = normalizeTeamPlan(team.plan);
    const storageUsedBytes = await getTeamStorageUsedBytes(ctx, args.teamId);
    const subscriptionStatus = team.billingStatus ?? null;

    return {
      plan,
      monthlyPriceUsd: TEAM_PLAN_MONTHLY_PRICE_USD[plan],
      storageLimitBytes: TEAM_PLAN_STORAGE_LIMIT_BYTES[plan],
      storageUsedBytes,
      hasActiveSubscription: isActiveBillingStatus(subscriptionStatus),
      subscriptionStatus,
      currentPeriodEnd: team.billingCurrentPeriodEnd ?? null,
      role: membership.role,
      canManageBilling: membership.role === "owner",
      billingLastSyncedAt: team.billingLastSyncedAt ?? null,
    };
  },
});

export const applyBillingSnapshot = internalMutation({
  args: {
    teamId: v.id("teams"),
    plan: teamPlanValidator,
    billingStatus: v.string(),
    billingProductId: v.optional(v.string()),
    billingCurrentPeriodEnd: v.optional(v.number()),
    billingLastSyncedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.teamId, {
      plan: args.plan,
      billingStatus: args.billingStatus,
      billingProductId: args.billingProductId,
      billingCurrentPeriodEnd: args.billingCurrentPeriodEnd,
      billingLastSyncedAt: args.billingLastSyncedAt,
    });

    return null;
  },
});
