<script lang="ts">
  import { browser } from "$app/environment"; 
  import { useQuery } from "convex-svelte";
  import { api } from "@convex/_generated/api";
  import type { Id } from "@convex/_generated/dataModel";
  import { cn } from "@/lib/utils";
  import {
    DEFAULT_HEARTBEAT_INTERVAL_MS,
    getOrCreatePresenceClientId,
    getSharedConvexClient,
    projectWatchers,
    sendPresenceDisconnect,
  } from "@/lib/useVideoPresence";

  let {
    videoId,
    enabled = true,
    shareToken,
    className,
  }: {
    videoId?: Id<"videos">;
    enabled?: boolean;
    shareToken?: string;
    className?: string;
  } = $props();

  const convex = getSharedConvexClient();
  const clientId = getOrCreatePresenceClientId();

  let roomToken = $state<string | null>(null);
  let sessionToken = $state<string | null>(null);

  const presenceQuery = useQuery(api.videoPresence.list, () =>
    roomToken ? { roomToken } : "skip",
  );

  const watchers = $derived(projectWatchers(presenceQuery.data));

  function initials(name: string) {
    const cleaned = name.trim();
    if (!cleaned) {
      return "??";
    }

    return cleaned
      .split(/\s+/)
      .slice(0, 2)
      .map((piece) => piece[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2);
  }

  $effect(() => {
    if (!browser || !enabled || !videoId || !clientId) {
      roomToken = null;
      sessionToken = null;
      return;
    }

    let cancelled = false;
    const heartbeatSessionId = crypto.randomUUID();

    const runHeartbeat = async () => {
      try {
        const result = await convex.mutation(api.videoPresence.heartbeat, {
          videoId,
          sessionId: heartbeatSessionId,
          clientId,
          interval: DEFAULT_HEARTBEAT_INTERVAL_MS,
          shareToken,
        });

        if (cancelled) {
          return;
        }

        roomToken = result.roomToken;
        sessionToken = result.sessionToken;
      } catch {
        if (cancelled) {
          return;
        }

        roomToken = null;
        sessionToken = null;
      }
    };

    const handleBeforeUnload = () => {
      if (sessionToken) {
        sendPresenceDisconnect(sessionToken);
      }
    };

    void runHeartbeat();
    const intervalId = window.setInterval(() => {
      void runHeartbeat();
    }, DEFAULT_HEARTBEAT_INTERVAL_MS);

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      const activeSessionToken = sessionToken;
      roomToken = null;
      sessionToken = null;

      if (activeSessionToken) {
        void convex
          .mutation(api.videoPresence.disconnect, { sessionToken: activeSessionToken })
          .catch(() => {});
      }
    };
  });
</script>

{#if watchers.length > 0}
  <div
    class={cn("inline-flex items-center", className)}
    title={watchers.map((watcher) => watcher.displayName).join(", ")}
  >
    <div class="flex -space-x-1.5">
      {#each watchers.slice(0, 5) as watcher (watcher.userId)}
        <div class="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border-2 border-[#f0f0e8] bg-[#e8e8e0] text-[8px] font-bold leading-none text-[#1a1a1a]">
          {#if watcher.avatarUrl}
            <img
              src={watcher.avatarUrl}
              alt={watcher.displayName}
              class="h-full w-full object-cover"
            />
          {:else}
            {initials(watcher.displayName)}
          {/if}
        </div>
      {/each}

      {#if watchers.length > 5}
        <span class="inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#f0f0e8] bg-[#e8e8e0] px-1 text-[8px] font-bold text-[#888]">
          +{watchers.length - 5}
        </span>
      {/if}
    </div>
  </div>
{/if}
