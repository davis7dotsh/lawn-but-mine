import { shouldRefreshBilling } from "./billingPlans";

const inFlightBillingRefreshes = new Map<string, Promise<void>>();

type RefreshTeamBillingIfNeededArgs = {
  teamId: string;
  billingLastSyncedAt: number | null | undefined;
  search: string;
  refresh: () => Promise<unknown>;
  onForceRefreshHandled?: () => void;
  now?: number;
};

function getBillingParam(search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const billing = params.get("billing");
  return billing === "success" || billing === "cancel" ? billing : null;
}

export function withoutBillingSearchParam(search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  params.delete("billing");
  const nextSearch = params.toString();
  return nextSearch.length > 0 ? `?${nextSearch}` : "";
}

export async function refreshTeamBillingIfNeeded({
  teamId,
  billingLastSyncedAt,
  search,
  refresh,
  onForceRefreshHandled,
  now,
}: RefreshTeamBillingIfNeededArgs) {
  const billingParam = getBillingParam(search);
  const forceRefresh = billingParam !== null;

  if (!shouldRefreshBilling(billingLastSyncedAt, forceRefresh, now)) {
    return false;
  }

  const existingRefresh = inFlightBillingRefreshes.get(teamId);
  if (existingRefresh) {
    await existingRefresh;
    return false;
  }

  const refreshRequest = Promise.resolve(refresh())
    .then(() => {
      if (forceRefresh) {
        onForceRefreshHandled?.();
      }
    })
    .finally(() => {
      inFlightBillingRefreshes.delete(teamId);
    });

  inFlightBillingRefreshes.set(teamId, refreshRequest);
  await refreshRequest;
  return true;
}
