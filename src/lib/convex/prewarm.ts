
import { convexToJson, type Value } from "convex/values"; 
import { getFunctionName, type FunctionArgs, type FunctionReference } from "convex/server"; 
import type { ConvexClient } from "convex/browser"; 

export const PREWARM_DEBOUNCE_MS = 120; 
export const PREWARM_EXTEND_MS = 8_000; 
export const PREWARM_DEDUPE_MS = 3_000; 

export type RouteQuerySpec<Query extends FunctionReference<"query">> = { 
  query: Query; 
  args: FunctionArgs<Query>; 
  key: string; 
}; 

type WarmSubscription = { 
  unsubscribe: () => void; 
  timeoutId: ReturnType<typeof setTimeout>; 
}; 

const lastPrewarmedAt = new Map<string, number>(); 
const warmSubscriptions = new Map<string, WarmSubscription>(); 

export function buildQueryKey(queryName: string, args: unknown) { 
  return `${queryName}:${JSON.stringify(convexToJson(args as Value))}`; 
} 

export function makeRouteQuerySpec<Query extends FunctionReference<"query">>( 
  query: Query, 
  args: FunctionArgs<Query>, 
): RouteQuerySpec<Query> { 
  return { 
    query, 
    args, 
    key: buildQueryKey(getFunctionName(query), args), 
  }; 
} 

export function prewarmSpecs( 
  convex: ConvexClient, 
  specs: RouteQuerySpec<FunctionReference<"query">>[], 
  options: { 
    dedupeMs?: number; 
    extendSubscriptionFor?: number; 
  } = {}, 
) { 
  const dedupeMs = options.dedupeMs ?? PREWARM_DEDUPE_MS; 
  const extendSubscriptionFor = options.extendSubscriptionFor ?? PREWARM_EXTEND_MS; 
  const now = Date.now(); 

  for (const spec of specs) { 
    const previous = lastPrewarmedAt.get(spec.key); 
    if (previous !== undefined && now - previous < dedupeMs) { 
      extendWarmSubscription(spec.key, extendSubscriptionFor); 
      continue; 
    } 

    lastPrewarmedAt.set(spec.key, now); 

    void convex.query(spec.query, spec.args).catch(() => undefined); 

    try { 
      const activeSubscription = warmSubscriptions.get(spec.key); 
      if (activeSubscription) { 
        activeSubscription.unsubscribe(); 
        clearTimeout(activeSubscription.timeoutId); 
      } 

      const unsubscribe = convex.onUpdate( 
        spec.query, 
        spec.args, 
        () => undefined, 
        () => undefined, 
      ); 

      const timeoutId = setTimeout(() => { 
        const current = warmSubscriptions.get(spec.key); 
        if (!current) return; 
        current.unsubscribe(); 
        warmSubscriptions.delete(spec.key); 
      }, extendSubscriptionFor); 

      warmSubscriptions.set(spec.key, { 
        unsubscribe: () => unsubscribe(), 
        timeoutId, 
      }); 
    } catch { 
      continue; 
    } 
  } 
} 

function extendWarmSubscription(key: string, extendSubscriptionFor: number) { 
  const activeSubscription = warmSubscriptions.get(key); 
  if (!activeSubscription) return; 

  clearTimeout(activeSubscription.timeoutId); 
  activeSubscription.timeoutId = setTimeout(() => { 
    const current = warmSubscriptions.get(key); 
    if (!current) return; 
    current.unsubscribe(); 
    warmSubscriptions.delete(key); 
  }, extendSubscriptionFor); 
} 

export function prewarmIntent( 
  node: HTMLElement, 
  input: { 
    run: () => void | Promise<void>; 
    debounceMs?: number; 
  }, 
) { 
  let run = input.run; 
  let debounceMs = input.debounceMs ?? PREWARM_DEBOUNCE_MS; 
  let timeoutId: ReturnType<typeof setTimeout> | null = null; 

  const cancel = () => { 
    if (timeoutId === null) return; 
    clearTimeout(timeoutId); 
    timeoutId = null; 
  }; 

  const schedule = () => { 
    if (timeoutId !== null) return; 
    timeoutId = setTimeout(() => { 
      timeoutId = null; 
      void Promise.resolve(run()).catch(() => undefined); 
    }, debounceMs); 
  }; 

  node.addEventListener("mouseenter", schedule); 
  node.addEventListener("focus", schedule); 
  node.addEventListener("touchstart", schedule, { passive: true }); 
  node.addEventListener("mouseleave", cancel); 
  node.addEventListener("blur", cancel); 

  return { 
    update(nextInput: { run: () => void | Promise<void>; debounceMs?: number }) { 
      run = nextInput.run; 
      debounceMs = nextInput.debounceMs ?? PREWARM_DEBOUNCE_MS; 
    }, 
    destroy() { 
      cancel(); 
      node.removeEventListener("mouseenter", schedule); 
      node.removeEventListener("focus", schedule); 
      node.removeEventListener("touchstart", schedule); 
      node.removeEventListener("mouseleave", cancel); 
      node.removeEventListener("blur", cancel); 
    }, 
  }; 
} 
