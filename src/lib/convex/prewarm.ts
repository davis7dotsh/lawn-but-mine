// pragma: allowlist secret
import { convexToJson, type Value } from "convex/values"; // pragma: allowlist secret
import { getFunctionName, type FunctionArgs, type FunctionReference } from "convex/server"; // pragma: allowlist secret
import type { ConvexClient } from "convex/browser"; // pragma: allowlist secret

export const PREWARM_DEBOUNCE_MS = 120; // pragma: allowlist secret
export const PREWARM_EXTEND_MS = 8_000; // pragma: allowlist secret
export const PREWARM_DEDUPE_MS = 3_000; // pragma: allowlist secret

export type RouteQuerySpec<Query extends FunctionReference<"query">> = { // pragma: allowlist secret
  query: Query; // pragma: allowlist secret
  args: FunctionArgs<Query>; // pragma: allowlist secret
  key: string; // pragma: allowlist secret
}; // pragma: allowlist secret

type WarmSubscription = { // pragma: allowlist secret
  unsubscribe: () => void; // pragma: allowlist secret
  timeoutId: ReturnType<typeof setTimeout>; // pragma: allowlist secret
}; // pragma: allowlist secret

const lastPrewarmedAt = new Map<string, number>(); // pragma: allowlist secret
const warmSubscriptions = new Map<string, WarmSubscription>(); // pragma: allowlist secret

export function buildQueryKey(queryName: string, args: unknown) { // pragma: allowlist secret
  return `${queryName}:${JSON.stringify(convexToJson(args as Value))}`; // pragma: allowlist secret
} // pragma: allowlist secret

export function makeRouteQuerySpec<Query extends FunctionReference<"query">>( // pragma: allowlist secret
  query: Query, // pragma: allowlist secret
  args: FunctionArgs<Query>, // pragma: allowlist secret
): RouteQuerySpec<Query> { // pragma: allowlist secret
  return { // pragma: allowlist secret
    query, // pragma: allowlist secret
    args, // pragma: allowlist secret
    key: buildQueryKey(getFunctionName(query), args), // pragma: allowlist secret
  }; // pragma: allowlist secret
} // pragma: allowlist secret

export function prewarmSpecs( // pragma: allowlist secret
  convex: ConvexClient, // pragma: allowlist secret
  specs: RouteQuerySpec<FunctionReference<"query">>[], // pragma: allowlist secret
  options: { // pragma: allowlist secret
    dedupeMs?: number; // pragma: allowlist secret
    extendSubscriptionFor?: number; // pragma: allowlist secret
  } = {}, // pragma: allowlist secret
) { // pragma: allowlist secret
  const dedupeMs = options.dedupeMs ?? PREWARM_DEDUPE_MS; // pragma: allowlist secret
  const extendSubscriptionFor = options.extendSubscriptionFor ?? PREWARM_EXTEND_MS; // pragma: allowlist secret
  const now = Date.now(); // pragma: allowlist secret

  for (const spec of specs) { // pragma: allowlist secret
    const previous = lastPrewarmedAt.get(spec.key); // pragma: allowlist secret
    if (previous !== undefined && now - previous < dedupeMs) { // pragma: allowlist secret
      extendWarmSubscription(spec.key, extendSubscriptionFor); // pragma: allowlist secret
      continue; // pragma: allowlist secret
    } // pragma: allowlist secret

    lastPrewarmedAt.set(spec.key, now); // pragma: allowlist secret

    void convex.query(spec.query, spec.args).catch(() => undefined); // pragma: allowlist secret

    try { // pragma: allowlist secret
      const activeSubscription = warmSubscriptions.get(spec.key); // pragma: allowlist secret
      if (activeSubscription) { // pragma: allowlist secret
        activeSubscription.unsubscribe(); // pragma: allowlist secret
        clearTimeout(activeSubscription.timeoutId); // pragma: allowlist secret
      } // pragma: allowlist secret

      const unsubscribe = convex.onUpdate( // pragma: allowlist secret
        spec.query, // pragma: allowlist secret
        spec.args, // pragma: allowlist secret
        () => undefined, // pragma: allowlist secret
        () => undefined, // pragma: allowlist secret
      ); // pragma: allowlist secret

      const timeoutId = setTimeout(() => { // pragma: allowlist secret
        const current = warmSubscriptions.get(spec.key); // pragma: allowlist secret
        if (!current) return; // pragma: allowlist secret
        current.unsubscribe(); // pragma: allowlist secret
        warmSubscriptions.delete(spec.key); // pragma: allowlist secret
      }, extendSubscriptionFor); // pragma: allowlist secret

      warmSubscriptions.set(spec.key, { // pragma: allowlist secret
        unsubscribe: () => unsubscribe(), // pragma: allowlist secret
        timeoutId, // pragma: allowlist secret
      }); // pragma: allowlist secret
    } catch { // pragma: allowlist secret
      continue; // pragma: allowlist secret
    } // pragma: allowlist secret
  } // pragma: allowlist secret
} // pragma: allowlist secret

