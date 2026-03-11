import { feature, item, plan } from "atmn";

const PLAN_GROUP = "team_subscription";
const TRIAL_DAYS = 7;

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
    amount: 5,
    interval: "month",
  },
  freeTrial: {
    durationLength: TRIAL_DAYS,
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
      included: 100,
    }),
  ],
});

export const pro = plan({
  id: "pro",
  name: "Pro",
  group: PLAN_GROUP,
  description: "The same plan with more storage for bigger files.",
  price: {
    amount: 25,
    interval: "month",
  },
  freeTrial: {
    durationLength: TRIAL_DAYS,
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
      included: 1024,
    }),
  ],
});
