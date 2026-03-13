import { feature, item, plan } from "atmn";
import {
  GIBIBYTE,
  TEAM_PLAN_MONTHLY_PRICE_USD,
  TEAM_PLAN_STORAGE_LIMIT_BYTES,
  TEAM_TRIAL_DAYS,
} from "@lawn/shared/billingPlans";

const PLAN_GROUP = "team_subscription";

export const seats = feature({
  id: "seats",
  name: "team seats",
  type: "metered",
  consumable: false,
});

export const projects = feature({
  id: "projects",
  name: "projects",
  type: "metered",
  consumable: false,
});

export const clients = feature({
  id: "clients",
  name: "clients",
  type: "metered",
  consumable: false,
});

export const storageGb = feature({
  id: "storage_gb",
  name: "GB of storage",
  type: "metered",
  consumable: false,
});

export const basic = plan({
  id: "basic",
  name: "Basic",
  group: PLAN_GROUP,
  description: "Unlimited everything, except storage.",
  price: {
    amount: TEAM_PLAN_MONTHLY_PRICE_USD.basic,
    interval: "month",
  },
  freeTrial: {
    durationLength: TEAM_TRIAL_DAYS,
    durationType: "day",
    cardRequired: true,
  },
  items: [
    item({
      featureId: seats.id,
      unlimited: true,
    }),
    item({
      featureId: projects.id,
      unlimited: true,
    }),
    item({
      featureId: clients.id,
      unlimited: true,
    }),
    item({
      featureId: storageGb.id,
      included: TEAM_PLAN_STORAGE_LIMIT_BYTES.basic / GIBIBYTE,
    }),
  ],
});

export const pro = plan({
  id: "pro",
  name: "Pro",
  group: PLAN_GROUP,
  description: "The same plan with more storage for bigger files.",
  price: {
    amount: TEAM_PLAN_MONTHLY_PRICE_USD.pro,
    interval: "month",
  },
  freeTrial: {
    durationLength: TEAM_TRIAL_DAYS,
    durationType: "day",
    cardRequired: true,
  },
  items: [
    item({
      featureId: seats.id,
      unlimited: true,
    }),
    item({
      featureId: projects.id,
      unlimited: true,
    }),
    item({
      featureId: clients.id,
      unlimited: true,
    }),
    item({
      featureId: storageGb.id,
      included: TEAM_PLAN_STORAGE_LIMIT_BYTES.pro / GIBIBYTE,
    }),
  ],
});