function extendWarmSubscription(key: string, extendSubscriptionFor: number) { // pragma: allowlist secret
  const activeSubscription = warmSubscriptions.get(key); // pragma: allowlist secret
  if (!activeSubscription) return; // pragma: allowlist secret

  clearTimeout(activeSubscription.timeoutId); // pragma: allowlist secret
  activeSubscription.timeoutId = setTimeout(() => { // pragma: allowlist secret
    const current = warmSubscriptions.get(key); // pragma: allowlist secret
    if (!current) return; // pragma: allowlist secret
    current.unsubscribe(); // pragma: allowlist secret
    warmSubscriptions.delete(key); // pragma: allowlist secret
  }, extendSubscriptionFor); // pragma: allowlist secret
} // pragma: allowlist secret

export function prewarmIntent( // pragma: allowlist secret
  node: HTMLElement, // pragma: allowlist secret
  input: { // pragma: allowlist secret
    run: () => void | Promise<void>; // pragma: allowlist secret
    debounceMs?: number; // pragma: allowlist secret
  }, // pragma: allowlist secret
) { // pragma: allowlist secret
  let run = input.run; // pragma: allowlist secret
  let debounceMs = input.debounceMs ?? PREWARM_DEBOUNCE_MS; // pragma: allowlist secret
  let timeoutId: ReturnType<typeof setTimeout> | null = null; // pragma: allowlist secret

  const cancel = () => { // pragma: allowlist secret
    if (timeoutId === null) return; // pragma: allowlist secret
    clearTimeout(timeoutId); // pragma: allowlist secret
    timeoutId = null; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const schedule = () => { // pragma: allowlist secret
    if (timeoutId !== null) return; // pragma: allowlist secret
    timeoutId = setTimeout(() => { // pragma: allowlist secret
      timeoutId = null; // pragma: allowlist secret
      void Promise.resolve(run()).catch(() => undefined); // pragma: allowlist secret
    }, debounceMs); // pragma: allowlist secret
  }; // pragma: allowlist secret

  node.addEventListener("mouseenter", schedule); // pragma: allowlist secret
  node.addEventListener("focus", schedule); // pragma: allowlist secret
  node.addEventListener("touchstart", schedule, { passive: true }); // pragma: allowlist secret
  node.addEventListener("mouseleave", cancel); // pragma: allowlist secret
  node.addEventListener("blur", cancel); // pragma: allowlist secret

  return { // pragma: allowlist secret
    update(nextInput: { run: () => void | Promise<void>; debounceMs?: number }) { // pragma: allowlist secret
      run = nextInput.run; // pragma: allowlist secret
      debounceMs = nextInput.debounceMs ?? PREWARM_DEBOUNCE_MS; // pragma: allowlist secret
    }, // pragma: allowlist secret
    destroy() { // pragma: allowlist secret
      cancel(); // pragma: allowlist secret
      node.removeEventListener("mouseenter", schedule); // pragma: allowlist secret
      node.removeEventListener("focus", schedule); // pragma: allowlist secret
      node.removeEventListener("touchstart", schedule); // pragma: allowlist secret
      node.removeEventListener("mouseleave", cancel); // pragma: allowlist secret
      node.removeEventListener("blur", cancel); // pragma: allowlist secret
    }, // pragma: allowlist secret
  }; // pragma: allowlist secret
} // pragma: allowlist secret
