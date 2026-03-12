import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  TEAM_PLAN_STORAGE_LIMIT_BYTES,
  hasActiveBillingStatus,
  normalizeTeamPlan,
} from "../src/shared/billingPlans";

type BillingCtx = QueryCtx | MutationCtx;

export async function getTeamSubscriptionState(
  ctx: BillingCtx,
  teamId: Id<"teams">,
) {
  const team = await ctx.db.get(teamId);
  if (!team) {
    throw new Error("Team not found");
  }

  const plan = normalizeTeamPlan(team.plan);
  const billingStatus = team.billingStatus ?? "not_subscribed";
  const hasActiveSubscription = hasActiveBillingStatus(billingStatus);

  return {
    team,
    plan,
    billingStatus,
    hasActiveSubscription,
    currentPeriodEnd: team.billingCurrentPeriodEnd ?? null,
  };
}

export async function getTeamStorageUsedBytes(
  ctx: BillingCtx,
  teamId: Id<"teams">,
) {
  const projects = await ctx.db
    .query("projects")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();

  const videosByProject = await Promise.all(
    projects.map((project) =>
      ctx.db
        .query("videos")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect(),
    ),
  );

  let total = 0;
  for (const videos of videosByProject) {
    for (const video of videos) {
      if (video.status === "failed") continue;
      if (typeof video.fileSize === "number" && Number.isFinite(video.fileSize)) {
        total += video.fileSize;
      }
    }
  }

  return total;
}

export async function assertTeamHasActiveSubscription(
  ctx: BillingCtx,
  teamId: Id<"teams">,
) {
  const state = await getTeamSubscriptionState(ctx, teamId);
  if (!state.hasActiveSubscription) {
    throw new Error("An active Basic or Pro subscription is required.");
  }
  return state;
}

export async function assertTeamCanStoreBytes(
  ctx: BillingCtx,
  teamId: Id<"teams">,
  incomingBytes: number,
) {
  const state = await assertTeamHasActiveSubscription(ctx, teamId);
  const storageUsedBytes = await getTeamStorageUsedBytes(ctx, teamId);
  const storageLimitBytes = TEAM_PLAN_STORAGE_LIMIT_BYTES[state.plan];
  const requestedBytes = Number.isFinite(incomingBytes) ? Math.max(0, incomingBytes) : 0;

  if (storageUsedBytes + requestedBytes > storageLimitBytes) {
    throw new Error(
      `Storage limit reached for the ${state.plan} plan. Upgrade to continue uploading.`,
    );
  }

  return {
    ...state,
    storageUsedBytes,
    storageLimitBytes,
  };
}
